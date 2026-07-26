// SPDX-License-Identifier: MIT
/**
 * Isolated authentication and permission state.
 *
 * The default exported APIs keep their historical singleton behavior. Apps
 * that share a page can create one store per app and pass it to consumers.
 *
 * @module store
 */

function assertObject(value, message) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(message);
  }
}

function createContext(user, setAuthContext) {
  assertObject(user, '[kupola/auth] createAuthContext() expects a user object.');

  const { id, name, role = '', permissions = [], attributes = {} } = user;
  const normalizedPermissions = Array.isArray(permissions) ? [ ...permissions ] : [];
  const normalizedAttributes = attributes && typeof attributes === 'object' && !Array.isArray(attributes)
    ? { ...attributes }
    : {};
  const normalizedUser = {
    ...user,
    id,
    name,
    role,
    permissions: normalizedPermissions,
    attributes: normalizedAttributes,
  };

  const context = {
    user: normalizedUser,
    role,
    permissions: normalizedPermissions,
    attributes: normalizedAttributes,
    hasRole(roleName) {
      return Boolean(roleName) && role === roleName;
    },
    hasPermission(permission) {
      return Boolean(permission) && normalizedPermissions.includes(permission);
    },
    hasAnyPermission(permissionList) {
      return Array.isArray(permissionList)
        && permissionList.length > 0
        && permissionList.some(permission => normalizedPermissions.includes(permission));
    },
    hasAllPermissions(permissionList) {
      return Array.isArray(permissionList)
        && permissionList.length > 0
        && permissionList.every(permission => normalizedPermissions.includes(permission));
    },
    isAuthenticated: isPresentIdentifier(id),
  };

  setAuthContext(context);
  return context;
}

function isPresentIdentifier(id) {
  if (typeof id === 'number') {
    return Number.isFinite(id);
  }
  return typeof id === 'string' ? id.length > 0 : false;
}

function createPermissionHandler(options) {
  assertObject(options, '[kupola/auth] registerPermissionHandler() expects an options object.');

  if (typeof options.check !== 'function') {
    throw new TypeError('[kupola/auth] registerPermissionHandler() expects a check function.');
  }
  if (options.fallback !== undefined && typeof options.fallback !== 'function') {
    throw new TypeError('[kupola/auth] registerPermissionHandler() expects a fallback function.');
  }
  if (options.onChange !== undefined && typeof options.onChange !== 'function') {
    throw new TypeError('[kupola/auth] registerPermissionHandler() expects an onChange function.');
  }
  if (options.disabledClass !== undefined
    && (typeof options.disabledClass !== 'string' || options.disabledClass.trim() === '')) {
    throw new TypeError('[kupola/auth] registerPermissionHandler() expects a non-empty disabledClass.');
  }

  return {
    check: options.check,
    defaultMode: [ 'hide', 'disabled', 'fallback' ].includes(options.defaultMode)
      ? options.defaultMode
      : 'hide',
    disabledClass: options.disabledClass || 'k-permission-disabled',
    fallback: options.fallback || ((element) => {
      element.textContent = 'No permission';
    }),
    cache: options.cache !== false,
    onChange: options.onChange || (() => () => {}),
  };
}

/**
 * Create an isolated auth state container.
 *
 * @returns {Object} Auth store with context and permission APIs.
 */
export function createAuthStore() {
  let currentAuthContext = null;
  let permissionHandler = null;
  const authContextListeners = new Set();
  const permissionHandlerListeners = new Set();

  function notify(listeners, value, label) {
    for (const listener of [ ...listeners ]) {
      try {
        listener(value);
      } catch (error) {
        if (typeof console !== 'undefined' && typeof console.error === 'function') {
          console.error(`[kupola/auth] ${label} listener error:`, error);
        }
      }
    }
  }

  function getAuthContext() {
    return currentAuthContext;
  }

  function setAuthContext(context) {
    if (context !== null && (typeof context !== 'object' || Array.isArray(context))) {
      throw new TypeError('[kupola/auth] setAuthContext() expects an auth context or null.');
    }
    if (Object.is(currentAuthContext, context)) {return;}
    currentAuthContext = context;
    notify(authContextListeners, context, 'Auth context');
  }

  function onAuthContextChange(listener) {
    if (typeof listener !== 'function') {
      throw new TypeError('[kupola/auth] onAuthContextChange() expects a function.');
    }
    authContextListeners.add(listener);
    return () => authContextListeners.delete(listener);
  }

  function hydrateAuthContext() {
    if (typeof document === 'undefined') {return null;}

    const authData = document.documentElement.getAttribute('data-kupola-auth');
    if (!authData) {return null;}

    try {
      return createContext(JSON.parse(authData), setAuthContext);
    } catch (error) {
      if (typeof console !== 'undefined' && typeof console.error === 'function') {
        console.error('[kupola/auth] Failed to parse data-kupola-auth:', error);
      }
      return null;
    }
  }

  function getPermissionHandler() {
    return permissionHandler;
  }

  function registerPermissionHandler(options) {
    const nextHandler = createPermissionHandler(options);
    permissionHandler = nextHandler;
    notify(permissionHandlerListeners, nextHandler, 'Permission handler');
    return nextHandler;
  }

  function clearPermissionHandler() {
    if (permissionHandler === null) {return;}
    permissionHandler = null;
    notify(permissionHandlerListeners, null, 'Permission handler');
  }

  function onPermissionHandlerChange(listener) {
    if (typeof listener !== 'function') {
      throw new TypeError('[kupola/auth] onPermissionHandlerChange() expects a function.');
    }
    permissionHandlerListeners.add(listener);
    return () => permissionHandlerListeners.delete(listener);
  }

  return Object.freeze({
    createAuthContext(user) {
      return createContext(user, setAuthContext);
    },
    hydrateAuthContext,
    getAuthContext,
    setAuthContext,
    onAuthContextChange,
    registerPermissionHandler,
    getPermissionHandler,
    clearPermissionHandler,
    onPermissionHandlerChange,
  });
}
