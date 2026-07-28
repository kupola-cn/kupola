// SPDX-License-Identifier: MIT
/**
 * @kupola/router — Memory mode history implementation.
 *
 * @module memory
 */

/**
 * Memory mode history manager for SSR and testing.
 */
export class MemoryHistory {
  constructor(router = {}) {
    this.router = router;
    this.listeners = [];
    const initialPath = typeof router.initialLocation === 'string' && router.initialLocation
      ? router.initialLocation
      : '/';
    this.stack = [ initialPath ];
    this.index = 0;
    this.currentPath = initialPath;
  }

  getPath() {
    return this.currentPath;
  }

  push(path, query) {
    const fullPath = createFullPath(path, query);
    this.stack = this.stack.slice(0, this.index + 1);
    this.stack.push(fullPath);
    this.index++;
    this.currentPath = fullPath;
    this.notify(fullPath);
  }

  replace(path, query) {
    const fullPath = createFullPath(path, query);
    this.stack[this.index] = fullPath;
    this.currentPath = fullPath;
    this.notify(fullPath);
  }

  back() {
    if (this.index > 0) {
      this.index--;
      this.currentPath = this.stack[this.index];
      this.notify(this.currentPath);
    }
  }

  forward() {
    if (this.index < this.stack.length - 1) {
      this.index++;
      this.currentPath = this.stack[this.index];
      this.notify(this.currentPath);
    }
  }

  go(delta) {
    const newIndex = this.index + delta;
    if (newIndex >= 0 && newIndex < this.stack.length) {
      this.index = newIndex;
      this.currentPath = this.stack[this.index];
      this.notify(this.currentPath);
    }
  }

  on(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  start() {}

  stop() {}

  notify(fullPath) {
    for (const listener of [ ...this.listeners ]) {
      listener(fullPath);
    }
  }
}

function createFullPath(path, query) {
  const params = new URLSearchParams();
  for (const [ key, value ] of Object.entries(query || {})) {
    for (const item of (Array.isArray(value) ? value : [ value ])) {
      if (item !== undefined && item !== null) {params.append(key, String(item));}
    }
  }
  const search = params.toString();
  return search ? `${path}?${search}` : path;
}
