// SPDX-License-Identifier: MIT
/* global __DEV__ */
/**
 * @kupola/core - Signal and reactive object primitives.
 *
 * Signals provide dependency tracking. Reactive objects use one dependency
 * signal per property plus an iteration signal, so unrelated properties do
 * not invalidate the same effect.
 *
 * @module signal
 */

import { queueJob, queuePostJob } from './scheduler.js';
import {
  isProfilerEnabled,
  profileSignalWrite,
  profileSignalRead,
  profileSignalCreation,
  profileTrigger,
  unregisterSignal,
} from './devtools.js';
import { reportErrors } from './errors.js';

/** @type {import('./effect.js').EffectRecord|null} */
let activeEffect = null;

const profilerInstrumentationEnabled = typeof __DEV__ === 'undefined' || __DEV__;
const defaultTriggerMaxJobs = 10000;

/** @type {import('./effect.js').EffectRecord[]} */
const effectStack = [];

// ─── Atomic batch integration (added by batch.atomic) ────────────────────

/**
 * Whether the current run is inside an atomic transaction that requires
 * signal mutation snapshots. Set to true by {@link setAtomicTracking} when
 * an atomic transaction is registered.
 *
 * The active atomic context lookup is injected lazily from batch.js via
 * {@link setAtomicTracking} to avoid a circular import between the two
 * modules. The hot path in `enqueueTriggerSubscribers` tests only a
 * single boolean so the overhead is negligible.
 */
let _findActiveAtomicContext = () => null;

/** @internal Called once by batch.js on module load to wire up atomic tracking. */
export function setAtomicTracking(findFn) {
  if (typeof findFn !== 'function') {
    throw new TypeError('[kupola] setAtomicTracking expects a function.');
  }
  _findActiveAtomicContext = findFn;
}

/** @internal @returns {boolean} Whether an atomic transaction is active. */
function _hasActiveAtomicContext() {
  return _findActiveAtomicContext() !== null;
}

/** @type {{ root: Signal, pendingComputeds: Set<Object>, pendingEffects: Set<Object> }|null} */
let activeTriggerContext = null;

/** @internal @returns {{ root: Signal, pendingComputeds: Set<Object>, pendingEffects: Set<Object> }|null} */
export function getTriggerContext() {
  return activeTriggerContext;
}

function createTriggerContext(root, mutation = false) {
  return {
    root,
    mutation,
    jobCount: 0,
    pendingComputeds: new Set(),
    pendingEffects: new Set(),
  };
}

/** @param {import('./effect.js').EffectRecord} eff */
export function pushEffect(eff) {
  effectStack.push(activeEffect);
  activeEffect = eff;
}

export function popEffect() {
  activeEffect = effectStack.pop() ?? null;
}

/** @param {Function} fn */
export function withoutTracking(fn) {
  if (typeof fn !== 'function') {
    throw new TypeError('[kupola] withoutTracking() expects a function.');
  }
  const previous = activeEffect;
  activeEffect = null;
  try {
    return fn();
  } finally {
    activeEffect = previous;
  }
}

/** @type {number} */
export let batchDepth = 0;

/** @type {Set<Function>} */
const batchQueue = new Set();

/** @internal */
export function setBatchDepth(depth) {
  batchDepth = depth;
}

export function getBatchQueue() {
  return batchQueue;
}

/** @param {Signal} sig */
export function track(sig) {
  if (activeEffect && !sig._disposed) {
    sig._subscribers.add(activeEffect);
    activeEffect._deps.add(sig);
  }
}

/** @param {Signal} sig @param {Object} eff */
export function unsubscribe(sig, eff) {
  sig._subscribers.delete(eff);
  if (sig._subscribers.size === 0 && typeof sig._onEmpty === 'function') {
    sig._onEmpty();
  }
}

function enqueueTriggerSubscribers(sig, context) {
  const subscribers = [ ...sig._subscribers ].filter(eff => !eff._disposed);
  // Keep profiler counts tied to the signal's actual subscriber snapshot,
  // even though execution is deferred until the propagation transaction ends.
  if (profilerInstrumentationEnabled && isProfilerEnabled()) {
    profileTrigger(sig, subscribers.length);
  }
  for (const eff of subscribers) {
    if (eff._isComputed) {context.pendingComputeds.add(eff);}
    else {context.pendingEffects.add(eff);}
  }
}

