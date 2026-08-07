// SPDX-License-Identifier: MIT
/**
 * SchemaForm field renderers.
 *
 * Native input/textarea/select/radio/checkbox/switch renderers plus the
 * renderField entry used by createFormScope and the SchemaForm component.
 *
 * @module components/schemaform/render
 */

import { html, htmlString } from '@kupola/platform/template';
import {
  ATTR_NAME_RE,
  CHECKBOX_TRUE_VALUE,
  NATIVE_INPUT_TYPES,
  cx,
  escapeAttribute,
  attrName,
  getFormFieldRenderer,
  registerFormField,
} from './schemaform-core.js';
import { Select } from './select.js';

function renderExtraAttrs(field, options = {}) {
  const includeRules = options.rules !== false;
  const includeState = options.state !== false;
  const attrs = [];

  const appendAttr = (name, value) => {
    if (value === false || value == null || !ATTR_NAME_RE.test(name)) {
      return;
    }
    if (value === true) {
      attrs.push(name);
      return;
    }
    attrs.push(`${name}="${escapeAttribute(value)}"`);
  };

  if (field.placeholder != null) {
    appendAttr('placeholder', field.placeholder);
  }
  if (field.autocomplete != null) {
    appendAttr('autocomplete', field.autocomplete);
  }
  if (includeState) {
    if (field.disabled) {
      appendAttr('disabled', true);
    }
    if (field.readonly) {
      appendAttr('readonly', true);
    }
    if (field.multiple) {
      appendAttr('multiple', true);
    }
  }
  for (const [ name, value ] of Object.entries(field.attrs || {})) {
    appendAttr(name, value);
  }
  if (includeRules) {
    for (const [ name, value ] of Object.entries(field.rules || {})) {
      if (value === false || value == null) {
        continue;
      }
      appendAttr(`data-${attrName(name)}`, value === true ? 'true' : value);
      const message = field.messages?.[name];
      if (message != null) {
        appendAttr(`data-message-${attrName(name)}`, message);
      }
    }
  }

  return htmlString(attrs.length > 0 ? ` ${attrs.join(' ')}` : '');
}

export function isSelectedOption(field, option) {
  return field.multiple && Array.isArray(field.value)
    ? field.value.some(value => Object.is(value, option.value))
    : Object.is(field.value, option.value);
}

export function isCheckedOption(field, option) {
  const value = field.value;
  return Array.isArray(value)
    ? value.some(item => Object.is(item, option.value))
    : Object.is(value, option.value);
}

function createRenderContext(field, options) {
  const classes = options.classes || {};
  return {
    schema: options.schema,
    classes,
    fieldClassName: cx(
      'ds-schema-form__field',
      'ds-form-field',
      field.className,
      classes.field,
      options.fieldClassName,
    ),
    labelClassName: cx(
      'ds-schema-form__label',
      'ds-form-label',
      field.labelClassName,
      classes.label,
    ),
    controlClassName: cx(
      'ds-schema-form__control',
      field.controlClassName,
      classes.control,
    ),
    rootAttrs: htmlString(
      ` data-schema-field="${escapeAttribute(field.name)}"` +
      ` data-schema-field-id="${field.schemaId}"` +
      ` data-schema-field-type="${escapeAttribute(field.type)}"`,
    ),
    attrs: renderExtraAttrs,
  };
}

function renderLabel(field, context) {
  return field.label
    ? html`<span class="${context.labelClassName}">${field.label}</span>`
    : '';
}

function createNativeInputRenderer(inputType) {
  return {
    render(field, context) {
      const type = inputType || field.type;
      if (type === 'hidden') {
        return html`
          <input
            name="${field.name}"
            type="hidden"
            value="${field.value ?? ''}"
            ${renderExtraAttrs(field)}
          />
        `;
      }

      return html`
        <label class="${context.fieldClassName}"${context.rootAttrs}>
          ${renderLabel(field, context)}
          <input
            class="${cx(context.controlClassName, 'ds-schema-form__input')}"
            name="${field.name}"
            type="${type}"
            value="${type === 'file' ? false : (field.value ?? '')}"
            ${renderExtraAttrs(field)}
          />
        </label>
      `;
    },
  };
}

const textareaRenderer = {
  render(field, context) {
    return html`
      <label class="${context.fieldClassName}"${context.rootAttrs}>
        ${renderLabel(field, context)}
        <textarea
          class="${cx(context.controlClassName, 'ds-schema-form__textarea', 'ds-textarea')}"
          name="${field.name}"
          ${renderExtraAttrs(field)}
        >${field.value ?? ''}</textarea>
      </label>
    `;
  },
};

