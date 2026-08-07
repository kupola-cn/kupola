// SPDX-License-Identifier: MIT
/**
 * Schema-driven form view with typed submit data.
 *
 * @module components/schemaform
 */
import { defineComponent } from '@kupola/platform/component';
import { registerDirective } from '@kupola/platform/directives';
import { html } from '@kupola/platform/template';
import { Form } from './form.js';
import { Input } from './input.js';
import { Message } from './message.js';
import { Select } from './select.js';
import {
  ATTR_NAME_RE,
  CHECKBOX_TRUE_VALUE,
  FIELD_SELECTOR,
  FormVariant,
  KUPOLA_EVENT_MOUNT,
  NATIVE_INPUT_TYPES,
  VALID_FORM_DENSITIES,
  VALID_FORM_VARIANTS,
  attrName,
  cx,
  FormDensity,
  getFormFieldRenderer,
  hasOwn,
} from './schemaform-core.js';
import {
  defaultEmailMessage,
  defaultRequiredMessage,
  normalizeField,
  usesTypedOptions,
} from './schemaform-fields.js';
import { isCheckedOption, isSelectedOption, renderField } from './schemaform-render.js';

export { FormVariant, FormDensity, registerFormField, getFormFieldRenderer } from './schemaform-core.js';
export {
  checkbox,
  date,
  email,
  field,
  number,
  password,
  radio,
  select,
  switchField,
  switcher,
  text,
  textarea,
  time,
} from './schemaform-fields.js';
export function schema(definition = {}) {
  const entries = Array.isArray(definition)
    ? definition.map((item, index) => [ item?.name || String(index), item ])
    : Object.entries(definition || {});
  const fields = entries.map(([ name, config ], index) => normalizeField(name, config, index));
  const names = new Set();
  const schemaIds = new Set();
  for (const item of fields) {
    if (names.has(item.name)) {
      throw new Error(`SchemaForm: duplicate field name "${item.name}".`);
    }
    if (schemaIds.has(item.schemaId)) {
      throw new Error(`SchemaForm: duplicate schemaId "${item.schemaId}".`);
    }
    names.add(item.name);
    schemaIds.add(item.schemaId);
  }
  const formSchema = {
    _isKupolaFormSchema: true,
    fields: Object.freeze(fields),
    bind(target, options) {
      return bindSchemaForm(target, formSchema, options);
    },
    submit(onSubmit, options) {
      return schemaSubmit(formSchema, onSubmit, options);
    },
    validate(data, options) {
      return validateSchema(formSchema, data, options);
    },
  };
  return Object.freeze(formSchema);
}

function normalizeSchema(value) {
  if (value?._isKupolaFormSchema && Array.isArray(value.fields)) {
    return value;
  }
  return schema(value);
}

function toDomData(data, formSchema) {
  const result = { ...(data || {}) };
  for (const field of formSchema.fields) {
    if (!hasOwn(result, field.name)) {
      continue;
    }
    if (usesTypedOptions(field)) {
      const source = Array.isArray(result[field.name]) ? result[field.name] : [ result[field.name] ];
      const mapped = source.map(value => field.options.find(item => Object.is(item.value, value))?.domValue)
        .filter(value => value != null);
      result[field.name] = field.type === 'checkbox' ? mapped : mapped[0];
    } else if (field.type === 'checkbox' || field.type === 'switch') {
      result[field.name] = result[field.name] === true ? [ CHECKBOX_TRUE_VALUE ] : [];
    }
  }
  return result;
}

function fromDomData(data, formSchema) {
  const result = { ...(data || {}) };
  for (const field of formSchema.fields) {
    if (!hasOwn(result, field.name)) {
      continue;
    }
    if (usesTypedOptions(field)) {
      const rawValue = result[field.name];
      if (Array.isArray(rawValue)) {
        result[field.name] = rawValue
          .filter(value => field.valueByDomValue.has(value))
          .map(value => field.valueByDomValue.get(value));
      } else if (field.valueByDomValue.has(rawValue)) {
        result[field.name] = field.valueByDomValue.get(rawValue);
      }
    } else if (field.type === 'checkbox' || field.type === 'switch') {
      result[field.name] = Array.isArray(result[field.name])
        ? result[field.name].includes(CHECKBOX_TRUE_VALUE)
        : result[field.name] === CHECKBOX_TRUE_VALUE;
    }
  }
  return result;
}

registerDirective('k-field', { mount() {} });

function collectErrors(formElement) {
  return [ ...formElement.querySelectorAll('.ds-form-error') ].map(errorElement => {
    const container = errorElement.closest('[data-schema-field]') || errorElement.closest('.ds-form-field');
    const fieldElement = container?.querySelector(FIELD_SELECTOR);
    return {
      name: fieldElement?.name || container?.getAttribute('data-schema-field') || '',
      message: errorElement.textContent || '',
      element: fieldElement || null,
    };
  }).filter(error => error.message);
}

function normalizeFeedback(value) {
  if (value === false) {
    return { message: false };
  }
  if (value && typeof value === 'object') {
    return { message: value.message !== false };
  }
  return { message: true };
}

