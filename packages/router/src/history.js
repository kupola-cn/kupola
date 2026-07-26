// SPDX-License-Identifier: MIT
/**
 * @kupola/router — History mode implementation.
 *
 * @module history
 */

/**
 * History mode manager using pushState/replaceState.
 */
export class HistoryHistory {
  constructor(options = {}) {
    this.router = options;
    this.listeners = [];
    this.base = normalizeBase(options.options?.base ?? options.base ?? '');
    this.stateKey = '__kupolaPath';
    this.started = false;
    this.handlePopState = (event) => {
      this.notify(event?.state?.[this.stateKey] || this.getPath());
    };
  }

  getPath() {
    const path = window.location.pathname + window.location.search;
    if (!this.base) {return path || '/';}
    if (path === this.base || path.startsWith(`${this.base}/`)) {
      return path.slice(this.base.length) || '/';
    }
    return path;
  }

  push(path, query) {
    const fullPath = createFullPath(path, query);
    const url = this.base + (fullPath.startsWith('/') ? fullPath : `/${fullPath}`);
    window.history.pushState({ ...(window.history.state || {}), [this.stateKey]: fullPath }, '', url);
    this.notify(fullPath);
  }

  replace(path, query) {
    const fullPath = createFullPath(path, query);
    const url = this.base + (fullPath.startsWith('/') ? fullPath : `/${fullPath}`);
    window.history.replaceState({ ...(window.history.state || {}), [this.stateKey]: fullPath }, '', url);
    this.notify(fullPath);
  }

  back() {
    window.history.back();
  }

  forward() {
    window.history.forward();
  }

  go(delta) {
    window.history.go(delta);
  }

  on(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  start() {
    if (this.started) {return;}
    this.started = true;
    window.addEventListener('popstate', this.handlePopState);
  }

  stop() {
    if (!this.started) {return;}
    this.started = false;
    window.removeEventListener('popstate', this.handlePopState);
  }

  notify(fullPath) {
    for (const listener of [ ...this.listeners ]) {
      listener(fullPath);
    }
  }
}

function createFullPath(path, query) {
  const search = new URLSearchParams(query || {}).toString();
  if (!search) {return path;}
  return path.includes('?') ? `${path}&${search}` : `${path}?${search}`;
}

function normalizeBase(base) {
  if (typeof base !== 'string') {return '';}
  const normalized = base.trim().replace(/^\/+|\/+$/g, '');
  return normalized ? `/${normalized}` : '';
}
