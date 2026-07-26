// SPDX-License-Identifier: MIT
/**
 * @kupola/ai-adapter — Simple State Machine
 *
 * 轻量级状态机，管理复杂状态转换。
 */

export class SimpleStateMachine {
  constructor(config) {
    this.config = config;
    this.current = config.initial;
    this.history = [];
    this.listeners = new Map();
  }

  transition(event, payload = {}) {
    const stateConfig = this.config.states[this.current];
    if (!stateConfig) {
      throw new Error(`Unknown state: ${this.current}`);
    }

    const nextState = stateConfig.on?.[event];
    if (!nextState) {
      return false;
    }

    const previous = this.current;
    this.current = nextState;
    this.history.push({ previous, next: nextState, event, timestamp: Date.now(), payload });

    this._notify('transition', { previous, next: nextState, event, payload });
    this._notify(`${previous}:${nextState}`, { event, payload });

    return true;
  }

  on(event, handler) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(handler);
    return () => this.off(event, handler);
  }

  off(event, handler) {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  _notify(event, data) {
    const handlers = this.listeners.get(event);
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(data);
        } catch {
          // ignore
        }
      }
    }
  }

  can(event) {
    const stateConfig = this.config.states[this.current];
    return !!stateConfig?.on?.[event];
  }

  reset() {
    this.current = this.config.initial;
    this.history = [];
    this._notify('reset', {});
  }

  getState() {
    return this.current;
  }

  getHistory() {
    return [...this.history];
  }

  getPossibleEvents() {
    const stateConfig = this.config.states[this.current];
    return stateConfig ? Object.keys(stateConfig.on || {}) : [];
  }
}
