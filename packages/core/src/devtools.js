// SPDX-License-Identifier: MIT
/**
 * @kupola/core — DevTools: Signal reactivity profiler.
 *
 * Provides performance profiling for the Kupola reactivity system.
 * Tracks signal reads, writes, effect runs, and computed recomputes.
 *
 * Usage:
 * ```js
 * import { enableProfiler, getProfileReport, resetProfiler } from '@kupola/core/devtools';
 *
 * enableProfiler();
 * // ... run your app ...
 * const report = getProfileReport();
 * console.table(report.signals);
 * console.table(report.effects);
 * resetProfiler();
 * ```
 *
 * In dev mode, `window.__KUPOLA_SIGNALS__` provides a live signal registry
 * for debugging: `window.__KUPOLA_SIGNALS__.list()` returns all registered
 * signals with their labels, values, and creation stacks.
 *
 * @module devtools
 */

/* global __DEV__ */
const _devMode = typeof __DEV__ === 'undefined' || __DEV__;

// ── Profiler state ──────────────────────────────────────────────────────────

let _enabled = false;
let _startTime = 0;

/** @type {Map<number, {reads: number, writes: number, triggers: number, label: string, creationStack?: string}>} */
const _signalStats = new Map();

/** @type {Map<number, {runs: number, totalTime: number, maxTime: number, label: string}>} */
const _effectStats = new Map();

/** @type {Map<number, {recomputes: number, totalTime: number, maxTime: number, label: string}>} */
const _computedStats = new Map();

let _nextSignalId = 0;
let _nextEffectId = 0;
let _nextComputedId = 0;

/** @type {number} Total trigger count across all signals. */
let _totalTriggers = 0;

/** @type {number} Total effect runs. */
let _totalEffectRuns = 0;

/** @type {number} Total computed recomputes. */
let _totalComputedRecomputes = 0;

// ── Signal ID registry ──────────────────────────────────────────────────────

/** @type {WeakMap<Object, number>} Maps signal/computed/effect instances to IDs. */
let _idMap = new WeakMap();

// ── Global signal registry (dev mode) ───────────────────────────────────────

/**
 * Registry of all created signals for debugging.
 * @type {Array<{id: number, signal: Object, label: string, creationStack?: string}>}
 */
const _signalRegistry = [];

/**
 * Get a snapshot of all registered signals.
 * @returns {Array<{id: number, label: string, value: any, creationStack?: string}>}
 */
export function getSignalRegistry() {
  return _signalRegistry.map(entry => ({
    id: entry.id,
    label: entry.label,
    value: entry.signal?.peek ? entry.signal.peek() : entry.signal?._value,
    ...(entry.creationStack ? { creationStack: entry.creationStack } : {}),
  }));
}

// Expose on window in dev mode for console debugging.
if (_devMode && typeof globalThis !== 'undefined' && globalThis.window) {
  globalThis.window.__KUPOLA_SIGNALS__ = {
    list: getSignalRegistry,
    findByLabel: (label) => _signalRegistry.filter(e => e.label === label),
    count: () => _signalRegistry.length,
  };
}

function clearProfilerData() {
  _signalStats.clear();
  _effectStats.clear();
  _computedStats.clear();
  _signalRegistry.length = 0;
  _nextSignalId = 0;
  _nextEffectId = 0;
  _nextComputedId = 0;
  // IDs belong to one profiling session. Reusing the old WeakMap would let
  // objects from an earlier session collide with new objects after reset.
  _idMap = new WeakMap();
}

function getOrCreateId(obj, counter) {
  if (!_idMap.has(obj)) {
    _idMap.set(obj, counter);
    return counter;
  }
  return _idMap.get(obj);
}

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Enable the reactivity profiler. Call this before running your application
 * to start collecting performance data.
 *
 * @param {Object} [options]
 * @param {boolean} [options.console=false]  Log events to console in real-time
 */
export function enableProfiler(options = {}) {
  _enabled = true;
  _startTime = performance.now();
  clearProfilerData();
  _totalTriggers = 0;
  _totalEffectRuns = 0;
  _totalComputedRecomputes = 0;
  if (options.console) {
    console.log('[Kupola Profiler] Enabled');
  }
}

