// SPDX-License-Identifier: MIT
/**
 * @kupola/ai-adapter 鈥?Flow Engine (v1.1)
 *
 * Enhancements:
 * - Conditional branches (step.condition)
 * - Parallel steps (step.parallel group)
 * - Variable substitution ({{variable}} in params)
 * - Nested flows (step.flow references another flow)
 * - Resume from failure (resumeAt option)
 */

export class FlowEngine {
  constructor(options = {}) {
    this.flows = new Map();
    this.executions = [];
    this.storage = options.storage || new LocalStorageAdapter('kupola-ai-flows');
    this.autoLearnThreshold = options.autoLearnThreshold || 3;
    this.actionPatterns = [];

    this._loadFlows();
  }

  /**
   * Define a new flow.
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
   * @param {string} name
   * @param {object} data 鈥?variable values
   * @param {object} callbacks 鈥?{ onStep?, onComplete?, onError? }
   * @param {object} options 鈥?{ resumeAt?: number }
   */
  async execute(name, data = {}, callbacks = {}, options = {}) {
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
    const startAt = options.resumeAt || 0;
    const context = options.context || {};

    for (let i = startAt; i < flow.steps.length; i++) {
      const step = flow.steps[i];
      const stepLabel = step.label || `Step ${i + 1}`;

      // Conditional branch: skip if condition returns false
      if (typeof step.condition === 'function') {
        const shouldRun = step.condition(data, results, context);
        if (!shouldRun) {
          results.push({ step: stepLabel, success: true, data: { skipped: true, reason: 'condition not met' } });
          logs.push({ step: stepLabel, status: 'skipped', timestamp: Date.now() });
          continue;
        }
      }

      // Parallel group: execute multiple steps concurrently
      if (step.parallel && Array.isArray(step.parallel)) {
        try {
          if (callbacks.onStep) callbacks.onStep(i, stepLabel, 'running');

          const parallelResults = await Promise.all(
            step.parallel.map(async (pStep) => {
              if (typeof pStep.handler === 'function') {
                const subData = this._substituteVars(pStep.params || {}, data);
                return await pStep.handler(subData, results, context);
              }
              return { skipped: true };
            })
          );

          results.push({ step: stepLabel, success: true, data: parallelResults });
          logs.push({ step: stepLabel, status: 'success', timestamp: Date.now() });
          if (callbacks.onStep) callbacks.onStep(i, stepLabel, 'done');
          continue;
        } catch (err) {
          results.push({ step: stepLabel, success: false, error: err.message });
          logs.push({ step: stepLabel, status: 'error', error: err.message, timestamp: Date.now() });
          if (callbacks.onError) callbacks.onError(i, stepLabel, err);
          return { success: false, results, logs, failedAt: i };
        }
      }

      // Nested flow: call another flow
      if (step.flow) {
        try {
          if (callbacks.onStep) callbacks.onStep(i, stepLabel, 'running');

          const subData = this._substituteVars(step.params || {}, data);
          const subResult = await this.execute(step.flow, subData, {}, { context });

          results.push({ step: stepLabel, success: subResult.success, data: subResult });
          logs.push({ step: stepLabel, status: subResult.success ? 'success' : 'error', timestamp: Date.now() });

          if (!subResult.success) {
            if (callbacks.onError) callbacks.onError(i, stepLabel, new Error(subResult.error));
            return { success: false, results, logs, failedAt: i };
          }

          if (callbacks.onStep) callbacks.onStep(i, stepLabel, 'done');
          continue;
        } catch (err) {
          results.push({ step: stepLabel, success: false, error: err.message });
          logs.push({ step: stepLabel, status: 'error', error: err.message, timestamp: Date.now() });
          if (callbacks.onError) callbacks.onError(i, stepLabel, err);
          return { success: false, results, logs, failedAt: i };
        }
      }

      // Normal step
      try {
        if (callbacks.onStep) callbacks.onStep(i, stepLabel, 'running');

        let result;
        if (typeof step.handler === 'function') {
          const subData = step.params ? this._substituteVars(step.params, data) : data;
          result = await step.handler(subData, results, context);
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
   * Resume a failed flow from the failed step.
   */
  async resume(name, data = {}, failedAt, callbacks = {}) {
    return this.execute(name, data, callbacks, { resumeAt: failedAt + 1 });
  }

  remove(name) {
    const existed = this.flows.delete(name);
    if (existed) this._saveFlows();
    return existed;
  }

  list() {
    return [...this.flows.values()].map(f => ({
      name: f.name,
      description: f.description,
      steps: f.steps.length,
      variables: f.variables,
      executionCount: f.executionCount,
    }));
  }

  trackAction(command) {
    const key = `${command.type}:${JSON.stringify(Object.keys(command.params || {}))}`;
    this.actionPatterns.push({ key, command, timestamp: Date.now() });

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

  clearHistory() {
    this.executions = [];
    this.actionPatterns = [];
  }

  // 鈹€鈹€ Private 鈹€鈹€

  _substituteVars(obj, data) {
    if (!obj || typeof obj !== 'object') return obj;

    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        result[key] = value.replace(/\{\{(\w+)\}\}/g, (_, varName) => {
          return data[varName] !== undefined ? data[varName] : `{{${varName}}}`;
        });
      } else {
        result[key] = value;
      }
    }
    return result;
  }

  _saveFlows() {
    const data = {};
    for (const [name, flow] of this.flows) {
      data[name] = {
        description: flow.description,
        variables: flow.variables,
        executionCount: flow.executionCount,
        createdAt: flow.createdAt,
        steps: flow.steps.map(s => ({
          label: s.label,
          action: s.action,
          params: s.params,
          flow: s.flow,
          parallel: s.parallel ? s.parallel.map(p => ({ label: p.label, params: p.params })) : undefined,
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
      // silently fail
    }
  }
}
