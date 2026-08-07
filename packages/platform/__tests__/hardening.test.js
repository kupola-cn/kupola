// SPDX-License-Identifier: MIT
/** Regression tests for production-critical core behavior. */

import {
  batch,
  computed,
  createScheduler,
  effect,
  effectScope,
  isReactive,
  nextTick,
  onScopeDispose,
  reactive,
  runWithScheduler,
  signal,
  setErrorHandler,
  toRaw,
  watch,
} from '../../core/src/index.js';
import { flushJobs, queueJob, resetScheduler } from '../../core/src/scheduler.js';
import {
  enableProfiler,
  getProfileReport,
  resetProfiler,
} from '../../core/src/devtools.js';

afterEach(() => {
  resetScheduler();
  resetProfiler();
});

describe('scheduler hardening', () => {
  test('rejects invalid scheduler options', () => {
    expect(() => createScheduler(null)).toThrow(TypeError);
    expect(() => createScheduler([])).toThrow(TypeError);
    expect(() => watch(() => 1, () => {}, null)).toThrow(TypeError);
  });

  test('inherits an app scheduler for effects created in setup', () => {
    const scheduler = createScheduler({ name: 'inherited' });
    const source = signal(0);
    const runs = [];
    let stop;

    runWithScheduler(scheduler, () => {
      stop = effect(() => runs.push(source.value));
    });

    source.value = 1;
    flushJobs();
    expect(runs).toEqual([ 0 ]);
    scheduler.flushJobs();
    expect(runs).toEqual([ 0, 1 ]);
    stop();
  });

  test('inherits an app scheduler for watches created in setup', () => {
    const scheduler = createScheduler({ name: 'watch-inherited' });
    const source = signal(0);
    const changes = [];
    let stop;

    runWithScheduler(scheduler, () => {
      stop = watch(() => source.value, value => changes.push(value));
    });

    source.value = 1;
    flushJobs();
    expect(changes).toEqual([]);
    scheduler.flushJobs();
    expect(changes).toEqual([ 1 ]);
    stop();
  });

  test('flushes isolated schedulers at the end of a batch', () => {
    const scheduler = createScheduler({ name: 'batched-isolated' });
    const source = signal(0);
    const runs = [];
    const stop = effect(() => runs.push(source.value), { scheduler });

    batch(() => {
      source.value = 1;
    });

    expect(runs).toEqual([ 0, 1 ]);
    stop();
  });

  test('supports isolated scheduler instances', () => {
    const scheduler = createScheduler({ name: 'isolated' });
    const source = signal(0);
    const runs = [];
    const stop = effect(() => runs.push(source.value), { scheduler });

    source.value = 1;
    flushJobs();
    expect(runs).toEqual([ 0 ]);
    scheduler.flushJobs();
    stop();

    expect(runs).toEqual([ 0, 1 ]);
  });

  test('does not run disposed effects left in an isolated scheduler queue', () => {
    const scheduler = createScheduler({ name: 'disposed-queue' });
    const source = signal(0);
    const runs = [];
    const stop = effect(() => runs.push(source.value), { scheduler });

    source.value = 1;
    stop();
    scheduler.flushJobs();

    expect(runs).toEqual([ 0 ]);
    expect(source._subscribers.size).toBe(0);
  });

  test('reset discards jobs already queued for a scheduler', async () => {
    const scheduler = createScheduler({ name: 'reset-queue' });
    const runs = [];

    scheduler.queueJob(() => runs.push('stale'));
    scheduler.reset();
    await scheduler.nextTick();

    expect(runs).toEqual([]);
  });

  test('keeps isolated scheduler errors out of the global handler', () => {
    const isolatedErrors = [];
    const globalErrors = [];
    const restore = setErrorHandler(error => globalErrors.push(error));
    const scheduler = createScheduler({
      name: 'isolated-errors',
      onError: (error, context) => isolatedErrors.push({ error, context }),
    });
    const failure = new Error('isolated failure');

    scheduler.queueJob(() => {throw failure;});
    expect(() => scheduler.flushJobs()).not.toThrow();
    restore();

    expect(globalErrors).toEqual([]);
    expect(isolatedErrors).toEqual([ {
      error: failure,
      context: { source: 'scheduler', phase: 'flush', scheduler: 'isolated-errors' },
    } ]);
  });

  test('supports sync and post watch phases while preserving pre ordering', () => {
    const source = signal(0);
    const order = [];
    const stopPre = watch(() => source.value, value => order.push(`pre:${value}`));
    const stopPost = watch(() => source.value, value => order.push(`post:${value}`), { flush: 'post' });
    const stopSync = watch(() => source.value, value => order.push(`sync:${value}`), { flush: 'sync' });

    source.value = 1;
    expect(order).toEqual([ 'sync:1' ]);
    flushJobs();
    stopPre();
    stopPost();
    stopSync();

    expect(order).toEqual([ 'sync:1', 'pre:1', 'post:1' ]);
  });

  test('continues after a job throws and drains jobs queued during the flush', () => {
    const order = [];
    const failure = new Error('job failed');

    queueJob(() => {
      order.push('first');
      queueJob(() => order.push('queued-during-flush'));
      throw failure;
    });
    queueJob(() => order.push('second'));

    expect(() => flushJobs()).toThrow(failure);
    expect(order).toEqual([ 'first', 'second', 'queued-during-flush' ]);
  });

  test('nextTick returns a promise and flushes before the callback', async () => {
    const value = signal(0);
    const runs = [];
    effect(() => {runs.push(value.value);});

    value.value = 1;
    await nextTick(() => {runs.push('callback');});

    expect(runs).toEqual([ 0, 1, 'callback' ]);
  });

  test('stops a runaway self-queuing job at the flush limit', () => {
    const errors = [];
    const restore = setErrorHandler((error, context) => errors.push({ error, context }));
    let runs = 0;
    const job = () => {
      runs++;
      queueJob(job);
    };

    queueJob(job);
    expect(() => flushJobs()).not.toThrow();
    restore();

    expect(runs).toBe(10000);
    expect(errors[0].error.code).toBe('KUPOLA_SCHEDULER_LOOP');
    expect(errors[0].context).toEqual({ source: 'scheduler', phase: 'flush' });
  });

  test('routes scheduled job failures through the global error handler', () => {
    const errors = [];
    const restore = setErrorHandler((error, context) => errors.push({ error, context }));
    const failure = new Error('scheduled failure');

    queueJob(() => {throw failure;});
    queueJob(() => {});
    expect(() => flushJobs()).not.toThrow();
    restore();

    expect(errors).toHaveLength(1);
    expect(errors[0]).toEqual({
      error: failure,
      context: { source: 'scheduler', phase: 'flush' },
    });
  });

  test('limits synchronous reactive feedback loops', () => {
    const source = signal(false);
    const left = signal(0);
    const right = signal(0);
    const errors = [];
    const restore = setErrorHandler(error => errors.push(error));
    const stopLeft = effect(() => {
      if (source.value) {left.value = right.value + 1;}
    }, { flush: 'sync' });
    const stopRight = effect(() => {
      if (source.value) {right.value = left.value + 1;}
    }, { flush: 'sync' });

    source.value = true;
    stopLeft();
    stopRight();
    restore();

    expect(errors).toHaveLength(1);
    expect(errors[0].code).toBe('KUPOLA_REACTIVITY_LOOP');
  });
});

