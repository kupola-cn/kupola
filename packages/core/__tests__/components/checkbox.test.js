// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Unit tests for the Checkbox component.
 * @jest-environment jsdom
 */

import { resetScheduler } from '../../src/index.js';
import { Checkbox } from '@kupola/components';

afterEach(() => {
  document.body.innerHTML = '';
  resetScheduler();
});

// ─── Basic rendering ─────────────────────────────────────────────────────────

describe('Checkbox rendering', () => {
  test('renders a checkbox element', () => {
    const view = Checkbox({ label: 'Test' });
    document.body.appendChild(view.element);

    const cb = document.body.querySelector('.ds-checkbox');
    expect(cb).not.toBeNull();
  });

  test('renders the label text', () => {
    const view = Checkbox({ label: 'Accept terms' });
    document.body.appendChild(view.element);

    const label = document.body.querySelector('.ds-checkbox__label');
    expect(label).not.toBeNull();
    expect(label.textContent).toBe('Accept terms');
  });

  test('renders the box element', () => {
    const view = Checkbox({ label: 'Test' });
    document.body.appendChild(view.element);

    const box = document.body.querySelector('.ds-checkbox__box');
    expect(box).not.toBeNull();
  });

  test('renders hidden input', () => {
    const view = Checkbox({ label: 'Test' });
    document.body.appendChild(view.element);

    const input = document.body.querySelector('input[type="checkbox"]');
    expect(input).not.toBeNull();
  });
});

// ─── State ───────────────────────────────────────────────────────────────────

describe('Checkbox state', () => {
  test('starts unchecked by default', () => {
    const view = Checkbox({ label: 'Test' });
    document.body.appendChild(view.element);

    expect(view.isChecked()).toBe(false);
  });

  test('starts checked when initial state is true', () => {
    const view = Checkbox({ label: 'Test', checked: true });
    document.body.appendChild(view.element);

    expect(view.isChecked()).toBe(true);
    const input = document.body.querySelector('input');
    expect(input.checked).toBe(true);
  });

  test('clicking toggles state', () => {
    const onChange = jest.fn();
    const view = Checkbox({ label: 'Test', onChange });
    document.body.appendChild(view.element);

    const input = document.body.querySelector('input');
    input.click();

    expect(view.isChecked()).toBe(true);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  test('setChecked updates state programmatically', () => {
    const onChange = jest.fn();
    const view = Checkbox({ label: 'Test', onChange });
    document.body.appendChild(view.element);

    view.setChecked(true);
    expect(view.isChecked()).toBe(true);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  test('disabled state is applied', () => {
    const view = Checkbox({ label: 'Test', disabled: true });
    document.body.appendChild(view.element);

    const input = document.body.querySelector('input');
    expect(input.disabled).toBe(true);
  });
});

// ─── Name/Value ──────────────────────────────────────────────────────────────

describe('Checkbox name/value', () => {
  test('sets name attribute', () => {
    const view = Checkbox({ label: 'Test', name: 'agree' });
    document.body.appendChild(view.element);

    const input = document.body.querySelector('input');
    expect(input.name).toBe('agree');
  });

  test('sets value attribute', () => {
    const view = Checkbox({ label: 'Test', value: 'yes' });
    document.body.appendChild(view.element);

    const input = document.body.querySelector('input');
    expect(input.value).toBe('yes');
  });
});

// ─── Destroy ─────────────────────────────────────────────────────────────────

describe('Checkbox destroy', () => {
  test('destroy() removes event listeners', () => {
    const onChange = jest.fn();
    const view = Checkbox({ label: 'Test', onChange });
    document.body.appendChild(view.element);

    view.destroy();

    // After destroy, clicking should not trigger onChange
    const input = document.body.querySelector('input');
    if (input) {
      input.click();
      expect(onChange).not.toHaveBeenCalled();
    }
  });
});
