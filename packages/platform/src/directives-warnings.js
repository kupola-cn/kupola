// SPDX-License-Identifier: MIT
/**
 * Directive diagnostics and shared module state: formatted warnings, the HTML
 * sanitizer default, and the active walk-root counter.
 *
 * @module directives/warnings
 */

import { flushJobs, getCurrentScheduler } from '@kupola/core';

export let htmlSanitizer = null;
export const walkRootCount = { value: 0 };
function formatDiagnostic(code, message) {
  return `[kupola ${code}] ${message}`;
}

function warn(code, message) {
  console.warn(formatDiagnostic(code, message));
}

function flushReactiveJobs(scheduler = getCurrentScheduler()) {
  if (scheduler) {
    if (typeof scheduler.flushJobs === 'function') {scheduler.flushJobs();}
    return;
  }
  flushJobs();
}

export function setHtmlSanitizer(sanitizer) {
  if (sanitizer !== null && typeof sanitizer !== 'function') {
    throw new TypeError('[kupola] setHtmlSanitizer() expects a function or null.');
  }
  htmlSanitizer = sanitizer;
  if (walkRootCount.value > 1) {
    warn('W025', 'setHtmlSanitizer() was called with multiple walk roots active. ' +
      'Consider passing sanitizer via walk({ sanitizer }) for per-root isolation.');
  }
}

function describeElement(el) {
  const tag = el.tagName ? el.tagName.toLowerCase() : 'node';
  const id = el.id ? `#${el.id}` : '';
  const classes = el.classList && el.classList.length > 0
    ? '.' + [ ...el.classList ].join('.')
    : '';
  return `<${tag}${id}${classes}>`;
}

/**
 * Apply k-text directive: reactive textContent.
 */

function warnUnknownModifiers(el, directive, modifiers, knownModifiers) {
  const unknown = modifiers.filter(modifier => !knownModifiers(modifier));
  if (unknown.length === 0) {return;}
  warn(
    'W014',
    `${describeElement(el)} has unknown ${directive} modifier(s): ${unknown.map(item => `.${item}`).join(', ')}.`,
  );
}


function warnDirectiveCombinations(el) {
  const hasFor = el.hasAttribute('k-for');
  const hasIf = el.hasAttribute('k-if');
  const hasElseIf = el.hasAttribute('k-else-if');
  const hasElse = el.hasAttribute('k-else');
  const hasKey = el.hasAttribute('k-key') || el.hasAttribute(':key') || el.hasAttribute('k-bind:key');

  if (hasFor && hasIf) {
    warn(
      'W005',
      `${describeElement(el)} combines k-for and k-if on the same element. ` +
      'Prefer wrapping one directive around the other so list and branch lifecycles stay explicit.',
    );
  }

  const branchDirectives = [ 'k-if', 'k-else-if', 'k-else' ].filter(name => el.hasAttribute(name));
  if (branchDirectives.length > 1) {
    warn(
      'W021',
      `${describeElement(el)} combines structural branches ${branchDirectives.join(', ')} on one element. ` +
      'Use one branch directive per sibling.',
    );
  }

  if (hasFor && (hasElseIf || hasElse)) {
    warn(
      'W021',
      `${describeElement(el)} combines k-for with k-else-if/k-else. ` +
      'Place the branch directive on a separate sibling.',
    );
  }

  if (hasKey && !hasFor) {
    warn(
      'W021',
      `${describeElement(el)} has k-key outside k-for. k-key only identifies rows rendered by k-for.`,
    );
  }

  if (hasFor && !hasKey) {
    warn(
      'W021',
      `${describeElement(el)} has k-for without k-key. This causes full re-renders on every update, ` +
      'losing input focus and scroll position. Add :key="uniqueValue" for stable diffing.',
    );
  }

  if (hasFor) {
    for (const keyAttribute of [ 'k-key', ':key', 'k-bind:key' ]) {
      if (el.hasAttribute(keyAttribute) && isBlankExpression(el.getAttribute(keyAttribute))) {
        warnEmptyDirectiveExpression(el, keyAttribute);
      }
    }
  }

  if (hasFor) {
    const keyAttrs = [ 'k-key', ':key', 'k-bind:key' ].filter(name => el.hasAttribute(name));
    if (keyAttrs.length > 1) {
      warn(
        'W021',
        `${describeElement(el)} has conflicting k-for key bindings: ${keyAttrs.join(', ')}. ` +
        'Precedence: k-key > :key > k-bind:key. Use only one.',
      );
    }
  }

  if (el.hasAttribute('k-class') && hasAnyAttribute(el, [ ':class', 'k-bind:class' ])) {
    warn(
      'W006',
      `${describeElement(el)} combines k-class with :class/k-bind:class. ` +
      'Use k-class for conditional classes, or :class when you intend to replace the full class attribute.',
    );
  }

  if (el.hasAttribute('k-style') && hasAnyAttribute(el, [ ':style', 'k-bind:style' ])) {
    warn(
      'W007',
      `${describeElement(el)} combines k-style with :style/k-bind:style. ` +
      'Use k-style for conditional style properties, or :style when you intend to replace the full style attribute.',
    );
  }

  if (el.hasAttribute('k-model') && hasAnyAttribute(el, [ ':checked', 'k-bind:checked' ])) {
    warn(
      'W008',
      `${describeElement(el)} combines k-model with :checked/k-bind:checked. ` +
      'Let k-model own checked state to avoid competing writes.',
    );
  }

  const inputType = String(el.getAttribute('type') || '').toLowerCase();
  const valueCanBeOptionValue = el.tagName === 'INPUT' && (inputType === 'checkbox' || inputType === 'radio');
  if (
    el.hasAttribute('k-model') &&
    hasAnyAttribute(el, [ ':value', 'k-bind:value' ]) &&
    !valueCanBeOptionValue
  ) {
    warn(
      'W009',
      `${describeElement(el)} combines k-model with :value/k-bind:value. ` +
      'Let k-model own form value state to avoid competing writes.',
    );
  }
}

function isBlankExpression(expr) {
  return String(expr ?? '').trim() === '';
}

function warnEmptyDirectiveExpression(el, directiveName) {
  warn(
    'W001',
    `${describeElement(el)} has an empty ${directiveName} expression. ` +
    'Provide an expression or remove the directive.',
  );
}

function directiveRequiresExpression(base) {
  return (
    base === 'k-show' ||
    base === 'k-text' ||
    base === 'k-html' ||
    base === 'k-bind' ||
    base === 'k-on' ||
    base === 'k-model' ||
    base === 'k-class' ||
    base === 'k-style' ||
    base === 'k-init' ||
    base === 'k-ref'
  );
}

function warnMissingDirectiveArgument(el, directiveName, argumentName) {
  warn(
    'W002',
    `${describeElement(el)} has ${directiveName} without ${argumentName}. ` +
    'Provide an argument or remove the directive.',
  );
}

/**
 * Process a single element's directive attributes.
 */

export {
  describeElement,
  directiveRequiresExpression,
  flushReactiveJobs,
  formatDiagnostic,
  isBlankExpression,
  warn,
  warnDirectiveCombinations,
  warnEmptyDirectiveExpression,
  warnMissingDirectiveArgument,
  warnUnknownModifiers,
};

function hasAnyAttribute(el, names) {
  return names.some(name => el.hasAttribute(name));
}
