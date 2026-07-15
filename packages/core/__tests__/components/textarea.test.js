// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Unit tests for the Textarea component.
 * @jest-environment jsdom
 */

import { resetScheduler } from '../../src/index.js';
import { Textarea } from '../../src/components/textarea.js';

afterEach(() => {
  document.body.innerHTML = '';
  resetScheduler();
});

// ─── Basic rendering ─────────────────────────────────────────────────────────

describe('Textarea rendering', () => {
  test('renders a textarea element', () => {
    const view = Textarea();
    document.body.appendChild(view.element);

    const ta = document.body.querySelector('.ds-textarea');
    expect(ta).not.toBeNull();
  });

  test('sets placeholder text', () => {
    const view = Textarea({ placeholder: 'Enter text...' });
    document.body.appendChild(view.element);

    const ta = document.body.querySelector('.ds-textarea');
    expect(ta.placeholder).toBe('Enter text...');
  });

  test('sets initial value', () => {
    const view = Textarea({ value: 'hello world' });
    document.body.appendChild(view.element);

    expect(view.getValue()).toBe('hello world');
    const ta = document.body.querySelector('.ds-textarea');
    expect(ta.value).toBe('hello world');
  });

  test('sets rows attribute', () => {
    const view = Textarea({ rows: 6 });
    document.body.appendChild(view.element);

    const ta = document.body.querySelector('.ds-textarea');
    expect(ta.rows).toBe(6);
  });

  test('defaults to 4 rows', () => {
    const view = Textarea();
    document.body.appendChild(view.element);

    const ta = document.body.querySelector('.ds-textarea');
    expect(ta.rows).toBe(4);
  });
});

// ─── State ───────────────────────────────────────────────────────────────────

describe('Textarea state', () => {
  test('onInput callback fires', () => {
    const onInput = jest.fn();
    const view = Textarea({ onInput });
    document.body.appendChild(view.element);

    const ta = document.body.querySelector('.ds-textarea');
    ta.value = 'typed';
    ta.dispatchEvent(new Event('input'));

    expect(onInput).toHaveBeenCalledWith('typed');
  });

  test('onChange callback fires', () => {
    const onChange = jest.fn();
    const view = Textarea({ onChange });
    document.body.appendChild(view.element);

    const ta = document.body.querySelector('.ds-textarea');
    ta.value = 'changed';
    ta.dispatchEvent(new Event('change'));

    expect(onChange).toHaveBeenCalledWith('changed');
  });

  test('setValue updates value', () => {
    const view = Textarea();
    document.body.appendChild(view.element);

    view.setValue('new value');
    expect(view.getValue()).toBe('new value');
  });

  test('disabled state is applied', () => {
    const view = Textarea({ disabled: true });
    document.body.appendChild(view.element);

    const ta = document.body.querySelector('.ds-textarea');
    expect(ta.disabled).toBe(true);
  });

  test('resize style is applied', () => {
    const view = Textarea({ resize: 'none' });
    document.body.appendChild(view.element);

    const ta = document.body.querySelector('.ds-textarea');
    expect(ta.style.resize).toBe('none');
  });

  test('name attribute is set', () => {
    const view = Textarea({ name: 'description' });
    document.body.appendChild(view.element);

    const ta = document.body.querySelector('.ds-textarea');
    expect(ta.name).toBe('description');
  });
});

// ─── Destroy ─────────────────────────────────────────────────────────────────

describe('Textarea destroy', () => {
  test('destroy() removes event listeners', () => {
    const onInput = jest.fn();
    const view = Textarea({ onInput });
    document.body.appendChild(view.element);

    view.destroy();

    const ta = document.body.querySelector('.ds-textarea');
    if (ta) {
      ta.value = 'test';
      ta.dispatchEvent(new Event('input'));
      expect(onInput).not.toHaveBeenCalled();
    }
  });
});
