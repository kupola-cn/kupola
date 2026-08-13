// SPDX-License-Identifier: MIT
/* global __DEV__ */
/**
 * @kupola/core - Effects, lifecycle scopes, and watch.
 *
 * @module effect
 */

import { pushEffect, popEffect, unsubscribe, withoutTracking } from './signal.js';
import { isProfilerEnabled, profileEffectRun } from './devtools.js';
import { getCurrentScheduler, runWithScheduler } from './scheduler.js';

const profilerInstrumentationEnabled = typeof __DEV__ === 'undefined' || __DEV__;

/**
 * @typedef {Object} EffectRecord
 * @property {Function} _fn
 * @property {Set<import('./signal.js').Signal>} _deps
 * @property {Function} _run
 * @property {boolean} _disposed
 * @property {boolean} _running
 * @property {Function|null} _cleanup
 * @property {Function|null} _onDispose
 * @property {EffectScope|null} _scope
 * @property {'sync'|'pre'|'post'} _flush
 * @property {boolean} _sync
 * @property {Object|null} _scheduler
 */

/**
 * @typedef {Object} EffectScope
 * @property {Set<EffectRecord>} _effects
 * @property {boolean} _active
 * @property {EffectScope|null} _parent
 * @property {Set<EffectScope>} _children
 * @property {Set<Function>} _cleanups
 * @property {(fn: Function) => any} run
 * @property {() => void} stop
 */

/** @type {EffectScope|null} */
let activeScope = null;

/**
 * Create an explicit lifecycle scope for a group of effects.
 * Effects are not implicitly parented to whichever effect happens to be
 * executing; this keeps dynamic rendering code from losing reusable child
 * effects during a parent rerender.
 */
export function effectScope() {
  const parent = activeScope && activeScope._active ? activeScope : null;
  /** @type {EffectScope} */
  const scope = {
    _effects: new Set(),
    _active: true,
    _parent: parent,
    _children: new Set(),
    _cleanups: new Set(),
    run(fn) {
      if (!scope._active) {
        throw new Error('[kupola] Cannot run a stopped effect scope.');
      }
      if (typeof fn !== 'function') {
        throw new TypeError('[kupola] effectScope.run() expects a function.');
      }
      const previous = activeScope;
      activeScope = scope;
      try {
        return fn();
      } finally {
        activeScope = previous;
      }
    },
    stop() {
      if (!scope._active) {return;}
      scope._active = false;
      let firstError;
      let hasError = false;

      for (const child of [ ...scope._children ]) {
        try {
          child.stop();
        } catch (error) {
          if (!hasError) {firstError = error; hasError = true;}
        }
      }
      for (const eff of [ ...scope._effects ]) {
        try {
          dispose(eff);
        } catch (error) {
          if (!hasError) {firstError = error; hasError = true;}
        }
      }
      for (const cleanup of [ ...scope._cleanups ]) {
        try {
          withoutTracking(cleanup);
        } catch (error) {
          if (!hasError) {firstError = error; hasError = true;}
        }
      }

      scope._children.clear();
      scope._effects.clear();
      scope._cleanups.clear();
      if (scope._parent) {scope._parent._children.delete(scope);}
      scope._parent = null;
      if (hasError) {throw firstError;}
    },
  };

  if (parent) {parent._children.add(scope);}
  return scope;
}

/**
 * Register a generic resource cleanup in the currently running scope.
 * Returns null when called outside a scope; this internal form lets computed
 * remain usable as a standalone primitive.
 *
 * @param {Function} cleanup
 * @returns {(() => void)|null}
 */
export function registerScopeCleanup(cleanup) {
  if (typeof cleanup !== 'function') {
    throw new TypeError('[kupola] registerScopeCleanup() expects a function.');
  }
  if (!activeScope || !activeScope._active) {return null;}
  const scope = activeScope;
  scope._cleanups.add(cleanup);
  return () => scope._cleanups.delete(cleanup);
}

