// SPDX-License-Identifier: MIT
/**
 * @kupola/auth — Auth context management.
 *
 * createAuthContext - Create an auth context from user data
 * hydrateAuthContext - Restore auth context from DOM attribute (SSR)
 * getAuthContext - Get current auth context
 * setAuthContext - Set current auth context
 *
 * @module auth-context
 */

let currentAuthContext = null;

export const AUTH_KEY = Symbol('kupola.auth');

export function createAuthContext(user) {
  if (!user || typeof user !== 'object') {
    throw new TypeError('[kupola/auth] createAuthContext() expects a user object.');
  }

  const { id, name, role = '', permissions = [], attributes = {} } = user;

  const hasRole = (roleName) => {
    if (!roleName) return false;
    return role === roleName;
  };

  const hasPermission = (permission) => {
    if (!permission) return false;
    return permissions.includes(permission);
  };

  const hasAnyPermission = (permissionList) => {
    if (!Array.isArray(permissionList) || permissionList.length === 0) return false;
    return permissionList.some(p => permissions.includes(p));
  };

  const hasAllPermissions = (permissionList) => {
    if (!Array.isArray(permissionList) || permissionList.length === 0) return false;
    return permissionList.every(p => permissions.includes(p));
  };

  const context = {
    user: { id, name, role, permissions, attributes },
    role,
    permissions,
    attributes,
    hasRole,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isAuthenticated: !!id,
  };

  currentAuthContext = context;
  return context;
}

export function hydrateAuthContext() {
  if (typeof document === 'undefined') {
    return null;
  }

  const htmlElement = document.documentElement;
  const authData = htmlElement.getAttribute('data-kupola-auth');

  if (!authData) {
    return null;
  }

  try {
    const parsed = JSON.parse(authData);
    return createAuthContext(parsed);
  } catch (e) {
    console.error('[kupola/auth] Failed to parse data-kupola-auth:', e);
    return null;
  }
}

export function getAuthContext() {
  return currentAuthContext;
}

export function setAuthContext(context) {
  currentAuthContext = context;
}