export class MemoryHistory {
  constructor(router) {
    this.router = router;
    this.listeners = [];
    this.stack = ['/'];
    this.index = 0;
    this.currentPath = '/';
  }
  
  getPath() {
    return this.currentPath;
  }
  
  push(path, query) {
    const fullPath = query ? `${path}?${new URLSearchParams(query).toString()}` : path;
    this.stack = this.stack.slice(0, this.index + 1);
    this.stack.push(fullPath);
    this.index++;
    this.currentPath = fullPath;
    this.listeners.forEach(listener => listener(fullPath));
  }
  
  replace(path, query) {
    const fullPath = query ? `${path}?${new URLSearchParams(query).toString()}` : path;
    this.stack[this.index] = fullPath;
    this.currentPath = fullPath;
    this.listeners.forEach(listener => listener(fullPath));
  }
  
  back() {
    if (this.index > 0) {
      this.index--;
      this.currentPath = this.stack[this.index];
      this.listeners.forEach(listener => listener(this.currentPath));
    }
  }
  
  forward() {
    if (this.index < this.stack.length - 1) {
      this.index++;
      this.currentPath = this.stack[this.index];
      this.listeners.forEach(listener => listener(this.currentPath));
    }
  }
  
  go(delta) {
    const newIndex = this.index + delta;
    if (newIndex >= 0 && newIndex < this.stack.length) {
      this.index = newIndex;
      this.currentPath = this.stack[this.index];
      this.listeners.forEach(listener => listener(this.currentPath));
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
}
