// SPDX-License-Identifier: MIT
/**
 * @kupola/auth — Permission handler registration.
 *
 * registerPermissionHandler - Register global permission handler
 * getPermissionHandler - Get current permission handler
 *
 * @module permission-handler
 */

let permissionHandler = null;

export function registerPermissionHandler(options) {
  if (!options || typeof options !== 'object') {
    throw new TypeError('[kupola/auth] registerPermissionHandler() expects an options object.');
  }

  if (typeof options.check !== 'function') {
    throw new TypeError('[kupola/auth] registerPermissionHandler() expects a check function.');
  }

  permissionHandler = {
    check: options.check,
    defaultMode: options.defaultMode || 'hide',
    disabledClass: options.disabledClass || 'k-permission-disabled',
    fallback: options.fallback || ((el) => {
      el.innerHTML = '<span class="text-muted">无权限</span>';
    }),
    cache: options.cache !== false,
    onChange: options.onChange || (() => () => {}),
  };

  return permissionHandler;
}

export function getPermissionHandler() {
  return permissionHandler;
}

export function clearPermissionHandler() {
  permissionHandler = null;
}