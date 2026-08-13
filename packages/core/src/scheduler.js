// SPDX-License-Identifier: MIT
/**
 * @kupola/core - Microtask scheduler.
 *
 * The exported functions use a shared default scheduler for compatibility.
 * `createScheduler()` allows an app or SSR request to isolate its own queue.
 * @module scheduler
 */

import { reportErrors } from './errors.js';

const defaultMaxJobs = 10000;
const scheduleMicrotask = typeof queueMicrotask === 'function'
  ? queueMicrotask
  : callback => Promise.resolve().then(callback);
let activeScheduler = null;

function isSchedulerLike(value) {
  return value !== null
    && typeof value === 'object'
    && typeof value.queueJob === 'function'
    && typeof value.queuePostJob === 'function';
}

/** @returns {Object|null} The scheduler inherited by newly created effects. */
export function getCurrentScheduler() {
  return activeScheduler;
}

/**
 * Run synchronous setup code with an inherited scheduler.
 *
 * Effects created during the callback capture this scheduler. The context is
 * restored even when setup throws, so one app cannot leak into the next one.
 * @param {Object|null} scheduler
 * @param {Function} fn
 * @returns {*}
 */
export function runWithScheduler(scheduler, fn) {
  if (scheduler !== null && !isSchedulerLike(scheduler)) {
    throw new TypeError('[kupola] runWithScheduler() expects a scheduler or null.');
  }
  if (typeof fn !== 'function') {
    throw new TypeError('[kupola] runWithScheduler() expects a function.');
  }
  const previous = activeScheduler;
  activeScheduler = scheduler;
  try {
    return fn();
  } finally {
    activeScheduler = previous;
  }
}

/**
 * Create an isolated reactive job scheduler.
 *
 * @param {{ maxJobs?: number, name?: string, onError?: Function }} [options]
 * @returns {{ queueJob: Function, queuePostJob: Function, flushJobs: Function,
 *   nextTick: Function, reset: Function,
 *   queuePriorityJob: Function, queueIdleJob: Function,
 *   cancelIdleJob: Function }}
 */
