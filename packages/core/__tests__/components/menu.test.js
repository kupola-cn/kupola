// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Unit tests for the Menu component.
 * @jest-environment jsdom
 */

import { resetScheduler } from '../../src/scheduler.js';
import { Menu } from '@kupola/components';

afterEach(() => {
  document.body.innerHTML = '';
  resetScheduler();
});

// ─── Basic rendering ─────────────────────────────────────────────────────────

describe('Menu rendering', () => {
  test('renders a menu wrapper', () => {
    const view = Menu({ items: [ { label: 'Item' } ] });
    document.body.appendChild(view.element);

    expect(document.body.querySelector('.ds-menu')).not.toBeNull();
  });

  test('renders correct number of items', () => {
    const view = Menu({ items: [ { label: 'A' }, { label: 'B' }, { label: 'C' } ] });
    document.body.appendChild(view.element);

    const items = document.body.querySelectorAll('.ds-menu__item');
    expect(items.length).toBe(3);
  });

  test('renders item labels', () => {
    const view = Menu({ items: [ { label: 'Edit' }, { label: 'Copy' } ] });
    document.body.appendChild(view.element);

    const items = document.body.querySelectorAll('.ds-menu__item');
    expect(items[0].textContent).toContain('Edit');
    expect(items[1].textContent).toContain('Copy');
  });
});

// ─── Item variants ───────────────────────────────────────────────────────────

describe('Menu item variants', () => {
  test('renders danger items with danger class', () => {
    const view = Menu({ items: [ { label: 'Delete', danger: true } ] });
    document.body.appendChild(view.element);

    const item = document.body.querySelector('.ds-menu__item');
    expect(item.classList.contains('ds-menu__item--danger')).toBe(true);
  });

  test('renders dividers', () => {
    const view = Menu({ items: [ { label: 'A' }, { type: 'divider' }, { label: 'B' } ] });
    document.body.appendChild(view.element);

    const divider = document.body.querySelector('.ds-menu__divider');
    expect(divider).not.toBeNull();
  });

  test('renders shortcut text', () => {
    const view = Menu({ items: [ { label: 'Copy', shortcut: 'Ctrl+C' } ] });
    document.body.appendChild(view.element);

    const shortcut = document.body.querySelector('.ds-menu__shortcut');
    expect(shortcut).not.toBeNull();
    expect(shortcut.textContent).toBe('Ctrl+C');
  });

  test('renders icon when provided', () => {
    const view = Menu({ items: [ { label: 'Edit', icon: '✏' } ] });
    document.body.appendChild(view.element);

    const icon = document.body.querySelector('.ds-menu__item .icon');
    expect(icon).not.toBeNull();
    expect(icon.textContent).toBe('✏');
  });

  test('disabled items have reduced opacity', () => {
    const view = Menu({ items: [ { label: 'Disabled', disabled: true } ] });
    document.body.appendChild(view.element);

    const item = document.body.querySelector('.ds-menu__item');
    expect(item.style.opacity).toBe('0.5');
    expect(item.style.pointerEvents).toBe('none');
  });
});

// ─── Click handling ──────────────────────────────────────────────────────────

describe('Menu click handling', () => {
  test('item onClick fires', () => {
    const onClick = jest.fn();
    const view = Menu({ items: [ { label: 'Click', onClick } ] });
    document.body.appendChild(view.element);

    document.body.querySelector('.ds-menu__item').click();
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  test('onSelect fires with item data', () => {
    const onSelect = jest.fn();
    const item = { label: 'Test', onClick: jest.fn() };
    const view = Menu({ items: [ item ], onSelect });
    document.body.appendChild(view.element);

    document.body.querySelector('.ds-menu__item').click();
    expect(onSelect).toHaveBeenCalledWith(item);
  });

  test('disabled item does not fire onClick', () => {
    const onClick = jest.fn();
    const view = Menu({ items: [ { label: 'Disabled', disabled: true, onClick } ] });
    document.body.appendChild(view.element);

    document.body.querySelector('.ds-menu__item').click();
    expect(onClick).not.toHaveBeenCalled();
  });
});

// ─── Destroy ─────────────────────────────────────────────────────────────────

describe('Menu destroy', () => {
  test('destroy cleans up', () => {
    const view = Menu({ items: [ { label: 'A' } ] });
    document.body.appendChild(view.element);

    expect(() => view.destroy()).not.toThrow();
  });
});
