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
  batchQueue,
  setBatchDepth,
  getBatchQueue,
} from './signal.js';
import { flushJobs } from './scheduler.js';

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
  setBatchDepth(batchDepth + 1);
  try {
    return fn();
  } finally {
    setBatchDepth(batchDepth - 1);

    // Only flush when the outermost batch ends.
    if (batchDepth === 0) {
      const queue = getBatchQueue();
      // Snapshot + clear so jobs queued *during* flush go to the scheduler.
      const jobs = [...queue];
      queue.clear();

      for (const job of jobs) {
        job();
      }

      // Also flush anything the scheduler picked up outside the batch.
      flushJobs();
    }
  }
}
