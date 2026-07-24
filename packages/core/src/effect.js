// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Effect: reactive side-effect.
 *
 * An effect runs a function and automatically tracks which signals it reads.
 * When any of those signals change, the effect re-runs.
 *
 * @module effect
 */

import { pushEffect, popEffect } from './signal.js';
import { isProfilerEnabled, profileEffectRun } from './devtools.js';

/**
 * @typedef {Object} EffectRecord
 * @property {Function} _fn         The user-supplied effect function.
 * @property {Set<import('./signal.js').Signal>} _deps  Signals this effect depends on.
 * @property {Function} _run        The scheduler job (re-runs the effect).
 * @property {boolean}  _disposed   Whether this effect has been disposed.
 */

/**
 * Create a reactive effect.
 *
 * The function is executed immediately. Any signal read during execution is
 * tracked; when those signals change, the function re-executes.
 *
 * ```js
 * const count = signal(0);
 * const dispose = effect(() => {
 *   console.log('count is', count.value);
 * });
 * // → logs "count is 0"
 * count.value = 1;
 * // → logs "count is 1"  (async, after microtask)
 * dispose();  // stop tracking
 * ```
 *
 * @param {Function} fn  Effect function to run.
 * @returns {Function}   Dispose function — call to stop the effect.
 */
export function effect(fn) {
  /** @type {EffectRecord} */
  const eff = {
    _fn: fn,
    _deps: new Set(),
    _run: null,
    _disposed: false,
  };

  // _run is the stable function reference the scheduler queues.
  eff._run = () => {
    if (eff._disposed) {return;}
    runEffect(eff);
  };

  // Initial execution.
  runEffect(eff);

  // Return dispose handle.
  return () => dispose(eff);
}

/**
 * Execute the effect function, clearing old deps and re-tracking.
 * @param {EffectRecord} eff
 */
function runEffect(eff) {
  // Clear previous dependencies so we don't accumulate stale subscriptions.
  cleanupDeps(eff);

  pushEffect(eff);
  try {
    if (isProfilerEnabled()) {
      profileEffectRun(eff, eff._fn);
    } else {
      eff._fn();
    }
  } finally {
    popEffect();
  }
}

/**
 * Remove this effect from all signals it was subscribed to.
 * @param {EffectRecord} eff
 */
function cleanupDeps(eff) {
  for (const sig of eff._deps) {
    sig._subscribers.delete(eff);
  }
  eff._deps.clear();
}

/**
 * Permanently stop an effect and unsubscribe from all signals.
 * @param {EffectRecord} eff
 */
function dispose(eff) {
  if (eff._disposed) {return;}
  eff._disposed = true;
  cleanupDeps(eff);
}

/**
 * Watch a signal or computed value and call a callback when it changes.
 *
 * @param {Function} getter  Function that returns the value to watch.
 * @param {Function} callback  Called when the value changes: (newValue, oldValue) => void.
 * @param {Object} options  Optional configuration.
 * @param {boolean} options.immediate  If true, call callback immediately with current value.
 * @param {boolean} options.deep  If true, perform deep comparison.
 * @returns {Function} Dispose function.
 */
export function watch(getter, callback, options = {}) {
  const { immediate = false, deep = false } = options;
  let oldValue = deep ? structuredClone(getter()) : getter();
  let initialized = !immediate;

  const dispose = effect(() => {
    const newValue = getter();
    if (initialized) {
      const changed = deep
        ? !areDeepEqual(oldValue, newValue)
        : oldValue !== newValue;
      if (changed) {
        const result = callback(newValue, oldValue);
        if (typeof result === 'function') {
          result();
        }
        oldValue = deep ? structuredClone(newValue) : newValue;
      }
    } else {
      initialized = true;
      oldValue = deep ? structuredClone(newValue) : newValue;
    }
  });

  if (immediate) {
    const newValue = getter();
    const result = callback(newValue, undefined);
    if (typeof result === 'function') {
      result();
    }
  }

  return dispose;
}

function areDeepEqual(a, b) {
  if (a === b) {return true;}
  if (typeof a !== 'object' || typeof b !== 'object') {return false;}
  if (a === null || b === null) {return a === b;}
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) {return false;}
    return a.every((val, i) => areDeepEqual(val, b[i]));
  }
  if (Array.isArray(a) || Array.isArray(b)) {return false;}
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) {return false;}
  return keysA.every(key => areDeepEqual(a[key], b[key]));
}
