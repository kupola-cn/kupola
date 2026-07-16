/**
 * @kupola/core — TypeScript type definitions for the directive system.
 * @module @kupola/core/directives
 */

/** Result of walking a DOM tree — call destroy() to clean up all effects and listeners. */
export interface WalkResult {
  /** Clean up all reactive effects and event listeners created by walk(). */
  destroy(): void;
}

/**
 * Walk a DOM tree and activate all Kupola directives.
 *
 * Finds `k-data` elements to create reactive scopes, then processes
 * `k-show`, `k-text`, `k-html`, `k-bind`, `k-on`, `k-model` directives.
 *
 * @param root  Root element to walk.
 * @returns A WalkResult with a destroy() method for cleanup.
 */
export function walk(root: Element): WalkResult;
