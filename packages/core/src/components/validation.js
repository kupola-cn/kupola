// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Validation module built on the 2.0 reactive core.
 *
 * Pure validation rule engine with 12 built-in rules, custom validators,
 * async validation, and form state management.
 *
 * ```js
 * import { Validation } from '@kupola/core/components/validation';
 *
 * const v = Validation();
 *
 * // Built-in rules
 * v.check('test@email.com', 'email');        // true
 * v.check('', 'required');                    // false
 * v.check('abc', 'minLength:5');              // false
 *
 * // Multiple rules
 * v.checkValue('hello@test.com', 'required|email|minLength:5');
 *
 * // Custom validator
 * v.addValidator('uppercase', (val) => val === val.toUpperCase());
 * v.check('ABC', 'uppercase');                // true
 *
 * // Async validator
 * v.addAsyncValidator('unique', async (val) => {
 *   const res = await fetch(`/api/check?val=${val}`);
 *   return res.ok;
 * });
 *
 * // Form validation
 * const form = document.querySelector('form');
 * const isValid = v.validateForm(form);
 *
 * v.destroy();
 * ```
 *
 * @module components/validation
 */

const MESSAGES = {
  required:  'This field is required',
  email:     'Please enter a valid email address',
  url:       'Please enter a valid URL',
  minLength: (p) => `Minimum length is ${p[0]} characters`,
  maxLength: (p) => `Maximum length is ${p[0]} characters`,
  pattern:   'Please enter a valid value',
  min:       (p) => `Minimum value is ${p[0]}`,
  max:       (p) => `Maximum value is ${p[0]}`,
  equalTo:   'Values do not match',
  phone:     'Please enter a valid phone number',
  date:      'Please enter a valid date (YYYY-MM-DD)',
  number:    'Please enter a valid number',
};

const BUILT_IN = {
  required: (v) => v !== '',
  email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
  url: (v) => { try { new URL(v); return true; } catch { return false; } },
  minLength: (v, [min]) => v.length >= parseInt(min),
  maxLength: (v, [max]) => v.length <= parseInt(max),
  pattern: (v, [pat]) => new RegExp(pat).test(v),
  min: (v, [m]) => parseFloat(v) >= parseFloat(m),
  max: (v, [m]) => parseFloat(v) <= parseFloat(m),
  equalTo: (v, [targetId]) => {
    const t = typeof document !== 'undefined' ? document.getElementById(targetId) : null;
    return t && v === t.value;
  },
  phone: (v) => /^[\d\s\-+()]{7,20}$/.test(v),
  date: (v) => /^\d{4}[-/]\d{2}[-/]\d{2}$/.test(v) && !isNaN(Date.parse(v)),
  number: (v) => !isNaN(parseFloat(v)) && isFinite(v),
};

function _parseRules(str) {
  if (!str) return {};
  const rules = {};
  str.split('|').forEach(part => {
    const colonIdx = part.indexOf(':');
    if (colonIdx === -1) {
      rules[part] = [];
    } else {
      rules[part.slice(0, colonIdx)] = part.slice(colonIdx + 1).split(',');
    }
  });
  return rules;
}

function _getMessage(rule, params, customMsg) {
  if (customMsg) return customMsg;
  const tpl = MESSAGES[rule];
  if (!tpl) return 'Invalid input';
  return typeof tpl === 'function' ? tpl(params) : tpl;
}

