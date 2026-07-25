// SPDX-License-Identifier: MIT
/**
 * @kupola/auth — k-permission directive implementation.
 *
 * PermissionDirective - Implements k-permission attribute handling
 *
 * @module directive
 */

import { getPermissionHandler } from './permission-handler.js';
import { getAuthContext } from './auth-context.js';

const CACHE = new Map();

function _getCacheKey(element, permission) {
  return `${element._kupolaId || element.id || element.tagName}-${JSON.stringify(permission)}`;
}

function _clearCacheForElement(element) {
  for (const [key] of CACHE) {
    if (key.startsWith(element._kupolaId || element.id || element.tagName)) {
      CACHE.delete(key);
    }
  }
}

function _checkPermission(permission, handler) {
  if (!handler || typeof handler.check !== 'function') {
    const auth = getAuthContext();
    if (!auth) return false;
    if (Array.isArray(permission)) {
      return auth.hasAnyPermission(permission);
    }
    if (permission.startsWith('role:')) {
      return auth.hasRole(permission.slice(5));
    }
    return auth.hasPermission(permission);
  }
  return handler.check(permission);
}

export class PermissionDirective {
  constructor(element) {
    this.element = element;
    this.permission = null;
    this.mode = null;
    this.disabledClass = null;
    this.fallbackContent = null;
    this.useCache = true;
    this.handler = null;
    this.originalDisplay = null;
    this.originalDisabled = null;
    this.originalContent = null;
    this.observer = null;
    this.unsubscribe = null;
  }

  parse() {
    const el = this.element;
    this.permission = this._parsePermission(el.getAttribute('k-permission'));
    this.mode = el.getAttribute('k-permission-mode') || 'hide';
    this.disabledClass = el.getAttribute('k-permission-class') || 'k-permission-disabled';
    this.fallbackContent = el.getAttribute('k-permission-fallback');
    this.useCache = el.getAttribute('k-permission-cache') !== 'false';
    this.handler = getPermissionHandler();

    return this.permission !== null;
  }

  _parsePermission(value) {
    if (!value) return null;

    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch (e) {}

    return value;
  }

  check() {
    if (!this.permission) return true;

    if (this.useCache) {
      const cacheKey = _getCacheKey(this.element, this.permission);
      if (CACHE.has(cacheKey)) {
        return CACHE.get(cacheKey);
      }
    }

    const result = _checkPermission(this.permission, this.handler);

    if (this.useCache) {
      const cacheKey = _getCacheKey(this.element, this.permission);
      CACHE.set(cacheKey, result);
    }

    return result;
  }

  apply() {
    const hasPermission = this.check();

    if (hasPermission) {
      this.restore();
      return;
    }

    this.handleNoPermission();
  }

  handleNoPermission() {
    const el = this.element;

    switch (this.mode) {
      case 'disabled':
        this.originalDisabled = el.disabled;
        el.disabled = true;
        el.classList.add(this.disabledClass);
        break;

      case 'fallback':
        this.originalContent = el.innerHTML;
        el.innerHTML = this.fallbackContent || (this.handler?.fallback ? '' : '无权限');
        if (this.handler?.fallback && !this.fallbackContent) {
          this.handler.fallback(el, this.permission);
        }
        break;

      case 'hide':
      default:
        this.originalDisplay = el.style.display;
        el.style.display = 'none';
        break;
    }
  }

  restore() {
    const el = this.element;

    switch (this.mode) {
      case 'disabled':
        if (this.originalDisabled !== undefined) {
          el.disabled = this.originalDisabled;
        }
        el.classList.remove(this.disabledClass);
        break;

      case 'fallback':
        if (this.originalContent !== undefined) {
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
  }

  listen() {
    if (this.handler?.onChange) {
      this.unsubscribe = this.handler.onChange(() => {
        _clearCacheForElement(this.element);
        this.apply();
      });
    }

    const observer = new MutationObserver(() => {
      const newPermission = this._parsePermission(this.element.getAttribute('k-permission'));
      const newMode = this.element.getAttribute('k-permission-mode');

      if (newPermission !== this.permission || newMode !== this.mode) {
        this.permission = newPermission;
        this.mode = newMode || 'hide';
        _clearCacheForElement(this.element);
        this.apply();
      }
    });

    observer.observe(this.element, {
      attributes: true,
      attributeFilter: ['k-permission', 'k-permission-mode'],
    });

    this.observer = observer;
  }

  destroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    _clearCacheForElement(this.element);
    this.restore();
  }
}

export function processPermissionDirectives(root) {
  const elements = root.querySelectorAll('[k-permission]');
  const instances = [];

  for (const el of elements) {
    const directive = new PermissionDirective(el);
    if (directive.parse()) {
      directive.apply();
      directive.listen();
      el._kupolaPermission = directive;
      instances.push(directive);
    }
  }

  return instances;
}

export function clearCache() {
  CACHE.clear();
}