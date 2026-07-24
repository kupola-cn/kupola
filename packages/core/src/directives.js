// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Declarative directive system.
 *
 * Provides Alpine.js-like interactivity via HTML attributes:
 *   k-data   — create a reactive scope
 *   k-show   — conditional display
 *   k-text   — reactive textContent
 *   k-html   — reactive innerHTML
 *   k-bind   — dynamic attributes  (shorthand:  :attr)
 *   k-on     — event listeners     (shorthand:  @event)
 *   k-model  — two-way input binding
 *   k-ref    — scoped element references
 *   k-init   — one-time initialization statement
 *   k-cloak  — hide until initialized
 *   k-class  — object/array/string class binding
 *   k-style  — object/string style binding
 *   k-transition — CSS transition class lifecycle
 *   k-if     — conditional DOM mounting
 *   k-else-if — conditional branch after k-if
 *   k-else   — fallback branch after k-if
 *   k-for    — list rendering
 *
 * @module directives
 */

import { signal, withoutTracking } from './signal.js';
import { effect } from './effect.js';
import { flushJobs } from './scheduler.js';

// ─── Scope Registry ──────────────────────────────────────────────────────────

/** @type {Map<string, Object|Function>} */
const scopeRegistry = new Map();
let htmlSanitizer = null;
let walkRootCount = 0;

function formatDiagnostic(code, message) {
  return `[kupola ${code}] ${message}`;
}

function warn(code, message) {
  console.warn(formatDiagnostic(code, message));
}

/**
 * Configure HTML processing for k-html. Pass null to restore trusted passthrough behavior.
 *
 * Note: This sets a global default. For multi-app/micro-frontend scenarios,
 * prefer passing sanitizer via walk({ sanitizer }) for per-root isolation.
 *
 * @param {((html: string, element: Element) => string)|null} sanitizer
 */
export function setHtmlSanitizer(sanitizer) {
  if (sanitizer !== null && typeof sanitizer !== 'function') {
    throw new TypeError('[kupola] setHtmlSanitizer() expects a function or null.');
  }
  htmlSanitizer = sanitizer;
  if (walkRootCount > 1) {
    warn('W025', 'setHtmlSanitizer() was called with multiple walk roots active. ' +
      'Consider passing sanitizer via walk({ sanitizer }) for per-root isolation.');
  }
}

/**
 * Query one element. Thin wrapper around querySelector().
 *
 * @param {string|Element|null} selector
 * @param {ParentNode} [context=document]
 * @returns {Element|null}
 */
export function $(selector, context = document) {
  if (typeof selector !== 'string') {return selector || null;}
  return context?.querySelector ? context.querySelector(selector) : null;
}

/**
 * Query multiple elements as a static array.
 *
 * @param {string} selector
 * @param {ParentNode} [context=document]
 * @returns {Element[]}
 */
export function $$(selector, context = document) {
  if (typeof selector !== 'string') {return [];}
  return context?.querySelectorAll ? [ ...context.querySelectorAll(selector) ] : [];
}

/**
 * Register a named data scope for use with `k-data="name"`.
 *
 * @param {string} name
 * @param {Object|Function} definition Plain data object or factory `(ctx) => data`.
 */
export function defineScope(name, definition) {
  if (!name || typeof name !== 'string') {
    throw new TypeError('[kupola] defineScope() expects a non-empty string name.');
  }
  if (!definition || (typeof definition !== 'object' && typeof definition !== 'function')) {
    throw new TypeError('[kupola] defineScope() expects an object or factory function.');
  }
  scopeRegistry.set(name, definition);
}

// ─── Scope ────────────────────────────────────────────────────────────────────

/**
 * Create a reactive scope from a plain data object.
 * Each property becomes a signal; the returned Proxy transparently
 * reads/writes signal values so expressions work naturally.
 *
 * @param {Object} data
 * @returns {Proxy}
 */
