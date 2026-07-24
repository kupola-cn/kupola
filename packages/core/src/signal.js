// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Signal: the fundamental reactive primitive.
 *
 * A signal holds a value and notifies subscribers when it changes.
 * Reading `.value` inside an active effect/computed registers a dependency;
 * writing `.value` triggers all registered dependents.
 *
 * @module signal
 */

import { queueJob } from './scheduler.js';
import {
  isProfilerEnabled,
  profileSignalWrite,
  profileSignalRead,
} from './devtools.js';

// ─── Global dependency-tracking state ────────────────────────────────────────

/** @type {import('./effect.js').EffectRecord|null} Currently executing effect. */
export let activeEffect = null;

/** @type {import('./effect.js').EffectRecord[]} Stack for nested effect scopes. */
export const effectStack = [];

/**
 * Push an effect onto the stack and make it the active effect.
 * @param {import('./effect.js').EffectRecord} eff
 */
export function pushEffect(eff) {
  effectStack.push(activeEffect);
  activeEffect = eff;
}

/**
 * Pop the effect stack, restoring the previous active effect.
 */
export function popEffect() {
  activeEffect = effectStack.pop() ?? null;
}

/**
 * Run a function without collecting reactive dependencies.
 * @param {Function} fn
 * @returns {any}
 */
export function withoutTracking(fn) {
  const previous = activeEffect;
  activeEffect = null;
  try {
    return fn();
  } finally {
    activeEffect = previous;
  }
}

// ─── Batch-awareness flag (set by batch.js) ─────────────────────────────────

/** @type {number} Nesting depth of batch() calls. 0 = not batching. */
export let batchDepth = 0;

/** @type {Set<Function>} Effects deferred by an active batch. */
export const batchQueue = new Set();

/** @internal Called by batch.js — not part of public API. */
export function setBatchDepth(d) { batchDepth = d; }
export function getBatchQueue() { return batchQueue; }

// ─── Track / Trigger ─────────────────────────────────────────────────────────

/**
 * Register the active effect as a dependent of `signal`.
 * Called automatically when `signal.value` is read inside an effect.
 * @param {Signal} sig
 */
export function track(sig) {
  if (activeEffect) {
    sig._subscribers.add(activeEffect);
    activeEffect._deps.add(sig);
  }
}

/**
 * Notify all subscribers of `signal` that its value changed.
 *
 * Subscribers with `_sync = true` (computed trackers) are notified immediately
 * and synchronously. Regular effect subscribers are queued via the scheduler
 * (or batch queue if inside a batch).
 *
 * @param {Signal} sig
 */
export function trigger(sig) {
  for (const eff of sig._subscribers) {
    if (eff._sync) {
      // Synchronous subscriber (computed) — runs immediately.
      eff._run();
    } else if (batchDepth > 0) {
      batchQueue.add(eff._run);
    } else {
      queueJob(eff._run);
    }
  }
}

// ─── Signal class ────────────────────────────────────────────────────────────

/**
 * @template T
 */
export class Signal {
  /**
   * @param {T} initialValue
   */
  constructor(initialValue) {
    /** @internal */ this._value = initialValue;
    /** @internal */ this._subscribers = new Set();
  }

  /**
   * Read the current value. Registers a dependency if called inside an effect.
   * @returns {T}
   */
  get value() {
    track(this);
    if (isProfilerEnabled()) {profileSignalRead(this);}
    return this._value;
  }

  /**
   * Update the value. Triggers subscribers only when the value actually changes.
   * @param {T} newValue
   */
  set value(newValue) {
    if (!Object.is(this._value, newValue)) {
      this._value = newValue;
      if (isProfilerEnabled()) {profileSignalWrite(this);}
      trigger(this);
    }
  }

  /**
   * Peek at the value without registering a dependency.
   * @returns {T}
   */
  peek() {
    return this._value;
  }

  /** @returns {string} */
  toString() {
    return String(this._value);
  }

  /** @returns {string} */
  toJSON() {
    return JSON.stringify(this._value);
  }
}

// ─── Public factory ──────────────────────────────────────────────────────────

/**
 * Create a reactive signal.
 *
 * ```js
 * const count = signal(0);
 * count.value;      // read  → tracks dependency
 * count.value = 1;  // write → triggers subscribers
 * count.peek();     // read  → no tracking
 * ```
 *
 * @template T
 * @param {T} initialValue
 * @returns {Signal<T>}
 */
export function signal(initialValue) {
  return new Signal(initialValue);
}

