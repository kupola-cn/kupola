// SPDX-License-Identifier: MIT
/**
 * @kupola/ai-adapter — Query Engine (v1.1)
 *
 * Enhancements:
 * - Query cache with configurable TTL
 * - Pagination support
 * - Context-aware follow-up queries
 * - Aggregation helpers (count, sum, avg)
 */

export class QueryEngine {
  constructor(options = {}) {
    this.handlers = new Map();
    this.history = [];
    this.maxHistory = options.maxHistory || 20;

    // Cache
    this.cache = new Map();
    this.cacheTTL = options.cacheTTL || 30000; // 30s default
    this.cacheEnabled = options.cacheEnabled !== false;

    // Aggregation functions
    this.aggregations = new Map();
  }

  /**
   * Register a query handler.
   * @param {string} name
   * @param {Function} handler — async (params, context?) => result
   */
  register(name, handler) {
    this.handlers.set(name, handler);
  }

  /**
   * Execute a parsed query command.
   * @param {object} command — { type, params, context? }
   * @returns {Promise<{success, data, summary, table?, pagination?, cached?}>}
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

    // Check cache
    const cacheKey = `${type}:${JSON.stringify(params)}`;
    if (this.cacheEnabled) {
      const cached = this._getCache(cacheKey);
      if (cached) {
        return { ...cached, cached: true };
      }
    }

    try {
      const rawResult = await handler(params, context);

      // Pagination
      let result = rawResult;
      let pagination = null;
      if (params && (params.page || params.pageSize)) {
        const paginated = this._paginate(rawResult, params);
        result = paginated.data;
        pagination = paginated.pagination;
      }

      const output = {
        success: true,
        data: result,
        summary: this._formatSummary(type, result),
        table: this._formatTable(result),
      };
      if (pagination) output.pagination = pagination;

      // Store in cache
      if (this.cacheEnabled) {
        this._setCache(cacheKey, output);
      }

      // Store in history for follow-up
      this.history.push({ type, params, result, timestamp: Date.now() });
      if (this.history.length > this.maxHistory) {
        this.history.shift();
      }

      return output;
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Follow-up query: reuse context from last query.
   * E.g. "那李四呢？" → reuse type from last query, change keyword.
   * @param {object} overrides — params to override from last query
   */
  async followUp(overrides = {}) {
    const last = this.getLastResult();
    if (!last) {
      return { success: false, error: 'No previous query to follow up.' };
    }
    return this.execute({
      type: last.type,
      params: { ...last.params, ...overrides },
    });
  }

  /**
   * Run aggregation on last query result.
   * @param {string} op — 'count' | 'sum' | 'avg' | 'min' | 'max'
   * @param {string} field — field name to aggregate on
   */
  aggregate(op, field) {
    const last = this.getLastResult();
    if (!last || !Array.isArray(last.result)) {
      return { success: false, error: 'No array result to aggregate.' };
    }

    const data = last.result;

    switch (op) {
      case 'count':
        return { success: true, value: data.length, label: `Count: ${data.length}` };
      case 'sum':
        return {
          success: true,
          value: data.reduce((s, r) => s + (Number(r[field]) || 0), 0),
          label: `Sum of ${field}`,
        };
      case 'avg':
        return {
          success: true,
          value: data.reduce((s, r) => s + (Number(r[field]) || 0), 0) / (data.length || 1),
          label: `Average of ${field}`,
        };
      case 'min':
        return {
          success: true,
          value: Math.min(...data.map(r => Number(r[field]) || 0)),
          label: `Min of ${field}`,
        };
      case 'max':
        return {
          success: true,
          value: Math.max(...data.map(r => Number(r[field]) || 0)),
          label: `Max of ${field}`,
        };
      default:
        return { success: false, error: `Unknown aggregation: ${op}` };
    }
  }

  /**
   * Get the last query result (for follow-up context).
   */
  getLastResult() {
    return this.history.length > 0 ? this.history[this.history.length - 1] : null;
  }

  /**
   * Clear query history and cache.
   */
  clearHistory() {
    this.history = [];
    this.cache.clear();
  }

  // ── Private ──

  _formatSummary(type, result) {
    if (Array.isArray(result)) {
      return `Found ${result.length} ${type} record(s).`;
    }
    if (result && typeof result === 'object') {
      return `Query "${type}" returned successfully.`;
    }
    return String(result);
  }

  _formatTable(result) {
    if (!Array.isArray(result) || result.length === 0) return null;

    const columns = Object.keys(result[0]).map(key => ({
      field: key,
      title: key,
    }));

    return { columns, rows: result };
  }

  _paginate(result, params) {
    if (!Array.isArray(result)) return { data: result, pagination: null };

    const page = params.page || 1;
    const pageSize = params.pageSize || 20;
    const total = result.length;
    const totalPages = Math.ceil(total / pageSize);
    const start = (page - 1) * pageSize;
    const data = result.slice(start, start + pageSize);

    return {
      data,
      pagination: { page, pageSize, total, totalPages },
    };
  }

  _getCache(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > this.cacheTTL) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }

  _setCache(key, data) {
    this.cache.set(key, { data, timestamp: Date.now() });
    // Limit cache size
    if (this.cache.size > 100) {
      const oldest = this.cache.keys().next().value;
      this.cache.delete(oldest);
    }
  }
}
