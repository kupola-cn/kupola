// SPDX-License-Identifier: MIT
/**
 * EventBus tests — on/off/emit/once/wildcard/removeAll
 */

import { EventBus } from '../src/event-bus.js';

describe('EventBus', () => {
  let bus;

  beforeEach(() => {
    bus = new EventBus();
  });

  describe('on / emit', () => {
    it('should call listener when event is emitted', () => {
      const fn = jest.fn();
      bus.on('test', fn);
      bus.emit('test', { value: 42 });
      expect(fn).toHaveBeenCalledWith({ value: 42 });
    });

    it('should support multiple listeners on the same event', () => {
      const a = jest.fn();
      const b = jest.fn();
      bus.on('test', a);
      bus.on('test', b);
      bus.emit('test', 'hello');
      expect(a).toHaveBeenCalledWith('hello');
      expect(b).toHaveBeenCalledWith('hello');
    });

    it('should not call listeners for different events', () => {
      const fn = jest.fn();
      bus.on('a', fn);
      bus.emit('b');
      expect(fn).not.toHaveBeenCalled();
    });
  });

  describe('off', () => {
    it('should remove a specific listener', () => {
      const fn = jest.fn();
      bus.on('test', fn);
      bus.off('test', fn);
      bus.emit('test');
      expect(fn).not.toHaveBeenCalled();
    });

    it('should return an unsubscribe function from on()', () => {
      const fn = jest.fn();
      const unsub = bus.on('test', fn);
      unsub();
      bus.emit('test');
      expect(fn).not.toHaveBeenCalled();
    });
  });

  describe('once', () => {
    it('should fire only once', () => {
      const fn = jest.fn();
      bus.once('test', fn);
      bus.emit('test', 1);
      bus.emit('test', 2);
      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith(1);
    });

    it('should return an unsubscribe function', () => {
      const fn = jest.fn();
      const unsub = bus.once('test', fn);
      unsub();
      bus.emit('test');
      expect(fn).not.toHaveBeenCalled();
    });
  });

  describe('wildcard', () => {
    it('should match events with matching prefix', () => {
      const fn = jest.fn();
      bus.wildcard('flow:*', fn);
      bus.emit('flow:step', { step: 1 });
      bus.emit('flow:complete', { flow: 'test' });
      expect(fn).toHaveBeenCalledTimes(2);
      expect(fn).toHaveBeenCalledWith('flow:step', { step: 1 });
      expect(fn).toHaveBeenCalledWith('flow:complete', { flow: 'test' });
    });

    it('should not match events with different prefix', () => {
      const fn = jest.fn();
      bus.wildcard('flow:*', fn);
      bus.emit('action:before', {});
      expect(fn).not.toHaveBeenCalled();
    });

    it('should return an unsubscribe function', () => {
      const fn = jest.fn();
      const unsub = bus.wildcard('flow:*', fn);
      unsub();
      bus.emit('flow:step');
      expect(fn).not.toHaveBeenCalled();
    });
  });

  describe('removeAll', () => {
    it('should clear all listeners', () => {
      const fn1 = jest.fn();
      const fn2 = jest.fn();
      bus.on('a', fn1);
      bus.wildcard('b:*', fn2);
      bus.removeAll();
      bus.emit('a');
      bus.emit('b:x');
      expect(fn1).not.toHaveBeenCalled();
      expect(fn2).not.toHaveBeenCalled();
    });
  });

  describe('listenerCount / eventNames', () => {
    it('should return correct listener count', () => {
      expect(bus.listenerCount('test')).toBe(0);
      bus.on('test', () => {});
      expect(bus.listenerCount('test')).toBe(1);
      bus.on('test', () => {});
      expect(bus.listenerCount('test')).toBe(2);
    });

    it('should return all event names', () => {
      bus.on('a', () => {});
      bus.on('b', () => {});
      expect(bus.eventNames().sort()).toEqual(['a', 'b']);
    });
  });

  describe('error handling', () => {
    it('should swallow listener errors and continue', () => {
      const badFn = () => { throw new Error('boom'); };
      const goodFn = jest.fn();
      bus.on('test', badFn);
      bus.on('test', goodFn);
      bus.emit('test');
      expect(goodFn).toHaveBeenCalled();
    });
  });
});
