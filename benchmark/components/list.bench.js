// SPDX-License-Identifier: MIT
/**
 * Component rendering benchmark tests — List, Table, Form.
 *
 * These tests measure rendering performance of Kupola components.
 * Results are saved to benchmark/reports/components-results.json.
 */

import { signal, computed, effect } from '../../packages/core/src/index.js';
import { flushJobs, resetScheduler } from '../../packages/core/src/scheduler.js';
import { Table, VirtualList, Input, Select, Modal, Tooltip } from '@kupola/components';
import { renderToString } from '../../packages/platform/src/server.js';
import { html } from '../../packages/platform/src/template.js';
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
    category: 'components',
    test: name,
    iterations,
    totalTime: elapsed,
    avgTime,
    timestamp: Date.now(),
  });

  console.log(`[BENCH] ${name}: ${avgTime.toFixed(2)}ms (${iterations}x)`);
  return avgTime;
}

describe('Components Benchmark: VirtualList', () => {
  test('render 100 items', () => {
    const items = Array.from({ length: 100 }, (_, i) => ({
      title: `Item ${i + 1}`,
      subtitle: `Description for item ${i + 1}`,
    }));

    const time = bench('VirtualList 100 items', () => {
      const view = VirtualList({
        items,
        itemHeight: 48,
        height: 400,
        renderItem: (item) => item.title,
      });
    });

    expect(time).toBeLessThan(50);
  });

  test('render 1,000 items', () => {
    const items = Array.from({ length: 1000 }, (_, i) => ({
      title: `Item ${i + 1}`,
      subtitle: `Description for item ${i + 1}`,
    }));

    const time = bench('VirtualList 1,000 items', () => {
      const view = VirtualList({
        items,
        itemHeight: 48,
        height: 400,
        renderItem: (item) => item.title,
      });
    });

    expect(time).toBeLessThan(100);
  });

  test('render 10,000 items', () => {
    const items = Array.from({ length: 10000 }, (_, i) => ({
      title: `Item ${i + 1}`,
      subtitle: `Description for item ${i + 1}`,
    }));

    const time = bench('VirtualList 10,000 items', () => {
      const view = VirtualList({
        items,
        itemHeight: 48,
        height: 400,
        renderItem: (item) => item.title,
      });
    });

    expect(time).toBeLessThan(200);
  });

  test('add/remove items from list', () => {
    const items = signal(Array.from({ length: 1000 }, (_, i) => ({
      title: `Item ${i + 1}`,
    })));

    const time = bench('VirtualList add/remove 100 times', () => {
      const view = VirtualList({
        items: items.value,
        itemHeight: 48,
        height: 400,
        renderItem: (item) => item.title,
      });

      // Add item
      items.value = [ ...items.value, { title: 'New' } ];

      // Remove first item
      items.value = items.value.slice(1);
    }, 100);

    expect(time).toBeLessThan(50);
  });
});