/**
 * Disable the profiler and stop collecting data.
 */
export function disableProfiler() {
  _enabled = false;
}

/**
 * Reset all profiler data. Call between profiling sessions.
 */
export function resetProfiler() {
  _enabled = false;
  _startTime = 0;
  clearProfilerData();
  _totalTriggers = 0;
  _totalEffectRuns = 0;
  _totalComputedRecomputes = 0;
}

/**
 * Check if profiler is enabled.
 * @returns {boolean}
 */
export function isProfilerEnabled() {
  return _enabled;
}

// ── Tracking functions (called by signal/effect/computed internals) ──────────

/**
 * Record signal creation with a stack trace for debugging.
 * Called from signal() factory when profiler is enabled.
 * @param {Object} sig  The Signal instance
 * @param {string} [label]  Optional label for the signal
 */
export function profileSignalCreation(sig, label) {
  const id = getOrCreateId(sig, _nextSignalId);
  if (id >= _nextSignalId) {_nextSignalId = id + 1;}

  let creationStack;
  // Always register in the global signal registry (dev mode).
  if (_devMode) {
    const stack = new Error().stack;
    if (stack) {
      const lines = stack.split('\n');
      creationStack = lines.slice(3).join('\n');
    }
    _signalRegistry.push({ id, signal: sig, label: label || `signal#${id}`, creationStack });
  }

  // Only collect profiling stats when profiler is enabled.
  if (!_enabled) {return;}
  if (!_signalStats.has(id)) {
    _signalStats.set(id, { reads: 0, writes: 0, triggers: 0, label: label || `signal#${id}` });
    if (creationStack) {_signalStats.get(id).creationStack = creationStack;}
  }
}

/**
 * Remove a signal from the global registry when it is disposed.
 * This prevents unbounded memory growth in dev mode.
 * @param {Object} sig  The Signal instance
 */
export function unregisterSignal(sig) {
  if (!_devMode) {return;}
  for (let i = _signalRegistry.length - 1; i >= 0; i--) {
    if (_signalRegistry[i].signal === sig) {
      _signalRegistry.splice(i, 1);
      break;
    }
  }
}

/**
 * Record a signal write (set .value).
 * @param {Object} sig  The Signal instance
 * @param {string} [label]  Optional label for the signal
 */
export function profileSignalWrite(sig, label) {
  if (!_enabled) {return;}
  const id = getOrCreateId(sig, _nextSignalId);
  if (!_signalStats.has(id)) {
    _signalStats.set(id, { reads: 0, writes: 0, triggers: 0, label: label || `signal#${id}` });
    if (id >= _nextSignalId) {_nextSignalId = id + 1;}
  }
  const stats = _signalStats.get(id);
  stats.writes++;
}

/**
 * Record a signal read (get .value inside effect).
 * @param {Object} sig  The Signal instance
 * @param {string} [label]  Optional label
 */
export function profileSignalRead(sig, label) {
  if (!_enabled) {return;}
  const id = getOrCreateId(sig, _nextSignalId);
  if (!_signalStats.has(id)) {
    _signalStats.set(id, { reads: 0, writes: 0, triggers: 0, label: label || `signal#${id}` });
    if (id >= _nextSignalId) {_nextSignalId = id + 1;}
  }
  _signalStats.get(id).reads++;
}

/**
 * Record a trigger (signal notifying subscribers).
 * @param {Object} sig  The Signal instance
 * @param {number} subscriberCount  Number of subscribers notified
 */
export function profileTrigger(sig, subscriberCount) {
  if (!_enabled) {return;}
  const id = getOrCreateId(sig, _nextSignalId);
  if (_signalStats.has(id)) {
    _signalStats.get(id).triggers += subscriberCount;
  }
  _totalTriggers += subscriberCount;
}

/**
 * Record an effect execution with timing.
 * @param {Object} eff  The EffectRecord
 * @param {Function} fn  The effect function to run
 * @param {string} [label]  Optional label
 * @returns {*} The return value of fn
 */
