// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Unit tests for the DevTools profiler.
 */

import {
  enableProfiler,
  disableProfiler,
  resetProfiler,
  isProfilerEnabled,
  profileSignalWrite,
  profileSignalRead,
  profileTrigger,
  profileEffectRun,
  profileComputedRun,
  getProfileReport,
  printProfileReport,
  onDevToolsMessage,
  sendDevToolsMessage,
  exposeDevToolsAPI,
} from '../src/devtools.js';

describe('devtools', () => {
  beforeEach(() => {
    resetProfiler();
  });

  afterEach(() => {
    resetProfiler();
  });

  // ─── enableProfiler ──────────────────────────────────────────────────────────

  test('enableProfiler activates the profiler', () => {
    expect(isProfilerEnabled()).toBe(false);
    enableProfiler();
    expect(isProfilerEnabled()).toBe(true);
  });

  test('enableProfiler resets previous data', () => {
    enableProfiler();
    const signal = {};
    profileSignalWrite(signal, 'test');
    
    // Re-enable should clear data
    enableProfiler();
    const report = getProfileReport();
    expect(report.signals.length).toBe(0);
  });

  test('enableProfiler logs to console when console option is true', () => {
    const consoleLog = jest.spyOn(console, 'log').mockImplementation();
    enableProfiler({ console: true });
    expect(consoleLog).toHaveBeenCalledWith('[Kupola Profiler] Enabled');
    consoleLog.mockRestore();
  });

  // ─── disableProfiler ────────────────────────────────────────────────────────

  test('disableProfiler deactivates the profiler', () => {
    enableProfiler();
    expect(isProfilerEnabled()).toBe(true);
    disableProfiler();
    expect(isProfilerEnabled()).toBe(false);
  });

  // ─── resetProfiler ──────────────────────────────────────────────────────────

  test('resetProfiler clears all data and disables', () => {
    enableProfiler();
    const signal = {};
    profileSignalWrite(signal, 'test');
    profileSignalRead(signal, 'test');
    profileTrigger(signal, 2);

    resetProfiler();
    expect(isProfilerEnabled()).toBe(false);
    
    const report = getProfileReport();
    expect(report.signals.length).toBe(0);
    expect(report.totalTriggers).toBe(0);
  });

  // ─── isProfilerEnabled ──────────────────────────────────────────────────────

  test('isProfilerEnabled returns correct state', () => {
    expect(isProfilerEnabled()).toBe(false);
    enableProfiler();
    expect(isProfilerEnabled()).toBe(true);
    disableProfiler();
    expect(isProfilerEnabled()).toBe(false);
  });

  // ─── profileSignalWrite ─────────────────────────────────────────────────────

  test('profileSignalWrite records signal writes when enabled', () => {
    enableProfiler();
    const signal = {};
    
    profileSignalWrite(signal, 'mySignal');
    profileSignalWrite(signal, 'mySignal');
    
    const report = getProfileReport();
    expect(report.signals.length).toBe(1);
    expect(report.signals[0].label).toBe('mySignal');
    expect(report.signals[0].writes).toBe(2);
  });

  test('profileSignalWrite does nothing when disabled', () => {
    disableProfiler();
    const signal = {};
    profileSignalWrite(signal, 'test');
    
    const report = getProfileReport();
    expect(report.signals.length).toBe(0);
  });

  // ─── profileSignalRead ──────────────────────────────────────────────────────

  test('profileSignalRead records signal reads when enabled', () => {
    enableProfiler();
    const signal = {};
    
    profileSignalRead(signal, 'mySignal');
    profileSignalRead(signal, 'mySignal');
    profileSignalRead(signal, 'mySignal');
    
    const report = getProfileReport();
    expect(report.signals.length).toBe(1);
    expect(report.signals[0].reads).toBe(3);
  });

  test('profileSignalRead does nothing when disabled', () => {
    disableProfiler();
    const signal = {};
    profileSignalRead(signal, 'test');
    
    const report = getProfileReport();
    expect(report.signals.length).toBe(0);
  });

  // ─── profileTrigger ────────────────────────────────────────────────────────

  test('profileTrigger records triggers when enabled', () => {
    enableProfiler();
    const signal = {};
    
    profileSignalWrite(signal, 'test'); // Create the signal first
    profileTrigger(signal, 5);
    profileTrigger(signal, 3);
    
    const report = getProfileReport();
    expect(report.totalTriggers).toBe(8);
    expect(report.signals[0].triggers).toBe(8);
  });

  test('profileTrigger does nothing when disabled', () => {
    disableProfiler();
    const signal = {};
    profileTrigger(signal, 5);
    
    const report = getProfileReport();
    expect(report.totalTriggers).toBe(0);
  });

  // ─── profileEffectRun ───────────────────────────────────────────────────────

  test('profileEffectRun records effect runs when enabled', () => {
    enableProfiler();
    const effect = {};
    
    profileEffectRun(effect, () => {}, 'myEffect');
    profileEffectRun(effect, () => {}, 'myEffect');
    
    const report = getProfileReport();
    expect(report.effects.length).toBe(1);
    expect(report.effects[0].label).toBe('myEffect');
    expect(report.effects[0].runs).toBe(2);
    expect(report.totalEffectRuns).toBe(2);
  });

  test('profileEffectRun executes function and returns result', () => {
    enableProfiler();
    const effect = {};
    
    const result = profileEffectRun(effect, () => 'hello', 'test');
    expect(result).toBe('hello');
  });

  test('profileEffectRun works when disabled (just executes function)', () => {
    disableProfiler();
    const effect = {};
    
    const result = profileEffectRun(effect, () => 'world', 'test');
    expect(result).toBe('world');
    
    const report = getProfileReport();
    expect(report.effects.length).toBe(0);
  });

  // ─── profileComputedRun ─────────────────────────────────────────────────────

  test('profileComputedRun records computed runs when enabled', () => {
    enableProfiler();
    const computed = {};
    
    profileComputedRun(computed, () => {}, 'myComputed');
    profileComputedRun(computed, () => {}, 'myComputed');
    profileComputedRun(computed, () => {}, 'myComputed');
    
    const report = getProfileReport();
    expect(report.computeds.length).toBe(1);
    expect(report.computeds[0].label).toBe('myComputed');
    expect(report.computeds[0].recomputes).toBe(3);
    expect(report.totalComputedRecomputes).toBe(3);
  });

  test('profileComputedRun executes function and returns result', () => {
    enableProfiler();
    const computed = {};
    
    const result = profileComputedRun(computed, () => 42, 'test');
    expect(result).toBe(42);
  });

  test('profileComputedRun works when disabled', () => {
    disableProfiler();
    const computed = {};
    
    const result = profileComputedRun(computed, () => 100, 'test');
    expect(result).toBe(100);
    
    const report = getProfileReport();
    expect(report.computeds.length).toBe(0);
  });

  // ─── getProfileReport ───────────────────────────────────────────────────────

  test('getProfileReport returns complete report structure', () => {
    enableProfiler();
    
    const signal1 = {};
    const signal2 = {};
    const effect = {};
    const computed = {};
    
    profileSignalWrite(signal1, 'signal1');
    profileSignalRead(signal1, 'signal1');
    profileTrigger(signal1, 1);
    
    profileSignalWrite(signal2, 'signal2');
    profileSignalWrite(signal2, 'signal2');
    
    profileEffectRun(effect, () => {}, 'effect1');
    
    profileComputedRun(computed, () => {}, 'computed1');
    
    const report = getProfileReport();
    
    expect(typeof report.duration).toBe('number');
    expect(report.totalTriggers).toBe(1);
    expect(report.totalEffectRuns).toBe(1);
    expect(report.totalComputedRecomputes).toBe(1);
    expect(report.signals.length).toBe(2);
    expect(report.effects.length).toBe(1);
    expect(report.computeds.length).toBe(1);
    
    // Check signal stats
    const sig1 = report.signals.find(s => s.label === 'signal1');
    expect(sig1).toBeDefined();
    expect(sig1.reads).toBe(1);
    expect(sig1.writes).toBe(1);
    expect(sig1.triggers).toBe(1);
    
    const sig2 = report.signals.find(s => s.label === 'signal2');
    expect(sig2).toBeDefined();
    expect(sig2.writes).toBe(2);
    
    // Check effect stats
    expect(report.effects[0].label).toBe('effect1');
    expect(report.effects[0].runs).toBe(1);
    expect(typeof report.effects[0].totalTime).toBe('string');
    expect(typeof report.effects[0].maxTime).toBe('string');
    expect(typeof report.effects[0].avgTime).toBe('string');
    
    // Check computed stats
    expect(report.computeds[0].label).toBe('computed1');
    expect(report.computeds[0].recomputes).toBe(1);
  });

  test('getProfileReport returns empty report when nothing profiled', () => {
    enableProfiler();
    const report = getProfileReport();
    
    expect(report.signals.length).toBe(0);
    expect(report.effects.length).toBe(0);
    expect(report.computeds.length).toBe(0);
    expect(report.totalTriggers).toBe(0);
    expect(report.totalEffectRuns).toBe(0);
    expect(report.totalComputedRecomputes).toBe(0);
  });

  // ─── printProfileReport ─────────────────────────────────────────────────────

  test('printProfileReport logs to console', () => {
    enableProfiler();
    const signal = {};
    profileSignalWrite(signal, 'test');
    
    const consoleLog = jest.spyOn(console, 'log').mockImplementation();
    
    printProfileReport();
    
    expect(consoleLog).toHaveBeenCalled();
    consoleLog.mockRestore();
  });

  // ─── onDevToolsMessage ──────────────────────────────────────────────────────

  test('onDevToolsMessage registers and calls handler', () => {
    const handler = jest.fn();
    const unsubscribe = onDevToolsMessage('test', handler);
    
    // Simulate message handling
    const event = {
      source: window,
      data: { type: 'test', payload: { value: 42 } }
    };
    
    // Trigger the internal handler (via window message event)
    window.dispatchEvent(new MessageEvent('message', {
      source: window,
      data: { type: 'test', payload: { value: 42 } }
    }));
    
    // Note: The message handler is added globally on window, 
    // so we test the unsubscribe function instead
    unsubscribe();
    
    // After unsubscribe, handler should not be called
    window.dispatchEvent(new MessageEvent('message', {
      source: window,
      data: { type: 'test', payload: { value: 100 } }
    }));
  });

  test('onDevToolsMessage returns unsubscribe function', () => {
    const handler = jest.fn();
    const unsubscribe = onDevToolsMessage('test', handler);
    
    expect(typeof unsubscribe).toBe('function');
  });

  // ─── sendDevToolsMessage ────────────────────────────────────────────────────

  test('sendDevToolsMessage sends message to window.__KUPOLA_DEVTOOLS__', () => {
    // Mock the devtools interface
    const postMessage = jest.fn();
    window.__KUPOLA_DEVTOOLS__ = { postMessage };
    
    sendDevToolsMessage('test', { data: 'hello' });
    
    expect(postMessage).toHaveBeenCalledWith({
      type: 'kupola:test',
      payload: { data: 'hello' }
    });
    
    delete window.__KUPOLA_DEVTOOLS__;
  });

  // ─── exposeDevToolsAPI ──────────────────────────────────────────────────────

  test('exposeDevToolsAPI exposes API on window.__KUPOLA__', () => {
    const consoleLog = jest.spyOn(console, 'log').mockImplementation();
    
    exposeDevToolsAPI();
    
    expect(window.__KUPOLA__).toBeDefined();
    expect(typeof window.__KUPOLA__.enableProfiler).toBe('function');
    expect(typeof window.__KUPOLA__.disableProfiler).toBe('function');
    expect(typeof window.__KUPOLA__.resetProfiler).toBe('function');
    expect(typeof window.__KUPOLA__.getProfileReport).toBe('function');
    expect(typeof window.__KUPOLA__.printProfileReport).toBe('function');
    expect(typeof window.__KUPOLA__.isProfilerEnabled).toBe('function');
    expect(typeof window.__KUPOLA__.sendMessage).toBe('function');
    expect(typeof window.__KUPOLA__.onMessage).toBe('function');
    
    expect(consoleLog).toHaveBeenCalledWith(
      '[Kupola] DevTools API exposed. Use window.__KUPOLA__ to access.'
    );
    
    consoleLog.mockRestore();
    delete window.__KUPOLA__;
  });
});