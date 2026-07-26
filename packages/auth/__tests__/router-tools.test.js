/**
 * @jest-environment node
 */

import {
  requireAuth,
  requirePermission,
  requireRole,
  redirectTo,
} from '../src/router-tools.js';

describe('router-tools', () => {
  describe('requireAuth', () => {
    it('should return true for authenticated user', () => {
      const context = { isAuthenticated: true };
      expect(requireAuth(context)).toBe(true);
    });

    it('should return false for unauthenticated user', () => {
      const context = { isAuthenticated: false };
      expect(requireAuth(context)).toBe(false);
    });

    it('should return false for null context', () => {
      expect(requireAuth(null)).toBe(false);
    });

    it('should return false for undefined context', () => {
      expect(requireAuth(undefined)).toBe(false);
    });
  });

  describe('requirePermission', () => {
    it('should fail closed for incomplete auth contexts', () => {
      expect(requirePermission({}, 'user:read')).toBe(false);
    });

    it('should return true if user has permission', () => {
      const context = { hasPermission: jest.fn(() => true) };
      expect(requirePermission(context, 'user:read')).toBe(true);
      expect(context.hasPermission).toHaveBeenCalledWith('user:read');
    });

    it('should return false if user does not have permission', () => {
      const context = { hasPermission: jest.fn(() => false) };
      expect(requirePermission(context, 'user:write')).toBe(false);
    });

    it('should return true for empty permission', () => {
      const context = { hasPermission: jest.fn(() => false) };
      expect(requirePermission(context, '')).toBe(true);
      expect(requirePermission(context, null)).toBe(true);
      expect(requirePermission(context, undefined)).toBe(true);
    });

    it('should return false for null context', () => {
      expect(requirePermission(null, 'user:read')).toBe(false);
    });
  });

  describe('requireRole', () => {
    it('should fail closed for incomplete auth contexts', () => {
      expect(requireRole({}, 'admin')).toBe(false);
    });

    it('should return true if user has role', () => {
      const context = { hasRole: jest.fn(() => true) };
      expect(requireRole(context, 'admin')).toBe(true);
      expect(context.hasRole).toHaveBeenCalledWith('admin');
    });

    it('should return false if user does not have role', () => {
      const context = { hasRole: jest.fn(() => false) };
      expect(requireRole(context, 'admin')).toBe(false);
    });

    it('should return true for empty role', () => {
      const context = { hasRole: jest.fn(() => false) };
      expect(requireRole(context, '')).toBe(true);
      expect(requireRole(context, null)).toBe(true);
      expect(requireRole(context, undefined)).toBe(true);
    });

    it('should return false for null context', () => {
      expect(requireRole(null, 'admin')).toBe(false);
    });
  });

  describe('redirectTo', () => {
    beforeEach(() => {
      delete global.window;
    });

    it('should redirect to URL', () => {
      global.window = { location: { href: '' } };
      redirectTo('/login');
      expect(global.window.location.href).toBe('/login');
    });

    it('should redirect with redirectUrl parameter', () => {
      global.window = { location: { href: '', origin: 'http://localhost:3000' } };
      redirectTo('/login', { redirectUrl: '/dashboard' });
      expect(global.window.location.href).toBe(
        'http://localhost:3000/login?redirectUrl=%2Fdashboard',
      );
    });

    it('should do nothing in non-browser environment', () => {
      redirectTo('/login');
    });
  });
});
