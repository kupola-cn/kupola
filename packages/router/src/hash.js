export class HashHistory {
  constructor(router) {
    this.router = router;
    this.listeners = [];
  }
  
  getPath() {
    return window.location.hash.slice(1) || '/';
  }
  
  push(path, query) {
    const fullPath = query ? `${path}?${new URLSearchParams(query).toString()}` : path;
    window.location.hash = fullPath;
  }
  
  replace(path, query) {
    const fullPath = query ? `${path}?${new URLSearchParams(query).toString()}` : path;
    const base = window.location.href.replace(window.location.hash, '');
    window.location.replace(`${base}#${fullPath}`);
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
    window.addEventListener('hashchange', () => {
      this.listeners.forEach(listener => listener(this.getPath()));
    });
  }
  
  stop() {
    window.removeEventListener('hashchange', this.handleHashChange);
  }
}
