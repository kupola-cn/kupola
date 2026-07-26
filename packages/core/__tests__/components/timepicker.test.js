// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Unit tests for the Timepicker component.
 * @jest-environment jsdom
 */

import { resetScheduler } from '../../src/scheduler.js';
import { TimePicker as Timepicker } from '@kupola/components';

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

  test('preserves the clock icon and creates unique aria controls', () => {
    const first = Timepicker();
    const second = Timepicker();
    document.body.append(first.element, second.element);
    const inputs = document.querySelectorAll('.ds-timepicker__input');
    expect(inputs[0].getAttribute('aria-controls')).not.toBe(
      inputs[1].getAttribute('aria-controls'),
    );
    expect(document.querySelector('.ds-timepicker__icon svg')).not.toBeNull();
    first.destroy();
    second.destroy();
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

  test('rejects invalid and out-of-range values', () => {
    const view = Timepicker({ value: '25:99', minTime: '09:00', maxTime: '17:00' });
    document.body.appendChild(view.element);
    expect(view.getValue()).toBe('');
    view.setValue('08:59');
    expect(view.getValue()).toBe('');
    view.setValue('9:30');
    expect(view.getValue()).toBe('09:30');
    view.setValue('17:01');
    expect(view.getValue()).toBe('09:30');
    view.destroy();
  });

  test('clear resets the value once and notifies onChange', () => {
    const onChange = jest.fn();
    const view = Timepicker({ value: '10:30', onChange });
    document.body.appendChild(view.element);
    view.clear();
    expect(view.getValue()).toBe('');
    expect(onChange).toHaveBeenLastCalledWith('');
    view.clear();
    expect(onChange).toHaveBeenCalledTimes(1);
    view.destroy();
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

  test('12h period control converts between AM and PM', () => {
    const view = Timepicker({ value: '09:15', format: '12h' });
    document.body.appendChild(view.element);
    const pm = document.querySelector('[data-period="PM"]');
    pm.click();
    expect(view.getValue()).toBe('21:15');
    expect(pm.classList.contains('is-selected')).toBe(true);
    document.querySelector('[data-period="AM"]').click();
    expect(view.getValue()).toBe('09:15');
    view.destroy();
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

  test('only acquires document listeners while open', () => {
    const addSpy = jest.spyOn(document, 'addEventListener');
    const removeSpy = jest.spyOn(document, 'removeEventListener');
    const view = Timepicker();
    expect(addSpy.mock.calls.some(([ event ]) => event === 'click' || event === 'keydown')).toBe(false);
    view.open();
    expect(addSpy.mock.calls.some(([ event ]) => event === 'click')).toBe(true);
    expect(addSpy.mock.calls.some(([ event ]) => event === 'keydown')).toBe(true);
    view.close();
    expect(removeSpy.mock.calls.some(([ event ]) => event === 'click')).toBe(true);
    expect(removeSpy.mock.calls.some(([ event ]) => event === 'keydown')).toBe(true);
    addSpy.mockRestore();
    removeSpy.mockRestore();
    view.destroy();
  });

  test('Escape closes only the most recently opened picker', () => {
    const first = Timepicker();
    const second = Timepicker();
    document.body.append(first.element, second.element);
    first.open();
    second.open();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(first.isOpen()).toBe(true);
    expect(second.isOpen()).toBe(false);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(first.isOpen()).toBe(false);
    first.destroy();
    second.destroy();
  });

  test('Tab closes without preventing focus navigation', () => {
    const view = Timepicker();
    document.body.appendChild(view.element);
    view.open();
    const event = new KeyboardEvent('keydown', { key: 'Tab', cancelable: true });
    document.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
    expect(view.isOpen()).toBe(false);
    view.destroy();
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

    view.open();
    expect(() => view.destroy()).not.toThrow();
    expect(view.isOpen()).toBe(false);
    expect(() => view.destroy()).not.toThrow();
    view.open();
    expect(view.isOpen()).toBe(false);
  });
});
