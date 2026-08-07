// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Declarative directive system.
 *
 * Provides Alpine.js-like interactivity via HTML attributes:
 *   k-data   — create a reactive scope
 *   k-show   — conditional display
 *   k-text   — reactive textContent
 *   k-html   — reactive innerHTML
 *   k-bind   — dynamic attributes  (shorthand:  :attr)
 *   k-on     — event listeners     (shorthand:  @event)
 *   k-model  — two-way input binding
 *   k-ref    — scoped element references
 *   k-init   — one-time initialization statement
 *   k-cloak  — hide until initialized
 *   k-class  — object/array/string class binding
 *   k-style  — object/string style binding
 *   k-transition — CSS transition class lifecycle
 *   k-if     — conditional DOM mounting
 *   k-else-if — conditional branch after k-if
 *   k-else   — fallback branch after k-if
 *   k-for    — list rendering
 *
 * @module directives
 */

export { setHtmlSanitizer } from './directives-warnings.js';
export { $, $$, defineScope } from './directives-scope.js';
export { registerDirective } from './directives-registry.js';
export {
  destroyWalk,
  getWalk,
  hasWalk,
  walk,
  walkAuto,
  walkOnce,
} from './directives-walk.js';
