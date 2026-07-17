// SPDX-License-Identifier: MIT
import { AIAdapter } from '../src/ai-adapter.js';
import { createAuthGuard } from '../src/middlewares.js';

function createMockStorage() {
  let data = null;
  return { get: () => data, set: (d) => { data = d; } };
}

describe('AIAdapter', () => {
  let adapter;

  beforeEach(() => {
    adapter = new AIAdapter({
      flow: { storage: createMockStorage() },
      action: { requireConfirm: false },
    });
  });

  describe('process() end-to-end', () => {
    it('should route query commands to query engine', async () => {
      adapter.query.register('search', async (params) => [
        { name: params.keyword },
      ]);

      const result = await adapter.process('查询张三');

      expect(result.engine).toBe('query');
      expect(result.result.success).toBe(true);
      expect(result.message).toContain('Found');
    });

    it('should route action commands to action engine', async () => {
      adapter.action.register('create', {
        handler: async (params) => ({ created: true }),
        confirm: false,
      });

      const result = await adapter.process('添加员工张三');

      expect(result.engine).toBe('action');
      expect(result.result.success).toBe(true);
    });

    it('should route flow commands to flow engine', async () => {
      adapter.flow.define('发工资条', {
        steps: [{ label: '发送', handler: async () => 'sent' }],
      });

      const result = await adapter.process('执行发工资条');

      expect(result.engine).toBe('flow');
      expect(result.result.success).toBe(true);
    });

    it('should return error for unrecognized commands', async () => {
      const result = await adapter.process('hello random text');

      expect(result.engine).toBe('unknown');
      expect(result.type).toBe('error');
    });

    it('should add user and system messages', async () => {
      adapter.query.register('search', async () => []);

      await adapter.process('查询张三');

      const messages = adapter.getMessages();
      expect(messages.length).toBe(2);
      expect(messages[0].role).toBe('user');
      expect(messages[1].role).toBe('system');
    });
  });

  describe('events', () => {
    it('should emit input event', async () => {
      const handler = jest.fn();
      adapter.on('input', handler);

      adapter.query.register('search', async () => []);
      await adapter.process('查询 test');

      expect(handler).toHaveBeenCalledWith({ input: '查询 test' });
    });

    it('should emit parsed event', async () => {
      const handler = jest.fn();
      adapter.on('parsed', handler);

      adapter.query.register('search', async () => []);
      await adapter.process('查询 test');

      expect(handler).toHaveBeenCalledWith(expect.objectContaining({ engine: 'query' }));
    });

    it('should emit result event', async () => {
      const handler = jest.fn();
      adapter.on('result', handler);

      adapter.query.register('search', async () => [{ id: 1 }]);
      await adapter.process('查询 test');

      expect(handler).toHaveBeenCalledWith(expect.objectContaining({
        command: expect.objectContaining({ engine: 'query' }),
        result: expect.objectContaining({ success: true }),
      }));
    });

    it('should support off() to remove listener', async () => {
      const handler = jest.fn();
      adapter.on('input', handler);
      adapter.off('input', handler);

      adapter.query.register('search', async () => []);
      await adapter.process('查询 test');

      expect(handler).not.toHaveBeenCalled();
    });

    it('should return unsubscribe function from on()', async () => {
      const handler = jest.fn();
      const unsub = adapter.on('input', handler);
      unsub();

      adapter.query.register('search', async () => []);
      await adapter.process('查询 test');

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('messages', () => {
    it('should respect maxMessages limit', async () => {
      const small = new AIAdapter({
        maxMessages: 4,
        flow: { storage: createMockStorage() },
        action: { requireConfirm: false },
      });
      small.query.register('search', async () => []);

      // Each process adds 2 messages (user + system)
      await small.process('查询 a');
      await small.process('查询 b');
      await small.process('查询 c');

      expect(small.getMessages().length).toBe(4); // max 4, oldest evicted
    });

    it('should return copy of messages', async () => {
      adapter.query.register('search', async () => []);
      await adapter.process('查询 test');

      const msg1 = adapter.getMessages();
      const msg2 = adapter.getMessages();

      expect(msg1).not.toBe(msg2); // different array references
      expect(msg1).toEqual(msg2);
    });
  });

  describe('undo', () => {
    it('should proxy undo to action engine', async () => {
      const undoFn = jest.fn().mockResolvedValue();
      adapter.action.register('create', {
        handler: jest.fn().mockResolvedValue({ id: 1 }),
        undo: undoFn,
        confirm: false,
      });

      await adapter.process('添加员工张三');
      const result = await adapter.undo();

      expect(result.success).toBe(true);
      expect(undoFn).toHaveBeenCalled();
    });

    it('should add system message after undo', async () => {
      adapter.action.register('create', {
        handler: jest.fn().mockResolvedValue('ok'),
        undo: jest.fn().mockResolvedValue(),
        confirm: false,
      });

      await adapter.process('添加员工');
      await adapter.undo();

      const messages = adapter.getMessages();
      const lastMsg = messages[messages.length - 1];
      expect(lastMsg.role).toBe('system');
    });
  });

  describe('clearConversation', () => {
    it('should reset all state', async () => {
      adapter.query.register('search', async () => []);
      await adapter.process('查询 test');

      adapter.clearConversation();

      expect(adapter.getMessages().length).toBe(0);
      expect(adapter.parser.getHistory().length).toBe(0);
    });
  });

  describe('getPanelHTML', () => {
    it('should return HTML string with Kupola directives', () => {
      const html = adapter.getPanelHTML();

      expect(html).toContain('ds-ai-panel');
      expect(html).toContain('k-data');
      expect(html).toContain('k-model');
      expect(html).toContain('k-on:click');
    });
  });

  describe('flow auto-learn suggestion', () => {
    it('should add suggestion message when threshold reached', async () => {
      adapter.flow.autoLearnThreshold = 3;
      adapter.action.register('create', {
        handler: jest.fn().mockResolvedValue('ok'),
        confirm: false,
      });

      await adapter.process('添加员工 a');
      await adapter.process('添加员工 b');
      await adapter.process('添加员工 c');

      const messages = adapter.getMessages();
      const suggestion = messages.find(m => m.role === 'suggestion');
      expect(suggestion).toBeDefined();
    });
  });

  describe('response formatting', () => {
    it('should format query success message', async () => {
      adapter.query.register('search', async () => [{ id: 1 }, { id: 2 }]);

      const result = await adapter.process('查询 data');

      expect(result.message).toContain('Found 2');
    });

    it('should format action success message', async () => {
      adapter.action.register('create', {
        handler: jest.fn().mockResolvedValue('ok'),
        confirm: false,
      });

      const result = await adapter.process('添加 something');

      expect(result.message).toContain('completed');
    });

    it('should format error message', async () => {
      adapter.action.register('create', {
        handler: async () => { throw new Error('fail'); },
        confirm: false,
      });

      const result = await adapter.process('添加 something');

      expect(result.message).toContain('❌');
    });
  });

  describe('EventBus integration', () => {
    it('should emit input event on process', async () => {
      const fn = jest.fn();
      adapter.on('input', fn);
      await adapter.process('查询 something');
      expect(fn).toHaveBeenCalledWith(expect.objectContaining({ input: '查询 something' }));
    });

    it('should support once() listener', async () => {
      const fn = jest.fn();
      adapter.once('input', fn);
      await adapter.process('查询 a');
      await adapter.process('查询 b');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should support wildcard() for flow:* events', async () => {
      const fn = jest.fn();
      adapter.wildcard('flow:*', fn);

      adapter.flow.define('test-flow', {
        steps: [{ label: 'step1', handler: async () => ({}) }],
      });
      await adapter.process('执行 test-flow');

      // Should have received flow:step and flow:complete
      const eventNames = fn.mock.calls.map(c => c[0]);
      expect(eventNames).toContain('flow:step');
    });

    it('should emit action:before and action:after for action commands', async () => {
      const before = jest.fn();
      const after = jest.fn();
      adapter.on('action:before', before);
      adapter.on('action:after', after);

      adapter.action.register('test', { handler: async () => ({}), confirm: false });
      await adapter.process('添加 test');

      expect(before).toHaveBeenCalled();
      expect(after).toHaveBeenCalled();
    });
  });

  describe('getDevToolsSnapshot', () => {
    it('should return a complete snapshot structure', () => {
      adapter.query.register('q1', async () => ({}));
      adapter.action.register('a1', { handler: async () => ({}), confirm: false });
      adapter.use(async (ctx, next) => next());

      const snap = adapter.getDevToolsSnapshot();

      expect(snap.version).toBe('2.0.3');
      expect(snap.messages).toEqual([]);
      expect(snap.middlewares).toBe(1);
      expect(snap.query.registered).toBe(1);
      expect(snap.action.registered).toBe(1);
      expect(snap.flow.defined).toBe(0);
      expect(snap.events).toEqual(expect.any(Array));
    });

    it('should reflect message history after process', async () => {
      adapter.query.register('search', async () => [{ id: 1 }]);
      await adapter.process('查询 q');

      const snap = adapter.getDevToolsSnapshot();
      expect(snap.messages.length).toBeGreaterThanOrEqual(2); // user + system
      expect(snap.query.history).toBe(1);
    });
  });

  describe('middleware pipeline', () => {
    it('should allow middleware to short-circuit with result', async () => {
      adapter.use(async (ctx, next) => {
        ctx.result = { type: 'intercepted', message: 'blocked by middleware' };
        // don't call next()
      });

      const result = await adapter.process('查询 something');
      expect(result.type).toBe('intercepted');
    });

    it('should block restricted actions after parsing and before execution', async () => {
      const handler = jest.fn().mockResolvedValue({ deleted: true });
      adapter.action.register('delete', { handler, confirm: false });
      adapter.use(createAuthGuard({ restrictedTypes: ['delete'], allowedRoles: ['admin'] }));

      const result = await adapter.process('删除员工张三', { role: 'user' });

      expect(result.engine).toBe('auth-guard');
      expect(result.code).toBe('PERMISSION_DENIED');
      expect(handler).not.toHaveBeenCalled();
      expect(adapter.getMessages().at(-1).text).toContain('无权限');
    });

    it('should allow restricted actions for allowed roles', async () => {
      const handler = jest.fn().mockResolvedValue({ deleted: true });
      adapter.action.register('delete', { handler, confirm: false });
      adapter.use(createAuthGuard({ restrictedTypes: ['delete'], allowedRoles: ['admin'] }));

      const result = await adapter.process('删除员工张三', { role: 'admin' });

      expect(result.engine).toBe('action');
      expect(result.result.success).toBe(true);
      expect(handler).toHaveBeenCalled();
    });

    it('should block restricted queries with centralized rules', async () => {
      const handler = jest.fn().mockResolvedValue([{ id: 1, name: 'admin' }]);
      adapter.query.register('search', handler);
      adapter.use(createAuthGuard({
        rules: [{ engine: 'query', type: 'search', roles: ['admin'] }],
      }));

      const result = await adapter.process('查询所有角色', { role: 'user' });

      expect(result.engine).toBe('auth-guard');
      expect(result.command.engine).toBe('query');
      expect(handler).not.toHaveBeenCalled();
    });

    it('should block restricted flow names', async () => {
      const step = jest.fn().mockResolvedValue('ok');
      adapter.flow.define('发工资条', {
        steps: [{ label: '发送', handler: step }],
      });
      adapter.use(createAuthGuard({ restrictedFlows: ['发工资条'], allowedRoles: ['admin'] }));

      const result = await adapter.process('执行发工资条', { role: 'user' });

      expect(result.engine).toBe('auth-guard');
      expect(step).not.toHaveBeenCalled();
    });

    it('should pass process context to query and action handlers', async () => {
      const query = jest.fn().mockResolvedValue([]);
      const action = jest.fn().mockResolvedValue({});
      adapter.query.register('search', query);
      adapter.action.register('create', { handler: action, confirm: false });

      await adapter.process('查询角色', { userId: 7, role: 'admin' });
      await adapter.process('添加员工', { userId: 7, role: 'admin' });

      expect(query).toHaveBeenCalledWith(expect.any(Object), expect.objectContaining({ userId: 7 }));
      expect(action).toHaveBeenCalledWith(expect.any(Object), expect.objectContaining({ userId: 7 }));
    });

    it('should cancel confirm-required actions when no confirmer is available', async () => {
      const secured = new AIAdapter({
        flow: { storage: createMockStorage() },
      });
      const handler = jest.fn().mockResolvedValue({ ok: true });
      secured.action.register('create', { handler, confirm: true });

      const result = await secured.process('添加员工张三');

      expect(result.result.cancelled).toBe(true);
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('capability registry', () => {
    it('should register query capability and filter result fields', async () => {
      const secured = new AIAdapter({
        ai: async () => ({
          engine: 'query',
          type: 'roles',
          params: { keyword: 'admin', extra: 'ignored' },
        }),
      });
      const handler = jest.fn().mockResolvedValue([
        { id: 1, name: 'Admin', code: 'admin', password: 'secret', internal: 'hidden' },
      ]);

      secured.capability.register({
        engine: 'query',
        type: 'roles',
        roles: ['admin'],
        paramsSchema: { keyword: 'string' },
        resultFields: ['id', 'name', 'code', 'password'],
        handler,
      });

      const result = await secured.process('查询角色', { role: 'admin' });

      expect(result.engine).toBe('query');
      expect(result.result.success).toBe(true);
      expect(handler).toHaveBeenCalledWith({ keyword: 'admin' }, expect.objectContaining({ role: 'admin' }));
      expect(result.result.data).toEqual([
        { id: 1, name: 'Admin', code: 'admin', password: '[REDACTED]' },
      ]);
    });

    it('should block capability without permission before handler execution', async () => {
      const secured = new AIAdapter({
        ai: async () => ({
          engine: 'action',
          type: 'delete_user',
          params: { id: 1 },
        }),
        action: { requireConfirm: false },
      });
      const handler = jest.fn().mockResolvedValue({ ok: true });

      secured.capability.register({
        engine: 'action',
        type: 'delete_user',
        roles: ['admin'],
        paramsSchema: { id: 'number' },
        handler,
      });
      secured.use(secured.capability.middleware());

      const result = await secured.process('删除用户', { role: 'user' });

      expect(result.engine).toBe('capability');
      expect(result.code).toBe('PERMISSION_DENIED');
      expect(handler).not.toHaveBeenCalled();
    });

    it('should reject invalid capability params', async () => {
      const secured = new AIAdapter({
        ai: async () => ({
          engine: 'action',
          type: 'update_status',
          params: { status: 'invalid' },
        }),
        action: { requireConfirm: false },
      });
      const handler = jest.fn().mockResolvedValue({ ok: true });

      secured.capability.register({
        engine: 'action',
        type: 'update_status',
        paramsSchema: { status: { type: 'string', enum: ['enabled', 'disabled'] } },
        handler,
      });
      secured.use(secured.capability.middleware());

      const result = await secured.process('修改状态');

      expect(result.engine).toBe('capability');
      expect(result.code).toBe('INVALID_PARAMS');
      expect(handler).not.toHaveBeenCalled();
    });

    it('should expose only accessible AI capabilities for context', () => {
      const secured = new AIAdapter();
      secured.capability.registerMany([
        { engine: 'query', type: 'roles', roles: ['admin'], handler: async () => [] },
        { engine: 'query', type: 'materials', roles: ['user'], handler: async () => [] },
      ]);

      const caps = secured.capability.getAICapabilities({ role: 'user' });

      expect(caps.map(item => item.type)).toEqual(['materials']);
      expect(caps[0]).not.toHaveProperty('handler');

      const allCaps = secured.capability.getAICapabilities({ history: [] });
      expect(allCaps.map(item => item.type)).toEqual(['roles', 'materials']);
    });

    it('should keep handler-level failure as failure', async () => {
      const secured = new AIAdapter({
        ai: async () => ({
          engine: 'action',
          type: 'create_order',
          params: {},
        }),
        action: { requireConfirm: false },
      });

      secured.capability.register({
        engine: 'action',
        type: 'create_order',
        handler: async () => ({ success: false, error: 'blocked' }),
      });

      const result = await secured.process('创建采购单');

      expect(result.result.success).toBe(false);
      expect(result.result.error).toBe('blocked');
    });
  });
});
