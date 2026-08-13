// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Batch: deferred effect execution.
 *
 * Inside a `batch()` call, signal mutations do not immediately schedule
 * effects. Instead, all affected effects are collected and flushed once
 * when the outermost batch completes.
 *
 * @module batch
 */

import {
  batchDepth,
  setBatchDepth,
  getBatchQueue,
  getTriggerContext,
  setAtomicTracking,
} from './signal.js';
import { flushJobs, queueJob, queuePostJob } from './scheduler.js';

/**
 * Execute a function inside a batch scope.
 *
 * Signal mutations inside the batch will **not** trigger effects immediately.
 * All deferred effects are flushed once the outermost batch finishes.
 *
 * Batches can be nested — effects only run when the outermost batch ends.
 *
 * ```js
 * const a = signal(1);
 * const b = signal(2);
 *
 * effect(() => console.log(a.value + b.value));
 *
 * batch(() => {
 *   a.value = 10;   // effect NOT called yet
 *   b.value = 20;   // effect NOT called yet
 * });
 * // → logs 30  (single flush, not two)
 * ```
 *
 * @param {Function} fn  Function to execute inside the batch.
 * @returns {*}           The return value of `fn`.
 */
export function batch(fn) {
  if (typeof fn !== 'function') {
    throw new TypeError('[kupola] batch() expects a function.');
  }

  let result;
  let callbackError;
  let callbackFailed = false;
  setBatchDepth(batchDepth + 1);
  try {
    result = fn();
  } catch (error) {
    callbackError = error;
    callbackFailed = true;
  } finally {
    setBatchDepth(batchDepth - 1);

    // Only flush when the outermost batch ends.
    if (batchDepth === 0) {
      // If the callback failed inside an atomic transaction, skip the
      // flush — batch.atomic will roll back signal values and discard
      // any queued jobs itself. Flushing here would run effects with
      // the not-yet-rolled-back values.
      if (callbackFailed && atomicContextStack.length > 0) {
        getBatchQueue().clear();
      } else {
      const queue = getBatchQueue();
      const jobs = [ ...queue ];
      queue.clear();
      const schedulers = new Set();

      for (const job of jobs) {
        const scheduler = job._scheduler;
        if (scheduler) {
          schedulers.add(scheduler);
          if (job._flush === 'post') {scheduler.queuePostJob(job);}
          else {scheduler.queueJob(job);}
        } else if (job._flush === 'post') {queuePostJob(job);}
        else {queueJob(job);}
      }

      let flushError;
      try {
        flushJobs();
      } catch (error) {
        flushError = error;
      }

      // A batch is synchronous even when its effects use isolated schedulers.
      // Flush each involved instance independently so one failing queue does
      // not prevent unrelated application queues from being drained.
      for (const scheduler of schedulers) {
        if (typeof scheduler.flushJobs !== 'function') {continue;}
        try {
          scheduler.flushJobs();
        } catch (error) {
          if (!flushError) {flushError = error;}
        }
      }

      // An isolated job may enqueue a default-scheduler job while running.
      try {
        flushJobs();
      } catch (error) {
        if (!flushError) {flushError = error;}
      }

      // Preserve an exception thrown by the batch callback when both paths
      // fail. All independent queues have still been given a chance to drain.
      if (!callbackFailed && flushError) {
        callbackError = flushError;
        callbackFailed = true;
      }
      }
    }
  }

  if (callbackFailed) {throw callbackError;}
  return result;
}

/**
 * Stack of active atomic transaction contexts (outermost first). Looked up
 * lazily by signal.js via the injected {@link setAtomicTracking} hook so we
 * avoid a circular import between the two modules.
 *
 * @type {Object[]}
 */
const atomicContextStack = [];

/** @internal */
export function pushAtomicContext(ctx) {
  atomicContextStack.push(ctx);
}

/** @internal */
export function popAtomicContext(ctx) {
  const idx = atomicContextStack.lastIndexOf(ctx);
  if (idx !== -1) {atomicContextStack.splice(idx, 1);}
}

/** @internal Returns the currently active atomic context, if any. */
function findActiveAtomicContext() {
  return atomicContextStack.length > 0
    ? atomicContextStack[atomicContextStack.length - 1]
    : null;
}

// Wire up the lookup function so signal.js can reach atomic contexts without
// importing this module. `setAtomicTracking` is defined in signal.js above
// the export, so by the time we reach this line it is available.
setAtomicTracking(findActiveAtomicContext);

/**
 * Execute a function inside an atomic batch transaction. If the function
 * throws, all signal writes performed during the transaction are rolled
 * back to their original values and no deferred effects are flushed.
 *
 * ```js
 * const a = signal(0);
 * const b = signal(0);
 *
 * batch.atomic(() => {
 *   a.value = 1;
 *   b.value = 2;
 *   throw new Error('boom');
 * });
 * // a.value === 0, b.value === 0 (rolled back)
 * ```
 *
 * @param {Function} fn Transaction body.
 * @returns {*} The return value of `fn`.
 */
batch.atomic = function atomicBatch(fn) {
  if (typeof fn !== 'function') {
    throw new TypeError('[kupola] batch.atomic() expects a function.');
  }

  const atomicCtx = {
    atomic: true,
    /** @type {Map<import('./signal.js').Signal, *>} Snapshots only the first write per signal. */
    _atomicSnapshots: new Map(),
  };
  pushAtomicContext(atomicCtx);

  // Snapshot the batch queue so we can discard any deferred jobs
  // produced by a failed transaction and restore it on rollback.
  const queue = getBatchQueue();
  const queueSnapshot = [ ...queue ];

  // Snapshot the active trigger context's pending state so a failed
  // transaction can discard subscribers produced by the rolled-back
  // writes and restore the original state for the caller.
  const triggerCtx = getTriggerContext();
  const pendingComputedsSnapshot = triggerCtx
    ? [ ...triggerCtx.pendingComputeds ]
    : [];
  const pendingEffectsSnapshot = triggerCtx
    ? [ ...triggerCtx.pendingEffects ]
    : [];

  let result;
  let error;
  let failed = false;

  try {
    result = batch(fn);
  } catch (err) {
    error = err;
    failed = true;
  } finally {
    popAtomicContext(atomicCtx);
  }

  if (failed) {
    // Roll back signal values to their pre-transaction state.
    for (const [ sig, originalValue ] of atomicCtx._atomicSnapshots) {
      sig._value = originalValue;
    }

    // Discard deferred jobs produced during the transaction — they
    // captured state that has now been rolled back.
    const newQueue = getBatchQueue();
    newQueue.clear();
    for (const job of queueSnapshot) {newQueue.add(job);}

    // Subscribers produced during the failed transaction were collected
    // with the new (now-rolled-back) values. They must not run. Restore
    // the trigger context's pending state to its pre-transaction
    // snapshot so the caller observes a clean slate.
    if (triggerCtx) {
      triggerCtx.pendingComputeds.clear();
      triggerCtx.pendingEffects.clear();
      for (const c of pendingComputedsSnapshot) {
        if (!triggerCtx.pendingComputeds.has(c)) {triggerCtx.pendingComputeds.add(c);}
      }
      for (const e of pendingEffectsSnapshot) {
        if (!triggerCtx.pendingEffects.has(e)) {triggerCtx.pendingEffects.add(e);}
      }
    }
    throw error;
  }

  return result;
};
