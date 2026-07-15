// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Form module built on the 2.0 reactive core.
 *
 * Form management with field collection, validation integration,
 * data binding, and submit handling.
 *
 * ```js
 * import { Form } from '@kupola/core/components/form';
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

export function Form(options = {}) {
  const formEl = options.element;
  if (!formEl) throw new Error('Form: element is required');

  const onSubmit = options.onSubmit || null;
  const onValidate = options.onValidate || null;
  const _fieldHandlers = new Map();
  let _submitHandler = null;

  // Collect fields
  function _getFields() {
    return Array.from(formEl.querySelectorAll('input, select, textarea'))
      .filter(f => !f.hasAttribute('data-kupola-ignore'));
  }

  // Get field value (handles checkbox, radio, select-multiple)
  function _getFieldValue(field) {
    const type = field.type;
    if (type === 'checkbox') return field.checked;
    if (type === 'radio') {
      const checked = formEl.querySelector(`input[name="${field.name}"]:checked`);
      return checked ? checked.value : null;
    }
    if (type === 'select-multiple') {
      return Array.from(field.selectedOptions).map(o => o.value);
    }
    return field.value;
  }

  // Built-in validators
  const _validators = {
    required: (v) => {
      if (typeof v === 'string') return v.trim() !== '';
      if (typeof v === 'boolean') return v === true;
      if (Array.isArray(v)) return v.length > 0;
      return v !== null && v !== undefined;
    },
    email: (v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
    phone: (v) => !v || /^[\d\s\-+()]{7,20}$/.test(v),
    url: (v) => { if (!v) return true; try { new URL(v); return true; } catch { return false; } },
    number: (v) => !v || (!isNaN(parseFloat(v)) && isFinite(v)),
    minlength: (v, min) => !v || v.length >= parseInt(min),
    maxlength: (v, max) => !v || v.length <= parseInt(max),
    min: (v, min) => !v || parseFloat(v) >= parseFloat(min),
    max: (v, max) => !v || parseFloat(v) <= parseFloat(max),
    pattern: (v, pat) => !v || new RegExp(pat).test(v),
    equalTo: (v, targetId) => {
      const t = document.getElementById(targetId);
      return !t || v === t.value;
    },
  };

  const _messages = {
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
  };

  // Validate a single field
  function validateField(field) {
    const value = _getFieldValue(field);
    const errors = [];

    for (const [name, fn] of Object.entries(_validators)) {
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
    const fields = _getFields();
    let valid = true;
    fields.forEach(f => {
      if (!validateField(f)) valid = false;
    });
    if (onValidate) onValidate(valid);
    return valid;
  }

  // Show/clear errors
  function showError(field, message) {
    clearError(field);
    field.classList.add('ds-form-field--error');

    const errEl = document.createElement('span');
    errEl.className = 'ds-form-error';
    errEl.textContent = message;

    const container = field.parentElement;
    if (container && container.classList.contains('ds-form-field')) {
      container.appendChild(errEl);
    } else if (field.parentNode) {
      field.parentNode.insertBefore(errEl, field.nextSibling);
    }
  }

  function clearError(field) {
    field.classList.remove('ds-form-field--error');
    // Find the error element that directly follows this field
    let next = field.nextElementSibling;
    if (next && next.classList.contains('ds-form-error')) {
      next.remove();
    }
  }

  function clearAllErrors() {
    _getFields().forEach(f => clearError(f));
  }

  // Data access
  function getData() {
    const data = {};
    _getFields().forEach(field => {
      const name = field.name;
      if (!name) return;
      const value = _getFieldValue(field);

      if (field.type === 'checkbox') {
        if (!data[name]) data[name] = [];
        if (field.checked) data[name].push(field.value);
      } else if (field.type === 'radio') {
        if (field.checked) data[name] = field.value;
      } else {
        data[name] = value;
      }
    });
    return data;
  }

  function setData(data) {
    Object.keys(data).forEach(name => {
      const fields = formEl.querySelectorAll(`[name="${name}"]`);
      fields.forEach(field => {
        const type = field.type;
        if (type === 'checkbox') {
          const values = Array.isArray(data[name]) ? data[name] : [data[name]];
          field.checked = values.includes(field.value);
        } else if (type === 'radio') {
          field.checked = field.value === data[name];
        } else if (type === 'select-multiple') {
          const values = Array.isArray(data[name]) ? data[name] : [data[name]];
          Array.from(field.options).forEach(o => { o.selected = values.includes(o.value); });
        } else {
          field.value = data[name] != null ? data[name] : '';
        }
      });
    });
  }

  function reset() {
    formEl.reset();
    clearAllErrors();
  }

  // Custom validator
  function addValidator(name, fn, message) {
    _validators[name] = fn;
    _messages[name] = message || 'Invalid input';
  }

  // Bind events
  function _bindEvents() {
    _submitHandler = (e) => {
      if (!validate()) {
        e.preventDefault();
        return;
      }
      if (onSubmit) {
        e.preventDefault();
        onSubmit(getData());
      }
    };
    formEl.addEventListener('submit', _submitHandler);

    _getFields().forEach(field => {
      const blurHandler = () => validateField(field);
      const inputHandler = () => clearError(field);
      _fieldHandlers.set(field, { blur: blurHandler, input: inputHandler });
      field.addEventListener('blur', blurHandler);
      field.addEventListener('input', inputHandler);
    });
  }

  _bindEvents();

  // Destroy
  function destroy() {
    if (_submitHandler) {
      formEl.removeEventListener('submit', _submitHandler);
    }
    _fieldHandlers.forEach((handlers, field) => {
      field.removeEventListener('blur', handlers.blur);
      field.removeEventListener('input', handlers.input);
    });
    _fieldHandlers.clear();
  }

  return {
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
    destroy,
  };
}