function createScope(data) {
  const signals = Object.create(null);
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key) && !isPrototypeKey(key)) {
      signals[key] = signal(data[key]);
    }
  }
  const keys = Object.keys(signals);
  return new Proxy(
    {},
    {
      get(_, key) {
        if (typeof key === 'symbol') {return undefined;}
        const s = signals[key];
        return s ? s.value : undefined;
      },
      set(_, key, val) {
        if (typeof key !== 'string' || isPrototypeKey(key)) {
          return true;
        }
        const s = signals[key];
        if (s) {
          s.value = val;
        } else {
          signals[key] = signal(val);
          keys.push(key);
        }
        return true;
      },
      has(_, key) {
        return key in signals;
      },
      ownKeys() {
        return keys;
      },
      getOwnPropertyDescriptor(_, key) {
        if (key in signals) {
          return { enumerable: true, configurable: true };
        }
        return undefined;
      },
    },
  );
}

function instantiateScopeDefinition(definition, ctx) {
  const data = typeof definition === 'function' ? definition(ctx) : definition;
  if (!data || typeof data !== 'object') {return {};}
  return { ...data };
}

function assertScopeKey(name, helperName) {
  if (!name || typeof name !== 'string' || name.includes('.') || isPrototypeKey(name)) {
    throw new TypeError(`[kupola] ctx.${helperName}() expects a safe top-level scope property name.`);
  }
}

function assertMountedScope(ctx, helperName) {
  if (!ctx.scope) {
    throw new TypeError(`[kupola] ctx.${helperName}() can only be used after a scope is mounted.`);
  }
}

function isPatchableObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isPrototypeKey(key) {
  return key === '__proto__' || key === 'prototype' || key === 'constructor';
}

function isSafeScopePropertyName(name) {
  if (typeof name !== 'string') {return false;}
  if (/^[A-Za-z_$][\w$]*$/.test(name)) {return !isPrototypeKey(name);}
  const safePattern = /^[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*|\[\d+\]|\[\w+\])*$/;
  return safePattern.test(name) && !name.includes('__proto__') && !name.includes('constructor') && !name.includes('prototype');
}

function createDomContext(root, disposers, refs = Object.create(null), appRefs = refs, sanitizer) {
  const queryRoot = root && root.querySelector ? root : document;

  const queryOne = (selector, context = queryRoot) => $(selector, context);
  const queryAll = (selector, context = queryRoot) => $$(selector, context);

  const on = (eventName, selectorOrHandler, handlerOrOptions, maybeOptions) => {
    let selector = null;
    let handler = selectorOrHandler;
    let options = handlerOrOptions;

    if (typeof selectorOrHandler === 'string') {
      selector = selectorOrHandler;
      handler = handlerOrOptions;
      options = maybeOptions;
    }

    if (typeof handler !== 'function') {
      throw new TypeError('[kupola] ctx.on() expects an event handler.');
    }

    const listener = (event) => {
      if (!selector) {
        handler(event, root);
        return;
      }
      const target = event.target?.closest?.(selector);
      if (target && root.contains(target)) {
        handler(event, target);
      }
    };

    root.addEventListener(eventName, listener, options);
    let active = true;
    const off = () => {
      if (!active) {return;}
      active = false;
      root.removeEventListener(eventName, listener, options);
    };
    disposers.push(off);
    return off;
  };

  const watch = (getter, callback, options = {}) => {
    if (typeof getter !== 'function' || typeof callback !== 'function') {
      throw new TypeError('[kupola] ctx.watch() expects a getter and callback.');
    }

    let initialized = false;
    let oldValue;
    let cleanupCallback = null;
    let active = true;

    const runCleanup = () => {
      if (!cleanupCallback) {return;}
      const cleanup = cleanupCallback;
      cleanupCallback = null;
      withoutTracking(cleanup);
    };

    const runCallback = (value, previous) => {
      runCleanup();
      const cleanup = withoutTracking(() => callback(value, previous));
      cleanupCallback = typeof cleanup === 'function' ? cleanup : null;
    };

    const disposeEffect = effect(() => {
      const value = getter();
      if (!initialized) {
        initialized = true;
        oldValue = value;
        if (options.immediate) {
          runCallback(value, undefined);
        }
        return;
      }
      if (Object.is(value, oldValue)) {return;}
      const previous = oldValue;
      oldValue = value;
      runCallback(value, previous);
    });

    const dispose = () => {
      if (!active) {return;}
      active = false;
      disposeEffect();
      runCleanup();
    };

    disposers.push(dispose);
    return dispose;
  };

  const ctx = {
    root,
    refs,
    appRefs,
    sanitizer,
    $: queryOne,
    $$: queryAll,
    on,
    watch,
    update(name, updater) {
      assertMountedScope(ctx, 'update');
      assertScopeKey(name, 'update');
      if (typeof updater !== 'function') {
        throw new TypeError('[kupola] ctx.update() expects an updater function.');
      }
      const previous = ctx.scope[name];
      const next = updater(previous);
      ctx.scope[name] = next;
      return next;
    },
    patch(name, partial) {
      assertMountedScope(ctx, 'patch');
      assertScopeKey(name, 'patch');
      if (!isPatchableObject(partial)) {
        throw new TypeError('[kupola] ctx.patch() expects an object patch.');
      }
      const previous = ctx.scope[name];
      if (!isPatchableObject(previous)) {
        throw new TypeError(`[kupola] ctx.patch() expects "${name}" to be an object scope property.`);
      }
      const next = { ...previous, ...partial };
      ctx.scope[name] = next;
      return next;
    },
  };

  return ctx;
}

