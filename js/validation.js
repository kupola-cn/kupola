class KupolaValidator {
  constructor() {
    this.validators = {
      required: this.validateRequired,
      email: this.validateEmail,
      url: this.validateUrl,
      minLength: this.validateMinLength,
      maxLength: this.validateMaxLength,
      pattern: this.validatePattern,
      min: this.validateMin,
      max: this.validateMax,
      equalTo: this.validateEqualTo,
      phone: this.validatePhone,
      date: this.validateDate,
      number: this.validateNumber
    };
    
    this.customValidators = {};
    this.asyncValidators = {};
    this.customAsyncValidators = {};
    this.formStates = {};
    this.submitting = new Set();
  }

  addValidator(name, callback) {
    this.customValidators[name] = callback;
  }

  addAsyncValidator(name, callback) {
    this.customAsyncValidators[name] = callback;
  }

  validate(form) {
    const formId = form.id || `form-${Math.random().toString(36).substr(2, 9)}`;
    const errors = {};
    const inputs = form.querySelectorAll('[data-validate]');
    let hasError = false;
    
    inputs.forEach(input => {
      const name = input.name || input.id;
      const rules = this.parseRules(input.getAttribute('data-validate'));
      const value = this.getValue(input);
      
      for (const [rule, params] of Object.entries(rules)) {
        const validatorFunc = this.customValidators[rule] || this.validators[rule];
        const isValid = validatorFunc?.(value, params);
        if (!isValid) {
          errors[name] = this.getErrorMessage(rule, params, input);
          this.showError(input, errors[name]);
          hasError = true;
          break;
        } else {
          this.clearError(input);
        }
      }
    });
    
    this.formStates[formId] = {
      valid: !hasError,
      errors: errors,
      errorCount: Object.keys(errors).length
    };
    
    this.updateFormState(form);
    
    return !hasError;
  }

  getValue(input) {
    if (input.classList.contains('ds-datepicker__input') || input.classList.contains('ds-timepicker__input')) {
      return input.value.trim();
    }
    
    if (input.closest('.ds-select')) {
      const select = input.closest('.ds-select');
      const valueEl = select.querySelector('.ds-select__value') || select.querySelector('.ds-select__trigger span');
      return valueEl ? valueEl.textContent.trim() : '';
    }
    
    if (input.closest('.ds-fileupload')) {
      const upload = input.closest('.ds-fileupload');
      const uploadInstance = upload.__fileUploadInstance;
      return uploadInstance && uploadInstance.getFiles().length > 0 ? 'has-files' : '';
    }
    
    return input.value.trim();
  }

  validateInput(input) {
    const rules = this.parseRules(input.getAttribute('data-validate'));
    const value = this.getValue(input);
    
    for (const [rule, params] of Object.entries(rules)) {
      const validatorFunc = this.customValidators[rule] || this.validators[rule];
      const isValid = validatorFunc?.(value, params);
      if (!isValid) {
        this.showError(input, this.getErrorMessage(rule, params, input));
        return false;
      }
    }
    
    this.clearError(input);
    return true;
  }

  validateAll() {
    const forms = document.querySelectorAll('form[data-validation]');
    let allValid = true;
    
    forms.forEach(form => {
      if (!this.validate(form)) {
        allValid = false;
      }
    });
    
    return allValid;
  }

  async validateAsync(form, options = {}) {
    const formId = form.id || `form-${Math.random().toString(36).substr(2, 9)}`;
    const errors = {};
    const group = options.group;
    const inputs = group 
      ? form.querySelectorAll(`[data-validate][data-validate-group="${group}"]`)
      : form.querySelectorAll('[data-validate]');
    
    let hasError = false;
    
    for (const input of inputs) {
      const isValid = await this.validateInputAsync(input);
      if (!isValid) {
        hasError = true;
      }
    }
    
    const formErrors = {};
    inputs.forEach(input => {
      const name = input.name || input.id;
      const errorElement = input.parentElement.querySelector('.ds-input__error');
      if (errorElement) {
        formErrors[name] = errorElement.textContent;
      }
    });
    
    this.formStates[formId] = {
      valid: !hasError,
      errors: formErrors,
      errorCount: Object.keys(formErrors).length
    };
    
    this.updateFormState(form);
    
    return !hasError;
  }

  async validateInputAsync(input) {
    const rules = this.parseRules(input.getAttribute('data-validate'));
    const asyncRules = this.parseRules(input.getAttribute('data-validate-async') || '');
    const value = this.getValue(input);
    
    for (const [rule, params] of Object.entries(rules)) {
      const validatorFunc = this.customValidators[rule] || this.validators[rule];
      const isValid = validatorFunc?.(value, params);
      if (!isValid) {
        this.showError(input, this.getErrorMessage(rule, params, input));
        return false;
      }
    }
    
    for (const [rule, params] of Object.entries(asyncRules)) {
      const validatorFunc = this.customAsyncValidators[rule] || this.asyncValidators[rule];
      if (validatorFunc) {
        try {
          const isValid = await validatorFunc(value, params, input);
          if (!isValid) {
            this.showError(input, this.getErrorMessage(rule, params, input));
            return false;
          }
        } catch (e) {
          this.showError(input, e.message || 'Validation error');
          return false;
        }
      }
    }
    
    this.clearError(input);
    return true;
  }

  async validateGroup(form, groupName) {
    const inputs = form.querySelectorAll(`[data-validate][data-validate-group="${groupName}"]`);
    let hasError = false;
    
    for (const input of inputs) {
      const isValid = await this.validateInputAsync(input);
      if (!isValid) {
        hasError = true;
      }
    }
    
    return !hasError;
  }

  getGroups(form) {
    const groups = new Set();
    form.querySelectorAll('[data-validate-group]').forEach(input => {
      groups.add(input.getAttribute('data-validate-group'));
    });
    return Array.from(groups);
  }

  getFormState(form) {
    const formId = form.id || `form-${Math.random().toString(36).substr(2, 9)}`;
    return this.formStates[formId] || { valid: true, errors: {}, errorCount: 0, loading: false, submitting: false, disabled: false };
  }

  updateFormState(form) {
    const state = this.getFormState(form);
    
    if (state.valid) {
      form.classList.remove('ds-form--invalid');
      form.classList.add('ds-form--valid');
    } else {
      form.classList.remove('ds-form--valid');
      form.classList.add('ds-form--invalid');
    }
    
    if (state.loading) {
      form.classList.add('ds-form--loading');
    } else {
      form.classList.remove('ds-form--loading');
    }
    
    if (state.submitting) {
      form.classList.add('ds-form--submitting');
    } else {
      form.classList.remove('ds-form--submitting');
    }
    
    if (state.disabled) {
      form.classList.add('ds-form--disabled');
      form.querySelectorAll('input, select, textarea, button').forEach(el => el.disabled = true);
    } else {
      form.classList.remove('ds-form--disabled');
      form.querySelectorAll('input, select, textarea, button').forEach(el => {
        if (!el.hasAttribute('data-permanent-disabled')) {
          el.disabled = false;
        }
      });
    }
    
    const statusElement = form.querySelector('.ds-form__status');
    if (statusElement) {
      if (state.errorCount > 0) {
        statusElement.textContent = `${state.errorCount} ${state.errorCount === 1 ? 'error' : 'errors'} found`;
        statusElement.classList.add('ds-form__status--error');
      } else {
        statusElement.textContent = 'All fields are valid';
        statusElement.classList.remove('ds-form__status--error');
      }
    }
  }

  setFormLoading(form, loading) {
    const formId = form.id || `form-${Math.random().toString(36).substr(2, 9)}`;
    if (!this.formStates[formId]) {
      this.formStates[formId] = { valid: true, errors: {}, errorCount: 0, loading: false, submitting: false, disabled: false };
    }
    this.formStates[formId].loading = loading;
    this.updateFormState(form);
  }

  setFormSubmitting(form, submitting) {
    const formId = form.id || `form-${Math.random().toString(36).substr(2, 9)}`;
    if (!this.formStates[formId]) {
      this.formStates[formId] = { valid: true, errors: {}, errorCount: 0, loading: false, submitting: false, disabled: false };
    }
    this.formStates[formId].submitting = submitting;
    this.updateFormState(form);
  }

  setFormDisabled(form, disabled) {
    const formId = form.id || `form-${Math.random().toString(36).substr(2, 9)}`;
    if (!this.formStates[formId]) {
      this.formStates[formId] = { valid: true, errors: {}, errorCount: 0, loading: false, submitting: false, disabled: false };
    }
    this.formStates[formId].disabled = disabled;
    this.updateFormState(form);
  }

  resetForm(form) {
    const formId = form.id || `form-${Math.random().toString(36).substr(2, 9)}`;
    this.formStates[formId] = { valid: true, errors: {}, errorCount: 0, loading: false, submitting: false, disabled: false };
    form.reset();
    form.querySelectorAll('.ds-input--error').forEach(el => {
      el.classList.remove('ds-input--error');
      const errorElement = el.parentElement?.querySelector('.ds-input__error');
      if (errorElement) {
        errorElement.textContent = '';
      }
    });
    this.updateFormState(form);
  }

  parseRules(rulesString) {
    const rules = {};
    const parts = rulesString.split('|');
    
    parts.forEach(part => {
      const [rule, params] = part.split(':');
      rules[rule] = params ? params.split(',') : [];
    });
    
    return rules;
  }

  validateRequired(value) {
    return value !== '';
  }

  validateEmail(value) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  }

  validateUrl(value) {
    const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
    return urlRegex.test(value);
  }

  validateMinLength(value, [min]) {
    return value.length >= parseInt(min);
  }

  validateMaxLength(value, [max]) {
    return value.length <= parseInt(max);
  }

  validatePattern(value, [pattern]) {
    const regex = new RegExp(pattern);
    return regex.test(value);
  }

  validateMin(value, [min]) {
    return parseFloat(value) >= parseFloat(min);
  }

  validateMax(value, [max]) {
    return parseFloat(value) <= parseFloat(max);
  }

  validateEqualTo(value, [targetId]) {
    const target = document.getElementById(targetId);
    return target && value === target.value;
  }

  validatePhone(value) {
    const phoneRegex = /^[\d\s\-\+\(\)]{7,20}$/;
    return phoneRegex.test(value);
  }

  validateDate(value) {
    const dateRegex = /^\d{4}[-/]\d{2}[-/]\d{2}$/;
    return dateRegex.test(value) && !isNaN(Date.parse(value));
  }

  validateNumber(value) {
    return !isNaN(parseFloat(value)) && isFinite(value);
  }

  showError(input, message) {
    input.classList.add('ds-input--error');
    input.classList.remove('ds-input--success');
    input.setAttribute('aria-invalid', 'true');
    
    let errorElement = input.parentElement.querySelector('.ds-input__error');
    if (!errorElement) {
      errorElement = document.createElement('span');
      errorElement.className = 'ds-input__error';
      errorElement.setAttribute('role', 'alert');
      errorElement.setAttribute('aria-live', 'polite');
      input.parentElement.appendChild(errorElement);
    }
    errorElement.textContent = message;
    
    this.removeStatusIcon(input);
    
    input.dispatchEvent(new CustomEvent('validation-error', { detail: { message } }));
  }

  clearError(input) {
    input.classList.remove('ds-input--error');
    input.setAttribute('aria-invalid', 'false');
    
    const errorElement = input.parentElement.querySelector('.ds-input__error');
    if (errorElement) {
      errorElement.remove();
    }
    
    input.dispatchEvent(new CustomEvent('validation-success'));
  }

  showSuccess(input) {
    input.classList.add('ds-input--success');
    input.classList.remove('ds-input--error');
    input.setAttribute('aria-invalid', 'false');
    
    this.removeStatusIcon(input);
    
    const icon = document.createElement('span');
    icon.className = 'ds-input__status-icon ds-input__status-icon--success';
    icon.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>';
    
    input.parentElement.appendChild(icon);
  }

  removeStatusIcon(input) {
    const icon = input.parentElement.querySelector('.ds-input__status-icon');
    if (icon) {
      icon.remove();
    }
  }

  getErrorMessage(rule, params, input) {
    const customMessage = input.getAttribute(`data-message-${rule}`);
    if (customMessage) return customMessage;
    
    const messages = {
      required: 'This field is required',
      email: 'Please enter a valid email address',
      url: 'Please enter a valid URL',
      minLength: `Minimum length is ${params[0]} characters`,
      maxLength: `Maximum length is ${params[0]} characters`,
      pattern: 'Please enter a valid value',
      min: `Minimum value is ${params[0]}`,
      max: `Maximum value is ${params[0]}`,
      equalTo: 'Values do not match',
      phone: 'Please enter a valid phone number',
      date: 'Please enter a valid date (YYYY-MM-DD)',
      number: 'Please enter a valid number'
    };
    return messages[rule] || 'Invalid input';
  }
}

