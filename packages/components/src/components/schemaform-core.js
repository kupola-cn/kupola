// SPDX-License-Identifier: MIT
/**
 * SchemaForm shared constants, utilities, and the field renderer registry.
 *
 * @module components/schemaform/core
 */

export const KUPOLA_EVENT_MOUNT = Symbol.for('kupola.event.mount');

export const BOOLEAN_RULES = new Set([ 'required', 'email', 'phone', 'url', 'number' ]);
export const NATIVE_INPUT_TYPES = new Set([
  'text',
  'email',
  'password',
  'number',
  'tel',
  'url',
  'search',
  'date',
  'datetime-local',
  'time',
  'month',
  'week',
  'color',
  'range',
  'hidden',
  'file',
]);
export const FIELD_SELECTOR = 'input, select, textarea';
export const ATTR_NAME_RE = /^[A-Za-z_:][A-Za-z0-9_:.-]*$/;
export const CHECKBOX_TRUE_VALUE = '__kupola_checked__';
export const FIELD_CONFIG_KEYS = new Set([
  'type',
  'name',
  'label',
  'placeholder',
  'autocomplete',
  'disabled',
  'readonly',
  'multiple',
  'className',
  'controlClassName',
  'labelClassName',
  'attrs',
  'props',
  'rules',
  'messages',
  'required',
  'validateEmail',
  'value',
  'options',
]);

export const FormVariant = Object.freeze({
  Default: 'default',
  Dialog: 'dialog',
  Drawer: 'drawer',
  Inline: 'inline',
  Dense: 'dense',
});

export const FormDensity = Object.freeze({
  Default: 'default',
  Comfortable: 'comfortable',
  Dense: 'dense',
});

export const VALID_FORM_VARIANTS = new Set(Object.values(FormVariant));
export const VALID_FORM_DENSITIES = new Set(Object.values(FormDensity));
const fieldRenderers = new Map();

export function isPlainObject(value) {
  return value !== null
    && typeof value === 'object'
    && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
}

export function looksLikeFieldConfig(value) {
  return isPlainObject(value) && Object.keys(value).some(key => FIELD_CONFIG_KEYS.has(key));
}

export function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(object, key);
}

export function cx(...values) {
  return values
    .flatMap(value => Array.isArray(value) ? value : [ value ])
    .filter(Boolean)
    .join(' ');
}

export function escapeAttribute(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function attrName(name) {
  return String(name);
}

export function normalizeType(value) {
  const type = value == null ? '' : String(value).trim();
  return type || 'text';
}

export function normalizeRenderer(renderer) {
  if (typeof renderer === 'function') {
    return { render: renderer };
  }
  if (!renderer || typeof renderer !== 'object' || typeof renderer.render !== 'function') {
    throw new TypeError('SchemaForm: field renderer must be a function or an object with render()');
  }
  return renderer;
}

export function registerFormField(type, renderer) {
  const fieldType = normalizeType(type);
  const normalizedRenderer = normalizeRenderer(renderer);
  fieldRenderers.set(fieldType, normalizedRenderer);
  return () => {
    if (fieldRenderers.get(fieldType) === normalizedRenderer) {
      fieldRenderers.delete(fieldType);
    }
  };
}

export function getFormFieldRenderer(type) {
  return fieldRenderers.get(normalizeType(type)) || fieldRenderers.get('text');
}
