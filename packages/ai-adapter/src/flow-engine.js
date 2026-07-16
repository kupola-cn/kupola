// SPDX-License-Identifier: MIT
/**
 * @kupola/ai-adapter — Flow Engine
 *
 * Handles repeatable multi-step workflows:
 * - Define flows as tagged templates (name + steps)
 * - Execute flows with variable data
 * - Storage: localStorage (default) or custom adapter
 * - Auto-learn: suggest flow creation after N repeated actions
 */

export class FlowEngine {
  constructor(options = {}) {
    this.flows = new Map();
    this.executions = [];
    this.storage = options.storage || new LocalStorageAdapter('kupola-ai-flows');
    this.autoLearnThreshold = options.autoLearnThreshold || 3;
    this.actionPatterns = []; // track repeated actions for auto-learn

    // Load persisted flows
    this._loadFlows();
  }

  /**
   * Define a new flow.
   * @param {string} name — Flow name (e.g. '发工资条')
   * @param {object} config — { steps, description?, variables? }
   */
  define(name, config) {
    const flow = {
      name,
      description: config.description || '',
      steps: config.steps || [],
      variables: config.variables || [],
      createdAt: Date.now(),
      executionCount: 0,
    };

    this.flows.set(name, flow);
    this._saveFlows();
    return flow;
  }

  /**
   * Execute a flow by name.
   * @param {string} name — Flow name
   * @param {object} data — Variable values for this execution
   * @param {object} callbacks — { onStep?, onComplete?, onError? }
   * @returns {Promise<{success, results, logs}>}
   */
  async execute(name, data = {}, callbacks = {}) {
    const flow = this.flows.get(name);
    if (!flow) {
      return {
        success: false,
        error: `Flow "${name}" not found.`,
        available: [...this.flows.keys()],
      };
    }

    const results = [];
    const logs = [];

    for (let i = 0; i < flow.steps.length; i++) {
      const step = flow.steps[i];
      const stepLabel = step.label || `Step ${i + 1}`;

      try {
        if (callbacks.onStep) callbacks.onStep(i, stepLabel, 'running');

        let result;
        if (typeof step.handler === 'function') {
          result = await step.handler(data, results);
        } else {
          result = { skipped: true, reason: 'No handler defined' };
        }

        results.push({ step: stepLabel, success: true, data: result });
        logs.push({ step: stepLabel, status: 'success', timestamp: Date.now() });

        if (callbacks.onStep) callbacks.onStep(i, stepLabel, 'done');
      } catch (err) {
        results.push({ step: stepLabel, success: false, error: err.message });
        logs.push({ step: stepLabel, status: 'error', error: err.message, timestamp: Date.now() });

        if (callbacks.onError) callbacks.onError(i, stepLabel, err);
        return { success: false, results, logs, failedAt: i };
      }
    }

    // Update execution count
    flow.executionCount++;
    this._saveFlows();

    // Store execution record
    this.executions.push({ flow: name, data, results, logs, timestamp: Date.now() });

    if (callbacks.onComplete) callbacks.onComplete(results);

    return { success: true, results, logs };
  }

  /**
   * Remove a flow.
   */
  remove(name) {
    const existed = this.flows.delete(name);
    if (existed) this._saveFlows();
    return existed;
  }

  /**
   * Get all defined flows.
   */
  list() {
    return [...this.flows.values()].map(f => ({
      name: f.name,
      description: f.description,
      steps: f.steps.length,
      variables: f.variables,
      executionCount: f.executionCount,
    }));
  }

  /**
   * Track an action pattern for auto-learn suggestions.
   * Returns a suggested flow name if threshold is met.
   */
  trackAction(command) {
    const key = `${command.type}:${JSON.stringify(Object.keys(command.params || {}))}`;
    this.actionPatterns.push({ key, command, timestamp: Date.now() });

    // Count occurrences
    const count = this.actionPatterns.filter(p => p.key === key).length;
    if (count >= this.autoLearnThreshold) {
      return {
        suggest: true,
        pattern: key,
        count,
        message: `You've performed "${command.type}" ${count} times. Create a flow?`,
      };
    }
    return { suggest: false };
  }

  /**
   * Clear all execution history.
   */
  clearHistory() {
    this.executions = [];
    this.actionPatterns = [];
  }

  // ── Storage ────────────────────────────────────────

  _saveFlows() {
    const data = {};
    for (const [name, flow] of this.flows) {
      // Only persist metadata + step definitions (not functions)
      data[name] = {
        description: flow.description,
        variables: flow.variables,
        executionCount: flow.executionCount,
        createdAt: flow.createdAt,
        steps: flow.steps.map(s => ({
          label: s.label,
          action: s.action,
          params: s.params,
        })),
      };
    }
    this.storage.set(data);
  }

  _loadFlows() {
    const data = this.storage.get();
    if (!data) return;
    for (const [name, config] of Object.entries(data)) {
      this.flows.set(name, {
        ...config,
        name,
        steps: (config.steps || []).map(s => ({ ...s, handler: null })),
      });
    }
  }
}

/**
 * Default localStorage adapter.
 */
class LocalStorageAdapter {
  constructor(key) {
    this.key = key;
  }

  get() {
    try {
      const raw = localStorage.getItem(this.key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  set(data) {
    try {
      localStorage.setItem(this.key, JSON.stringify(data));
    } catch {
      // Storage full or unavailable — silently fail
    }
  }
}
