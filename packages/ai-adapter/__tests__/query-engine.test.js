// SPDX-License-Identifier: MIT
import { QueryEngine } from '../src/query-engine.js';

describe('QueryEngine', () => {
  let engine;

  beforeEach(() => {
    engine = new QueryEngine();
  });

  describe('register + execute', () => {
    it('should register a handler and execute it', async () => {
      const handler = jest.fn().mockResolvedValue([{ name: '张三' }]);
      engine.register('employee', handler);

      const result = await engine.execute({ type: 'employee', params: { id: 1 } });

      expect(handler).toHaveBeenCalledWith({ id: 1 }, undefined);
      expect(result.success).toBe(true);
      expect(result.data).toEqual([{ name: '张三' }]);
    });

    it('should return error for unknown query type', async () => {
      const result = await engine.execute({ type: 'unknown', params: {} });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown query type');
      expect(result.available).toEqual([]);
    });

    it('should list available types in error response', async () => {
      engine.register('employee', jest.fn());
      engine.register('salary', jest.fn());

      const result = await engine.execute({ type: 'missing', params: {} });

      expect(result.success).toBe(false);
      expect(result.available).toEqual(['employee', 'salary']);
    });
  });

  describe('result formatting', () => {
    it('should format array result as table', async () => {
      engine.register('employee', async () => [
        { name: '张三', age: 25 },
        { name: '李四', age: 30 },
      ]);

      const result = await engine.execute({ type: 'employee', params: {} });

      expect(result.table).toEqual({
        columns: [{ field: 'name', title: 'name' }, { field: 'age', title: 'age' }],
        rows: [{ name: '张三', age: 25 }, { name: '李四', age: 30 }],
      });
    });

    it('should return null table for non-array result', async () => {
      engine.register('stats', async () => ({ total: 100 }));

      const result = await engine.execute({ type: 'stats', params: {} });

      expect(result.table).toBeNull();
    });

    it('should format array summary with count', async () => {
      engine.register('employee', async () => [{ name: '张三' }, { name: '李四' }]);

      const result = await engine.execute({ type: 'employee', params: {} });

      expect(result.summary).toBe('Found 2 employee record(s).');
    });

    it('should format object summary', async () => {
      engine.register('stats', async () => ({ total: 100 }));

      const result = await engine.execute({ type: 'stats', params: {} });

      expect(result.summary).toContain('stats');
    });

    it('should return null table for empty array', async () => {
      engine.register('employee', async () => []);

      const result = await engine.execute({ type: 'employee', params: {} });

      expect(result.table).toBeNull();
    });
  });

  describe('error handling', () => {
    it('should catch handler errors', async () => {
      engine.register('fail', async () => { throw new Error('DB error'); });

      const result = await engine.execute({ type: 'fail', params: {} });

      expect(result.success).toBe(false);
      expect(result.error).toBe('DB error');
    });
  });

  describe('history', () => {
    it('should store query results in history', async () => {
      engine.register('employee', async () => [{ name: '张三' }]);

      await engine.execute({ type: 'employee', params: { id: 1 } });

      const last = engine.getLastResult();
      expect(last).not.toBeNull();
      expect(last.type).toBe('employee');
      expect(last.result).toEqual([{ name: '张三' }]);
    });

    it('should evict oldest history when maxHistory exceeded', async () => {
      const small = new QueryEngine({ maxHistory: 2 });
      small.register('q', async () => 'ok');

      await small.execute({ type: 'q', params: { n: 1 } });
      await small.execute({ type: 'q', params: { n: 2 } });
      await small.execute({ type: 'q', params: { n: 3 } });

      expect(small.history.length).toBe(2);
      expect(small.history[0].params.n).toBe(2);
    });

    it('should return null for getLastResult when no history', () => {
      expect(engine.getLastResult()).toBeNull();
    });

    it('should clear history', async () => {
      engine.register('q', async () => 'ok');
      await engine.execute({ type: 'q', params: {} });

      engine.clearHistory();

      expect(engine.getLastResult()).toBeNull();
      expect(engine.history.length).toBe(0);
    });
  });

  describe('cache security', () => {
    it('should isolate cached query results by execution context', async () => {
      const handler = jest.fn(async (_params, context) => [{ role: context.role }]);
      engine.register('roles', handler);

      const admin = await engine.execute({ type: 'roles', params: {}, context: { role: 'admin' } });
      const user = await engine.execute({ type: 'roles', params: {}, context: { role: 'user' } });

      expect(admin.data).toEqual([{ role: 'admin' }]);
      expect(user.data).toEqual([{ role: 'user' }]);
      expect(user.cached).toBeUndefined();
      expect(handler).toHaveBeenCalledTimes(2);
    });
  });
});
