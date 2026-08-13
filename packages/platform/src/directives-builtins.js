// SPDX-License-Identifier: MIT
/**
 * Built-in directive handlers: k-show/k-text/k-html/k-bind/k-on/k-model,
 * k-class/k-style/k-transition/k-if/k-for and their helper utilities.
 *
 * @module directives/builtins
 */

import { effect, getCurrentScheduler, runWithScheduler } from '@kupola/core';
import {
  describeElement,
  flushReactiveJobs,
  formatDiagnostic,
  htmlSanitizer,
  isBlankExpression,
  warn,
  warnEmptyDirectiveExpression,
  warnUnknownModifiers,
} from './directives-warnings.js';
import { createEvaluationScope, createLocalScope, evaluate, evaluateStatement } from './directives-expressions.js';
import { isPrototypeKey, isSafeScopePropertyName } from './directives-scope.js';

function handleShow(el, expr, scope, disposers) {
  const useTransition = el.hasAttribute('k-transition');
  let initialized = false;
  let visible = false;
  let cancelTransition = null;

  const dispose = effect(() => {
    const val = evaluate(expr, scope, null, { directive: 'k-show', element: el });
    const nextVisible = Boolean(val);

    if (!initialized) {
      initialized = true;
      visible = nextVisible;
      el.style.display = nextVisible ? '' : 'none';
      return;
    }

    if (nextVisible === visible) {return;}
    visible = nextVisible;

    if (cancelTransition) {
      cancelTransition();
      cancelTransition = null;
    }

    if (!useTransition) {
      el.style.display = nextVisible ? '' : 'none';
      return;
    }

    if (nextVisible) {
      el.style.display = '';
      cancelTransition = runTransition(el, 'enter', () => {
        cancelTransition = null;
      });
    } else {
      cancelTransition = runTransition(el, 'leave', () => {
        el.style.display = 'none';
        cancelTransition = null;
      });
    }
  });
  disposers.push(() => {
    if (cancelTransition) {cancelTransition();}
    dispose();
  });
}


function handleText(el, expr, scope, disposers) {
  const dispose = effect(() => {
    el.textContent = String(evaluate(expr, scope, null, { directive: 'k-text', element: el }) ?? '');
  });
  disposers.push(dispose);
}

function handleOnce(el, expr, scope, _disposers) {
  const html = String(evaluate(expr, scope, null, { directive: 'k-once', element: el }) ?? '');
  el.textContent = html;
}

/**
 * Apply k-html directive: reactive innerHTML.
 */
function sanitizeHtml(html, el, sanitizer) {
  const activeSanitizer = sanitizer === undefined ? htmlSanitizer : sanitizer;
  if (!activeSanitizer) {return html;}
  try {
    const result = activeSanitizer(html, el);
    if (result && typeof result.then === 'function') {
      warn('W023', `${describeElement(el)} sanitizer returned a Promise; k-html sanitizers must be synchronous.`);
      return '';
    }
    if (typeof result !== 'string') {
      warn('W023', `${describeElement(el)} sanitizer must return a string.`);
      return '';
    }
    return result;
  } catch (error) {
    warn('W023', `${describeElement(el)} sanitizer failed: ${error?.message || String(error)}.`);
    return '';
  }
}

function handleHtml(el, expr, scope, disposers, sanitizer) {
  const dispose = effect(() => {
    const html = String(evaluate(expr, scope, null, { directive: 'k-html', element: el }) ?? '');
    el.innerHTML = sanitizeHtml(html, el, sanitizer);
  });
  disposers.push(dispose);
}

/**
 * Apply k-bind directive: reactive attribute.
 *
 * Security strategy: whitelist approach for dynamic attribute binding.
 * Only explicitly allowed attributes can be bound dynamically.
 */
const URL_ATTRIBUTES = new Set([
  'href', 'src', 'action', 'formaction', 'poster', 'xlink:href', 'data', 'codebase',
]);
const BLOCKED_DYNAMIC_ATTRIBUTES = new Set([ 'srcdoc', 'codebase' ]);
const ACTIVE_URL_CONTEXTS = new Set([
  'iframe:src', 'object:data', 'embed:src', 'script:src',
]);
const FORM_URL_CONTEXTS = new Set([ 'form:action', 'button:formaction', 'input:formaction' ]);
const LINK_URL_CONTEXTS = new Set([ 'a:href', 'area:href' ]);
const MEDIA_URL_CONTEXTS = new Set([
  'audio:src', 'img:src', 'image:href', 'image:xlink:href', 'source:src', 'track:src', 'video:src', 'video:poster',
]);
const SAFE_MEDIA_DATA_URL = /^data:image\/(?:avif|bmp|gif|jpeg|jpg|png|webp);base64,/i;
const URL_ALLOWED_PROTOCOLS = new Set([ 'http:', 'https:' ]);
const SAFE_NON_URL_ATTRIBUTES = new Set([
  'id', 'class', 'style', 'title', 'alt', 'placeholder', 'disabled', 'readonly',
  'checked', 'selected', 'required', 'value', 'name', 'type', 'role', 'aria-label',
  'aria-hidden', 'aria-disabled', 'aria-invalid', 'aria-describedby', 'aria-labelledby',
  'aria-expanded', 'aria-controls', 'aria-current', 'aria-selected', 'aria-modal',
  'data-*', 'tabindex', 'autocomplete', 'pattern', 'maxlength', 'minlength', 'size',
  'accept', 'multiple', 'autofocus', 'formnovalidate', 'novalidate', 'enctype',
  'method', 'target', 'rel', 'download', 'crossorigin', 'integrity', 'referrerpolicy',
]);

