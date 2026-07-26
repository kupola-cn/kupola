// SPDX-License-Identifier: MIT
/**
 * @kupola/auth - k-permission directive implementation.
 *
 * @module directive
 */

import {
  getPermissionHandler,
  onPermissionHandlerChange,
} from './permission-handler.js';
import { getAuthContext, onAuthContextChange } from './auth-context.js';

// The element is the cache scope. A string key based on tagName/id can make
// unrelated elements share a result and would also keep removed elements alive.
let CACHE = new WeakMap();

function validateStore(store) {
  if (store === null || store === undefined) {return null;}
  const methods = [
    'getAuthContext',
    'onAuthContextChange',
    'getPermissionHandler',
    'onPermissionHandlerChange',
  ];
  if (typeof store !== 'object' || methods.some(method => typeof store[method] !== 'function')) {
    throw new TypeError(
      '[kupola/auth] PermissionDirective authStore must be a valid auth store.',
    );
  }
  return store;
}

function _permissionKey(permission, mode, disabledClass) {
  try {
    return JSON.stringify([permission, mode, disabledClass]);
  } catch (e) {
    return `fallback_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  }
}

function _getElementCache(element) {
  let cache = CACHE.get(element);
  if (!cache) {
    cache = new Map();
    CACHE.set(element, cache);
  }
  return cache;
}

function _clearCacheForElement(element) {
  CACHE.delete(element);
}

/**
 * Checks if the user has the specified permission.
 * @param {string|string[]} permission - The permission to check.
 * @param {Object} handler - Custom permission handler.
 * @param {Object} auth - Auth context object.
 * @returns {boolean} - Returns `true` if permission is granted, `false` otherwise.
 * @note Permission checks must return a strict boolean `true` to be considered granted.
 *       Values like `1`, `"true"`, or other truthy values will be treated as `false`.
 */
function _checkPermission(permission, handler, auth) {
  try {
    let result;
    if (handler && typeof handler.check === 'function') {
      result = handler.check(permission);
    } else if (!auth) {
      return false;
    } else if (Array.isArray(permission)) {
      result = typeof auth.hasAnyPermission === 'function'
        && auth.hasAnyPermission(permission);
    } else if (typeof permission === 'string' && permission.startsWith('role:')) {
      result = typeof auth.hasRole === 'function' && auth.hasRole(permission.slice(5));
    } else {
      result = typeof permission === 'string'
        && typeof auth.hasPermission === 'function'
        && auth.hasPermission(permission);
    }

    if (result && typeof result.then === 'function') {
      throw new TypeError(
        '[kupola/auth] Permission checks must return a boolean synchronously. ' +
        'Async permission checks are not supported. Consider using synchronous checks ' +
        'or handling async logic before passing to the permission directive.'
      );
    }
    return result === true;
  } catch (error) {
    if (typeof console !== 'undefined' && typeof console.error === 'function') {
      console.error('[kupola/auth] Permission check failed closed:', error);
    }
    if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
      throw error;
    }
    return false;
  }
}

export class PermissionDirective {
  constructor(element, options = {}) {
    if (!element || typeof element.getAttribute !== 'function') {
      throw new TypeError('[kupola/auth] PermissionDirective expects an element.');
    }
    if (!options || typeof options !== 'object' || Array.isArray(options)) {
      throw new TypeError('[kupola/auth] PermissionDirective options must be an object.');
    }
    this.element = element;
    this.authStore = validateStore(options.authStore);
    this.permission = null;
    this.mode = null;
    this.disabledClass = null;
    this.fallbackContent = null;
    this.useCache = true;
    this.handler = null;
    this.originalDisplay = undefined;
    this.originalDisabled = undefined;
    this.originalDisabledClass = undefined;
    this.originalContent = undefined;
    this.originalNodes = null;
    this.appliedMode = null;
    this.appliedDisabledClass = null;
    this.observer = null;
    this.unsubscribe = null;
    this.unsubscribeAuth = null;
    this.unsubscribeHandler = null;
    this.destroyed = false;
  }

  _getAuthContext() {
    return this.authStore ? this.authStore.getAuthContext() : getAuthContext();
  }

  _getPermissionHandler() {
    return this.authStore ? this.authStore.getPermissionHandler() : getPermissionHandler();
  }

  _onAuthContextChange(listener) {
    return this.authStore
      ? this.authStore.onAuthContextChange(listener)
      : onAuthContextChange(listener);
  }

  _onPermissionHandlerChange(listener) {
    return this.authStore
      ? this.authStore.onPermissionHandlerChange(listener)
      : onPermissionHandlerChange(listener);
  }

  parse() {
    const el = this.element;
    this.permission = this._parsePermission(el.getAttribute('k-permission'));
    this.handler = this._getPermissionHandler();
    this.mode = el.getAttribute('k-permission-mode') || this.handler?.defaultMode || 'hide';
    this.disabledClass = el.getAttribute('k-permission-class')
      || this.handler?.disabledClass
      || 'k-permission-disabled';
    this.fallbackContent = el.getAttribute('k-permission-fallback');
    this.useCache = el.getAttribute('k-permission-cache') !== 'false' && this.handler?.cache !== false;

    return this.permission !== null;
  }

  _parsePermission(value) {
    if (!value) {return null;}

    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed;
      }
      if (typeof parsed === 'string') {
        return parsed;
      }
    } catch (e) {
      // A plain permission string is the normal form.
    }

    return value;
  }

  check() {
    if (this.permission === null) {return true;}

    const cacheKey = _permissionKey(this.permission, this.mode, this.disabledClass);
    if (this.useCache) {
      const cached = _getElementCache(this.element).get(cacheKey);
      if (
        cached &&
        cached.handler === this.handler
      ) {
        return cached.result;
      }
    }

    const auth = this._getAuthContext();
    const result = _checkPermission(this.permission, this.handler, auth);

    if (this.useCache) {
      _getElementCache(this.element).set(cacheKey, {
        handler: this.handler,
        result,
      });
    }

    return result;
  }

  apply() {
    if (this.destroyed) {return;}

    // Restore the state controlled by a previous apply before taking a new
    // snapshot. This makes repeated apply and mode changes reversible.
    this.restore();

    if (this.check()) {
      return;
    }

    this.handleNoPermission();
  }

  handleNoPermission() {
    const el = this.element;
    this.appliedMode = this.mode;

    switch (this.mode) {
    case 'disabled':
      this.originalDisabled = el.disabled;
      this.originalDisabledClass = el.classList.contains(this.disabledClass);
      this.appliedDisabledClass = this.disabledClass;
      el.disabled = true;
      el.classList.add(this.disabledClass);
      break;

    case 'fallback':
      this.originalContent = el.innerHTML;
      this.originalNodes = Array.from(el.childNodes);
      for (const child of this.originalNodes) {
        child.remove();
      }
      if (this.fallbackContent) {
        el.innerHTML = this.fallbackContent;
      } else if (this.handler?.fallback) {
        this.handler.fallback(el, this.permission);
      } else {
        el.textContent = '无权限';
      }
      break;

    case 'hide':
    default:
      if (el.style.display !== 'none') {
        this.originalDisplay = el.style.display;
      }
      el.style.display = 'none';
      break;
    }
  }

  restore() {
    const el = this.element;
    const mode = this.appliedMode || this.mode;

    // No directive-controlled state exists. In particular, an initially
    // hidden/disabled element must remain untouched when permission is true.
    if (!this.appliedMode) {
      if (mode === 'disabled' && this.originalDisabled !== undefined) {
        el.disabled = this.originalDisabled;
        const className = this.appliedDisabledClass || this.disabledClass;
        if (this.originalDisabledClass) {
          el.classList.add(className);
        } else {
          el.classList.remove(className);
        }
        this.originalDisabled = undefined;
        this.originalDisabledClass = undefined;
      } else if (mode === 'fallback' && this.originalContent !== undefined) {
        el.innerHTML = this.originalContent;
        this.originalContent = undefined;
      } else if (mode === 'hide' && this.originalDisplay !== undefined) {
        el.style.display = this.originalDisplay;
        this.originalDisplay = undefined;
      }
      return;
    }

    switch (mode) {
    case 'disabled':
      if (this.originalDisabled !== undefined) {
        el.disabled = this.originalDisabled;
      }
      if (this.originalDisabledClass) {
        el.classList.add(this.appliedDisabledClass);
      } else {
        el.classList.remove(this.appliedDisabledClass);
      }
      break;

    case 'fallback':
      while (el.firstChild) {
        el.firstChild.remove();
      }
      if (this.originalNodes) {
        for (const node of this.originalNodes) {
          el.appendChild(node);
        }
      } else if (this.originalContent !== undefined) {
        el.innerHTML = this.originalContent;
      }
      break;

    case 'hide':
    default:
      if (this.originalDisplay !== undefined) {
        el.style.display = this.originalDisplay;
      } else {
        el.style.removeProperty('display');
      }
      break;
    }

    this.originalDisplay = undefined;
    this.originalDisabled = undefined;
    this.originalDisabledClass = undefined;
    this.originalContent = undefined;
    this.originalNodes = null;
    this.appliedMode = null;
    this.appliedDisabledClass = null;
  }

  stopListening() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    if (typeof this.unsubscribe === 'function') {
      this.unsubscribe();
    }
    this.unsubscribe = null;
    if (typeof this.unsubscribeAuth === 'function') {
      this.unsubscribeAuth();
    }
    this.unsubscribeAuth = null;
    if (typeof this.unsubscribeHandler === 'function') {
      this.unsubscribeHandler();
    }
    this.unsubscribeHandler = null;
  }

  listen() {
    this.stopListening();

    if (this.handler?.onChange) {
      const unsubscribe = this.handler.onChange(() => {
        if (this.destroyed) {return;}
        _clearCacheForElement(this.element);
        this.apply();
      });
      this.unsubscribe = typeof unsubscribe === 'function' ? unsubscribe : null;
    }

    this.unsubscribeAuth = this._onAuthContextChange(() => {
      if (this.destroyed) {return;}
      _clearCacheForElement(this.element);
      this.apply();
    });

    this.unsubscribeHandler = this._onPermissionHandlerChange(() => {
      if (this.destroyed) {return;}
      this.restore();
      this.parse();
      _clearCacheForElement(this.element);
      this.apply();
      this.listen();
    });

    if (typeof MutationObserver === 'undefined') {return;}

    const observer = new MutationObserver(() => {
      if (this.destroyed) {return;}
      const nextPermission = this._parsePermission(this.element.getAttribute('k-permission'));
      const nextMode = this.element.getAttribute('k-permission-mode') || this.handler?.defaultMode || 'hide';
      const nextClass = this.element.getAttribute('k-permission-class')
        || this.handler?.disabledClass
        || 'k-permission-disabled';
      const nextFallback = this.element.getAttribute('k-permission-fallback');
      const nextUseCache = this.element.getAttribute('k-permission-cache') !== 'false' && this.handler?.cache !== false;

      if (
        JSON.stringify(nextPermission) !== JSON.stringify(this.permission) ||
        nextMode !== this.mode ||
        nextClass !== this.disabledClass ||
        nextFallback !== this.fallbackContent ||
        nextUseCache !== this.useCache
      ) {
        this.restore();
        this.parse();
        _clearCacheForElement(this.element);
        if (this.permission !== null) {
          this.apply();
        }
      }
    });

    observer.observe(this.element, {
      attributes: true,
      attributeFilter: [
        'k-permission',
        'k-permission-mode',
        'k-permission-class',
        'k-permission-fallback',
        'k-permission-cache',
      ],
    });

    this.observer = observer;
  }

  destroy() {
    if (this.destroyed) {return;}
    this.destroyed = true;
    this.stopListening();
    _clearCacheForElement(this.element);
    // A manual remount can replace the instance while the platform walker
    // still owns the old disposer. The old disposer must not restore state
    // over the replacement instance.
    if (!this.element._kupolaPermission || this.element._kupolaPermission === this) {
      this.restore();
    }
    if (this.element._kupolaPermission === this) {
      delete this.element._kupolaPermission;
    }
  }
}

function mountPermissionDirective(element, options = {}) {
  if (element._kupolaPermission) {
    element._kupolaPermission.destroy();
  }

  const directive = new PermissionDirective(element, options);
  if (!directive.parse()) {return undefined;}
  directive.apply();
  directive.listen();
  element._kupolaPermission = directive;
  return directive;
}

/**
 * Create a platform custom-directive definition for k-permission.
 *
 * Auth stays independent from platform. Applications opt into the DOM
 * walker integration by passing this definition to registerDirective().
 */
export function createPermissionDirectiveDefinition(options = {}) {
  if (!options || typeof options !== 'object' || Array.isArray(options)) {
    throw new TypeError('[kupola/auth] Directive definition options must be an object.');
  }
  validateStore(options.authStore);
  return {
    mount(element) {
      return mountPermissionDirective(element, options);
    },
  };
}

/**
 * Register k-permission with @kupola/platform's directive registry.
 *
 * @param {(name: string, definition: Object) => void} registerDirective
 */
export function registerPermissionDirective(registerDirective, options = {}) {
  if (typeof registerDirective !== 'function') {
    throw new TypeError(
      '[kupola/auth] registerPermissionDirective() expects platform registerDirective().',
    );
  }

  const definition = createPermissionDirectiveDefinition(options);
  registerDirective('k-permission', definition);
  return definition;
}

export function processPermissionDirectives(root, options = {}) {
  if (!root || typeof root.querySelectorAll !== 'function') {return [];}
  if (!options || typeof options !== 'object' || Array.isArray(options)) {
    throw new TypeError('[kupola/auth] Directive processing options must be an object.');
  }
  validateStore(options.authStore);

  const elements = [];
  if (typeof root.matches === 'function' && root.matches('[k-permission]')) {
    elements.push(root);
  }
  elements.push(...root.querySelectorAll('[k-permission]'));

  const instances = [];
  for (const el of elements) {
    const directive = mountPermissionDirective(el, options);
    if (directive) {instances.push(directive);}
  }

  return instances;
}

export function clearCache() {
  CACHE = new WeakMap();
}
