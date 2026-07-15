// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Unit tests for the Radio component.
 * @jest-environment jsdom
 */

import { resetScheduler } from '../../src/index.js';
import { Radio } from '../../src/components/radio.js';

afterEach(() => {
  document.body.innerHTML = '';
  resetScheduler();
});

// ─── Basic rendering ─────────────────────────────────────────────────────────

describe('Radio rendering', () => {
  test('renders a radio group', () => {
    const view = Radio({
      name: 'color',
      options: [{ label: 'Red', value: 'red' }],
    });
    document.body.appendChild(view.element);

    const group = document.body.querySelector('.ds-radio-group');
    expect(group).not.toBeNull();
  });

  test('renders radio items from options', () => {
    const view = Radio({
      name: 'color',
      options: [
        { label: 'Red', value: 'red' },
        { label: 'Blue', value: 'blue' },
        { label: 'Green', value: 'green' },
      ],
    });
    document.body.appendChild(view.element);

    const radios = document.body.querySelectorAll('.ds-radio');
    expect(radios.length).toBe(3);
  });

  test('renders dot element for each item', () => {
    const view = Radio({
      name: 'color',
      options: [{ label: 'A', value: 'a' }, { label: 'B', value: 'b' }],
    });
    document.body.appendChild(view.element);

    const dots = document.body.querySelectorAll('.ds-radio__dot');
    expect(dots.length).toBe(2);
  });

  test('renders label text for each item', () => {
    const view = Radio({
      name: 'color',
      options: [{ label: 'Red', value: 'red' }],
    });
    document.body.appendChild(view.element);

    const label = document.body.querySelector('.ds-radio__label');
    expect(label).not.toBeNull();
    expect(label.textContent).toBe('Red');
  });
});

// ─── Selection ───────────────────────────────────────────────────────────────

describe('Radio selection', () => {
  test('initial value is set correctly', () => {
    const view = Radio({
      name: 'color',
      options: [
        { label: 'Red', value: 'red' },
        { label: 'Blue', value: 'blue' },
      ],
      value: 'blue',
    });
    document.body.appendChild(view.element);

    expect(view.getValue()).toBe('blue');
    const inputs = document.body.querySelectorAll('input');
    expect(inputs[1].checked).toBe(true);
  });

  test('clicking a radio changes selection', () => {
    const onChange = jest.fn();
    const view = Radio({
      name: 'color',
      options: [
        { label: 'Red', value: 'red' },
        { label: 'Blue', value: 'blue' },
      ],
      value: 'red',
      onChange,
    });
    document.body.appendChild(view.element);

    const inputs = document.body.querySelectorAll('input');
    inputs[1].click();

    expect(view.getValue()).toBe('blue');
    expect(onChange).toHaveBeenCalledWith('blue');
  });

  test('setValue updates selection programmatically', () => {
    const onChange = jest.fn();
    const view = Radio({
      name: 'color',
      options: [
        { label: 'Red', value: 'red' },
        { label: 'Blue', value: 'blue' },
      ],
      onChange,
    });
    document.body.appendChild(view.element);

    view.setValue('blue');
    expect(view.getValue()).toBe('blue');
    expect(onChange).toHaveBeenCalledWith('blue');

    const inputs = document.body.querySelectorAll('input');
    expect(inputs[1].checked).toBe(true);
  });
});

// ─── Disabled ────────────────────────────────────────────────────────────────

describe('Radio disabled', () => {
  test('disabled option is applied', () => {
    const view = Radio({
      name: 'color',
      options: [
        { label: 'Red', value: 'red', disabled: true },
        { label: 'Blue', value: 'blue' },
      ],
    });
    document.body.appendChild(view.element);

    const inputs = document.body.querySelectorAll('input');
    expect(inputs[0].disabled).toBe(true);
    expect(inputs[1].disabled).toBe(false);
  });
});

// ─── Destroy ─────────────────────────────────────────────────────────────────

describe('Radio destroy', () => {
  test('destroy() removes event listeners', () => {
    const onChange = jest.fn();
    const view = Radio({
      name: 'color',
      options: [{ label: 'Red', value: 'red' }],
      onChange,
    });
    document.body.appendChild(view.element);

    view.destroy();

    const input = document.body.querySelector('input');
    if (input) {
      input.click();
      expect(onChange).not.toHaveBeenCalled();
    }
  });
});
