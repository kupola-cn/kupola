import {
  createAuthContext,
  hydrateAuthContext,
  getAuthContext,
  setAuthContext,
  AUTH_KEY,
} from '../src/auth-context.js';

describe('auth-context', () => {
  beforeEach(() => {
    setAuthContext(null);
  });

  describe('createAuthContext', () => {
    it('should create auth context with user data', () => {
      const user = {
        id: '1',
        name: 'Admin',
        role: 'admin',
        permissions: ['user:read', 'user:write'],
        attributes: { department: 'sales' },
      };

      const context = createAuthContext(user);

      expect(context.user).toEqual(user);
      expect(context.role).toBe('admin');
      expect(context.permissions).toEqual(['user:read', 'user:write']);
      expect(context.attributes).toEqual({ department: 'sales' });
      expect(context.isAuthenticated).toBe(true);
    });

    it('should create auth context with default values', () => {
      const user = { id: '2', name: 'User' };
      const context = createAuthContext(user);

      expect(context.role).toBe('');
      expect(context.permissions).toEqual([]);
      expect(context.attributes).toEqual({});
      expect(context.isAuthenticated).toBe(true);
    });

    it('should throw error for invalid user', () => {
      expect(() => createAuthContext(null)).toThrow();
      expect(() => createAuthContext(undefined)).toThrow();
      expect(() => createAuthContext('invalid')).toThrow();
    });

    it('should set current auth context', () => {
      const user = { id: '1', name: 'Admin', role: 'admin', permissions: ['user:read'], attributes: {} };
      createAuthContext(user);

      expect(getAuthContext()).toEqual(expect.objectContaining({ user }));
    });
  });

  describe('hasRole', () => {
    it('should return true for matching role', () => {
      const context = createAuthContext({ id: '1', role: 'admin' });
      expect(context.hasRole('admin')).toBe(true);
    });

    it('should return false for non-matching role', () => {
      const context = createAuthContext({ id: '1', role: 'editor' });
      expect(context.hasRole('admin')).toBe(false);
    });

    it('should return false for empty role', () => {
      const context = createAuthContext({ id: '1', role: '' });
      expect(context.hasRole('admin')).toBe(false);
    });
  });

  describe('hasPermission', () => {
    it('should return true for matching permission', () => {
      const context = createAuthContext({ id: '1', permissions: ['user:read'] });
      expect(context.hasPermission('user:read')).toBe(true);
    });

    it('should return false for non-matching permission', () => {
      const context = createAuthContext({ id: '1', permissions: ['user:read'] });
      expect(context.hasPermission('user:write')).toBe(false);
    });

    it('should return false for empty permission', () => {
      const context = createAuthContext({ id: '1', permissions: ['user:read'] });
      expect(context.hasPermission('')).toBe(false);
    });
  });

  describe('hasAnyPermission', () => {
    it('should return true if any permission matches', () => {
      const context = createAuthContext({ id: '1', permissions: ['user:read', 'user:write'] });
      expect(context.hasAnyPermission(['user:read', 'admin'])).toBe(true);
    });

    it('should return false if no permission matches', () => {
      const context = createAuthContext({ id: '1', permissions: ['user:read'] });
      expect(context.hasAnyPermission(['user:delete', 'admin'])).toBe(false);
    });

    it('should return false for empty array', () => {
      const context = createAuthContext({ id: '1', permissions: ['user:read'] });
      expect(context.hasAnyPermission([])).toBe(false);
    });
  });

  describe('hasAllPermissions', () => {
    it('should return true if all permissions match', () => {
      const context = createAuthContext({ id: '1', permissions: ['user:read', 'user:write'] });
      expect(context.hasAllPermissions(['user:read', 'user:write'])).toBe(true);
    });

    it('should return false if any permission missing', () => {
      const context = createAuthContext({ id: '1', permissions: ['user:read'] });
      expect(context.hasAllPermissions(['user:read', 'user:write'])).toBe(false);
    });

    it('should return false for empty array', () => {
      const context = createAuthContext({ id: '1', permissions: ['user:read'] });
      expect(context.hasAllPermissions([])).toBe(false);
    });
  });

  describe('hydrateAuthContext', () => {
    beforeEach(() => {
      document.documentElement.removeAttribute('data-kupola-auth');
    });

    it('should hydrate from DOM attribute', () => {
      document.documentElement.setAttribute('data-kupola-auth', JSON.stringify({
        id: '1',
        name: 'Admin',
        role: 'admin',
        permissions: ['user:read'],
      }));

      const context = hydrateAuthContext();

      expect(context).not.toBeNull();
      expect(context.user.id).toBe('1');
      expect(context.role).toBe('admin');
      expect(context.permissions).toEqual(['user:read']);
    });

    it('should return null if no attribute', () => {
      expect(hydrateAuthContext()).toBeNull();
    });

    it('should return null if invalid JSON', () => {
      document.documentElement.setAttribute('data-kupola-auth', 'invalid json');
      expect(hydrateAuthContext()).toBeNull();
    });
  });

  describe('getAuthContext', () => {
    it('should return current context', () => {
      const user = { id: '1', name: 'Admin' };
      const context = createAuthContext(user);

      expect(getAuthContext()).toBe(context);
    });

    it('should return null if no context set', () => {
      setAuthContext(null);
      expect(getAuthContext()).toBeNull();
    });
  });

  describe('setAuthContext', () => {
    it('should set current context', () => {
      const user = { id: '1', name: 'Admin' };
      const context = createAuthContext(user);

      setAuthContext(context);
      expect(getAuthContext()).toBe(context);
    });

    it('should clear context when set to null', () => {
      createAuthContext({ id: '1', name: 'Admin' });
      setAuthContext(null);

      expect(getAuthContext()).toBeNull();
    });
  });

  describe('AUTH_KEY', () => {
    it('should be a symbol', () => {
      expect(typeof AUTH_KEY).toBe('symbol');
    });
  });
});