/** Register a cleanup and require an active effect scope. */
export function onScopeDispose(cleanup) {
  if (!activeScope || !activeScope._active) {
    throw new Error('[kupola] onScopeDispose() must be called inside effectScope.run().');
  }
  return registerScopeCleanup(cleanup);
}

/**
 * Create a reactive effect. The function runs immediately and is scheduled
 * for later runs through the core scheduler.
 *
 * @param {Function} fn
 * @returns {Function}
 */
export function effect(fn, options = {}) {
  if (typeof fn !== 'function') {
    throw new TypeError('[kupola] effect() expects a function.');
  }

  const scope = activeScope && activeScope._active ? activeScope : null;
  const onDispose = options && typeof options.onDispose === 'function' ? options.onDispose : null;
  const onInvalidate = options && typeof options.onInvalidate === 'function' ? options.onInvalidate : null;
  const flush = options && options.flush !== undefined ? options.flush : 'pre';
  if (flush !== 'sync' && flush !== 'pre' && flush !== 'post') {
    throw new TypeError('[kupola] effect() flush must be sync, pre, or post.');
  }
  const scheduler = options && options.scheduler !== undefined
    ? options.scheduler
    : getCurrentScheduler();
  if (scheduler !== null && scheduler !== undefined
    && (typeof scheduler.queueJob !== 'function'
    || typeof scheduler.queuePostJob !== 'function')) {
    throw new TypeError('[kupola] effect() scheduler must provide queueJob() and queuePostJob().');
  }
  /** @type {EffectRecord} */
  const eff = {
    _fn: fn,
    _deps: new Set(),
    _run: null,
    _disposed: false,
    _running: false,
    _cleanup: null,
    _onDispose: onDispose,
    _onInvalidate: onInvalidate,
    _firstRun: true,
    _scope: scope,
    _flush: flush,
    _sync: flush === 'sync',
    _scheduler: scheduler,
  };
  if (scope) {scope._effects.add(eff);}

  eff._run = () => {
    if (!eff._disposed && !eff._running) {runEffect(eff);}
  };
  eff._run._flush = flush;
  eff._run._scheduler = scheduler;

  try {
    runEffect(eff);
  } catch (error) {
    try {
      dispose(eff);
    } catch {
      // Preserve the original error from the user effect.
    }
    throw error;
  }

  return () => dispose(eff);
}

function runEffect(eff) {
  if (eff._disposed || eff._running) {return;}
  eff._running = true;
  try {
    if (eff._onInvalidate && !eff._firstRun) {
      try { eff._onInvalidate(); } catch { /* swallow onInvalidate errors */ }
    }
    cleanupDeps(eff);
    const cleanupResult = runCleanup(eff);

    pushEffect(eff);
    let result;
    let effectError;
    let effectFailed = false;
    try {
      result = runWithScheduler(eff._scheduler, () => (
        profilerInstrumentationEnabled && isProfilerEnabled()
          ? profileEffectRun(eff, eff._fn)
          : eff._fn()
      ));
    } catch (error) {
      effectError = error;
      effectFailed = true;
    } finally {
      popEffect();
    }

    eff._cleanup = typeof result === 'function' ? result : null;
    eff._firstRun = false;
    if (effectFailed) {throw effectError;}
    if (cleanupResult.failed) {throw cleanupResult.error;}
  } finally {
    eff._running = false;
  }
}

/** @param {EffectRecord} eff */
function cleanupDeps(eff) {
  for (const sig of eff._deps) {
    unsubscribe(sig, eff);
  }
  eff._deps.clear();
}

/** @param {EffectRecord} eff */
function runCleanup(eff) {
  const cleanup = eff._cleanup;
  eff._cleanup = null;
  if (typeof cleanup !== 'function') {return { failed: false, error: undefined };}
  try {
    withoutTracking(cleanup);
    return { failed: false, error: undefined };
  } catch (error) {
    return { failed: true, error };
  }
}

