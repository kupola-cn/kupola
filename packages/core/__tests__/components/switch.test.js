// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Unit tests for the Switch component.
 * @jest-environment jsdom
 */

import { resetScheduler } from '../../src/index.js';
import { Switch } from '@kupola/components';

afterEach(() => {
  document.body.innerHTML = '';
  resetScheduler();
});

// ─── Basic rendering ─────────────────────────────────────────────────────────

describe('Switch rendering', () => {
  test('renders a switch element', () => {
    const view = Switch();
    document.body.appendChild(view.element);

    const label = document.body.querySelector('.ds-switch');
    expect(label).not.toBeNull();
  });

  test('contains a checkbox input', () => {
    const view = Switch();
    document.body.appendChild(view.element);

    const input = document.body.querySelector('.ds-switch input[type="checkbox"]');
    expect(input).not.toBeNull();
  });

  test('contains a thumb element', () => {
    const view = Switch();
    document.body.appendChild(view.element);

    const thumb = document.body.querySelector('.ds-switch__thumb');
    expect(thumb).not.toBeNull();
  });

  test('defaults to unchecked', () => {
    const view = Switch();
    expect(view.isChecked()).toBe(false);
  });

  test('renders checked when initial state is true', () => {
    const view = Switch({ checked: true });
    document.body.appendChild(view.element);

    expect(view.isChecked()).toBe(true);
    const input = document.body.querySelector('.ds-switch input[type="checkbox"]');
    expect(input.checked).toBe(true);
  });

  test('renders disabled state', () => {
    const view = Switch({ disabled: true });
    document.body.appendChild(view.element);

    const input = document.body.querySelector('.ds-switch input[type="checkbox"]');
    expect(input.disabled).toBe(true);
  });
});

// ─── Toggle behavior ─────────────────────────────────────────────────────────

describe('Switch toggle', () => {
  test('toggle() switches checked state', () => {
    const view = Switch();
    expect(view.isChecked()).toBe(false);

    view.toggle();
    expect(view.isChecked()).toBe(true);

    view.toggle();
    expect(view.isChecked()).toBe(false);
  });

  test('click on label triggers toggle', () => {
    const view = Switch();
    document.body.appendChild(view.element);

    const label = document.body.querySelector('.ds-switch');
    label.click();

    expect(view.isChecked()).toBe(true);
  });

  test('toggle does not work when disabled', () => {
    const view = Switch({ disabled: true });

    view.toggle();
    expect(view.isChecked()).toBe(false);
  });

  test('setChecked updates state', () => {
    const view = Switch();

    view.setChecked(true);
    expect(view.isChecked()).toBe(true);

    view.setChecked(false);
    expect(view.isChecked()).toBe(false);
  });

  test('setChecked does nothing when disabled', () => {
    const view = Switch({ disabled: true });

    view.setChecked(true);
    expect(view.isChecked()).toBe(false);
  });

  test('onChange callback is called on toggle', () => {
    const onChange = jest.fn();
    const view = Switch({ onChange });

    view.toggle();
    expect(onChange).toHaveBeenCalledWith(true);

    view.toggle();
    expect(onChange).toHaveBeenCalledWith(false);
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  test('onChange is not called when disabled', () => {
    const onChange = jest.fn();
    const view = Switch({ disabled: true, onChange });

    view.toggle();
    expect(onChange).not.toHaveBeenCalled();
  });
});

// ─── Destroy ─────────────────────────────────────────────────────────────────

describe('Switch destroy', () => {
  test('destroy() cleans up the reactive instance', () => {
    const view = Switch();
    document.body.appendChild(view.element);

    expect(document.body.querySelector('.ds-switch')).not.toBeNull();
    // destroy should not throw
    expect(() => view.destroy()).not.toThrow();
  });
});
