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
export { signal, Signal, reactive, isReactive } from './signal.js';

// ── Computed ─────────────────────────────────────────────────────────────────
export { computed } from './computed.js';

// ── Effect ───────────────────────────────────────────────────────────────────
export { effect, watch } from './effect.js';

// ── Batch ────────────────────────────────────────────────────────────────────
export { batch } from './batch.js';
