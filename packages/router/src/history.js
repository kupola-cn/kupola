export class HistoryHistory {
  constructor(router) {
    this.router = router;
    this.listeners = [];
    this.base = router.options.base || '';
  }
  
  getPath() {
    const path = window.location.pathname + window.location.search;
    const base = this.base.replace(/\/$/, '');
    if (path.startsWith(base)) {
      return path.slice(base.length) || '/';
    }
    return path;
  }
  
  push(path, query) {
    const fullPath = query ? `${path}?${new URLSearchParams(query).toString()}` : path;
    const url = this.base.replace(/\/$/, '') + fullPath;
    window.history.pushState({}, '', url);
    this.listeners.forEach(listener => listener(fullPath));
  }
  
  replace(path, query) {
    const fullPath = query ? `${path}?${new URLSearchParams(query).toString()}` : path;
    const url = this.base.replace(/\/$/, '') + fullPath;
    window.history.replaceState({}, '', url);
    this.listeners.forEach(listener => listener(fullPath));
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
    window.addEventListener('popstate', () => {
      this.listeners.forEach(listener => listener(this.getPath()));
    });
  }
  
  stop() {
    window.removeEventListener('popstate', this.handlePopState);
  }
}
