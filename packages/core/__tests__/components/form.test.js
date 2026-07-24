// SPDX-License-Identifier: MIT
import { Form } from '@kupola/components';

describe('Form', () => {
  function makeForm(html) {
    const div = document.createElement('div');
    div.innerHTML = `<form>${html}</form>`;
    document.body.appendChild(div);
    return div.querySelector('form');
  }

  afterEach(() => { document.body.innerHTML = ''; });

  // ── Initialization ──
  describe('initialization', () => {
    test('throws if no element', () => {
      expect(() => Form()).toThrow();
    });

    test('creates form wrapper', () => {
      const form = makeForm('<input name="x" value="test">');
      const f = Form({ element: form });
      expect(f.element).toBe(form);
      f.destroy();
    });
  });

  // ── getData ──
  describe('getData()', () => {
    test('collects text input values', () => {
      const form = makeForm('<input name="name" value="John"><input name="age" value="30">');
      const f = Form({ element: form });
      const data = f.getData();
      expect(data.name).toBe('John');
      expect(data.age).toBe('30');
      f.destroy();
    });

    test('collects checkbox values', () => {
      const form = makeForm(`
        <input type="checkbox" name="colors" value="red" checked>
        <input type="checkbox" name="colors" value="blue">
      `);
      const f = Form({ element: form });
      const data = f.getData();
      expect(data.colors).toEqual([ 'red' ]);
      f.destroy();
    });

    test('collects radio values', () => {
      const form = makeForm(`
        <input type="radio" name="size" value="s">
        <input type="radio" name="size" value="m" checked>
        <input type="radio" name="size" value="l">
      `);
      const f = Form({ element: form });
      const data = f.getData();
      expect(data.size).toBe('m');
      f.destroy();
    });

    test('collects select values', () => {
      const form = makeForm(`
        <select name="country">
          <option value="us">US</option>
          <option value="cn" selected>China</option>
        </select>
      `);
      const f = Form({ element: form });
      const data = f.getData();
      expect(data.country).toBe('cn');
      f.destroy();
    });

    test('skips fields without name', () => {
      const form = makeForm('<input value="noname">');
      const f = Form({ element: form });
      const data = f.getData();
      expect(Object.keys(data).length).toBe(0);
      f.destroy();
    });
  });

  // ── setData ──
  describe('setData()', () => {
    test('sets text input values', () => {
      const form = makeForm('<input name="name" value=""><input name="email" value="">');
      const f = Form({ element: form });
      f.setData({ name: 'Jane', email: 'jane@test.com' });
      expect(form.querySelector('[name="name"]').value).toBe('Jane');
      expect(form.querySelector('[name="email"]').value).toBe('jane@test.com');
      f.destroy();
    });

    test('sets checkbox values', () => {
      const form = makeForm(`
        <input type="checkbox" name="colors" value="red">
        <input type="checkbox" name="colors" value="blue">
      `);
      const f = Form({ element: form });
      f.setData({ colors: [ 'red', 'blue' ] });
      expect(form.querySelectorAll('input:checked').length).toBe(2);
      f.destroy();
    });

    test('sets radio values', () => {
      const form = makeForm(`
        <input type="radio" name="size" value="s">
        <input type="radio" name="size" value="m">
        <input type="radio" name="size" value="l">
      `);
      const f = Form({ element: form });
      f.setData({ size: 'l' });
      expect(form.querySelector('input:checked').value).toBe('l');
      f.destroy();
    });
  });

  // ── Validation ──
  describe('validate()', () => {
    test('validates required fields', () => {
      const form = makeForm('<input name="name" data-required="true" value="">');
      const f = Form({ element: form });
      expect(f.validate()).toBe(false);
      expect(form.querySelector('.ds-form-error')).not.toBeNull();
      f.destroy();
    });

    test('passes valid required field', () => {
      const form = makeForm('<input name="name" data-required="true" value="John">');
      const f = Form({ element: form });
      expect(f.validate()).toBe(true);
      expect(form.querySelector('.ds-form-error')).toBeNull();
      f.destroy();
    });

    test('validates email format', () => {
      const form = makeForm('<input name="email" data-email="true" value="bad">');
      const f = Form({ element: form });
      expect(f.validate()).toBe(false);
      f.destroy();
    });

    test('validates email passes', () => {
      const form = makeForm('<input name="email" data-email="true" value="a@b.com">');
      const f = Form({ element: form });
      expect(f.validate()).toBe(true);
      f.destroy();
    });

    test('validates minlength', () => {
      const form = makeForm('<input name="pw" data-minlength="8" value="short">');
      const f = Form({ element: form });
      expect(f.validate()).toBe(false);
      f.destroy();
    });

    test('validates number', () => {
      const form = makeForm('<input name="age" data-number="true" value="abc">');
      const f = Form({ element: form });
      expect(f.validate()).toBe(false);
      f.destroy();
    });
  });

  // ── Error display ──
  describe('showError() / clearError()', () => {
    test('showError adds error element', () => {
      const form = makeForm('<input name="x" value="">');
      const f = Form({ element: form });
      const input = form.querySelector('input');
      f.showError(input, 'Error!');
      expect(input.classList.contains('ds-form-field--error')).toBe(true);
      expect(form.querySelector('.ds-form-error').textContent).toBe('Error!');
      f.destroy();
    });

    test('clearError removes error element', () => {
      const form = makeForm('<input name="x" value="">');
      const f = Form({ element: form });
      const input = form.querySelector('input');
      f.showError(input, 'Error!');
      f.clearError(input);
      expect(input.classList.contains('ds-form-field--error')).toBe(false);
      expect(form.querySelector('.ds-form-error')).toBeNull();
      f.destroy();
    });

    test('clearAllErrors removes all errors', () => {
      const form = makeForm(`
        <input name="a" data-required="true" value="">
        <input name="b" data-required="true" value="">
      `);
      const f = Form({ element: form });
      f.validate();
      expect(form.querySelectorAll('.ds-form-error').length).toBe(2);
      f.clearAllErrors();
      expect(form.querySelectorAll('.ds-form-error').length).toBe(0);
      f.destroy();
    });
  });

  // ── Submit ──
  describe('submit handling', () => {
    test('calls onSubmit with data when valid', () => {
      const onSubmit = jest.fn();
      const form = makeForm('<input name="name" value="John">');
      const f = Form({ element: form, onSubmit });
      form.dispatchEvent(new Event('submit', { cancelable: true }));
      expect(onSubmit).toHaveBeenCalledWith({ name: 'John' });
      f.destroy();
    });

    test('prevents submit when invalid', () => {
      const onSubmit = jest.fn();
      const form = makeForm('<input name="name" data-required="true" value="">');
      const f = Form({ element: form, onSubmit });
      const event = new Event('submit', { cancelable: true });
      form.dispatchEvent(event);
      expect(event.defaultPrevented).toBe(true);
      expect(onSubmit).not.toHaveBeenCalled();
      f.destroy();
    });
  });

  // ── addValidator ──
  describe('addValidator()', () => {
    test('registers custom validator', () => {
      const form = makeForm('<input name="code" data-uppercase="true" value="abc">');
      const f = Form({ element: form });
      f.addValidator('uppercase', (v) => v === v.toUpperCase(), 'Must be uppercase');
      expect(f.validate()).toBe(false);
      f.destroy();
    });
  });

  // ── reset ──
  describe('reset()', () => {
    test('clears form and errors', () => {
      const form = makeForm('<input name="name" data-required="true" value="">');
      const f = Form({ element: form });
      f.validate();
      expect(form.querySelector('.ds-form-error')).not.toBeNull();
      f.reset();
      expect(form.querySelector('.ds-form-error')).toBeNull();
      f.destroy();
    });
  });

  // ── destroy ──
  describe('destroy()', () => {
    test('cleans up event listeners', () => {
      const form = makeForm('<input name="x" value="test">');
      const f = Form({ element: form });
      expect(() => f.destroy()).not.toThrow();
    });
  });
});
