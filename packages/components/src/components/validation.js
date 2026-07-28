// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Validation module built on the 2.0 reactive core.
 *
 * Pure validation rule engine with 12 built-in rules, custom validators,
 * async validation, and form state management.
 *
 * ```js
 * import { Validation } from '@kupola/components/validation';
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
  required: (v) => v !== null && v !== undefined && v !== false
    && (!Array.isArray(v) || v.length > 0)
    && String(v).trim() !== '',
  email: (v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v)),
  url: (v) => { try { new URL(String(v)); return true; } catch { return false; } },
  minLength: (v, [ min ]) => String(v).length >= parseInt(min),
  maxLength: (v, [ max ]) => String(v).length <= parseInt(max),
  pattern: (v, [ pat ]) => {
    try {return new RegExp(pat).test(String(v));} catch {return false;}
  },
  min: (v, [ m ]) => parseFloat(v) >= parseFloat(m),
  max: (v, [ m ]) => parseFloat(v) <= parseFloat(m),
  equalTo: (v, [ targetId ]) => {
    const t = typeof document !== 'undefined' ? document.getElementById(targetId) : null;
    return Boolean(t && String(v) === t.value);
  },
  phone: (v) => /^[\d\s\-+()]{7,20}$/.test(String(v)),
  date: (v) => {
    const match = /^(\d{4})([-/])(\d{2})\2(\d{2})$/.exec(String(v));
    if (!match) {return false;}
    const date = new Date(Date.UTC(Number(match[1]), Number(match[3]) - 1, Number(match[4])));
    return date.getUTCFullYear() === Number(match[1])
      && date.getUTCMonth() === Number(match[3]) - 1
      && date.getUTCDate() === Number(match[4]);
  },
  number: (v) => String(v).trim() !== '' && Number.isFinite(Number(v)),
};

let validationErrorId = 0;

function _parseRules(str) {
  if (!str) {return {};}
  const rules = {};
  str.split('|').forEach(part => {
    part = part.trim();
    if (!part) {return;}
    const colonIdx = part.indexOf(':');
    const name = (colonIdx === -1 ? part : part.slice(0, colonIdx)).trim();
    if (!name) {return;}
    const params = colonIdx === -1
      ? []
      : part.slice(colonIdx + 1).split(',').map(value => value.trim());
    Object.defineProperty(rules, name, {
      value: params, enumerable: true, configurable: true, writable: true,
    });
  });
  return rules;
}

function _getMessage(rule, params, customMsg) {
  if (customMsg) {return customMsg;}
  const tpl = MESSAGES[rule];
  if (!tpl) {return 'Invalid input';}
  return typeof tpl === 'function' ? tpl(params) : tpl;
}

export function Validation(options = {}) {
  const config = options && typeof options === 'object' ? options : {};
  const customValidators = new Map();
  const customAsyncValidators = new Map();
  const errorElements = new Map();
  const inputAttributes = new Map();
  const managedForms = new Set();
  let formStates = new WeakMap();
  let formRuns = new WeakMap();
  let inputRuns = new WeakMap();
  let destroyed = false;

  function addValidator(name, fn) {
    if (typeof name !== 'string' || !name || typeof fn !== 'function') {
      throw new TypeError('Validation: validator name and function are required');
    }
    if (!destroyed) {customValidators.set(name, fn);}
  }

  function addAsyncValidator(name, fn) {
    if (typeof name !== 'string' || !name || typeof fn !== 'function') {
      throw new TypeError('Validation: async validator name and function are required');
    }
    if (!destroyed) {customAsyncValidators.set(name, fn);}
  }

  for (const [ name, validator ] of Object.entries(config.validators || {})) {
    if (typeof validator === 'function') {addValidator(name, validator);}
  }
  for (const [ name, validator ] of Object.entries(config.asyncValidators || {})) {
    if (typeof validator === 'function') {addAsyncValidator(name, validator);}
  }

  function _getValidator(rule) {
    return customValidators.get(rule) || BUILT_IN[rule];
  }

  function _readInputValue(input) {
    if (input.type === 'checkbox') {return input.checked ? input.value : '';}
    if (input.type === 'radio') {
      const root = input.form || input.ownerDocument;
      const checked = Array.from(root?.querySelectorAll('input[type="radio"]') || [])
        .find(candidate => candidate.name === input.name && candidate.checked);
      return checked?.value || '';
    }
    return typeof input.value === 'string' ? input.value.trim() : input.value;
  }

  function _evaluate(value, ruleString, input = null) {
    const rules = _parseRules(ruleString);
    for (const [ rule, params ] of Object.entries(rules)) {
      const fn = _getValidator(rule);
      if (!fn) {continue;}
      try {
        if (!fn(value, params, input)) {
          const customMsg = input?.getAttribute(`data-message-${rule}`);
          return { valid: false, message: _getMessage(rule, params, customMsg) };
        }
      } catch (error) {
        return { valid: false, message: error?.message || 'Validation error' };
      }
    }
    return { valid: true, message: '' };
  }

  // Single value check against a rule string
  function check(value, ruleString) {
    return _evaluate(value, ruleString).valid;
  }

  function _validateInputSync(input) {
    const previous = inputRuns.get(input);
    previous?.controller?.abort();
    const token = {};
    inputRuns.set(input, token);
    const result = input.disabled
      ? { valid: true, message: '' }
      : _evaluate(_readInputValue(input), input.getAttribute('data-validate') || '', input);
    if (!destroyed && inputRuns.get(input) === token) {
      result.valid ? _clearError(input) : _showError(input, result.message);
    }
    return result;
  }

  // Validate a single input element
  function validateInput(input) {
    if (destroyed || !input?.getAttribute) {return false;}
    return _validateInputSync(input).valid;
  }

  function _getInputs(form, group) {
    const inputs = Array.from(form.querySelectorAll('[data-validate], [data-validate-async]'));
    if (group === undefined || group === null) {return inputs;}
    const groupName = String(group);
    return inputs.filter(input => input.getAttribute('data-validate-group') === groupName);
  }

  function _setError(errors, key, message) {
    Object.defineProperty(errors, key, {
      value: message, enumerable: true, configurable: true, writable: true,
    });
  }

  function _createState(inputs, results) {
    const errors = {};
    results.forEach((result, index) => {
      if (!result.valid) {
        const input = inputs[index];
        _setError(errors, input.name || input.id || `field-${index}`, result.message);
      }
    });
    return {
      valid: results.every(result => result.valid),
      errors,
      errorCount: Object.keys(errors).length,
    };
  }

  // Validate all inputs in a form
  function validateForm(form) {
    if (destroyed || !form?.querySelectorAll) {return false;}
    const run = {};
    formRuns.set(form, run);
    managedForms.add(form);
    const inputs = _getInputs(form);
    const state = _createState(inputs, inputs.map(_validateInputSync));
    formStates.set(form, state);
    _updateFormClasses(form, state.valid);
    return state.valid;
  }

  // Async validation
  async function validateFormAsync(form, opts = {}) {
    if (destroyed || !form?.querySelectorAll) {return false;}
    const run = {};
    formRuns.set(form, run);
    managedForms.add(form);
    const inputs = _getInputs(form, opts?.group);
    const results = await Promise.all(inputs.map(_validateInputAsync));
    const state = _createState(inputs, results);
    if (!destroyed && formRuns.get(form) === run) {
      formStates.set(form, state);
      _updateFormClasses(form, state.valid);
    }
    return state.valid;
  }

  async function _validateInputAsync(input) {
    const previous = inputRuns.get(input);
    previous?.controller?.abort();
    const controller = typeof AbortController === 'function' ? new AbortController() : null;
    const token = {};
    token.controller = controller;
    inputRuns.set(input, token);
    if (input.disabled) {
      const result = { valid: true, message: '' };
      if (!destroyed && inputRuns.get(input) === token) {_clearError(input);}
      return result;
    }
    const ruleStr = input.getAttribute('data-validate');
    const asyncRuleStr = input.getAttribute('data-validate-async') || '';
    const value = _readInputValue(input);

    // Sync rules first
    const syncResult = _evaluate(value, ruleStr || '', input);
    if (!syncResult.valid) {
      if (!destroyed && inputRuns.get(input) === token) {
        _showError(input, syncResult.message);
      }
      return syncResult;
    }

    // Async rules
    if (asyncRuleStr) {
      const asyncRules = _parseRules(asyncRuleStr);
      for (const [ rule, params ] of Object.entries(asyncRules)) {
        const fn = customAsyncValidators.get(rule);
        if (!fn) {continue;}
        try {
          const ok = await fn(value, params, input, controller?.signal);
          if (destroyed || inputRuns.get(input) !== token) {
            return { valid: Boolean(ok), message: '', stale: true };
          }
          if (!ok) {
            const customMsg = input.getAttribute(`data-message-${rule}`);
            const result = {
              valid: false,
              message: _getMessage(rule, params, customMsg),
            };
            _showError(input, result.message);
            return result;
          }
        } catch (error) {
          if (destroyed || inputRuns.get(input) !== token) {
            return { valid: false, message: '', stale: true };
          }
          const result = { valid: false, message: error?.message || 'Validation error' };
          _showError(input, result.message);
          return result;
        }
      }
    }

    const result = { valid: true, message: '' };
    if (!destroyed && inputRuns.get(input) === token) {_clearError(input);}
    return result;
  }

  // Validate a specific group within a form
  async function validateGroup(form, groupName) {
    if (destroyed || !form?.querySelectorAll) {return false;}
    const run = {};
    formRuns.set(form, run);
    managedForms.add(form);
    const inputs = _getInputs(form, groupName);
    const results = await Promise.all(inputs.map(_validateInputAsync));
    const groupState = _createState(inputs, results);
    if (!destroyed && formRuns.get(form) === run) {
      const allInputs = _getInputs(form);
      const allResults = allInputs.map(input => inputs.includes(input)
        ? results[inputs.indexOf(input)]
        : _validateInputSync(input));
      const state = _createState(allInputs, allResults);
      formStates.set(form, state);
      _updateFormClasses(form, state.valid);
    }
    return groupState.valid;
  }

  // Get form validation state
  function getFormState(form) {
    const state = formStates.get(form);
    if (!state) {return { valid: true, errors: {}, errorCount: 0 };}
    return { ...state, errors: { ...state.errors } };
  }

  // Reset form validation state
  function resetForm(form) {
    if (destroyed || !form?.querySelectorAll) {return;}
    formRuns.set(form, {});
    const inputs = new Set([
      ...form.querySelectorAll('[data-validate], [data-validate-async]'),
      ...[ ...errorElements.keys() ].filter(input => form.contains(input)),
    ]);
    inputs.forEach(input => {
      inputRuns.set(input, {});
      _clearError(input);
    });
    formStates.set(form, { valid: true, errors: {}, errorCount: 0 });
    form.classList.remove('ds-form--valid', 'ds-form--invalid');
  }

  // Error display helpers
  function _showError(input, msg) {
    _rememberInputAttributes(input);
    input.classList.add('ds-input--error');
    input.classList.remove('ds-input--success');
    input.setAttribute('aria-invalid', 'true');

    let errEl = errorElements.get(input);
    if (!errEl) {
      errEl = input.ownerDocument.createElement('span');
      errEl.className = 'ds-input__error';
      errEl.id = `ds-validation-error-${++validationErrorId}`;
      errEl.setAttribute('role', 'alert');
      input.parentElement?.appendChild(errEl);
      errorElements.set(input, errEl);
    }
    errEl.textContent = msg;
    const describedBy = new Set((input.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean));
    describedBy.add(errEl.id);
    input.setAttribute('aria-describedby', [ ...describedBy ].join(' '));
  }

  function _clearError(input) {
    _rememberInputAttributes(input);
    input.classList.remove('ds-input--error');
    input.setAttribute('aria-invalid', 'false');
    const errEl = errorElements.get(input);
    if (errEl) {
      const describedBy = (input.getAttribute('aria-describedby') || '')
        .split(/\s+/)
        .filter(value => value && value !== errEl.id);
      if (describedBy.length > 0) {
        input.setAttribute('aria-describedby', describedBy.join(' '));
      } else {
        input.removeAttribute('aria-describedby');
      }
      errEl.remove();
      errorElements.delete(input);
    }
  }

  function _rememberInputAttributes(input) {
    if (!inputAttributes.has(input)) {
      inputAttributes.set(input, {
        ariaInvalid: input.getAttribute('aria-invalid'),
        ariaDescribedBy: input.getAttribute('aria-describedby'),
      });
    }
  }

  function _updateFormClasses(form, valid) {
    managedForms.add(form);
    if (valid) {
      form.classList.remove('ds-form--invalid');
      form.classList.add('ds-form--valid');
    } else {
      form.classList.remove('ds-form--valid');
      form.classList.add('ds-form--invalid');
    }
  }

  function destroy() {
    if (destroyed) {return;}
    destroyed = true;
    for (const [ input, attributes ] of inputAttributes) {
      inputRuns.get(input)?.controller?.abort();
      errorElements.get(input)?.remove();
      input.classList.remove('ds-input--error', 'ds-input--success');
      if (attributes.ariaInvalid === null) {input.removeAttribute('aria-invalid');}
      else {input.setAttribute('aria-invalid', attributes.ariaInvalid);}
      if (attributes.ariaDescribedBy === null) {input.removeAttribute('aria-describedby');}
      else {input.setAttribute('aria-describedby', attributes.ariaDescribedBy);}
    }
    for (const form of managedForms) {
      form.classList.remove('ds-form--valid', 'ds-form--invalid');
    }
    errorElements.clear();
    inputAttributes.clear();
    managedForms.clear();
    customValidators.clear();
    customAsyncValidators.clear();
    formStates = new WeakMap();
    formRuns = new WeakMap();
    inputRuns = new WeakMap();
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
