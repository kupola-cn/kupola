// SPDX-License-Identifier: MIT
/**
 * @kupola/ai-adapter — Command Bus
 *
 * 统一命令调度层，实现命令的验证、授权、执行和事件发布的完整生命周期。
 *
 * 优先级支持：
 * - 支持为 handler 设置优先级（数字越小优先级越高）
 * - 同一 commandType 可以注册多个 handler，按优先级顺序执行
 * - 支持 before/after 钩子模式
 */

export class CommandBus {
  constructor(bus) {
    this.handlers = new Map();
    this.validators = new Map();
    this.authorizers = new Map();
    this.bus = bus;
  }

  register(commandType, handler, options = {}) {
    const key = this._getKey(commandType);
    const priority = options.priority ?? 100;

    if (!this.handlers.has(key)) {
      this.handlers.set(key, []);
    }

    const handlerList = this.handlers.get(key);

    if (handlerList.length > 0 && options.priority === undefined) {
      console.warn(`CommandBus: Multiple handlers registered for "${key}" without explicit priority. Consider setting priority option.`);
    }

    handlerList.push({ handler, priority });
    handlerList.sort((a, b) => a.priority - b.priority);

    if (options.validate) {
      this.validators.set(key, options.validate);
    }
    if (options.authorize) {
      this.authorizers.set(key, options.authorize);
    }

    return () => this.unregister(commandType, handler);
  }

  unregister(commandType, handler = null) {
    const key = this._getKey(commandType);

    if (handler) {
      const handlerList = this.handlers.get(key);
      if (handlerList) {
        const idx = handlerList.findIndex(h => h.handler === handler);
        if (idx >= 0) {
          handlerList.splice(idx, 1);
          if (handlerList.length === 0) {
            this.handlers.delete(key);
          }
        }
      }
    } else {
      this.handlers.delete(key);
      this.validators.delete(key);
      this.authorizers.delete(key);
    }
  }

  async dispatch(command, context = {}) {
    const key = this._getKey(command.engine, command.type);
    const wildcardKey = `${command.engine}:*`;

    await this._validate(command, key);
    await this._authorize(command, context, key);

    this.bus.emit('command:before', { command, context });

    const exactHandlers = this.handlers.get(key) || [];
    const wildcardHandlers = this.handlers.get(wildcardKey) || [];

    const allHandlers = [ ...exactHandlers, ...wildcardHandlers ]
      .sort((a, b) => a.priority - b.priority);

    if (allHandlers.length === 0) {
      throw new Error(`No handler registered for: ${command.engine}:${command.type}`);
    }

    let result;
    let error = null;

    for (const { handler } of allHandlers) {
      try {
        result = await handler(command, context, result);
      } catch (err) {
        error = err;
        this.bus.emit('command:error', { command, error, context });
        break;
      }
    }

    if (error) {
      throw error;
    }

    this.bus.emit('command:success', { command, result, context });
    this.bus.emit('command:after', { command, result, context });

    return result;
  }

  async _validate(command, key) {
    const validator = this.validators.get(key);
    if (validator) {
      const error = await validator(command);
      if (error) {
        throw new Error(`Validation failed: ${error}`);
      }
    }
  }

  async _authorize(command, context, key) {
    const authorizer = this.authorizers.get(key);
    if (authorizer) {
      const allowed = await authorizer(command, context);
      if (!allowed) {
        throw new Error('Authorization failed');
      }
    }
  }

  _getKey(engine, type) {
    if (typeof engine === 'object') {
      return `${engine.engine}:${engine.type}`;
    }
    return `${engine}:${type}`;
  }

  hasHandler(commandType) {
    const key = this._getKey(commandType);
    const exactList = this.handlers.get(key);
    if (exactList && exactList.length > 0) {return true;}

    const parts = key.split(':');
    const wildcardKey = `${parts[0]}:*`;
    const wildcardList = this.handlers.get(wildcardKey);
    return wildcardList && wildcardList.length > 0;
  }

  listHandlers() {
    const result = [];
    for (const [ key, handlers ] of this.handlers) {
      for (const { handler, priority } of handlers) {
        result.push({ key, priority, handler: handler.name || 'anonymous' });
      }
    }
    return result;
  }

  getHandlers(commandType) {
    const key = this._getKey(commandType);
    return this.handlers.get(key) || [];
  }
}
