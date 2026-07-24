// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Stress tests for high-concurrency scenarios.
 * @jest-environment jsdom
 */

import { signal, reactive, effect, flushJobs, resetScheduler } from '../src/index.js';

afterEach(() => {
  resetScheduler();
  jest.restoreAllMocks();
});

describe('High Concurrency Stress Tests', () => {
  test('100 concurrent effects with shared dependencies', async () => {
    const count = signal(0);
    const effects = [];
    const results = [];

    for (let i = 0; i < 100; i += 1) {
      effects.push(effect(() => {
        results[i] = count.value * (i + 1);
      }));
    }

    const startTime = performance.now();
    for (let i = 0; i < 100; i += 1) {
      count.value = i;
      flushJobs();
    }
    const endTime = performance.now();

    expect(results[99]).toBe(99 * 100);
    expect(endTime - startTime).toBeLessThan(200);

    effects.forEach(e => e());
  });

  test('reactive object with 100 properties and nested updates', async () => {
    const state = reactive({
      data: Array.from({ length: 100 }, (_, i) => ({
        id: i,
        nested: {
          value: i * 2,
          deep: { nestedValue: i * 3 },
        },
      })),
    });

    let sum = 0;
    const dispose = effect(() => {
      sum = state.data.reduce((acc, item) => acc + item.nested.deep.nestedValue, 0);
    });

    const startTime = performance.now();
    for (let i = 0; i < 100; i += 1) {
      state.data[i].nested.deep.nestedValue = i * 10;
      flushJobs();
    }
    const endTime = performance.now();

    expect(state.data[50].nested.deep.nestedValue).toBe(500);
    expect(endTime - startTime).toBeLessThan(300);

    dispose();
  });

  test('circular references in reactive objects', async () => {
    const objA = { name: 'A' };
    const objB = { name: 'B', ref: objA };
    objA.ref = objB;

    const state = reactive(objA);

    let count = 0;
    const dispose = effect(() => {
      count += state.name.length + state.ref.name.length;
    });

    state.name = 'AA';
    flushJobs();

    expect(count).toBeGreaterThan(0);
    expect(state.ref.ref.name).toBe('AA');

    dispose();
  });

  test('batch updates with 100 signals', async () => {
    const signals = Array.from({ length: 100 }, () => signal(0));
    let total = 0;

    effect(() => {
      total = signals.reduce((sum, sig) => sum + sig.value, 0);
    });

    const startTime = performance.now();
    for (let i = 0; i < 100; i += 1) {
      signals[i].value = i;
    }
    flushJobs();
    const endTime = performance.now();

    expect(total).toBe(4950);
    expect(endTime - startTime).toBeLessThan(100);
  });

  test('rapid signal updates with 1000 iterations', async () => {
    const count = signal(0);
    let result = 0;

    effect(() => {
      result = count.value * 2;
    });

    const startTime = performance.now();
    for (let i = 0; i < 1000; i += 1) {
      count.value = i;
    }
    flushJobs();
    const endTime = performance.now();

    expect(result).toBe(1998);
    expect(endTime - startTime).toBeLessThan(100);
  });

  test('reactive array mutation methods', async () => {
    const state = reactive({ items: [1, 2, 3] });
    let sum = 0;

    effect(() => {
      sum = state.items.reduce((acc, item) => acc + item, 0);
    });

    expect(sum).toBe(6);

    state.items.push(4);
    flushJobs();
    expect(sum).toBe(10);

    state.items.pop();
    flushJobs();
    expect(sum).toBe(6);

    state.items.splice(0, 1, 10);
    flushJobs();
    expect(sum).toBe(15);
  });

  test('deeply nested reactive updates', async () => {
    const state = reactive({
      level1: {
        level2: {
          level3: {
            level4: {
              level5: {
                value: 0,
              },
            },
          },
        },
      },
    });

    let trackedValue = 0;
    const dispose = effect(() => {
      trackedValue = state.level1.level2.level3.level4.level5.value;
    });

    for (let i = 0; i < 100; i += 1) {
      state.level1.level2.level3.level4.level5.value = i;
      flushJobs();
    }

    expect(trackedValue).toBe(99);
    dispose();
  });

  test('mixed reactive and signal updates', async () => {
    const sig = signal(0);
    const state = reactive({ value: 0 });
    let result = 0;

    effect(() => {
      result = sig.value + state.value;
    });

    for (let i = 0; i < 100; i += 1) {
      sig.value = i;
      state.value = i * 2;
      flushJobs();
    }

    expect(result).toBe(297);
  });
});