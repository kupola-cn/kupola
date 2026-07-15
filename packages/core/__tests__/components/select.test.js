// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Unit tests for the Select component.
 * @jest-environment jsdom
 */

import { html, resetScheduler } from '../../src/index.js';
import { Select } from '../../src/components/select.js';

const ITEMS = [
  { value: 'a', text: 'Alpha' },
  { value: 'b', text: 'Beta' },
  { value: 'c', text: 'Gamma' },
];

afterEach(() => {
  document.body.innerHTML = '';
  resetScheduler();
});

// ─── Rendering ───────────────────────────────────────────────────────────────

describe('Select rendering', () => {
  test('renders trigger with placeholder', () => {
    const view = Select({ items: ITEMS, placeholder: 'Choose...' });
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    const trigger = container.querySelector('.ds-select__trigger');
    const value = container.querySelector('.ds-select__value');
    expect(trigger).not.toBeNull();
    expect(value).not.toBeNull();
    expect(value.textContent).toBe('Choose...');
    expect(value.classList.contains('ds-select__value--placeholder')).toBe(true);
    view.destroy();
  });

  test('renders all items in menu', () => {
    const view = Select({ items: ITEMS });
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    const menuItems = container.querySelectorAll('.ds-select__item');
    expect(menuItems.length).toBe(3);
    expect(menuItems[0].textContent).toBe('Alpha');
    expect(menuItems[1].textContent).toBe('Beta');
    expect(menuItems[2].textContent).toBe('Gamma');
    view.destroy();
  });

  test('renders with initial value', () => {
    const view = Select({ items: ITEMS, value: 'b' });
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    const valueEl = container.querySelector('.ds-select__value');
    expect(valueEl.textContent).toBe('Beta');
    expect(valueEl.classList.contains('ds-select__value--placeholder')).toBe(false);

    const activeItem = container.querySelector('.ds-select__item.is-active');
    expect(activeItem).not.toBeNull();
    expect(activeItem.getAttribute('data-value')).toBe('b');
    view.destroy();
  });

  test('renders search input when searchable', () => {
    const view = Select({ items: ITEMS, searchable: true });
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    const searchInput = container.querySelector('.ds-select__search-input');
    expect(searchInput).not.toBeNull();
    view.destroy();
  });

  test('renders clear button when clearable', () => {
    const view = Select({ items: ITEMS, clearable: true });
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    const clearBtn = container.querySelector('.ds-select__clear');
    expect(clearBtn).not.toBeNull();
    view.destroy();
  });
});

// ─── Open/Close ──────────────────────────────────────────────────────────────

describe('Select open/close', () => {
  test('opens on trigger click', () => {
    const view = Select({ items: ITEMS });
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    const wrap = container.querySelector('.ds-select');
    const trigger = container.querySelector('.ds-select__trigger');
    trigger.click();

    expect(wrap.classList.contains('is-open')).toBe(true);
    view.destroy();
  });

  test('closes on second trigger click (toggle)', () => {
    const view = Select({ items: ITEMS });
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    const wrap = container.querySelector('.ds-select');
    const trigger = container.querySelector('.ds-select__trigger');
    trigger.click();
    expect(wrap.classList.contains('is-open')).toBe(true);
    trigger.click();
    expect(wrap.classList.contains('is-open')).toBe(false);
    view.destroy();
  });

  test('closes on outside click', () => {
    const view = Select({ items: ITEMS });
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    const wrap = container.querySelector('.ds-select');
    view.open();
    expect(wrap.classList.contains('is-open')).toBe(true);

    document.body.click();
    expect(wrap.classList.contains('is-open')).toBe(false);
    view.destroy();
  });

  test('closes on Escape key', () => {
    const view = Select({ items: ITEMS });
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    const wrap = container.querySelector('.ds-select');
    view.open();
    expect(wrap.classList.contains('is-open')).toBe(true);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(wrap.classList.contains('is-open')).toBe(false);
    view.destroy();
  });
});

// ─── Selection ───────────────────────────────────────────────────────────────

