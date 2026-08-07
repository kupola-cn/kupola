// SPDX-License-Identifier: MIT
/**
 * SchemaForm runtime: form element resolution, the bound runtime API, and
 * the public bindSchemaForm / schemaSubmit / createFormScope entries.
 *
 * @module components/schemaform/runtime
 */

import { KUPOLA_EVENT_MOUNT, FormDensity, cx, hasOwn } from './schemaform-core.js';
import { normalizeSchema } from './schemaform-schema.js';
import { html } from '@kupola/platform/template';
import {
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
} from './schemaform-binding.js';
import { renderField } from './schemaform-render.js';
import { Form } from './form.js';
import { Message } from './message.js';

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
