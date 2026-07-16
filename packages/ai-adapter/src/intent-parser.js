// SPDX-License-Identifier: MIT
/**
 * @kupola/ai-adapter — Intent Parser
 *
 * Converts natural language input into structured commands
 * using a pluggable AI backend.
 *
 * Output format:
 *   { engine: 'query'|'action'|'flow', type: string, params: object }
 */

export class IntentParser {
  constructor(options = {}) {
    this.ai = options.ai || null; // async (prompt, context) => parsed command
    this.fallback = options.fallback || new RuleBasedParser();
    this.context = []; // conversation history for context-aware parsing
    this.maxContext = options.maxContext || 10;
  }

  /**
   * Parse natural language input into a structured command.
   * @param {string} input — User's natural language text
   * @param {object} extraContext — Additional context (e.g. current page, selected item)
   * @returns {Promise<{engine, type, params, raw}>}
   */
  async parse(input, extraContext = {}) {
    // Build context for AI
    const context = {
      history: this.context.slice(-this.maxContext),
      ...extraContext,
    };

    let command;

    // Try AI parser first
    if (this.ai) {
      try {
        command = await this.ai(input, context);
      } catch {
        // Fall back to rule-based parser
        command = this.fallback.parse(input, context);
      }
    } else {
      command = this.fallback.parse(input, context);
    }

    // Validate command structure
    if (!command || !command.engine || !command.type) {
      return {
        engine: 'unknown',
        type: 'unrecognized',
        params: {},
        raw: input,
        error: 'Could not understand the command.',
      };
    }

    // Store in context for follow-up
    this.context.push({ input, command, timestamp: Date.now() });
    if (this.context.length > this.maxContext) {
      this.context.shift();
    }

    return { ...command, raw: input };
  }

  /**
   * Clear conversation context.
   */
  clearContext() {
    this.context = [];
  }

  /**
   * Get conversation history.
   */
  getHistory() {
    return [...this.context];
  }
}

/**
 * Simple rule-based parser for when no AI backend is available.
 * Matches common patterns in Chinese/English commands.
 */
export class RuleBasedParser {
  constructor() {
    this.rules = [];
  }

  /**
   * Add a parsing rule.
   * @param {RegExp} pattern — Regex to match input
   * @param {Function} builder — (matches) => { engine, type, params }
   */
  addRule(pattern, builder) {
    this.rules.push({ pattern, builder });
  }

  /**
   * Parse input using registered rules.
   */
  parse(input, context = {}) {
    const trimmed = input.trim();

    for (const rule of this.rules) {
      const match = trimmed.match(rule.pattern);
      if (match) {
        return rule.builder(match, context);
      }
    }

    // No rule matched
    return { engine: 'unknown', type: 'unrecognized', params: { text: trimmed } };
  }

  /**
   * Create a default rule set for common patterns.
   */
  static createDefault() {
    const parser = new RuleBasedParser();

    // Query patterns (Chinese)
    parser.addRule(/(?:查询|查看|查|搜索)(.+)/i, (m) => ({
      engine: 'query',
      type: 'search',
      params: { keyword: m[1].trim() },
    }));

    // Action patterns (Chinese)
    parser.addRule(/(?:添加|新增|创建)(.+)/i, (m) => ({
      engine: 'action',
      type: 'create',
      params: { description: m[1].trim() },
    }));

    parser.addRule(/(?:删除|移除|去掉)(.+)/i, (m) => ({
      engine: 'action',
      type: 'delete',
      params: { description: m[1].trim() },
    }));

    parser.addRule(/(?:修改|更新|调整|把)(.+?)(?:改|调|设|更新)为?(.+)/i, (m) => ({
      engine: 'action',
      type: 'update',
      params: { target: m[1].trim(), value: m[2].trim() },
    }));

    // Flow patterns (Chinese)
    parser.addRule(/(?:执行|运行|启动)(?:流程)?(.+)/i, (m) => ({
      engine: 'flow',
      type: 'execute',
      params: { name: m[1].trim() },
    }));

    parser.addRule(/(?:创建|新建|定义)流程(.+)/i, (m) => ({
      engine: 'flow',
      type: 'define',
      params: { name: m[1].trim() },
    }));

    // English patterns
    parser.addRule(/(?:search|find|query|get|show)\s+(.+)/i, (m) => ({
      engine: 'query',
      type: 'search',
      params: { keyword: m[1].trim() },
    }));

    parser.addRule(/(?:add|create|new)\s+(.+)/i, (m) => ({
      engine: 'action',
      type: 'create',
      params: { description: m[1].trim() },
    }));

    parser.addRule(/(?:delete|remove)\s+(.+)/i, (m) => ({
      engine: 'action',
      type: 'delete',
      params: { description: m[1].trim() },
    }));

    parser.addRule(/(?:run|execute|start)\s+(.+)/i, (m) => ({
      engine: 'flow',
      type: 'execute',
      params: { name: m[1].trim() },
    }));

    return parser;
  }
}
