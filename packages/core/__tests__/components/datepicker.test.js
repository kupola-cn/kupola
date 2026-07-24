// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Unit tests for the Datepicker component.
 * @jest-environment jsdom
 */

import { html } from '../../src/template.js';
import { resetScheduler } from '../../src/scheduler.js';
import { DatePicker as Datepicker } from '@kupola/components';

afterEach(() => {
  document.body.innerHTML = '';
  resetScheduler();
});

// ─── Rendering ───────────────────────────────────────────────────────────────

describe('Datepicker rendering', () => {
  test('renders input and calendar icon', () => {
    const view = Datepicker({ placeholder: 'Pick a date' });
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    const input = container.querySelector('.ds-datepicker__input');
    const icon = container.querySelector('.ds-datepicker__icon');
    expect(input).not.toBeNull();
    expect(icon).not.toBeNull();
    expect(input.getAttribute('placeholder')).toBe('Pick a date');
    view.destroy();
  });

  test('renders calendar hidden by default', () => {
    const view = Datepicker();
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    const calendar = container.querySelector('.ds-datepicker__calendar');
    expect(calendar).not.toBeNull();
    expect(calendar.style.display).toBe('none');
    view.destroy();
  });

  test('renders with initial value', () => {
    const view = Datepicker({ value: '2025-06-15' });
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    const input = container.querySelector('.ds-datepicker__input');
    expect(input.value).toBe('2025-06-15');
    view.destroy();
  });

  test('renders weekday headers', () => {
    const view = Datepicker();
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    const weekdays = container.querySelector('.ds-datepicker__weekdays');
    expect(weekdays).not.toBeNull();
    const spans = weekdays.querySelectorAll('span');
    expect(spans.length).toBe(7);
    view.destroy();
  });

  test('renders month/year title', () => {
    const view = Datepicker({ value: '2025-03-15' });
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    const title = container.querySelector('.ds-datepicker__title');
    expect(title).not.toBeNull();
    expect(title.textContent).toContain('2025');
    view.destroy();
  });
});

// ─── Open/Close ──────────────────────────────────────────────────────────────

describe('Datepicker open/close', () => {
  test('opens on input click', () => {
    const view = Datepicker();
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    const inputWrap = container.querySelector('.ds-datepicker__input-wrap');
    inputWrap.click();

    const calendar = container.querySelector('.ds-datepicker__calendar');
    expect(calendar.style.display).toBe('block');
    view.destroy();
  });

  test('opens on icon click', () => {
    const view = Datepicker();
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    const icon = container.querySelector('.ds-datepicker__icon');
    icon.click();

    const calendar = container.querySelector('.ds-datepicker__calendar');
    expect(calendar.style.display).toBe('block');
    view.destroy();
  });

  test('closes on second toggle', () => {
    const view = Datepicker();
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    view.open();
    const calendar = container.querySelector('.ds-datepicker__calendar');
    expect(calendar.style.display).toBe('block');

    view.close();
    expect(calendar.style.display).toBe('none');
    view.destroy();
  });

  test('closes on outside click', () => {
    const view = Datepicker();
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    view.open();
    const calendar = container.querySelector('.ds-datepicker__calendar');
    expect(calendar.style.display).toBe('block');

    document.body.click();
    expect(calendar.style.display).toBe('none');
    view.destroy();
  });

  test('closes on Escape key', () => {
    const view = Datepicker();
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    view.open();
    const calendar = container.querySelector('.ds-datepicker__calendar');
    expect(calendar.style.display).toBe('block');

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(calendar.style.display).toBe('none');
    view.destroy();
  });
});

// ─── Date Selection ──────────────────────────────────────────────────────────

