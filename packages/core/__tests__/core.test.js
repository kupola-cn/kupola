// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Unit tests for the Signal reactivity system.
 */

import { signal, computed, effect, batch } from '../src/index.js';
import { flushJobs, resetScheduler } from '../src/scheduler.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Flush pending microtasks synchronously. */
function flush() {
  flushJobs();
}

afterEach(() => {
  resetScheduler();
});

// ─── signal ──────────────────────────────────────────────────────────────────

describe('signal', () => {
  test('holds an initial value', () => {
    const s = signal(42);
    expect(s.value).toBe(42);
  });

  test('updates value on write', () => {
    const s = signal(0);
    s.value = 10;
    expect(s.value).toBe(10);
  });

  test('does not trigger when value is the same (Object.is)', () => {
    const s = signal(5);
    const fn = jest.fn();
    effect(() => { fn(s.value); });
    expect(fn).toHaveBeenCalledTimes(1);

    s.value = 5; // same value
    flush();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test('peek() reads without tracking', () => {
    const s = signal(99);
    const fn = jest.fn();
    effect(() => { fn(s.peek()); });
    expect(fn).toHaveBeenCalledWith(99);
    expect(fn).toHaveBeenCalledTimes(1);

    s.value = 100;
    flush();
    // effect should NOT re-run because we used peek()
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test('toString() returns string representation', () => {
    const s = signal('hello');
    expect(String(s)).toBe('hello');
  });

  test('toJSON() returns JSON string', () => {
    const s = signal({ a: 1 });
    expect(s.toJSON()).toBe('{"a":1}');
  });

  test('handles NaN correctly (Object.is)', () => {
    const s = signal(NaN);
    const fn = jest.fn();
    effect(() => { fn(s.value); });
    expect(fn).toHaveBeenCalledTimes(1);

    s.value = NaN; // NaN === NaN with Object.is
    flush();
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

// ─── computed ────────────────────────────────────────────────────────────────

describe('computed', () => {
  test('computes derived value', () => {
    const a = signal(2);
    const b = signal(3);
    const sum = computed(() => a.value + b.value);
    expect(sum.value).toBe(5);
  });

  test('recomputes when dependency changes', () => {
    const a = signal(1);
    const double = computed(() => a.value * 2);
    expect(double.value).toBe(2);

    a.value = 5;
    expect(double.value).toBe(10);
  });

  test('caches value when deps have not changed', () => {
    const a = signal(1);
    const fn = jest.fn(() => a.value * 2);
    const c = computed(fn);

    c.value; // first computation
    c.value; // should use cache
    c.value; // should still use cache
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test('supports chained computed', () => {
    const base = signal(2);
    const doubled = computed(() => base.value * 2);
    const quadrupled = computed(() => doubled.value * 2);

    expect(quadrupled.value).toBe(8);

    base.value = 3;
    expect(quadrupled.value).toBe(12);
  });

  test('computed peek() does not register dependency', () => {
    const a = signal(1);
    const c = computed(() => a.value + 1);
    const fn = jest.fn();

    effect(() => { fn(c.peek()); });
    expect(fn).toHaveBeenCalledWith(2);

    a.value = 10;
    flush();
    // effect should NOT re-run since we used peek()
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

// ─── effect ──────────────────────────────────────────────────────────────────

describe('effect', () => {
  test('runs immediately on creation', () => {
    const fn = jest.fn();
    effect(fn);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test('re-runs when tracked signal changes', () => {
    const s = signal(0);
    const fn = jest.fn();
    effect(() => { fn(s.value); });
    expect(fn).toHaveBeenCalledWith(0);

    s.value = 1;
    flush();
    expect(fn).toHaveBeenCalledWith(1);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  test('tracks dynamic dependencies', () => {
    const toggle = signal(true);
    const a = signal('A');
    const b = signal('B');
    const fn = jest.fn();

    effect(() => {
      fn(toggle.value ? a.value : b.value);
    });
    expect(fn).toHaveBeenCalledWith('A');

    // Change b — should NOT trigger (not tracked)
    b.value = 'B2';
    flush();
    expect(fn).toHaveBeenCalledTimes(1);

    // Switch to b
    toggle.value = false;
    flush();
    expect(fn).toHaveBeenCalledWith('B2');
    expect(fn).toHaveBeenCalledTimes(2);

    // Now change a — should NOT trigger (no longer tracked)
    a.value = 'A2';
    flush();
    expect(fn).toHaveBeenCalledTimes(2);

    // Change b — should trigger
    b.value = 'B3';
    flush();
    expect(fn).toHaveBeenCalledWith('B3');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  test('dispose stops reactivity', () => {
    const s = signal(0);
    const fn = jest.fn();
    const dispose = effect(() => { fn(s.value); });
    expect(fn).toHaveBeenCalledTimes(1);

    dispose();

    s.value = 1;
    flush();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test('nested effects work independently', () => {
    const a = signal(0);
    const b = signal(0);
    const outerFn = jest.fn();
    const innerFn = jest.fn();

    effect(() => {
      outerFn(a.value);
      effect(() => {
        innerFn(b.value);
      });
    });

    expect(outerFn).toHaveBeenCalledTimes(1);
    expect(innerFn).toHaveBeenCalledTimes(1);

    b.value = 1;
    flush();
    expect(innerFn).toHaveBeenCalledTimes(2);
    expect(outerFn).toHaveBeenCalledTimes(1); // outer should not re-run
  });

  test('effect reading computed tracks transitively', () => {
    const count = signal(0);
    const doubled = computed(() => count.value * 2);
    const fn = jest.fn();

    effect(() => { fn(doubled.value); });
    expect(fn).toHaveBeenCalledWith(0);

    count.value = 5;
    flush();
    expect(fn).toHaveBeenCalledWith(10);
    expect(fn).toHaveBeenCalledTimes(2);
  });
});

// ─── batch ───────────────────────────────────────────────────────────────────

describe('batch', () => {
  test('defers effect execution until batch ends', () => {
    const a = signal(0);
    const b = signal(0);
    const fn = jest.fn();

    effect(() => { fn(a.value, b.value); });
    expect(fn).toHaveBeenCalledTimes(1);

    batch(() => {
      a.value = 1;
      b.value = 2;
      // effect should NOT have run yet
      expect(fn).toHaveBeenCalledTimes(1);
    });

    // After batch, effect should run once with final values
    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenLastCalledWith(1, 2);
  });

  test('nested batches only flush at outermost end', () => {
    const s = signal(0);
    const fn = jest.fn();
    effect(() => { fn(s.value); });

    batch(() => {
      s.value = 1;
      batch(() => {
        s.value = 2;
      });
      // Inner batch ended, but outer still active — no flush
      expect(fn).toHaveBeenCalledTimes(1);
    });

    // Outer batch ended — now flush
    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenLastCalledWith(2);
  });

  test('batch returns the value of the callback', () => {
    const result = batch(() => 42);
    expect(result).toBe(42);
  });

  test('batch with no signal changes does not trigger effects', () => {
    const fn = jest.fn();
    effect(fn);
    expect(fn).toHaveBeenCalledTimes(1);

    batch(() => {
      // no mutations
    });

    expect(fn).toHaveBeenCalledTimes(1);
  });
});

// ─── Integration ─────────────────────────────────────────────────────────────

describe('integration', () => {
  test('signal → computed → effect chain', () => {
    const count = signal(0);
    const label = computed(() => `Count: ${count.value}`);
    const log = [];

    effect(() => { log.push(label.value); });
    expect(log).toEqual([ 'Count: 0' ]);

    count.value = 1;
    flush();
    expect(log).toEqual([ 'Count: 0', 'Count: 1' ]);

    count.value = 2;
    flush();
    expect(log).toEqual([ 'Count: 0', 'Count: 1', 'Count: 2' ]);
  });

  test('batch multiple signals, single effect run', () => {
    const x = signal(0);
    const y = signal(0);
    const z = signal(0);
    const fn = jest.fn();

    effect(() => { fn(x.value, y.value, z.value); });

    batch(() => {
      x.value = 1;
      y.value = 2;
      z.value = 3;
    });

    expect(fn).toHaveBeenCalledTimes(2); // initial + 1 batched
    expect(fn).toHaveBeenLastCalledWith(1, 2, 3);
  });

  test('effect that modifies a signal does not infinite loop', () => {
    const s = signal(0);
    const fn = jest.fn();

    effect(() => {
      fn(s.value);
      if (s.value < 3) {
        s.value = s.value + 1;
      }
    });

    // Initial run: reads 0, sets to 1
    // Re-run: reads 1, sets to 2
    // Re-run: reads 2, sets to 3
    // Re-run: reads 3, no set
    flush();
    expect(fn).toHaveBeenCalledTimes(4);
    expect(s.value).toBe(3);
  });
});