describe('effect and watch lifecycle', () => {
  test('prevents synchronous effect self-recursion from overflowing the stack', () => {
    const source = signal(0);
    const runs = [];
    const stop = effect(() => {
      runs.push(source.value);
      if (source.value < 1) {source.value = 1;}
    }, { flush: 'sync' });

    expect(runs).toEqual([ 0 ]);
    expect(source.value).toBe(1);
    stop();
  });

  test('does not attach new resources after a scope stops itself', () => {
    const source = signal(0);
    const scope = effectScope();
    const runs = [];
    let stop;

    scope.run(() => {
      scope.stop();
      expect(() => onScopeDispose(() => {})).toThrow('inside effectScope.run');
      stop = effect(() => runs.push(source.value));
    });

    source.value = 1;
    flushJobs();
    expect(runs).toEqual([ 0, 1 ]);
    expect(scope._effects.size).toBe(0);
    stop();
  });

  test('scope disposes computed dependencies and generic cleanups', () => {
    const source = signal(1);
    const scope = effectScope();
    const cleanup = jest.fn();
    let derived;

    scope.run(() => {
      derived = computed(() => source.value + 1);
      derived.value;
      onScopeDispose(cleanup);
    });

    expect(source._subscribers.size).toBe(1);
    scope.stop();

    expect(source._subscribers.size).toBe(0);
    expect(cleanup).toHaveBeenCalledTimes(1);
    derived.value;
  });

  test('runs effect cleanup before rerun and on dispose', () => {
    const source = signal(0);
    const order = [];
    const stop = effect(() => {
      const value = source.value;
      order.push(`run:${value}`);
      return () => order.push(`cleanup:${value}`);
    });

    source.value = 1;
    flushJobs();
    stop();

    expect(order).toEqual([ 'run:0', 'cleanup:0', 'run:1', 'cleanup:1' ]);
  });

  test('disposes scoped child effects when a parent reruns or is disposed', () => {
    const toggle = signal(false);
    const childSource = signal(0);
    const childRuns = [];
    const parentStops = [];

    const stopParent = effect(() => {
      toggle.value;
      const childScope = effectScope();
      childScope.run(() => effect(() => {
        childRuns.push(childSource.value);
        return () => parentStops.push('child-cleanup');
      }));
      return () => {
        childScope.stop();
      };
    });

    toggle.value = true;
    flushJobs();
    childSource.value = 1;
    flushJobs();
    stopParent();
    childSource.value = 2;
    flushJobs();

    expect(childRuns).toEqual([ 0, 0, 1 ]);
    expect(parentStops).toEqual([ 'child-cleanup', 'child-cleanup', 'child-cleanup' ]);
  });

  test('scope stop runs cleanup owned by a scoped watch', () => {
    const source = signal(0);
    const order = [];
    const scope = effectScope();

    scope.run(() => {
      watch(() => source.value, value => {
        order.push(`run:${value}`);
        return () => order.push(`cleanup:${value}`);
      }, { immediate: true });
    });

    scope.stop();
    expect(order).toEqual([ 'run:0', 'cleanup:0' ]);
  });

  test('watch retains cleanup until the next change and disposal', () => {
    const source = signal('A');
    const order = [];
    const stop = watch(
      () => source.value,
      (value, previous) => {
        order.push(`run:${previous || '-'}>${value}`);
        return () => order.push(`cleanup:${value}`);
      },
      { immediate: true },
    );

    source.value = 'B';
    flushJobs();
    stop();

    expect(order).toEqual([ 'run:->A', 'cleanup:A', 'run:A>B', 'cleanup:B' ]);
  });

  test('watch supports guarded onCleanup registration for async work', () => {
    const source = signal('A');
    const order = [];
    const stop = watch(
      () => source.value,
      (value, previous, onCleanup) => {
        order.push(`run:${previous || '-'}>${value}`);
        onCleanup(() => order.push(`cleanup:${value}`));
      },
      { immediate: true },
    );

    source.value = 'B';
    flushJobs();
    stop();

    expect(order).toEqual([ 'run:->A', 'cleanup:A', 'run:A>B', 'cleanup:B' ]);
  });

  test('watch cleanup is not run when an unrelated getter dependency changes', () => {
    const source = signal('A');
    const unrelated = signal(0);
    const order = [];
    const stop = watch(
      () => {
        unrelated.value;
        return source.value;
      },
      value => {
        order.push(`run:${value}`);
        return () => order.push(`cleanup:${value}`);
      },
      { immediate: true },
    );

    unrelated.value = 1;
    flushJobs();
    expect(order).toEqual([ 'run:A' ]);

    source.value = 'B';
    flushJobs();
    stop();
    expect(order).toEqual([ 'run:A', 'cleanup:A', 'run:B', 'cleanup:B' ]);
  });

  test('deep watch tracks nested reactive properties', () => {
    const state = reactive({ nested: { value: 1 } });
    const values = [];
    const stop = watch(
      () => state,
      value => values.push(value.nested.value),
      { deep: true },
    );

    state.nested.value = 2;
    flushJobs();
    stop();

    expect(values).toEqual([ 2 ]);
  });

  test('deep watch detects enumerable symbol properties', () => {
    const key = Symbol('key');
    const state = reactive({ [key]: 1 });
    const values = [];
    const stop = watch(
      () => state,
      value => values.push(value[key]),
      { deep: true },
    );

    state[key] = 2;
    flushJobs();
    stop();
    state.dispose();

    expect(values).toEqual([ 2 ]);
  });

  test('deep watch detects custom array keys and preserves sparse arrays', () => {
    const customKey = Symbol('custom');
    const state = reactive({ items: [] });
    const changes = [];
    const stop = watch(
      () => state.items,
      value => changes.push([ value.length, value[customKey] ]),
      { deep: true },
    );

    state.items[customKey] = 'first';
    flushJobs();
    state.items.length = 2;
    flushJobs();
    state.items[customKey] = 'second';
    flushJobs();
    stop();
    state.dispose();

    expect(changes).toEqual([
      [ 0, 'first' ],
      [ 2, 'first' ],
      [ 2, 'second' ],
    ]);
  });
});

