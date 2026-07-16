// SPDX-License-Identifier: MIT
/**
 * @kupola/ai-adapter — Query Engine
 *
 * Handles all read-only operations:
 * - Natural language queries → structured data retrieval
 * - Context-aware follow-up questions
 * - Result formatting for Kupola Table component
 */

export class QueryEngine {
  constructor(options = {}) {
    this.handlers = new Map();
    this.history = [];
    this.maxHistory = options.maxHistory || 20;
  }

  /**
   * Register a query handler.
   * @param {string} name — Query type (e.g. 'employee', 'attendance')
   * @param {Function} handler — async (params) => result
   */
  register(name, handler) {
    this.handlers.set(name, handler);
  }

  /**
   * Execute a parsed query command.
   * @param {object} command — { type, params, context? }
   * @returns {Promise<{success, data, summary, table?}>}
   */
  async execute(command) {
    const { type, params, context } = command;
    const handler = this.handlers.get(type);

    if (!handler) {
      return {
        success: false,
        error: `Unknown query type: "${type}"`,
        available: [...this.handlers.keys()],
      };
    }

    try {
      const result = await handler(params, context);

      // Store in history for follow-up
      this.history.push({ type, params, result, timestamp: Date.now() });
      if (this.history.length > this.maxHistory) {
        this.history.shift();
      }

      return {
        success: true,
        data: result,
        summary: this._formatSummary(type, result),
        table: this._formatTable(result),
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Get the last query result (for follow-up context).
   */
  getLastResult() {
    return this.history.length > 0 ? this.history[this.history.length - 1] : null;
  }

  /**
   * Clear query history.
   */
  clearHistory() {
    this.history = [];
  }

  /**
   * Format result as a human-readable summary string.
   * @private
   */
  _formatSummary(type, result) {
    if (Array.isArray(result)) {
      return `Found ${result.length} ${type} record(s).`;
    }
    if (result && typeof result === 'object') {
      return `Query "${type}" returned successfully.`;
    }
    return String(result);
  }

  /**
   * Format result for Kupola Table component.
   * @private
   */
  _formatTable(result) {
    if (!Array.isArray(result) || result.length === 0) return null;

    const columns = Object.keys(result[0]).map(key => ({
      field: key,
      title: key,
    }));

    return { columns, rows: result };
  }
}
