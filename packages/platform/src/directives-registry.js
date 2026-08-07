// SPDX-License-Identifier: MIT
/**
 * Directive registry: known/built-in directive names, the shared custom
 * directive map (Symbol.for registry), parsing, and syntax validation.
 *
 * @module directives/registry
 */

import { describeElement, warn } from './directives-warnings.js';

function parseDirective(name) {
  // Split off modifiers first (dot-separated at the end)
  const parts = name.split('.');
  const fullName = parts[0];
  const modifiers = parts.slice(1);

  // Split directive:arg (e.g. "k-on:click" or "k-bind:class")
  const colonIdx = fullName.indexOf(':');
  if (colonIdx === -1) {
    return { base: fullName, arg: null, modifiers };
  }
  return {
    base: fullName.substring(0, colonIdx),
    arg: fullName.substring(colonIdx + 1),
    modifiers,
  };
}

function isDirective(name) {
  return (
    name.startsWith('k-') ||
    name.startsWith(':') ||
    name.startsWith('@')
  );
}

/**
 * Normalize a shorthand to its full directive name.
 *   :class="x"  → k-bind:class="x"
 *   @click="x"  → k-on:click="x"
 */
function normalizeDirective(name) {
  if (name.startsWith(':')) {return 'k-bind:' + name.substring(1);}
  if (name.startsWith('@')) {return 'k-on:' + name.substring(1);}
  return name;
}

const KNOWN_DIRECTIVES = new Set([
  'k-data', 'k-show', 'k-text', 'k-html', 'k-bind', 'k-on', 'k-model', 'k-ref',
  'k-init', 'k-cloak', 'k-class', 'k-style', 'k-transition', 'k-if', 'k-else-if',
  'k-else', 'k-for', 'k-key', 'k-once', 'k-pre',
]);

const CUSTOM_DIRECTIVES_KEY = Symbol.for('kupola.platform.customDirectives');
/** @type {Map<string, Object>} */
const customDirectives = globalThis[CUSTOM_DIRECTIVES_KEY]
  || (globalThis[CUSTOM_DIRECTIVES_KEY] = new Map());

export function registerDirective(name, definition) {
  customDirectives.set(name, definition);
}

function validateDirectiveSyntax(el, directiveName, base, arg, modifiers, scopedDirectives) {
  if (!KNOWN_DIRECTIVES.has(base)
    && !scopedDirectives?.has(base)
    && !customDirectives.has(base)) {
    warn('W017', `${describeElement(el)} has unknown directive "${directiveName}".`);
    return false;
  }

  if (arg && base !== 'k-on' && base !== 'k-bind') {
    warn(
      'W018',
      `${describeElement(el)} has unsupported argument "${arg}" on ${base}.`,
    );
  }

  if (modifiers.length > 0 && base !== 'k-on' && base !== 'k-model') {
    warn(
      'W019',
      `${describeElement(el)} has unsupported modifier(s) on ${base}: ` +
      modifiers.map(item => `.${item}`).join(', ') + '.',
    );
  }

  if (
    modifiers.some(item => /^\d+$/.test(item)) &&
    !modifiers.includes('debounce')
  ) {
    warn(
      'W019',
      `${describeElement(el)} uses a numeric modifier without .debounce on ${base}.`,
    );
  }
  return true;
}

function normalizeCustomDirectives(value) {
  if (value === undefined || value === null) {return null;}
  if (value instanceof Map) {return value;}
  if (typeof value === 'object' && !Array.isArray(value)) {
    return new Map(Object.entries(value));
  }
  throw new TypeError('[kupola] walk() customDirectives must be a Map or object.');
}

export {
  customDirectives,
  isDirective,
  normalizeCustomDirectives,
  normalizeDirective,
  parseDirective,
  validateDirectiveSyntax,
};