function addRef(refs, name, el) {
  if (!name) {return () => {};}
  const current = Object.prototype.hasOwnProperty.call(refs, name) ? refs[name] : null;
  if (!current) {
    refs[name] = el;
  } else if (Array.isArray(current)) {
    current.push(el);
  } else {
    refs[name] = [ current, el ];
  }
  return () => removeRef(refs, name, el);
}

function removeRef(refs, name, el) {
  const current = Object.prototype.hasOwnProperty.call(refs, name) ? refs[name] : null;
  if (!current) {return;}
  if (Array.isArray(current)) {
    const next = current.filter(item => item !== el);
    if (next.length === 0) {
      delete refs[name];
    } else if (next.length === 1) {
      refs[name] = next[0];
    } else {
      refs[name] = next;
    }
  } else if (current === el) {
    delete refs[name];
  }
}

function resolveData(expr, ctx, el) {
  const name = expr?.trim();
  if (name && scopeRegistry.has(name)) {
    return instantiateScopeDefinition(scopeRegistry.get(name), ctx);
  }
  if (/^[A-Za-z_$][\w$]*$/.test(name || '')) {
    throw new Error(formatDiagnostic(
      'W013',
      `Unknown k-data scope "${name}". Register it with defineScope("${name}", ...).`,
    ));
  }
  return evaluate(expr, createScope({}), null, { directive: 'k-data', element: el }) || {};
}

// ─── Expression Evaluation ────────────────────────────────────────────────────

/** Cache compiled expression functions with LRU eviction. */
const exprCache = new Map();
const MAX_CACHED_EXPRESSIONS = 500;
const CACHE_EXPIRE_MS = 300000;
let cacheCleanupTimer = null;

function scheduleCacheCleanup() {
  if (cacheCleanupTimer) {return;}
  cacheCleanupTimer = setTimeout(() => {
    cacheCleanupTimer = null;
    const now = Date.now();
    for (const [ key, entry ] of exprCache) {
      if (entry && entry._lastUsed && now - entry._lastUsed > CACHE_EXPIRE_MS) {
        exprCache.delete(key);
      }
    }
  }, CACHE_EXPIRE_MS);
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    if (cacheCleanupTimer) {
      clearTimeout(cacheCleanupTimer);
      cacheCleanupTimer = null;
    }
  });
}

function cacheExpression(key, fn) {
  const entry = { fn, _lastUsed: Date.now() };
  exprCache.set(key, entry);
  if (exprCache.size > MAX_CACHED_EXPRESSIONS) {
    let oldestKey = null;
    let oldestTime = Infinity;
    for (const [ k, v ] of exprCache) {
      if (v._lastUsed < oldestTime) {
        oldestTime = v._lastUsed;
        oldestKey = k;
      }
    }
    if (oldestKey) {exprCache.delete(oldestKey);}
  }
  scheduleCacheCleanup();
  return fn;
}

/**
 * Evaluate an expression for reading (returns a value).
 * Uses `with(scope)` so variable names resolve through the Proxy.
 *
 * @param {string} expr
 * @param {Proxy} scope
 * @returns {any}
 */
