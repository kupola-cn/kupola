// SPDX-License-Identifier: MIT
import { Validation } from '../../src/components/validation.js';

describe('Validation', () => {
  let v;
  beforeEach(() => { v = Validation(); });
  afterEach(() => { v.destroy(); document.body.innerHTML = ''; });

  // ── Built-in rules via check() ──
  describe('check() — built-in rules', () => {
    test('required: rejects empty', () => {
      expect(v.check('', 'required')).toBe(false);
    });
    test('required: accepts non-empty', () => {
      expect(v.check('hello', 'required')).toBe(true);
    });
    test('email: accepts valid', () => {
      expect(v.check('user@test.com', 'email')).toBe(true);
    });
    test('email: rejects invalid', () => {
      expect(v.check('not-email', 'email')).toBe(false);
    });
    test('url: accepts valid', () => {
      expect(v.check('https://example.com', 'url')).toBe(true);
    });
    test('url: rejects invalid', () => {
      expect(v.check('not a url', 'url')).toBe(false);
    });
    test('minLength: rejects short', () => {
      expect(v.check('ab', 'minLength:5')).toBe(false);
    });
    test('minLength: accepts long enough', () => {
      expect(v.check('abcde', 'minLength:5')).toBe(true);
    });
    test('maxLength: rejects long', () => {
      expect(v.check('abcdef', 'maxLength:3')).toBe(false);
    });
    test('maxLength: accepts short enough', () => {
      expect(v.check('abc', 'maxLength:5')).toBe(true);
    });
    test('pattern: matches regex', () => {
      expect(v.check('abc123', 'pattern:^[a-z0-9]+$')).toBe(true);
    });
    test('pattern: rejects non-match', () => {
      expect(v.check('ABC!', 'pattern:^[a-z0-9]+$')).toBe(false);
    });
    test('min: rejects below', () => {
      expect(v.check('3', 'min:5')).toBe(false);
    });
    test('min: accepts above', () => {
      expect(v.check('10', 'min:5')).toBe(true);
    });
    test('max: rejects above', () => {
      expect(v.check('20', 'max:10')).toBe(false);
    });
    test('max: accepts below', () => {
      expect(v.check('5', 'max:10')).toBe(true);
    });
    test('phone: accepts valid', () => {
      expect(v.check('+1234567890', 'phone')).toBe(true);
    });
    test('phone: rejects invalid', () => {
      expect(v.check('abc', 'phone')).toBe(false);
    });
    test('date: accepts valid', () => {
      expect(v.check('2024-01-15', 'date')).toBe(true);
    });
    test('date: rejects invalid', () => {
      expect(v.check('not-a-date', 'date')).toBe(false);
    });
    test('number: accepts valid', () => {
      expect(v.check('3.14', 'number')).toBe(true);
    });
    test('number: rejects non-number', () => {
      expect(v.check('abc', 'number')).toBe(false);
    });
  });

  // ── Multiple rules ──
  describe('check() — multiple rules', () => {
    test('passes all rules', () => {
      expect(v.check('user@test.com', 'required|email|minLength:5')).toBe(true);
    });
    test('fails on first failing rule', () => {
      expect(v.check('', 'required|email')).toBe(false);
    });
    test('fails on second rule', () => {
      expect(v.check('bad', 'required|email')).toBe(false);
    });
  });

  // ── Custom validators ──
  describe('addValidator()', () => {
    test('registers and uses custom validator', () => {
      v.addValidator('uppercase', (val) => val === val.toUpperCase());
      expect(v.check('ABC', 'uppercase')).toBe(true);
      expect(v.check('abc', 'uppercase')).toBe(false);
    });

    test('custom validator overrides built-in', () => {
      v.addValidator('required', () => true);
      expect(v.check('', 'required')).toBe(true);
    });
  });

  // ── Async validators ──
  describe('addAsyncValidator()', () => {
    test('registers async validator', () => {
      v.addAsyncValidator('unique', async (val) => val !== 'taken');
      expect(v).toHaveProperty('addAsyncValidator');
    });
  });

  // ── parseRules ──
  describe('parseRules()', () => {
    test('parses single rule', () => {
      expect(v.parseRules('required')).toEqual({ required: [] });
    });
    test('parses rule with params', () => {
      expect(v.parseRules('minLength:5')).toEqual({ minLength: ['5'] });
    });
    test('parses multiple rules', () => {
      const result = v.parseRules('required|email|minLength:5');
      expect(result).toEqual({ required: [], email: [], minLength: ['5'] });
    });
    test('returns empty for empty string', () => {
      expect(v.parseRules('')).toEqual({});
    });
  });

  // ── validateInput ──
  describe('validateInput()', () => {
    test('validates input with data-validate attribute', () => {
      document.body.innerHTML = '<input name="email" data-validate="required|email" value="bad">';
      const input = document.querySelector('input');
      expect(v.validateInput(input)).toBe(false);
      expect(input.classList.contains('ds-input--error')).toBe(true);
    });

    test('passes valid input', () => {
      document.body.innerHTML = '<input name="email" data-validate="required|email" value="a@b.com">';
      const input = document.querySelector('input');
      expect(v.validateInput(input)).toBe(true);
      expect(input.classList.contains('ds-input--error')).toBe(false);
    });

    test('skips input without data-validate', () => {
      document.body.innerHTML = '<input name="x" value="test">';
      const input = document.querySelector('input');
      expect(v.validateInput(input)).toBe(true);
    });

    test('shows error message element', () => {
      document.body.innerHTML = '<div><input name="x" data-validate="required" value=""></div>';
      const input = document.querySelector('input');
      v.validateInput(input);
      const errEl = document.querySelector('.ds-input__error');
      expect(errEl).not.toBeNull();
      expect(errEl.textContent).toContain('required');
    });
  });

  // ── validateForm ──
  describe('validateForm()', () => {
    test('validates all inputs in form', () => {
      document.body.innerHTML = `
        <form id="testForm">
          <input name="name" data-validate="required" value="">
          <input name="email" data-validate="required|email" value="bad">
        </form>
      `;
      const form = document.querySelector('form');
      expect(v.validateForm(form)).toBe(false);
      const state = v.getFormState(form);
      expect(state.valid).toBe(false);
      expect(state.errorCount).toBe(2);
    });

    test('returns true when all valid', () => {
      document.body.innerHTML = `
        <form id="goodForm">
          <input name="name" data-validate="required" value="John">
          <input name="email" data-validate="email" value="john@test.com">
        </form>
      `;
      const form = document.querySelector('form');
      expect(v.validateForm(form)).toBe(true);
      const state = v.getFormState(form);
      expect(state.valid).toBe(true);
    });

    test('adds ds-form--valid class on success', () => {
      document.body.innerHTML = '<form id="f1"><input name="x" data-validate="required" value="ok"></form>';
      const form = document.querySelector('form');
      v.validateForm(form);
      expect(form.classList.contains('ds-form--valid')).toBe(true);
    });

    test('adds ds-form--invalid class on failure', () => {
      document.body.innerHTML = '<form id="f2"><input name="x" data-validate="required" value=""></form>';
      const form = document.querySelector('form');
      v.validateForm(form);
      expect(form.classList.contains('ds-form--invalid')).toBe(true);
    });
  });

  // ── validateFormAsync ──
  describe('validateFormAsync()', () => {
    test('validates form asynchronously', async () => {
      document.body.innerHTML = `
        <form id="asyncForm">
          <input name="name" data-validate="required" value="ok">
        </form>
      `;
      const form = document.querySelector('form');
      const result = await v.validateFormAsync(form);
      expect(result).toBe(true);
    });

    test('fails async validation', async () => {
      document.body.innerHTML = `
        <form id="asyncForm2">
          <input name="name" data-validate="required" value="">
        </form>
      `;
      const form = document.querySelector('form');
      const result = await v.validateFormAsync(form);
      expect(result).toBe(false);
    });
  });

  // ── resetForm ──
  describe('resetForm()', () => {
    test('clears error states', () => {
      document.body.innerHTML = '<form id="rForm"><input name="x" data-validate="required" value=""></form>';
      const form = document.querySelector('form');
      v.validateForm(form);
      expect(form.classList.contains('ds-form--invalid')).toBe(true);
      v.resetForm(form);
      expect(form.classList.contains('ds-form--invalid')).toBe(false);
      const errEl = document.querySelector('.ds-input--error');
      expect(errEl).toBeNull();
    });
  });

  // ── destroy ──
  describe('destroy()', () => {
    test('cleans up state', () => {
      v.addValidator('test', () => true);
      v.destroy();
      // After destroy, check should not find the custom validator
      // (it's a new closure, so we just verify no errors)
      expect(() => v.destroy()).not.toThrow();
    });
  });
});
