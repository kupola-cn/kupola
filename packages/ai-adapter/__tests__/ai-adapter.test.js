// SPDX-License-Identifier: MIT
import { AIAdapter } from '../src/ai-adapter.js';

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

      expect(html).toContain('kupola-ai-panel');
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
});
