// SPDX-License-Identifier: MIT
/**
 * Directive scope system: named scope registry, reactive scope creation, the
 * DOM context helper (with $/$$/on/watch/update/patch), and ref bookkeeping.
 *
 * @module directives/scope
 */

import { effect, getCurrentScheduler, signal, withoutTracking } from '@kupola/core';

export const scopeRegistry = new Map();

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
  return safePattern.test(name) &&
    !name.includes('__proto__') &&
    !name.includes('constructor') &&
    !name.includes('prototype');
}

function createDomContext(
  root,
  disposers,
  refs = Object.create(null),
  appRefs = refs,
  sanitizer,
  scopedDirectives = null,
) {
  const queryRoot = root && root.querySelector ? root : document;
  const scheduler = getCurrentScheduler();

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
    }, { scheduler: options.scheduler !== undefined ? options.scheduler : scheduler });

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
    customDirectives: scopedDirectives,
    scheduler,
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


export {
  addRef,
  createDomContext,
  createScope,
  instantiateScopeDefinition,
  isPrototypeKey,
  isSafeScopePropertyName,
};
