// SPDX-License-Identifier: MIT
/**
 * Core engine benchmark tests — Signal, computed, effect.
 *
 * These tests measure raw performance of the reactivity system.
 * Results are saved to benchmark/reports/core-results.json.
 */

import { signal, computed, effect, batch } from '../../packages/core/src/index.js';
import { flushJobs, resetScheduler } from '../../packages/core/src/scheduler.js';
import fs from 'fs';
import path from 'path';

const results = [];

function bench(name, fn, iterations = 1) {
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    fn();
  }
  const elapsed = performance.now() - start;
  const avgTime = iterations > 1 ? elapsed / iterations : elapsed;

  results.push({
    category: 'core',
    test: name,
    iterations,
    totalTime: elapsed,
    avgTime,
    timestamp: Date.now(),
  });

  console.log(`[BENCH] ${name}: ${avgTime.toFixed(2)}ms (${iterations}x)`);
  return avgTime;
}

describe('Core Benchmark: Signal', () => {
  afterEach(() => {
    resetScheduler();
  });

  test('create 10,000 signals', () => {
    const time = bench('create 10,000 signals', () => {
      const signals = [];
      for (let i = 0; i < 10000; i++) {
        signals.push(signal(i));
      }
    });
    expect(time).toBeLessThan(1500);
  });

  test('update single signal 100,000 times', () => {
    const s = signal(0);
    effect(() => s.value * 2);

    const time = bench('update signal 100,000 times', () => {
      s.value = s.value + 1;
      flushJobs();
    }, 100000);

    expect(time).toBeLessThan(0.01);
  });

  test('batch update 10,000 signals', () => {
    const signals = Array.from({ length: 10000 }, (_, i) => signal(i));

    const time = bench('batch update 10,000 signals', () => {
      batch(() => {
        for (const s of signals) {
          s.value = s.value + 1;
        }
      });
      flushJobs();
    });

    expect(time).toBeLessThan(200);
  });

  test('signal nested reads', () => {
    const s1 = signal(1);
    const s2 = signal(2);
    const s3 = signal(3);

    const time = bench('signal nested reads 100,000 times', () => {
      const _ = s1.value + s2.value + s3.value;
    }, 100000);

    expect(time).toBeLessThan(10);
  });
});

describe('Core Benchmark: Computed', () => {
  afterEach(() => {
    resetScheduler();
  });

  test('create 1,000 computed', () => {
    const s = signal(0);

    const time = bench('create 1,000 computed', () => {
      const comps = [];
      for (let i = 0; i < 1000; i++) {
        comps.push(computed(() => s.value * (i + 1)));
      }
    });

    expect(time).toBeLessThan(50);
  });

  test('3-level computed chain update', () => {
    const root = signal(1);
    const level1 = computed(() => root.value * 2);
    const level2 = computed(() => level1.value * 3);
    const level3 = computed(() => level2.value * 4);

    const time = bench('3-level computed chain update 10,000 times', () => {
      root.value = root.value + 1;
      flushJobs();
      const _ = level3.value;
    }, 10000);

    expect(time).toBeLessThan(0.1);
  });

  test('100 computed sharing same signal', () => {
    const s = signal(0);
    Array.from({ length: 100 }, (_, i) =>
      computed(() => s.value * (i + 1)),
    );

    const time = bench('100 computed sharing signal update', () => {
      s.value = s.value + 1;
      flushJobs();
    });

    expect(time).toBeLessThan(100);
  });

  test('computed with complex array operations', () => {
    const data = signal(Array.from({ length: 1000 }, (_, i) => i));

    const processed = computed(() =>
      data.value.filter(x => x % 2 === 0).map(x => x * 2).reduce((a, b) => a + b, 0),
    );

    const _ = processed.value; // initial compute

    const time = bench('computed with array filter/map/reduce', () => {
      data.value = Array.from({ length: 1000 }, (_, i) => i + 1);
      flushJobs();
      const _ = processed.value;
    });

    expect(time).toBeLessThan(100);
  });
});

describe('Core Benchmark: Effect', () => {
  afterEach(() => {
    resetScheduler();
  });

  test('create 1,000 effects', () => {
    const s = signal(0);

    const time = bench('create 1,000 effects', () => {
      const disposers = [];
      for (let i = 0; i < 1000; i++) {
        disposers.push(effect(() => {
          const _ = s.value * (i + 1);
        }));
      }
    });

    expect(time).toBeLessThan(100);
  });

  test('effect reaction latency', () => {
    const s = signal(0);
    let captured = 0;

    effect(() => {
      captured = s.value;
    });

    const time = bench('effect reaction latency 10,000 times', () => {
      s.value = s.value + 1;
      flushJobs();
    }, 10000);

    expect(time).toBeLessThan(0.1);
    expect(captured).toBe(10000);
  });

  test('effect cleanup execution', () => {
    const s = signal(true);

    const time = bench('effect cleanup 1,000 times', () => {
      const dispose = effect(() => {
        if (s.value) {
          return () => {};
        }
      });
      s.value = false;
      flushJobs();
      dispose();
      s.value = true;
      flushJobs();
    }, 1000);

    expect(time).toBeLessThan(200);
  });
});

afterAll(() => {
  const reportsDir = path.join(__dirname, '../reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const outputFile = path.join(reportsDir, 'core-results.json');
  fs.writeFileSync(outputFile, JSON.stringify(results, null, 2));
  console.log(`\n[BENCH] Results saved to ${outputFile}`);
});