const REACTIVE_SYMBOL = Symbol('kupola-reactive');
const ARRAY_MUTATION_METHODS = new Set([
  'push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse',
]);

export function isReactive(obj) {
  return obj && obj[REACTIVE_SYMBOL] === true;
}

function shallowClone(obj) {
  if (Array.isArray(obj)) {return [ ...obj ];}
  const clone = Object.create(Object.getPrototypeOf(obj));
  for (const key of Object.getOwnPropertyNames(obj)) {
    const desc = Object.getOwnPropertyDescriptor(obj, key);
    Object.defineProperty(clone, key, desc);
  }
  for (const key of Object.getOwnPropertySymbols(obj)) {
    const desc = Object.getOwnPropertyDescriptor(obj, key);
    Object.defineProperty(clone, key, desc);
  }
  return clone;
}

function wrapReactive(obj, parentSignal, visited = new WeakSet(), proxyCache = new Map()) {
  if (!obj || typeof obj !== 'object') {return obj;}
  if (isReactive(obj)) {return obj;}
  if (obj instanceof Signal) {return obj;}
  if (obj instanceof Date || obj instanceof RegExp || obj instanceof Error) {return obj;}
  if (proxyCache.has(obj)) {return proxyCache.get(obj);}
  if (visited.has(obj)) {return obj;}

  visited.add(obj);
  const reactiveObj = new Proxy(shallowClone(obj), createReactiveHandler(parentSignal, visited, proxyCache));
  proxyCache.set(obj, reactiveObj);

  reactiveObj[REACTIVE_SYMBOL] = true;

  const keys = [ ...Object.keys(obj), ...Object.getOwnPropertySymbols(obj) ];
  for (const key of keys) {
    const desc = Object.getOwnPropertyDescriptor(obj, key);
    if (desc && !desc.get && !desc.set) {
      reactiveObj[key] = wrapReactive(obj[key], parentSignal, visited, proxyCache);
    }
  }

  visited.delete(obj);

  return reactiveObj;
}

function notifyParent(parentSignal, target) {
  if (!parentSignal) {return;}
  const newValue = shallowClone(target);
  if (!Object.is(parentSignal._value, newValue)) {
    parentSignal.value = newValue;
  }
}

function createReactiveHandler(parentSignal, visited, proxyCache) {
  return {
    get(target, key, receiver) {
      if (key === REACTIVE_SYMBOL) {return true;}
      if (key === 'toJSON') {return () => target;}
      if (key === '_signal') {return parentSignal;}
      track(parentSignal);
      if (typeof target[key] === 'function') {
        if (ARRAY_MUTATION_METHODS.has(key)) {
          return function(...args) {
            const result = target[key](...args);
            notifyParent(parentSignal, target);
            return result;
          };
        }
        return target[key].bind(receiver);
      }
      const value = Reflect.get(target, key, receiver);
      if (value && typeof value === 'object' && !isReactive(value) && !(value instanceof Date) && !(value instanceof RegExp)) {
        const wrapped = wrapReactive(value, parentSignal, visited, proxyCache);
        target[key] = wrapped;
        return wrapped;
      }
      return value;
    },
    set(target, key, value, receiver) {
      if (key === REACTIVE_SYMBOL) {return true;}
      const oldValue = target[key];
      value = wrapReactive(value, parentSignal, visited, proxyCache);
      const result = Reflect.set(target, key, value, receiver);
      if (!Object.is(oldValue, value)) {
        notifyParent(parentSignal, target);
      }
      return result;
    },
    deleteProperty(target, key) {
      const hadKey = key in target;
      const result = Reflect.deleteProperty(target, key);
      if (hadKey) {
        notifyParent(parentSignal, target);
      }
      return result;
    },
    has(target, key) {
      track(parentSignal);
      return Reflect.has(target, key);
    },
    ownKeys(target) {
      track(parentSignal);
      return Reflect.ownKeys(target);
    },
    getOwnPropertyDescriptor(target, key) {
      track(parentSignal);
      return Reflect.getOwnPropertyDescriptor(target, key);
    },
  };
}

export function reactive(obj) {
  if (!obj || typeof obj !== 'object') {return obj;}
  const sig = new Signal(obj);
  const reactiveObj = wrapReactive(obj, sig);
  Object.defineProperty(reactiveObj, '_signal', { value: sig, enumerable: false });
  Object.defineProperty(reactiveObj, 'dispose', {
    value: () => {
      sig._subscribers.clear();
    },
    enumerable: false,
  });
  return reactiveObj;
}