const selectRenderer = {
  render(field, context) {
    return html`
      <label class="${context.fieldClassName}"${context.rootAttrs}>
        ${renderLabel(field, context)}
        <input
          type="hidden"
          name="${field.name}"
          ${renderExtraAttrs(field)}
        />
        <div class="ds-schema-form__select-host"></div>
      </label>
    `;
  },
  mount({ field, root }) {
    const host = root.querySelector('.ds-schema-form__select-host');
    const hidden = root.querySelector(`input[name="${field.name}"]`);
    if (!host || !hidden) {return null;}

    const toDomValues = value => {
      if (field.multiple) {
        const list = Array.isArray(value) ? value : [];
        return list
          .map(item => field.options.find(option => Object.is(option.value, item))?.domValue)
          .filter(item => item != null);
      }
      return field.options.find(option => Object.is(option.value, value))?.domValue ?? '';
    };
    const fromDomValues = domValue => {
      if (field.multiple) {
        const list = Array.isArray(domValue) ? domValue : [];
        return list
          .map(item => field.valueByDomValue?.get(item))
          .filter(item => item !== undefined);
      }
      return field.valueByDomValue?.get(domValue) ?? '';
    };
    const syncHidden = value => {
      const domValues = toDomValues(value);
      hidden.value = field.multiple ? JSON.stringify(domValues) : String(domValues ?? '');
    };

    const select = Select({
      items: field.options.map(option => ({
        value: option.domValue,
        text: option.label,
        disabled: option.disabled,
      })),
      value: toDomValues(field.value),
      multiple: field.multiple,
      disabled: field.disabled,
      placeholder: field.placeholder || field.label,
      onChange: ({ value, values }) => {
        const domValue = field.multiple ? values : value;
        hidden.value = field.multiple ? JSON.stringify(domValue) : String(domValue ?? '');
      },
    });
    host.appendChild(select.element);
    syncHidden(field.value);

    return {
      getValue() {
        return fromDomValues(select.getValue());
      },
      setValue(value) {
        select.setValue(toDomValues(value), { silent: true });
        syncHidden(value);
      },
      destroy() {
        select.destroy();
        host.remove();
      },
    };
  },
};

const radioRenderer = {
  render(field, context) {
    return html`
      <fieldset class="${cx(context.fieldClassName, 'ds-schema-form__field--choice')}"${context.rootAttrs}>
        ${field.label ? html`<legend class="${context.labelClassName}">${field.label}</legend>` : ''}
        <div class="ds-schema-form__choice-list" role="radiogroup">
          ${field.options.map((option, index) => html`
            <label class="ds-schema-form__choice">
              <input
                class="ds-schema-form__choice-input"
                type="radio"
                name="${field.name}"
                value="${option.domValue}"
                checked="${isSelectedOption(field, option) ? 'checked' : false}"
                disabled="${option.disabled || field.disabled ? 'disabled' : false}"
                ${renderExtraAttrs(field, { rules: index === 0, state: false })}
              />
              <span>${option.label}</span>
            </label>
          `)}
        </div>
      </fieldset>
    `;
  },
};

const checkboxRenderer = {
  render(field, context) {
    if (field.options.length > 0) {
      return html`
        <fieldset class="${cx(context.fieldClassName, 'ds-schema-form__field--choice')}"${context.rootAttrs}>
          ${field.label ? html`<legend class="${context.labelClassName}">${field.label}</legend>` : ''}
          <div class="ds-schema-form__choice-list">
            ${field.options.map((option, index) => html`
              <label class="ds-schema-form__choice">
                <input
                  class="ds-schema-form__choice-input"
                  type="checkbox"
                  name="${field.name}"
                  value="${option.domValue}"
                  checked="${isCheckedOption(field, option) ? 'checked' : false}"
                  disabled="${option.disabled || field.disabled ? 'disabled' : false}"
                  ${renderExtraAttrs(field, { rules: index === 0, state: false })}
                />
                <span>${option.label}</span>
              </label>
            `)}
          </div>
        </fieldset>
      `;
    }

    return html`
      <label
        class="${cx(context.fieldClassName, 'ds-schema-form__choice', 'ds-schema-form__field--boolean')}"
        ${context.rootAttrs}
      >
        <input
          class="ds-schema-form__choice-input"
          type="checkbox"
          name="${field.name}"
          value="${CHECKBOX_TRUE_VALUE}"
          checked="${field.value === true ? 'checked' : false}"
          ${renderExtraAttrs(field)}
        />
        ${renderLabel(field, context)}
      </label>
    `;
  },
};

const switchRenderer = {
  render(field, context) {
    return html`
      <label class="${cx(context.fieldClassName, 'ds-schema-form__switch-field')}"${context.rootAttrs}>
        <span class="ds-schema-form__switch-label">${renderLabel(field, context)}</span>
        <span class="ds-schema-form__switch">
          <input
            class="ds-schema-form__switch-input"
            type="checkbox"
            name="${field.name}"
            value="${CHECKBOX_TRUE_VALUE}"
            checked="${field.value === true ? 'checked' : false}"
            ${renderExtraAttrs(field)}
          />
          <span class="ds-schema-form__switch-track" aria-hidden="true"></span>
        </span>
      </label>
    `;
  },
};

export function renderField(field, options) {
  const renderer = getFormFieldRenderer(field.type);
  const context = createRenderContext(field, options);
  return renderer.render(field, context);
}

// Register the built-in renderers on module load so custom fields can layer
// on top of the native input/select/textarea/checkbox/switch implementations.
for (const type of NATIVE_INPUT_TYPES) {
  registerFormField(type, createNativeInputRenderer(type));
}
registerFormField('textarea', textareaRenderer);
registerFormField('select', selectRenderer);
registerFormField('radio', radioRenderer);
registerFormField('checkbox', checkboxRenderer);
registerFormField('switch', switchRenderer);
