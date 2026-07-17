// SPDX-License-Identifier: MIT
/**
 * @kupola/ai-adapter — Main Adapter Class (v1.2)
 *
 * Enhancements over v1.1:
 * - EventBus: replaces internal Map-based listeners with full pub/sub (once, wildcard)
 * - DevTools: getDevToolsSnapshot() + createDevToolsLogger middleware
 * - Normalized event names: input / parsed / result / flow:step / flow:complete / action:before / action:after
 */

import { IntentParser, RuleBasedParser } from './intent-parser.js';
import { QueryEngine } from './query-engine.js';
import { ActionEngine } from './action-engine.js';
import { FlowEngine } from './flow-engine.js';
import { EventBus } from './event-bus.js';
import { CapabilityRegistry } from './capability-registry.js';

export class AIAdapter {
  constructor(options = {}) {
    // Initialize engines — pass bus so they can emit directly
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

    // EventBus (replaces the old Map-based listeners)
    this.bus = options.bus || new EventBus();

    // Centralized AI-facing capability registry
    this.capability = new CapabilityRegistry(this, options.capability || {});

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
   * ctx = { input, context, command?, result?, adapter }
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
   * Parses first, then runs middleware around the execution step so guards can
   * inspect the structured command before anything is executed.
   */
  async process(input, context = {}) {
    this._addMessage('user', input);
    this.bus.emit('input', { input });

    const command = await this.parser.parse(input, context);
    command.context = this._mergeContext(command.context, context);

    const ctx = {
      input,
      context,
      command,
      result: null,
      adapter: this,
      finalized: false,
    };

    const chain = this._buildMiddlewareChain(ctx, async () => {
      ctx.result = await this._processCommand(ctx.command, ctx.context);
      ctx.finalized = true;
    });
    await chain();

    if (!ctx.finalized) {
      this._finalizeMiddlewareResult(ctx);
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
      <div class="ds-ai-panel" k-data="{ aiInput: '', aiMessages: [] }">
        <div class="ds-ai-messages">
          <template k-for="msg in aiMessages">
            <div k-bind:class="'ds-ai-msg ds-ai-msg-' + msg.role" k-text="msg.text"></div>
          </template>
        </div>
        <div class="ds-ai-input-area">
          <input class="ds-ai-input" k-model="aiInput" placeholder="输入指令..."
                 k-on:keydown="if(event.key==='Enter' && aiInput.trim()) { submitAI(aiInput); aiInput='' }" />
          <button class="ds-ai-send-btn" k-on:click="if(aiInput.trim()) { submitAI(aiInput); aiInput='' }">发送</button>
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

  // ── EventBus proxy methods ─────────────────────────────

  on(event, callback) {
    return this.bus.on(event, callback);
  }

  off(event, callback) {
    this.bus.off(event, callback);
  }

  once(event, callback) {
    return this.bus.once(event, callback);
  }

  wildcard(pattern, callback) {
    return this.bus.wildcard(pattern, callback);
  }

  // ── DevTools ───────────────────────────────────────────

  /**
   * Return a snapshot of the adapter's full runtime state.
   * Useful for DevTools panels, debugging, and telemetry.
   */
  getDevToolsSnapshot() {
    return {
      version: '2.0.3',
      messages: [...this.messages],
      middlewares: this.middlewares.length,
      query: {
        registered: this.query.handlers.size,
        history: this.query.history.length,
        cache: (this.query.cache || new Map()).size,
      },
      action: {
        registered: this.action.handlers.size,
        undoStack: this.action.undoStack.length,
        audit: this.action.auditLog.length,
      },
      capability: {
        registered: this.capability.list().length,
        ai: this.capability.getAICapabilities().length,
      },
      flow: {
        defined: this.flow.flows.size,
        executions: this.flow.executions.length,
      },
      events: this.bus.eventNames(),
    };
  }

  // ── Private ────────────────────────────────────────────

  _buildMiddlewareChain(ctx, terminal = async () => {}) {
    const middlewares = this.middlewares;
    let index = 0;

    const next = async () => {
      if (index >= middlewares.length) {
        await terminal();
        return;
      }
      const mw = middlewares[index++];
      await mw(ctx, next);
    };

    return async () => {
      await next();
    };
  }

  async _processCommand(command, context = {}) {
    if (command.engine === 'unknown') {
      const msg = command.error || 'I didn\'t understand that. Try: 查询..., 添加..., 执行...';
      this._addMessage('system', msg);
      const output = { type: 'error', engine: 'unknown', result: command, message: msg };
      this.bus.emit('result', { command, result: output });
      return output;
    }

    this.bus.emit('parsed', command);

    // Slot filling: ask for missing params
    if (command.missingSlots && command.missingSlots.length > 0) {
      const question = command.slotQuestion || `请提供: ${command.missingSlots.join(', ')}`;
      this._addMessage('system', question);
      const output = { type: 'slot-fill', engine: command.engine, result: command, message: question, missingSlots: command.missingSlots };
      this.bus.emit('result', { command, result: output });
      return output;
    }

    // Route to appropriate engine
    let result;
    switch (command.engine) {
      case 'query':
        result = await this.query.execute(command);
        break;
      case 'action':
        this.bus.emit('action:before', { type: command.type, params: command.params });
        result = await this.action.execute(command, {
          onConfirm: context.onConfirm || this._defaultConfirm.bind(this),
        });
        this.bus.emit('action:after', { type: command.type, result });
        const suggestion = this.flow.trackAction(command);
        if (suggestion.suggest) {
          this._addMessage('suggestion', suggestion.message);
          result.suggestion = suggestion;
        }
        break;
      case 'flow':
        if (command.type === 'execute') {
          result = await this.flow.execute(command.params.name, command.params.data || {}, {
            onStep: (i, label, status) => this.bus.emit('flow:step', { step: i, label, status }),
            onComplete: () => this.bus.emit('flow:complete', { flow: command.params.name }),
          }, { context: command.context || context });
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
    this.bus.emit('result', { command, result });

    return { type: command.engine, engine: command.engine, result, message, confidence: command.confidence };
  }

  _addMessage(role, text) {
    this.messages.push({ role, text, timestamp: Date.now() });
    if (this.messages.length > this.maxMessages) {
      this.messages.shift();
    }
  }

  _finalizeMiddlewareResult(ctx) {
    if (!ctx.result) {
      ctx.result = {
        type: 'error',
        engine: 'middleware',
        success: false,
        error: 'Middleware stopped processing without returning a result.',
      };
    }

    const message = ctx.result.message || ctx.result.error || 'Operation stopped.';
    ctx.result.message = ctx.result.message || message;

    const displayMessage = ctx.result.success === false && !/^[❌⚠️]/.test(message)
      ? `❌ ${message}`
      : message;

    this._addMessage('system', displayMessage);
    this.bus.emit('result', { command: ctx.command, result: ctx.result });
    ctx.finalized = true;
  }

  _mergeContext(commandContext, processContext) {
    return {
      ...(commandContext || {}),
      ...(processContext || {}),
    };
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
    if (typeof window !== 'undefined' && typeof window.confirm === 'function') {
      if (String(window.confirm).includes('notImplemented')) return false;
      try {
        return !!window.confirm(`确认执行「${label}」？\n${JSON.stringify(params || {}, null, 2)}`);
      } catch {
        return false;
      }
    }
    return false;
  }
}
