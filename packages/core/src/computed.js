// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Computed: lazy derived signal.
 *
 * A computed signal re-evaluates its function only when one of its tracked
 * dependencies changes, and caches the result until then.
 *
 * @module computed
 */

import { Signal, track, trigger, pushEffect, popEffect } from './signal.js';

/**
 * Create a computed (derived) signal.
 *
 * ```js
 * const firstName = signal('Jane');
 * const lastName  = signal('Doe');
 * const fullName  = computed(() => `${firstName.value} ${lastName.value}`);
 *
 * fullName.value; // "Jane Doe"  (computed on first read)
 * firstName.value = 'John';
 * fullName.value; // "John Doe"  (recomputed because dep changed)
 * ```
 *
 * @template T
 * @param {() => T} fn  Computation function. All signal reads inside are tracked.
 * @returns {{ readonly value: T, peek: () => T }}
 */
export function computed(fn) {
  /** @type {Signal<T>} Underlying signal that holds the cached result. */
  const sig = new Signal(undefined);

  /** @type {boolean} Whether the cached value is stale. */
  let dirty = true;

  /** @type {Set<Signal>} Signals this computed depends on. */
  let deps = new Set();

  /**
   * Internal tracking record for dependency collection.
   * Marked `_sync = true` so trigger() calls it synchronously (not via scheduler).
   */
  const tracker = {
    _fn: null,
    _deps: deps,
    _sync: true,
    _run: null,
    _disposed: false,
  };

  // Synchronous callback: when a dep changes, mark dirty and propagate.
  tracker._run = () => {
    if (!dirty) {
      dirty = true;
      // Propagate to downstream effects/computed that subscribe to `sig`.
      trigger(sig);
    }
  };

  /**
   * Re-evaluate the computation and cache the result.
   */
  function recompute() {
    // Unsubscribe from old deps.
    for (const d of deps) {
      d._subscribers.delete(tracker);
    }
    deps.clear();
    tracker._deps = deps;

    pushEffect(tracker);
    try {
      const result = fn();
      if (!Object.is(sig._value, result)) {
        sig._value = result;
      }
    } finally {
      popEffect();
    }

    dirty = false;
  }

  // Return a read-only signal-like object.
  return {
    /**
     * Read the computed value. Recomputes if dirty.
     * Also registers a dependency if read inside another effect/computed.
     */
    get value() {
      if (dirty) {
        recompute();
      }
      track(sig);
      return sig._value;
    },

    /**
     * Peek at the value without registering a dependency.
     * Still recomputes if dirty.
     */
    peek() {
      if (dirty) {
        recompute();
      }
      return sig._value;
    },

    toString() {
      return String(this.value);
    },

    toJSON() {
      return JSON.stringify(this.value);
    },
  };
}