export function profileEffectRun(eff, fn, label) {
  if (!_enabled) {
    return fn();
  }
  const id = getOrCreateId(eff, _nextEffectId);
  if (!_effectStats.has(id)) {
    _effectStats.set(id, { runs: 0, totalTime: 0, maxTime: 0, label: label || `effect#${id}` });
    if (id >= _nextEffectId) {_nextEffectId = id + 1;}
  }
  const stats = _effectStats.get(id);
  const t0 = performance.now();
  const result = fn();
  const elapsed = performance.now() - t0;
  stats.runs++;
  stats.totalTime += elapsed;
  if (elapsed > stats.maxTime) {stats.maxTime = elapsed;}
  _totalEffectRuns++;
  return result;
}

/**
 * Record a computed recomputation with timing.
 * @param {Object} comp  The computed instance
 * @param {Function} fn  The compute function
 * @param {string} [label]  Optional label
 * @returns {*} The computed result
 */
export function profileComputedRun(comp, fn, label) {
  if (!_enabled) {
    return fn();
  }
  const id = getOrCreateId(comp, _nextComputedId);
  if (!_computedStats.has(id)) {
    _computedStats.set(id, { recomputes: 0, totalTime: 0, maxTime: 0, label: label || `computed#${id}` });
    if (id >= _nextComputedId) {_nextComputedId = id + 1;}
  }
  const stats = _computedStats.get(id);
  const t0 = performance.now();
  const result = fn();
  const elapsed = performance.now() - t0;
  stats.recomputes++;
  stats.totalTime += elapsed;
  if (elapsed > stats.maxTime) {stats.maxTime = elapsed;}
  _totalComputedRecomputes++;
  return result;
}

// ── Report generation ───────────────────────────────────────────────────────

/**
 * Generate a profiling report.
 *
 * @returns {{
 *   duration: number,
 *   totalTriggers: number,
 *   totalEffectRuns: number,
 *   totalComputedRecomputes: number,
 *   signals: Array<{label: string, reads: number, writes: number, triggers: number, creationStack?: string}>,
 *   effects: Array<{label: string, runs: number, totalTime: string, maxTime: string, avgTime: string}>,
 *   computeds: Array<{label: string, recomputes: number, totalTime: string, maxTime: string, avgTime: string}>,
 * }}
 */
export function getProfileReport() {
  const duration = _startTime > 0 ? performance.now() - _startTime : 0;

  const signals = [];
  for (const [ , s ] of _signalStats) {
    signals.push({
      label: s.label,
      reads: s.reads,
      writes: s.writes,
      triggers: s.triggers,
      ...(s.creationStack ? { creationStack: s.creationStack } : {}),
    });
  }

  const effects = [];
  for (const [ , s ] of _effectStats) {
    const avg = s.runs > 0 ? s.totalTime / s.runs : 0;
    effects.push({
      label: s.label,
      runs: s.runs,
      totalTime: s.totalTime.toFixed(2) + 'ms',
      maxTime: s.maxTime.toFixed(3) + 'ms',
      avgTime: avg.toFixed(3) + 'ms',
    });
  }

  const computeds = [];
  for (const [ , s ] of _computedStats) {
    const avg = s.recomputes > 0 ? s.totalTime / s.recomputes : 0;
    computeds.push({
      label: s.label,
      recomputes: s.recomputes,
      totalTime: s.totalTime.toFixed(2) + 'ms',
      maxTime: s.maxTime.toFixed(3) + 'ms',
      avgTime: avg.toFixed(3) + 'ms',
    });
  }

  return {
    duration: Math.round(duration),
    totalTriggers: _totalTriggers,
    totalEffectRuns: _totalEffectRuns,
    totalComputedRecomputes: _totalComputedRecomputes,
    signals,
    effects,
    computeds,
  };
}

/**
 * Print a human-readable profiling summary to the console.
 */
