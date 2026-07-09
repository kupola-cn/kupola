(function(window) {
    class KupolaForm {
        constructor(formOrSelector, options = {}) {
            this.form = typeof formOrSelector === 'string'
                ? document.querySelector(formOrSelector)
                : formOrSelector;
            
            this.options = {
                validateOnSubmit: true,
                validateOnChange: false,
                validateOnBlur: false,
                preventDefault: true,
                ...options
            };

            this.submitHandlers = [];
            this.isSubmitting = false;
            this.errors = {};
            this.rules = {};
            this.validator = window.kupolaValidator || new window.KupolaValidator();

            if (!this.form || !(this.form instanceof HTMLFormElement)) {
                console.warn('[KupolaForm] Invalid form element');
                return;
            }

            this._init();
        }

        _init() {
            if (this.options.validateOnChange) {
                this.form.addEventListener('input', (e) => {
                    this._validateField(e.target);
                });
            }

            if (this.options.validateOnBlur) {
                this.form.addEventListener('blur', (e) => {
                    if (e.target.form === this.form) {
                        this._validateField(e.target);
                    }
                }, true);
            }
        }

        submit(handler) {
            const wrappedHandler = async (e) => {
                if (this.options.preventDefault) {
                    e.preventDefault();
                }
                if (this.isSubmitting) return;
                this.isSubmitting = true;

                try {
                    if (this.options.validateOnSubmit) {
                        const validation = await this.validate();
                        if (!validation.valid) {
                            this._showErrors(validation.errors);
                            return;
                        }
                    }

                    const result = handler(e);
                    if (result instanceof Promise) {
                        await result;
                    }
                } finally {
                    this.isSubmitting = false;
                }
            };

            this.submitHandlers.push(wrappedHandler);
            this.form.addEventListener('submit', wrappedHandler);

            return () => {
                const index = this.submitHandlers.indexOf(wrappedHandler);
                if (index > -1) {
                    this.submitHandlers.splice(index, 1);
                    this.form.removeEventListener('submit', wrappedHandler);
                }
            };
        }

        setRules(rules) {
            this.rules = { ...this.rules, ...rules };
            this._applyRulesToDOM();
            return this;
        }

        _applyRulesToDOM() {
            Object.keys(this.rules).forEach(name => {
                const input = this.form.querySelector(`[name="${name}"]`);
                if (!input) return;

                const fieldRules = this.rules[name];
                const ruleString = this._rulesToString(fieldRules);
                input.setAttribute('data-validate', ruleString);
            });
        }

        _rulesToString(rules) {
            if (typeof rules === 'function') {
                return 'custom';
            }

            const parts = [];
            Object.keys(rules).forEach(rule => {
                const config = rules[rule];
                if (typeof config === 'object' && config !== null) {
                    if (rule === 'pattern') {
                        parts.push(`pattern:${config.source?.replace(/\//g, '')}`);
                    } else if (rule === 'equalTo') {
                        parts.push(`equalTo:${config}`);
                    } else {
                        parts.push(rule);
                    }
                } else if (typeof config === 'number' || typeof config === 'string') {
                    parts.push(`${rule}:${config}`);
                } else if (config === true) {
                    parts.push(rule);
                }
            });
            return parts.join('|');
        }

        async validate(fields = null) {
            this.errors = {};
            const allErrors = [];

            const inputs = fields
                ? Array.isArray(fields) ? fields : [fields]
                : this.form.querySelectorAll('input, select, textarea');

            for (const input of inputs) {
                const name = input.name;
                if (!name) continue;

                const errors = await this._validateField(input);
                if (errors.length > 0) {
                    this.errors[name] = errors;
                    allErrors.push(...errors);
                }
            }

            return {
                valid: allErrors.length === 0,
                errors: allErrors,
                fieldErrors: this.errors
            };
        }

        async _validateField(input) {
            const name = input.name;
            const rules = this.rules[name];

            if (typeof rules === 'function') {
                const result = rules(input.value.trim(), input);
                if (result instanceof Promise) {
                    const asyncResult = await result;
                    if (asyncResult !== true) {
                        const displayName = input.getAttribute('data-label') || input.getAttribute('placeholder') || name;
                        const message = typeof asyncResult === 'string' ? asyncResult : `${displayName} 验证失败`;
                        this.validator.showError(input, message);
                        return [message];
                    }
                } else if (result !== true) {
                    const displayName = input.getAttribute('data-label') || input.getAttribute('placeholder') || name;
                    const message = typeof result === 'string' ? result : `${displayName} 验证失败`;
                    this.validator.showError(input, message);
                    return [message];
                }
                this.validator.clearError(input);
                return [];
            }

            const isValid = await this.validator.validateInputAsync(input);
            if (!isValid) {
                const errorElement = input.parentElement?.querySelector('.ds-input__error');
                return errorElement ? [errorElement.textContent] : ['Validation failed'];
            }
            return [];
        }

        _showErrors(errors) {
            if (typeof Message !== 'undefined') {
                Message.error(errors.join('\n'));
            } else if (typeof console !== 'undefined') {
                console.error('Form validation errors:', errors);
            }
        }

        getValues() {
            const values = {};
            const inputs = this.form.querySelectorAll('input, select, textarea');

            inputs.forEach(input => {
                const name = input.name;
                if (!name) return;

                if (input.type === 'checkbox') {
                    if (!values[name]) {
                        values[name] = [];
                    }
                    if (input.checked) {
                        values[name].push(input.value);
                    }
                } else if (input.type === 'radio') {
                    if (input.checked) {
                        values[name] = input.value;
                    }
                } else if (input.type === 'file') {
                    values[name] = input.files;
                } else {
                    values[name] = input.value;
                }
            });

            return values;
        }

        setValues(values) {
            Object.keys(values).forEach(key => {
                const input = this.form.querySelector(`[name="${key}"]`);
                if (!input) return;

                if (input.type === 'checkbox') {
                    const valuesArray = Array.isArray(values[key]) ? values[key] : [values[key]];
                    input.checked = valuesArray.includes(input.value);
                } else if (input.type === 'radio') {
                    const radio = this.form.querySelector(`[name="${key}"][value="${values[key]}"]`);
                    if (radio) radio.checked = true;
                } else if (input.type === 'file') {
                    const dataTransfer = new DataTransfer();
                    if (values[key] instanceof FileList) {
                        Array.from(values[key]).forEach(file => {
                            dataTransfer.items.add(file);
                        });
                    }
                    input.files = dataTransfer.files;
                } else {
                    input.value = values[key];
                }
            });
            return this;
        }

        reset() {
            this.form.reset();
            this.errors = {};
            this.validator.resetForm(this.form);
            return this;
        }

        clearErrors() {
            this.errors = {};
            this.form.querySelectorAll('.ds-input--error').forEach(input => {
                this.validator.clearError(input);
            });
            return this;
        }

        getError(fieldName) {
            return this.errors[fieldName] || [];
        }

        hasError(fieldName) {
            return this.errors[fieldName] && this.errors[fieldName].length > 0;
        }

        destroy() {
            this.submitHandlers.forEach(handler => {
                this.form.removeEventListener('submit', handler);
            });
            this.submitHandlers = [];
            this.errors = {};
            this.rules = {};
        }
    }

    function useForm(formOrSelector, options = {}) {
        return new KupolaForm(formOrSelector, options);
    }

    function createForm(formOrSelector, options = {}) {
        return new KupolaForm(formOrSelector, options);
    }

    window.KupolaForm = KupolaForm;
    window.useForm = useForm;
    window.createForm = createForm;
})(window);