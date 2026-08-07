// SPDX-License-Identifier: MIT
/**
 * @kupola/ai-adapter — Query Engine (v2.0)
 *
 * 重构改进：
 * - 支持 per-query cacheTTL 配置
 * - 集成 EventBus 事件发布
 * - 支持自定义验证器
 */

export class QueryEngine {
  constructor(options = {}, bus = null) {
    this.handlers = new Map();
    this.history = [];
    this.maxHistory = options.maxHistory || 20;

    this.cache = new Map();
    this.cacheTTL = options.cacheTTL || 30000;
    this.cacheEnabled = options.cacheEnabled !== false;

    this.aggregations = new Map();
    this.bus = bus;

    this._registerDefaultAggregations();
  }

  _registerDefaultAggregations() {
    this.aggregations.set('count', (data) => data.length);
    this.aggregations.set('sum', (data, field) => data.reduce((s, r) => s + (Number(r[field]) || 0), 0));
    this.aggregations.set('avg', (data, field) => data.reduce((s, r) => s + (Number(r[field]) || 0), 0) / (data.length || 1));
    this.aggregations.set('min', (data, field) => Math.min(...data.map(r => Number(r[field]) || 0)));
    this.aggregations.set('max', (data, field) => Math.max(...data.map(r => Number(r[field]) || 0)));
  }

  register(name, handler, options = {}) {
    this.handlers.set(name, { handler, cacheTTL: options.cacheTTL || this.cacheTTL });
  }

  async execute(command, context) {
    const { type, params, context: commandContext } = command;
    const actualContext = context !== undefined ? context : commandContext;
    const handlerEntry = this.handlers.get(type);

    if (!handlerEntry) {
      return {
        success: false,
        error: `Unknown query type: "${type}"`,
        available: [ ...this.handlers.keys() ],
      };
    }

    const { handler, cacheTTL } = handlerEntry;

    this.bus?.emit('query:before', { type, params, context: actualContext });

    const cacheKey = this._makeCacheKey(type, params, actualContext);
    if (this.cacheEnabled) {
      const cached = this._getCache(cacheKey, cacheTTL);
      if (cached) {
        this.bus?.emit('query:cached', { type, params, context: actualContext });
        return { ...cached, cached: true };
      }
    }

    try {
      const rawResult = await handler(params, actualContext);

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
      if (pagination) {output.pagination = pagination;}

      if (this.cacheEnabled) {
        this._setCache(cacheKey, output, cacheTTL);
      }

      this.history.push({ type, params, result: rawResult, timestamp: Date.now() });
      if (this.history.length > this.maxHistory) {
        this.history.shift();
      }

      this.bus?.emit('query:after', { type, params, result: output, context: actualContext });

      return output;
    } catch (err) {
      this.bus?.emit('query:error', { type, params, error: err, context: actualContext });
      return {
        success: false,
        error: err.message,
        code: err.code,
        denied: err.denied,
        details: err.details,
      };
    }
  }

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

  aggregate(op, field) {
    const last = this.getLastResult();
    if (!last || !Array.isArray(last.result)) {
      return { success: false, error: 'No array result to aggregate.' };
    }

    const data = last.result;
    const fn = this.aggregations.get(op);

    if (!fn) {
      return { success: false, error: `Unknown aggregation: ${op}` };
    }

    try {
      const value = fn(data, field);
      return { success: true, value, label: `${op.toUpperCase()} of ${field}` };
    } catch {
      return { success: false, error: `Aggregation failed: ${op}` };
    }
  }

  getLastResult() {
    return this.history.length > 0 ? this.history[this.history.length - 1] : null;
  }

  clearHistory() {
    this.history = [];
    this.cache.clear();
  }

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
    if (!Array.isArray(result) || result.length === 0) {return null;}

    const columns = Object.keys(result[0]).map(key => ({
      field: key,
      title: key,
    }));

    return { columns, rows: result };
  }

  _paginate(result, params) {
    if (!Array.isArray(result)) {return { data: result, pagination: null };}

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

  _getCache(key, ttl) {
    const entry = this.cache.get(key);
    if (!entry) {return null;}
    if (Date.now() - entry.timestamp > ttl) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }

  _setCache(key, data, ttl) {
    this.cache.set(key, { data, timestamp: Date.now(), ttl });
    if (this.cache.size > 100) {
      const oldest = this.cache.keys().next().value;
      this.cache.delete(oldest);
    }
  }

  _makeCacheKey(type, params, context) {
    return `${type}:${this._safeStringify(params)}:${this._safeStringify(context)}`;
  }

  _safeStringify(value) {
    const seen = new WeakSet();
    return JSON.stringify(value || {}, (key, val) => {
      if (typeof val === 'function' || typeof val === 'symbol') {return undefined;}
      if (val && typeof val === 'object') {
        if (seen.has(val)) {return '[Circular]';}
        seen.add(val);
      }
      return val;
    });
  }
}