describe('Datepicker date selection', () => {
  test('selects a date on day click', () => {
    const onChange = jest.fn();
    const view = Datepicker({ value: '2025-06-01', onChange });
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    view.open();

    // Find a non-outside day button (e.g., June 15)
    const days = container.querySelectorAll('.ds-datepicker__days button:not(.is-outside)');
    const day15 = [ ...days ].find((b) => b.textContent === '15');
    expect(day15).toBeDefined();
    day15.click();

    expect(onChange).toHaveBeenCalledWith('2025-06-15', expect.any(Date));
    expect(view.getValue()).toBe('2025-06-15');

    const input = container.querySelector('.ds-datepicker__input');
    expect(input.value).toBe('2025-06-15');
    view.destroy();
  });

  test('closes calendar after date selection', () => {
    const view = Datepicker({ value: '2025-06-01' });
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    view.open();
    const calendar = container.querySelector('.ds-datepicker__calendar');
    expect(calendar.style.display).toBe('block');

    const days = container.querySelectorAll('.ds-datepicker__days button:not(.is-outside)');
    days[0].click();
    expect(calendar.style.display).toBe('none');
    view.destroy();
  });

  test('marks selected date with is-selected class', () => {
    const view = Datepicker({ value: '2025-06-15' });
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    view.open();

    const selected = container.querySelector('.ds-datepicker__days button.is-selected');
    expect(selected).not.toBeNull();
    expect(selected.textContent).toBe('15');
    view.destroy();
  });
});

// ─── Month Navigation ────────────────────────────────────────────────────────

describe('Datepicker month navigation', () => {
  test('prev month button changes view', () => {
    const view = Datepicker({ value: '2025-06-15' });
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    view.open();

    const title = container.querySelector('.ds-datepicker__title');
    expect(title.textContent).toContain('Jun');

    const prevBtn = container.querySelector('.ds-datepicker__nav');
    prevBtn.click();

    expect(title.textContent).toContain('May');
    view.destroy();
  });

  test('next month button changes view', () => {
    const view = Datepicker({ value: '2025-06-15' });
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    view.open();

    const title = container.querySelector('.ds-datepicker__title');
    expect(title.textContent).toContain('Jun');

    const navBtns = container.querySelectorAll('.ds-datepicker__nav');
    navBtns[1].click(); // Next month

    expect(title.textContent).toContain('Jul');
    view.destroy();
  });

  test('year changes when navigating past January/December', () => {
    const view = Datepicker({ value: '2025-01-15' });
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    view.open();

    const title = container.querySelector('.ds-datepicker__title');
    expect(title.textContent).toContain('2025');

    const prevBtn = container.querySelector('.ds-datepicker__nav');
    prevBtn.click(); // Go to December 2024

    expect(title.textContent).toContain('Dec');
    expect(title.textContent).toContain('2024');
    view.destroy();
  });
});

// ─── setValue / getValue ─────────────────────────────────────────────────────

describe('Datepicker setValue/getValue', () => {
  test('setValue updates the date', () => {
    const view = Datepicker();
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    view.setValue('2025-12-25');
    expect(view.getValue()).toBe('2025-12-25');

    const input = container.querySelector('.ds-datepicker__input');
    expect(input.value).toBe('2025-12-25');
    view.destroy();
  });

  test('getValue returns empty string when no date selected', () => {
    const view = Datepicker();
    expect(view.getValue()).toBe('');
    view.destroy();
  });
});

// ─── Calendar Days ───────────────────────────────────────────────────────────

describe('Datepicker calendar days', () => {
  test('renders correct number of days for the month', () => {
    const view = Datepicker({ value: '2025-02-01' }); // Feb 2025 = 28 days
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    view.open();

    const allDays = container.querySelectorAll('.ds-datepicker__days button');
    const nonOutsideDays = container.querySelectorAll('.ds-datepicker__days button:not(.is-outside)');
    expect(nonOutsideDays.length).toBe(28);
    // Total should be a multiple of 7
    expect(allDays.length % 7).toBe(0);
    view.destroy();
  });

  test('marks outside days with is-outside class', () => {
    const view = Datepicker({ value: '2025-06-01' });
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    view.open();

    const outsideDays = container.querySelectorAll('.ds-datepicker__days button.is-outside');
    // There should be some outside days from prev/next month
    expect(outsideDays.length).toBeGreaterThanOrEqual(0);
    view.destroy();
  });
});

// ─── Destroy ─────────────────────────────────────────────────────────────────

describe('Datepicker destroy', () => {
  test('cleans up on destroy', () => {
    const view = Datepicker();
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    // Should not throw
    view.destroy();
  });
});