export function Validation(options = {}) {
  const customValidators = {};
  const customAsyncValidators = {};
  const formStates = {};

  function addValidator(name, fn) {
    customValidators[name] = fn;
  }

  function addAsyncValidator(name, fn) {
    customAsyncValidators[name] = fn;
  }

  // Single value check against a rule string
  function check(value, ruleString) {
    const rules = _parseRules(ruleString);
    for (const [rule, params] of Object.entries(rules)) {
      const fn = customValidators[rule] || BUILT_IN[rule];
      if (!fn) continue;
      if (!fn(value, params)) return false;
    }
    return true;
  }

  // Validate a single input element
  function validateInput(input) {
    const ruleStr = input.getAttribute('data-validate');
    if (!ruleStr) return true;
    const rules = _parseRules(ruleStr);
    const value = (input.value || '').trim();

    for (const [rule, params] of Object.entries(rules)) {
      const fn = customValidators[rule] || BUILT_IN[rule];
      if (!fn) continue;
      if (!fn(value, params)) {
        const customMsg = input.getAttribute(`data-message-${rule}`);
        const msg = _getMessage(rule, params, customMsg);
        _showError(input, msg);
        return false;
      }
    }
    _clearError(input);
    return true;
  }

  // Validate all inputs in a form
  function validateForm(form) {
    const formId = form.id || `form-${Math.random().toString(36).slice(2, 11)}`;
    const inputs = form.querySelectorAll('[data-validate]');
    const errors = {};
    let valid = true;

    inputs.forEach(input => {
      const name = input.name || input.id;
      const ruleStr = input.getAttribute('data-validate');
      if (!ruleStr) return;
      const rules = _parseRules(ruleStr);
      const value = (input.value || '').trim();

      for (const [rule, params] of Object.entries(rules)) {
        const fn = customValidators[rule] || BUILT_IN[rule];
        if (!fn) continue;
        if (!fn(value, params)) {
          const customMsg = input.getAttribute(`data-message-${rule}`);
          const msg = _getMessage(rule, params, customMsg);
          errors[name] = msg;
          _showError(input, msg);
          valid = false;
          break;
        } else {
          _clearError(input);
        }
      }
    });

    formStates[formId] = { valid, errors, errorCount: Object.keys(errors).length };
    _updateFormClasses(form, valid);

    return valid;
  }

  // Async validation
  async function validateFormAsync(form, opts = {}) {
    const formId = form.id || `form-${Math.random().toString(36).slice(2, 11)}`;
    const group = opts.group;
    const selector = group
      ? `[data-validate][data-validate-group="${group}"]`
      : '[data-validate]';
    const inputs = form.querySelectorAll(selector);
    const errors = {};
    let valid = true;

    for (const input of inputs) {
      const ok = await _validateInputAsync(input);
      if (!ok) valid = false;
    }

    inputs.forEach(input => {
      const name = input.name || input.id;
      const errEl = input.parentElement?.querySelector('.ds-input__error');
      if (errEl && errEl.textContent) {
        errors[name] = errEl.textContent;
      }
    });

    formStates[formId] = { valid, errors, errorCount: Object.keys(errors).length };
    _updateFormClasses(form, valid);

    return valid;
  }

  async function _validateInputAsync(input) {
    const ruleStr = input.getAttribute('data-validate');
    const asyncRuleStr = input.getAttribute('data-validate-async') || '';
    const value = (input.value || '').trim();

    // Sync rules first
    if (ruleStr) {
      const rules = _parseRules(ruleStr);
      for (const [rule, params] of Object.entries(rules)) {
        const fn = customValidators[rule] || BUILT_IN[rule];
        if (!fn) continue;
        if (!fn(value, params)) {
          const customMsg = input.getAttribute(`data-message-${rule}`);
          _showError(input, _getMessage(rule, params, customMsg));
          return false;
        }
      }
    }

    // Async rules
    if (asyncRuleStr) {
      const asyncRules = _parseRules(asyncRuleStr);
      for (const [rule, params] of Object.entries(asyncRules)) {
        const fn = customAsyncValidators[rule];
        if (!fn) continue;
        try {
          const ok = await fn(value, params, input);
          if (!ok) {
            _showError(input, _getMessage(rule, params, null));
            return false;
          }
        } catch (e) {
          _showError(input, e.message || 'Validation error');
          return false;
        }
      }
    }

    _clearError(input);
    return true;
  }

  // Validate a specific group within a form
  async function validateGroup(form, groupName) {
    const inputs = form.querySelectorAll(`[data-validate][data-validate-group="${groupName}"]`);
    let valid = true;
    for (const input of inputs) {
      const ok = await _validateInputAsync(input);
      if (!ok) valid = false;
    }
    return valid;
  }

  // Get form validation state
  function getFormState(form) {
    const formId = form.id || `form-${Math.random().toString(36).slice(2, 11)}`;
    return formStates[formId] || { valid: true, errors: {}, errorCount: 0 };
  }

  // Reset form validation state
  function resetForm(form) {
    const formId = form.id || `form-${Math.random().toString(36).slice(2, 11)}`;
    formStates[formId] = { valid: true, errors: {}, errorCount: 0 };
    form.querySelectorAll('.ds-input--error').forEach(el => {
      el.classList.remove('ds-input--error');
      const errEl = el.parentElement?.querySelector('.ds-input__error');
      if (errEl) errEl.remove();
    });
    _updateFormClasses(form, true);
  }

  // Error display helpers
  function _showError(input, msg) {
    input.classList.add('ds-input--error');
    input.classList.remove('ds-input--success');
    input.setAttribute('aria-invalid', 'true');

    let errEl = input.parentElement?.querySelector('.ds-input__error');
    if (!errEl) {
      errEl = document.createElement('span');
      errEl.className = 'ds-input__error';
      errEl.setAttribute('role', 'alert');
      input.parentElement?.appendChild(errEl);
    }
    errEl.textContent = msg;
  }

  function _clearError(input) {
    input.classList.remove('ds-input--error');
    input.setAttribute('aria-invalid', 'false');
    const errEl = input.parentElement?.querySelector('.ds-input__error');
    if (errEl) errEl.remove();
  }

  function _updateFormClasses(form, valid) {
    if (valid) {
      form.classList.remove('ds-form--invalid');
      form.classList.add('ds-form--valid');
    } else {
      form.classList.remove('ds-form--valid');
      form.classList.add('ds-form--invalid');
    }
  }

  function destroy() {
    Object.keys(formStates).forEach(k => delete formStates[k]);
    Object.keys(customValidators).forEach(k => delete customValidators[k]);
    Object.keys(customAsyncValidators).forEach(k => delete customAsyncValidators[k]);
  }

  return {
    check,
    validateInput,
    validateForm,
    validateFormAsync,
    validateGroup,
    addValidator,
    addAsyncValidator,
    getFormState,
    resetForm,
    parseRules: _parseRules,
    destroy,
  };
}
