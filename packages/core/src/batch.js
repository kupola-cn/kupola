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

  if (callbackFailed) {throw callbackError;}
  return result;
}
