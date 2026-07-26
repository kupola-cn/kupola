// SPDX-License-Identifier: MIT
/**
 * @kupola/router — Management classes for history, scroll, and events.
 *
 * @module managers
 */

import { HashHistory } from './hash.js';
import { HistoryHistory } from './history.js';
import { MemoryHistory } from './memory.js';

/**
 * Manages browser history operations and popstate events.
 */
export class HistoryManager {
  /**
   * @param {string} mode - History mode (hash, history, memory)
   * @param {string} [base=''] - Base path for history mode
   */
  constructor(mode, base = '') {
    /** @type {string} History mode */
    this.mode = mode;
    /** @type {string} Base path */
    this.base = base;
    /** @type {Array<Function>} Registered listeners */
    this.listeners = [];
    /** @type {Object} Internal history implementation */
    this.history = this.createHistory();
    /** @type {boolean} Whether guard is restoring hash */
    this.isGuardRestoring = false;
  }

  /**
   * Create history implementation based on mode.
   * @returns {Object} History implementation
   */
  createHistory() {
    if (this.mode === 'hash') {
      return new HashHistory({ base: this.base });
    }
    if (this.mode === 'memory') {
      return new MemoryHistory({ base: this.base });
    }
    return new HistoryHistory({ base: this.base });
  }

  /**
   * Push a new history entry.
   * @param {string} path - Path to push
   * @param {Object} query - Query parameters
   */
  push(path, query) {
    this.history.push(path, query);
  }

  /**
   * Replace current history entry.
   * @param {string} path - Path to replace with
   * @param {Object} query - Query parameters
   */
  replace(path, query) {
    this.history.replace(path, query);
  }

  /**
   * Go back in history.
   */
  back() {
    this.history.back();
  }

  /**
   * Go forward in history.
   */
  forward() {
    this.history.forward();
  }

  /**
   * Go to a specific history entry.
   * @param {number} delta - Number of steps to go
   */
  go(delta) {
    this.history.go(delta);
  }

  /**
   * Register a listener for history changes.
   * @param {Function} listener - Listener function
   * @returns {Function} Unsubscribe function
   */
  on(listener) {
    this.listeners.push(listener);
    const unsubscribe = this.history.on(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {this.listeners.splice(index, 1);}
      unsubscribe();
    };
  }

  /**
   * Start listening to history changes.
   */
  start() {
    this.history.start();
  }

  /**
   * Stop listening to history changes.
   */
  stop() {
    this.history.stop();
  }

  /**
   * Remove all registered history listeners.
   */
  clear() {
    this.listeners.length = 0;
    if (this.history?.listeners) {
      this.history.listeners.length = 0;
    }
  }

  /**
   * Get current path.
   * @returns {string} Current path
   */
  getPath() {
    return this.history.getPath();
  }

  /**
   * Replace history entry during guard restoration (prevents re-triggering popstate).
   * @param {string} path - Path to replace with
   * @param {Object} query - Query parameters
   */
  replaceWithGuard(path, query) {
    this.isGuardRestoring = true;
    try {
      this.history.replace(path, query);
    } finally {
      this.isGuardRestoring = false;
    }
  }

  /**
   * Check if guard is currently restoring hash.
   * @returns {boolean} True if restoring
   */
  getIsGuardRestoring() {
    return this.isGuardRestoring;
  }
}

/**
 * Manages scroll position history and restoration.
 */
export class ScrollManager {
  /**
   * @param {number} [limit=50] - Maximum number of scroll positions to store
   */
  constructor(limit = 50) {
    /** @type {Map<string, {x: number, y: number}>} Scroll position map */
    this.scrollHistory = new Map();
    /** @type {number} Maximum storage limit */
    this.limit = limit;
    /** @type {Function} Scroll event handler */
    this.handleScroll = () => {};
  }

  /**
   * Start listening to scroll events.
   */
  start() {
    if (typeof window === 'undefined') {return;}
    this.handleScroll = () => {};
  }

  /**
   * Stop listening to scroll events.
   */
  stop() {}

  /**
   * Save scroll position for a path.
   * @param {string} path - Path to save position for
   * @param {{x: number, y: number}} position - Scroll position
   */
  save(path, position) {
    this.scrollHistory.set(path, position);
    if (this.scrollHistory.size > this.limit) {
      const firstKey = this.scrollHistory.keys().next().value;
      this.scrollHistory.delete(firstKey);
    }
  }

  /**
   * Restore scroll position for a path.
   * @param {string} path - Path to restore position for
   * @returns {{x: number, y: number}|null} Scroll position or null
   */
  restore(path) {
    return this.scrollHistory.get(path) || null;
  }

  /**
   * Cleanup scroll position for a path.
   * @param {string} path - Path to cleanup
   */
  cleanup(path) {
    this.scrollHistory.delete(path);
  }

  /**
   * Clear all scroll history.
   */
  clear() {
    this.scrollHistory.clear();
  }

  /**
   * Get number of stored scroll positions.
   * @returns {number} Count
   */
  get size() {
    return this.scrollHistory.size;
  }
}

/**
 * Simple event emitter for router events.
 */
export class EventEmitter {
  constructor() {
    /** @type {Object<string, Array<Function>>} Event listeners map */
    this.events = {};
  }

  /**
   * Register an event listener.
   * @param {string} event - Event name
   * @param {Function} listener - Listener function
   * @returns {Function} Unsubscribe function
   */
  on(event, listener) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
    return () => {
      if (!this.events[event]) {return;}
      const index = this.events[event].indexOf(listener);
      if (index > -1) {this.events[event].splice(index, 1);}
    };
  }

  /**
   * Emit an event with arguments.
   * @param {string} event - Event name
   * @param {...*} args - Event arguments
   */
  emit(event, ...args) {
    if (this.events[event]) {
      [ ...this.events[event] ].forEach(listener => {
        try {
          listener(...args);
        } catch (error) {
          console.error(`[Router] Event listener error for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Unregister an event listener.
   * @param {string} event - Event name
   * @param {Function} listener - Listener function
   */
  off(event, listener) {
    if (this.events[event]) {
      const index = this.events[event].indexOf(listener);
      if (index > -1) {this.events[event].splice(index, 1);}
    }
  }

  /**
   * Remove all event listeners, or all listeners for one event.
   * @param {string} [event] - Optional event name
   */
  clear(event) {
    if (event) {
      delete this.events[event];
    } else {
      this.events = {};
    }
  }
}