function createEvaluationScope(scope, locals) {
  if (!locals) {return scope;}
  return new Proxy(scope, {
    get(target, key, receiver) {
      if (Object.prototype.hasOwnProperty.call(locals, key)) {
        return locals[key];
      }
      return Reflect.get(target, key, receiver);
    },
    set(target, key, value, receiver) {
      if (Object.prototype.hasOwnProperty.call(locals, key)) {
        locals[key] = value;
        return true;
      }
      return Reflect.set(target, key, value, receiver);
    },
    has(target, key) {
      return Object.prototype.hasOwnProperty.call(locals, key) || key in target;
    },
    ownKeys(target) {
      return [ ...new Set([ ...Reflect.ownKeys(target), ...Reflect.ownKeys(locals) ]) ];
    },
    getOwnPropertyDescriptor(target, key) {
      if (Object.prototype.hasOwnProperty.call(locals, key)) {
        return { enumerable: true, configurable: true };
      }
      return Reflect.getOwnPropertyDescriptor(target, key);
    },
  });
}

function createLocalScope(scope, locals) {
  const localSignals = Object.create(null);
  for (const [ key, value ] of Object.entries(locals)) {
    localSignals[key] = signal(value);
  }

  const proxy = new Proxy(scope, {
    get(target, key, receiver) {
      if (Object.prototype.hasOwnProperty.call(localSignals, key)) {
        return localSignals[key].value;
      }
      return Reflect.get(target, key, receiver);
    },
    set(target, key, value, receiver) {
      if (Object.prototype.hasOwnProperty.call(localSignals, key)) {
        localSignals[key].value = value;
        return true;
      }
      return Reflect.set(target, key, value, receiver);
    },
    has(target, key) {
      return Object.prototype.hasOwnProperty.call(localSignals, key) || key in target;
    },
    ownKeys(target) {
      return [ ...new Set([ ...Reflect.ownKeys(target), ...Reflect.ownKeys(localSignals) ]) ];
    },
    getOwnPropertyDescriptor(target, key) {
      if (Object.prototype.hasOwnProperty.call(localSignals, key)) {
        return { enumerable: true, configurable: true };
      }
      return Reflect.getOwnPropertyDescriptor(target, key);
    },
  });

  return {
    scope: proxy,
    update(nextLocals) {
      for (const [ key, value ] of Object.entries(nextLocals)) {
        if (Object.prototype.hasOwnProperty.call(localSignals, key)) {
          localSignals[key].value = value;
        } else {
          localSignals[key] = signal(value);
        }
      }
    },
  };
}

function createExpressionError(error, expr, meta = {}) {
  const directive = meta.directive || 'expression';
  const element = meta.element ? describeElement(meta.element) : '<unknown>';
  const original = error && error.message ? error.message : String(error);
  const hint = isCspEvalError(error)
    ? '\nHint: Kupola directive expressions use new Function(). Allow unsafe-eval in CSP, ' +
      'or use Kupola JS APIs instead of HTML expressions in strict CSP environments.'
    : '';
  const wrapped = new Error(
    formatDiagnostic('E001', `Error evaluating ${directive} on ${element}: ${expr}`) + '\n' +
    `Original error: ${original}${hint}`,
  );
  wrapped.name = 'KupolaExpressionError';
  wrapped.cause = error;
  wrapped.directive = directive;
  wrapped.element = meta.element || null;
  wrapped.expression = expr;
  return wrapped;
}

function isCspEvalError(error) {
  const message = String(error?.message || error || '').toLowerCase();
  return (
    error?.name === 'EvalError' ||
    message.includes('unsafe-eval') ||
    message.includes('code generation from strings') ||
    message.includes('refused to evaluate a string as javascript')
  );
}

function evaluate(expr, scope, locals, meta) {
  try {
    let entry = exprCache.get(expr);
    let fn = entry?.fn;
    if (!fn) {
      fn = new Function('__s__', `with(__s__){return(${expr})}`);
      cacheExpression(expr, fn);
    } else {
      entry._lastUsed = Date.now();
    }
    return fn(createEvaluationScope(scope, locals));
  } catch (error) {
    throw createExpressionError(error, expr, meta);
  }
}

/**
 * Evaluate a statement for writing (event handlers, k-model).
 * Supports assignments like `count++` or `active = !active`.
 * Uses `with(scope)` so assignments go through the Proxy's set trap.
 *
 * @param {string} expr
 * @param {Proxy} scope
 */