function hasUrlConfusionChars(value) {
  for (const char of String(value)) {
    const code = char.codePointAt(0);
    if (
      code <= 0x1f ||
      (code >= 0x7f && code <= 0x9f) ||
      code > 0x7e ||
      (code >= 0x200b && code <= 0x200f) ||
      (code >= 0x202a && code <= 0x202e) ||
      (code >= 0x2060 && code <= 0x206f) ||
      code === 0xfeff
    ) {
      return true;
    }
  }
  return false;
}

function decodeUrlForInspection(value) {
  let decoded = value;
  for (let i = 0; i < 3; i += 1) {
    try {
      const next = decodeURIComponent(decoded);
      if (next === decoded) {break;}
      decoded = next;
    } catch {
      break;
    }
  }
  return decoded;
}

function getUrlContext(el, attrName) {
  return `${String(el.tagName || '').toLowerCase()}:${String(attrName).toLowerCase()}`;
}

function isSafeDynamicUrl(el, attrName, value) {
  const raw = String(value).trim();
  const decoded = decodeUrlForInspection(raw);
  const compact = decoded.replace(/\s+/g, '').toLowerCase();
  const context = getUrlContext(el, attrName);

  if (!raw || hasUrlConfusionChars(raw) || hasUrlConfusionChars(decoded)) {return false;}
  if (raw.startsWith('//') || decoded.startsWith('//')) {return false;}
  if (/^(?:javascript|vbscript):/i.test(compact)) {return false;}
  if (compact.startsWith('data:')) {
    return MEDIA_URL_CONTEXTS.has(context) && SAFE_MEDIA_DATA_URL.test(decoded);
  }
  if (ACTIVE_URL_CONTEXTS.has(context)) {return false;}

  let parsed;
  try {
    const baseURI = el.ownerDocument?.baseURI || (typeof document !== 'undefined' ? document.baseURI : 'http://localhost/');
    parsed = new URL(decoded, baseURI);
  } catch {
    return false;
  }

  if (LINK_URL_CONTEXTS.has(context)) {
    return URL_ALLOWED_PROTOCOLS.has(parsed.protocol) || parsed.protocol === 'mailto:' || parsed.protocol === 'tel:';
  }
  if (FORM_URL_CONTEXTS.has(context)) {
    return URL_ALLOWED_PROTOCOLS.has(parsed.protocol);
  }
  return URL_ALLOWED_PROTOCOLS.has(parsed.protocol);
}

function isDangerousBoundAttribute(el, attrName, value) {
  const name = String(attrName).toLowerCase();
  const tagName = String(el.tagName || '').toLowerCase();
  if (isPrototypeKey(name) || /^on/i.test(name) || BLOCKED_DYNAMIC_ATTRIBUTES.has(name)) {return true;}
  if (tagName === 'meta' && name === 'http-equiv') {return true;}
  if (tagName === 'base' && name === 'href') {return true;}
  if (URL_ATTRIBUTES.has(name)) {
    if (value == null) {return false;}
    return !isSafeDynamicUrl(el, name, value);
  }
  if (SAFE_NON_URL_ATTRIBUTES.has(name) || name.startsWith('data-')) {return false;}
  warn(
    'W020',
    `${describeElement(el)} blocked dynamic attribute "${attrName}"; ` +
    'only whitelisted attributes may be bound dynamically.',
  );
  return true;
}

function setBoundAttribute(el, attrName, val) {
  if (isDangerousBoundAttribute(el, attrName, val)) {
    el.removeAttribute(attrName);
    warn(
      'W020',
      `${describeElement(el)} blocked unsafe dynamic attribute "${attrName}".`,
    );
    return;
  }
  if (val === false || val == null) {
    el.removeAttribute(attrName);
  } else if (val === true) {
    el.setAttribute(attrName, '');
  } else {
    el.setAttribute(attrName, String(val));
  }
}

function handleBind(el, expr, attrName, scope, disposers) {
  let previousAttrs = new Set();

  const dispose = effect(() => {
    const val = evaluate(expr, scope, null, {
      directive: attrName ? `k-bind:${attrName}` : 'k-bind',
      element: el,
    });

    if (attrName) {
      setBoundAttribute(el, attrName, val);
      return;
    }

    if (!val || typeof val !== 'object') {
      for (const name of previousAttrs) {
        el.removeAttribute(name);
      }
      previousAttrs = new Set();
      return;
    }

    for (const name of previousAttrs) {
      if (!Object.prototype.hasOwnProperty.call(val, name)) {
        el.removeAttribute(name);
      }
    }
    for (const [ name, attrValue ] of Object.entries(val)) {
      setBoundAttribute(el, name, attrValue);
    }
    previousAttrs = new Set(Object.keys(val));
  });
  disposers.push(dispose);
}