describe('computed hardening', () => {
  test('drains synchronous effects triggered by another synchronous effect', () => {
    const source = signal(0);
    const derivedSource = signal(0);
    const values = [];
    const stopProducer = effect(() => {
      if (source.value > 0) {derivedSource.value = source.value * 10;}
    }, { flush: 'sync' });
    const stopConsumer = effect(() => {
      values.push(derivedSource.value);
    }, { flush: 'sync' });

    source.value = 2;
    stopProducer();
    stopConsumer();

    expect(values).toEqual([ 0, 20 ]);
  });

  test('invalidates computed values before direct sync subscribers', () => {
    const source = signal(1);
    const derived = computed(() => source.value * 2);
    const values = [];
    const stop = effect(() => {
      values.push([ source.value, derived.value ]);
    }, { flush: 'sync' });

    source.value = 2;
    stop();
    derived.dispose();

    expect(values).toEqual([ [ 1, 2 ], [ 2, 4 ] ]);
  });

  test('settles converging computed graphs before running effects', () => {
    const source = signal(1);
    const left = computed(() => source.value);
    const right = computed(() => source.value * 10);
    const total = computed(() => left.value + right.value);
    const values = [];
    const stop = effect(() => {values.push(total.value);}, { flush: 'sync' });

    source.value = 2;
    stop();
    left.dispose();
    right.dispose();
    total.dispose();

    expect(values).toEqual([ 11, 22 ]);
  });

  test('does not run a sync diamond dependency twice', () => {
    const source = signal(1);
    const derived = computed(() => source.value * 2);
    let runs = 0;
    const stop = effect(() => {
      runs++;
      source.value;
      derived.value;
    }, { flush: 'sync' });

    source.value = 2;
    stop();
    derived.dispose();

    expect(runs).toBe(2);
  });

  test('reports circular computed dependencies without overflowing the stack', () => {
    let derived;
    derived = computed(() => derived.value + 1);

    expect(() => derived.value).toThrow('Circular computed dependency');
    derived.dispose();
  });

  test('does not rerun downstream effects when the derived value is unchanged', () => {
    const source = signal(1);
    const parity = computed(() => source.value % 2);
    const runs = [];
    const stop = effect(() => {runs.push(parity.value);});

    source.value = 3;
    flushJobs();
    source.value = 4;
    flushJobs();
    stop();

    expect(runs).toEqual([ 1, 0 ]);
  });

  test('retries a failed computed when its source changes again', () => {
    const source = signal(1);
    const derived = computed(() => {
      if (source.value === 2) {throw new Error('temporary failure');}
      return source.value;
    });
    const errors = [];
    const restore = setErrorHandler(error => errors.push(error.message));
    const values = [];
    const stop = effect(() => {values.push(derived.value);});

    source.value = 2;
    source.value = 3;
    flushJobs();
    stop();
    derived.dispose();
    restore();

    expect(values).toEqual([ 1, 3 ]);
    expect(errors).toEqual([ 'temporary failure' ]);
  });

  test('dispose detaches a computed from all dependencies', () => {
    const source = signal(1);
    const derived = computed(() => source.value + 1);

    expect(derived.value).toBe(2);
    expect(source._subscribers.size).toBe(1);
    derived.dispose();

    expect(source._subscribers.size).toBe(0);
    expect(derived.value).toBe(2);
  });

  test('reclaims subscriptions across repeated scope lifetimes', () => {
    const source = signal(0);
    const scheduler = createScheduler({ name: 'lifecycle-stress' });
    let cleanupRuns = 0;

    for (let index = 0; index < 200; index++) {
      const scope = effectScope();
      scope.run(() => {
        const derived = computed(() => source.value + 1);
        watch(() => source.value, () => {}, { scheduler });
        effect(() => {
          derived.value;
        }, { scheduler });
        onScopeDispose(() => {cleanupRuns++;});
      });

      source.value = index + 1;
      scope.stop();
    }

    scheduler.flushJobs();

    expect(cleanupRuns).toBe(200);
    expect(source._subscribers.size).toBe(0);
  });
});

