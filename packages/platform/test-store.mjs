import { effect, Signal } from '@kupola/core';
import { defineStore } from './src/store.js';
import { isSignalLike } from './src/render.js';

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failed++;
    console.error(`  ✗ ${label}`);
  }
}

async function run() {
  console.log('=== defineStore Tests ===\n');

  // ── Test 1: flat signals ──
  console.log('Test 1: flat signals');
  {
    const store = defineStore(({ signal }) => ({
      count: signal(0),
      name: signal('hello'),
    }));
    assert(store.count instanceof Signal, 'count is Signal');
    assert(store.count.value === 0, 'count initial value');
    assert(store.name.value === 'hello', 'name initial value');
    store.count.value = 5;
    assert(store.count.value === 5, 'count after set');
  }

  // ── Test 2: nested signals ──
  console.log('Test 2: nested signals');
  {
    const store = defineStore(({ signal }) => ({
      filters: {
        shift: signal('all'),
        status: signal('active'),
      },
    }));
    assert(store.filters.shift instanceof Signal, 'nested signal is Signal');
    assert(store.filters.shift.value === 'all', 'nested shift initial');
    assert(store.filters.status.value === 'active', 'nested status initial');
    store.filters.shift.value = 'morning';
    assert(store.filters.shift.value === 'morning', 'nested shift after set');
    // Verify nested object is proxied
    assert(typeof store.filters === 'object' && store.filters !== null, 'filters is object');
  }

  // ── Test 3: computed values ──
  console.log('Test 3: computed values');
  {
    const store = defineStore(({ signal, computed }) => {
      const count = signal(2);
      const doubled = computed(() => count.value * 2);
      return { count, doubled };
    });
    assert(isSignalLike(store.doubled), 'computed is signal-like');
    assert(store.doubled.value === 4, 'doubled initial value');
    store.count.value = 3;
    assert(store.doubled.value === 6, 'doubled after count change');
  }

  // ── Test 4: methods with this ──
  console.log('Test 4: methods with this');
  {
    const store = defineStore(({ signal }) => ({
      count: signal(0),
      increment() {
        this.count.value++;
      },
      getValue() {
        return this.count.value;
      },
    }));
    assert(store.count.value === 0, 'initial count');
    store.increment();
    assert(store.count.value === 1, 'after increment');
    assert(store.getValue() === 1, 'getValue via this');
  }

  // ── Test 5: $reset ──
  console.log('Test 5: $reset');
  {
    const store = defineStore(({ signal, computed }) => {
      const count = signal(0);
      const doubled = computed(() => count.value * 2);
      return { count, doubled };
    });
    store.count.value = 10;
    assert(store.count.value === 10, 'count changed');
    assert(store.doubled.value === 20, 'doubled after change');
    store.$reset();
    assert(store.count.value === 0, 'count reset to initial');
    assert(store.doubled.value === 0, 'doubled recalculated after reset');
  }

  // ── Test 6: $reset nested ──
  console.log('Test 6: $reset nested');
  {
    const store = defineStore(({ signal }) => ({
      filters: {
        shift: signal('all'),
        status: signal('active'),
      },
      items: signal([]),
    }));
    store.filters.shift.value = 'morning';
    store.filters.status.value = 'done';
    store.items.value = [ 1, 2, 3 ];
    store.$reset();
    assert(store.filters.shift.value === 'all', 'nested shift reset');
    assert(store.filters.status.value === 'active', 'nested status reset');
    assert(store.items.value.length === 0, 'items reset');
  }

  // ── Test 7: $dispose ──
  console.log('Test 7: $dispose');
  {
    let effectRan = false;
    const store = defineStore(({ signal }) => {
      const count = signal(0);
      effect(() => { effectRan = true; void count.value; });
      return { count };
    });
    // effect should have run during setup
    assert(effectRan === true, 'effect ran during setup');
    effectRan = false;
    store.$dispose();
    store.count.value = 1;
    // After dispose, effect should NOT run again
    assert(effectRan === false, 'effect did not run after dispose');
  }

  // ── Test 8: deeply nested ──
  console.log('Test 8: deeply nested');
  {
    const store = defineStore(({ signal }) => ({
      a: {
        b: {
          c: signal('deep'),
        },
      },
    }));
    assert(store.a.b.c instanceof Signal, 'deeply nested signal is Signal');
    assert(store.a.b.c.value === 'deep', 'deeply nested initial value');
    store.a.b.c.value = 'changed';
    assert(store.a.b.c.value === 'changed', 'deeply nested after set');
  }

  // ── Test 9: array of signals ──
  console.log('Test 9: array of signals');
  {
    const store = defineStore(({ signal }) => ({
      items: [
        signal('a'),
        signal('b'),
        signal('c'),
      ],
    }));
    assert(store.items[0] instanceof Signal, 'array[0] is Signal');
    assert(store.items[0].value === 'a', 'array[0] initial');
    assert(store.items[1].value === 'b', 'array[1] initial');
    store.items[0].value = 'x';
    assert(store.items[0].value === 'x', 'array[0] after set');
  }

  // ── Test 10: ownKeys enumerates only user properties ──
  console.log('Test 10: ownKeys');
  {
    const store = defineStore(({ signal }) => ({
      count: signal(0),
      name: signal('x'),
    }));
    const keys = Object.keys(store);
    assert(keys.includes('count'), 'keys includes count');
    assert(keys.includes('name'), 'keys includes name');
    assert(!keys.includes('$reset'), 'keys does NOT include $reset');
    assert(!keys.includes('$dispose'), 'keys does NOT include $dispose');
  }

  // ── Test 11: invalid factory throws ──
  console.log('Test 11: invalid factory');
  {
    let threw = false;
    try { defineStore('not a function'); } catch { threw = true; }
    assert(threw, 'throws on non-function');
    threw = false;
    try { defineStore(() => 42); } catch { threw = true; }
    assert(threw, 'throws on non-object return');
  }

  // ── Test 12: signal in template context (simulated) ──
  console.log('Test 12: signal reactivity');
  {
    let tracked = 0;
    const store = defineStore(({ signal, computed }) => {
      const a = signal(1);
      const b = signal(2);
      const sum = computed(() => {
        tracked++;
        return a.value + b.value;
      });
      return { a, b, sum };
    });
    assert(store.sum.value === 3, 'sum initial');
    const initialTracked = tracked;
    store.a.value = 10;
    assert(store.sum.value === 12, 'sum after a change');
    assert(tracked > initialTracked, 'computed recalculated');
  }

  // ── Summary ──
  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
  if (failed > 0) { process.exit(1); }
}

run().catch(e => { console.error(e); process.exit(1); });
