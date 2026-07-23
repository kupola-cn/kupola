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
import { isProfilerEnabled, profileSignalWrite, profileSignalRead } from './devtools.js';

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
