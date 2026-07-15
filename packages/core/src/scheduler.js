// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Microtask scheduler.
 * Batches multiple signal mutations into a single flush per tick.
 * @module scheduler
 */

/** @type {Set<Function>} Pending jobs (deduplicated by reference). */
const pendingJobs = new Set();

/** @type {boolean} Whether a microtask flush has been scheduled. */
let isFlushScheduled = false;

/**
 * Schedule a job to run in the next microtask.
 * Duplicate references are automatically deduplicated.
 * @param {Function} job
 */
export function queueJob(job) {
  pendingJobs.add(job);
  if (!isFlushScheduled) {
    isFlushScheduled = true;
    queueMicrotask(flushJobs);
  }
}

/**
 * Immediately flush all pending jobs synchronously.
 * Safe to call manually (e.g. in tests) — clears the queue before running.
 */
export function flushJobs() {
  isFlushScheduled = false;
  // Keep draining until no more jobs are queued.
  // This handles the case where an effect mutates a signal,
  // which queues additional jobs during the flush.
  while (pendingJobs.size > 0) {
    const jobs = [...pendingJobs];
    pendingJobs.clear();
    for (const job of jobs) {
      job();
    }
  }
}

/**
 * Reset scheduler state (for testing).
 */
export function resetScheduler() {
  pendingJobs.clear();
  isFlushScheduled = false;
}
