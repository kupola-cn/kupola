// SPDX-License-Identifier: MIT
/**
 * @kupola/ai-adapter — Main Adapter Class (v2.0)
 *
 * 重构改进：
 * - 分离业务门面与基础设施
 * - 集成 CommandBus
 * - 全局错误边界
 * - 更好的中间件支持
 */

import { AIInfrastructure } from './infrastructure.js';
import { CapabilityRegistry } from './capability-registry.js';

export class AIAdapter {
  constructor(options = {}) {
    this.infrastructure = options.infrastructure || new AIInfrastructure(options);

    this.query = this.infrastructure.query;
    this.action = this.infrastructure.action;
    this.flow = this.infrastructure.flow;
    this.parser = this.infrastructure.parser;
    this.bus = this.infrastructure.bus;
    this.commandBus = this.infrastructure.commandBus;

    this.messages = [];
    this.maxMessages = options.maxMessages || 50;

    this.middlewares = [];

    this.errorHandler = options.errorHandler || ((error) => {
      if (typeof console !== 'undefined' && console.error) {
        console.error('[AIAdapter] Error:', error);
      }
    });

    this.capability = new CapabilityRegistry(this, options.capability || {});

    this._setupEventForwarding();
  }

  _setupEventForwarding() {
    this.bus.on('query:before', (data) => this.bus.emit('result', { command: { engine: 'query', type: data.type }, result: data }));
    this.bus.on('query:after', (data) => this.bus.emit('result', { command: { engine: 'query', type: data.type }, result: data.result }));

    this.bus.on('action:after', (data) => {
      this.bus.emit('result', { command: { engine: 'action', type: data.type }, result: data.result });
    });

    this.bus.on('flow:after', (data) => {
      this.bus.emit('flow:complete', data);
      this.bus.emit('result', { command: { engine: 'flow', type: data.name }, result: data });
    });
    this.bus.on('flow:step:before', (data) => this.bus.emit('flow:step', { step: data.step, label: data.label, status: 'running' }));
    this.bus.on('flow:step:running', (data) => this.bus.emit('flow:step', { step: data.step, label: data.label, status: 'running' }));
    this.bus.on('flow:step:done', (data) => this.bus.emit('flow:step', { step: data.step, label: data.label, status: 'done' }));

    this.bus.on('flow:step:error', (data) => this.bus.emit('flow:step', { step: data.step, label: data.label, status: 'error' }));
    this.bus.on('flow:step:skipped', (data) => this.bus.emit('flow:step', { step: data.step, label: data.label, status: 'skipped' }));
  }

  use(middleware) {
    this.middlewares.push(middleware);
    return this;
  }

  async process(input, context = {}) {
    if (!input || !input.trim()) {
      return { type: 'error', engine: 'unknown', success: false, error: 'Empty input' };
    }

    try {
      const trimmedInput = input.trim();
      this._addMessage('user', trimmedInput);

      const ctx = {
        input: trimmedInput,
        context,
        adapter: this,
      };

      this.bus.emit('input', { input: trimmedInput });

      const command = await this.parser.parse(ctx.input, ctx.context);
      ctx.command = command;
      this.bus.emit('parsed', { ...command, input: ctx.input, context: ctx.context });

      await this._runMiddlewares(ctx);

      if (ctx.result) {
        const msg = ctx.result.message || ctx.result.error || 'Operation failed.';
        if (ctx.result.success === false) {
          this._addMessage('system', `❌ ${msg}`);
        } else {
          this._addMessage('system', msg);
        }
        this.bus.emit('result', { command, result: ctx.result });
        return ctx.result;
      }

      let result;
      if (command.engine === 'unknown') {
        const msg = command.error || 'I didn\'t understand that. Try: 查询..., 添加..., 执行...';
        result = { success: false, error: msg, result: command };
      } else {
        result = await this.commandBus.dispatch(command, ctx.context);
      }

      ctx.result = result;

      const message = this._formatResultMessage(command, result);

      this._addMessage('system', message);

      if (command.engine !== 'unknown') {
        const learnResult = this.flow.trackAction(command);
        if (learnResult.suggest) {
          this._addMessage('suggestion', learnResult.message);
        }
      }

      this.bus.emit('result', { command, result });

      const returnType = command.engine === 'unknown' ? 'error' : command.type;
      return { result, type: returnType, engine: command.engine, message };
    } catch (error) {
      this.errorHandler(error);
      this._addMessage('system', `❌ ${error.message || 'Operation failed.'}`);
      this.bus.emit('result', { command: { engine: 'unknown', type: 'error' }, result: { success: false, error: error.message } });
      return { type: 'error', engine: 'unknown', success: false, error: error.message, message: error.message };
    }
  }