function dispatchEffect(eff) {
  if (eff._sync) {
    eff._run();
  } else if (batchDepth > 0) {
    batchQueue.add(eff._run);
  } else if (eff._scheduler) {
    if (eff._flush === 'post') {eff._scheduler.queuePostJob(eff._run);}
    else {eff._scheduler.queueJob(eff._run);}
  } else if (eff._flush === 'post') {
    queuePostJob(eff._run);
  } else {
    queueJob(eff._run);
  }
}

function flushTriggerContext(context) {
  const errors = [];
  let loopDetected = false;
  // Drain the whole transaction. A synchronous effect can mutate another
  // signal, which may enqueue more computeds or effects while the current
  // wave is executing. Leaving those entries behind loses the update because
  // the outer trigger has already restored its context by the time it
  // returns.
  while (context.pendingComputeds.size > 0 || context.pendingEffects.size > 0) {
    // Each computed wave settles before effects read them. This prevents a
    // converging computed graph from observing a mixed state when multiple
    // upstream computeds change in one source mutation.
    while (context.pendingComputeds.size > 0) {
      const computeds = [ ...context.pendingComputeds ];
      context.pendingComputeds.clear();
      for (const computedTracker of computeds) {
        if (computedTracker._disposed) {continue;}
        if (context.jobCount >= defaultTriggerMaxJobs) {
          loopDetected = true;
          break;
        }
        context.jobCount++;
        try {computedTracker._run();} catch (error) {errors.push(error);}
      }
      if (loopDetected) {break;}
    }

    if (loopDetected) {break;}

    const effects = [ ...context.pendingEffects ];
    context.pendingEffects.clear();
    for (const eff of effects) {
      if (eff._disposed) {continue;}
      if (context.jobCount >= defaultTriggerMaxJobs) {
        loopDetected = true;
        break;
      }
      context.jobCount++;
      try {dispatchEffect(eff);} catch (error) {errors.push(error);}
    }
    if (loopDetected) {break;}
  }
  if (loopDetected) {
    context.pendingComputeds.clear();
    context.pendingEffects.clear();
    const error = new Error(
      `[kupola] Reactive propagation exceeded the maximum of ${defaultTriggerMaxJobs} jobs in one transaction.`,
    );
    error.code = 'KUPOLA_REACTIVITY_LOOP';
    errors.push(error);
  }
  reportErrors(errors, { source: 'reactivity', phase: 'trigger' });
}

function runTriggerTransaction(context, fn) {
  const ownsContext = activeTriggerContext !== context;
  const previousContext = activeTriggerContext;
  if (ownsContext) {activeTriggerContext = context;}
  let result;
  let callbackError;
  try {
    result = fn();
  } catch (error) {
    callbackError = error;
  }
  let flushError;
  if (ownsContext) {
    try {flushTriggerContext(context);} catch (error) {flushError = error;}
    activeTriggerContext = previousContext;
  }
  if (callbackError) {throw callbackError;}
  if (flushError) {throw flushError;}
  return result;
}

/**
 * Notify subscribers from a snapshot. A subscriber may change its own
 * dependencies while running, so iterating the live Set would be unsafe.
 *
 * @param {Signal} sig
 */
export function trigger(sig, context = null) {
  const triggerContext = context || activeTriggerContext || createTriggerContext(sig);
  const ownsContext = activeTriggerContext !== triggerContext;
  const previousContext = activeTriggerContext;
  if (ownsContext) {activeTriggerContext = triggerContext;}
  try {
    enqueueTriggerSubscribers(sig, triggerContext);
    if (ownsContext) {flushTriggerContext(triggerContext);}
  } finally {
    if (ownsContext) {activeTriggerContext = previousContext;}
  }
}

/**
 * @template T
 */
export class Signal {
  /** @param {T} initialValue */
  constructor(initialValue) {
    /** @internal */ this._value = initialValue;
    /** @internal */ this._subscribers = new Set();
    /** @internal */ this._disposed = false;
  }

