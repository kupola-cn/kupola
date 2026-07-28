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
  const options = arguments[2];
  const match = typeof options === 'string'
    ? options
    : options?.match || options?.mode || 'any';
  const check = value => {
    if (typeof value === 'string' && value.startsWith('role:')) {
      return typeof authContext.hasRole === 'function'
        && authContext.hasRole(value.slice(5));
    }
    return typeof authContext.hasPermission === 'function'
      && authContext.hasPermission(value);
  };
  if (!Array.isArray(permission)) {
    return check(permission);
  }
  if (permission.length === 0) {return false;}
  if (match === 'all') {
    if (typeof authContext.hasAllPermissions === 'function') {
      return authContext.hasAllPermissions(permission);
    }
    return permission.every(check);
  }
  if (typeof authContext.hasAnyPermission === 'function') {
    return authContext.hasAnyPermission(permission);
  }
  return permission.some(check);
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

  const origin = window.location.origin || null;
  const isSafeUrl = value => {
    if (typeof value !== 'string' || !value) {return false;}
    if (!origin) {return !/^[a-z][a-z\d+.-]*:/i.test(value) && !value.startsWith('//');}
    try {
      return new URL(value, origin).origin === origin;
    } catch {
      return false;
    }
  };
  if (!isSafeUrl(url)) {return;}

  const { redirectUrl } = options;

  if (redirectUrl) {
    if (!isSafeUrl(redirectUrl)) {return;}
    const targetUrl = new URL(url, window.location.origin);
    targetUrl.searchParams.set('redirectUrl', redirectUrl);
    window.location.href = targetUrl.href;
  } else {
    window.location.href = url;
  }
}