/**
 * Apply k-on directive: event listener.
 */
function handleOn(el, expr, eventName, modifiers, scope, disposers) {
  const scheduler = getCurrentScheduler();
  validateEventModifiers(el, eventName, modifiers);
  const stop = modifiers.includes('stop');
  const prevent = modifiers.includes('prevent');
  const once = modifiers.includes('once');
  const self = modifiers.includes('self');
  const outside = modifiers.includes('outside');
  const debounce = modifiers.includes('debounce');
  const capture = modifiers.includes('capture');
  const passive = modifiers.includes('passive');
  const debounceDelay = Number(modifiers.find(item => /^\d+$/.test(item)) || 250);
  const keyAliases = {
    enter: 'enter',
    escape: 'escape',
    esc: 'escape',
    space: ' ',
    tab: 'tab',
    up: 'arrowup',
    down: 'arrowdown',
    left: 'arrowleft',
    right: 'arrowright',
  };
  const systemKeyModifiers = {
    ctrl: 'ctrlKey',
    shift: 'shiftKey',
    alt: 'altKey',
    meta: 'metaKey',
  };
  const nonKeyModifiers = new Set([
    'stop',
    'prevent',
    'once',
    'self',
    'outside',
    'debounce',
    'capture',
    'passive',
    ...Object.keys(systemKeyModifiers),
  ]);
  const keyFilters = modifiers
    .filter(modifier => (
      Object.prototype.hasOwnProperty.call(keyAliases, modifier) ||
      (!nonKeyModifiers.has(modifier) && /^[a-z]$/i.test(modifier))
    ))
    .map(modifier => keyAliases[modifier] || modifier.toLowerCase());
  const requiredSystemKeys = modifiers
    .filter(modifier => Object.prototype.hasOwnProperty.call(systemKeyModifiers, modifier))
    .map(modifier => systemKeyModifiers[modifier]);
  const listenerOptions = capture || passive ? { capture, passive } : undefined;
  let timer = null;
  let active = true;
  let listening = false;
  let target = null;

  const stopListening = () => {
    if (!listening) {return;}
    listening = false;
    target.removeEventListener(eventName, handler, listenerOptions);
  };

  const cleanup = () => {
    if (!active) {return;}
    active = false;
    clearTimeout(timer);
    stopListening();
  };

  const run = (e) => {
    if (!active) {return;}
    runWithScheduler(scheduler, () => {
      evaluateStatement(expr, scope, { event: e, $event: e }, {
        directive: `k-on:${eventName}`,
        element: el,
      });
      flushReactiveJobs(scheduler);
      if (once) {cleanup();}
    });
  };

  const handler = (e) => {
    if (!active) {return;}
    if (outside && el.contains(e.target)) {return;}
    if (self && e.target !== el) {return;}
    if (requiredSystemKeys.some(key => !e[key])) {return;}
    if (keyFilters.length > 0 && !keyFilters.includes(normalizeEventKey(e.key))) {return;}
    if (stop) {e.stopPropagation();}
    if (prevent && !passive) {e.preventDefault();}

    if (debounce) {
      clearTimeout(timer);
      timer = setTimeout(() => run(e), debounceDelay);
      if (once) {stopListening();}
      return;
    }

    run(e);
  };

  target = outside ? document : el;
  listening = true;
  target.addEventListener(eventName, handler, listenerOptions);
  disposers.push(cleanup);
}

function normalizeEventKey(key) {
  return key === ' ' ? ' ' : String(key || '').toLowerCase();
}

const EVENT_KEY_ALIASES = new Set([
  'enter', 'escape', 'esc', 'space', 'tab', 'up', 'down', 'left', 'right',
]);
const EVENT_STANDARD_MODIFIERS = new Set([
  'stop', 'prevent', 'once', 'self', 'outside', 'debounce', 'capture', 'passive',
  'ctrl', 'shift', 'alt', 'meta',
]);
const KEYBOARD_EVENTS = new Set([ 'keydown', 'keyup', 'keypress' ]);


function validateEventModifiers(el, eventName, modifiers) {
  const hasDebounce = modifiers.includes('debounce');
  warnUnknownModifiers(el, `k-on:${eventName}`, modifiers, modifier => (
    EVENT_STANDARD_MODIFIERS.has(modifier) ||
    EVENT_KEY_ALIASES.has(modifier) ||
    /^[a-z]$/i.test(modifier) ||
    (hasDebounce && /^\d+$/.test(modifier))
  ));

  if (modifiers.includes('passive') && modifiers.includes('prevent')) {
    warn(
      'W015',
      `${describeElement(el)} combines .passive and .prevent on k-on:${eventName}; .prevent is ignored.`,
    );
  }

  const keyModifiers = modifiers.filter(modifier => (
    EVENT_KEY_ALIASES.has(modifier) || /^[a-z]$/i.test(modifier)
  ));
  if (keyModifiers.length > 0 && !KEYBOARD_EVENTS.has(eventName.toLowerCase())) {
    warn(
      'W016',
      `${describeElement(el)} uses keyboard modifier(s) ${keyModifiers.map(item => `.${item}`).join(', ')} ` +
      `on non-keyboard event "${eventName}".`,
    );
  }
}

