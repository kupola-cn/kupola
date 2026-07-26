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

  test('disabled items use native and ARIA disabled state', () => {
    const view = Menu({ items: [ { label: 'Disabled', disabled: true } ] });
    document.body.appendChild(view.element);

    const item = document.body.querySelector('.ds-menu__item');
    expect(item.tagName).toBe('BUTTON');
    expect(item.disabled).toBe(true);
    expect(item.getAttribute('aria-disabled')).toBe('true');
  });

  test('adds menu semantics for items and dividers', () => {
    const view = Menu({ items: [ { label: 'A' }, { divider: true } ] });
    document.body.appendChild(view.element);

    expect(document.querySelector('.ds-menu').getAttribute('role')).toBe('menu');
    expect(document.querySelector('.ds-menu__item').getAttribute('role')).toBe('menuitem');
    expect(document.querySelector('.ds-menu__divider').getAttribute('role')).toBe('separator');
    view.destroy();
  });

  test('renders and toggles nested submenus', () => {
    const view = Menu({
      items: [ { label: 'File', children: [ { label: 'Open' } ] } ],
    });
    document.body.appendChild(view.element);
    const parent = document.querySelector('.ds-menu__item');
    const submenu = document.querySelector('.ds-menu__submenu');

    expect(submenu.hidden).toBe(true);
    parent.click();
    expect(submenu.hidden).toBe(false);
    expect(parent.getAttribute('aria-expanded')).toBe('true');
    parent.click();
    expect(submenu.hidden).toBe(true);
    view.destroy();
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

  test('keyboard navigation skips disabled items and activates commands', () => {
    const onClick = jest.fn();
    const view = Menu({
      items: [
        { label: 'First' },
        { label: 'Disabled', disabled: true },
        { label: 'Last', onClick },
      ],
    });
    document.body.appendChild(view.element);
    const items = document.querySelectorAll('.ds-menu__item');

    items[0].focus();
    items[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(document.activeElement).toBe(items[2]);
    items[2].dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(onClick).toHaveBeenCalledTimes(1);
    view.destroy();
  });

  test('ArrowRight opens a submenu and focuses its first item', () => {
    const view = Menu({
      items: [ { label: 'File', children: [ { label: 'Open' }, { label: 'Save' } ] } ],
    });
    document.body.appendChild(view.element);
    const items = document.querySelectorAll('.ds-menu__item');

    items[0].focus();
    items[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(document.activeElement).toBe(items[1]);
    expect(document.querySelector('.ds-menu__submenu').hidden).toBe(false);
    items[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    expect(document.activeElement).toBe(items[0]);
    view.destroy();
  });
});

// ─── Destroy ─────────────────────────────────────────────────────────────────

describe('Menu destroy', () => {
  test('destroy cleans up', () => {
    const view = Menu({ items: [ { label: 'A' } ] });
    document.body.appendChild(view.element);

    const item = document.querySelector('.ds-menu__item');
    expect(() => view.destroy()).not.toThrow();
    expect(() => view.destroy()).not.toThrow();
    item.click();
  });
});
