// SPDX-License-Identifier: MIT
/**
 * @kupola/ai-adapter — EventBus
 *
 * A lightweight pub/sub event bus with:
 * - on / off / emit (standard)
 * - once  — one-time listener
 * - wildcard — prefix matching (e.g. 'flow:*' matches 'flow:step', 'flow:complete')
 *
 * Used internally by AIAdapter and exposed for external integration.
 */

export class EventBus {
  constructor() {
    /** @type {Map<string, Set<Function>>} */
    this.listeners = new Map();
    /** @type {Map<string, Set<Function>>} */
    this.wildcardListeners = new Map();
  }

  /**
   * Subscribe to an event.
   * @param {string} event
   * @param {Function} fn
   * @returns {Function} unsubscribe
   */
  on(event, fn) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event).add(fn);
    return () => this.off(event, fn);
  }

  /**
   * Unsubscribe from an event.
   * @param {string} event
   * @param {Function} fn
   */
  off(event, fn) {
    const set = this.listeners.get(event);
    if (set) {
      set.delete(fn);
      if (set.size === 0) this.listeners.delete(event);
    }
  }

  /**
   * Emit an event, notifying all subscribers (including matching wildcard subscribers).
   * @param {string} event
   * @param {*} data
   */
  emit(event, data) {
    // Direct listeners
    const set = this.listeners.get(event);
    if (set) {
      for (const fn of set) {
        try { fn(data); } catch { /* swallow listener errors */ }
      }
    }

    // Wildcard listeners: prefix match (e.g. 'flow:*' matches 'flow:step')
    for (const [pattern, fns] of this.wildcardListeners) {
      const prefix = pattern.endsWith('*') ? pattern.slice(0, -1) : pattern;
      if (event.startsWith(prefix)) {
        for (const fn of fns) {
          try { fn(event, data); } catch { /* swallow */ }
        }
      }
    }
  }

  /**
   * Subscribe to an event for one firing only.
   * @param {string} event
   * @param {Function} fn
   * @returns {Function} unsubscribe (useful if the event never fires)
   */
  once(event, fn) {
    const wrapper = (data) => {
      this.off(event, wrapper);
      fn(data);
    };
    return this.on(event, wrapper);
  }

  /**
   * Subscribe to all events matching a prefix pattern.
   * Pattern format: 'prefix*'  (e.g. 'flow:*', 'action:*')
   * The callback receives (eventName, data).
   *
   * @param {string} pattern — e.g. 'flow:*'
   * @param {Function} fn — (eventName: string, data: any) => void
   * @returns {Function} unsubscribe
   */
  wildcard(pattern, fn) {
    if (!this.wildcardListeners.has(pattern)) this.wildcardListeners.set(pattern, new Set());
    this.wildcardListeners.get(pattern).add(fn);
    return () => {
      const set = this.wildcardListeners.get(pattern);
      if (set) {
        set.delete(fn);
        if (set.size === 0) this.wildcardListeners.delete(pattern);
      }
    };
  }

  /**
   * Remove all listeners (useful for teardown).
   */
  removeAll() {
    this.listeners.clear();
    this.wildcardListeners.clear();
  }

  /**
   * Return the number of direct listeners for an event.
   * @param {string} event
   * @returns {number}
   */
  listenerCount(event) {
    return (this.listeners.get(event) || new Set()).size;
  }

  /**
   * Return all event names that have at least one listener.
   * @returns {string[]}
   */
  eventNames() {
    return [...this.listeners.keys()];
  }
}
