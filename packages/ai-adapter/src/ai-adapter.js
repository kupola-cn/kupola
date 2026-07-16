// SPDX-License-Identifier: MIT
/**
 * @kupola/ai-adapter — Main Adapter Class (v1.1)
 *
 * Enhancements:
 * - Middleware system: adapter.use(fn) for extensible processing pipeline
 * - Confidence display in response messages
 * - Slot filling support (ask for missing params)
 */

import { IntentParser, RuleBasedParser } from './intent-parser.js';
import { QueryEngine } from './query-engine.js';
import { ActionEngine } from './action-engine.js';
import { FlowEngine } from './flow-engine.js';

export class AIAdapter {
  constructor(options = {}) {
    // Initialize engines
    this.query = new QueryEngine(options.query);
    this.action = new ActionEngine(options.action);
    this.flow = new FlowEngine(options.flow);

    // Initialize parser
    const fallbackParser = options.parser || RuleBasedParser.createDefault();
    this.parser = new IntentParser({
      ai: options.ai || null,
      fallback: fallbackParser,
      maxContext: options.maxContext,
    });

    // Event listeners
    this.listeners = new Map();

    // Message log
    this.messages = [];
    this.maxMessages = options.maxMessages || 50;

    // Middleware pipeline
    this.middlewares = [];
  }

  /**
   * Add a middleware to the processing pipeline.
   * Middleware signature: async (ctx, next) => { ... }
   *
   * ctx = { input, command?, result?, adapter }
   *
   * Example:
   *   adapter.use(async (ctx, next) => {
   *     console.log('Before:', ctx.input);
   *     await next();
   *     console.log('After:', ctx.result);
   *   });
   *
   * @param {Function} middleware
   * @returns {AIAdapter} this (for chaining)
   */
  use(middleware) {
    this.middlewares.push(middleware);
    return this;
  }

  /**
   * Process natural language input end-to-end.
   * Runs through middleware pipeline, then routes to engine.
   */
  async process(input, context = {}) {
    const ctx = {
      input,
      context,
      command: null,
      result: null,
      adapter: this,
    };

    // Build middleware chain
    const chain = this._buildMiddlewareChain(ctx);
    await chain();

    // If middleware didn't produce a result, do normal processing
    if (!ctx.result) {
      ctx.result = await this._processCore(input, context);
    }

    return ctx.result;
  }

  /**
   * Undo the last action.
   */
  async undo() {
    const result = await this.action.undo();
    const msg = result.success ? `✅ ${result.message}` : `❌ ${result.message || result.error}`;
    this._addMessage('system', msg);
    return result;
  }

  /**
   * Get the UI panel component (for Kupola integration).
   */
  getPanelHTML() {
    return `
      <div class="kupola-ai-panel" k-data="{ aiInput: '', aiMessages: [] }">
        <div class="kupola-ai-messages">
          <template k-for="msg in aiMessages">
            <div k-bind:class="'kupola-ai-msg kupola-ai-msg-' + msg.role" k-text="msg.text"></div>
          </template>
        </div>
        <div class="kupola-ai-input">
          <input k-model="aiInput" placeholder="输入指令..."
                 k-on:keydown="if(event.key==='Enter' && aiInput.trim()) { submitAI(aiInput); aiInput='' }" />
          <button k-on:click="if(aiInput.trim()) { submitAI(aiInput); aiInput='' }">发送</button>
        </div>
      </div>
    `;
  }

  getMessages() {
    return [...this.messages];
  }

  clearConversation() {
    this.messages = [];
    this.parser.clearContext();
    this.query.clearHistory();
    this.flow.clearHistory();
  }

  on(event, callback) {
    if (!this.listeners.has(event)) this.listeners.set(event, []);
    this.listeners.get(event).push(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    const list = this.listeners.get(event);
    if (list) {
      const idx = list.indexOf(callback);
      if (idx >= 0) list.splice(idx, 1);
    }
  }

  // ── Private ────────────────────────────────────────

  _buildMiddlewareChain(ctx) {
    const middlewares = this.middlewares;
    let index = 0;

    const next = async () => {
      if (index >= middlewares.length) return;
      const mw = middlewares[index++];
      await mw(ctx, next);
    };

    return async () => {
      await next();
    };
  }

  async _processCore(input, context = {}) {
    // Add user message
    this._addMessage('user', input);
    this._emit('input', { input });

    // Parse intent
    const command = await this.parser.parse(input, context);

    if (command.engine === 'unknown') {
      const msg = command.error || 'I didn\'t understand that. Try: 查询..., 添加..., 执行...';
      this._addMessage('system', msg);
      return { type: 'error', engine: 'unknown', result: command, message: msg };
    }

    // Slot filling: ask for missing params
    if (command.missingSlots && command.missingSlots.length > 0) {
      const question = command.slotQuestion || `请提供: ${command.missingSlots.join(', ')}`;
      this._addMessage('system', question);
      return { type: 'slot-fill', engine: command.engine, result: command, message: question, missingSlots: command.missingSlots };
    }

    this._emit('parsed', command);

    // Route to appropriate engine
    let result;
    switch (command.engine) {
      case 'query':
        result = await this.query.execute(command);
        break;
      case 'action':
        result = await this.action.execute(command, {
          onConfirm: context.onConfirm || this._defaultConfirm.bind(this),
        });
        const suggestion = this.flow.trackAction(command);
        if (suggestion.suggest) {
          this._addMessage('suggestion', suggestion.message);
          result.suggestion = suggestion;
        }
        break;
      case 'flow':
        if (command.type === 'execute') {
          result = await this.flow.execute(command.params.name, command.params.data || {}, {
            onStep: (i, label, status) => this._emit('flowStep', { step: i, label, status }),
          });
        } else if (command.type === 'define') {
          result = { success: true, message: `Flow "${command.params.name}" defined.`, data: command.params };
        } else {
          result = { success: false, error: `Unknown flow command: ${command.type}` };
        }
        break;
      default:
        result = { success: false, error: `Unknown engine: ${command.engine}` };
    }

    // Format response message
    const message = this._formatResponse(command, result);
    this._addMessage('system', message);
    this._emit('result', { command, result });

    return { type: command.engine, engine: command.engine, result, message, confidence: command.confidence };
  }

  _emit(event, data) {
    const list = this.listeners.get(event);
    if (list) list.forEach(cb => cb(data));
  }

  _addMessage(role, text) {
    this.messages.push({ role, text, timestamp: Date.now() });
    if (this.messages.length > this.maxMessages) {
      this.messages.shift();
    }
  }

  _formatResponse(command, result) {
    if (!result.success) {
      if (result.cancelled) return `⏸️ Operation cancelled.`;
      return `❌ ${result.error || 'Operation failed.'}`;
    }

    const conf = command.confidence < 0.7 ? ` (confidence: ${Math.round(command.confidence * 100)}%)` : '';

    switch (command.engine) {
      case 'query':
        return `🔍 ${result.summary}${conf}${result.cached ? ' (cached)' : ''}`;
      case 'action':
        return `✅ Action "${command.type}" completed.${result.undoable ? ' (undoable)' : ''}${conf}`;
      case 'flow':
        if (result.logs) {
          const done = result.logs.filter(l => l.status === 'success').length;
          return `📌 Flow completed: ${done}/${result.logs.length} steps done.`;
        }
        return `📌 ${result.message || 'Flow operation complete.'}`;
      default:
        return 'Done.';
    }
  }

  async _defaultConfirm(label, params) {
    return true;
  }
}