const validator = new KupolaValidator();

if (!window.__kupolaValidationInitialized) {
  window.__kupolaValidationInitialized = true;
  document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('form[data-validation]').forEach(form => {
    form.addEventListener('submit', async (e) => {
      const formId = form.id || `form-${Math.random().toString(36).substr(2, 9)}`;
      
      if (validator.submitting.has(formId)) {
        e.preventDefault();
        return;
      }
      
      e.preventDefault();
      
      const hasAsyncValidation = form.querySelector('[data-validate-async]') !== null;
      
      let isValid;
      if (hasAsyncValidation) {
        isValid = await validator.validateAsync(form);
      } else {
        isValid = validator.validate(form);
      }
      
      if (!isValid) {
        const firstError = form.querySelector('.ds-input--error');
        if (firstError) {
          firstError.focus();
        }
      } else {
        validator.submitting.add(formId);
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
          const originalText = submitBtn.textContent;
          submitBtn.setAttribute('data-original-text', originalText);
          submitBtn.textContent = 'Submitting...';
          submitBtn.disabled = true;
        }
        
        try {
          const onSubmit = form.getAttribute('data-on-submit');
          if (onSubmit && window[onSubmit]) {
            await window[onSubmit](form);
          } else {
            form.submit();
          }
        } finally {
          validator.submitting.delete(formId);
          if (submitBtn) {
            submitBtn.textContent = submitBtn.getAttribute('data-original-text') || 'Submit';
            submitBtn.disabled = false;
          }
        }
      }
    });

    form.querySelectorAll('[data-validate]').forEach(input => {
      input.addEventListener('blur', () => {
        setTimeout(() => {
          const activeElement = document.activeElement;
          if (activeElement && activeElement.closest('.ds-select')) {
            return;
          }
          const isValid = validator.validateInput(input);
          if (isValid && input.value.trim()) {
            validator.showSuccess(input);
          }
        }, 50);
      });

      const debounce = (func, wait) => {
        let timeout;
        return (...args) => {
          clearTimeout(timeout);
          timeout = setTimeout(() => func(...args), wait);
        };
      };

      const validateOnInput = debounce(() => {
        const value = validator.getValue(input);
        if (value.length > 0 || input.classList.contains('ds-input--error')) {
          const isValid = validator.validateInput(input);
          if (isValid && value) {
            validator.showSuccess(input);
          }
        } else {
          validator.removeStatusIcon(input);
        }
      }, 300);

      input.addEventListener('input', validateOnInput);

      input.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
          const isValid = validator.validateInput(input);
          if (isValid && input.value.trim()) {
            validator.showSuccess(input);
          }
        }
      });
    });
  });
});
}

export { KupolaValidator, validator };