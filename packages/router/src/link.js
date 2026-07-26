// SPDX-License-Identifier: MIT
/**
 * @kupola/router — Router link directive for navigation.
 *
 * @module link
 */

import { useRouter } from './router-context.js';
import { registerDirective } from '@kupola/platform';

/**
 * Router link directive class.
 */
export class RouterLinkDirective {
  constructor(el, binding) {
    this.el = el;
    this.binding = binding || {};
    this.router = useRouter();
    this.unsubscribe = null;

    this.init();
  }

  init() {
    this.el.addEventListener('click', this.handleClick);
    this.updateActiveClass();

    if (this.router) {
      this.unsubscribe = this.router.afterEach(() => {
        this.updateActiveClass();
      });
    }
  }

  handleClick = (e) => {
    if (e.defaultPrevented || (e.button !== undefined && e.button !== 0)
      || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
      return;
    }
    e.preventDefault();

    const { value, modifiers = {} } = this.binding;
    const { replace = false } = modifiers;

    const { location, query } = parseBindingLocation(value);

    if (this.router) {
      const options = query ? { query } : {};
      if (replace) {
        return this.router.replace(location, options);
      } else {
        return this.router.push(location, options);
      }
    }
    return Promise.resolve(false);
  };

  updateActiveClass() {
    if (!this.router || !this.router.currentRoute) {return;}

    const { value } = this.binding;
    const activeClass = this.binding.arg || 'router-link-active';
    const currentPath = this.router.currentRoute.path;
    const { location } = parseBindingLocation(value);
    const linkPath = resolveLinkPath(this.router, location);

    if (linkPath && isActivePath(currentPath, linkPath)) {
      this.el.classList.add(activeClass);
    } else {
      this.el.classList.remove(activeClass);
    }
  }

  destroy() {
    this.el.removeEventListener('click', this.handleClick);
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }

  update(newBinding) {
    this.binding = newBinding || {};
    this.updateActiveClass();
  }
}

function parseBindingLocation(value) {
  if (typeof value !== 'string' || !value.startsWith('{')) {
    return { location: value, query: {} };
  }
  try {
    const parsed = JSON.parse(value);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { location: value, query: {} };
    }
    return {
      location: parsed,
      query: parsed.query || {},
    };
  } catch {
    return { location: value, query: {} };
  }
}

function resolveLinkPath(router, location) {
  if (typeof location === 'string') {
    return location.split('?')[0] || '/';
  }
  if (!location || typeof location !== 'object') {return null;}
  return router.resolve(location).split('?')[0] || '/';
}

function isActivePath(currentPath, linkPath) {
  const normalizedCurrent = currentPath === '/' ? '/' : currentPath.replace(/\/$/, '');
  const normalizedLink = linkPath === '/' ? '/' : linkPath.replace(/\/$/, '');
  if (normalizedLink === '/') {return normalizedCurrent === '/';}
  return normalizedCurrent === normalizedLink || normalizedCurrent.startsWith(`${normalizedLink}/`);
}

/**
 * Register router link directive.
 */
export function registerRouterLinkDirective() {
  registerDirective('k-router-link', {
    mount(el, binding) {
      const instance = new RouterLinkDirective(el, binding);
      el._routerLinkInstance = instance;
      return instance;
    },
    update(el, binding) {
      if (el._routerLinkInstance) {
        el._routerLinkInstance.update(binding);
      }
    },
    unmount(el) {
      if (el._routerLinkInstance) {
        el._routerLinkInstance.destroy();
        delete el._routerLinkInstance;
      }
    },
  });
}