function validateModelModifiers(el, modifiers) {
  const hasDebounce = modifiers.includes('debounce');
  const known = new Set([ 'trim', 'number', 'boolean', 'lazy', 'debounce' ]);
  warnUnknownModifiers(el, 'k-model', modifiers, modifier => (
    known.has(modifier) || (hasDebounce && /^\d+$/.test(modifier))
  ));

  if (modifiers.includes('number') && modifiers.includes('boolean')) {
    warn(
      'W015',
      `${describeElement(el)} combines incompatible k-model modifiers .number and .boolean; .boolean takes precedence.`,
    );
  }

  const supportsBoolean = el.tagName === 'SELECT' || /^(checkbox|radio)$/.test(el.type);
  if (modifiers.includes('boolean') && !supportsBoolean) {
    warn(
      'W016',
      `${describeElement(el)} uses k-model.boolean on a text-like input; prefer explicit parsing in JavaScript.`,
    );
  }
}

/**
 * Apply k-model directive: two-way binding for form inputs.
 */
function castModelValue(value, modifiers) {
  let next = value;
  if (modifiers.includes('trim') && typeof next === 'string') {
    next = next.trim();
  }
  if (modifiers.includes('boolean')) {
    if (typeof next === 'string') {
      const normalized = next.trim().toLowerCase();
      if (normalized === 'true') {return true;}
      if (normalized === 'false') {return false;}
    }
    return next;
  }
  if (modifiers.includes('number')) {
    const parsed = parseFloat(next);
    next = Number.isNaN(parsed) ? next : parsed;
  }
  return next;
}

function areValuesEqual(a, b, seen = new WeakSet()) {
  if (a === b) {return true;}
  if (typeof a !== typeof b) {return false;}
  if (typeof a === 'number' && typeof b === 'number' && Number.isNaN(a) && Number.isNaN(b)) {return true;}
  if (typeof a === 'object' && a && b) {
    if (seen.has(a) || seen.has(b)) {return seen.has(a) && seen.has(b);}
    seen.add(a);
    seen.add(b);
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) {return false;}
      for (let i = 0; i < a.length; i += 1) {
        if (!areValuesEqual(a[i], b[i], seen)) {return false;}
      }
      return true;
    }
    const keysA = [ ...Object.keys(a), ...Object.getOwnPropertySymbols(a) ];
    const keysB = [ ...Object.keys(b), ...Object.getOwnPropertySymbols(b) ];
    if (keysA.length !== keysB.length) {return false;}
    for (const key of keysA) {
      if (!keysB.includes(key) || !areValuesEqual(a[key], b[key], seen)) {return false;}
    }
    return true;
  }
  return false;
}

function deepClone(value, seen = new WeakSet()) {
  if (!value || typeof value !== 'object') {return value;}
  if (seen.has(value)) {return value;}
  seen.add(value);
  if (Array.isArray(value)) {return value.map(item => deepClone(item, seen));}
  if (value instanceof Date) {return new Date(value.getTime());}
  if (value instanceof RegExp) {return new RegExp(value);}
  const clone = Object.create(Object.getPrototypeOf(value));
  for (const key of Object.getOwnPropertyNames(value)) {
    const desc = Object.getOwnPropertyDescriptor(value, key);
    if (desc && !desc.get && !desc.set) {
      clone[key] = deepClone(value[key], seen);
    } else {
      Object.defineProperty(clone, key, desc);
    }
  }
  for (const key of Object.getOwnPropertySymbols(value)) {
    const desc = Object.getOwnPropertyDescriptor(value, key);
    if (desc && !desc.get && !desc.set) {
      clone[key] = deepClone(value[key], seen);
    } else {
      Object.defineProperty(clone, key, desc);
    }
  }
  return clone;
}

function getModelValue(el, currentValue, modifiers) {
  if (el.type === 'checkbox') {
    const value = castModelValue(el.value, modifiers);
    if (Array.isArray(currentValue)) {
      const next = currentValue.filter(item => !areValuesEqual(item, value));
      if (el.checked) {next.push(value);}
      return next;
    }
    return el.checked;
  }

  if (el.type === 'radio') {
    return el.checked ? castModelValue(el.value, modifiers) : currentValue;
  }

  if (el.tagName === 'SELECT' && el.multiple) {
    return [ ...el.selectedOptions ].map(option => castModelValue(option.value, modifiers));
  }

  return castModelValue(el.value, modifiers);
}

function renderModelValue(el, value, modifiers = []) {
  if (el.type === 'checkbox') {
    if (Array.isArray(value)) {
      const checkboxValue = castModelValue(el.value, modifiers);
      el.checked = value.some(item => areValuesEqual(item, checkboxValue));
    } else {
      el.checked = Boolean(value);
    }
    return;
  }

  if (el.type === 'radio') {
    el.checked = value === castModelValue(el.value, modifiers);
    return;
  }

  if (el.tagName === 'SELECT' && el.multiple) {
    const values = Array.isArray(value) ? value.map(String) : [];
    for (const option of el.options) {
      option.selected = values.includes(option.value);
    }
    return;
  }

  el.value = value != null ? String(value) : '';
}

