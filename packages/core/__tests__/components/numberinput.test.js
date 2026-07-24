// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Unit tests for the NumberInput component.
 * @jest-environment jsdom
 */

import { resetScheduler } from '../../src/scheduler.js';
import { NumberInput } from '@kupola/components';

afterEach(() => {
  document.body.innerHTML = '';
  resetScheduler();
});

// ─── Basic rendering ─────────────────────────────────────────────────────────

describe('NumberInput rendering', () => {
  test('renders a number input wrapper', () => {
    const view = NumberInput();
    document.body.appendChild(view.element);

    const wrapper = document.body.querySelector('.ds-number-input');
    expect(wrapper).not.toBeNull();
  });

  test('renders decrease button, input, and increase button', () => {
    const view = NumberInput();
    document.body.appendChild(view.element);

    expect(document.body.querySelector('.ds-number-input__btn--decrease')).not.toBeNull();
    expect(document.body.querySelector('.ds-number-input__input')).not.toBeNull();
    expect(document.body.querySelector('.ds-number-input__btn--increase')).not.toBeNull();
  });

  test('sets initial value', () => {
    const view = NumberInput({ value: 42 });
    document.body.appendChild(view.element);

    expect(view.getValue()).toBe(42);
    const input = document.body.querySelector('.ds-number-input__input');
    expect(input.value).toBe('42');
  });
});

// ─── Increment/Decrement ─────────────────────────────────────────────────────

describe('NumberInput increment/decrement', () => {
  test('increase button increments value', () => {
    const onChange = jest.fn();
    const view = NumberInput({ value: 5, step: 1, onChange });
    document.body.appendChild(view.element);

    const incBtn = document.body.querySelector('.ds-number-input__btn--increase');
    incBtn.click();

    expect(view.getValue()).toBe(6);
    expect(onChange).toHaveBeenCalledWith(6);
  });

  test('decrease button decrements value', () => {
    const onChange = jest.fn();
    const view = NumberInput({ value: 5, step: 1, onChange });
    document.body.appendChild(view.element);

    const decBtn = document.body.querySelector('.ds-number-input__btn--decrease');
    decBtn.click();

    expect(view.getValue()).toBe(4);
    expect(onChange).toHaveBeenCalledWith(4);
  });

  test('respects custom step', () => {
    const view = NumberInput({ value: 10, step: 5 });
    document.body.appendChild(view.element);

    const incBtn = document.body.querySelector('.ds-number-input__btn--increase');
    incBtn.click();

    expect(view.getValue()).toBe(15);
  });
});

// ─── Min/Max clamping ────────────────────────────────────────────────────────

describe('NumberInput min/max', () => {
  test('clamps initial value to min', () => {
    const view = NumberInput({ min: 0, max: 100, value: -5 });
    document.body.appendChild(view.element);

    expect(view.getValue()).toBe(0);
  });

  test('clamps initial value to max', () => {
    const view = NumberInput({ min: 0, max: 100, value: 200 });
    document.body.appendChild(view.element);

    expect(view.getValue()).toBe(100);
  });

  test('decrease button disabled at min', () => {
    const view = NumberInput({ min: 0, max: 100, value: 0 });
    document.body.appendChild(view.element);

    const decBtn = document.body.querySelector('.ds-number-input__btn--decrease');
    expect(decBtn.disabled).toBe(true);
  });

  test('increase button disabled at max', () => {
    const view = NumberInput({ min: 0, max: 100, value: 100 });
    document.body.appendChild(view.element);

    const incBtn = document.body.querySelector('.ds-number-input__btn--increase');
    expect(incBtn.disabled).toBe(true);
  });

  test('setValue clamps to range', () => {
    const view = NumberInput({ min: 0, max: 100 });
    document.body.appendChild(view.element);

    view.setValue(150);
    expect(view.getValue()).toBe(100);
  });
});

// ─── Disabled ────────────────────────────────────────────────────────────────

describe('NumberInput disabled', () => {
  test('disabled state applied to input', () => {
    const view = NumberInput({ disabled: true });
    document.body.appendChild(view.element);

    const input = document.body.querySelector('.ds-number-input__input');
    expect(input.disabled).toBe(true);
  });
});

// ─── Destroy ─────────────────────────────────────────────────────────────────

describe('NumberInput destroy', () => {
  test('destroy() cleans up event listeners', () => {
    const onChange = jest.fn();
    const view = NumberInput({ value: 5, onChange });
    document.body.appendChild(view.element);

    view.destroy();

    const incBtn = document.body.querySelector('.ds-number-input__btn--increase');
    if (incBtn) {
      incBtn.click();
      expect(onChange).not.toHaveBeenCalled();
    }
  });
});
