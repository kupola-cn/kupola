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