describe('Select item selection', () => {
  test('selects item on click', () => {
    const onChange = jest.fn();
    const view = Select({ items: ITEMS, onChange });
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    const items = container.querySelectorAll('.ds-select__item');
    items[1].click();

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ value: 'b', text: 'Beta' }),
    );
    expect(view.getValue()).toBe('b');

    const valueEl = container.querySelector('.ds-select__value');
    expect(valueEl.textContent).toBe('Beta');
    view.destroy();
  });

  test('closes after selection in single mode', () => {
    const view = Select({ items: ITEMS });
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    const wrap = container.querySelector('.ds-select');
    view.open();
    expect(wrap.classList.contains('is-open')).toBe(true);

    const items = container.querySelectorAll('.ds-select__item');
    items[0].click();
    expect(wrap.classList.contains('is-open')).toBe(false);
    view.destroy();
  });

  test('supports multiple selection', () => {
    const view = Select({ items: ITEMS, multiple: true });
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    const menuItems = container.querySelectorAll('.ds-select__item');
    menuItems[0].click();
    menuItems[2].click();

    expect(view.getValue()).toEqual([ 'a', 'c' ]);
    const valueEl = container.querySelector('.ds-select__value');
    expect(valueEl.textContent).toBe('2 selected');
    view.destroy();
  });

  test('deselects in multiple mode on second click', () => {
    const view = Select({ items: ITEMS, multiple: true, values: [ 'a', 'b' ] });
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    expect(view.getValue()).toEqual([ 'a', 'b' ]);

    const menuItems = container.querySelectorAll('.ds-select__item');
    menuItems[0].click(); // Deselect 'a'

    expect(view.getValue()).toEqual([ 'b' ]);
    view.destroy();
  });
});

// ─── Search ──────────────────────────────────────────────────────────────────

describe('Select search filter', () => {
  test('filters items by search query', () => {
    const view = Select({ items: ITEMS, searchable: true });
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    view.open();

    const searchInput = container.querySelector('.ds-select__search-input');
    searchInput.value = 'bet';
    searchInput.dispatchEvent(new Event('input'));

    const menuItems = container.querySelectorAll('.ds-select__item');
    expect(menuItems.length).toBe(1);
    expect(menuItems[0].textContent).toBe('Beta');
    view.destroy();
  });

  test('shows all items when search is cleared', () => {
    const view = Select({ items: ITEMS, searchable: true });
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    view.open();

    const searchInput = container.querySelector('.ds-select__search-input');
    searchInput.value = 'bet';
    searchInput.dispatchEvent(new Event('input'));
    expect(container.querySelectorAll('.ds-select__item').length).toBe(1);

    searchInput.value = '';
    searchInput.dispatchEvent(new Event('input'));
    expect(container.querySelectorAll('.ds-select__item').length).toBe(3);
    view.destroy();
  });
});

// ─── setValue / clear ────────────────────────────────────────────────────────

describe('Select setValue and clear', () => {
  test('setValue updates selection', () => {
    const view = Select({ items: ITEMS });
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    view.setValue('c');
    expect(view.getValue()).toBe('c');

    const valueEl = container.querySelector('.ds-select__value');
    expect(valueEl.textContent).toBe('Gamma');
    view.destroy();
  });

  test('clear button resets selection', () => {
    const onChange = jest.fn();
    const view = Select({ items: ITEMS, value: 'a', clearable: true, onChange });
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    const clearBtn = container.querySelector('.ds-select__clear');
    clearBtn.click();

    expect(view.getValue()).toBe('');
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ value: '', text: '' }),
    );

    const valueEl = container.querySelector('.ds-select__value');
    expect(valueEl.textContent).toBe('Select...');
    view.destroy();
  });
});

// ─── Keyboard navigation ─────────────────────────────────────────────────────

describe('Select keyboard navigation', () => {
  test('ArrowDown focuses next item', () => {
    const view = Select({ items: ITEMS });
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    view.open();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));

    const menuItems = container.querySelectorAll('.ds-select__item');
    expect(menuItems[0].classList.contains('is-focused')).toBe(true);
    view.destroy();
  });

  test('Enter selects focused item', () => {
    const onChange = jest.fn();
    const view = Select({ items: ITEMS, onChange });
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    view.open();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ value: 'a', text: 'Alpha' }),
    );
    view.destroy();
  });
});

// ─── Destroy ─────────────────────────────────────────────────────────────────

describe('Select destroy', () => {
  test('cleans up on destroy', () => {
    const view = Select({ items: ITEMS });
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    // Should not throw
    view.destroy();
  });
});
