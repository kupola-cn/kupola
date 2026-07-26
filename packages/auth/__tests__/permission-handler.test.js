import {
  registerPermissionHandler,
  getPermissionHandler,
  clearPermissionHandler,
} from '../src/permission-handler.js';

describe('permission-handler', () => {
  beforeEach(() => {
    clearPermissionHandler();
  });

  describe('registerPermissionHandler', () => {
    it('should register permission handler with check function', () => {
      const check = jest.fn(() => true);
      const handler = registerPermissionHandler({ check });

      expect(handler.check).toBe(check);
      expect(getPermissionHandler()).toBe(handler);
    });

    it('should throw error for missing check function', () => {
      expect(() => registerPermissionHandler({})).toThrow();
      expect(() => registerPermissionHandler({ check: 'invalid' })).toThrow();
    });

    it('should throw error for invalid options', () => {
      expect(() => registerPermissionHandler(null)).toThrow();
      expect(() => registerPermissionHandler('invalid')).toThrow();
    });

    it('should use default values for optional fields', () => {
      const handler = registerPermissionHandler({ check: () => true });

      expect(handler.defaultMode).toBe('hide');
      expect(handler.disabledClass).toBe('k-permission-disabled');
      expect(typeof handler.fallback).toBe('function');
      expect(handler.cache).toBe(true);
      expect(typeof handler.onChange).toBe('function');
    });

    it('should use custom values for optional fields', () => {
      const fallback = jest.fn();
      const onChange = jest.fn(() => () => {});

      const handler = registerPermissionHandler({
        check: () => true,
        defaultMode: 'disabled',
        disabledClass: 'custom-disabled',
        fallback,
        cache: false,
        onChange,
      });

      expect(handler.defaultMode).toBe('disabled');
      expect(handler.disabledClass).toBe('custom-disabled');
      expect(handler.fallback).toBe(fallback);
      expect(handler.cache).toBe(false);
      expect(handler.onChange).toBe(onChange);
    });

    it('should reject an invalid disabled class', () => {
      expect(() => registerPermissionHandler({ check: () => true, disabledClass: 1 }))
        .toThrow(/disabledClass/);
    });
  });

  describe('getPermissionHandler', () => {
    it('should return registered handler', () => {
      const check = () => true;
      const handler = registerPermissionHandler({ check });

      expect(getPermissionHandler()).toBe(handler);
    });

    it('should return null if no handler registered', () => {
      clearPermissionHandler();
      expect(getPermissionHandler()).toBeNull();
    });
  });

  describe('clearPermissionHandler', () => {
    it('should clear registered handler', () => {
      registerPermissionHandler({ check: () => true });
      clearPermissionHandler();

      expect(getPermissionHandler()).toBeNull();
    });
  });
});
