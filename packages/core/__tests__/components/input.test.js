// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Unit tests for the Input component.
 * @jest-environment jsdom
 */

import { resetScheduler } from '../../src/index.js';
import { Input } from '@kupola/components';

afterEach(() => {
  document.body.innerHTML = '';
  resetScheduler();
});

// ─── Basic rendering ─────────────────────────────────────────────────────────

describe('Input rendering', () => {
  test('renders an input wrapper', () => {
    const view = Input();
    document.body.appendChild(view.element);

    const wrapper = document.body.querySelector('.ds-input');
    expect(wrapper).not.toBeNull();
  });

  test('renders inner input element', () => {
    const view = Input();
    document.body.appendChild(view.element);

    const input = document.body.querySelector('.ds-input input');
    expect(input).not.toBeNull();
  });

  test('sets placeholder text', () => {
    const view = Input({ placeholder: 'Enter name...' });
    document.body.appendChild(view.element);

    const input = document.body.querySelector('input');
    expect(input.placeholder).toBe('Enter name...');
  });

  test('sets initial value', () => {
    const view = Input({ value: 'hello' });
    document.body.appendChild(view.element);

    expect(view.getValue()).toBe('hello');
    const input = document.body.querySelector('input');
    expect(input.value).toBe('hello');
  });
});

// ─── Input types ─────────────────────────────────────────────────────────────

describe('Input type', () => {
  test('defaults to text type', () => {
    const view = Input();
    document.body.appendChild(view.element);

    const input = document.body.querySelector('input');
    expect(input.type).toBe('text');
  });

  test('sets password type', () => {
    const view = Input({ type: 'password' });
    document.body.appendChild(view.element);

    const input = document.body.querySelector('input');
    expect(input.type).toBe('password');
  });

  test('sets number type', () => {
    const view = Input({ type: 'number' });
    document.body.appendChild(view.element);

    const input = document.body.querySelector('input');
    expect(input.type).toBe('number');
  });
});

// ─── Status ──────────────────────────────────────────────────────────────────

describe('Input status', () => {
  test('applies error status class', () => {
    const view = Input({ status: 'error' });
    document.body.appendChild(view.element);

    const wrapper = document.body.querySelector('.ds-input');
    expect(wrapper.classList.contains('ds-input--error')).toBe(true);
  });

  test('applies success status class', () => {
    const view = Input({ status: 'success' });
    document.body.appendChild(view.element);

    const wrapper = document.body.querySelector('.ds-input');
    expect(wrapper.classList.contains('ds-input--success')).toBe(true);
  });

  test('applies warning status class', () => {
    const view = Input({ status: 'warning' });
    document.body.appendChild(view.element);

    const wrapper = document.body.querySelector('.ds-input');
    expect(wrapper.classList.contains('ds-input--warning')).toBe(true);
  });
});

// ─── API ─────────────────────────────────────────────────────────────────────

describe('Input API', () => {
  test('setValue updates value', () => {
    const view = Input();
    document.body.appendChild(view.element);

    view.setValue('new value');
    expect(view.getValue()).toBe('new value');
  });

  test('onInput callback fires on input event', () => {
    const onInput = jest.fn();
    const view = Input({ onInput });
    document.body.appendChild(view.element);

    const input = document.body.querySelector('input');
    input.value = 'typed';
    input.dispatchEvent(new Event('input'));

    expect(onInput).toHaveBeenCalledWith('typed');
  });

  test('disabled state is applied', () => {
    const view = Input({ disabled: true });
    document.body.appendChild(view.element);

    const input = document.body.querySelector('input');
    expect(input.disabled).toBe(true);
  });

  test('name attribute is set', () => {
    const view = Input({ name: 'username' });
    document.body.appendChild(view.element);

    const input = document.body.querySelector('input');
    expect(input.name).toBe('username');
  });
});

// ─── Destroy ─────────────────────────────────────────────────────────────────

describe('Input destroy', () => {
  test('destroy() removes event listeners', () => {
    const onInput = jest.fn();
    const view = Input({ onInput });
    document.body.appendChild(view.element);

    view.destroy();

    const input = document.body.querySelector('input');
    if (input) {
      input.value = 'test';
      input.dispatchEvent(new Event('input'));
      expect(onInput).not.toHaveBeenCalled();
    }
  });
});