describe('Components Benchmark: Table', () => {
  test('render 100 rows × 10 cols', () => {
    const data = Array.from({ length: 100 }, (_, i) => ({
      id: i + 1,
      name: `User ${i + 1}`,
      email: `user${i + 1}@test.com`,
      role: i % 3 === 0 ? 'Admin' : i % 3 === 1 ? 'Editor' : 'User',
      status: i % 2 === 0 ? 'active' : 'inactive',
      department: `Dept ${i % 5 + 1}`,
      phone: `1380013800${i % 10}`,
      address: `Address ${i + 1}`,
      city: `City ${i % 3 + 1}`,
      country: 'China',
    }));

    const columns = Object.keys(data[0]).map(key => ({
      key,
      title: key.charAt(0).toUpperCase() + key.slice(1),
    }));

    const time = bench('Table 100×10', () => {
      const table = Table({
        data,
        columns,
        showPagination: false,
      });
    });

    expect(time).toBeLessThan(200);
  });

  test('render 1,000 rows × 10 cols', () => {
    const data = Array.from({ length: 1000 }, (_, i) => ({
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

    const time = bench('Table 1,000×5', () => {
      const table = Table({
        data,
        columns,
        showPagination: false,
      });
    });

    expect(time).toBeLessThan(500);
  });

  test('table sorting performance', () => {
    const data = Array.from({ length: 1000 }, (_, i) => ({
      id: i + 1,
      name: `User ${i + 1}`,
      email: `user${i + 1}@test.com`,
    }));

    const columns = [
      { key: 'id', title: 'ID', width: 60, sortable: true },
      { key: 'name', title: 'Name', sortable: true },
      { key: 'email', title: 'Email', sortable: true },
    ];

    // Create table once
    const table = Table({
      data,
      columns,
      showPagination: false,
    });

    // Test actual sorting operations (includes render)
    const time = bench('Table sorting 100 times', () => {
      // Trigger sort by clicking header (ascending)
      table.setSort('name', 'asc');
      // Trigger sort again (descending)
      table.setSort('name', 'desc');
    }, 50);

    expect(time).toBeLessThan(200);
  });

  test('table pagination performance', () => {
    const data = Array.from({ length: 5000 }, (_, i) => ({
      id: i + 1,
      name: `User ${i + 1}`,
      email: `user${i + 1}@test.com`,
    }));

    const columns = [
      { key: 'id', title: 'ID', width: 60 },
      { key: 'name', title: 'Name' },
      { key: 'email', title: 'Email' },
    ];

    const time = bench('Table pagination 5,000 rows', () => {
      const table = Table({
        data,
        columns,
        showPagination: true,
        pageSize: 20,
      });
    });

    expect(time).toBeLessThan(2000);
  });
});

describe('Components Benchmark: Form', () => {
  test('render form with 50 fields', () => {
    const fields = Array.from({ length: 50 }, (_, i) => ({
      id: `field${i}`,
      label: `Field ${i + 1}`,
      type: i % 3 === 0 ? 'text' : i % 3 === 1 ? 'select' : 'number',
    }));

    const time = bench('Form 50 fields', () => {
      const container = document.createElement('div');
      for (const field of fields) {
        if (field.type === 'text') {
          const input = Input({ placeholder: field.label });
          container.appendChild(input.element);
        } else if (field.type === 'select') {
          const select = Select({ options: [ { label: 'Option 1', value: '1' } ] });
          container.appendChild(select.element);
        } else {
          const input = Input({ type: 'number', placeholder: field.label });
          container.appendChild(input.element);
        }
      }
    });

    expect(time).toBeLessThan(300);
  });

  test('modal open/close', () => {
    const isOpen = signal(false);

    const time = bench('Modal open/close 100 times', () => {
      const modal = Modal({
        isOpen: isOpen.value,
        title: 'Test Modal',
        content: 'Content',
        onClose: () => { isOpen.value = false; },
      });

      isOpen.value = true;
      isOpen.value = false;
    }, 100);

    expect(time).toBeLessThan(100);
  });

  test('tooltip creation', () => {
    const time = bench('Tooltip creation 100 times', () => {
      const element = document.createElement('div');
      const tooltip = Tooltip({
        target: element,
        content: 'Test tooltip',
      });
    }, 100);

    expect(time).toBeLessThan(50);
  });
});

describe('Components Benchmark: SSR', () => {
  test('renderToString 100 items', () => {
    const items = Array.from({ length: 100 }, (_, i) => ({
      name: `Item ${i + 1}`,
      value: i * 10,
    }));

    const time = bench('SSR renderToString 100 items', () => {
      const tpl = html`<ul>${items.map(i => html`<li>${i.name}: ${i.value}</li>`)}</ul>`;
      const result = renderToString(tpl);
    });

    expect(time).toBeLessThan(100);
  });

  test('renderToString 1,000 items', () => {
    const items = Array.from({ length: 1000 }, (_, i) => ({
      name: `Item ${i + 1}`,
      value: i * 10,
    }));

    const time = bench('SSR renderToString 1,000 items', () => {
      const tpl = html`<ul>${items.map(i => html`<li>${i.name}: ${i.value}</li>`)}</ul>`;
      const result = renderToString(tpl);
    });

    expect(time).toBeLessThan(500);
  });
});

afterAll(() => {
  const reportsDir = path.join(__dirname, '../reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const outputFile = path.join(reportsDir, 'components-results.json');
  fs.writeFileSync(outputFile, JSON.stringify(results, null, 2));
  console.log(`\n[BENCH] Results saved to ${outputFile}`);
});