/** @param {EffectRecord} eff */
function dispose(eff) {
  if (eff._disposed) {return;}
  eff._disposed = true;
  cleanupDeps(eff);
  const cleanupResult = runCleanup(eff);
  let disposeResult = { failed: false, error: undefined };
  if (eff._onDispose) {
    try {
      withoutTracking(eff._onDispose);
    } catch (error) {
      disposeResult = { failed: true, error };
    }
    eff._onDispose = null;
  }
  if (eff._scope) {
    eff._scope._effects.delete(eff);
    eff._scope = null;
  }
  if (cleanupResult.failed) {throw cleanupResult.error;}
  if (disposeResult.failed) {throw disposeResult.error;}
}

/**
 * Watch a getter and invoke a callback when its result changes.
 *
 * @param {Function} getter
 * @param {Function} callback
 * @param {Object} options
 * @returns {Function}
 */
export function watch(getter, callback, options = {}) {
  if (typeof getter !== 'function' || typeof callback !== 'function') {
    throw new TypeError('[kupola] watch() expects a getter and callback.');
  }
  if (options === null || typeof options !== 'object' || Array.isArray(options)) {
    throw new TypeError('[kupola] watch() options must be an object.');
  }
  const { immediate = false, deep = false, flush = 'pre' } = options;
  // An omitted scheduler inherits the current app context. An explicit null
  // intentionally opts into the shared default scheduler.
  const scheduler = Object.prototype.hasOwnProperty.call(options, 'scheduler')
    ? options.scheduler
    : undefined;
  let oldValue;
  let initialized = false;
  let callbackCleanup = null;
  let activeCallbackToken = null;

  const runCallbackCleanup = () => {
    const cleanup = callbackCleanup;
    callbackCleanup = null;
    if (typeof cleanup !== 'function') {return { failed: false, error: undefined };}
    try {
      withoutTracking(cleanup);
      return { failed: false, error: undefined };
    } catch (error) {
      return { failed: true, error };
    }
  };

  const runCallback = (newValue, previous) => {
    const cleanupResult = runCallbackCleanup();
    const callbackToken = {};
    activeCallbackToken = callbackToken;
    const onCleanup = cleanup => {
      if (typeof cleanup !== 'function') {
        throw new TypeError('[kupola] watch onCleanup() expects a function.');
      }
      if (activeCallbackToken === callbackToken) {callbackCleanup = cleanup;}
    };
    let result;
    let callbackError;
    let callbackFailed = false;
    try {
      result = withoutTracking(() => callback(newValue, previous, onCleanup));
    } catch (error) {
      callbackError = error;
      callbackFailed = true;
    }
    activeCallbackToken = null;
    if (typeof result === 'function') {callbackCleanup = result;}
    if (callbackFailed) {throw callbackError;}
    if (cleanupResult.failed) {throw cleanupResult.error;}
  };

  const stop = effect(() => {
    const newValue = getter();
    if (!initialized) {
      initialized = true;
      oldValue = deep ? cloneValue(newValue) : newValue;
      if (immediate) {runCallback(newValue, undefined);}
      return;
    }

    const changed = deep
      ? !areDeepEqual(oldValue, newValue)
      : !Object.is(oldValue, newValue);
    if (!changed) {return;}

    const previous = oldValue;
    oldValue = deep ? cloneValue(newValue) : newValue;
    runCallback(newValue, previous);
  }, { onDispose: () => {
    const cleanupResult = runCallbackCleanup();
    if (cleanupResult.failed) {throw cleanupResult.error;}
  }, flush, scheduler });

  return stop;
}

