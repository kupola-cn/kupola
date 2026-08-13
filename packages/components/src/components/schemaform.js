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
import { Message } from './message.js';
import { FIELD_SELECTOR, FormDensity, cx, hasOwn } from './schemaform-core.js';
import { createSchema, normalizeSchema } from './schemaform-schema.js';
import {
  clearCustomError,
  collectErrors,
  createCustomControllers,
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
import { bindSchemaForm, createFormScope, schemaSubmit } from './schemaform-runtime.js';
import { validateSchema } from './schemaform-validation.js';

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
  const formSchema = createSchema(definition);
  return Object.freeze({
    ...formSchema,
    bind(target, options) {
      return bindSchemaForm(target, formSchema, options);
    },
    submit(onSubmit, options) {
      return schemaSubmit(formSchema, onSubmit, options);
    },
    validate(data, options) {
      return validateSchema(formSchema, data, options);
    },
  });
}

export { validateSchema, bindSchemaForm, createFormScope, schemaSubmit };

registerDirective('k-field', { mount() {} });

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
    'validateOn',
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
    const validateOn = String(props.validateOn.value || 'submit').toLowerCase();
    const fieldListeners = new Set();

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
      validateField(name) {
        if (!form || !formSchema.fields.some(f => f.name === name)) {return true;}
        const data = readData();
        const result = validateSchema(formSchema, data);
        const fieldErrors = result.errors.filter(e => e.name === name);
        const fieldEl = form.element?.elements?.namedItem(name);
        if (fieldErrors.length > 0) {
          if (fieldEl) {form.showError(fieldEl, fieldErrors[0].message);}
          const customEntry = customControllers.get(name);
          if (customEntry) {showCustomError(customEntry.root, fieldErrors[0].message);}
          return false;
        }
        if (fieldEl) {form.clearError(fieldEl);}
        const customEntry = customControllers.get(name);
        if (customEntry) {clearCustomError(customEntry.root);}
        return true;
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

      // Wire up per-field validation based on validateOn config.
      // 'blur' validates when a field loses focus; 'change' validates on
      // every input event; 'submit' (default) only validates on submit.
      if (validateOn === 'blur' || validateOn === 'change') {
        const eventType = validateOn === 'blur' ? 'blur' : 'input';
        const handler = event => {
          const target = event.target;
          if (!target || !target.name) {return;}
          if (typeof target.matches === 'function' && !target.matches(FIELD_SELECTOR)) {return;}
          api.validateField(target.name);
        };
        element.addEventListener(eventType, handler, validateOn === 'blur');
        fieldListeners.add(() => element.removeEventListener(eventType, handler, validateOn === 'blur'));
      }

      props.onReady.value?.(api);
      onCleanup(() => {
        for (const cleanup of fieldListeners) {cleanup();}
        fieldListeners.clear();
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
