// SPDX-License-Identifier: MIT
/**
 * @kupola/auth — Router guard utilities.
 *
 * requireAuth - Check if user is authenticated
 * requirePermission - Check if user has specific permission
 * requireRole - Check if user has specific role
 * redirectTo - Redirect to URL
 *
 * Note: These are utility functions, not actual router guards.
 * Router guards should be implemented by the host framework.
 *
 * @module router-tools
 */

export function requireAuth(authContext) {
  if (!authContext) {return false;}
  return authContext.isAuthenticated === true;
}

export function requirePermission(authContext, permission) {
  if (!authContext) {return false;}
  if (!permission) {return true;}
  return typeof authContext.hasPermission === 'function'
    && authContext.hasPermission(permission);
}

export function requireRole(authContext, role) {
  if (!authContext) {return false;}
  if (!role) {return true;}
  return typeof authContext.hasRole === 'function' && authContext.hasRole(role);
}

export function redirectTo(url, options = {}) {
  if (typeof window === 'undefined') {
    return;
  }

  const { redirectUrl } = options;

  if (redirectUrl) {
    const targetUrl = new URL(url, window.location.origin);
    targetUrl.searchParams.set('redirectUrl', redirectUrl);
    window.location.href = targetUrl.href;
  } else {
    window.location.href = url;
  }
}
