// SPDX-License-Identifier: MIT
/**
 * SchemaForm field building: field state, rule application, the chainable
 * FieldBuilder, typed factory functions, option normalization, and the
 * normalizeField entry used by schema().
 *
 * @module components/schemaform/fields
 */

import {
  BOOLEAN_RULES,
  hasOwn,
  isPlainObject,
  looksLikeFieldConfig,
  normalizeType,
} from './schemaform-core.js';

export function defaultRequiredMessage(field) {
  return `请填写${field.label || field.name || '该字段'}`;
}

export function defaultEmailMessage(field) {
  return `请输入有效${field.label || '邮箱'}`;
}

function createFieldState(type, label = '', options = {}) {
  const field = {
    type: normalizeType(type),
    label: label == null ? '' : String(label),
    name: '',
    placeholder: options.placeholder,
    autocomplete: options.autocomplete,
    disabled: options.disabled === true,
    readonly: options.readonly === true,
    multiple: options.multiple === true,
    attrs: { ...(options.attrs || {}) },
    props: { ...(options.props || {}) },
    rules: {},
    messages: {},
    value: options.value,
    options: options.options,
    className: options.className,
    controlClassName: options.controlClassName,
    labelClassName: options.labelClassName,
    activeMode: null,
    activeValue: undefined,
    schemaId: '',
  };
  applyRules(field, options.rules, options.messages);
  if (options.required === true) {
    field.rules.required = true;
  }
  return field;
}

function applyRules(field, rules = {}, messages = {}) {
  if (!rules || typeof rules !== 'object') {
    return;
  }

  for (const [ name, config ] of Object.entries(rules)) {
    if (config === false || config == null) {
      continue;
    }

    if (isPlainObject(config) && ('value' in config || 'message' in config)) {
      field.rules[name] = config.value ?? true;
      if (config.message != null) {
        field.messages[name] = String(config.message);
      }
      continue;
    }

    if (typeof config === 'string' && BOOLEAN_RULES.has(name)) {
      field.rules[name] = true;
      field.messages[name] = config;
      continue;
    }

    field.rules[name] = config;
  }

  if (messages && typeof messages === 'object') {
    for (const [ name, message ] of Object.entries(messages)) {
      if (message != null) {
        field.messages[name] = String(message);
      }
    }
  }
}

class FieldBuilder {
  constructor(type, label, options) {
    this._isKupolaSchemaFieldBuilder = true;
    this._field = createFieldState(type, label, options);
  }

  name(value) {
    this._field.name = value == null ? '' : String(value);
    return this;
  }

  placeholder(value) {
    this._field.placeholder = value;
    return this;
  }

  autocomplete(value) {
    this._field.autocomplete = value;
    return this;
  }

  className(value) {
    this._field.className = value;
    return this;
  }

  controlClassName(value) {
    this._field.controlClassName = value;
    return this;
  }

  labelClassName(value) {
    this._field.labelClassName = value;
    return this;
  }

  attr(name, value = true) {
    this._field.attrs[name] = value;
    return this;
  }

  prop(name, value) {
    this._field.props[name] = value;
    return this;
  }

  props(value = {}) {
    this._field.props = { ...(value || {}) };
    return this;
  }

  disabled(value = true) {
    this._field.disabled = value === true;
    return this;
  }

  readonly(value = true) {
    this._field.readonly = value === true;
    return this;
  }

  multiple(value = true) {
    this._field.multiple = value === true;
    return this;
  }

  rule(name, value = true, message) {
    this._field.rules[name] = value;
    if (message != null) {
      this._field.messages[name] = String(message);
    }
    return this;
  }

  required(message) {
    this._field.rules.required = true;
    if (message != null) {
      this._field.messages.required = String(message);
    }
    return this;
  }

  email(message) {
    this._field.rules.email = true;
    if (message != null) {
      this._field.messages.email = String(message);
    }
    return this;
  }

  minlength(value, message) {
    return this.rule('minlength', value, message);
  }

  maxlength(value, message) {
    return this.rule('maxlength', value, message);
  }

  min(value, message) {
    return this.rule('min', value, message);
  }

  max(value, message) {
    return this.rule('max', value, message);
  }

  pattern(value, message) {
    return this.rule('pattern', value, message);
  }

  value(value) {
    this._field.value = value;
    return this;
  }

