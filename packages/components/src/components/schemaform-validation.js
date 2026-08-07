// SPDX-License-Identifier: MIT
/**
 * SchemaForm validation: per-rule data validation and the public
 * validateSchema entry.
 *
 * @module components/schemaform/validation
 */

import { defaultEmailMessage, defaultRequiredMessage } from './schemaform-fields.js';
import { normalizeSchema } from './schemaform-schema.js';

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