function normalizeVariant(value) {
  const variant = String(value || FormVariant.Default);
  return VALID_FORM_VARIANTS.has(variant) ? variant : FormVariant.Default;
}

function normalizeDensity(value) {
  const density = String(value || FormDensity.Default);
  return VALID_FORM_DENSITIES.has(density) ? density : FormDensity.Default;
}

function normalizeClasses(value) {
  return value && typeof value === 'object' ? value : {};
}

function findFieldRoot(formElement, field) {
  return formElement.querySelector(`[data-schema-field-id="${field.schemaId}"]`)
    || formElement.elements?.namedItem(field.name)?.closest?.('.ds-schema-form__field')
    || formElement;
}

function createCustomControllers(formElement, formSchema, api) {
  const controllers = new Map();
  for (const field of formSchema.fields) {
    const renderer = getFormFieldRenderer(field.type);
    if (typeof renderer.mount !== 'function') {
      continue;
    }
    const root = findFieldRoot(formElement, field);
    const controller = renderer.mount({
      field,
      root,
      form: formElement,
      api,
    });
    if (controller && typeof controller === 'object') {
      if (controllers.has(field.name)) {
        throw new Error(`SchemaForm: duplicate controller for field "${field.name}".`);
      }
      controllers.set(field.name, { field, root, controller });
    }
  }
  return controllers;
}

function destroyCustomControllers(controllers) {
  let firstError;
  for (const entry of controllers.values()) {
    try {
      entry.controller.destroy?.();
    } catch (error) {
      if (!firstError) {firstError = error;}
    }
  }
  controllers.clear();
  if (firstError) {throw firstError;}
}

function clearCustomError(root) {
  root.querySelector(':scope > .ds-form-error')?.remove();
}

function showCustomError(root, message) {
  clearCustomError(root);
  root.classList?.add('ds-form-field--error');
  const errEl = document.createElement('span');
  errEl.className = 'ds-form-error';
  errEl.textContent = message;
  root.appendChild(errEl);
}

function normalizeCustomValidationResult(result, field) {
  if (result === false) {
    return { valid: false, message: defaultRequiredMessage(field) };
  }
  if (typeof result === 'string') {
    return { valid: false, message: result };
  }
  if (result && typeof result === 'object') {
    return {
      valid: result.valid !== false,
      message: result.message || defaultRequiredMessage(field),
    };
  }
  return { valid: true, message: '' };
}

function setDomAttr(element, name, value) {
  if (!element || value === false || value == null || !ATTR_NAME_RE.test(name)) {
    return;
  }
  if (value === true) {
    element.setAttribute(name, '');
    return;
  }
  element.setAttribute(name, String(value));
}

function applyFieldRootAttrs(element, field) {
  element.setAttribute('data-schema-field', field.name);
  element.setAttribute('data-schema-field-id', field.schemaId);
  element.setAttribute('data-schema-field-type', field.type);
}

function applyFieldRuleAttrs(element, field) {
  for (const [ name, value ] of Object.entries(field.rules || {})) {
    if (value === false || value == null) {
      continue;
    }
    setDomAttr(element, `data-${attrName(name)}`, value === true ? 'true' : value);
    const message = field.messages?.[name];
    if (message != null) {
      setDomAttr(element, `data-message-${attrName(name)}`, message);
    }
  }
}

function applyNativeControlAttrs(element, field) {
  if (!element) {
    return;
  }

  if ('name' in element) {
    element.name = field.name;
  } else {
    setDomAttr(element, 'name', field.name);
  }
  if (field.placeholder != null && !element.hasAttribute('placeholder')) {
    setDomAttr(element, 'placeholder', field.placeholder);
  }
  if (field.autocomplete != null && !element.hasAttribute('autocomplete')) {
    setDomAttr(element, 'autocomplete', field.autocomplete);
  }
  if (field.disabled) {
    element.disabled = true;
    setDomAttr(element, 'disabled', true);
  }
  if (field.readonly && 'readOnly' in element) {
    element.readOnly = true;
    setDomAttr(element, 'readonly', true);
  }
  if (field.multiple && 'multiple' in element) {
    element.multiple = true;
    setDomAttr(element, 'multiple', true);
  }
  for (const [ name, value ] of Object.entries(field.attrs || {})) {
    setDomAttr(element, name, value);
  }
  applyFieldRuleAttrs(element, field);
}

function nativeInputType(field) {
  return NATIVE_INPUT_TYPES.has(field.type) ? field.type : 'text';
}

function toDomFieldValue(field, value) {
  if (usesTypedOptions(field)) {
    if (field.multiple && Array.isArray(value)) {
      return value.map(item => field.options.find(option => Object.is(option.value, item))?.domValue)
        .filter(item => item != null);
    }
    const option = field.options.find(item => Object.is(item.value, value));
    if (option) {
      return option.domValue;
    }
    const raw = String(value ?? '');
    return field.valueByDomValue?.has(raw) ? raw : raw;
  }
  if (field.type === 'checkbox' || field.type === 'switch') {
    return value === true ? CHECKBOX_TRUE_VALUE : '';
  }
  return value ?? '';
}