export function createScheduler(options = {}) {
  if (options === null || typeof options !== 'object' || Array.isArray(options)) {
    throw new TypeError('[kupola] createScheduler() options must be an object.');
  }
  const maxJobs = options.maxJobs === undefined ? defaultMaxJobs : options.maxJobs;
  if (!Number.isInteger(maxJobs) || maxJobs <= 0) {
    throw new TypeError('[kupola] scheduler maxJobs must be a positive integer.');
  }
  const schedulerName = options.name || 'default';
  const schedulerErrorHandler = options.onError;
  if (schedulerErrorHandler !== undefined
    && schedulerErrorHandler !== null
    && typeof schedulerErrorHandler !== 'function') {
    throw new TypeError('[kupola] scheduler onError must be a function or null.');
  }
  const pendingJobs = new Set();
  const pendingPostJobs = new Set();
  /** High-priority jobs (e.g. user interaction responses) — flushed before both post and idle queues. */
  const pendingHighPriorityJobs = new Set();
  /** Low-priority jobs that run only when the browser is idle, or after all higher priority queues are drained. */
  const pendingIdleJobs = new Set();
  let isFlushScheduled = false;
  let isFlushing = false;
  let idleCallbackScheduled = false;

  function scheduleFlush() {
    if (!isFlushScheduled && !isFlushing) {
      isFlushScheduled = true;
      scheduleMicrotask(flushJobs);
    }
  }

  function scheduleIdleFlush() {
    if (idleCallbackScheduled) {return;}
    idleCallbackScheduled = true;
    const runIdle = () => {
      idleCallbackScheduled = false;
      const work = () => {
        if (pendingIdleJobs.size === 0) {return;}
        const jobs = [ ...pendingIdleJobs ];
        pendingIdleJobs.clear();
        for (const job of jobs) {
          try { job(); } catch { /* swallow idle job errors */ }
        }
      };
      if (typeof requestIdleCallback === 'function') {
        requestIdleCallback(work, { timeout: 3000 });
      } else {
        setTimeout(work, 16);
      }
    };
    // Schedule idle work after the current flush completes to avoid starving
    // high-priority work.
    if (isFlushing) {
      scheduleMicrotask(runIdle);
    } else {
      runIdle();
    }
  }

  function queueJob(job) {
    if (typeof job !== 'function') {
      throw new TypeError('[kupola] queueJob() expects a function.');
    }
    pendingJobs.add(job);
    scheduleFlush();
  }

  function queuePostJob(job) {
    if (typeof job !== 'function') {
      throw new TypeError('[kupola] queuePostJob() expects a function.');
    }
    pendingPostJobs.add(job);
    scheduleFlush();
  }

  /**
   * Queue a high-priority job that runs before regular and post queues.
   * Useful for user interaction responses that must be processed promptly.
   *
   * @param {Function} job
   */
  function queuePriorityJob(job) {
    if (typeof job !== 'function') {
      throw new TypeError('[kupola] queuePriorityJob() expects a function.');
    }
    pendingHighPriorityJobs.add(job);
    scheduleFlush();
  }

  /**
   * Queue a low-priority job that runs only after the browser becomes idle.
   * Returns a cancel function.
   *
   * @param {Function} job
   * @returns {() => void}
   */
  function queueIdleJob(job) {
    if (typeof job !== 'function') {
      throw new TypeError('[kupola] queueIdleJob() expects a function.');
    }
    pendingIdleJobs.add(job);
    scheduleIdleFlush();
    return () => { pendingIdleJobs.delete(job); };
  }

  function cancelIdleJob(job) {
    if (typeof job !== 'function') {return;}
    pendingIdleJobs.delete(job);
  }

  function flushJobs() {
    if (isFlushing) {return;}

    isFlushing = true;
    isFlushScheduled = false;
    const errors = [];
    let jobCount = 0;
    let loopDetected = false;
    try {
      // Drain high → regular → post queues. New high priority jobs added by
      // post-jobs are still processed before the next post batch so that user
      // interactions always win over bookkeeping work.
      while (
        pendingHighPriorityJobs.size > 0
        || pendingJobs.size > 0
        || pendingPostJobs.size > 0
      ) {
        // High priority first.
        if (pendingHighPriorityJobs.size > 0) {
          const jobs = [ ...pendingHighPriorityJobs ];
          pendingHighPriorityJobs.clear();
          for (const job of jobs) {
            jobCount++;
            if (jobCount > maxJobs) {
              pendingHighPriorityJobs.clear();
              const error = new Error(
                `[kupola] Scheduler exceeded the maximum of ${maxJobs} jobs in one flush.`,
              );
              error.code = 'KUPOLA_SCHEDULER_LOOP';
              errors.push(error);
              loopDetected = true;
              break;
            }
            try { job(); } catch (error) { errors.push(error); }
          }
          if (loopDetected) {break;}
          continue;
        }

        const queue = pendingJobs.size > 0 ? pendingJobs : pendingPostJobs;
        const jobs = [ ...queue ];
        queue.clear();
        for (const job of jobs) {
          jobCount++;
          if (jobCount > maxJobs) {
            pendingJobs.clear();
            pendingPostJobs.clear();
            const error = new Error(
              `[kupola] Scheduler exceeded the maximum of ${maxJobs} jobs in one flush.`,
            );
            error.code = 'KUPOLA_SCHEDULER_LOOP';
            errors.push(error);
            loopDetected = true;
            break;
          }
          try {
            job();
          } catch (error) {
            errors.push(error);
          }
        }
        if (loopDetected) {break;}
      }
    } finally {
      isFlushing = false;
      if ((
        pendingJobs.size > 0
        || pendingPostJobs.size > 0
        || pendingHighPriorityJobs.size > 0
      ) && !isFlushScheduled) {
        scheduleFlush();
      }
      if (pendingIdleJobs.size > 0) {
        scheduleIdleFlush();
      }
    }

    const context = { source: 'scheduler', phase: 'flush' };
    if (schedulerName !== 'default') {context.scheduler = schedulerName;}
    reportErrors(errors, context, schedulerErrorHandler);
  }

  function nextTick(callback) {
    if (callback !== undefined && typeof callback !== 'function') {
      throw new TypeError('[kupola] nextTick() expects a function when provided.');
    }
    return new Promise((resolve, reject) => {
      scheduleMicrotask(() => {
        try {
          flushJobs();
          resolve(callback ? callback() : undefined);
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  function reset() {
    pendingJobs.clear();
    pendingPostJobs.clear();
    pendingHighPriorityJobs.clear();
    pendingIdleJobs.clear();
    isFlushScheduled = false;
    idleCallbackScheduled = false;
  }

  return Object.freeze({
    queueJob,
    queuePostJob,
    queuePriorityJob,
    queueIdleJob,
    cancelIdleJob,
    flushJobs,
    nextTick,
    reset,
  });
}

const defaultScheduler = createScheduler();

export function queueJob(job) {
  defaultScheduler.queueJob(job);
}

export function queuePostJob(job) {
  defaultScheduler.queuePostJob(job);
}

/**
 * Queue a high-priority job that runs before regular and post queues.
 * Prefer this for user interaction responses that must not be delayed by
 * background bookkeeping.
 *
 * @param {Function} job
 */
export function queuePriorityJob(job) {
  defaultScheduler.queuePriorityJob(job);
}

/**
 * Queue a low-priority job that runs when the browser is idle.
 * Returns a cancel function that removes the job if it has not run yet.
 *
 * @param {Function} job
 * @returns {() => void}
 */
export function queueIdleJob(job) {
  return defaultScheduler.queueIdleJob(job);
}

/**
 * Cancel a pending idle job.
 *
 * @param {Function} job
 */
export function cancelIdleJob(job) {
  defaultScheduler.cancelIdleJob(job);
}

export function flushJobs() {
  defaultScheduler.flushJobs();
}

/** Reset the default scheduler (for tests and isolated teardown). */
export function resetScheduler() {
  defaultScheduler.reset();
}

export function nextTick(callback) {
  return defaultScheduler.nextTick(callback);
}
