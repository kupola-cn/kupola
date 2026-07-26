// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Form module built on the 2.0 reactive core.
 *
 * Form management with field collection, validation integration,
 * data binding, and submit handling.
 *
 * ```js
 * import { Form } from '@kupola/components/form';
 *
 * const form = Form({
 *   element: document.querySelector('form'),
 *   onSubmit: (data) => console.log(data),
 * });
 *
 * form.setData({ name: 'John', email: 'john@test.com' });
 * const data = form.getData();
 * form.destroy();
 * ```
 *
 * @module components/form
 */

import { createListenerRegistry } from './listener-registry';

const FIELD_SELECTOR = 'input, select, textarea';
const hasOwn = (object, key) => Object.prototype.hasOwnProperty.call(object, key);

export function Form(options = {}) {
  const config = options && typeof options === 'object' ? options : {};
  let formEl = config.element;
  if (typeof formEl === 'string') {
    formEl = typeof document === 'undefined' ? null : document.querySelector(formEl);
  }
  if (!formEl || typeof formEl.querySelectorAll !== 'function'
    || typeof formEl.addEventListener !== 'function') {
    throw new Error('Form: element must be a form element or a selector resolving to one');
  }

  const onSubmit = typeof config.onSubmit === 'function' ? config.onSubmit : null;
  const onValidate = typeof config.onValidate === 'function' ? config.onValidate : null;
  const errorElements = new Map();
  let destroyed = false;
  const listeners = createListenerRegistry();

  // Collect fields
  function _getFields() {
    return Array.from(formEl.querySelectorAll(FIELD_SELECTOR))
      .filter(f => !f.hasAttribute('data-kupola-ignore'));
  }

  function _isManagedField(field) {
    return Boolean(field?.matches?.(FIELD_SELECTOR)
      && formEl.contains(field)
      && !field.hasAttribute('data-kupola-ignore'));
  }

  // Get field value (handles checkbox, radio, select-multiple)
  function _getFieldValue(field) {
    const type = field.type;
    if (type === 'checkbox') {return field.checked;}
    if (type === 'radio') {
      const checked = _getFields().find(candidate => candidate.type === 'radio'
        && candidate.name === field.name
        && candidate.checked);
      return checked ? checked.value : null;
    }
    if (type === 'select-multiple') {
      return Array.from(field.selectedOptions).map(o => o.value);
    }
    return field.value;
  }

  // Built-in validators
  const _validators = Object.assign(Object.create(null), {
    required: (v) => {
      if (typeof v === 'string') {return v.trim() !== '';}
      if (typeof v === 'boolean') {return v === true;}
      if (Array.isArray(v)) {return v.length > 0;}
      return v !== null && v !== undefined;
    },
    email: (v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
    phone: (v) => !v || /^[\d\s\-+()]{7,20}$/.test(v),
    url: (v) => { if (!v) {return true;} try { new URL(v); return true; } catch { return false; } },
    number: (v) => !v || (!isNaN(parseFloat(v)) && isFinite(v)),
    minlength: (v, min) => !v || v.length >= parseInt(min),
    maxlength: (v, max) => !v || v.length <= parseInt(max),
    min: (v, min) => !v || parseFloat(v) >= parseFloat(min),
    max: (v, max) => !v || parseFloat(v) <= parseFloat(max),
    pattern: (v, pat) => {
      if (!v) {return true;}
      try {return new RegExp(pat).test(v);} catch {return false;}
    },
    equalTo: (v, targetId) => {
      const t = document.getElementById(targetId);
      return !t || v === t.value;
    },
  });

  const _messages = Object.assign(Object.create(null), {
    required:  'This field is required',
    email:     'Please enter a valid email address',
    phone:     'Please enter a valid phone number',
    url:       'Please enter a valid URL',
    number:    'Please enter a valid number',
    minlength: (p) => `Minimum length is ${p} characters`,
    maxlength: (p) => `Maximum length is ${p} characters`,
    min:       (p) => `Minimum value is ${p}`,
    max:       (p) => `Maximum value is ${p}`,
    pattern:   'Format is incorrect',
    equalTo:   'Values do not match',
  });

  // Validate a single field
  function validateField(field) {
    if (destroyed || !_isManagedField(field)) {return false;}
    const value = _getFieldValue(field);
    const errors = [];

    for (const [ name, fn ] of Object.entries(_validators)) {
      const attr = field.getAttribute(`data-${name}`);
      if (attr !== null) {
        const ok = fn(value, attr);
        if (!ok) {
          const customMsg = field.getAttribute(`data-message-${name}`);
          const msg = customMsg || (typeof _messages[name] === 'function' ? _messages[name](attr) : _messages[name]);
          errors.push(msg);
        }
      }
    }

    if (errors.length > 0) {
      showError(field, errors[0]);
      return false;
    }
    clearError(field);
    return true;
  }

  // Validate all fields
  function validate() {
    if (destroyed) {return false;}
    const fields = _getFields();
    let valid = true;
    fields.forEach(f => {
      if (!validateField(f)) {valid = false;}
    });
    if (onValidate) {onValidate(valid);}
    return valid;
  }

  // Show/clear errors
  function showError(field, message) {
    if (destroyed || !_isManagedField(field)) {return;}
    clearError(field);
    field.classList.add('ds-form-field--error');
    field.setAttribute('aria-invalid', 'true');

    const errEl = document.createElement('span');
    errEl.className = 'ds-form-error';
    errEl.textContent = message;

    const container = field.parentElement;
    if (container && container.classList.contains('ds-form-field')) {
      container.appendChild(errEl);
    } else if (field.parentNode) {
      field.parentNode.insertBefore(errEl, field.nextSibling);
    }
    errorElements.set(field, errEl);
  }

  function clearError(field) {
    if (!field?.classList) {return;}
    field.classList.remove('ds-form-field--error');
    field.setAttribute('aria-invalid', 'false');
    errorElements.get(field)?.remove();
    errorElements.delete(field);
  }

  function clearAllErrors() {
    const fields = new Set([ ..._getFields(), ...errorElements.keys() ]);
    fields.forEach(field => clearError(field));
  }

  // Data access
  function getData() {
    if (destroyed) {return {};}
    const data = {};
    _getFields().forEach(field => {
      const name = field.name;
      if (!name) {return;}
      const value = _getFieldValue(field);

      if (field.type === 'checkbox') {
        if (!hasOwn(data, name)) {
          Object.defineProperty(data, name, {
            value: [], enumerable: true, configurable: true, writable: true,
          });
        }
        if (field.checked) {data[name].push(field.value);}
      } else if (field.type === 'radio') {
        if (field.checked) {
          Object.defineProperty(data, name, {
            value: field.value, enumerable: true, configurable: true, writable: true,
          });
        }
      } else {
        Object.defineProperty(data, name, {
          value, enumerable: true, configurable: true, writable: true,
        });
      }
    });
    return data;
  }

  function setData(data) {
    if (destroyed || !data || typeof data !== 'object') {return;}
    const fieldsByName = new Map();
    _getFields().forEach(field => {
      if (!fieldsByName.has(field.name)) {fieldsByName.set(field.name, []);}
      fieldsByName.get(field.name).push(field);
    });
    Object.keys(data).forEach(name => {
      const fields = fieldsByName.get(name) || [];
      fields.forEach(field => {
        const type = field.type;
        if (type === 'checkbox') {
          const values = Array.isArray(data[name]) ? data[name] : [ data[name] ];
          field.checked = values.includes(field.value);
        } else if (type === 'radio') {
          field.checked = field.value === data[name];
        } else if (type === 'select-multiple') {
          const values = Array.isArray(data[name]) ? data[name] : [ data[name] ];
          Array.from(field.options).forEach(o => { o.selected = values.includes(o.value); });
        } else {
          field.value = data[name] != null ? data[name] : '';
        }
      });
    });
  }

  function reset() {
    if (destroyed) {return;}
    formEl.reset();
    clearAllErrors();
  }

  // Custom validator
  function addValidator(name, fn, message) {
    if (typeof name !== 'string' || !name || typeof fn !== 'function') {
      throw new TypeError('Form: validator name and function are required');
    }
    _validators[name] = fn;
    _messages[name] = message || 'Invalid input';
  }

  for (const [ name, validator ] of Object.entries(config.validators || {})) {
    if (typeof validator === 'function') {addValidator(name, validator);}
  }

  const submitHandler = (event) => {
    if (!validate()) {
      event.preventDefault();
      return;
    }
    if (onSubmit) {
      event.preventDefault();
      onSubmit(getData());
    }
  };
  const blurHandler = (event) => {
    if (_isManagedField(event.target)) {validateField(event.target);}
  };
  const inputHandler = (event) => {
    if (_isManagedField(event.target)) {clearError(event.target);}
  };

  listeners.on(formEl, 'submit', submitHandler);
  listeners.on(formEl, 'blur', blurHandler, true);
  listeners.on(formEl, 'input', inputHandler);

  const api = {
    element: formEl,
    validate,
    validateField,
    showError,
    clearError,
    clearAllErrors,
    getData,
    setData,
    reset,
    addValidator,
    destroy() {
      if (destroyed) {return;}
      clearAllErrors();
      destroyed = true;
      listeners.destroy();
      Object.freeze(api);
    },
  };

  return api;
}
