// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Unit tests for the Tree component.
 * @jest-environment jsdom
 */

import { resetScheduler } from '../../src/index.js';
import { Tree } from '../../src/components/tree.js';

afterEach(() => {
  document.body.innerHTML = '';
  resetScheduler();
});

const sampleData = [
  {
    label: 'Root 1',
    children: [
      { label: 'Child 1-1' },
      { label: 'Child 1-2' },
    ],
  },
  {
    label: 'Root 2',
    children: [
      {
        label: 'Child 2-1',
        children: [
          { label: 'Grandchild 2-1-1' },
        ],
      },
    ],
  },
  { label: 'Leaf' },
];

// ─── Basic rendering ─────────────────────────────────────────────────────────

describe('Tree rendering', () => {
  test('renders a tree element', () => {
    const view = Tree({ data: sampleData });
    document.body.appendChild(view.element);

    const tree = document.body.querySelector('.ds-tree');
    expect(tree).not.toBeNull();
  });

  test('renders root-level items', () => {
    const view = Tree({ data: sampleData });
    document.body.appendChild(view.element);

    const items = document.body.querySelectorAll('.ds-tree > li > .ds-tree__item');
    expect(items.length).toBe(3);
  });

  test('renders nested children', () => {
    const view = Tree({ data: sampleData });
    document.body.appendChild(view.element);

    // Root 1 has 2 children
    const firstChildren = document.body.querySelectorAll('.ds-tree > li:first-child > .ds-tree__children .ds-tree__item');
    expect(firstChildren.length).toBe(2);
  });

  test('renders deeply nested nodes', () => {
    const view = Tree({ data: sampleData });
    document.body.appendChild(view.element);

    // Root 2 > Child 2-1 > Grandchild 2-1-1
    const grandchild = document.body.querySelector('.ds-tree__children .ds-tree__children .ds-tree__item');
    expect(grandchild).not.toBeNull();
    expect(grandchild.querySelector('.ds-tree__label').textContent).toBe('Grandchild 2-1-1');
  });

  test('leaf nodes have is-leaf toggle', () => {
    const view = Tree({ data: [ { label: 'Leaf' } ] });
    document.body.appendChild(view.element);

    const toggle = document.body.querySelector('.ds-tree__toggle');
    expect(toggle.classList.contains('is-leaf')).toBe(true);
  });

  test('parent nodes do not have is-leaf toggle', () => {
    const view = Tree({ data: sampleData });
    document.body.appendChild(view.element);

    const firstToggle = document.body.querySelector('.ds-tree > li:first-child > .ds-tree__item .ds-tree__toggle');
    expect(firstToggle.classList.contains('is-leaf')).toBe(false);
  });
});

// ─── Expand / Collapse ───────────────────────────────────────────────────────

describe('Tree expand/collapse', () => {
  test('children are hidden by default', () => {
    const view = Tree({ data: sampleData });
    document.body.appendChild(view.element);

    const children = document.body.querySelector('.ds-tree > li:first-child > .ds-tree__children');
    expect(children.style.display).toBe('none');
  });

  test('clicking toggle expands children', () => {
    const view = Tree({ data: sampleData });
    document.body.appendChild(view.element);

    const toggle = document.body.querySelector('.ds-tree > li:first-child > .ds-tree__item .ds-tree__toggle');
    toggle.click();

    const children = document.body.querySelector('.ds-tree > li:first-child > .ds-tree__children');
    expect(children.style.display).toBe('block');
  });

  test('clicking toggle twice collapses children', () => {
    const view = Tree({ data: sampleData });
    document.body.appendChild(view.element);

    const toggle = document.body.querySelector('.ds-tree > li:first-child > .ds-tree__item .ds-tree__toggle');
    toggle.click();
    toggle.click();

    const children = document.body.querySelector('.ds-tree > li:first-child > .ds-tree__children');
    expect(children.style.display).toBe('none');
  });

  test('onToggle callback fires', () => {
    const onToggle = jest.fn();
    const view = Tree({ data: sampleData, onToggle });
    document.body.appendChild(view.element);

    const toggle = document.body.querySelector('.ds-tree > li:first-child > .ds-tree__item .ds-tree__toggle');
    toggle.click();

    expect(onToggle).toHaveBeenCalledWith(expect.objectContaining({ label: 'Root 1' }), true);
  });
});

// ─── Selection ───────────────────────────────────────────────────────────────

describe('Tree selection', () => {
  test('clicking item selects it', () => {
    const view = Tree({ data: sampleData });
    document.body.appendChild(view.element);

    const item = document.body.querySelector('.ds-tree > li:first-child > .ds-tree__item');
    item.click();

    expect(item.classList.contains('is-selected')).toBe(true);
  });

  test('getSelected returns selected node', () => {
    const view = Tree({ data: sampleData });
    document.body.appendChild(view.element);

    const item = document.body.querySelectorAll('.ds-tree > li > .ds-tree__item')[1]; // Root 2
    item.click();

    expect(view.getSelected()).toEqual(expect.objectContaining({ label: 'Root 2' }));
  });

  test('clicking another item deselects previous', () => {
    const view = Tree({ data: sampleData });
    document.body.appendChild(view.element);

    const items = document.body.querySelectorAll('.ds-tree > li > .ds-tree__item');
    items[0].click();
    items[1].click();

    expect(items[0].classList.contains('is-selected')).toBe(false);
    expect(items[1].classList.contains('is-selected')).toBe(true);
  });

  test('onSelect callback fires', () => {
    const onSelect = jest.fn();
    const view = Tree({ data: sampleData, onSelect });
    document.body.appendChild(view.element);

    const item = document.body.querySelector('.ds-tree > li:first-child > .ds-tree__item');
    item.click();

    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ label: 'Root 1' }));
  });

  test('getSelected returns null when nothing selected', () => {
    const view = Tree({ data: sampleData });
    document.body.appendChild(view.element);

    expect(view.getSelected()).toBeNull();
  });
});

// ─── Options ─────────────────────────────────────────────────────────────────

describe('Tree options', () => {
  test('lined class applied', () => {
    const view = Tree({ data: sampleData, lined: true });
    document.body.appendChild(view.element);

    const tree = document.body.querySelector('.ds-tree');
    expect(tree.classList.contains('ds-tree--lined')).toBe(true);
  });

  test('compact class applied', () => {
    const view = Tree({ data: sampleData, compact: true });
    document.body.appendChild(view.element);

    const tree = document.body.querySelector('.ds-tree');
    expect(tree.classList.contains('ds-tree--compact')).toBe(true);
  });

  test('checkable renders checkboxes', () => {
    const view = Tree({ data: sampleData, checkable: true });
    document.body.appendChild(view.element);

    const checkboxes = document.body.querySelectorAll('.ds-tree__checkbox');
    expect(checkboxes.length).toBeGreaterThan(0);
  });

  test('badge renders badge text', () => {
    const view = Tree({ data: [ { label: 'Item', badge: '12' } ] });
    document.body.appendChild(view.element);

    const badge = document.body.querySelector('.ds-tree__badge');
    expect(badge).not.toBeNull();
    expect(badge.textContent).toBe('12');
  });
});

// ─── Destroy ─────────────────────────────────────────────────────────────────

describe('Tree destroy', () => {
  test('destroy cleans up', () => {
    const view = Tree({ data: sampleData });
    document.body.appendChild(view.element);

    expect(() => view.destroy()).not.toThrow();
  });
});
