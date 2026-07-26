// SPDX-License-Identifier: MIT
/**
 * @kupola/router — Hash mode history implementation.
 *
 * @module hash
 */

/**
 * Hash mode history manager.
 */
export class HashHistory {
  constructor(router) {
    this.router = router;
    this.listeners = [];
    this.started = false;
    this.lastNotifiedPath = null;
    this.handleHashChange = (event) => {
      if (event?.newURL) {
        const eventUrl = new URL(event.newURL, window.location.href).href;
        if (eventUrl !== window.location.href) {
          return;
        }
      }

      const path = event?.newURL
        ? new URL(event.newURL, window.location.href).hash.slice(1) || '/'
        : this.getPath();
      if (path === this.lastNotifiedPath) {
        this.lastNotifiedPath = null;
        return;
      }
      this.notify(path);
    };
  }

  getPath() {
    return window.location.hash.slice(1) || '/';
  }

  push(path, query) {
    const fullPath = createFullPath(path, query);
    window.location.hash = fullPath;
    this.notify(fullPath);
  }

  replace(path, query) {
    const fullPath = createFullPath(path, query);
    const base = window.location.href.split('#')[0];
    window.history.replaceState(
      { ...(window.history.state || {}) },
      '',
      `${base}#${fullPath}`,
    );
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
    window.addEventListener('hashchange', this.handleHashChange);
  }

  stop() {
    if (!this.started) {return;}
    this.started = false;
    window.removeEventListener('hashchange', this.handleHashChange);
  }

  notify(fullPath) {
    this.lastNotifiedPath = fullPath;
    for (const listener of [ ...this.listeners ]) {
      listener(fullPath);
    }
  }
}

function createFullPath(path, query) {
  const search = new URLSearchParams(query || {}).toString();
  return search ? `${path}?${search}` : path;
}
