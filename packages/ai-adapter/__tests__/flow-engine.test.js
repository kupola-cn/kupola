// SPDX-License-Identifier: MIT
import { FlowEngine } from '../src/flow-engine.js';

// Mock storage for testing
function createMockStorage() {
  let data = null;
  return {
    get: () => data,
    set: (d) => { data = d; },
  };
}

describe('FlowEngine', () => {
  let engine;
  let storage;

  beforeEach(() => {
    storage = createMockStorage();
    engine = new FlowEngine({ storage });
  });

  describe('define', () => {
    it('should define a flow', () => {
      const flow = engine.define('发工资条', {
        steps: [{ label: '获取数据' }, { label: '发送' }],
        description: '月度发工资',
      });

      expect(flow.name).toBe('发工资条');
      expect(flow.steps.length).toBe(2);
      expect(flow.description).toBe('月度发工资');
    });

    it('should persist flow to storage', () => {
      engine.define('test', { steps: [{ label: 'step1' }] });

      const saved = storage.get();
      expect(saved).not.toBeNull();
      expect(saved.test).toBeDefined();
    });
  });

  describe('execute', () => {
    it('should execute all steps sequentially', async () => {
      const results = [];
      engine.define('flow1', {
        steps: [
          { label: 'step1', handler: async () => { results.push(1); return 'a'; } },
          { label: 'step2', handler: async () => { results.push(2); return 'b'; } },
        ],
      });

      const result = await engine.execute('flow1');

      expect(result.success).toBe(true);
      expect(result.results.length).toBe(2);
      expect(results).toEqual([1, 2]);
    });

    it('should pass data and previous results to handler', async () => {
      const receivedArgs = [];
      const handler = jest.fn().mockImplementation(async (data, results) => {
        receivedArgs.push({ data, resultsLen: results.length });
        return 'ok';
      });
      engine.define('flow', {
        steps: [{ label: 's1', handler }],
      });

      await engine.execute('flow', { name: '张三' });

      expect(handler).toHaveBeenCalled();
      expect(receivedArgs[0].data).toEqual({ name: '张三' });
      expect(receivedArgs[0].resultsLen).toBe(0);
    });

    it('should return error for unknown flow', async () => {
      const result = await engine.execute('missing');

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
      expect(result.available).toEqual([]);
    });

    it('should stop on step failure', async () => {
      engine.define('fail-flow', {
        steps: [
          { label: 'ok', handler: async () => 'ok' },
          { label: 'bad', handler: async () => { throw new Error('step error'); } },
          { label: 'never', handler: async () => 'never' },
        ],
      });

      const result = await engine.execute('fail-flow');

      expect(result.success).toBe(false);
      expect(result.failedAt).toBe(1);
      expect(result.results.length).toBe(2);
      expect(result.logs[1].status).toBe('error');
    });

    it('should skip steps without handler', async () => {
      engine.define('skip-flow', {
        steps: [{ label: 'no-handler' }],
      });

      const result = await engine.execute('skip-flow');

      expect(result.success).toBe(true);
      expect(result.results[0].data.skipped).toBe(true);
    });

    it('should increment executionCount', async () => {
      engine.define('counted', {
        steps: [{ label: 's', handler: async () => 'ok' }],
      });

      await engine.execute('counted');
      await engine.execute('counted');

      const list = engine.list();
      expect(list[0].executionCount).toBe(2);
    });

    it('should call onStep callback', async () => {
      const onStep = jest.fn();
      engine.define('cb-flow', {
        steps: [{ label: 's1', handler: async () => 'ok' }],
      });

      await engine.execute('cb-flow', {}, { onStep });

      expect(onStep).toHaveBeenCalledWith(0, 's1', 'running');
      expect(onStep).toHaveBeenCalledWith(0, 's1', 'done');
    });

    it('should call onComplete callback', async () => {
      const onComplete = jest.fn();
      engine.define('cb-flow', {
        steps: [{ label: 's', handler: async () => 'ok' }],
      });

      await engine.execute('cb-flow', {}, { onComplete });

      expect(onComplete).toHaveBeenCalled();
    });

    it('should call onError callback on step failure', async () => {
      const onError = jest.fn();
      engine.define('err-flow', {
        steps: [{ label: 'bad', handler: async () => { throw new Error('x'); } }],
      });

      await engine.execute('err-flow', {}, { onError });

      expect(onError).toHaveBeenCalledWith(0, 'bad', expect.any(Error));
    });
  });

  describe('remove', () => {
    it('should remove a defined flow', () => {
      engine.define('temp', { steps: [] });
      expect(engine.remove('temp')).toBe(true);
      expect(engine.list().length).toBe(0);
    });

    it('should return false for non-existent flow', () => {
      expect(engine.remove('nope')).toBe(false);
    });
  });

  describe('list', () => {
    it('should list all defined flows', () => {
      engine.define('f1', { steps: [{ label: 'a' }], description: 'desc1' });
      engine.define('f2', { steps: [{ label: 'x' }, { label: 'y' }] });

      const list = engine.list();
      expect(list.length).toBe(2);
      expect(list[0]).toMatchObject({ name: 'f1', description: 'desc1', steps: 1 });
      expect(list[1]).toMatchObject({ name: 'f2', steps: 2 });
    });
  });

  describe('trackAction (auto-learn)', () => {
    it('should not suggest below threshold', () => {
      engine.autoLearnThreshold = 3;

      const r1 = engine.trackAction({ type: 'addEmployee', params: { name: 'a' } });
      const r2 = engine.trackAction({ type: 'addEmployee', params: { name: 'b' } });

      expect(r1.suggest).toBe(false);
      expect(r2.suggest).toBe(false);
    });

    it('should suggest when threshold reached', () => {
      engine.autoLearnThreshold = 3;

      engine.trackAction({ type: 'addEmployee', params: { name: 'a' } });
      engine.trackAction({ type: 'addEmployee', params: { name: 'b' } });
      const r3 = engine.trackAction({ type: 'addEmployee', params: { name: 'c' } });

      expect(r3.suggest).toBe(true);
      expect(r3.count).toBe(3);
      expect(r3.message).toContain('3');
    });

    it('should differentiate by param keys', () => {
      engine.autoLearnThreshold = 2;

      engine.trackAction({ type: 'add', params: { name: 'a' } });
      const r = engine.trackAction({ type: 'add', params: { id: 1 } });

      expect(r.suggest).toBe(false); // different param keys
    });
  });

  describe('clearHistory', () => {
    it('should clear executions and action patterns', () => {
      engine.executions.push({ flow: 'x' });
      engine.actionPatterns.push({ key: 'a' });

      engine.clearHistory();

      expect(engine.executions.length).toBe(0);
      expect(engine.actionPatterns.length).toBe(0);
    });
  });

  describe('persistence', () => {
    it('should load flows from storage on init', () => {
      storage.set({
        saved: {
          description: 'saved flow',
          variables: ['x'],
          executionCount: 5,
          createdAt: 123456,
          steps: [{ label: 's1', action: 'op', params: {} }],
        },
      });

      const eng = new FlowEngine({ storage });
      const list = eng.list();

      expect(list.length).toBe(1);
      expect(list[0]).toMatchObject({ name: 'saved', description: 'saved flow', executionCount: 5 });
    });

    it('should handle empty storage gracefully', () => {
      const eng = new FlowEngine({ storage: createMockStorage() });
      expect(eng.list().length).toBe(0);
    });
  });
});