function evaluateStatement(expr, scope, locals, meta) {
  const cacheKey = '$$' + expr;
  try {
    let entry = exprCache.get(cacheKey);
    let fn = entry?.fn;
    if (!fn) {
      fn = new Function('__s__', `with(__s__){${expr}}`);
      cacheExpression(cacheKey, fn);
    } else {
      entry._lastUsed = Date.now();
    }
    fn(createEvaluationScope(scope, locals));
  } catch (error) {
    throw createExpressionError(error, expr, meta);
  }
}

// ─── Directive Handlers ───────────────────────────────────────────────────────

/**
 * Parse directive modifiers from an attribute name.
 * e.g. "k-on:click.stop.prevent" → { base: "k-on", arg: "click", modifiers: ["stop","prevent"] }
 */
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

/**
 * Apply k-show directive: toggle element display.
 */
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
function handleText(el, expr, scope, disposers) {
  const dispose = effect(() => {
    el.textContent = String(evaluate(expr, scope, null, { directive: 'k-text', element: el }) ?? '');
  });
  disposers.push(dispose);
}

function handleOnce(el, expr, scope, disposers) {
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
    `${describeElement(el)} blocked dynamic attribute "${attrName}"; only whitelisted attributes may be bound dynamically.`,
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
    evaluateStatement(expr, scope, { event: e, $event: e }, {
      directive: `k-on:${eventName}`,
      element: el,
    });
    flushJobs();
    if (once) {cleanup();}
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

function warnUnknownModifiers(el, directive, modifiers, knownModifiers) {
  const unknown = modifiers.filter(modifier => !knownModifiers(modifier));
  if (unknown.length === 0) {return;}
  warn(
    'W014',
    `${describeElement(el)} has unknown ${directive} modifier(s): ${unknown.map(item => `.${item}`).join(', ')}.`,
  );
}

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
    const currentValue = evaluate(expr, scope, null, { directive: 'k-model', element: el });
    setModelExpression(expr, scope, getModelValue(el, currentValue, modifiers), el);
    flushJobs();
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
      setModelExpression(expr, scope, initialValue, el);
      flushJobs();
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

function processMountedNodes(nodes, scope, disposers, ctx, allowRootTransition = false) {
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
  for (const dispose of disposers) {
    dispose();
  }
  disposers.length = 0;
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
function handleIf(el, expr, scope, disposers, ctx) {
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

    cleanDisposers(disposersForNodes);

    if (withTransition && transitionEl) {
      let cancel = null;
      cancel = runTransition(transitionEl, 'leave', () => {
        removeMountedNodes(nodes);
        cancelLeaves = cancelLeaves.filter(item => item !== cancel);
      });
      cancelLeaves.push(cancel);
      return;
    }

    removeMountedNodes(nodes);
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
        `Invalid k-for expression "${expr}". Use "item in items", "(item, index) in items", or "(value, key) in object".`,
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

function handleFor(el, expr, scope, disposers, ctx) {
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
    cleanDisposers(childDisposers);
    removeMountedNodes(currentNodes);
    currentNodes = [];
  };

  const unmountKeyed = () => {
    for (const block of keyedBlocks.values()) {
      cleanDisposers(block.disposers);
      removeMountedNodes(block.nodes);
    }
    keyedBlocks = new Map();
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
      processMountedNodes(nodes, itemScope, childDisposers, ctx);
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
        processMountedNodes(nodes, localScope.scope, blockDisposers, ctx);
      }

      nextBlocks.set(key, block);
      insertNodesBefore(marker.parentNode, marker, block.nodes);
    }

    for (const block of staleBlocks.values()) {
      cleanDisposers(block.disposers);
      removeMountedNodes(block.nodes);
    }

    keyedBlocks = nextBlocks;
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

function validateDirectiveSyntax(el, directiveName, base, arg, modifiers) {
  if (!KNOWN_DIRECTIVES.has(base)) {
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

function hasAnyAttribute(el, names) {
  return names.some(name => el.hasAttribute(name));
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
function processElement(el, scope, disposers, ctx, allowRootTransition = false) {
  const attrs = [ ...el.attributes ];

  warnDirectiveCombinations(el);

  if (el.hasAttribute('k-for')) {
    const expr = el.getAttribute('k-for');
    if (isBlankExpression(expr)) {
      warnEmptyDirectiveExpression(el, 'k-for');
    } else {
      handleFor(el, expr, scope, disposers, ctx);
      return true;
    }
  }

  if (el.hasAttribute('k-if')) {
    const expr = el.getAttribute('k-if');
    if (isBlankExpression(expr)) {
      warnEmptyDirectiveExpression(el, 'k-if');
    } else {
      handleIf(el, expr, scope, disposers, ctx);
      return true;
    }
  }

  if (el.hasAttribute('k-else-if') || el.hasAttribute('k-else')) {
    warn(
      'W010',
      `${describeElement(el)} has k-else-if/k-else without an adjacent k-if branch.`,
    );
    return true;
  }

  if (el.hasAttribute('k-transition') && !el.hasAttribute('k-show') && !allowRootTransition) {
    warn(
      'W011',
      `${describeElement(el)} has k-transition, but it only runs with k-show or k-if.`,
    );
  }

  for (const attr of attrs) {
    const name = attr.name;
    const expr = attr.value;

    if (!isDirective(name)) {continue;}

    const full = normalizeDirective(name);
    const { base, arg, modifiers } = parseDirective(full);
    const directiveName = name.startsWith(':') || name.startsWith('@') ? name : full;

    if (!validateDirectiveSyntax(el, directiveName, base, arg, modifiers)) {continue;}

    if (base === 'k-on' && !arg) {
      warnMissingDirectiveArgument(el, directiveName, 'an event name');
      continue;
    }

    if (directiveRequiresExpression(base) && isBlankExpression(expr)) {
      warnEmptyDirectiveExpression(el, directiveName);
      continue;
    }

    switch (base) {
    case 'k-show':
      handleShow(el, expr, scope, disposers);
      break;
    case 'k-text':
      handleText(el, expr, scope, disposers);
      break;
    case 'k-html':
      handleHtml(el, expr, scope, disposers, ctx.sanitizer);
      break;
    case 'k-bind':
      handleBind(el, expr, arg, scope, disposers);
      break;
    case 'k-on':
      if (arg) {handleOn(el, expr, arg, modifiers, scope, disposers);}
      break;
    case 'k-model':
      handleModel(el, expr, scope, disposers, modifiers);
      break;
    case 'k-class':
      handleClass(el, expr, scope, disposers);
      break;
    case 'k-style':
      handleStyle(el, expr, scope, disposers);
      break;
    case 'k-init':
      evaluateStatement(expr, scope, null, { directive: 'k-init', element: el });
      flushJobs();
      break;
    case 'k-cloak':
      el.removeAttribute('k-cloak');
      break;
    case 'k-once':
      handleOnce(el, expr, scope, disposers);
      break;
    case 'k-pre':
      return true;
    case 'k-ref':
      disposers.push(addRef(ctx.refs, expr, el));
      if (ctx.appRefs && ctx.appRefs !== ctx.refs) {
        disposers.push(addRef(ctx.appRefs, expr, el));
      }
      break;
      // k-data is handled by the walker
    }
  }
  return false;
}

function getDirectDataChildren(el) {
  return [ ...el.children ].filter(child => (
    child.parentElement === el && child.hasAttribute('k-data')
  ));
}

function processNestedDataChildren(children, disposers, appRefs, sanitizer) {
  for (const child of children) {
    if (!child.parentElement || !child.hasAttribute('k-data')) {continue;}
    processDataElement(child, disposers, appRefs, sanitizer);
  }
}

function processSubtree(el, scope, disposers, ctx, allowRootTransition = false) {
  if (el.hasAttribute('k-data')) {
    processDataElement(el, disposers, ctx.appRefs, ctx.sanitizer);
    return;
  }

  const skipChildren = processElement(el, scope, disposers, ctx, allowRootTransition);
  const nestedDataChildren = skipChildren ? [] : getDirectDataChildren(el);
  if (!skipChildren) {
    walkChildren(el, scope, disposers, ctx);
    processNestedDataChildren(nestedDataChildren, disposers, ctx.appRefs, ctx.sanitizer);
  }
}

/**
 * Recursively walk children, processing directives.
 * Stops descending into nested k-data elements (they create their own scope).
 */
function walkChildren(parent, scope, disposers, ctx) {
  for (const child of [ ...parent.children ]) {
    if (child.parentElement !== parent) {continue;}
    if (child.hasAttribute('k-data')) {
      // Nested scope — handled separately
      continue;
    }
    processSubtree(child, scope, disposers, ctx);
  }
}

/**
 * Process a k-data element: create scope, process self + children.
 */
function processDataElement(el, disposers, appRefs = Object.create(null), sanitizer) {
  const expr = el.getAttribute('k-data');
  const ctx = createDomContext(el, disposers, Object.create(null), appRefs, sanitizer);
  let data = {};
  if (isBlankExpression(expr)) {
    warnEmptyDirectiveExpression(el, 'k-data');
  } else {
    try {
      data = resolveData(expr, ctx, el);
    } catch (error) {
      console.warn(error?.message || formatDiagnostic('E003', `k-data parse error: ${expr}`));
    }
  }

  const scope = createScope(data);
  ctx.scope = scope;

  // Process directives on this element (excluding k-data itself)
  const skipChildren = processElement(el, scope, disposers, ctx);
  const nestedDataChildren = skipChildren ? [] : getDirectDataChildren(el);

  // Walk children
  if (!skipChildren) {
    walkChildren(el, scope, disposers, ctx);
  }

  if (typeof scope.mounted === 'function') {
    scope.mounted(ctx);
  }

  // Handle nested k-data elements
  if (!skipChildren) {
    processNestedDataChildren(nestedDataChildren, disposers, appRefs, sanitizer);
  }

  return ctx;
}

// ─── Auto Destroy ────────────────────────────────────────────────────────────

const autoDestroyRoots = new Map();
let autoDestroyObserver = null;
const activeWalkRoots = new WeakMap();

function ensureAutoDestroyObserver() {
  if (autoDestroyObserver || typeof MutationObserver !== 'function') {return;}
  const target = document.documentElement || document.body;
  if (!target) {return;}

  autoDestroyObserver = new MutationObserver(() => {
    for (const [ root, destroy ] of [ ...autoDestroyRoots ]) {
      if (!root.isConnected) {
        destroy();
      }
    }
  });
  autoDestroyObserver.observe(target, { childList: true, subtree: true });
}

function unobserveAutoDestroyRoot(root) {
  autoDestroyRoots.delete(root);
  if (autoDestroyRoots.size === 0 && autoDestroyObserver) {
    autoDestroyObserver.disconnect();
    autoDestroyObserver = null;
  }
}

function observeAutoDestroyRoot(root, destroy) {
  if (!root || root === document || !root.isConnected) {return;}
  ensureAutoDestroyObserver();
  if (!autoDestroyObserver) {return;}
  autoDestroyRoots.set(root, destroy);
}

function warnDuplicateWalk(root) {
  if (!activeWalkRoots.has(root)) {return;}
  warn(
    'W012',
    `${describeElement(root)} is already initialized by walk(). ` +
    'Destroy the previous instance before calling walk() on the same root again.',
  );
}

function resolveWalkRoot(root) {
  if (typeof root === 'string') {
    root = document.querySelector(root);
  }
  if (!root || !root.nodeType) {
    throw new TypeError('[kupola] walk() expects an Element or selector.');
  }
  return root;
}

function resolveOptionalWalkRoot(root) {
  if (typeof root === 'string') {
    root = document.querySelector(root);
  }
  if (!root || !root.nodeType) {return null;}
  return root;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Walk a DOM tree and activate all Kupola directives.
 *
 * Finds `k-data` elements to create reactive scopes, then processes
 * `k-show`, `k-if`, `k-else-if`, `k-else`, `k-for`, `k-text`, `k-html`,
 * `k-bind`, `k-class`, `k-style`, `k-on`, `k-model`, `k-ref`,
 * `k-init`, `k-cloak` directives.
 *
 * @param {Element|string} root  Root element or selector to walk.
 * @param {{ autoDestroy?: boolean }} [options]
 * @returns {{
 *   destroy: Function, root: Element, refs: Object,
 *   $: Function, $$: Function, on: Function, watch: Function
 * }}
 *   Call destroy() to clean up all effects/listeners.
 */
export function walk(root, options = {}) {
  root = resolveWalkRoot(root);
  warnDuplicateWalk(root);
  if (options.sanitizer != null && typeof options.sanitizer !== 'function') {
    throw new TypeError('[kupola] walk() sanitizer option expects a function or null.');
  }

  walkRootCount += 1;

  /** @type {Function[]} */
  const disposers = [];
  const ctx = createDomContext(root, disposers, Object.create(null), undefined, options.sanitizer);

  try {
    if (root.hasAttribute && root.hasAttribute('k-data')) {
      processDataElement(root, disposers, ctx.refs, ctx.sanitizer);
    } else {
      // Find top-level k-data elements within root
      const dataElements = root.querySelectorAll
        ? root.querySelectorAll('[k-data]')
        : [];

      if (dataElements.length > 0) {
        // Check if any data element is a direct child — process it
        // For elements nested inside non-data parents, process them
        for (const el of dataElements) {
          // Only process if no ancestor (up to root) owns this subtree.
          // Nested scopes and dynamic directive fragments are handled by
          // their parent processDataElement/handleIf/handleFor path.
          let isNested = false;
          let parent = el.parentElement;
          while (parent && parent !== root) {
            if (
              parent.hasAttribute('k-data') ||
              parent.hasAttribute('k-if') ||
              parent.hasAttribute('k-else-if') ||
              parent.hasAttribute('k-else') ||
              parent.hasAttribute('k-for')
            ) {
              isNested = true;
              break;
            }
            parent = parent.parentElement;
          }
          if (!isNested) {
            processDataElement(el, disposers, ctx.refs, ctx.sanitizer);
          }
        }
      } else {
        // No k-data found — process directives on all children with empty scope
        const scope = createScope({});
        ctx.scope = scope;
        for (const child of [ ...root.children ]) {
          if (child.parentElement !== root) {continue;}
          processSubtree(child, scope, disposers, ctx);
        }
      }
    }
  } catch (error) {
    cleanDisposers(disposers);
    throw error;
  }

  let active = true;
  const result = {
    root,
    refs: ctx.refs,
    $: ctx.$,
    $$: ctx.$$,
    on: ctx.on,
    watch: ctx.watch,
    destroy() {
      if (!active) {return;}
      active = false;
      walkRootCount -= 1;
      activeWalkRoots.delete(root);
      unobserveAutoDestroyRoot(root);
      for (const dispose of disposers) {
        dispose();
      }
      disposers.length = 0;
    },
  };

  activeWalkRoots.set(root, result);

  if (options.autoDestroy) {
    observeAutoDestroyRoot(root, result.destroy);
  }

  return result;
}

/**
 * Walk a DOM tree and automatically destroy the instance when the root is removed.
 *
 * @param {Element|string} root  Root element or selector to walk.
 * @returns {ReturnType<typeof walk>}
 */
export function walkAuto(root, options = {}) {
  return walk(root, { ...options, autoDestroy: true });
}

/**
 * Return the existing walk instance for a root, or create one if needed.
 *
 * @param {Element|string} root  Root element or selector to walk.
 * @param {{ autoDestroy?: boolean }} [options]
 * @returns {ReturnType<typeof walk>}
 */
export function walkOnce(root, options = {}) {
  root = resolveWalkRoot(root);
  return activeWalkRoots.get(root) || walk(root, options);
}

/**
 * Get the active walk instance for a root.
 *
 * @param {Element|string} root  Root element or selector to inspect.
 * @returns {ReturnType<typeof walk>|null}
 */
export function getWalk(root) {
  root = resolveOptionalWalkRoot(root);
  return root ? activeWalkRoots.get(root) || null : null;
}

/**
 * Check whether a root has an active walk instance.
 *
 * @param {Element|string} root  Root element or selector to inspect.
 * @returns {boolean}
 */
export function hasWalk(root) {
  return Boolean(getWalk(root));
}

/**
 * Destroy the active walk instance for a root if one exists.
 *
 * @param {Element|string} root  Root element or selector to destroy.
 * @returns {boolean}
 */
export function destroyWalk(root) {
  const instance = getWalk(root);
  if (!instance) {return false;}
  instance.destroy();
  return true;
}