function setModelExpression(expr, scope, value, el) {
  evaluateStatement(`${expr} = __kupolaModelValue`, scope, { __kupolaModelValue: value }, {
    directive: 'k-model',
    element: el,
  });
}

function handleModel(el, expr, scope, disposers, modifiers = []) {
  if (!isModelElement(el)) {
    warn('W003', `k-model expects <input>, <select>, or <textarea>; received ${describeElement(el)}.`);
    return;
  }

  if (el.type === 'file') {
    warn(
      'W022',
      `${describeElement(el)} uses k-model on a file input. Read FileList from an explicit change handler instead.`,
    );
    return;
  }

  if (!isSafeScopePropertyName(expr.trim())) {
    warn(
      'W024',
      `${describeElement(el)} uses k-model with an unsafe assignment target "${expr}". ` +
      'k-model supports safe property names, dot notation (obj.key), and array indices (arr[0]).',
    );
    return;
  }

  validateModelModifiers(el, modifiers);
  const scheduler = getCurrentScheduler();

  const debounce = modifiers.includes('debounce');
  const debounceDelay = Number(modifiers.find(item => /^\d+$/.test(item)) || 250);
  let timer = null;
  let composing = false;
  let initialValue = deepClone(evaluate(expr, scope, null, { directive: 'k-model', element: el }));

  // Set initial value
  const dispose = effect(() => {
    const val = evaluate(expr, scope, null, { directive: 'k-model', element: el });
    renderModelValue(el, val, modifiers);
  });
  disposers.push(dispose);

  // Listen for user input
  const commit = () => {
    runWithScheduler(scheduler, () => {
      const currentValue = evaluate(expr, scope, null, { directive: 'k-model', element: el });
      setModelExpression(expr, scope, getModelValue(el, currentValue, modifiers), el);
      flushReactiveJobs(scheduler);
    });
  };

  const inputHandler = (event) => {
    if (composing || event?.isComposing) {return;}
    if (debounce) {
      clearTimeout(timer);
      timer = setTimeout(commit, debounceDelay);
      return;
    }
    commit();
  };

  const eventName = modifiers.includes('lazy') || /^(checkbox|radio)$/.test(el.type) || el.tagName === 'SELECT'
    ? 'change'
    : 'input';

  el.addEventListener(eventName, inputHandler);
  const usesCompositionEvents = eventName === 'input';
  const compositionStartHandler = () => {
    composing = true;
  };
  const compositionEndHandler = () => {
    if (!composing) {return;}
    composing = false;
    inputHandler();
  };
  if (usesCompositionEvents) {
    el.addEventListener('compositionstart', compositionStartHandler);
    el.addEventListener('compositionend', compositionEndHandler);
  }

  const form = el.form;
  if (form) {
    const formResetHandler = () => {
      runWithScheduler(scheduler, () => {
        setModelExpression(expr, scope, initialValue, el);
        flushReactiveJobs(scheduler);
      });
    };
    form.addEventListener('reset', formResetHandler);
    disposers.push(() => {
      form.removeEventListener('reset', formResetHandler);
    });
  }

  disposers.push(() => {
    clearTimeout(timer);
    el.removeEventListener(eventName, inputHandler);
    if (usesCompositionEvents) {
      el.removeEventListener('compositionstart', compositionStartHandler);
      el.removeEventListener('compositionend', compositionEndHandler);
    }
  });
}

function isModelElement(el) {
  return el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'TEXTAREA';
}

function normalizeClassValue(value, classes = new Set()) {
  if (!value) {return classes;}
  if (typeof value === 'string') {
    value.split(/\s+/).filter(Boolean).forEach(cls => classes.add(cls));
  } else if (Array.isArray(value)) {
    value.forEach(item => normalizeClassValue(item, classes));
  } else if (typeof value === 'object') {
    for (const [ cls, active ] of Object.entries(value)) {
      if (active) {normalizeClassValue(cls, classes);}
    }
  }
  return classes;
}

function cloneTemplateNodes(template) {
  if (template.tagName === 'TEMPLATE') {
    return [ ...template.content.cloneNode(true).childNodes ];
  }
  return [ template.cloneNode(true) ];
}

function insertNodesBefore(parent, marker, nodes) {
  const fragment = document.createDocumentFragment();
  for (const node of nodes) {
    fragment.appendChild(node);
  }
  parent.insertBefore(fragment, marker);
}

function processMountedNodes(
  nodes,
  scope,
  disposers,
  ctx,
  processSubtree,
  allowRootTransition = false,
) {
  for (const node of nodes) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      processSubtree(node, scope, disposers, ctx, allowRootTransition);
    }
  }
}

function removeMountedNodes(nodes) {
  for (const node of nodes) {
    if (node.parentNode) {
      node.parentNode.removeChild(node);
    }
  }
}

function cleanDisposers(disposers) {
  let firstError;
  for (const dispose of disposers) {
    try {
      dispose();
    } catch (error) {
      if (!firstError) {firstError = error;}
    }
  }
  disposers.length = 0;
  return firstError;
}

function nextFrame(callback) {
  const raf = typeof requestAnimationFrame === 'function'
    ? requestAnimationFrame
    : fn => setTimeout(fn, 0);
  raf(() => raf(callback));
}

