// SPDX-License-Identifier: MIT
/**
 * @kupola/ai-adapter — Action Engine (v1.1)
 *
 * Enhancements:
 * - Batch operations (execute multiple actions at once)
 * - Audit log (who/when/what for every operation)
 * - Permission hooks (beforeExecute guard)
 * - Retry mechanism (configurable retry on failure)
 */

export class ActionEngine {
  constructor(options = {}) {
    this.handlers = new Map();
    this.undoStack = [];
    this.maxUndo = options.maxUndo || 10;
    this.requireConfirm = options.requireConfirm !== false;
    this.onConfirm = options.onConfirm || null;

    // Retry
    this.defaultRetries = options.retries || 0;

    // Audit log
    this.auditLog = [];
    this.maxAuditLog = options.maxAuditLog || 200;

    // Permission hooks
    this.beforeHooks = [];
    this.afterHooks = [];
  }

  /**
   * Register an action handler.
   * @param {string} name
   * @param {object} config
   * @param {Function} config.handler
   * @param {boolean}  [config.confirm]
   * @param {Function} [config.undo]
   * @param {string}   [config.label]
   * @param {number}   [config.retries]
   * @param {string[]} [config.dependsOn] — prerequisite action types that must have succeeded before this action runs
   */
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

  /**
   * Add a before-execute hook (e.g. permission check).
   * @param {Function} fn — async (actionName, params) => void (throw to block)
   * @returns {Function} unsubscribe
   */
  beforeExecute(fn) {
    this.beforeHooks.push(fn);
    return () => {
      const idx = this.beforeHooks.indexOf(fn);
      if (idx >= 0) this.beforeHooks.splice(idx, 1);
    };
  }

  /**
   * Add an after-execute hook (e.g. logging).
   * @param {Function} fn — async (actionName, params, result) => void
   * @returns {Function} unsubscribe
   */
  afterExecute(fn) {
    this.afterHooks.push(fn);
    return () => {
      const idx = this.afterHooks.indexOf(fn);
      if (idx >= 0) this.afterHooks.splice(idx, 1);
    };
  }

  /**
   * Execute a parsed action command.
   */
  async execute(command, callbacks = {}) {
    const { type, params } = command;
    const action = this.handlers.get(type);

    if (!action) {
      return {
        success: false,
        error: `Unknown action: "${type}"`,
        available: [...this.handlers.keys()],
      };
    }

    // Dependency check: all dependsOn actions must have succeeded previously
    const depError = this.checkDependencies(type);
    if (depError) {
      return { success: false, error: depError, dependenciesMet: false };
    }

    // Permission hooks
    for (const hook of this.beforeHooks) {
      try {
        await hook(type, params);
      } catch (err) {
        this._addAudit(type, params, 'blocked', err.message);
        return { success: false, error: `Permission denied: ${err.message}` };
      }
    }

    // Confirmation step
    if (action.confirm) {
      const confirmFn = callbacks.onConfirm || this.onConfirm;
      if (confirmFn) {
        const confirmed = await confirmFn(action.label, params);
        if (!confirmed) {
          this._addAudit(type, params, 'cancelled');
          return { success: false, cancelled: true };
        }
      }
    }

    // Execute with retry
    let lastError;
    const maxAttempts = (action.retries || 0) + 1;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const result = await action.handler(params);

        // Store undo info
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

        // Audit log
        this._addAudit(type, params, 'success', null, attempt);

        // After hooks
        for (const hook of this.afterHooks) {
          try { await hook(type, params, result); } catch { /* ignore hook errors */ }
        }

        if (callbacks.onSuccess) callbacks.onSuccess(result);

        return {
          success: true,
          data: result,
          undoable: !!action.undo,
        };
      } catch (err) {
        lastError = err;
        if (attempt < maxAttempts) {
          // Wait before retry (exponential backoff: 100ms, 200ms, 400ms...)
          await new Promise(r => setTimeout(r, 100 * Math.pow(2, attempt - 1)));
        }
      }
    }

    // All attempts failed
    this._addAudit(type, params, 'failed', lastError.message, maxAttempts);
    if (callbacks.onError) callbacks.onError(lastError);
    return { success: false, error: lastError.message };
  }

  /**
   * Execute multiple actions in batch.
   * @param {Array<{type, params}>} commands
   * @param {object} callbacks
   * @returns {Promise<{success, results, failed}>}
   */
  async executeBatch(commands, callbacks = {}) {
    const results = [];
    let failed = 0;

    for (const cmd of commands) {
      const result = await this.execute(cmd, callbacks);
      results.push({ type: cmd.type, ...result });
      if (!result.success && !result.cancelled) failed++;
    }

    return {
      success: failed === 0,
      results,
      failed,
      total: commands.length,
    };
  }

  /**
   * Undo the last action.
   */
  async undo() {
    const last = this.undoStack.pop();
    if (!last) {
      return { success: false, message: 'Nothing to undo.' };
    }

    try {
      await last.undoFn(last.params);
      this._addAudit(last.type, last.params, 'undone');
      return { success: true, message: `Undone: ${last.type}` };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  canUndo() {
    return this.undoStack.length > 0;
  }

  getActions() {
    return [...this.handlers.keys()].map(name => ({
      name,
      label: this.handlers.get(name).label,
      confirm: this.handlers.get(name).confirm,
      dependsOn: this.handlers.get(name).dependsOn,
    }));
  }

  /**
   * Check whether all prerequisite actions for `type` have succeeded.
   * Returns null if OK, or an error string if a dependency is unmet.
   * Also detects circular dependencies.
   */
  checkDependencies(type, _visited = new Set()) {
    if (_visited.has(type)) return `Circular dependency detected: ${type}`;
    _visited.add(type);

    const action = this.handlers.get(type);
    if (!action || !action.dependsOn || action.dependsOn.length === 0) return null;

    for (const dep of action.dependsOn) {
      // Recursive circular check
      const circularErr = this.checkDependencies(dep, new Set(_visited));
      if (circularErr && circularErr.startsWith('Circular')) return circularErr;

      // Check audit log for at least one success record of this dep
      const satisfied = this.auditLog.some(e => e.action === dep && e.status === 'success');
      if (!satisfied) {
        return `Dependency not met: "${dep}" must succeed before "${type}"`;
      }
    }
    return null;
  }

  /**
   * Get audit log entries.
   * @param {object} filter — { type?, status?, limit? }
   */
  getAuditLog(filter = {}) {
    let log = [...this.auditLog];
    if (filter.type) log = log.filter(e => e.action === filter.type);
    if (filter.status) log = log.filter(e => e.status === filter.status);
    if (filter.limit) log = log.slice(-filter.limit);
    return log;
  }

  // ── Private ──

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