  options(value) {
    this._field.options = value;
    return this;
  }

  activate(value) {
    return this.activateValue(value);
  }

  activateValue(value) {
    this._field.activeMode = 'value';
    this._field.activeValue = value;
    return this;
  }

  activateIndex(index) {
    this._field.activeMode = 'index';
    this._field.activeValue = Number(index);
    return this;
  }

  build(name, index) {
    return normalizeField(name, this._field, index);
  }
}

export function field(type, label, options = {}) {
  return new FieldBuilder(type, label, options);
}

export function text(label, options = {}) {
  return field('text', label, options);
}

export function email(label, options = {}) {
  return field('email', label, options).email();
}

export function password(label, options = {}) {
  return field('password', label, options);
}

export function number(label, options = {}) {
  return field('number', label, options).rule('number', true);
}

export function date(label, options = {}) {
  return field('date', label, options);
}

export function time(label, options = {}) {
  return field('time', label, options);
}

export function textarea(label, options = {}) {
  return field('textarea', label, options);
}

export function select(label, options, config = {}) {
  return field('select', label, { ...config, options });
}

export function checkbox(label, options = undefined, config = {}) {
  if (options === undefined || looksLikeFieldConfig(options)) {
    return field('checkbox', label, options || {});
  }
  return field('checkbox', label, { ...config, options });
}

export function radio(label, options, config = {}) {
  return field('radio', label, { ...config, options });
}

export function switchField(label, options = {}) {
  return field('switch', label, options);
}

export const switcher = switchField;

function normalizeOption(option, index) {
  if (Array.isArray(option)) {
    return {
      label: String(option[0] ?? ''),
      value: option.length > 1 ? option[1] : option[0],
      disabled: Boolean(option[2]?.disabled),
      domValue: String(index),
    };
  }

  if (isPlainObject(option)) {
    const value = hasOwn(option, 'value') ? option.value : option.id;
    return {
      label: String(option.label ?? option.text ?? option.name ?? value ?? ''),
      value,
      disabled: option.disabled === true,
      domValue: String(index),
    };
  }

  return {
    label: String(option ?? ''),
    value: option,
    disabled: false,
    domValue: String(index),
  };
}

function normalizeOptions(options) {
  if (Array.isArray(options)) {
    return options.map(normalizeOption);
  }

  if (options instanceof Map) {
    return [ ...options.entries() ].map(([ label, value ], index) => ({
      label: String(label),
      value,
      disabled: false,
      domValue: String(index),
    }));
  }

  if (isPlainObject(options)) {
    return Object.entries(options).map(([ label, value ], index) => ({
      label,
      value,
      disabled: false,
      domValue: String(index),
    }));
  }

  return [];
}

function resolveActiveValue(field) {
  if (field.activeMode === 'index') {
    const option = field.options[field.activeValue];
    return option ? option.value : undefined;
  }
  if (field.activeMode === 'value') {
    return field.activeValue;
  }
  return field.value;
}

export function usesTypedOptions(field) {
  return field.type === 'select'
    || field.type === 'radio'
    || (field.type === 'checkbox' && field.options.length > 0);
}

export function normalizeField(name, source, index = 0) {
  if (source?._isKupolaSchemaFieldBuilder && typeof source.build === 'function') {
    return source.build(name, index);
  }

  const raw = source && typeof source === 'object' ? source : {};
  const type = normalizeType(raw.type);
  const field = createFieldState(type, raw.label ?? name, raw);
  field.name = raw.name || name || '';
  field.schemaId = raw.schemaId || `field-${index}`;
  field.activeMode = raw.activeMode || null;
  field.activeValue = raw.activeValue;
  field.options = raw.options != null ? normalizeOptions(raw.options) : [];

  if (raw.required === true) {
    field.rules.required = true;
  }
  if (type === 'email' && raw.validateEmail !== false) {
    field.rules.email = true;
  }
  if (field.rules.required && !field.messages.required) {
    field.messages.required = defaultRequiredMessage(field);
  }
  if (field.rules.email && !field.messages.email) {
    field.messages.email = defaultEmailMessage(field);
  }

  if (usesTypedOptions(field)) {
    field.value = resolveActiveValue(field);
    field.valueByDomValue = new Map(field.options.map(option => [ option.domValue, option.value ]));
  }

  return field;
}