function setNativeControlValue(element, field) {
  if (!element) {
    return;
  }

  if (element.tagName === 'INPUT') {
    const type = String(element.type || nativeInputType(field)).toLowerCase();
    if (type === 'checkbox') {
      element.value = field.options?.[0]?.domValue || CHECKBOX_TRUE_VALUE;
      element.checked = field.value === true || isCheckedOption(field, field.options?.[0] || {});
      return;
    }
    if (type === 'radio') {
      if (field.value !== undefined) {
        element.checked = Object.is(field.value, element.value);
      }
      return;
    }
    if (type !== 'file' && field.value != null) {
      element.value = String(toDomFieldValue(field, field.value));
    }
    return;
  }

  if (element.tagName === 'TEXTAREA') {
    if (field.value != null) {
      element.value = String(field.value);
    }
  }
}

function populateNativeSelect(selectElement, field) {
  if (field.options.length === 0) {
    if (field.value != null) {
      selectElement.value = String(field.value);
    }
    return;
  }

  const shouldPopulate = selectElement.options.length === 0 || selectElement.hasAttribute('data-schema-options');
  if (shouldPopulate) {
    selectElement.replaceChildren();
    selectElement.setAttribute('data-schema-options', '');
    for (const option of field.options) {
      const optionElement = document.createElement('option');
      optionElement.value = option.domValue;
      optionElement.textContent = option.label;
      optionElement.disabled = option.disabled;
      optionElement.selected = isSelectedOption(field, option);
      selectElement.appendChild(optionElement);
    }
  } else if (field.value != null) {
    selectElement.value = String(toDomFieldValue(field, field.value));
  }
}

function bindNativeFieldElement(element, field) {
  applyFieldRootAttrs(element, field);
  applyNativeControlAttrs(element, field);

  if (element.tagName === 'INPUT') {
    if (!element.hasAttribute('type')) {
      element.type = field.type === 'checkbox' ? 'checkbox' : nativeInputType(field);
    }
    element.classList.add('ds-schema-form__control', 'ds-schema-form__input');
    setNativeControlValue(element, field);
    return null;
  }

  if (element.tagName === 'TEXTAREA') {
    element.classList.add('ds-schema-form__control', 'ds-schema-form__textarea', 'ds-textarea');
    setNativeControlValue(element, field);
    return null;
  }

  if (element.tagName === 'SELECT') {
    element.classList.add('ds-schema-form__control', 'ds-schema-form__select');
    populateNativeSelect(element, field);
  }
  return null;
}

function createFieldWrapper(field, extraClassName) {
  const wrapper = document.createElement('label');
  wrapper.className = cx(
    'ds-schema-form__field',
    'ds-form-field',
    field.className,
    extraClassName,
  );
  applyFieldRootAttrs(wrapper, field);

  if (field.label) {
    const label = document.createElement('span');
    label.className = cx('ds-schema-form__label', 'ds-form-label', field.labelClassName);
    label.textContent = field.label;
    wrapper.appendChild(label);
  }

  return wrapper;
}

function bindKInputTag(element, field) {
  applyFieldRootAttrs(element, field);
  const input = Input({
    type: nativeInputType(field),
    name: field.name,
    value: field.value ?? '',
    placeholder: field.placeholder ?? '',
    disabled: field.disabled,
    readonly: field.readonly,
    maxlength: field.rules?.maxlength,
  });
  const wrapper = createFieldWrapper(field);
  wrapper.appendChild(input.element);
  const inputElement = wrapper.querySelector('input');
  applyNativeControlAttrs(inputElement, field);
  element.replaceChildren(wrapper);
  return {
    field,
    root: wrapper,
    controller: {
      destroy() {
        input.destroy();
        element.replaceChildren();
      },
    },
  };
}

function optionItems(field) {
  return field.options.map(option => ({
    value: option.value,
    text: option.label,
    disabled: option.disabled,
  }));
}

function bindKSelectTag(element, field) {
  applyFieldRootAttrs(element, field);
  const wrapper = createFieldWrapper(field);
  const hidden = document.createElement('input');
  hidden.type = 'hidden';
  applyNativeControlAttrs(hidden, field);
  const setHiddenValue = value => {
    const domValue = toDomFieldValue(field, value);
    hidden.value = Array.isArray(domValue) ? JSON.stringify(domValue) : String(domValue);
  };
  setHiddenValue(field.value);
  wrapper.appendChild(hidden);

  const select = Select({
    items: optionItems(field),
    value: field.value,
    multiple: field.multiple,
    disabled: field.disabled,
    placeholder: field.placeholder || field.label,
    onChange: ({ value, values }) => {
      setHiddenValue(field.multiple ? values : value);
      hidden.dispatchEvent(new Event('input', { bubbles: true }));
      hidden.dispatchEvent(new Event('change', { bubbles: true }));
    },
  });

  wrapper.appendChild(select.element);
  element.replaceChildren(wrapper);
  return {
    field,
    root: wrapper,
    controller: {
      destroy() {
        select.destroy();
        element.replaceChildren();
      },
      getValue() {
        return select.getValue();
      },
      setValue(value) {
        select.setValue(value, { silent: true });
        setHiddenValue(value);
      },
    },
  };
}

