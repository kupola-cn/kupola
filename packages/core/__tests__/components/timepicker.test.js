// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Unit tests for the Timepicker component.
 * @jest-environment jsdom
 */

import { resetScheduler } from '../../src/index.js';
import { Timepicker } from '../../src/components/timepicker.js';

afterEach(() => {
  document.body.innerHTML = '';
  resetScheduler();
});

// ─── Basic rendering ─────────────────────────────────────────────────────────

describe('Timepicker rendering', () => {
  test('renders a timepicker wrapper', () => {
    const view = Timepicker();
    document.body.appendChild(view.element);

    const wrapper = document.body.querySelector('.ds-timepicker');
    expect(wrapper).not.toBeNull();
  });

  test('renders an input field', () => {
    const view = Timepicker();
    document.body.appendChild(view.element);

    const input = document.body.querySelector('.ds-timepicker__input');
    expect(input).not.toBeNull();
  });

  test('renders hour and minute grids', () => {
    const view = Timepicker();
    document.body.appendChild(view.element);

    const hourGrid = document.body.querySelector('.ds-timepicker__grid--hour');
    const minGrid = document.body.querySelector('.ds-timepicker__grid--minute');
    expect(hourGrid).not.toBeNull();
    expect(minGrid).not.toBeNull();
  });

  test('populates 24 hour items in 24h format', () => {
    const view = Timepicker({ format: '24h' });
    document.body.appendChild(view.element);

    const hourItems = document.body.querySelectorAll('.ds-timepicker__grid--hour .ds-timepicker__item');
    expect(hourItems.length).toBe(24);
  });

  test('populates 12 hour items in 12h format', () => {
    const view = Timepicker({ format: '12h' });
    document.body.appendChild(view.element);

    const hourItems = document.body.querySelectorAll('.ds-timepicker__grid--hour .ds-timepicker__item');
    expect(hourItems.length).toBe(12);
  });

  test('populates minute items based on step', () => {
    const view = Timepicker({ step: 15 });
    document.body.appendChild(view.element);

    const minItems = document.body.querySelectorAll('.ds-timepicker__grid--minute .ds-timepicker__item');
    expect(minItems.length).toBe(4); // 0, 15, 30, 45
  });

  test('panel is hidden by default', () => {
    const view = Timepicker();
    document.body.appendChild(view.element);

    const panel = document.body.querySelector('.ds-timepicker__panel');
    expect(panel.style.display).toBe('none');
  });
});

// ─── Value handling ──────────────────────────────────────────────────────────

describe('Timepicker value', () => {
  test('sets initial value', () => {
    const view = Timepicker({ value: '14:30' });
    document.body.appendChild(view.element);

    expect(view.getValue()).toBe('14:30');
    const input = document.body.querySelector('.ds-timepicker__input');
    expect(input.value).toBe('14:30');
  });

  test('setValue updates the input', () => {
    const view = Timepicker();
    document.body.appendChild(view.element);

    view.setValue('09:15');
    expect(view.getValue()).toBe('09:15');
    const input = document.body.querySelector('.ds-timepicker__input');
    expect(input.value).toBe('09:15');
  });

  test('clicking a hour item selects time', () => {
    const onChange = jest.fn();
    const view = Timepicker({ format: '24h', onChange });
    document.body.appendChild(view.element);

    // Open panel
    const input = document.body.querySelector('.ds-timepicker__input');
    input.click();

    // Click hour 10
    const hourItems = document.body.querySelectorAll('.ds-timepicker__grid--hour .ds-timepicker__item');
    hourItems[10].click();

    expect(view.getValue()).toMatch(/^10:/);
    expect(onChange).toHaveBeenCalled();
  });

  test('clicking a minute item selects time', () => {
    const onChange = jest.fn();
    const view = Timepicker({ value: '10:00', format: '24h', onChange });
    document.body.appendChild(view.element);

    // Open panel
    const input = document.body.querySelector('.ds-timepicker__input');
    input.click();

    // Click minute 30
    const minItems = document.body.querySelectorAll('.ds-timepicker__grid--minute .ds-timepicker__item');
    const idx30 = Array.from(minItems).findIndex(el => el.textContent === '30');
    minItems[idx30].click();

    expect(view.getValue()).toBe('10:30');
    expect(onChange).toHaveBeenCalled();
  });
});

// ─── Panel toggle ────────────────────────────────────────────────────────────

describe('Timepicker panel', () => {
  test('clicking input toggles panel open', () => {
    const view = Timepicker();
    document.body.appendChild(view.element);

    const input = document.body.querySelector('.ds-timepicker__input');
    const panel = document.body.querySelector('.ds-timepicker__panel');

    input.click();
    expect(panel.style.display).toBe('block');
  });

  test('clicking input twice closes panel', () => {
    const view = Timepicker();
    document.body.appendChild(view.element);

    const input = document.body.querySelector('.ds-timepicker__input');
    const panel = document.body.querySelector('.ds-timepicker__panel');

    input.click();
    expect(panel.style.display).toBe('block');
    input.click();
    expect(panel.style.display).toBe('none');
  });
});

// ─── Disabled state ──────────────────────────────────────────────────────────

describe('Timepicker disabled', () => {
  test('input is disabled when disabled=true', () => {
    const view = Timepicker({ disabled: true });
    document.body.appendChild(view.element);

    const input = document.body.querySelector('.ds-timepicker__input');
    expect(input.disabled).toBe(true);
  });
});

// ─── Destroy ─────────────────────────────────────────────────────────────────

describe('Timepicker destroy', () => {
  test('destroy cleans up', () => {
    const view = Timepicker();
    document.body.appendChild(view.element);

    expect(() => view.destroy()).not.toThrow();
  });
});
