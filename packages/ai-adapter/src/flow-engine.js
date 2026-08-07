// SPDX-License-Identifier: MIT
/**
 * @kupola/ai-adapter — Flow Engine (v2.0)
 *
 * 重构改进：
 * - 集成 EventBus 事件发布
 * - 更好的错误处理
 * - 支持自定义存储适配器
 */

export class FlowEngine {
  constructor(options = {}, bus = null) {
    this.flows = new Map();
    this.executions = [];
    this.storage = options.storage || new LocalStorageAdapter('kupola-ai-flows');
    this.autoLearnThreshold = options.autoLearnThreshold || 3;
    this.actionPatterns = [];
    this.maxActionPatterns = options.maxActionPatterns || 1000;
    this.actionPatternCounts = new Map();
    this.bus = bus;

    this._loadFlows();
    this._loadPatterns();
  }

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
    this.bus?.emit('flow:defined', { name, flow });
    return flow;
  }

  async execute(name, data = {}, callbacks = {}, options = {}, _visited = new Set()) {
    if (_visited.has(name)) {
      return {
        success: false,
        error: `Circular flow detected: ${[ ..._visited, name ].join(' → ')}`,
        available: [ ...this.flows.keys() ],
      };
    }

    const flow = this.flows.get(name);
    if (!flow) {
      return {
        success: false,
        error: `Flow "${name}" not found.`,
        available: [ ...this.flows.keys() ],
      };
    }

    _visited.add(name);

    const results = [];
    const logs = [];
    const startAt = options.resumeAt || 0;
    const context = options.context || {};

    this.bus?.emit('flow:before', { name, data, context });

    for (let i = startAt; i < flow.steps.length; i++) {
      const step = flow.steps[i];
      const stepLabel = step.label || `Step ${i + 1}`;

      this.bus?.emit('flow:step:before', { flow: name, step: i, label: stepLabel, data, context });

      if (typeof step.condition === 'function') {
        const shouldRun = step.condition(data, results, context);
        if (!shouldRun) {
          results.push({ step: stepLabel, success: true, data: { skipped: true, reason: 'condition not met' } });
          logs.push({ step: stepLabel, status: 'skipped', timestamp: Date.now() });
          this.bus?.emit('flow:step:skipped', { flow: name, step: i, label: stepLabel, reason: 'condition not met' });
          continue;
        }
      }

      if (step.parallel && Array.isArray(step.parallel)) {
        try {
          if (callbacks.onStep) {callbacks.onStep(i, stepLabel, 'running');}
          this.bus?.emit('flow:step:running', { flow: name, step: i, label: stepLabel });

          const parallelResults = await Promise.all(
            step.parallel.map(async (pStep) => {
              if (typeof pStep.handler === 'function') {
                const subData = this._substituteVars(pStep.params || {}, data);
                return await pStep.handler(subData, results, context);
              }
              return { skipped: true };
            }),
          );

          results.push({ step: stepLabel, success: true, data: parallelResults });
          logs.push({ step: stepLabel, status: 'success', timestamp: Date.now() });
          if (callbacks.onStep) {callbacks.onStep(i, stepLabel, 'done');}
          this.bus?.emit('flow:step:done', { flow: name, step: i, label: stepLabel, result: parallelResults });
          continue;
        } catch (err) {
          results.push({ step: stepLabel, success: false, error: err.message });
          logs.push({ step: stepLabel, status: 'error', error: err.message, timestamp: Date.now() });
          if (callbacks.onError) {callbacks.onError(i, stepLabel, err);}
          this.bus?.emit('flow:step:error', { flow: name, step: i, label: stepLabel, error: err });
          return { success: false, results, logs, failedAt: i };
        }
      }

      if (step.flow) {
        try {
          if (callbacks.onStep) {callbacks.onStep(i, stepLabel, 'running');}
          this.bus?.emit('flow:step:running', { flow: name, step: i, label: stepLabel });

          const subData = this._substituteVars(step.params || {}, data);
          const subResult = await this.execute(step.flow, subData, {}, { context }, _visited);

          results.push({ step: stepLabel, success: subResult.success, data: subResult });
          logs.push({ step: stepLabel, status: subResult.success ? 'success' : 'error', timestamp: Date.now() });

          if (!subResult.success) {
            if (callbacks.onError) {callbacks.onError(i, stepLabel, new Error(subResult.error));}
            this.bus?.emit('flow:step:error', { flow: name, step: i, label: stepLabel, error: new Error(subResult.error) });
            return { success: false, results, logs, failedAt: i };
          }

          if (callbacks.onStep) {callbacks.onStep(i, stepLabel, 'done');}
          this.bus?.emit('flow:step:done', { flow: name, step: i, label: stepLabel, result: subResult });
          continue;
        } catch (err) {
          results.push({ step: stepLabel, success: false, error: err.message });
          logs.push({ step: stepLabel, status: 'error', error: err.message, timestamp: Date.now() });
          if (callbacks.onError) {callbacks.onError(i, stepLabel, err);}
          this.bus?.emit('flow:step:error', { flow: name, step: i, label: stepLabel, error: err });
          return { success: false, results, logs, failedAt: i };
        }
      }

      try {
        if (callbacks.onStep) {callbacks.onStep(i, stepLabel, 'running');}
        this.bus?.emit('flow:step:running', { flow: name, step: i, label: stepLabel });

        let result;
        if (typeof step.handler === 'function') {
          const subData = step.params ? this._substituteVars(step.params, data) : data;
          result = await step.handler(subData, results, context);
        } else {
          result = { skipped: true, reason: 'No handler defined' };
        }

        results.push({ step: stepLabel, success: true, data: result });
        logs.push({ step: stepLabel, status: 'success', timestamp: Date.now() });

        if (callbacks.onStep) {callbacks.onStep(i, stepLabel, 'done');}
        this.bus?.emit('flow:step:done', { flow: name, step: i, label: stepLabel, result });
      } catch (err) {
        results.push({ step: stepLabel, success: false, error: err.message });
        logs.push({ step: stepLabel, status: 'error', error: err.message, timestamp: Date.now() });

        if (callbacks.onError) {callbacks.onError(i, stepLabel, err);}
        this.bus?.emit('flow:step:error', { flow: name, step: i, label: stepLabel, error: err });
        return { success: false, results, logs, failedAt: i };
      }
    }

    flow.executionCount++;
    flow.lastRunAt = Date.now();
    this._saveFlows();

    this.executions.push({ flow: name, data, results, logs, timestamp: Date.now() });

    this.bus?.emit('flow:after', { name, data, results, logs });

    if (callbacks.onComplete) {callbacks.onComplete(results);}

    return { success: true, results, logs };
  }

  async resume(name, data = {}, failedAt, callbacks = {}) {
    return this.execute(name, data, callbacks, { resumeAt: failedAt + 1 });
  }

  remove(name) {
    const existed = this.flows.delete(name);
    if (existed) {
      this._saveFlows();
      this.bus?.emit('flow:removed', { name });
    }
    return existed;
  }

  list() {
    return [ ...this.flows.values() ].map(f => ({
      name: f.name,
      description: f.description,
      steps: f.steps.length,
      variables: f.variables,
      executionCount: f.executionCount,
      createdAt: f.createdAt,
      lastRunAt: f.lastRunAt,
    }));
  }

  trackAction(command) {
    const key = `${command.type}:${JSON.stringify(Object.keys(command.params || {}))}`;
    this.actionPatterns.push({ key, command, timestamp: Date.now() });

    if (this.actionPatterns.length > this.maxActionPatterns) {
      const removed = this.actionPatterns.shift();
      const currentCount = this.actionPatternCounts.get(removed.key) || 0;
      if (currentCount > 0) {
        this.actionPatternCounts.set(removed.key, currentCount - 1);
      }
    }

    const count = (this.actionPatternCounts.get(key) || 0) + 1;
    this.actionPatternCounts.set(key, count);
    this._savePatterns();

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
    this.actionPatternCounts.clear();
  }

  _substituteVars(obj, data) {
    if (!obj || typeof obj !== 'object') {return obj;}

    if (Array.isArray(obj)) {
      return obj.map(item => this._substituteVars(item, data));
    }

    const result = {};
    for (const [ key, value ] of Object.entries(obj)) {
      if (typeof value === 'string') {
        result[key] = value.replace(/\{\{([^}]+)\}\}/g, (_, path) => {
          const value = path.split('.').reduce((acc, part) => acc?.[part], data);
          return value !== undefined ? value : `{{${path}}}`;
        });
      } else if (typeof value === 'object') {
        result[key] = this._substituteVars(value, data);
      } else {
        result[key] = value;
      }
    }
    return result;
  }

  _saveFlows() {
    const data = {};
    for (const [ name, flow ] of this.flows) {
      data[name] = {
        description: flow.description,
        variables: flow.variables,
        executionCount: flow.executionCount,
        createdAt: flow.createdAt,
        lastRunAt: flow.lastRunAt,
        steps: flow.steps.map(s => ({
          label: s.label,
          action: s.action,
          params: s.params,
          flow: s.flow,
          parallel: s.parallel ? s.parallel.map(p => ({ label: p.label, params: p.params })) : undefined,
        })),
      };
    }
    this.storage.set('flows', data);
  }

  _loadFlows() {
    const data = this.storage.get('flows');
    if (!data) {return;}
    for (const [ name, config ] of Object.entries(data)) {
      this.flows.set(name, {
        ...config,
        name,
        steps: (config.steps || []).map(s => ({ ...s, handler: null })),
      });
    }
  }

  _savePatterns() {
    this.storage.set('actionPatterns', {
      patterns: this.actionPatterns,
      counts: Array.from(this.actionPatternCounts.entries()),
    });
  }

  _loadPatterns() {
    const data = this.storage.get('actionPatterns');
    if (!data) {return;}
    this.actionPatterns = data.patterns || [];
    if (data.counts) {
      this.actionPatternCounts = new Map(data.counts);
    }
  }
}

class LocalStorageAdapter {
  constructor(key) {
    this.key = key;
  }

  get(name) {
    try {
      const raw = localStorage.getItem(this.key);
      const data = raw ? JSON.parse(raw) : {};
      return name !== undefined ? data[name] : data;
    } catch {
      return name !== undefined ? null : {};
    }
  }

  set(name, value) {
    try {
      const raw = localStorage.getItem(this.key);
      const data = raw ? JSON.parse(raw) : {};
      if (value === undefined) {
        localStorage.setItem(this.key, JSON.stringify(name));
      } else {
        data[name] = value;
        localStorage.setItem(this.key, JSON.stringify(data));
      }
    } catch {
      // silently fail
    }
  }
}