function readCustomElementValue(element) {
  if (typeof element.getValue === 'function') {
    return element.getValue();
  }
  if ('value' in element) {
    return element.value;
  }
  return element.getAttribute('value') ?? '';
}

function writeCustomElementValue(element, value) {
  if (typeof element.setValue === 'function') {
    element.setValue(value);
    return;
  }
  if ('value' in element) {
    element.value = value ?? '';
    return;
  }
  if (value == null) {
    element.removeAttribute('value');
  } else {
    element.setAttribute('value', String(value));
  }
}

function bindCustomFieldTag(element, field) {
  applyFieldRootAttrs(element, field);
  element.kupolaField = field;
  const hidden = document.createElement('input');
  hidden.type = 'hidden';
  applyNativeControlAttrs(hidden, field);
  element.appendChild(hidden);

  const syncHidden = () => {
    hidden.value = String(toDomFieldValue(field, readCustomElementValue(element)));
  };
  if (field.value != null) {
    writeCustomElementValue(element, field.value);
  }
  syncHidden();
  element.addEventListener('input', syncHidden);
  element.addEventListener('change', syncHidden);

  return {
    field,
    root: element,
    controller: {
      getValue: () => readCustomElementValue(element),
      setValue(value) {
        writeCustomElementValue(element, value);
        syncHidden();
      },
      validate(value) {
        if (typeof element.validate === 'function') {
          return element.validate(value, field);
        }
        return true;
      },
      destroy() {
        element.removeEventListener('input', syncHidden);
        element.removeEventListener('change', syncHidden);
        hidden.remove();
        delete element.kupolaField;
      },
    },
  };
}

function bindFieldElement(element, field) {
  const tagName = element.tagName.toLowerCase();
  if (tagName === 'input' || tagName === 'select' || tagName === 'textarea') {
    return bindNativeFieldElement(element, field);
  }
  if (tagName === 'k-input') {
    return bindKInputTag(element, field);
  }
  if (tagName === 'k-select') {
    return bindKSelectTag(element, field);
  }
  return bindCustomFieldTag(element, field);
}

function bindKFields(formElement, formSchema) {
  const controllers = new Map();
  const fieldsByName = createFieldMap(formSchema);
  const elements = [ ...formElement.querySelectorAll('[k-field]') ];

  for (const element of elements) {
    const fieldName = String(element.getAttribute('k-field') || '').trim();
    const formField = fieldsByName.get(fieldName);
    if (!formField) {
      continue;
    }

    const entry = bindFieldElement(element, formField);
    if (entry && entry.controller) {
      if (controllers.has(formField.name)) {
        throw new Error(`SchemaForm: duplicate controller for field "${formField.name}".`);
      }
      controllers.set(formField.name, entry);
    }
  }

  return controllers;
}

function normalizeFieldValidationResult(result, field) {
  if (result === false) {
    return { valid: false, message: defaultRequiredMessage(field) };
  }
  if (typeof result === 'string') {
    return { valid: false, message: result };
  }
  if (result && typeof result === 'object') {
    return {
      valid: result.valid !== false,
      message: result.message || defaultRequiredMessage(field),
    };
  }
  return { valid: true, message: '' };
}

function validateDataRule(name, value, config, field, data) {
  if (typeof config === 'function') {
    return normalizeFieldValidationResult(config(value, data, field), field);
  }

  switch (name) {
  case 'required': {
    const valid = typeof value === 'string'
      ? value.trim() !== ''
      : Array.isArray(value)
        ? value.length > 0
        : value !== null && value !== undefined && value !== false;
    return { valid, message: field.messages.required || defaultRequiredMessage(field) };
  }
  case 'email':
    return {
      valid: !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value)),
      message: field.messages.email || defaultEmailMessage(field),
    };
  case 'phone':
    return {
      valid: !value || /^[\d\s\-+()]{7,20}$/.test(String(value)),
      message: field.messages.phone || `请输入有效${field.label || '手机号'}`,
    };
  case 'url': {
    if (!value) {
      return { valid: true, message: '' };
    }
    try {
      new URL(String(value));
      return { valid: true, message: '' };
    } catch {
      return { valid: false, message: field.messages.url || `请输入有效${field.label || 'URL'}` };
    }
  }
  case 'number':
    return {
      valid: !value || (!Number.isNaN(parseFloat(value)) && Number.isFinite(Number(value))),
      message: field.messages.number || `请输入有效${field.label || '数字'}`,
    };
  case 'minlength':
    return {
      valid: !value || String(value).length >= Number(config),
      message: field.messages.minlength || `${field.label || field.name}长度不能小于${config}`,
    };
  case 'maxlength':
    return {
      valid: !value || String(value).length <= Number(config),
      message: field.messages.maxlength || `${field.label || field.name}长度不能超过${config}`,
    };
  case 'min':
    return {
      valid: !value || parseFloat(value) >= parseFloat(config),
      message: field.messages.min || `${field.label || field.name}不能小于${config}`,
    };
  case 'max':
    return {
      valid: !value || parseFloat(value) <= parseFloat(config),
      message: field.messages.max || `${field.label || field.name}不能大于${config}`,
    };
  case 'pattern': {
    if (!value) {
      return { valid: true, message: '' };
    }
    const pattern = config instanceof RegExp
      ? new RegExp(config.source, config.flags.replace(/[gy]/g, ''))
      : new RegExp(config);
    return {
      valid: pattern.test(String(value)),
      message: field.messages.pattern || `${field.label || field.name}格式不正确`,
    };
  }
  default:
    return { valid: true, message: '' };
  }
}

