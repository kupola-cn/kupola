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

/**
 * The fundamental reactive primitive.
 *
 * A signal holds a value and notifies subscribers when it changes.
 * Reading `.value` inside an active effect/computed registers a dependency;
 * writing `.value` triggers all registered dependents.
 */
export declare class Signal<T = any> {
  constructor(initialValue: T);
  /** Read the current value. Registers a dependency if called inside an effect. */
  get value(): T;
  /** Update the value. Triggers subscribers only when the value actually changes. */
  set value(newValue: T);
  /** Peek at the value without registering a dependency. */
  peek(): T;
  toString(): string;
  toJSON(): string;
}

/** A read-only view over a computed value. */
export interface ReadonlySignal<T = any> {
  readonly value: T;
  peek(): T;
  toString(): string;
  toJSON(): string;
}

/** Create a reactive signal. */
export declare function signal<T>(initialValue: T): Signal<T>;

/**
 * Create a deep reactive proxy over an object.
 * Property reads/writes transparently track and trigger the underlying signal.
 */
export declare function reactive<T extends object>(
  obj: T
): T & {
  /** Clear all subscribers on the underlying signal. */
  dispose?: () => void;
  /** @internal Underlying signal. */
  _signal?: Signal<T>;
};

/** Check whether an object is a reactive proxy created by `reactive()`. */
export declare function isReactive(obj: any): boolean;

/** Run a function without collecting reactive dependencies. */
export declare function withoutTracking<T>(fn: () => T): T;

// ── Computed ─────────────────────────────────────────────────────────────────

/**
 * Create a computed (derived) signal.
 *
 * The computation re-evaluates only when a tracked dependency changes,
 * and caches the result until then.
 */
export declare function computed<T>(fn: () => T): ReadonlySignal<T>;

// ── Effect ───────────────────────────────────────────────────────────────────

/** Dispose function returned by `effect()` / `watch()`. */
export type Dispose = () => void;

/**
 * Create a reactive effect.
 *
 * The function is executed immediately. Any signal read during execution is
 * tracked; when those signals change, the function re-executes.
 *
 * @returns Dispose function — call to stop the effect.
 */
export declare function effect(fn: () => void | Dispose): Dispose;

export interface WatchOptions {
  /** If true, call callback immediately with the current value. */
  immediate?: boolean;
  /** If true, perform deep comparison via structuredClone. */
  deep?: boolean;
}

/**
 * Watch a signal or computed value and call a callback when it changes.
 *
 * @param getter Function that returns the value to watch.
 * @param callback Called when the value changes: (newValue, oldValue) => void | cleanup.
 * @param options Optional configuration.
 * @returns Dispose function.
 */
export declare function watch<T>(
  getter: () => T,
  callback: (newValue: T, oldValue: T | undefined) => void | Dispose,
  options?: WatchOptions
): Dispose;

// ── Batch ────────────────────────────────────────────────────────────────────

/**
 * Execute a function inside a batch scope.
 *
 * Signal mutations inside the batch will not trigger effects immediately.
 * All deferred effects are flushed once the outermost batch finishes.
 * Batches can be nested — effects only run when the outermost batch ends.
 *
 * @returns The return value of `fn`.
 */
export declare function batch<T>(fn: () => T): T;

// ── Scheduler (internal, used by @kupola/platform) ───────────────────────────

/** Schedule a job to run in the next microtask. Duplicate references are deduplicated. */
export declare function queueJob(job: () => void): void;

/** Immediately flush all pending jobs synchronously. */
export declare function flushJobs(): void;

/** Run a callback after flushing all pending jobs in the next microtask. */
export declare function nextTick(callback: () => void): void;
