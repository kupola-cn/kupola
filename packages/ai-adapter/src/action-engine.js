// SPDX-License-Identifier: MIT
/**
 * @kupola/ai-adapter — Action Engine (v2.0)
 *
 * 重构改进：
 * - 集成 EventBus 事件发布
 * - 支持 UnitOfWork 批量事务操作
 * - 更清晰的钩子机制
 */

import { UnitOfWork } from './unit-of-work.js';

export class ActionEngine {
  constructor(options = {}, bus = null) {
    this.handlers = new Map();
    this.undoStack = [];
    this.maxUndo = options.maxUndo || 10;
    this.requireConfirm = options.requireConfirm !== false;
    this.onConfirm = options.onConfirm || null;

    this.defaultRetries = options.retries || 0;

    this.auditLog = [];
    this.maxAuditLog = options.maxAuditLog || 200;

    this.beforeHooks = [];
    this.afterHooks = [];

    this.bus = bus;
  }

  register(name, config) {
    const { handler, confirm, undo, label, retries, dependsOn } = config;
    this.handlers.set(name, {
      handler,
      confirm: confirm !== undefined ? confirm : this.requireConfirm,
      undo: undo || null,
      label: label || name,
      retries: retries !== undefined ? retries : this.defaultRetries,
      dependsOn: Array.isArray(dependsOn) ? dependsOn : [],
    });
  }

  beforeExecute(fn) {
    this.beforeHooks.push(fn);
    return () => {
      const idx = this.beforeHooks.indexOf(fn);
      if (idx >= 0) {this.beforeHooks.splice(idx, 1);}
    };
  }

  afterExecute(fn) {
    this.afterHooks.push(fn);
    return () => {
      const idx = this.afterHooks.indexOf(fn);
      if (idx >= 0) {this.afterHooks.splice(idx, 1);}
    };
  }

  async execute(command, callbacks = {}) {
    const { type, params, context } = command;
    const action = this.handlers.get(type);

    if (!action) {
      return {
        success: false,
        error: `Unknown action: "${type}"`,
        available: [ ...this.handlers.keys() ],
      };
    }

    this.bus?.emit('action:before', { type, params, context });

    const depError = this.checkDependencies(type);
    if (depError) {
      return { success: false, error: depError, dependenciesMet: false };
    }

    for (const hook of this.beforeHooks) {
      try {
        if (context === undefined) {await hook(type, params);}
        else {await hook(type, params, context);}
      } catch (err) {
        this._addAudit(type, params, 'blocked', err.message);
        this.bus?.emit('action:denied', { type, params, error: err, context });
        return { success: false, error: `Permission denied: ${err.message}` };
      }
    }

    if (action.confirm) {
      const confirmFn = callbacks.onConfirm || this.onConfirm;
      if (!confirmFn) {
        this._addAudit(type, params, 'cancelled');
        this.bus?.emit('action:cancelled', { type, params, context });
        return { success: false, cancelled: true };
      }
      const confirmed = await confirmFn(action.label, params);
      if (!confirmed) {
        this._addAudit(type, params, 'cancelled');
        this.bus?.emit('action:cancelled', { type, params, context });
        return { success: false, cancelled: true };
      }
    }

    let lastError;
    const maxAttempts = (action.retries || 0) + 1;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const result = context === undefined
          ? await action.handler(params)
          : await action.handler(params, context);

        if (result && result.success === false) {
          const message = result.error || result.message || 'Action failed.';
          this._addAudit(type, params, 'failed', message, attempt);
          this.bus?.emit('action:error', { type, params, error: message, context });
          if (callbacks.onError) {callbacks.onError(new Error(message));}
          return {
            success: false,
            error: message,
            data: result,
            code: result.code,
            denied: result.denied,
            details: result.details,
          };
        }

        if (action.undo) {
          this.undoStack.push({
            type,
            params,
            undoFn: action.undo,
            timestamp: Date.now(),
          });
          if (this.undoStack.length > this.maxUndo) {
            this.undoStack.shift();
          }
        }

        this._addAudit(type, params, 'success', null, attempt);

        for (const hook of this.afterHooks) {
          try {
            if (context === undefined) {await hook(type, params, result);}
            else {await hook(type, params, result, context);}
          } catch { /* ignore */ }
        }

        this.bus?.emit('action:after', { type, params, result, context });

        if (callbacks.onSuccess) {callbacks.onSuccess(result);}

        return {
          success: true,
          data: result,
          undoable: !!action.undo,
        };
      } catch (err) {
        lastError = err;
        if (attempt < maxAttempts) {
          await new Promise(r => setTimeout(r, 100 * Math.pow(2, attempt - 1)));
        }
      }
    }

    this._addAudit(type, params, 'failed', lastError.message, maxAttempts);
    this.bus?.emit('action:error', { type, params, error: lastError, context });
    if (callbacks.onError) {callbacks.onError(lastError);}
    return {
      success: false,
      error: lastError.message,
      code: lastError.code,
      denied: lastError.denied,
      details: lastError.details,
    };
  }

  createUnitOfWork() {
    return new UnitOfWork(this);
  }

  async executeBatch(commands, _callbacks = {}) {
    const uow = this.createUnitOfWork();
    for (const cmd of commands) {
      uow.add(cmd.type, cmd.params);
    }
    return uow.commit();
  }

  async undo() {
    const last = this.undoStack.pop();
    if (!last) {
      return { success: false, message: 'Nothing to undo.' };
    }

    try {
      await last.undoFn(last.params);
      this._addAudit(last.type, last.params, 'undone');
      this.bus?.emit('action:undone', { type: last.type, params: last.params });
      return { success: true, message: `Undone: ${last.type}` };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  canUndo() {
    return this.undoStack.length > 0;
  }

  getActions() {
    return [ ...this.handlers.keys() ].map(name => ({
      name,
      label: this.handlers.get(name).label,
      confirm: this.handlers.get(name).confirm,
      dependsOn: this.handlers.get(name).dependsOn,
    }));
  }

  checkDependencies(type, _visited = new Set()) {
    if (_visited.has(type)) {return `Circular dependency detected: ${type}`;}
    _visited.add(type);

    const action = this.handlers.get(type);
    if (!action || !action.dependsOn || action.dependsOn.length === 0) {return null;}

    for (const dep of action.dependsOn) {
      const circularErr = this.checkDependencies(dep, new Set(_visited));
      if (circularErr && circularErr.startsWith('Circular')) {return circularErr;}

      const satisfied = this.auditLog.some(e => e.action === dep && e.status === 'success');
      if (!satisfied) {
        return `Dependency not met: "${dep}" must succeed before "${type}"`;
      }
    }
    return null;
  }

  getAuditLog(filter = {}) {
    let log = [ ...this.auditLog ];
    if (filter.type) {log = log.filter(e => e.action === filter.type);}
    if (filter.status) {log = log.filter(e => e.status === filter.status);}
    if (filter.limit) {log = log.slice(-filter.limit);}
    return log;
  }

  _addAudit(action, params, status, error = null, attempts = 1) {
    this.auditLog.push({
      action,
      params,
      status,
      error,
      attempts,
      timestamp: Date.now(),
    });
    if (this.auditLog.length > this.maxAuditLog) {
      this.auditLog.shift();
    }
  }
}
