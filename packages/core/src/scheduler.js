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
 * @param {{ maxJobs?: number, name?: string }} [options]
 * @returns {{ queueJob: Function, queuePostJob: Function, flushJobs: Function,
 *   nextTick: Function, reset: Function }}
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
  let isFlushScheduled = false;
  let isFlushing = false;

  function scheduleFlush() {
    if (!isFlushScheduled && !isFlushing) {
      isFlushScheduled = true;
      scheduleMicrotask(flushJobs);
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

  function flushJobs() {
    if (isFlushing) {return;}

    isFlushing = true;
    isFlushScheduled = false;
    const errors = [];
    let jobCount = 0;
    let loopDetected = false;
    try {
      // Regular jobs always precede post jobs. New regular jobs created by a
      // post job are handled before the next post batch.
      while (pendingJobs.size > 0 || pendingPostJobs.size > 0) {
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
            // One failing job must not block unrelated jobs in the same tick.
            errors.push(error);
          }
        }
        if (loopDetected) {break;}
      }
    } finally {
      isFlushing = false;
      if ((pendingJobs.size > 0 || pendingPostJobs.size > 0) && !isFlushScheduled) {
        scheduleFlush();
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
    isFlushScheduled = false;
  }

  return Object.freeze({ queueJob, queuePostJob, flushJobs, nextTick, reset });
}

const defaultScheduler = createScheduler();

export function queueJob(job) {
  defaultScheduler.queueJob(job);
}

export function queuePostJob(job) {
  defaultScheduler.queuePostJob(job);
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
