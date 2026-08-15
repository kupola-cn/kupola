// SPDX-License-Identifier: MIT
/**
 * @kupola/platform — defineStore: high-level state organization.
 *
 * `defineStore` wraps a factory function that returns an arbitrary nested
 * object containing signals, computeds, and methods. The returned proxy:
 *
 *  - Preserves Signal identity at any nesting depth
 *  - Provides `$reset()` to restore all signals to their initial values
 *  - Provides `$dispose()` to clean up effects created inside the factory
 *    (signals remain readable/writable after dispose, but effects are stopped)
 *  - Recursively proxies nested objects so signals work at any depth
 *  - Proxies are cached via WeakMap, so repeated access to the same
 *    nested object returns the same proxy
 *
 * @module store
 */

import { signal, computed, effect, watch, effectScope } from '@kupola/core';
import { isSignalLike } from './render.js';

/** @internal Walk a nested object tree, collecting all Signal instances. */
function collectSignals(obj, visited, signals, initialValues) {
  if (!obj || typeof obj !== 'object' || visited.has(obj)) {return;}
  visited.add(obj);

  if (isSignalLike(obj)) {
    signals.push(obj);
    initialValues.set(obj, obj.peek());
    return;
  }

  const keys = Array.isArray(obj)
    ? Array.from({ length: obj.length }, (_, i) => i)
    : Object.keys(obj);
  for (const key of keys) {
    collectSignals(obj[key], visited, signals, initialValues);
  }
}

/** @internal Check if a signal-like object has a writable value (not read-only computed). */
function hasWritableValue(obj) {
  let proto = obj;
  while (proto) {
    const desc = Object.getOwnPropertyDescriptor(proto, 'value');
    if (desc) {return typeof desc.set === 'function';}
    proto = Object.getPrototypeOf(proto);
  }
  return false;
}

/**
 * @internal Create a recursive proxy that preserves Signal identity.
 *
 * @param {object} target - The raw object to proxy
 * @param {Array<Signal>} allSignals - All collected Signal instances
 * @param {Map<Signal, any>} initialValues - Initial values for $reset
 * @param {import('@kupola/core').EffectScope} scope - Effect scope for $dispose
 * @returns {Proxy}
 */
function createStoreProxy(target, allSignals, initialValues, scope) {
  const proxyCache = new WeakMap();

  function wrap(obj) {
    if (!obj || typeof obj !== 'object') {return obj;}
    const cached = proxyCache.get(obj);
    if (cached) {return cached;}
    const proxy = new Proxy(obj, {
      get(target, prop, receiver) {
      // ── $reset / $dispose ──
        if (prop === '$reset') {
          return () => {
            for (const s of allSignals) {
            // Skip read-only signals (computed) — they recalculate from dependencies
              if (!hasWritableValue(s)) {continue;}
              s.value = initialValues.get(s);
            }
          };
        }
        if (prop === '$dispose') {
          return () => scope.stop();
        }

        const value = Reflect.get(target, prop, receiver);

        // Signals pass through unchanged — template system detects them natively
        if (isSignalLike(value)) {return value;}

        // Functions are bound to the proxy so `this` works inside methods
        if (typeof value === 'function') {return value.bind(receiver);}

        // Nested objects get their own proxy, sharing the same signal registry
        if (value && typeof value === 'object') {
          return wrap(value);
        }

        return value;
      },

      set(target, prop, value, receiver) {
        return Reflect.set(target, prop, value, receiver);
      },

      ownKeys(target) {
        return Reflect.ownKeys(target);
      },

      getOwnPropertyDescriptor(target, prop) {
        return Reflect.getOwnPropertyDescriptor(target, prop);
      },
    });
    proxyCache.set(obj, proxy);
    return proxy;
  }

  return wrap(target);
}

/**
 * Create a store proxy from a factory function.
 *
 * The factory receives `{ signal, computed, effect, watch }` so it doesn't need to import
 * them separately. It returns an arbitrary nested object. The proxy:
 *
 *  - Preserves Signal identity at any nesting depth
 *  - Provides `$reset()` to restore all signals to initial values
 *  - Provides `$dispose()` to clean up an internal effect scope
 *
 * @template T
 * @param {Function} factory - ({ signal, computed }) => T
 * @returns {T & { $reset(): void, $dispose(): void }}
 *
 * @example
 * const store = defineStore(({ signal, computed }) => ({
 *   filters: {
 *     shift: signal('all'),
 *     status: signal('all'),
 *   },
 *   items: computed(() => [ ... ]),
 *   reset() {
 *     this.$reset();
 *   },
 * }));
 *
 * // Template: ${store.filters.shift} — Signal, auto-subscribes
 * // JS: store.filters.shift.value = 'morning'
 * // Reset: store.$reset()
 */
export function defineStore(factory) {
  if (typeof factory !== 'function') {
    throw new TypeError('[kupola] defineStore() expects a function.');
  }

  const scope = effectScope();
  let raw;

  scope.run(() => {
    raw = factory({ signal, computed, effect, watch });
  });

  if (!raw || typeof raw !== 'object') {
    throw new TypeError('[kupola] defineStore() factory must return an object.');
  }

  const allSignals = [];
  const initialValues = new Map();

  collectSignals(raw, new Set(), allSignals, initialValues);

  return createStoreProxy(raw, allSignals, initialValues, scope);
}