export function printProfileReport() {
  const report = getProfileReport();
  console.log('═══════════════════════════════════════════════════════');
  console.log('  Kupola Reactivity Profile Report');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`  Duration:            ${report.duration}ms`);
  console.log(`  Total triggers:      ${report.totalTriggers}`);
  console.log(`  Total effect runs:   ${report.totalEffectRuns}`);
  console.log(`  Total recomputes:    ${report.totalComputedRecomputes}`);
  console.log('───────────────────────────────────────────────────────');
  if (report.signals.length > 0) {
    console.log('  Signals:');
    console.table(report.signals);
  }
  if (report.effects.length > 0) {
    console.log('  Effects:');
    console.table(report.effects);
  }
  if (report.computeds.length > 0) {
    console.log('  Computeds:');
    console.table(report.computeds);
  }
  console.log('═══════════════════════════════════════════════════════');
}

// ── DevTools Extension Protocol ──────────────────────────────────────────────

const _devtoolsListeners = new Map();
let _messageListenerInstalled = false;
let _exposedAPI = null;
let _exposedCleanup = null;

function installMessageListener() {
  if (typeof window === 'undefined' || _messageListenerInstalled) {return;}
  window.addEventListener('message', _handleDevToolsMessage);
  _messageListenerInstalled = true;
}

function removeMessageListenerIfUnused() {
  if (typeof window === 'undefined'
    || !_messageListenerInstalled
    || _exposedAPI
    || _devtoolsListeners.size > 0) {return;}
  window.removeEventListener('message', _handleDevToolsMessage);
  _messageListenerInstalled = false;
}

function _sendToDevTools(message) {
  if (typeof window !== 'undefined' && window.__KUPOLA_DEVTOOLS__) {
    window.__KUPOLA_DEVTOOLS__.postMessage(message);
  }
}

function _handleDevToolsMessage(event) {
  if (event.source !== window) {return;}
  const { type: rawType, payload } = event.data || {};
  if (typeof rawType !== 'string') {return;}
  const type = rawType.startsWith('kupola:') ? rawType.slice(7) : rawType;
  const handlers = _devtoolsListeners.get(type) || [];
  for (const handler of [ ...handlers ]) {
    try {handler(payload);} catch (error) {
      // A DevTools observer must not break the application's message event.
      queueMicrotask(() => {throw error;});
    }
  }
}

export function onDevToolsMessage(type, handler) {
  if (typeof type !== 'string' || type.length === 0 || typeof handler !== 'function') {
    throw new TypeError('[kupola] onDevToolsMessage() expects a type and handler.');
  }
  const handlers = _devtoolsListeners.get(type) || [];
  handlers.push(handler);
  _devtoolsListeners.set(type, handlers);
  installMessageListener();
  return () => {
    const currentHandlers = _devtoolsListeners.get(type) || [];
    const remaining = currentHandlers.filter(h => h !== handler);
    if (remaining.length > 0) {_devtoolsListeners.set(type, remaining);}
    else {_devtoolsListeners.delete(type);}
    removeMessageListenerIfUnused();
  };
}

export function sendDevToolsMessage(type, payload = {}) {
  if (typeof type !== 'string' || type.length === 0) {
    throw new TypeError('[kupola] sendDevToolsMessage() expects a non-empty type.');
  }
  _sendToDevTools({ type: `kupola:${type}`, payload });
}

export function exposeDevToolsAPI() {
  if (typeof window === 'undefined') {return;}

  if (_exposedAPI && window.__KUPOLA__ === _exposedAPI && _exposedCleanup) {
    return _exposedCleanup;
  }
  if (_exposedCleanup) {_exposedCleanup();}

  installMessageListener();

  const api = {
    enableProfiler,
    disableProfiler,
    resetProfiler,
    getProfileReport,
    printProfileReport,
    isProfilerEnabled,
    sendMessage: sendDevToolsMessage,
    onMessage: onDevToolsMessage,
  };
  _exposedAPI = api;
  window.__KUPOLA__ = api;

  console.log('[Kupola] DevTools API exposed. Use window.__KUPOLA__ to access.');
  let cleaned = false;
  const cleanup = () => {
    if (cleaned) {return;}
    cleaned = true;
    if (window.__KUPOLA__ === api) {delete window.__KUPOLA__;}
    if (_exposedAPI === api) {_exposedAPI = null;}
    if (_exposedCleanup === cleanup) {_exposedCleanup = null;}
    removeMessageListenerIfUnused();
  };
  _exposedCleanup = cleanup;
  return cleanup;
}
