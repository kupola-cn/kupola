// SPDX-License-Identifier: MIT
/**
 * SchemaForm schema construction: schema() builds a frozen form schema from
 * field definitions, and normalizeSchema accepts either a schema instance or
 * a raw definition.
 *
 * @module components/schemaform/schema
 */

import { normalizeField } from './schemaform-fields.js';
import { bindSchemaForm, schemaSubmit } from './schemaform-runtime.js';
import { validateSchema } from './schemaform-validation.js';

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

export function normalizeSchema(value) {
  if (value?._isKupolaFormSchema && Array.isArray(value.fields)) {
    return value;
  }
  return schema(value);
}

