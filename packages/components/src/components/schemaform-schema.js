// SPDX-License-Identifier: MIT
/**
 * SchemaForm schema construction: createSchema() builds a frozen form schema
 * from field definitions, and normalizeSchema accepts either a schema
 * instance or a raw definition. Runtime methods are attached by the public
 * schema() factory so this module stays independent of runtime and validation.
 *
 * @module components/schemaform/schema
 */

import { normalizeField } from './schemaform-fields.js';

export function createSchema(definition = {}) {
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
  };
  return Object.freeze(formSchema);
}

export function normalizeSchema(value) {
  if (value?._isKupolaFormSchema && Array.isArray(value.fields)) {
    return value;
  }
  return createSchema(value);
}