  get value() {
    track(this);
    if (profilerInstrumentationEnabled && isProfilerEnabled()) {profileSignalRead(this);}
    return this._value;
  }

  set value(newValue) {
    if (this._disposed || Object.is(this._value, newValue)) {return;}
    // Snapshot the original value before mutation when inside an atomic
    // transaction so that batch.atomic can roll back on failure.
    const snapshotCtx = _findActiveAtomicContext();
    if (snapshotCtx && !snapshotCtx._atomicSnapshots.has(this)) {
      snapshotCtx._atomicSnapshots.set(this, this._value);
    }
    this._value = newValue;
    if (profilerInstrumentationEnabled && isProfilerEnabled()) {profileSignalWrite(this);}
    trigger(this);
  }

  peek() {
    return this._value;
  }

  /**
   * Permanently dispose this signal, releasing all subscriber references.
   * After disposal, reads no longer register dependencies and writes are
   * silently ignored. Use this to free memory when a signal is no longer
   * needed, especially for long-lived scopes that create many signals.
   */
  dispose() {
    if (this._disposed) {return;}
    this._disposed = true;
    unregisterSignal(this);
    for (const eff of this._subscribers) {
      if (eff && eff._deps) {
        eff._deps.delete(this);
      }
    }
    this._subscribers.clear();
  }

  toString() {
    return String(this._value);
  }

  toJSON() {
    return this._value;
  }
}

export function signal(initialValue, options) {
  const sig = new Signal(initialValue);
  if (profilerInstrumentationEnabled) {
    profileSignalCreation(sig, options?.label);
  }
  return sig;
}

const REACTIVE_SYMBOL = Symbol('kupola-reactive');
const ITERATE_KEY = Symbol('kupola-reactive-iterate');
const ARRAY_MUTATION_METHODS = new Set([
  'push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse', 'fill', 'copyWithin',
]);
const rawToProxy = new WeakMap();
const proxyToRaw = new WeakMap();
const proxyToMeta = new WeakMap();

function isObject(value) {
  return value !== null && typeof value === 'object';
}

