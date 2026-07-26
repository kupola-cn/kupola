// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Core reactivity engine (signal + computed + effect + batch).
 *
 * This package contains only the essential reactivity primitives.
 * For full features (rendering, components, directives, theme), use @kupola/platform.
 *
 * @module @kupola/core
 */

// ── Signal ───────────────────────────────────────────────────────────────────
export { signal, Signal, reactive, isReactive, toRaw, withoutTracking } from './signal.js';

// ── Computed ─────────────────────────────────────────────────────────────────
export { computed } from './computed.js';

// ── Effect ───────────────────────────────────────────────────────────────────
export { effect, effectScope, onScopeDispose, watch } from './effect.js';

// ── Batch ────────────────────────────────────────────────────────────────────
export { batch } from './batch.js';

// ── Scheduler (internal, used by @kupola/platform) ───────────────────────────
export {
  createScheduler,
  flushJobs,
  getCurrentScheduler,
  nextTick,
  queueJob,
  queuePostJob,
  runWithScheduler,
} from './scheduler.js';
export { setErrorHandler, getErrorHandler } from './errors.js';
