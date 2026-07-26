// SPDX-License-Identifier: MIT
/* global __DEV__ */
/**
 * @kupola/core — Computed: lazy derived signal.
 *
 * A computed signal re-evaluates its function only when one of its tracked
 * dependencies changes, and caches the result until then.
 *
 * @module computed
 */

import {
  Signal,
  track,
  trigger,
  getTriggerContext,
  pushEffect,
  popEffect,
  unsubscribe,
} from './signal.js';
import { isProfilerEnabled, profileComputedRun } from './devtools.js';
import { registerScopeCleanup } from './effect.js';

const profilerInstrumentationEnabled = typeof __DEV__ === 'undefined' || __DEV__;

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
 * @returns {{ readonly value: T, peek: () => T, dispose: () => void }}
 */
export function computed(fn) {
  if (typeof fn !== 'function') {
    throw new TypeError('[kupola] computed() expects a function.');
  }

  /** @type {Signal<T>} Underlying signal that holds the cached result. */
  const sig = new Signal(undefined);

  /** @type {boolean} Whether the cached value is stale. */
  let dirty = true;

  /** @type {Set<Signal>} Signals this computed depends on. */
  let deps = new Set();
  let computing = false;

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
    _isComputed: true,
  };

  // Invalidate synchronously. If there are consumers, recompute now so a
  // downstream effect is notified only when the derived value changed.
  tracker._run = () => {
    if (tracker._disposed) {return;}
    // A failed recomputation leaves the value dirty. Consumers still need a
    // later source change to retry it; only unobserved computeds can defer
    // repeated invalidations until their next read.
    if (dirty && sig._subscribers.size === 0) {return;}
    dirty = true;
    if (sig._subscribers.size === 0) {return;}

    const previous = sig._value;
    recompute();
    if (!Object.is(previous, sig._value)) {
      trigger(sig, getTriggerContext());
    }
  };

  /**
   * Re-evaluate the computation and cache the result.
   */
  function recompute() {
    if (computing) {
      throw new Error('[kupola] Circular computed dependency detected.');
    }
    computing = true;

    // Unsubscribe from old deps.
    for (const d of deps) {
      unsubscribe(d, tracker);
    }
    deps.clear();
    tracker._deps = deps;

    try {
      pushEffect(tracker);
      try {
        const result = profilerInstrumentationEnabled && isProfilerEnabled()
          ? profileComputedRun(tracker, fn)
          : fn();
        if (!Object.is(sig._value, result)) {
          sig._value = result;
        }
      } finally {
        popEffect();
      }
    } finally {
      computing = false;
    }

    dirty = false;
  }

  const result = {
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

    /** Permanently stop dependency tracking for this computed value. */
    dispose() {
      if (tracker._disposed) {return;}
      tracker._disposed = true;
      for (const dep of deps) {
        unsubscribe(dep, tracker);
      }
      deps.clear();
      for (const subscriber of sig._subscribers) {
        if (subscriber._deps) {subscriber._deps.delete(sig);}
      }
      sig._subscribers.clear();
      sig._disposed = true;
      dirty = false;
    },

    toString() {
      return String(this.value);
    },

    toJSON() {
      return this.value;
    },
  };

  const unregisterScopeCleanup = registerScopeCleanup(() => result.dispose());
  const originalDispose = result.dispose;
  result.dispose = () => {
    if (unregisterScopeCleanup) {unregisterScopeCleanup();}
    originalDispose();
  };

  return result;
}
