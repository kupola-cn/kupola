// SPDX-License-Identifier: MIT
/**
 * Performance benchmark tests — VirtualList, Table, Signal.
 *
 * These tests verify that core operations complete within
 * reasonable time limits for production-scale data.
 */

import { signal, computed, effect, flushJobs, resetScheduler } from '../packages/core/src/index.js';

describe('Performance: Signal reactivity', () => {
  afterEach(() => {
    resetScheduler();
  });

  test('1000 signals with effects complete in < 500ms', () => {
    const start = performance.now();
    const signals = [];
    const disposers = [];

    for (let i = 0; i < 1000; i++) {
      const s = signal(i);
      signals.push(s);
      const d = effect(() => s.value * 2);
      disposers.push(d);
    }

    // Update all signals
    for (const s of signals) {
      s.value = s.value + 1;
    }
    flushJobs();

    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(500);

    disposers.forEach(d => d());
  });

  test('deep computed chain (50 levels) completes in < 200ms', () => {
    const start = performance.now();
    const root = signal(1);

    let current = root;
    for (let i = 0; i < 50; i++) {
      const prev = current;
      current = computed(() => prev.value + 1);
    }

    // Read final value
    expect(current.value).toBe(51);

    // Update root and re-read
    root.value = 100;
    flushJobs();
    expect(current.value).toBe(150);

    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(200);
  });

  test('batch 500 signal updates efficiently', () => {
    const { batch } = require('../packages/core/src/index.js');
    const start = performance.now();

    const counters = Array.from({ length: 500 }, (_, i) => signal(i));
    const log = [];

    // Create effect that depends on all signals
    effect(() => {
      let sum = 0;
      for (const c of counters) {
        sum += c.value;
      }
      log.push(sum);
    });

    // Batch update all signals
    batch(() => {
      for (const c of counters) {
        c.value = c.value + 1;
      }
    });

    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(300);
    // Effect should have run only twice: initial + batched update
    expect(log.length).toBe(2);
  });
});

describe('Performance: VirtualList creation', () => {
  test('VirtualList with 10,000 items creates in < 200ms', () => {
    const { VirtualList } = require('../packages/core/src/components/virtuallist.js');

    const items = Array.from({ length: 10000 }, (_, i) => ({
      title: `Item ${i + 1}`,
      subtitle: `Description for item ${i + 1}`,
    }));

    const start = performance.now();
    const view = VirtualList({
      items,
      itemHeight: 48,
      height: 400,
      renderItem: (item) => item.title,
    });

    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(200);
    expect(view.element).toBeDefined();
  });

  test('VirtualList with 100,000 items creates in < 500ms', () => {
    const { VirtualList } = require('../packages/core/src/components/virtuallist.js');

    const items = Array.from({ length: 100000 }, (_, i) => ({
      title: `Item ${i + 1}`,
    }));

    const start = performance.now();
    const view = VirtualList({
      items,
      itemHeight: 48,
      height: 600,
      renderItem: (item) => item.title,
    });

    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(500);
    expect(view.element).toBeDefined();
  });
});

describe('Performance: Table component', () => {
  test('Table with 1,000 rows creates in < 500ms', () => {
    const { Table } = require('../packages/core/src/components/table.js');

    const data = Array.from({ length: 1000 }, (_, i) => ({
      id: i + 1,
      name: `User ${i + 1}`,
      email: `user${i + 1}@test.com`,
      role: i % 3 === 0 ? 'Admin' : 'User',
    }));

    const columns = [
      { key: 'id', title: 'ID', width: 60 },
      { key: 'name', title: 'Name' },
      { key: 'email', title: 'Email' },
      { key: 'role', title: 'Role' },
    ];

    const start = performance.now();
    const table = Table({
      data,
      columns,
      showPagination: false,
    });

    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(500);
    expect(table.element).toBeDefined();
  });

  test('Table with 5,000 rows creates in < 2000ms', () => {
    const { Table } = require('../packages/core/src/components/table.js');

    const data = Array.from({ length: 5000 }, (_, i) => ({
      id: i + 1,
      name: `User ${i + 1}`,
      email: `user${i + 1}@test.com`,
      role: i % 3 === 0 ? 'Admin' : 'User',
      status: i % 2 === 0 ? 'active' : 'inactive',
    }));

    const columns = [
      { key: 'id', title: 'ID', width: 60 },
      { key: 'name', title: 'Name' },
      { key: 'email', title: 'Email' },
      { key: 'role', title: 'Role' },
      { key: 'status', title: 'Status' },
    ];

    const start = performance.now();
    const table = Table({
      data,
      columns,
      showPagination: true,
      pageSize: 20,
    });

    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(2000);
    expect(table.element).toBeDefined();
  });
});

describe('Performance: SSR renderToString', () => {
  test('renderToString 100 items in < 100ms', async () => {
    const { renderToString } = await import('../packages/core/src/server.js');
    const { html } = await import('../packages/core/src/index.js');

    const items = Array.from({ length: 100 }, (_, i) => ({
      name: `Item ${i + 1}`,
      value: i * 10,
    }));

    const start = performance.now();
    const tpl = html`<ul>${items.map(i => html`<li>${i.name}: ${i.value}</li>`)}</ul>`;
    const result = renderToString(tpl);

    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(100);
    expect(result).toContain('Item 1');
    expect(result).toContain('Item 100');
  });
});