function cloneValue(value, seen = new WeakMap()) {
  if (value === null || typeof value !== 'object') {return value;}
  if (seen.has(value)) {return seen.get(value);}
  if (value instanceof Date) {return new Date(value.getTime());}
  if (value instanceof RegExp) {return new RegExp(value.source, value.flags);}
  if (value instanceof Map) {
    const clone = new Map();
    seen.set(value, clone);
    for (const [ key, entry ] of value) {
      clone.set(cloneValue(key, seen), cloneValue(entry, seen));
    }
    return clone;
  }
  if (value instanceof Set) {
    const clone = new Set();
    seen.set(value, clone);
    for (const entry of value) {clone.add(cloneValue(entry, seen));}
    return clone;
  }
  if (Array.isArray(value)) {
    const clone = [];
    seen.set(value, clone);
    for (const key of Reflect.ownKeys(value)) {
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!descriptor) {continue;}
      if ('value' in descriptor && key === 'length') {
        // The descriptor itself is obtained from the raw target. Read the
        // proxy value as well so length-only changes remain observable.
        descriptor.value = value.length;
      } else if ('value' in descriptor) {
        // Read through the proxy so custom array keys and nested values stay
        // part of the deep-watch dependency graph.
        descriptor.value = cloneValue(value[key], seen);
      }
      try {
        Object.defineProperty(clone, key, descriptor);
      } catch {
        // Ignore host properties that cannot be represented in a snapshot.
      }
    }
    return clone;
  }
  const clone = Object.create(Object.getPrototypeOf(value));
  seen.set(value, clone);
  for (const key of Reflect.ownKeys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (descriptor && 'value' in descriptor) {
      // Read through the proxy instead of cloning the descriptor's raw value;
      // this is what makes deep watch subscribe to nested reactive keys.
      descriptor.value = cloneValue(value[key], seen);
    }
    try {
      Object.defineProperty(clone, key, descriptor);
    } catch {
      // Ignore host properties that cannot be represented in a snapshot.
    }
  }
  return clone;
}

function areDeepEqual(a, b, seen = new WeakMap()) {
  if (a === b) {return true;}
  if (typeof a !== 'object' || typeof b !== 'object') {return false;}
  if (a === null || b === null) {return a === b;}
  if (seen.has(a)) {return seen.get(a) === b;}
  seen.set(a, b);
  if (a instanceof Date || b instanceof Date) {
    return a instanceof Date && b instanceof Date && a.getTime() === b.getTime();
  }
  if (a instanceof RegExp || b instanceof RegExp) {
    return a instanceof RegExp && b instanceof RegExp && String(a) === String(b);
  }
  if (a instanceof Map || b instanceof Map) {
    if (!(a instanceof Map) || !(b instanceof Map) || a.size !== b.size) {return false;}
    const candidates = [ ...b ];
    const matched = new Set();
    for (const [ key, value ] of a) {
      let found = false;
      for (let index = 0; index < candidates.length; index++) {
        if (matched.has(index)) {continue;}
        const [ candidateKey, candidateValue ] = candidates[index];
        const candidateSeen = new WeakMap([ [ a, b ] ]);
        if (areDeepEqual(key, candidateKey, candidateSeen)
          && areDeepEqual(value, candidateValue, candidateSeen)) {
          matched.add(index);
          found = true;
          break;
        }
      }
      if (!found) {return false;}
    }
    return true;
  }
  if (a instanceof Set || b instanceof Set) {
    if (!(a instanceof Set) || !(b instanceof Set) || a.size !== b.size) {return false;}
    const candidates = [ ...b ];
    const matched = new Set();
    for (const value of a) {
      let found = false;
      for (let index = 0; index < candidates.length; index++) {
        if (matched.has(index)) {continue;}
        const candidateSeen = new WeakMap([ [ a, b ] ]);
        if (areDeepEqual(value, candidates[index], candidateSeen)) {
          matched.add(index);
          found = true;
          break;
        }
      }
      if (!found) {return false;}
    }
    return true;
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    const keysA = Reflect.ownKeys(a);
    const keysB = Reflect.ownKeys(b);
    if (keysA.length !== keysB.length) {return false;}
    return keysA.every(key => Object.prototype.hasOwnProperty.call(b, key)
      && areDeepEqual(a[key], b[key], seen));
  }
  if (Array.isArray(a) || Array.isArray(b)) {return false;}
  const keysA = Reflect.ownKeys(a);
  const keysB = Reflect.ownKeys(b);
  if (keysA.length !== keysB.length) {return false;}
  return keysA.every(key => Object.prototype.hasOwnProperty.call(b, key)
    && areDeepEqual(a[key], b[key], seen));
}