  async _runMiddlewares(ctx) {
    const middlewares = this.middlewares;
    let index = 0;

    const next = async () => {
      if (index >= middlewares.length) {
        return;
      }
      const mw = middlewares[index++];
      await mw(ctx, next);
    };

    await next();
  }

  async undo() {
    try {
      const result = await this.action.undo();
      if (result.success) {
        this._addMessage('system', `↩️ ${result.message}`);
      }
      return result;
    } catch (error) {
      this.errorHandler(error);
      return { success: false, error: error.message };
    }
  }

  _formatResultMessage(command, result) {
    if (result.success === false) {
      const err = result.error || result.message || 'Operation failed.';
      return `❌ ${err}`;
    }

    if (command.engine === 'query') {
      if (result.summary) return result.summary;
      if (Array.isArray(result.data)) {
        return `Found ${result.data.length} ${command.type} record(s).`;
      }
      return `Query "${command.type}" completed.`;
    }

    if (command.engine === 'action') {
      return `Action "${command.type}" completed successfully.`;
    }

    if (command.engine === 'flow') {
      return `Flow "${command.params?.name || command.name}" executed successfully.`;
    }

    return 'Operation completed.';
  }

  getPanelHTML() {
    return this._buildPanelHTML();
  }

  getMessages() {
    return [...this.messages];
  }

  clearConversation() {
    this.messages = [];
    this.parser.clearContext();
  }

  getDevToolsSnapshot() {
    return {
      version: '2.0.3',
      messages: this.getMessages(),
      middlewares: this.middlewares.length,
      query: {
        registered: this.query.handlers.size,
        history: this.query.history.length,
        cache: this.query.cache.size,
      },
      action: {
        registered: this.action.handlers.size,
        undoStack: this.action.undoStack.length,
        audit: this.action.auditLog.length,
      },
      capability: {
        registered: this.capability.items.size,
        ai: this.capability.getAICapabilities().length,
      },
      flow: {
        defined: this.flow.flows.size,
        executions: this.flow.executions.length,
      },
      events: this.bus.eventNames(),
    };
  }

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

  dispose() {
    this.infrastructure.dispose();
    this.middlewares = [];
    this.messages = [];
  }

  _addMessage(role, text) {
    this.messages.push({ role, text, timestamp: Date.now() });
    if (this.messages.length > this.maxMessages) {
      this.messages.shift();
    }
  }

  _buildPanelHTML() {
    const messages = this.messages.length > 0 
      ? this.messages.map((msg, i) => `
          <div class="ds-ai-msg ds-ai-msg-${msg.role}" :key="${i}" k-class="{ 'is-active': ${i === this.messages.length - 1} }">
            <div class="ds-ai-msg-text">${this._esc(msg.text)}</div>
          </div>
        `).join('')
      : '<div class="ds-ai-msg" :key="0" k-class="{ visible: true }"><div class="ds-ai-msg-text">Start typing...</div></div>';

    return `
      <div class="ds-ai-panel" k-data="{ messages: ${JSON.stringify(this.messages)} }">
        <div class="ds-ai-header">
          <span class="ds-ai-title">AI Assistant</span>
          <div class="ds-ai-header-actions">
            <button class="ds-ai-min-btn" title="最小化">─</button>
            <button class="ds-ai-close-btn" title="关闭">✕</button>
          </div>
        </div>
        <div class="ds-ai-messages">${messages}</div>
        <form @submit.prevent="handleSubmit">
          <input class="ds-ai-input" type="text" k-model.trim="input" placeholder="输入指令..." />
          <button class="ds-ai-send-btn" type="submit">发送</button>
        </form>
      </div>
    `;
  }

  _esc(str) {
    const d = document.createElement('div');
    d.textContent = String(str ?? '');
    return d.innerHTML;
  }
}
