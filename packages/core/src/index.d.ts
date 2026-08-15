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
  /** Permanently dispose this signal, releasing all subscriber references. */
  dispose(): void;
  toString(): string;
  toJSON(): T;
}

/** A read-only view over a computed value. */
export interface ReadonlySignal<T = any> {
  readonly value: T;
  peek(): T;
  /** Permanently stop tracking dependencies for this computed value. */
  dispose(): void;
  toString(): string;
  toJSON(): T;
}

/** Options for creating a signal with debugging metadata. */
export interface SignalOptions {
  /** Optional label for DevTools profiling. */
  label?: string;
}

/** Create a reactive signal. */
export declare function signal<T>(initialValue: T, options?: SignalOptions): Signal<T>;

/**
 * Built-in object types that `reactive()` leaves as-is (not wrapped in a Proxy).
 * These match the runtime check in `isSupportedReactiveTarget()`.
 */
type ReactiveBuiltin =
  | Function
  | Date
  | RegExp
  | ArrayBuffer
  | ArrayBufferView
  | DataView
  | Map<any, any>
  | Set<any>
  | WeakMap<any, any>
  | WeakSet<any>;

/**
 * Recursively make all nested plain-object/array properties reactive.
 *
 * Only **plain objects** and **arrays** are made deeply reactive — matching
 * the runtime behaviour of `reactive()`. All built-in types (`Map`, `Set`,
 * `WeakMap`, `WeakSet`, `Date`, `RegExp`, `ArrayBuffer`, `TypedArray`,
 * `DataView`, `Function`) and `Signal` instances are returned as-is.
 *
 * **Map/Set note**: `Map` and `Set` are NOT deeply reactive. Modifying a value
 * object stored inside a `Map` will not trigger updates. To make the value
 * reactive, wrap it explicitly before storing: `map.set('key', reactive(obj))`.
 *
 * **Readonly preservation**: Array and tuple `readonly` modifiers are preserved
 * — `readonly string[]` stays `readonly`, `string[]` stays mutable. Tuples
 * retain their length and per-position types. Plain objects use `-readonly`
 * because `reactive()` makes their properties writable.
 *
 * @template T
 */
export type DeepReactive<T> =
  T extends ReactiveBuiltin | Signal<any>
    ? T
    : T extends readonly any[]                              // arrays & tuples (readonly or mutable)
      ? { [K in keyof T]: DeepReactive<T[K]> }              // preserve readonly modifier, recurse elements
      : T extends object                                    // plain objects
        ? { -readonly [K in keyof T]: DeepReactive<T[K]> }  // make writable, recurse properties
        : T;

/**
 * Create a deep reactive proxy over a plain object or array.
 * Property reads/writes transparently track and trigger the underlying signal.
 * Nested objects are also wrapped — reads return reactive sub-proxies.
 */
export declare function reactive<T extends object>(
  obj: T
): DeepReactive<T> & {
  /** Clear all subscribers on the underlying signal. */
  dispose?: () => void;
  /** @internal Underlying signal. */
  _signal?: Signal<T>;
};

/**
 * Create a shallow reactive proxy over a plain object or array.
 *
 * Only the first-level properties are reactive — nested objects are NOT wrapped
 * and remain plain objects. This is useful for state objects with nested
 * signals or computed values where deep reactivity is unnecessary and wasteful.
 *
 * @template T
 */
export declare function shallowReactive<T extends object>(obj: T): T;

/** Check whether an object is a reactive proxy created by `reactive()`. */
export declare function isReactive(obj: any): boolean;

/** Return the original object for a reactive proxy. */
export declare function toRaw<T>(obj: T): T;

/** Run a function without collecting reactive dependencies. */
export declare function withoutTracking<T>(fn: () => T): T;

/** Handle errors raised by scheduled jobs and synchronous reactive triggers. */
export declare function setErrorHandler(
  handler: ((error: unknown, context: { source: string, phase: string, scheduler?: string }) => void) | null
): () => void;

/** Return the currently configured global error handler, if any. */
export declare function getErrorHandler():
  ((error: unknown, context: { source: string, phase: string, scheduler?: string }) => void) | null;

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

