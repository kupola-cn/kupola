// SPDX-License-Identifier: MIT
/**
 * @kupola/ai-adapter — Action Engine
 *
 * Handles all one-time write operations:
 * - Create / Update / Delete operations
 * - Confirmation flow (pre-execute confirm for dangerous actions)
 * - Undo support via operation history
 */

export class ActionEngine {
  constructor(options = {}) {
    this.handlers = new Map();
    this.undoStack = [];
    this.maxUndo = options.maxUndo || 10;
    this.requireConfirm = options.requireConfirm !== false; // default: true
    this.onConfirm = options.onConfirm || null; // callback: (action, params) => Promise<boolean>
  }

  /**
   * Register an action handler.
   * @param {string} name — Action type (e.g. 'addEmployee', 'updateSalary')
   * @param {object} config — { handler, confirm?, undo?, label? }
   */
  register(name, config) {
    const { handler, confirm, undo, label } = config;
    this.handlers.set(name, {
      handler,
      confirm: confirm !== undefined ? confirm : this.requireConfirm,
      undo: undo || null,
      label: label || name,
    });
  }

  /**
   * Execute a parsed action command.
   * @param {object} command — { type, params, danger? }
   * @param {object} callbacks — { onConfirm?, onSuccess?, onError? }
   * @returns {Promise<{success, data?, error?, undoable?}>}
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

    // Confirmation step
    if (action.confirm) {
      const confirmFn = callbacks.onConfirm || this.onConfirm;
      if (confirmFn) {
        const confirmed = await confirmFn(action.label, params);
        if (!confirmed) {
          return { success: false, cancelled: true };
        }
      }
    }

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

      if (callbacks.onSuccess) callbacks.onSuccess(result);

      return {
        success: true,
        data: result,
        undoable: !!action.undo,
      };
    } catch (err) {
      if (callbacks.onError) callbacks.onError(err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Undo the last action.
   * @returns {Promise<{success, message?}>}
   */
  async undo() {
    const last = this.undoStack.pop();
    if (!last) {
      return { success: false, message: 'Nothing to undo.' };
    }

    try {
      await last.undoFn(last.params);
      return { success: true, message: `Undone: ${last.type}` };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Check if undo is available.
   */
  canUndo() {
    return this.undoStack.length > 0;
  }

  /**
   * Get available action names.
   */
  getActions() {
    return [...this.handlers.keys()].map(name => ({
      name,
      label: this.handlers.get(name).label,
      confirm: this.handlers.get(name).confirm,
    }));
  }
}