function parseDurationList(value) {
  return String(value || '')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)
    .map((item) => {
      if (item.endsWith('ms')) {return parseFloat(item);}
      if (item.endsWith('s')) {return parseFloat(item) * 1000;}
      return parseFloat(item) || 0;
    });
}

function getTransitionTimeout(el) {
  if (typeof getComputedStyle !== 'function') {return 0;}
  const styles = getComputedStyle(el);
  const transitionDurations = parseDurationList(styles.transitionDuration);
  const transitionDelays = parseDurationList(styles.transitionDelay);
  const animationDurations = parseDurationList(styles.animationDuration);
  const animationDelays = parseDurationList(styles.animationDelay);
  const maxTransition = Math.max(
    0,
    ...transitionDurations.map((duration, index) => duration + (transitionDelays[index] || 0)),
  );
  const maxAnimation = Math.max(
    0,
    ...animationDurations.map((duration, index) => duration + (animationDelays[index] || 0)),
  );
  return Math.max(maxTransition, maxAnimation);
}

function getTransitionClasses(el, type) {
  const name = el.getAttribute('k-transition')?.trim() || 'kp';
  return {
    from: `${name}-${type}-from`,
    active: `${name}-${type}-active`,
    to: `${name}-${type}-to`,
  };
}

function findTransitionElement(nodes) {
  return nodes.find(node => node.nodeType === Node.ELEMENT_NODE && node.hasAttribute('k-transition')) || null;
}

function runTransition(el, type, done = () => {}) {
  const classes = getTransitionClasses(el, type);
  let finished = false;
  let timer = null;

  const cleanup = (event) => {
    if (event && event.target !== el) {return;}
    if (finished) {return;}
    finished = true;
    clearTimeout(timer);
    el.classList.remove(classes.from, classes.active, classes.to);
    el.removeEventListener('transitionend', cleanup);
    el.removeEventListener('animationend', cleanup);
    done();
  };

  el.classList.remove(classes.to);
  el.classList.add(classes.from, classes.active);

  nextFrame(() => {
    if (finished) {return;}
    el.classList.remove(classes.from);
    el.classList.add(classes.to);

    const timeout = getTransitionTimeout(el);
    el.addEventListener('transitionend', cleanup);
    el.addEventListener('animationend', cleanup);
    timer = setTimeout(cleanup, timeout + 50);
  });

  return cleanup;
}

/**
 * Apply k-class directive: object/array/string class binding.
 */
function handleClass(el, expr, scope, disposers) {
  const staticClasses = new Set(el.classList);
  let previous = new Set();

  const dispose = effect(() => {
    const next = normalizeClassValue(evaluate(expr, scope, null, { directive: 'k-class', element: el }));
    for (const cls of previous) {
      if (!next.has(cls) && !staticClasses.has(cls)) {
        el.classList.remove(cls);
      }
    }
    for (const cls of next) {
      el.classList.add(cls);
    }
    previous = next;
  });
  disposers.push(dispose);
}