export interface EffectOptions {
  /** Run once when the effect is disposed. */
  onDispose?: () => void;
  /** Run when dependencies change, before the effect re-runs. Useful for cancelling async operations. */
  onInvalidate?: () => void;
  /** Scheduler phase. Defaults to `pre`. */
  flush?: 'sync' | 'pre' | 'post';
  /** Optional isolated scheduler instance. */
  scheduler?: Scheduler | null;
}

export interface Scheduler {
  queueJob(job: () => void): void;
  queuePostJob(job: () => void): void;
  /** Run a high-priority job ahead of regular and post queues. */
  queuePriorityJob(job: () => void): void;
  /** Run a low-priority job when the browser is idle. Returns a cancel function. */
  queueIdleJob(job: () => void): () => void;
  cancelIdleJob(job: () => void): void;
  flushJobs(): void;
  nextTick<T>(callback?: () => T): Promise<T | undefined>;
  reset(): void;
}

export interface SchedulerOptions {
  maxJobs?: number;
  name?: string;
  onError?: ((error: unknown, context: { source: string, phase: string, scheduler?: string }) => void) | null;
}

/** Create an isolated scheduler for an app or SSR request. */
export declare function createScheduler(options?: SchedulerOptions): Scheduler;

/** Return the scheduler inherited by effects created in the current setup context. */
export declare function getCurrentScheduler(): Scheduler | null;

/** Create effects in a synchronous setup callback with an isolated scheduler. */
export declare function runWithScheduler<T>(scheduler: Scheduler | null, fn: () => T): T;

/** Explicit lifecycle scope for a group of effects. */
export interface EffectScope {
  /** Create effects in this scope while running the callback. */
  run<T>(fn: () => T): T;
  /** Dispose every effect and child scope in this scope. */
  stop(): void;
}

/** Create an explicit lifecycle scope for related effects. */
export declare function effectScope(): EffectScope;

/** Register a generic resource cleanup in the active effect scope. */
export declare function onScopeDispose(cleanup: () => void): () => void;

/**
 * Create a reactive effect.
 *
 * The function is executed immediately. Any signal read during execution is
 * tracked; when those signals change, the function re-executes.
 *
 * @returns Dispose function — call to stop the effect.
 */
export declare function effect(fn: () => void | Dispose, options?: EffectOptions): Dispose;

export interface WatchOptions {
  /** If true, call callback immediately with the current value. */
  immediate?: boolean;
  /** If true, track nested reactive reads and compare structural snapshots. */
  deep?: boolean;
  /** Scheduler phase. Defaults to `pre`. */
  flush?: 'sync' | 'pre' | 'post';
  /** Optional isolated scheduler instance. */
  scheduler?: Scheduler | null;
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
  callback: (newValue: T, oldValue: T | undefined, onCleanup: (cleanup: Dispose) => void) => void | Dispose,
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

export declare namespace batch {
  /**
   * Execute a function inside an atomic batch transaction. If the function
   * throws, all signal writes performed during the transaction are rolled
   * back to their original values and no deferred effects are flushed.
   *
   * @returns The return value of `fn`.
   */
  function atomic<T>(fn: () => T): T;
}

// ── Scheduler (internal, used by @kupola/platform) ───────────────────────────

/** Schedule a job to run in the next microtask. Duplicate references are deduplicated. */
export declare function queueJob(job: () => void): void;

/** Schedule a deduplicated job after regular jobs in the current tick. */
export declare function queuePostJob(job: () => void): void;

/** Run a high-priority job ahead of regular and post queues. */
export declare function queuePriorityJob(job: () => void): void;

/** Run a low-priority job when the browser is idle. Returns a cancel function. */
export declare function queueIdleJob(job: () => void): () => void;

/** Cancel a pending idle job. */
export declare function cancelIdleJob(job: () => void): void;

/** Immediately flush all pending jobs synchronously. */
export declare function flushJobs(): void;

/** Run a callback after flushing all pending jobs in the next microtask. */
export declare function nextTick<T>(callback?: () => T): Promise<T | undefined>;
