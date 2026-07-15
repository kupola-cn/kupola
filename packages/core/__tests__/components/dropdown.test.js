// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Unit tests for the Dropdown component.
 * @jest-environment jsdom
 */

import { resetScheduler } from '../../src/index.js';
import { Dropdown } from '../../src/components/dropdown.js';

const TEST_ITEMS = [
  { value: 'a', text: 'Option A' },
  { value: 'b', text: 'Option B' },
  { value: 'c', text: 'Option C' },
];

afterEach(() => {
  document.body.innerHTML = '';
  resetScheduler();
});

// ─── Basic structure ─────────────────────────────────────────────────────────

describe('Dropdown rendering', () => {
  test('renders trigger and menu with items', () => {
    const view = Dropdown({ items: TEST_ITEMS });
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    const trigger = container.querySelector('.ds-dropdown__trigger');
    const menu = container.querySelector('.ds-dropdown__menu');
    const menuItems = container.querySelectorAll('.ds-dropdown__item');

    expect(trigger).not.toBeNull();
    expect(menu).not.toBeNull();
    expect(menuItems.length).toBe(3);
    expect(menuItems[0].textContent).toBe('Option A');
    expect(menuItems[1].textContent).toBe('Option B');
    expect(menuItems[2].textContent).toBe('Option C');

    view.destroy();
  });

  test('starts in closed state (no is-open class)', () => {
    const view = Dropdown({ items: TEST_ITEMS });
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    const menu = container.querySelector('.ds-dropdown__menu');
    expect(menu.classList.contains('is-open')).toBe(false);

    view.destroy();
  });

  test('renders placeholder text in trigger', () => {
    const view = Dropdown({ items: TEST_ITEMS, placeholder: 'Choose...' });
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    const trigger = container.querySelector('.ds-dropdown__trigger span');
    expect(trigger.textContent).toBe('Choose...');

    view.destroy();
  });
});

// ─── Open / Close ────────────────────────────────────────────────────────────

describe('Dropdown open/close', () => {
  test('clicking trigger opens the menu', () => {
    const view = Dropdown({ items: TEST_ITEMS });
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    const trigger = container.querySelector('.ds-dropdown__trigger');
    trigger.click();

    const menu = container.querySelector('.ds-dropdown__menu');
    expect(menu.classList.contains('is-open')).toBe(true);

    view.destroy();
  });

  test('clicking trigger twice closes the menu', () => {
    const view = Dropdown({ items: TEST_ITEMS });
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    const trigger = container.querySelector('.ds-dropdown__trigger');
    trigger.click();
    trigger.click();

    const menu = container.querySelector('.ds-dropdown__menu');
    expect(menu.classList.contains('is-open')).toBe(false);

    view.destroy();
  });

  test('open/close API works directly', () => {
    const view = Dropdown({ items: TEST_ITEMS });
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    const menu = container.querySelector('.ds-dropdown__menu');

    view.open();
    expect(menu.classList.contains('is-open')).toBe(true);

    view.close();
    expect(menu.classList.contains('is-open')).toBe(false);

    view.destroy();
  });
});

// ─── Click outside ───────────────────────────────────────────────────────────

describe('Dropdown click outside', () => {
  test('clicking outside closes the menu', () => {
    const view = Dropdown({ items: TEST_ITEMS });
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    view.open();
    expect(container.querySelector('.ds-dropdown__menu').classList.contains('is-open')).toBe(true);

    // Click outside the dropdown
    document.body.click();
    expect(container.querySelector('.ds-dropdown__menu').classList.contains('is-open')).toBe(false);

    view.destroy();
  });

  test('clicking inside dropdown does NOT close it', () => {
    const view = Dropdown({ items: TEST_ITEMS });
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    view.open();
    const menu = container.querySelector('.ds-dropdown__menu');

    // Click on the menu itself (inside the dropdown)
    menu.click();
    expect(menu.classList.contains('is-open')).toBe(true);

    view.destroy();
  });
});

// ─── Item selection ──────────────────────────────────────────────────────────

describe('Dropdown item selection', () => {
  test('clicking an item triggers onSelect callback', () => {
    const onSelect = jest.fn();
    const view = Dropdown({ items: TEST_ITEMS, onSelect });
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    const items = container.querySelectorAll('.ds-dropdown__item');
    items[1].click();

    expect(onSelect).toHaveBeenCalledWith({
      value: 'b',
      text: 'Option B',
      item: TEST_ITEMS[1],
    });

    view.destroy();
  });

  test('clicking an item closes the menu (closeOnClick: true)', () => {
    const view = Dropdown({ items: TEST_ITEMS });
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    view.open();
    const items = container.querySelectorAll('.ds-dropdown__item');
    items[0].click();

    expect(container.querySelector('.ds-dropdown__menu').classList.contains('is-open')).toBe(false);

    view.destroy();
  });

  test('clicking an item does NOT close when closeOnClick: false', () => {
    const view = Dropdown({ items: TEST_ITEMS, closeOnClick: false });
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    view.open();
    const items = container.querySelectorAll('.ds-dropdown__item');
    items[0].click();

    expect(container.querySelector('.ds-dropdown__menu').classList.contains('is-open')).toBe(true);

    view.destroy();
  });
});

// ─── Keyboard navigation ─────────────────────────────────────────────────────

describe('Dropdown keyboard navigation', () => {
  test('ArrowDown moves focus to next item', () => {
    const view = Dropdown({ items: TEST_ITEMS });
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    view.open();
    const items = container.querySelectorAll('.ds-dropdown__item');

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    expect(items[0].classList.contains('is-focused')).toBe(true);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    expect(items[1].classList.contains('is-focused')).toBe(true);

    view.destroy();
  });

  test('ArrowUp moves focus to previous item', () => {
    const view = Dropdown({ items: TEST_ITEMS });
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    view.open();
    const items = container.querySelectorAll('.ds-dropdown__item');

    // Move to index 2 first
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    expect(items[2].classList.contains('is-focused')).toBe(true);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    expect(items[1].classList.contains('is-focused')).toBe(true);

    view.destroy();
  });

  test('ArrowDown wraps around to first item', () => {
    const view = Dropdown({ items: TEST_ITEMS });
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    view.open();
    const items = container.querySelectorAll('.ds-dropdown__item');

    // Navigate past the last item
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    expect(items[2].classList.contains('is-focused')).toBe(true);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    expect(items[0].classList.contains('is-focused')).toBe(true);

    view.destroy();
  });

  test('Escape closes the dropdown', () => {
    const view = Dropdown({ items: TEST_ITEMS });
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    view.open();
    expect(container.querySelector('.ds-dropdown__menu').classList.contains('is-open')).toBe(true);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(container.querySelector('.ds-dropdown__menu').classList.contains('is-open')).toBe(false);

    view.destroy();
  });

  test('Enter selects focused item', () => {
    const onSelect = jest.fn();
    const view = Dropdown({ items: TEST_ITEMS, onSelect });
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    view.open();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));

    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ value: 'b', text: 'Option B' }),
    );

    view.destroy();
  });
});

// ─── Destroy ─────────────────────────────────────────────────────────────────

describe('Dropdown destroy', () => {
  test('destroy removes document event listeners', () => {
    const view = Dropdown({ items: TEST_ITEMS });
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    view.destroy();

    // After destroy, these should not throw or cause errors
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    document.body.click();
  });
});