function containsUnsafeCssUrl(value) {
  return /url\s*\(\s*['"]?\s*(?:javascript:|vbscript:|data:\s*(?:text\/html|image\/svg\+xml))/i.test(
    String(value || '').replace(/\s+/g, ''),
  );
}

function setStyleProperty(el, prop, value) {
  const name = prop.replace(/[A-Z]/g, match => '-' + match.toLowerCase());
  if (value != null && value !== false && containsUnsafeCssUrl(value)) {
    el.style.removeProperty(name);
    warn('W020', `${describeElement(el)} blocked unsafe dynamic CSS value for "${name}".`);
    return;
  }
  if (value == null || value === false) {
    el.style.removeProperty(name);
  } else {
    el.style.setProperty(name, String(value));
  }
}

/**
 * Apply k-style directive: object/string style binding.
 */
function handleStyle(el, expr, scope, disposers) {
  const staticStyle = el.getAttribute('style') || '';
  let previousProps = new Set();

  const dispose = effect(() => {
    const value = evaluate(expr, scope, null, { directive: 'k-style', element: el });

    if (typeof value === 'string') {
      if (containsUnsafeCssUrl(value)) {
        el.setAttribute('style', staticStyle);
        warn('W020', `${describeElement(el)} blocked unsafe dynamic CSS value.`);
      } else {
        el.setAttribute('style', staticStyle ? staticStyle + ';' + value : value);
      }
      previousProps = new Set();
      return;
    }

    if (!value || typeof value !== 'object') {
      for (const prop of previousProps) {
        setStyleProperty(el, prop, null);
      }
      previousProps = new Set();
      if (staticStyle) {
        el.setAttribute('style', staticStyle);
      } else {
        el.removeAttribute('style');
      }
      return;
    }

    for (const prop of previousProps) {
      if (!Object.prototype.hasOwnProperty.call(value, prop)) {
        setStyleProperty(el, prop, null);
      }
    }
    for (const [ prop, propValue ] of Object.entries(value)) {
      setStyleProperty(el, prop, propValue);
    }
    previousProps = new Set(Object.keys(value));
  });
  disposers.push(dispose);
}

/**
 * Apply k-if/k-else-if/k-else directive chain: mount one branch with cleanup.
 */
function handleIf(el, expr, scope, disposers, ctx, processSubtree) {
  const parent = el.parentNode;
  if (!parent) {return;}

  const marker = document.createComment(`k-if: ${expr}`);
  const branches = [];

  const addBranch = (node, branchExpr, directive) => {
    if (directive !== 'k-else' && isBlankExpression(branchExpr)) {
      warnEmptyDirectiveExpression(node, directive);
      return;
    }
    const template = node.cloneNode(true);
    template.removeAttribute('k-if');
    template.removeAttribute('k-else-if');
    template.removeAttribute('k-else');
    branches.push({ expr: branchExpr, template, element: node, directive });
  };

  addBranch(el, expr, 'k-if');

  let next = el.nextElementSibling;
  while (next && (next.hasAttribute('k-else-if') || next.hasAttribute('k-else'))) {
    const current = next;
    next = next.nextElementSibling;
    if (current.hasAttribute('k-for')) {
      // Leave invalid list branches for the regular walker so it can diagnose
      // and retain the node instead of silently absorbing it into this chain.
      break;
    }
    addBranch(
      current,
      current.hasAttribute('k-else-if') ? current.getAttribute('k-else-if') : null,
      current.hasAttribute('k-else-if') ? 'k-else-if' : 'k-else',
    );
    parent.removeChild(current);
    if (current.hasAttribute('k-else')) {
      if (next && (next.hasAttribute('k-else-if') || next.hasAttribute('k-else'))) {
        warn(
          'W021',
          `${describeElement(next)} appears after k-else. An else branch must be the final branch in its chain.`,
        );
      }
      break;
    }
  }

  parent.replaceChild(marker, el);

  let currentNodes = [];
  let childDisposers = [];
  let currentBranch = null;
  let initialized = false;
  let cancelLeaves = [];

  const unmount = (withTransition = false) => {
    if (currentNodes.length === 0) {return;}
    const nodes = currentNodes;
    const disposersForNodes = childDisposers;
    const transitionEl = findTransitionElement(nodes);
    currentNodes = [];
    childDisposers = [];
    currentBranch = null;

    let firstError = cleanDisposers(disposersForNodes);

    if (withTransition && transitionEl) {
      let cancel = null;
      try {
        cancel = runTransition(transitionEl, 'leave', () => {
          removeMountedNodes(nodes);
          cancelLeaves = cancelLeaves.filter(item => item !== cancel);
        });
        cancelLeaves.push(cancel);
      } catch (error) {
        removeMountedNodes(nodes);
        if (!firstError) {firstError = error;}
      }
    } else {
      removeMountedNodes(nodes);
    }

    if (firstError) {throw firstError;}
  };

  const mount = (branch, withTransition = false) => {
    if (!marker.parentNode) {return;}
    currentNodes = cloneTemplateNodes(branch.template);
    insertNodesBefore(marker.parentNode, marker, currentNodes);
    processMountedNodes(
      currentNodes,
      scope,
      childDisposers,
      ctx,
      processSubtree,
      withTransition || Boolean(findTransitionElement(currentNodes)),
    );
    currentBranch = branch;

    if (withTransition) {
      const transitionEl = findTransitionElement(currentNodes);
      if (transitionEl) {
        runTransition(transitionEl, 'enter');
      }
    }
  };

  const dispose = effect(() => {
    let activeBranch = null;
    for (const branch of branches) {
      if (!branch.expr || evaluate(branch.expr, scope, null, {
        directive: branch.directive,
        element: branch.element,
      })) {
        activeBranch = branch;
        break;
      }
    }

    if (activeBranch === currentBranch) {return;}

    unmount(initialized);
    if (activeBranch) {mount(activeBranch, initialized);}
    initialized = true;
  });

  disposers.push(dispose, () => {
    for (const cancel of cancelLeaves) {
      cancel();
    }
    cancelLeaves = [];
    unmount(false);
  });
}

function parseForExpression(expr) {
  const identifier = '[A-Za-z_$][\\w$]*';
  const pattern = new RegExp(
    '^\\s*(?:\\(\\s*(' + identifier + ')\\s*,\\s*(' + identifier + ')\\s*\\)|(' + identifier + '))' +
      '\\s+(?:in|of)\\s+(.+?)\\s*$',
  );
  const match = expr.match(pattern);
  if (!match) {
    throw new Error(
      formatDiagnostic(
        'E002',
        `Invalid k-for expression "${expr}". Use "item in items", ` +
        '"(item, index) in items", or "(value, key) in object".',
      ),
    );
  }
  return {
    itemName: match[1] || match[3],
    indexName: match[2] || null,
    itemsExpr: match[4],
  };
}

function toIterationEntries(value) {
  if (!value) {return [];}
  if (Array.isArray(value)) {
    return value.map((item, index) => ({ item, index, key: index }));
  }
  if (typeof value === 'string') {
    return [ ...value ].map((item, index) => ({ item, index, key: index }));
  }
  if (typeof value[Symbol.iterator] === 'function') {
    return [ ...value ].map((item, index) => ({ item, index, key: index }));
  }
  if (typeof value === 'object') {
    return Object.entries(value).map(([ key, item ], index) => ({ item, index, key }));
  }
  return [];
}

function formatKey(key) {
  if (typeof key === 'string') {return key;}
  if (typeof key === 'symbol') {return `Symbol(${key.description || ''})`;}
  if (key === null) {return 'null';}
  if (key === undefined) {return 'undefined';}
  if (typeof key === 'object') {
    return `[object ${key.constructor?.name || 'Object'}]`;
  }
  try {
    return JSON.stringify(key) ?? String(key);
  } catch {
    return String(key);
  }
}

function getForKeyExpression(el) {
  const keyAttributes = [ 'k-key', ':key', 'k-bind:key' ]
    .filter(name => el.hasAttribute(name));
  if (keyAttributes.length > 1) {
    warn(
      'W021',
      `${describeElement(el)} has conflicting k-for keys (${keyAttributes.join(', ')}). ` +
      'Use one key binding; precedence is k-key, then :key, then k-bind:key.',
    );
  }

  const selected = keyAttributes[0];
  if (!selected) {return null;}
  const expression = el.getAttribute(selected);
  return isBlankExpression(expression) ? null : expression;
}

function handleFor(el, expr, scope, disposers, ctx, processSubtree) {
  const parent = el.parentNode;
  if (!parent) {return;}

  const marker = document.createComment(`k-for: ${expr}`);
  const template = el.cloneNode(true);
  const keyExpr = getForKeyExpression(el);
  template.removeAttribute('k-for');
  template.removeAttribute('k-key');
  template.removeAttribute(':key');
  template.removeAttribute('k-bind:key');
  parent.replaceChild(marker, el);

  const { itemName, indexName, itemsExpr } = parseForExpression(expr);
  let currentNodes = [];
  let childDisposers = [];
  let keyedBlocks = new Map();

  const unmount = () => {
    const firstError = cleanDisposers(childDisposers);
    removeMountedNodes(currentNodes);
    currentNodes = [];
    if (firstError) {throw firstError;}
  };

  const unmountKeyed = () => {
    let firstError;
    for (const block of keyedBlocks.values()) {
      const error = cleanDisposers(block.disposers);
      removeMountedNodes(block.nodes);
      if (!firstError && error) {firstError = error;}
    }
    keyedBlocks = new Map();
    if (firstError) {throw firstError;}
  };

  const createLocals = (entry) => {
    const locals = { [itemName]: entry.item };
    if (indexName) {locals[indexName] = entry.key;}
    return locals;
  };

  const renderUnkeyed = (items) => {
    unmount();
    if (!marker.parentNode) {return;}

    for (let index = 0; index < items.length; index += 1) {
      const entry = items[index];
      const locals = createLocals(entry);
      const itemScope = createEvaluationScope(scope, locals);
      const nodes = cloneTemplateNodes(template);
      currentNodes.push(...nodes);
      insertNodesBefore(marker.parentNode, marker, nodes);
      processMountedNodes(nodes, itemScope, childDisposers, ctx, processSubtree);
    }
  };

  const renderKeyed = (items) => {
    if (!marker.parentNode) {return;}

    const staleBlocks = new Map(keyedBlocks);
    const nextBlocks = new Map();
    const seenKeys = new Set();

    for (let index = 0; index < items.length; index += 1) {
      const entry = items[index];
      const locals = createLocals(entry);
      const rawKey = evaluate(keyExpr, scope, locals, { directive: 'k-key', element: el });
      let key = rawKey;

      if (seenKeys.has(rawKey)) {
        warn(
          'W004',
          `${describeElement(el)} has duplicate k-for key "${formatKey(rawKey)}". ` +
          'Duplicate keys can reuse the wrong row; make :key unique.',
        );
        key = Symbol('kupola-duplicate-key');
      } else {
        seenKeys.add(rawKey);
      }

      let block = staleBlocks.get(key);

      if (block) {
        block.localScope.update(locals);
        staleBlocks.delete(key);
      } else {
        const localScope = createLocalScope(scope, locals);
        const nodes = cloneTemplateNodes(template);
        const blockDisposers = [];
        block = { nodes, disposers: blockDisposers, localScope };
        processMountedNodes(nodes, localScope.scope, blockDisposers, ctx, processSubtree);
      }

      nextBlocks.set(key, block);
      insertNodesBefore(marker.parentNode, marker, block.nodes);
    }

    let cleanupError;
    for (const block of staleBlocks.values()) {
      const error = cleanDisposers(block.disposers);
      removeMountedNodes(block.nodes);
      if (!cleanupError && error) {cleanupError = error;}
    }

    keyedBlocks = nextBlocks;
    if (cleanupError) {throw cleanupError;}
  };

  const dispose = effect(() => {
    const items = toIterationEntries(evaluate(itemsExpr, scope, null, { directive: 'k-for', element: el }));
    if (keyExpr) {
      renderKeyed(items);
    } else {
      renderUnkeyed(items);
    }
  });

  disposers.push(dispose, keyExpr ? unmountKeyed : unmount);
}

// ─── DOM Walker ───────────────────────────────────────────────────────────────

/**
 * Check if an attribute name is a directive.
 */

export {
  cleanDisposers,
  handleBind,
  handleClass,
  handleFor,
  handleHtml,
  handleIf,
  handleModel,
  handleOn,
  handleOnce,
  handleShow,
  handleStyle,
  handleText,
};
