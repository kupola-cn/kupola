// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Unit tests for the Collapse component.
 * @jest-environment jsdom
 */

import { html, resetScheduler } from '../../src/index.js';
import { Collapse } from '@kupola/components';

const ITEMS = [
  { key: 'a', title: 'Section A', content: html`<p>Content A</p>` },
  { key: 'b', title: 'Section B', content: html`<p>Content B</p>` },
  { key: 'c', title: 'Section C', content: html`<p>Content C</p>` },
];

afterEach(() => {
  document.body.innerHTML = '';
  resetScheduler();
});

// ─── Rendering ───────────────────────────────────────────────────────────────

describe('Collapse rendering', () => {
  test('renders all items with headers and content', () => {
    const view = Collapse({ items: ITEMS });
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    const items = container.querySelectorAll('.ds-collapse__item');
    expect(items.length).toBe(3);

    expect(items[0].querySelector('.ds-collapse__title').textContent).toBe('Section A');
    expect(items[1].querySelector('.ds-collapse__title').textContent).toBe('Section B');
    expect(items[2].querySelector('.ds-collapse__title').textContent).toBe('Section C');

    expect(items[0].querySelector('.ds-collapse__content p').textContent).toBe('Content A');

    view.destroy();
  });

  test('starts with all panels closed by default', () => {
    const view = Collapse({ items: ITEMS });
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    const items = container.querySelectorAll('.ds-collapse__item');
    items.forEach((item) => {
      expect(item.classList.contains('is-active')).toBe(false);
    });

    view.destroy();
  });

  test('defaultOpen opens specified panels', () => {
    const view = Collapse({ items: ITEMS, defaultOpen: [ 'b' ] });
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    const items = container.querySelectorAll('.ds-collapse__item');
    expect(items[0].classList.contains('is-active')).toBe(false);
    expect(items[1].classList.contains('is-active')).toBe(true);
    expect(items[2].classList.contains('is-active')).toBe(false);

    view.destroy();
  });
});

// ─── Toggle ──────────────────────────────────────────────────────────────────

describe('Collapse toggle', () => {
  test('clicking header toggles panel open', () => {
    const view = Collapse({ items: ITEMS });
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    const headers = container.querySelectorAll('.ds-collapse__header');
    headers[0].click();

    expect(container.querySelectorAll('.ds-collapse__item')[0].classList.contains('is-active')).toBe(true);

    view.destroy();
  });

  test('clicking header again toggles panel closed', () => {
    const view = Collapse({ items: ITEMS });
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    const headers = container.querySelectorAll('.ds-collapse__header');
    headers[0].click();
    headers[0].click();

    expect(container.querySelectorAll('.ds-collapse__item')[0].classList.contains('is-active')).toBe(false);

    view.destroy();
  });

  test('toggle() API works directly', () => {
    const view = Collapse({ items: ITEMS });
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    view.toggle('a');
    expect(view.getActiveKeys()).toEqual([ 'a' ]);

    view.toggle('a');
    expect(view.getActiveKeys()).toEqual([]);

    view.destroy();
  });

  test('multiple panels can be open in non-accordion mode', () => {
    const view = Collapse({ items: ITEMS });
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    view.open('a');
    view.open('b');
    expect(view.getActiveKeys().sort()).toEqual([ 'a', 'b' ]);

    view.destroy();
  });
});

// ─── Accordion mode ──────────────────────────────────────────────────────────

describe('Collapse accordion mode', () => {
  test('opening one panel closes others', () => {
    const view = Collapse({ items: ITEMS, accordion: true });
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    view.open('a');
    expect(view.getActiveKeys()).toEqual([ 'a' ]);

    view.open('b');
    expect(view.getActiveKeys()).toEqual([ 'b' ]);

    const items = container.querySelectorAll('.ds-collapse__item');
    expect(items[0].classList.contains('is-active')).toBe(false);
    expect(items[1].classList.contains('is-active')).toBe(true);

    view.destroy();
  });
});

// ─── open / close API ────────────────────────────────────────────────────────

describe('Collapse open/close API', () => {
  test('open() adds panel to active set', () => {
    const view = Collapse({ items: ITEMS });
    view.open('c');
    expect(view.getActiveKeys()).toContain('c');
    view.destroy();
  });

  test('close() removes panel from active set', () => {
    const view = Collapse({ items: ITEMS, defaultOpen: [ 'a', 'b' ] });
    view.close('a');
    expect(view.getActiveKeys()).toEqual([ 'b' ]);
    view.destroy();
  });

  test('open() is idempotent', () => {
    const view = Collapse({ items: ITEMS });
    view.open('a');
    view.open('a');
    expect(view.getActiveKeys()).toEqual([ 'a' ]);
    view.destroy();
  });

  test('close() is idempotent', () => {
    const view = Collapse({ items: ITEMS });
    view.close('a'); // not open, should be no-op
    expect(view.getActiveKeys()).toEqual([]);
    view.destroy();
  });
});

// ─── onChange callback ───────────────────────────────────────────────────────

describe('Collapse onChange', () => {
  test('calls onChange when panel is toggled', () => {
    const onChange = jest.fn();
    const view = Collapse({ items: ITEMS, onChange });
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    view.toggle('a');
    expect(onChange).toHaveBeenCalledWith([ 'a' ]);

    view.toggle('b');
    expect(onChange).toHaveBeenCalledWith([ 'a', 'b' ]);

    view.destroy();
  });
});

// ─── onSelect callback ───────────────────────────────────────────────────────

describe('Collapse onSelect', () => {
  test('clicking a non-expandable item calls onSelect', () => {
    const onSelect = jest.fn();
    const leaf = { key: 'leaf', title: 'Leaf item' };
    const view = Collapse({ items: [ leaf ], onSelect });
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    container.querySelector('.ds-collapse__header').click();

    expect(onSelect).toHaveBeenCalledWith(leaf);
    expect(view.getActiveKeys()).toEqual([]);

    view.destroy();
  });

  test('clicking an expandable item toggles it without calling onSelect', () => {
    const onSelect = jest.fn();
    const view = Collapse({ items: ITEMS, onSelect });
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    container.querySelector('.ds-collapse__header').click();

    expect(onSelect).not.toHaveBeenCalled();
    expect(view.getActiveKeys()).toEqual([ 'a' ]);

    view.destroy();
  });
});

// ─── Destroy ─────────────────────────────────────────────────────────────────

describe('Collapse destroy', () => {
  test('destroy cleans up', () => {
    const view = Collapse({ items: ITEMS });
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    view.destroy();
    // Should not throw
  });
});
