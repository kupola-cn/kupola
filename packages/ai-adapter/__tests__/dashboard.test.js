// SPDX-License-Identifier: MIT
/**
 * AIDashboard tests — addCard / mount / refresh / destroy
 */

import { AIAdapter } from '../src/ai-adapter.js';
import { AIDashboard } from '../src/dashboard.js';

function createMockStorage() {
  let data = null;
  return { get: () => data, set: (d) => { data = d; } };
}

describe('AIDashboard', () => {
  let adapter;
  let dashboard;
  let container;

  beforeEach(() => {
    adapter = new AIAdapter({
      flow: { storage: createMockStorage() },
      action: { requireConfirm: false },
    });
    container = document.createElement('div');
    document.body.appendChild(container);
    dashboard = new AIDashboard(adapter);
  });

  afterEach(() => {
    dashboard.destroy();
    if (container.parentNode) container.parentNode.removeChild(container);
  });

  it('should add cards', () => {
    dashboard.addCard('employees', 'search', { label: '员工总数', aggregate: 'count' });
    expect(dashboard.cards.size).toBe(1);
    expect(dashboard.cards.get('employees').label).toBe('员工总数');
  });

  it('should mount and render cards', () => {
    dashboard.addCard('a', 'search', { label: 'Card A' });
    dashboard.addCard('b', 'list', { label: 'Card B' });
    dashboard.mount(container);

    const cards = container.querySelectorAll('[data-card]');
    expect(cards.length).toBe(2);
  });

  it('should remove cards', () => {
    dashboard.addCard('x', 'search');
    dashboard.mount(container);
    expect(container.querySelectorAll('[data-card]').length).toBe(1);

    dashboard.removeCard('x');
    expect(container.querySelectorAll('[data-card]').length).toBe(0);
  });

  it('should show placeholder when no data', () => {
    dashboard.addCard('empty', 'search', { label: 'Empty' });
    dashboard.mount(container);

    const card = container.querySelector('[data-card="empty"]');
    expect(card.textContent).toContain('—');
  });

  it('should compute count aggregate', () => {
    dashboard.addCard('count', 'search', { label: 'Count', aggregate: 'count' });
    dashboard.mount(container);

    // Manually update card data
    const card = dashboard.cards.get('count');
    card.lastData = { success: true, data: [{ id: 1 }, { id: 2 }, { id: 3 }] };
    dashboard._renderCard('count');

    const el = container.querySelector('[data-card="count"]');
    expect(el.textContent).toContain('3');
  });

  it('should compute sum aggregate', () => {
    dashboard.addCard('sal', 'search', { label: 'Salary', aggregate: 'sum:amount' });
    dashboard.mount(container);

    const card = dashboard.cards.get('sal');
    card.lastData = { success: true, data: [{ amount: 100 }, { amount: 200 }, { amount: 300 }] };
    dashboard._renderCard('sal');

    const el = container.querySelector('[data-card="sal"]');
    expect(el.textContent).toContain('600');
  });

  it('should refresh a card', async () => {
    adapter.query.register('search', async () => [{ id: 1 }]);
    dashboard.addCard('r', 'search', { label: 'Refresh' });
    dashboard.mount(container);

    await dashboard.refresh('r');
    const card = dashboard.cards.get('r');
    expect(card.lastData).not.toBeNull();
  });

  it('should destroy cleanly', () => {
    dashboard.addCard('x', 'search');
    dashboard.mount(container);
    dashboard.destroy();
    expect(container.querySelector('.kai-dashboard')).toBeNull();
  });

  it('should render mini table when data has table property', () => {
    dashboard.addCard('tbl', 'search', { label: 'Table' });
    dashboard.mount(container);

    const card = dashboard.cards.get('tbl');
    card.lastData = {
      success: true,
      data: [{ name: 'Alice' }, { name: 'Bob' }],
      table: {
        columns: [{ field: 'name', title: 'Name' }],
        rows: [{ name: 'Alice' }, { name: 'Bob' }],
      },
    };
    dashboard._renderCard('tbl');

    const el = container.querySelector('[data-card="tbl"]');
    expect(el.querySelector('table')).not.toBeNull();
    expect(el.textContent).toContain('Alice');
  });
});
