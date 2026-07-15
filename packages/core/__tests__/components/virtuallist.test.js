// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Unit tests for the VirtualList component.
 * @jest-environment jsdom
 */

import { resetScheduler } from '../../src/index.js';
import { VirtualList } from '../../src/components/virtuallist.js';

afterEach(() => {
  document.body.innerHTML = '';
  resetScheduler();
});

const bigList = Array.from({ length: 1000 }, (_, i) => ({
  title: `Item ${i + 1}`,
  subtitle: `Description ${i + 1}`,
}));

// ─── Basic rendering ─────────────────────────────────────────────────────────

describe('VirtualList rendering', () => {
  test('renders a virtual-list wrapper', () => {
    const view = VirtualList({ items: bigList });
    document.body.appendChild(view.element);

    expect(document.body.querySelector('.ds-virtual-list')).not.toBeNull();
  });

  test('sets container height', () => {
    const view = VirtualList({ items: bigList, height: 300 });
    document.body.appendChild(view.element);

    const list = document.body.querySelector('.ds-virtual-list');
    expect(list.style.height).toBe('300px');
  });

  test('renders only visible items (not all 1000)', () => {
    const view = VirtualList({ items: bigList, itemHeight: 48, height: 400, overscan: 5 });
    document.body.appendChild(view.element);

    const rendered = document.body.querySelectorAll('.ds-virtual-list__item');
    // viewport: 400/48 ≈ 9 items + 2*5 overscan = ~19 items (much less than 1000)
    expect(rendered.length).toBeLessThan(100);
    expect(rendered.length).toBeGreaterThan(0);
  });

  test('spacer height equals total content height', () => {
    const view = VirtualList({ items: bigList, itemHeight: 48 });
    document.body.appendChild(view.element);

    const spacer = document.body.querySelector('.ds-virtual-list__spacer');
    expect(spacer.style.height).toBe(`${1000 * 48}px`);
  });

  test('renders string items', () => {
    const items = ['Alpha', 'Beta', 'Gamma'];
    const view = VirtualList({ items, itemHeight: 40, height: 200 });
    document.body.appendChild(view.element);

    const rendered = document.body.querySelectorAll('.ds-virtual-list__item');
    expect(rendered.length).toBe(3);
    expect(rendered[0].textContent).toBe('Alpha');
  });

  test('renders object items with title', () => {
    const view = VirtualList({ items: bigList.slice(0, 5), itemHeight: 48, height: 300 });
    document.body.appendChild(view.element);

    const titles = document.body.querySelectorAll('.ds-virtual-list__item-title');
    expect(titles.length).toBe(5);
    expect(titles[0].textContent).toBe('Item 1');
  });
});

// ─── Custom render ───────────────────────────────────────────────────────────

describe('VirtualList custom render', () => {
  test('uses renderItem function', () => {
    const items = ['A', 'B', 'C'];
    const renderItem = (item, idx) => `[${idx}] ${item}`;
    const view = VirtualList({ items, renderItem, itemHeight: 40, height: 200 });
    document.body.appendChild(view.element);

    const rendered = document.body.querySelectorAll('.ds-virtual-list__item');
    expect(rendered[0].textContent).toBe('[0] A');
    expect(rendered[1].textContent).toBe('[1] B');
  });
});

// ─── Click handling ──────────────────────────────────────────────────────────

describe('VirtualList click', () => {
  test('onClick fires with item and index', () => {
    const onClick = jest.fn();
    const items = ['X', 'Y', 'Z'];
    const view = VirtualList({ items, onClick, itemHeight: 40, height: 200 });
    document.body.appendChild(view.element);

    const rendered = document.body.querySelectorAll('.ds-virtual-list__item');
    rendered[1].click();

    expect(onClick).toHaveBeenCalledWith('Y', 1);
  });
});

// ─── ScrollTo ────────────────────────────────────────────────────────────────

describe('VirtualList scrollTo', () => {
  test('scrollTo sets scrollTop', () => {
    const view = VirtualList({ items: bigList, itemHeight: 48, height: 400 });
    document.body.appendChild(view.element);

    const list = document.body.querySelector('.ds-virtual-list');
    view.scrollTo(100);
    expect(list.scrollTop).toBe(100 * 48);
  });
});

// ─── Empty state ─────────────────────────────────────────────────────────────

describe('VirtualList empty', () => {
  test('renders no items when items is empty', () => {
    const view = VirtualList({ items: [] });
    document.body.appendChild(view.element);

    const rendered = document.body.querySelectorAll('.ds-virtual-list__item');
    expect(rendered.length).toBe(0);
  });
});

// ─── Destroy ─────────────────────────────────────────────────────────────────

describe('VirtualList destroy', () => {
  test('destroy cleans up', () => {
    const view = VirtualList({ items: bigList });
    document.body.appendChild(view.element);

    expect(() => view.destroy()).not.toThrow();
  });
});
