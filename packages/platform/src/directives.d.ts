/**
 * @kupola/core — TypeScript type definitions for the directive system.
 * @module @kupola/platform/directives
 */

import type { Scheduler } from '@kupola/core';

export type KupolaRefValue = Element | Element[];

export function $(selector: string, context?: ParentNode): Element | null;
export function $(selector: Element | null, context?: ParentNode): Element | null;
export function $$<T extends Element = Element>(selector: string, context?: ParentNode): T[];
export function setHtmlSanitizer(
  sanitizer: ((html: string, element: Element) => string) | null
): void;

export interface ScopeContext {
  root: Element;
  refs: Record<string, KupolaRefValue>;
  $(selector: string, context?: ParentNode): Element | null;
  $$<T extends Element = Element>(selector: string, context?: ParentNode): T[];
  on(type: string, handler: (event: Event, root: Element) => void, options?: AddEventListenerOptions): () => void;
  on<T extends Element = Element>(
    type: string,
    selector: string,
    handler: (event: Event, target: T) => void,
    options?: AddEventListenerOptions
  ): () => void;
  watch<T>(
    getter: () => T,
    callback: (value: T, oldValue: T | undefined) => void | (() => void),
    options?: { immediate?: boolean; scheduler?: Scheduler | null }
  ): () => void;
  update<T>(name: string, updater: (value: T) => T): T;
  patch<T extends Record<string, unknown>>(name: string, partial: Partial<T>): T;
  scope?: Record<string, unknown>;
}

export type ScopeDefinition =
  | Record<string, unknown>
  | ((ctx: ScopeContext) => Record<string, unknown>);

export interface WalkOptions {
  autoDestroy?: boolean;
  sanitizer?: ((html: string, element: Element) => string) | null;
  scheduler?: Scheduler | null;
  customDirectives?: Map<string, DirectiveDefinition> | Record<string, DirectiveDefinition>;
}

/** Result of walking a DOM tree — call destroy() to clean up all effects and listeners. */
export interface WalkResult {
  root: Element;
  refs: Record<string, KupolaRefValue>;
  $(selector: string, context?: ParentNode): Element | null;
  $$<T extends Element = Element>(selector: string, context?: ParentNode): T[];
  on(type: string, handler: (event: Event, root: Element) => void, options?: AddEventListenerOptions): () => void;
  on<T extends Element = Element>(
    type: string,
    selector: string,
    handler: (event: Event, target: T) => void,
    options?: AddEventListenerOptions
  ): () => void;
  watch<T>(
    getter: () => T,
    callback: (value: T, oldValue: T | undefined) => void | (() => void),
    options?: { immediate?: boolean; scheduler?: Scheduler | null }
  ): () => void;
  /** Clean up all reactive effects and event listeners created by walk(). */
  destroy(): void;
}

export interface DirectiveBinding {
  value: string;
  arg: string | null;
  modifiers: string[];
}

export interface DirectiveInstance {
  destroy?(): void;
  update?(binding: DirectiveBinding): void;
}

export interface DirectiveDefinition {
  mount?(el: Element, binding: DirectiveBinding): DirectiveInstance | void;
  update?(el: Element, binding: DirectiveBinding): void;
  unmount?(el: Element): void;
}

/**
 * Walk a DOM tree and activate all Kupola directives.
 *
 * Finds `k-data` elements to create reactive scopes, then processes
 * `k-show`, `k-if`, `k-else-if`, `k-else`, `k-for`, `k-text`, `k-html`,
 * `k-bind`, `k-class`, `k-style`, `k-transition`, `k-on`,
 * `k-model`, `k-ref`, `k-init`, `k-cloak` directives.
 *
 * @param root  Root element or selector to walk.
 * @returns A WalkResult with a destroy() method for cleanup.
 */
export function walk(root: Element | string, options?: WalkOptions): WalkResult;

/**
 * Walk a DOM tree and automatically destroy the instance when the root is removed.
 */
export function walkAuto(root: Element | string, options?: WalkOptions): WalkResult;

/**
 * Return the existing walk instance for a root, or create one if needed.
 */
export function walkOnce(root: Element | string, options?: WalkOptions): WalkResult;

/**
 * Get the active walk instance for a root.
 */
export function getWalk(root: Element | string): WalkResult | null;

/**
 * Check whether a root has an active walk instance.
 */
export function hasWalk(root: Element | string): boolean;

/**
 * Destroy the active walk instance for a root if one exists.
 */
export function destroyWalk(root: Element | string): boolean;

/**
 * Register a named data scope for use with `k-data="name"`.
 */
export function defineScope(name: string, definition: ScopeDefinition): void;

/**
 * Register a custom directive for walk().
 */
export function registerDirective(name: string, definition: DirectiveDefinition): void;
