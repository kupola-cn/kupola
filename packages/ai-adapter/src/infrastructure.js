// SPDX-License-Identifier: MIT
/**
 * @kupola/ai-adapter — Infrastructure Layer
 *
 * 基础设施层，负责组装和管理所有核心组件。
 * 与业务门面 AIAdapter 分离，提升可测试性和可替换性。
 */

import { Container } from './container.js';
import { EventBus } from './event-bus.js';
import { QueryEngine } from './query-engine.js';
import { ActionEngine } from './action-engine.js';
import { FlowEngine } from './flow-engine.js';
import { IntentParser, RuleBasedParser } from './intent-parser.js';
import { CommandBus } from './command-bus.js';

export class AIInfrastructure {
  constructor(options = {}) {
    this.options = options;
    this.container = this._createContainer();
    this._registerServices();
  }

  _createContainer() {
    const container = new Container();

    container.register('bus', EventBus, { singleton: true });

    container.register('query', QueryEngine, {
      singleton: true,
      factory: (c) => new QueryEngine(this.options.query, c.resolve('bus')),
    });

    container.register('action', ActionEngine, {
      singleton: true,
      factory: (c) => new ActionEngine(this.options.action, c.resolve('bus')),
    });

    container.register('flow', FlowEngine, {
      singleton: true,
      factory: (c) => new FlowEngine(this.options.flow, c.resolve('bus')),
    });

    container.register('parser', IntentParser, {
      singleton: true,
      factory: () => {
        const fallbackParser = this.options.parser || RuleBasedParser.createDefault();
        return new IntentParser({
          ai: this.options.ai || null,
          fallback: fallbackParser,
          maxContext: this.options.maxContext,
          storage: this.options.storage || null,
        });
      },
    });

    container.register('commandBus', CommandBus, {
      singleton: true,
      factory: (c) => new CommandBus(c.resolve('bus')),
    });

    return container;
  }

  _registerServices() {
    this.bus = this.container.resolve('bus');
    this.query = this.container.resolve('query');
    this.action = this.container.resolve('action');
    this.flow = this.container.resolve('flow');
    this.parser = this.container.resolve('parser');
    this.commandBus = this.container.resolve('commandBus');

    this._setupCommandHandlers();
  }

  _setupCommandHandlers() {
    const queryHandler = (command, context) => this.query.execute(command, context);

    const actionHandler = (command, context) => this.action.execute({ ...command, context }, {});

    const flowHandler = (command, context) => {
      if (command.type === 'define') {
        return { success: false, error: 'Flow define not supported via command bus' };
      }
      return this.flow.execute(command.params?.name || command.name, command.params || {}, {}, { context });
    };

    this.commandBus.register({ engine: 'query', type: '*' }, queryHandler, { priority: 1000 });
    this.commandBus.register({ engine: 'action', type: '*' }, actionHandler, { priority: 1000 });
    this.commandBus.register({ engine: 'flow', type: '*' }, flowHandler, { priority: 1000 });
  }

  dispose() {
    this.container.clear();
  }
}