function isPlainObject(value) {
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function isSupportedReactiveTarget(value) {
  if (!isObject(value) || value instanceof Signal || isReactive(value)) {return false;}
  if (Array.isArray(value)) {return true;}
  if (ArrayBuffer.isView(value) || value instanceof ArrayBuffer) {return false;}
  return isPlainObject(value);
}

export function isReactive(value) {
  if (value === null || (typeof value !== 'object' && typeof value !== 'function')) {
    return false;
  }
  try {
    return Boolean(value[REACTIVE_SYMBOL] === true);
  } catch {
    return false;
  }
}

export function toRaw(value) {
  return isObject(value) ? (proxyToRaw.get(value) || value) : value;
}

function isArrayIndex(key) {
  if (typeof key !== 'string' || key === '') {return false;}
  const index = Number(key);
  return Number.isInteger(index) && index >= 0 && String(index) === key;
}

function createRoot(target) {
  const root = {
    signal: new Signal(target),
    metas: new Set(),
    proxies: new WeakMap(),
    rootMeta: null,
    disposed: false,
    dispose() {
      if (root.disposed) {return;}
      root.disposed = true;
      root.signal._disposed = true;
      root.signal._subscribers.clear();
      const ownedMetas = [ ...root.metas ];
      root.metas.clear();
      for (const meta of ownedMetas) {
        meta.owners.delete(root);
        meta.rootOwners.delete(root);
        updatePrimaryRoot(meta);
      }
      for (const meta of ownedMetas) {
        if (meta.owners.size === 0 && meta.rootOwners.size === 0) {
          disposeReactiveMeta(meta);
        }
      }
    },
  };
  return root;
}

function getPropertySignal(meta, key) {
  let sig = meta.signals.get(key);
  if (!sig) {
    sig = new Signal(undefined);
    sig._disposed = meta.disposed;
    sig._onEmpty = () => {
      if (meta.signals.get(key) === sig) {meta.signals.delete(key);}
    };
    meta.signals.set(key, sig);
  }
  return sig;
}

function trackProperty(meta, key) {
  if (activeEffect) {track(getPropertySignal(meta, key));}
}

function getIterationSignal(meta) {
  return getPropertySignal(meta, ITERATE_KEY);
}

function notifyProperty(meta, key, context) {
  const sig = meta.signals.get(key);
  if (!sig) {return;}
  if (profilerInstrumentationEnabled && isProfilerEnabled()) {profileSignalWrite(sig);}
  trigger(sig, context);
}

function notifyIteration(meta, context) {
  const sig = meta.signals.get(ITERATE_KEY);
  if (sig) {trigger(sig, context);}
}

function notifyArrayLength(meta, oldLength, newLength, changedKey, context) {
  if (oldLength === newLength) {return;}
  if (changedKey !== 'length') {
    const lengthSignal = meta.signals.get('length');
    if (lengthSignal) {trigger(lengthSignal, context);}
  }
  if (newLength < oldLength) {
    const removedChildren = [ ...meta.children.keys() ].filter(key => (
      isArrayIndex(key) && Number(key) >= newLength
    ));
    for (const key of removedChildren) {linkReactiveChild(meta, key, undefined);}
    const removedSignals = [ ...meta.signals.entries() ].filter(([ key ]) => (
      isArrayIndex(key) && Number(key) >= newLength
    ));
    for (const [ , signal ] of removedSignals) {trigger(signal, context);}
    // Truncating an array removes enumerable keys, so effects that observe
    // Object.keys()/for...in must be invalidated as well.
    notifyIteration(meta, context);
  }
}

function getReactiveMutationContext(meta, key) {
  if (activeTriggerContext && activeTriggerContext.mutation) {
    return activeTriggerContext;
  }
  return createTriggerContext(
    meta.signals.get(key) || meta.signals.get('length') || meta.localSignal,
    true,
  );
}

function createReactiveHandler(meta) {
  const { target } = meta;
  return {
    get(currentTarget, key, receiver) {
      const ownDescriptor = Reflect.getOwnPropertyDescriptor(currentTarget, key);
      // Virtual compatibility properties must never shadow an own property;
      // doing so violates Proxy invariants for frozen/sealed user objects.
      if (!ownDescriptor && key === REACTIVE_SYMBOL) {return true;}
      if (!ownDescriptor && key === '_signal') {
        return meta.root ? meta.root.signal : meta.localSignal;
      }
      if (!ownDescriptor && key === 'dispose') {
        return meta.root ? meta.root.dispose : () => disposeReactiveMeta(meta);
      }
      if (!ownDescriptor && key === 'toJSON') {return () => target;}

      const value = Reflect.get(currentTarget, key, receiver);
      if (meta.disposed) {return value;}
      trackProperty(meta, key);
      // A non-configurable, non-writable data property must return the exact
      // stored value. Returning a nested proxy here would violate the Proxy
      // get invariant for frozen/sealed objects.
      if (ownDescriptor && 'value' in ownDescriptor
        && ownDescriptor.configurable === false
        && ownDescriptor.writable === false) {
        return value;
      }
      if (Array.isArray(currentTarget)
        && typeof value === 'function'
        && ARRAY_MUTATION_METHODS.has(key)) {
        return (...args) => {
          const context = getReactiveMutationContext(meta, key);
          return runTriggerTransaction(context, () => Reflect.apply(value, receiver, args));
        };
      }
      if (!isSupportedReactiveTarget(value)) {return value;}
      const proxy = wrapReactive(value, meta.root);
      linkReactiveChild(meta, key, proxy);
      return proxy;
    },

    set(currentTarget, key, value) {
      const ownDescriptor = Reflect.getOwnPropertyDescriptor(currentTarget, key);
      if (!ownDescriptor && (key === REACTIVE_SYMBOL || key === '_signal' || key === 'dispose')) {
        return true;
      }
      const oldValue = currentTarget[key];
      const oldLength = Array.isArray(currentTarget) ? currentTarget.length : 0;
      const rawValue = toRaw(value);
      const hadKey = Object.prototype.hasOwnProperty.call(currentTarget, key);
      const result = Reflect.set(currentTarget, key, rawValue);
      if (!result || (hadKey && Object.is(oldValue, rawValue))) {return result;}

      if (meta.disposed) {return result;}

      linkReactiveChild(meta, key, rawValue);

      const context = getReactiveMutationContext(meta, key);
      runTriggerTransaction(context, () => {
        notifyProperty(meta, key, context);
        if (Array.isArray(currentTarget)) {
          const newLength = currentTarget.length;
          notifyArrayLength(meta, oldLength, newLength, key, context);
          if (key !== 'length' && !hadKey) {notifyIteration(meta, context);}
        } else if (!hadKey) {
          notifyIteration(meta, context);
        }
      });
      return result;
    },

    deleteProperty(currentTarget, key) {
      const hadKey = Object.prototype.hasOwnProperty.call(currentTarget, key);
      const result = Reflect.deleteProperty(currentTarget, key);
      if (result && hadKey) {
        if (meta.disposed) {return result;}
        linkReactiveChild(meta, key, undefined);
        const context = getReactiveMutationContext(meta, key);
        runTriggerTransaction(context, () => {
          notifyProperty(meta, key, context);
          notifyIteration(meta, context);
        });
      }
      return result;
    },

    has(currentTarget, key) {
      trackProperty(meta, key);
      return Reflect.has(currentTarget, key);
    },

    ownKeys(currentTarget) {
      if (activeEffect) {track(getIterationSignal(meta));}
      return Reflect.ownKeys(currentTarget);
    },

    getOwnPropertyDescriptor(currentTarget, key) {
      return Reflect.getOwnPropertyDescriptor(currentTarget, key);
    },

    defineProperty(currentTarget, key, descriptor) {
      const previous = Reflect.getOwnPropertyDescriptor(currentTarget, key);
      const hadKey = Boolean(previous);
      const oldLength = Array.isArray(currentTarget) ? currentTarget.length : 0;
      const normalizedDescriptor = 'value' in descriptor
        ? { ...descriptor, value: toRaw(descriptor.value) }
        : descriptor;
      const result = Reflect.defineProperty(currentTarget, key, normalizedDescriptor);
      const next = result ? Reflect.getOwnPropertyDescriptor(currentTarget, key) : null;
      if (!result || meta.disposed) {return result;}
      const valueChanged = Boolean(next && 'value' in next)
        && (!previous || !('value' in previous) || !Object.is(previous.value, next.value));
      const enumerableChanged = Boolean(previous && next)
        && previous.enumerable !== next.enumerable;
      if (!result) {return result;}

      linkReactiveChild(meta, key, next && 'value' in next ? next.value : undefined);
      const context = getReactiveMutationContext(meta, key);
      runTriggerTransaction(context, () => {
        if (!hadKey || valueChanged) {
          notifyProperty(meta, key, context);
        }
        if (Array.isArray(currentTarget)) {
          notifyArrayLength(meta, oldLength, currentTarget.length, key, context);
        }
        if (!hadKey || enumerableChanged) {notifyIteration(meta, context);}
      });
      return result;
    },
  };
}

function wrapReactive(value, root) {
  if (!isSupportedReactiveTarget(value)) {return value;}
  const existing = root && root.proxies.get(value);
  if (existing) {return existing;}
  const globallyCached = rawToProxy.get(value);
  if (globallyCached) {
    const meta = proxyToMeta.get(globallyCached);
    if (meta && !meta.disposed) {
      if (root) {root.proxies.set(value, globallyCached);}
      return globallyCached;
    }
    rawToProxy.delete(value);
  }

  const meta = {
    target: value,
    root,
    localSignal: new Signal(value),
    owners: new Set(),
    rootOwners: new Set(),
    parents: new Set(),
    children: new Map(),
    disposed: false,
    signals: new Map(),
    proxy: null,
  };
  const proxy = new Proxy(value, createReactiveHandler(meta));
  meta.proxy = proxy;
  if (root) {root.proxies.set(value, proxy);}
  rawToProxy.set(value, proxy);
  proxyToRaw.set(proxy, value);
  proxyToMeta.set(proxy, meta);
  return proxy;
}

function updatePrimaryRoot(meta) {
  const nextRoot = meta.owners.values().next().value || null;
  if (meta.root !== nextRoot) {meta.root = nextRoot;}
}

function addRootOwner(meta, root, visited = new Set()) {
  if (root.disposed || meta.disposed) {return;}
  if (visited.has(meta)) {return;}
  visited.add(meta);
  if (!meta.owners.has(root)) {
    meta.owners.add(root);
    root.metas.add(meta);
  }
  for (const child of meta.children.values()) {
    addRootOwner(child, root, visited);
  }
}

function hasRootPath(meta, root) {
  if (meta.rootOwners.has(root)) {return true;}
  for (const parent of meta.parents) {
    if (parent.owners.has(root)) {return true;}
  }
  return false;
}

function removeRootOwner(meta, root, visited = new Set()) {
  if (meta.disposed || !meta.owners.has(root) || visited.has(meta)) {return;}
  visited.add(meta);
  if (hasRootPath(meta, root)) {return;}
  meta.owners.delete(root);
  root.metas.delete(meta);
  updatePrimaryRoot(meta);
  for (const child of meta.children.values()) {
    removeRootOwner(child, root, visited);
  }
}

function linkReactiveChild(parent, key, childValue) {
  const childProxy = isReactive(childValue)
    ? childValue
    : isSupportedReactiveTarget(childValue)
      ? rawToProxy.get(toRaw(childValue))
      : null;
  const nextMeta = childProxy ? proxyToMeta.get(childProxy) : null;
  const previousMeta = parent.children.get(key) || null;
  if (previousMeta === nextMeta) {return;}

  if (previousMeta) {previousMeta.parents.delete(parent);}
  if (nextMeta && !nextMeta.disposed) {
    parent.children.set(key, nextMeta);
    nextMeta.parents.add(parent);
  } else {
    parent.children.delete(key);
  }

  for (const root of [ ...parent.owners ]) {
    if (previousMeta) {removeRootOwner(previousMeta, root);}
    if (nextMeta) {addRootOwner(nextMeta, root);}
  }
}

function disposeReactiveMeta(meta) {
  if (meta.disposed) {return;}
  meta.disposed = true;
  for (const sig of meta.signals.values()) {
    sig._disposed = true;
    sig._subscribers.clear();
  }
  if (meta.proxy && rawToProxy.get(meta.target) === meta.proxy) {
    rawToProxy.delete(meta.target);
  }
  for (const parent of [ ...meta.parents ]) {
    for (const [ key, child ] of parent.children) {
      if (child === meta) {parent.children.delete(key);}
    }
    meta.parents.delete(parent);
  }
  for (const child of [ ...meta.children.values() ]) {
    child.parents.delete(meta);
    if (child.owners.size === 0 && child.rootOwners.size === 0 && child.parents.size === 0) {
      disposeReactiveMeta(child);
    }
  }
  meta.children.clear();
  meta.owners.clear();
  meta.rootOwners.clear();
  meta.root = null;
  meta.localSignal._disposed = true;
  meta.localSignal._subscribers.clear();
  meta.signals.clear();
}

/**
 * Create a deep reactive proxy over plain objects and arrays. Built-in
 * objects with internal slots are intentionally returned unchanged.
 */
export function reactive(obj) {
  if (!isObject(obj) || obj instanceof Signal) {return obj;}
  if (isReactive(obj)) {return obj;}
  if (!isSupportedReactiveTarget(obj)) {return obj;}

  const existing = rawToProxy.get(obj);
  const existingMeta = existing ? proxyToMeta.get(existing) : null;
  if (existingMeta && !existingMeta.disposed && existingMeta.owners.size > 0) {
    return existing;
  }
  const root = createRoot(obj);
  const reactiveObj = existing || wrapReactive(obj, root);
  const meta = proxyToMeta.get(reactiveObj);
  root.proxies.set(obj, reactiveObj);
  root.rootMeta = meta;
  meta.rootOwners.add(root);
  addRootOwner(meta, root);
  // `_signal` and `dispose` are virtual properties handled by the proxy. The
  // underlying signal always retains the root target as its stable value.
  return reactiveObj;
}