describe('reactive hardening', () => {
  test('coalesces sync effects across one array mutation', () => {
    const state = reactive({ items: [ 'a' ] });
    const values = [];
    const stop = effect(() => {
      values.push([ state.items[1], state.items.length ]);
    }, { flush: 'sync' });

    state.items.push('b');
    stop();
    state.dispose();

    expect(values).toEqual([ [ undefined, 1 ], [ 'b', 2 ] ]);
  });

  test('coalesces sync effects across multi-step array mutators', () => {
    const state = reactive({ items: [ 3, 1, 2 ] });
    const values = [];
    const stop = effect(() => {values.push(state.items.join(','));}, { flush: 'sync' });

    state.items.sort();
    stop();
    state.dispose();

    expect(values).toEqual([ '3,1,2', '1,2,3' ]);
  });

  test('preserves frozen nested property identity to satisfy Proxy invariants', () => {
    const nested = { value: 1 };
    const state = reactive(Object.freeze({ nested }));

    expect(() => state.nested).not.toThrow();
    expect(state.nested).toBe(nested);
    state.dispose();
  });

  test('reuses one proxy for the same raw object across reactive() calls', () => {
    const raw = { value: 0 };
    const first = reactive(raw);
    const second = reactive(raw);
    const values = [];
    const stop = effect(() => {values.push(first.value);});

    expect(first).toBe(second);
    expect(toRaw(first)).toBe(raw);
    second.value = 1;
    flushJobs();
    stop();
    first.dispose();

    expect(values).toEqual([ 0, 1 ]);
  });

  test('does not reuse a disposed proxy for a new reactive owner', () => {
    const raw = { value: 1 };
    const disposed = reactive(raw);
    disposed.dispose();
    const fresh = reactive(raw);

    expect(fresh).not.toBe(disposed);
    expect(isReactive(fresh)).toBe(true);
    fresh.dispose();
  });

  test('retains raw identity for a disposed proxy', () => {
    const raw = { value: 1 };
    const state = reactive(raw);
    state.dispose();

    expect(toRaw(state)).toBe(raw);
  });

  test('preserves own reserved properties under Proxy invariants', () => {
    for (const key of [ '_signal', 'dispose', 'toJSON' ]) {
      const raw = {};
      Object.defineProperty(raw, key, {
        value: 'own-value',
        configurable: false,
        writable: false,
      });
      const state = reactive(raw);

      expect(state[key]).toBe('own-value');
      expect(Reflect.set(state, key, 'changed')).toBe(false);
      expect(state[key]).toBe('own-value');
    }
  });

  test('does not overflow the stack when deep-comparing cyclic maps', () => {
    const first = new Map();
    first.set('self', first);
    const source = signal(first);
    const changes = [];
    const stop = watch(() => source.value, value => changes.push(value), { deep: true });
    const second = new Map();
    second.set('self', second);

    source.value = second;
    expect(() => flushJobs()).not.toThrow();
    stop();

    expect(changes).toEqual([]);
  });

  test('deep-compares map object keys and cyclic sets structurally', () => {
    const key = { id: 1 };
    const first = new Map([ [ key, { value: 1 } ] ]);
    const source = signal(first);
    const changes = [];
    const stop = watch(() => source.value, value => changes.push(value), { deep: true });
    const second = new Map([ [ { id: 1 }, { value: 1 } ] ]);
    source.value = second;
    flushJobs();

    const firstSet = new Set();
    firstSet.add(firstSet);
    const secondSet = new Set();
    secondSet.add(secondSet);
    source.value = firstSet;
    flushJobs();
    source.value = secondSet;
    flushJobs();
    stop();

    expect(changes).toHaveLength(1);
  });

  test('tracks object properties independently', () => {
    const state = reactive({ first: 1, second: 2 });
    const firstRuns = [];
    const secondRuns = [];
    const stopFirst = effect(() => {firstRuns.push(state.first);});
    const stopSecond = effect(() => {secondRuns.push(state.second);});

    state.second = 3;
    flushJobs();

    expect(firstRuns).toEqual([ 1 ]);
    expect(secondRuns).toEqual([ 2, 3 ]);
    stopFirst();
    stopSecond();
    state.dispose();
  });

  test('tracks adding undefined properties and array entries', () => {
    const state = reactive({ values: [] });
    const snapshots = [];
    const stop = effect(() => {
      snapshots.push(`${Object.keys(state).join(',')}:${state.values.length}`);
    });

    state.added = undefined;
    state.values[2] = undefined;
    flushJobs();
    stop();
    state.dispose();

    expect(snapshots).toEqual([ 'values:0', 'values,added:3' ]);
  });

  test('reuses one proxy for a shared nested raw object', () => {
    const child = { value: 0 };
    const first = reactive({ child });
    const second = reactive({ child });

    expect(first.child).toBe(second.child);
    first.dispose();
    second.dispose();
  });

  test('keeps shared nested proxies alive until every root is disposed', () => {
    const child = { value: 0 };
    const first = reactive({ child });
    const second = reactive({ child });
    const values = [];
    const stop = effect(() => {values.push(second.child.value);});

    first.dispose();
    second.child.value = 1;
    flushJobs();
    stop();
    second.dispose();

    expect(values).toEqual([ 0, 1 ]);
  });

  test('releases replaced nested metas from a root while preserving held proxies', () => {
    const state = reactive({ child: { value: 1 } });
    const previous = state.child;
    const values = [];
    const stop = effect(() => {values.push(state.child.value);});

    state.child = { value: 2 };
    flushJobs();
    previous.value = 10;
    flushJobs();
    state.child.value = 3;
    flushJobs();

    stop();
    state.dispose();

    expect(values).toEqual([ 1, 2, 3 ]);
    expect(previous.value).toBe(10);
  });

  test('reclaims one root edge without disposing a shared nested proxy', () => {
    const child = { value: 0 };
    const first = reactive({ child });
    const second = reactive({ child });
    const values = [];
    const stop = effect(() => {values.push(second.child.value);});

    first.child = { value: 1 };
    flushJobs();
    second.child.value = 2;
    flushJobs();

    stop();
    first.dispose();
    second.dispose();

    expect(values).toEqual([ 0, 2 ]);
  });

  test('propagates owners through a parent shared by multiple roots', () => {
    const shared = { child: { value: 0 } };
    const first = reactive({ shared });
    const second = reactive({ shared });
    const values = [];
    const stop = effect(() => {values.push(second.shared.child.value);});

    expect(first.shared).toBe(second.shared);
    first.dispose();
    second.shared.child.value = 1;
    flushJobs();

    stop();
    second.dispose();

    expect(values).toEqual([ 0, 1 ]);
  });

  test('tracks object iteration independently from existing values', () => {
    const state = reactive({ first: 1 });
    const keys = [];
    const stop = effect(() => {keys.push(Object.keys(state).join(','));});

    state.first = 2;
    flushJobs();
    expect(keys).toEqual([ 'first' ]);

    state.second = 2;
    flushJobs();
    stop();
    expect(keys).toEqual([ 'first', 'first,second' ]);
    state.dispose();
  });

  test('invalidates array iteration when length truncates entries', () => {
    const state = reactive({ items: [ 'a', 'b' ] });
    const keys = [];
    const stop = effect(() => {keys.push(Object.keys(state.items).join(','));});

    state.items.length = 0;
    flushJobs();
    stop();
    state.dispose();

    expect(keys).toEqual([ '0,1', '' ]);
  });

  test('does not duplicate sync length notifications on direct truncation', () => {
    const state = reactive({ items: [ 1, 2 ] });
    const lengths = [];
    const stop = effect(() => {lengths.push(state.items.length);}, { flush: 'sync' });

    state.items.length = 0;
    stop();
    state.dispose();

    expect(lengths).toEqual([ 2, 0 ]);
  });

  test('invalidates removed array indexes through defineProperty', () => {
    const state = reactive({ items: [ 'a', 'b' ] });
    const values = [];
    const stop = effect(() => {values.push(state.items[1]);}, { flush: 'sync' });

    Object.defineProperty(state.items, 'length', { value: 1 });
    stop();
    state.dispose();

    expect(values).toEqual([ 'b', undefined ]);
  });

  test('invalidates array length when defineProperty adds an index', () => {
    const state = reactive({ items: [ 'a' ] });
    const lengths = [];
    const stop = effect(() => {lengths.push(state.items.length);}, { flush: 'sync' });

    Object.defineProperty(state.items, '2', { value: 'c', enumerable: true });
    stop();
    state.dispose();

    expect(lengths).toEqual([ 1, 3 ]);
  });

  test('removes truncated array child edges while retaining remaining entries', () => {
    const first = { value: 1 };
    const second = { value: 2 };
    const state = reactive({ items: [ first, second ] });
    const firstProxy = state.items[0];
    const secondProxy = state.items[1];

    state.items.length = 1;
    expect(state.items[0]).toBe(firstProxy);
    expect(state.items[1]).toBeUndefined();
    secondProxy.value = 3;
    expect(toRaw(secondProxy)).toBe(second);
    state.dispose();
  });

  test('supports nested updates, array fill and copyWithin', () => {
    const state = reactive({ nested: { value: 1 }, items: [ 1, 2, 3 ] });
    const values = [];
    const stop = effect(() => {
      values.push(`${state.nested.value}:${state.items.join(',')}`);
    });

    state.nested.value = 2;
    state.items.fill(0, 1, 3);
    flushJobs();
    state.items.copyWithin(0, 1);
    flushJobs();
    stop();

    expect(values).toEqual([ '1:1,2,3', '2:1,0,0', '2:0,0,0' ]);
  });

  test('does not proxy built-in objects and always returns boolean from isReactive', () => {
    const map = new Map([ [ 'key', 'value' ] ]);
    const date = new Date(0);
    const state = reactive({ map, date });

    expect(reactive(map)).toBe(map);
    expect(state.map).toBe(map);
    expect(state.date).toBe(date);
    expect(isReactive(null)).toBe(false);
    expect(isReactive(undefined)).toBe(false);
    expect(isReactive(0)).toBe(false);
    expect(isReactive(state)).toBe(true);
    state.dispose();
  });

  test('keeps a deterministic randomized mutation sequence consistent', () => {
    const state = reactive({ items: [ 0, 1, 2 ], flags: {} });
    const expected = [ 0, 1, 2 ];
    const stop = effect(() => {
      state.items.length;
      state.items.join(',');
      Object.keys(state.flags).join(',');
    });
    let seed = 0x12345678;
    const nextRandom = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 0x100000000;
    };

    for (let index = 0; index < 200; index++) {
      const operation = Math.floor(nextRandom() * 6);
      const position = Math.floor(nextRandom() * (expected.length + 2));
      const value = index % 7;
      if (operation === 0) {
        state.items.push(value);
        expected.push(value);
      } else if (operation === 1 && expected.length > 0) {
        state.items.pop();
        expected.pop();
      } else if (operation === 2) {
        state.items.splice(position, 1, value);
        expected.splice(position, 1, value);
      } else if (operation === 3 && expected.length > 0) {
        state.items.fill(value, position, position + 1);
        expected.fill(value, position, position + 1);
      } else if (operation === 4) {
        const key = `flag${position}`;
        state.flags[key] = value;
        expected[key] = value;
      } else {
        const key = `flag${position}`;
        delete state.flags[key];
        delete expected[key];
      }
      flushJobs();
      expect(state.items.slice()).toEqual(expected.slice());
      expect(Object.keys(state.flags).sort()).toEqual(
        Object.keys(expected).filter(key => key.startsWith('flag')).sort(),
      );
    }

    stop();
    state.dispose();
  });
});

describe('profiler integration', () => {
  test('records actual signal triggers', () => {
    enableProfiler();
    const source = signal(0);
    const stop = effect(() => {source.value;});

    source.value = 1;
    flushJobs();
    stop();

    expect(getProfileReport().totalTriggers).toBe(1);
  });
});
