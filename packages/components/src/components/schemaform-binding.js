// SPDX-License-Identifier: MIT
/**
 * SchemaForm DOM/data binding: typed data conversion, native and custom
 * control binding, k-field/k-input/k-select tag upgrades, and custom
 * controller management.
 *
 * @module components/schemaform/binding
 */

import {
  ATTR_NAME_RE,
  CHECKBOX_TRUE_VALUE,
  FIELD_SELECTOR,
  FormDensity,
  FormVariant,
  NATIVE_INPUT_TYPES,
  VALID_FORM_DENSITIES,
  VALID_FORM_VARIANTS,
  attrName,
  cx,
  getFormFieldRenderer,
  hasOwn,
} from './schemaform-core.js';
import { defaultRequiredMessage, usesTypedOptions } from './schemaform-fields.js';
import { isCheckedOption, isSelectedOption } from './schemaform-render.js';
import { Input } from './input.js';
import { Select } from './select.js';

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


export {
  bindKFields,
  clearCustomError,
  collectErrors,
  createCustomControllers,
  createFieldMap,
  destroyCustomControllers,
  fromDomData,
  normalizeClasses,
  normalizeCustomValidationResult,
  normalizeDensity,
  normalizeFeedback,
  normalizeVariant,
  showCustomError,
  toDomData,
};
