// SPDX-License-Identifier: MIT
import { ActionEngine } from '../src/action-engine.js';

describe('ActionEngine', () => {
  let engine;

  beforeEach(() => {
    engine = new ActionEngine({ requireConfirm: false });
  });

  describe('register + execute', () => {
    it('should register and execute an action', async () => {
      const handler = jest.fn().mockResolvedValue({ id: 1 });
      engine.register('addEmployee', { handler });

      const result = await engine.execute({ type: 'addEmployee', params: { name: '张三' } });

      expect(handler).toHaveBeenCalledWith({ name: '张三' });
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ id: 1 });
    });

    it('should return error for unknown action', async () => {
      const result = await engine.execute({ type: 'missing', params: {} });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown action');
      expect(result.available).toEqual([]);
    });

    it('should list available actions in error', async () => {
      engine.register('a', { handler: jest.fn() });
      engine.register('b', { handler: jest.fn() });

      const result = await engine.execute({ type: 'x', params: {} });

      expect(result.available).toEqual(['a', 'b']);
    });

    it('should catch handler errors', async () => {
      engine.register('fail', { handler: async () => { throw new Error('boom'); } });

      const result = await engine.execute({ type: 'fail', params: {} });

      expect(result.success).toBe(false);
      expect(result.error).toBe('boom');
    });
  });

  describe('confirmation', () => {
    it('should require confirmation when confirm=true', async () => {
      const onConfirm = jest.fn().mockResolvedValue(true);
      const handler = jest.fn().mockResolvedValue('ok');
      engine.register('delete', { handler, confirm: true });

      const result = await engine.execute(
        { type: 'delete', params: { id: 1 } },
        { onConfirm }
      );

      expect(onConfirm).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it('should cancel when confirmation rejected', async () => {
      const onConfirm = jest.fn().mockResolvedValue(false);
      engine.register('delete', { handler: jest.fn(), confirm: true });

      const result = await engine.execute(
        { type: 'delete', params: {} },
        { onConfirm }
      );

      expect(result.success).toBe(false);
      expect(result.cancelled).toBe(true);
    });

    it('should skip confirmation when confirm=false', async () => {
      const onConfirm = jest.fn();
      const handler = jest.fn().mockResolvedValue('ok');
      engine.register('safe', { handler, confirm: false });

      await engine.execute({ type: 'safe', params: {} }, { onConfirm });

      expect(onConfirm).not.toHaveBeenCalled();
    });

    it('should use constructor onConfirm as fallback', async () => {
      const globalConfirm = jest.fn().mockResolvedValue(true);
      const eng = new ActionEngine({ requireConfirm: true, onConfirm: globalConfirm });
      eng.register('op', { handler: jest.fn().mockResolvedValue('ok') });

      await eng.execute({ type: 'op', params: {} });

      expect(globalConfirm).toHaveBeenCalled();
    });
  });

  describe('undo', () => {
    it('should support undo when undo handler provided', async () => {
      const undoFn = jest.fn().mockResolvedValue();
      engine.register('add', {
        handler: jest.fn().mockResolvedValue({ id: 1 }),
        undo: undoFn,
      });

      const result = await engine.execute({ type: 'add', params: { name: '张三' } });
      expect(result.undoable).toBe(true);

      const undoResult = await engine.undo();
      expect(undoResult.success).toBe(true);
      expect(undoFn).toHaveBeenCalledWith({ name: '张三' });
    });

    it('should not be undoable without undo handler', async () => {
      engine.register('noop', { handler: jest.fn().mockResolvedValue('ok') });

      const result = await engine.execute({ type: 'noop', params: {} });
      expect(result.undoable).toBe(false);
    });

    it('should return message when nothing to undo', async () => {
      const result = await engine.undo();
      expect(result.success).toBe(false);
      expect(result.message).toContain('Nothing to undo');
    });

    it('should respect maxUndo limit', async () => {
      const eng = new ActionEngine({ maxUndo: 2, requireConfirm: false });
      eng.register('op', {
        handler: jest.fn().mockResolvedValue('ok'),
        undo: jest.fn().mockResolvedValue(),
      });

      await eng.execute({ type: 'op', params: { n: 1 } });
      await eng.execute({ type: 'op', params: { n: 2 } });
      await eng.execute({ type: 'op', params: { n: 3 } });

      expect(eng.undoStack.length).toBe(2);
    });

    it('should handle undo handler errors', async () => {
      engine.register('bad', {
        handler: jest.fn().mockResolvedValue('ok'),
        undo: async () => { throw new Error('undo fail'); },
      });

      await engine.execute({ type: 'bad', params: {} });
      const result = await engine.undo();

      expect(result.success).toBe(false);
      expect(result.error).toBe('undo fail');
    });

    it('should track canUndo state', async () => {
      expect(engine.canUndo()).toBe(false);

      engine.register('op', {
        handler: jest.fn().mockResolvedValue('ok'),
        undo: jest.fn().mockResolvedValue(),
      });
      await engine.execute({ type: 'op', params: {} });

      expect(engine.canUndo()).toBe(true);
    });
  });

  describe('callbacks', () => {
    it('should call onSuccess callback', async () => {
      const onSuccess = jest.fn();
      engine.register('op', { handler: jest.fn().mockResolvedValue({ id: 1 }) });

      await engine.execute({ type: 'op', params: {} }, { onSuccess });

      expect(onSuccess).toHaveBeenCalledWith({ id: 1 });
    });

    it('should call onError callback', async () => {
      const onError = jest.fn();
      const err = new Error('fail');
      engine.register('op', { handler: async () => { throw err; } });

      await engine.execute({ type: 'op', params: {} }, { onError });

      expect(onError).toHaveBeenCalledWith(err);
    });
  });

  describe('getActions', () => {
    it('should return registered actions with metadata', () => {
      engine.register('add', { handler: jest.fn(), label: '添加' });
      engine.register('del', { handler: jest.fn(), confirm: true });

      const actions = engine.getActions();

      expect(actions).toEqual([
        { name: 'add', label: '添加', confirm: false },
        { name: 'del', label: 'del', confirm: true },
      ]);
    });
  });
});
