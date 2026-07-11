class KupolaForm {
    constructor(formElement) {
        this.form = formElement;
        this.fields = [];
        this.validators = {};
        this.errorMessages = {};
        this._init();
    }

    _init() {
        this._setupValidators();
        this._collectFields();
        this._bindEvents();
    }

    _setupValidators() {
        this.validators = {
            required: (value) => {
                if (typeof value === 'string') {
                    return value.trim() !== '';
                }
                if (Array.isArray(value)) {
                    return value.length > 0;
                }
                return value !== null && value !== undefined;
            },
            email: (value) => {
                if (!value) return true;
                const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                return regex.test(value);
            },
            phone: (value) => {
                if (!value) return true;
                const regex = /^1[3-9]\d{9}$/;
                return regex.test(value);
            },
            url: (value) => {
                if (!value) return true;
                try {
                    new URL(value);
                    return true;
                } catch {
                    return false;
                }
            },
            number: (value) => {
                if (!value) return true;
                return !isNaN(parseFloat(value)) && isFinite(value);
            },
            minlength: (value, min) => {
                if (!value) return true;
                return value.length >= parseInt(min);
            },
            maxlength: (value, max) => {
                if (!value) return true;
                return value.length <= parseInt(max);
            },
            min: (value, min) => {
                if (!value) return true;
                return parseFloat(value) >= parseFloat(min);
            },
            max: (value, max) => {
                if (!value) return true;
                return parseFloat(value) <= parseFloat(max);
            },
            pattern: (value, pattern) => {
                if (!value) return true;
                const regex = new RegExp(pattern);
                return regex.test(value);
            },
            equalTo: (value, targetId) => {
                const target = document.getElementById(targetId);
                if (!target) return true;
                return value === target.value;
            }
        };

        this.errorMessages = {
            required: '该字段为必填项',
            email: '请输入有效的邮箱地址',
            phone: '请输入有效的手机号码',
            url: '请输入有效的URL地址',
            number: '请输入有效的数字',
            minlength: (param) => `至少需要${param}个字符`,
            maxlength: (param) => `最多允许${param}个字符`,
            min: (param) => `最小值为${param}`,
            max: (param) => `最大值为${param}`,
            pattern: '格式不正确',
            equalTo: '两次输入不一致'
        };
    }

    _collectFields() {
        const inputs = this.form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            if (!input.hasAttribute('data-kupola-ignore')) {
                this.fields.push(input);
            }
        });
    }

    _bindEvents() {
        this.form.addEventListener('submit', (e) => {
            if (!this.validate()) {
                e.preventDefault();
            }
        });

        this.fields.forEach(field => {
            field.addEventListener('blur', () => this.validateField(field));
            field.addEventListener('input', () => this.clearError(field));
        });
    }

    validate() {
        let isValid = true;
        this.fields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });
        return isValid;
    }

    validateField(field) {
        const errors = this._getFieldErrors(field);
        
        if (errors.length > 0) {
            this.showError(field, errors[0]);
            return false;
        }
        
        this.clearError(field);
        return true;
    }

    _getFieldErrors(field) {
        const errors = [];
        const value = this._getFieldValue(field);
        
        for (const [validatorName, validator] of Object.entries(this.validators)) {
            const attrValue = field.getAttribute(`data-${validatorName}`);
            if (attrValue !== null) {
                const isValid = validator(value, attrValue);
                if (!isValid) {
                    let message = this.errorMessages[validatorName];
                    if (typeof message === 'function') {
                        message = message(attrValue);
                    }
                    errors.push(message);
                }
            }
        }
        
        return errors;
    }

    _getFieldValue(field) {
        const type = field.type;
        
        if (type === 'checkbox') {
            return field.checked;
        }
        
        if (type === 'radio') {
            const name = field.name;
            const checked = this.form.querySelector(`input[name="${name}"]:checked`);
            return checked ? checked.value : null;
        }
        
        if (type === 'select-multiple') {
            return Array.from(field.selectedOptions).map(option => option.value);
        }
        
        return field.value;
    }

    showError(field, message) {
        this.clearError(field);
        
        const errorElement = document.createElement('span');
        errorElement.className = 'ds-form-error';
        errorElement.textContent = message;
        
        field.classList.add('ds-form-field--error');
        
        const container = field.parentElement;
        if (container.classList.contains('ds-form-field')) {
            container.appendChild(errorElement);
        } else {
            field.parentNode.insertBefore(errorElement, field.nextSibling);
        }
    }

    clearError(field) {
        field.classList.remove('ds-form-field--error');
        
        const errorElement = field.parentElement.querySelector('.ds-form-error');
        if (errorElement) {
            errorElement.remove();
        }
    }

    addValidator(name, validator, message) {
        this.validators[name] = validator;
        this.errorMessages[name] = message;
    }

    getData() {
        const data = {};
        
        this.fields.forEach(field => {
            const name = field.name;
            if (!name) return;
            
            const value = this._getFieldValue(field);
            
            if (field.type === 'checkbox') {
                if (!data[name]) {
                    data[name] = [];
                }
                if (field.checked) {
                    data[name].push(field.value);
                }
            } else if (field.type === 'radio') {
                if (!data[name] && field.checked) {
                    data[name] = field.value;
                }
            } else {
                data[name] = value;
            }
        });
        
        return data;
    }

    setData(data) {
        Object.keys(data).forEach(name => {
            const fields = this.form.querySelectorAll(`[name="${name}"]`);
            
            fields.forEach(field => {
                const type = field.type;
                
                if (type === 'checkbox') {
                    const values = Array.isArray(data[name]) ? data[name] : [data[name]];
                    field.checked = values.includes(field.value);
                } else if (type === 'radio') {
                    field.checked = field.value === data[name];
                } else if (type === 'select-multiple') {
                    const values = Array.isArray(data[name]) ? data[name] : [data[name]];
                    Array.from(field.options).forEach(option => {
                        option.selected = values.includes(option.value);
                    });
                } else {
                    field.value = data[name] || '';
                }
            });
        });
    }

    reset() {
        this.form.reset();
        this.fields.forEach(field => this.clearError(field));
    }

    destroy() {
        this.fields.forEach(field => {
            field.removeEventListener('blur', () => this.validateField(field));
            field.removeEventListener('input', () => this.clearError(field));
        });
        
        this.form.removeEventListener('submit', () => {});
        
        this.fields = null;
        this.validators = null;
        this.errorMessages = null;
        this.form = null;
    }
}

function initFormValidation(formSelector) {
    const forms = document.querySelectorAll(formSelector || '.ds-form');
    
    forms.forEach(form => {
        if (form._kupolaForm) return;
        
        const instance = new KupolaForm(form);
        form._kupolaForm = instance;
    });
    
    return forms.length;
}

function getFormInstance(formElement) {
    return formElement._kupolaForm;
}

function validateForm(formElement) {
    const instance = formElement._kupolaForm;
    if (instance) {
        return instance.validate();
    }
    return false;
}

export { KupolaForm, initFormValidation, getFormInstance, validateForm };

if (typeof window !== 'undefined') {
    window.KupolaForm = KupolaForm;
    window.initFormValidation = initFormValidation;
    window.getFormInstance = getFormInstance;
    window.validateForm = validateForm;
    
    if (window.kupolaInitializer) {
        window.kupolaInitializer.register('form-validation', initFormValidation);
    }
}