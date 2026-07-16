// SPDX-License-Identifier: MIT
/**
 * @kupola/ai-adapter — Intent Parser (v1.1)
 *
 * Converts natural language input into structured commands
 * using a pluggable AI backend.
 *
 * Enhancements:
 * - Confidence scoring (0–1) on every parsed result
 * - Slot filling: detect missing required params → ask follow-up
 * - Fuzzy matching: tolerate common Chinese/English typos
 *
 * Output format:
 *   { engine, type, params, confidence, raw, missingSlots? }
 */

export class IntentParser {
  constructor(options = {}) {
    this.ai = options.ai || null;
    this.fallback = options.fallback || new RuleBasedParser();
    this.context = [];
    this.maxContext = options.maxContext || 10;

    // Confidence thresholds
    this.confidenceThreshold = options.confidenceThreshold || 0.5;

    // Slot filling: registered param requirements per engine+type
    this.slotDefs = new Map(); // key: 'engine:type' → { required: string[], optional: string[] }
  }

  /**
   * Parse natural language input into a structured command.
   * @param {string} input
   * @param {object} extraContext
   * @returns {Promise<{engine, type, params, confidence, raw, missingSlots?}>}
   */
  async parse(input, extraContext = {}) {
    const context = {
      history: this.context.slice(-this.maxContext),
      ...extraContext,
    };

    let command;

    // Try AI parser first
    if (this.ai) {
      try {
        command = await this.ai(input, context);
        // AI results default to high confidence unless specified
        if (command && command.confidence === undefined) {
          command.confidence = 0.9;
        }
      } catch {
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
        confidence: 0,
        raw: input,
        error: 'Could not understand the command.',
      };
    }

    // Ensure confidence exists
    if (command.confidence === undefined) {
      command.confidence = 0.7; // rule-based default
    }

    // Slot filling check
    const missingSlots = this._checkSlots(command);
    if (missingSlots.length > 0) {
      return {
        ...command,
        raw: input,
        missingSlots,
        slotQuestion: this._buildSlotQuestion(missingSlots),
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
   * Define required/optional params for a command type.
   * @param {string} engine — 'query' | 'action' | 'flow'
   * @param {string} type — command type
   * @param {object} slots — { required?: string[], optional?: string[] }
   */
  defineSlots(engine, type, slots) {
    this.slotDefs.set(`${engine}:${type}`, {
      required: slots.required || [],
      optional: slots.optional || [],
    });
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

  // ── Private ──

  _checkSlots(command) {
    const key = `${command.engine}:${command.type}`;
    const def = this.slotDefs.get(key);
    if (!def || !def.required) return [];

    return def.required.filter(slot => {
      const val = command.params[slot];
      return val === undefined || val === null || val === '';
    });
  }

  _buildSlotQuestion(missingSlots) {
    if (missingSlots.length === 1) {
      return `请提供: ${missingSlots[0]}`;
    }
    return `请提供以下信息: ${missingSlots.join(', ')}`;
  }
}

/**
 * Rule-based parser with fuzzy matching and confidence scoring.
 */
export class RuleBasedParser {
  constructor() {
    this.rules = [];
    this.fuzzyEnabled = true;
  }

  addRule(pattern, builder) {
    this.rules.push({ pattern, builder });
  }

  /**
   * Parse input using registered rules with confidence scoring.
   */
  parse(input, context = {}) {
    const trimmed = input.trim();

    // Exact match first
    for (const rule of this.rules) {
      const match = trimmed.match(rule.pattern);
      if (match) {
        const cmd = rule.builder(match, context);
        cmd.confidence = 0.85;
        return cmd;
      }
    }

    // Fuzzy match: try with normalized input
    if (this.fuzzyEnabled) {
      const normalized = this._normalize(trimmed);
      if (normalized !== trimmed) {
        for (const rule of this.rules) {
          const match = normalized.match(rule.pattern);
          if (match) {
            const cmd = rule.builder(match, context);
            cmd.confidence = 0.6; // lower confidence for fuzzy match
            return cmd;
          }
        }
      }
    }

    return { engine: 'unknown', type: 'unrecognized', params: { text: trimmed }, confidence: 0 };
  }

  /**
   * Normalize input for fuzzy matching.
   * Handles common Chinese/English typos and variations.
   */
  _normalize(input) {
    let s = input;

    // Chinese character substitutions (common OCR/voice mistakes)
    const zhSubs = [
      [/查旬/g, '查询'],
      [/察询/g, '查询'],
      [/查寻/g, '查询'],
      [/添家/g, '添加'],
      [/天加/g, '添加'],
      [/删处/g, '删除'],
      [/删出/g, '删除'],
      [/修该/g, '修改'],
      [/休改/g, '修改'],
      [/执形/g, '执行'],
      [/执心/g, '执行'],
      [/薪曾/g, '新增'],
      [/建意/g, '建议'],
    ];

    for (const [from, to] of zhSubs) {
      s = s.replace(from, to);
    }

    // English normalization
    s = s.replace(/\s+/g, ' ').trim(); // collapse spaces

    return s;
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

    parser.addRule(/(?:update|modify|change)\s+(.+?)\s+(?:to|into|as)\s+(.+)/i, (m) => ({
      engine: 'action',
      type: 'update',
      params: { target: m[1].trim(), value: m[2].trim() },
    }));

    parser.addRule(/(?:run|execute|start)\s+(.+)/i, (m) => ({
      engine: 'flow',
      type: 'execute',
      params: { name: m[1].trim() },
    }));

    // Help pattern
    parser.addRule(/^(?:帮助|help|\?)$/i, () => ({
      engine: 'system',
      type: 'help',
      params: {},
    }));

    return parser;
  }
}