export function validateSchema(schemaDefinition, data = {}) {
  const formSchema = normalizeSchema(schemaDefinition);
  const source = data && typeof data === 'object' ? data : {};
  const errors = [];

  for (const formField of formSchema.fields) {
    const value = source[formField.name];
    for (const [ ruleName, ruleConfig ] of Object.entries(formField.rules || {})) {
      if (ruleConfig === false || ruleConfig == null) {
        continue;
      }
      const result = validateDataRule(ruleName, value, ruleConfig, formField, source);
      if (!result.valid) {
        errors.push({
          name: formField.name,
          rule: ruleName,
          message: result.message,
          field: formField,
          value,
        });
        break;
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    firstError: errors[0] || null,
  };
}

function resolveFormElement(value) {
  if (typeof value === 'string') {
    return typeof document === 'undefined' ? null : document.querySelector(value);
  }
  if (!value || typeof value !== 'object') {
    return null;
  }
  if (value.tagName?.toLowerCase?.() === 'form') {
    return value;
  }
  if (typeof value.querySelector === 'function') {
    const nestedForm = value.querySelector('form');
    if (nestedForm) {
      return nestedForm;
    }
  }
  return typeof value.closest === 'function' ? value.closest('form') : null;
}

function createSchemaWithValues(formSchema, values) {
  if (!values || typeof values !== 'object') {
    return formSchema;
  }

  return {
    _isKupolaFormSchema: true,
    fields: formSchema.fields.map(item => {
      if (!hasOwn(values, item.name)) {
        return item;
      }
      return { ...item, value: values[item.name] };
    }),
  };
}

function createFieldMap(formSchema) {
  const map = new Map();
  for (const item of formSchema.fields) {
    if (map.has(item.name)) {
      throw new Error(`SchemaForm: duplicate field name "${item.name}".`);
    }
    map.set(item.name, item);
  }
  return map;
}

function mergeFieldForRender(source, override = {}) {
  const options = typeof override === 'string'
    ? { className: override }
    : override && typeof override === 'object'
      ? override
      : {};

  if (Object.keys(options).length === 0) {
    return source;
  }

  return {
    ...source,
    attrs: { ...(source.attrs || {}), ...(options.attrs || {}) },
    props: { ...(source.props || {}), ...(options.props || {}) },
    className: cx(source.className, options.className),
    controlClassName: cx(source.controlClassName, options.controlClassName),
    labelClassName: cx(source.labelClassName, options.labelClassName),
  };
}

function createDisconnectObserver(formElement, cleanup) {
  if (typeof MutationObserver === 'undefined'
    || typeof document === 'undefined'
    || !document.documentElement) {
    return null;
  }

  const observer = new MutationObserver(() => {
    if (formElement.isConnected) {
      return;
    }
    observer.disconnect();
    cleanup();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
  return observer;
}

function createSchemaFormRuntime(formElement, schemaDefinition, options = {}) {
  const formSchema = normalizeSchema(schemaDefinition);
  let form = null;
  let customControllers = new Map();

  function readData() {
    const data = form ? fromDomData(form.getData(), formSchema) : {};
    for (const [ name, entry ] of customControllers) {
      if (typeof entry.controller.getValue === 'function') {
        data[name] = entry.controller.getValue();
      }
    }
    return data;
  }

  function validateCustomFields() {
    let valid = true;
    for (const entry of customControllers.values()) {
      const { field: customField, root, controller } = entry;
      if (typeof controller.validate !== 'function') {
        continue;
      }
      clearCustomError(root);
      root.classList?.remove('ds-form-field--error');
      const value = typeof controller.getValue === 'function' ? controller.getValue() : undefined;
      const result = normalizeCustomValidationResult(controller.validate(value, customField, api), customField);
      if (!result.valid) {
        showCustomError(root, result.message);
        valid = false;
      }
    }
    return valid;
  }

  const api = {
    get element() {
      return form?.element || formElement;
    },
    validate() {
      const domValid = form?.validate() || false;
      const customValid = validateCustomFields();
      return domValid && customValid;
    },
    getData() {
      return readData();
    },
    getRawData() {
      return form?.getData() || {};
    },
    setData(data) {
      form?.setData(toDomData(data, formSchema));
      if (!data || typeof data !== 'object') {
        return;
      }
      for (const [ name, entry ] of customControllers) {
        if (hasOwn(data, name) && typeof entry.controller.setValue === 'function') {
          entry.controller.setValue(data[name]);
        }
      }
    },
    reset() {
      form?.reset();
    },
    getField(name) {
      return form?.element?.elements?.namedItem(name) || null;
    },
    destroy() {
      destroyCustomControllers(customControllers);
      form?.destroy();
      form = null;
    },
  };

  customControllers = bindKFields(formElement, formSchema);
  const mountedCustomControllers = createCustomControllers(formElement, formSchema, api);
  for (const [ name, entry ] of mountedCustomControllers) {
    if (!customControllers.has(name)) {
      customControllers.set(name, entry);
    }
  }
  form = Form({ element: formElement, ...(options.options || {}) });
  if (options.values) {
    api.setData(options.values);
  }
  options.onReady?.(api);

  return Object.freeze(api);
}

export function bindSchemaForm(target, schemaDefinition, options = {}) {
  const formElement = resolveFormElement(target);
  if (!formElement || typeof formElement.querySelectorAll !== 'function') {
    throw new Error('bindSchemaForm: target must be a form element, wrapper, or selector.');
  }
  return createSchemaFormRuntime(formElement, schemaDefinition, options);
}

export function schemaSubmit(schemaDefinition, onSubmit, options = {}) {
  const formSchema = normalizeSchema(schemaDefinition);
  const runtimes = new WeakMap();
  let message = null;

  function getRuntime(formElement) {
    let runtime = runtimes.get(formElement);
    if (!runtime) {
      runtime = bindSchemaForm(formElement, formSchema, options);
      runtimes.set(formElement, runtime);
    }
    return runtime;
  }

  const handler = event => {
    event?.preventDefault?.();
    const formElement = resolveFormElement(event?.currentTarget || event?.target);
    if (!formElement) {
      return;
    }
    const runtime = getRuntime(formElement);

    if (!runtime.validate()) {
      const errors = collectErrors(runtime.element);
      if (normalizeFeedback(options.feedback).message !== false) {
        const firstError = errors[0]?.message || '表单内容有误，请检查后再提交';
        if (!message && typeof document !== 'undefined') {
          message = Message();
        }
        message?.error(firstError);
      }
      options.onInvalid?.({ errors, firstError: errors[0] || null }, runtime, event);
      return;
    }

    onSubmit?.(runtime.getData(), runtime, event);
  };

  handler[KUPOLA_EVENT_MOUNT] = element => {
    const formElement = resolveFormElement(element);
    if (!formElement) {
      return null;
    }
    const runtime = getRuntime(formElement);
    return () => {
      runtime.destroy();
      runtimes.delete(formElement);
      message?.destroy();
      message = null;
    };
  };

  return handler;
}

export function createFormScope(schemaDefinition, options = {}) {
  const formSchema = normalizeSchema(schemaDefinition);
  const feedback = normalizeFeedback(options.feedback);
  const variant = normalizeVariant(options.variant);
  const density = normalizeDensity(options.density);
  const classes = normalizeClasses(options.classes);
  const renderSchema = createSchemaWithValues(formSchema, options.values);
  const fieldMap = createFieldMap(formSchema);
  const renderFieldMap = createFieldMap(renderSchema);
  const legacyClasses = {
    field: options.fieldClassName,
    actions: options.actionsClassName,
    cancel: options.cancelClassName,
    submit: options.submitClassName,
  };
  let form = null;
  let message = null;
  let customControllers = new Map();
  let disconnectObserver = null;

  function getMessage() {
    if (!message && typeof document !== 'undefined') {
      message = Message();
    }
    return message;
  }

  function showInvalidFeedback(errors) {
    if (feedback.message === false) {
      return;
    }
    const firstError = errors[0]?.message || '表单内容有误，请检查后再提交';
    getMessage()?.error(firstError);
  }

  function readData() {
    const data = form ? fromDomData(form.getData(), formSchema) : {};
    for (const [ name, entry ] of customControllers) {
      if (typeof entry.controller.getValue === 'function') {
        data[name] = entry.controller.getValue();
      }
    }
    return data;
  }

  function validateCustomFields() {
    let valid = true;
    for (const entry of customControllers.values()) {
      const { field: customField, root, controller } = entry;
      if (typeof controller.validate !== 'function') {
        continue;
      }
      clearCustomError(root);
      root.classList?.remove('ds-form-field--error');
      const value = typeof controller.getValue === 'function' ? controller.getValue() : undefined;
      const result = normalizeCustomValidationResult(controller.validate(value, customField, api), customField);
      if (!result.valid) {
        showCustomError(root, result.message);
        valid = false;
      }
    }
    return valid;
  }

  function destroyRuntime() {
    disconnectObserver?.disconnect();
    disconnectObserver = null;
    destroyCustomControllers(customControllers);
    form?.destroy();
    form = null;
    message?.destroy();
    message = null;
  }

  function mount(target) {
    const formElement = resolveFormElement(target);
    if (!formElement || typeof formElement.querySelectorAll !== 'function') {
      throw new Error('createFormScope: mount() expects a form element, wrapper, or selector.');
    }
    if (form?.element === formElement) {
      return api;
    }

    destroyRuntime();
    form = Form({ element: formElement, ...(options.options || {}) });
    customControllers = createCustomControllers(formElement, formSchema, api);
    options.onReady?.(api);
    disconnectObserver = createDisconnectObserver(formElement, destroyRuntime);
    return api;
  }

  function ensureMounted(eventOrElement) {
    if (form) {
      return api;
    }
    const target = eventOrElement?.currentTarget || eventOrElement?.target || eventOrElement;
    return mount(target);
  }

  const renderOptions = {
    schema: renderSchema,
    classes,
    fieldClassName: legacyClasses.field,
  };
  const rootClass = (...extra) => cx(
    'ds-schema-form',
    `ds-schema-form--${variant}`,
    density !== FormDensity.Default && `ds-schema-form--density-${density}`,
    options.className,
    classes.root,
    extra,
  );
  const fieldsClass = (...extra) => cx('ds-schema-form__fields', classes.fields, extra);
  const actionsClass = (...extra) => cx(
    'ds-schema-form__actions',
    classes.actions,
    legacyClasses.actions,
    extra,
  );
  const cancelClass = (...extra) => cx(
    'ds-schema-form__cancel',
    'ds-btn',
    'ds-btn--secondary',
    classes.cancel,
    legacyClasses.cancel,
    extra,
  );
  const submitClass = (...extra) => cx(
    'ds-schema-form__submit',
    'ds-btn',
    'ds-btn--primary',
    classes.submit,
    legacyClasses.submit,
    extra,
  );

  const api = {
    schema: formSchema,
    get element() {
      return form?.element || null;
    },
    mount,
    destroy: destroyRuntime,
    rootClass,
    fieldsClass,
    actionsClass,
    cancelClass,
    submitClass,
    field(name, override) {
      const schemaField = renderFieldMap.get(name);
      if (!schemaField) {
        throw new Error(`createFormScope: unknown field "${name}".`);
      }
      return renderField(mergeFieldForRender(schemaField, override), renderOptions);
    },
    actions(actionOptions = {}) {
      const submitText = actionOptions.submitText ?? options.submitText ?? '提交';
      const cancelText = actionOptions.cancelText ?? options.cancelText ?? '取消';
      const showCancel = actionOptions.cancelText != null
        || options.cancelText != null
        || typeof options.onCancel === 'function';

      return html`
        <div class="${actionsClass(actionOptions.className)}">
          ${showCancel ? html`
            <button
              type="button"
              class="${cancelClass(actionOptions.cancelClassName)}"
              onclick="${api.cancel}"
            >${cancelText}</button>
          ` : ''}
          <button
            type="submit"
            class="${submitClass(actionOptions.submitClassName)}"
          >${submitText}</button>
        </div>
      `;
    },
    submit(event) {
      event?.preventDefault?.();
      ensureMounted(event);

      if (!api.validate()) {
        const errors = collectErrors(form.element);
        showInvalidFeedback(errors);
        options.onInvalid?.({ errors, firstError: errors[0] || null }, api, event);
        return;
      }

      options.onSubmit?.(api.getData(), api, event);
    },
    cancel(event) {
      event?.preventDefault?.();
      if (form || event) {
        ensureMounted(event);
      }
      options.onCancel?.(event, api);
    },
    input(event) {
      options.onInput?.(event, api);
    },
    validate() {
      const domValid = form?.validate() || false;
      const customValid = validateCustomFields();
      return domValid && customValid;
    },
    getData() {
      return readData();
    },
    getRawData() {
      return form?.getData() || {};
    },
    setData(data) {
      form?.setData(toDomData(data, formSchema));
      if (!data || typeof data !== 'object') {
        return;
      }
      for (const [ name, entry ] of customControllers) {
        if (hasOwn(data, name) && typeof entry.controller.setValue === 'function') {
          entry.controller.setValue(data[name]);
        }
      }
    },
    reset() {
      form?.reset();
    },
    getField(name) {
      return form?.element?.elements?.namedItem(name) || null;
    },
    getSchemaField(name) {
      return fieldMap.get(name) || null;
    },
  };

  return Object.freeze(api);
}

export const SchemaForm = defineComponent({
  props: [
    'schema',
    'variant',
    'density',
    'classes',
    'className',
    'fieldClassName',
    'actionsClassName',
    'submitClassName',
    'cancelClassName',
    'submitText',
    'cancelText',
    'values',
    'options',
    'feedback',
    'onReady',
    'onSubmit',
    'onInvalid',
    'onCancel',
    'onInput',
  ],
  setup({ props, lifecycle }) {
    const formSchema = normalizeSchema(props.schema.value);
    const feedback = normalizeFeedback(props.feedback.value);
    const variant = normalizeVariant(props.variant.value);
    const density = normalizeDensity(props.density.value);
    const classes = normalizeClasses(props.classes.value);
    const legacyClasses = {
      field: props.fieldClassName.value,
      actions: props.actionsClassName.value,
      cancel: props.cancelClassName.value,
      submit: props.submitClassName.value,
    };
    let form = null;
    let message = null;
    let customControllers = new Map();

    function readData() {
      const data = form ? fromDomData(form.getData(), formSchema) : {};
      for (const [ name, entry ] of customControllers) {
        if (typeof entry.controller.getValue === 'function') {
          data[name] = entry.controller.getValue();
        }
      }
      return data;
    }

    function validateCustomFields() {
      let valid = true;
      for (const entry of customControllers.values()) {
        const { field: customField, root, controller } = entry;
        if (typeof controller.validate !== 'function') {
          continue;
        }
        clearCustomError(root);
        root.classList?.remove('ds-form-field--error');
        const value = typeof controller.getValue === 'function' ? controller.getValue() : undefined;
        const result = normalizeCustomValidationResult(controller.validate(value, customField, api), customField);
        if (!result.valid) {
          showCustomError(root, result.message);
          valid = false;
        }
      }
      return valid;
    }

    const api = {
      get element() {
        return form?.element || null;
      },
      validate() {
        const domValid = form?.validate() || false;
        const customValid = validateCustomFields();
        return domValid && customValid;
      },
      getData() {
        return readData();
      },
      getRawData() {
        return form?.getData() || {};
      },
      setData(data) {
        form?.setData(toDomData(data, formSchema));
        if (!data || typeof data !== 'object') {
          return;
        }
        for (const [ name, entry ] of customControllers) {
          if (hasOwn(data, name) && typeof entry.controller.setValue === 'function') {
            entry.controller.setValue(data[name]);
          }
        }
      },
      reset() {
        form?.reset();
      },
      getField(name) {
        return form?.element?.elements?.namedItem(name) || null;
      },
    };

    function getMessage() {
      if (!message && typeof document !== 'undefined') {
        message = Message();
      }
      return message;
    }

    function showInvalidFeedback(errors) {
      if (feedback.message === false) {
        return;
      }
      const firstError = errors[0]?.message || '表单内容有误，请检查后再提交';
      getMessage()?.error(firstError);
    }

    function handleSubmit(event) {
      event.preventDefault();
      if (!form) {
        return;
      }

      if (!api.validate()) {
        const errors = collectErrors(form.element);
        showInvalidFeedback(errors);
        props.onInvalid.value?.({ errors, firstError: errors[0] || null }, api, event);
        return;
      }

      props.onSubmit.value?.(api.getData(), api, event);
    }

    function handleCancel(event) {
      event.preventDefault();
      props.onCancel.value?.(event, api);
    }

    function handleInput(event) {
      props.onInput.value?.(event, api);
    }

    lifecycle.onMounted(({ element, onCleanup }) => {
      form = Form({ element, ...(props.options.value || {}) });
      customControllers = createCustomControllers(element, formSchema, api);
      if (props.values.value) {
        api.setData(props.values.value);
      }
      props.onReady.value?.(api);
      onCleanup(() => {
        destroyCustomControllers(customControllers);
        form?.destroy();
        form = null;
        message?.destroy();
        message = null;
      });
    });

    const renderOptions = {
      schema: formSchema,
      classes,
      fieldClassName: legacyClasses.field,
    };
    const showCancel = props.cancelText.value != null || typeof props.onCancel.value === 'function';
    const submitText = props.submitText.value ?? '提交';
    const cancelText = props.cancelText.value ?? '取消';
    const rootClassName = () => cx(
      'ds-schema-form',
      `ds-schema-form--${variant}`,
      density !== FormDensity.Default && `ds-schema-form--density-${density}`,
      props.className.value,
      classes.root,
    );
    const fieldsClassName = () => cx('ds-schema-form__fields', classes.fields);
    const actionsClassName = () => cx(
      'ds-schema-form__actions',
      classes.actions,
      legacyClasses.actions,
    );
    const cancelClassName = () => cx(
      'ds-schema-form__cancel',
      'ds-btn',
      'ds-btn--secondary',
      classes.cancel,
      legacyClasses.cancel,
    );
    const submitClassName = () => cx(
      'ds-schema-form__submit',
      'ds-btn',
      'ds-btn--primary',
      classes.submit,
      legacyClasses.submit,
    );

    return html`
      <form class="${rootClassName}" novalidate onsubmit="${handleSubmit}" oninput="${handleInput}">
        <div class="${fieldsClassName}">
          ${formSchema.fields.map(item => renderField(item, renderOptions))}
        </div>
        <div class="${actionsClassName}">
          ${showCancel ? html`
            <button
              type="button"
              class="${cancelClassName}"
              onclick="${handleCancel}"
            >${cancelText}</button>
          ` : ''}
          <button
            type="submit"
            class="${submitClassName}"
          >${submitText}</button>
        </div>
      </form>
    `;
  },
});
