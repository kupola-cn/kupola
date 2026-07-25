export class ScrollManager {
  constructor(router) {
    this.router = router;
    this.scrollHistory = new Map();
    this.currentPosition = { x: 0, y: 0 };
    
    this.setup();
  }
  
  setup() {
    if (typeof window === 'undefined') return;
    
    window.addEventListener('scroll', () => {
      this.currentPosition = { x: window.scrollX, y: window.scrollY };
    });
  }
  
  saveScrollPosition(path) {
    if (path) {
      this.scrollHistory.set(path, { ...this.currentPosition });
    }
  }
  
  getSavedPosition(path) {
    return this.scrollHistory.get(path) || null;
  }
  
  scrollTo(position) {
    if (!position) return;
    
    if (position.selector) {
      const el = document.querySelector(position.selector);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      window.scrollTo({
        x: position.x || 0,
        y: position.y || 0,
        behavior: 'smooth',
      });
    }
  }
  
  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  
  reset() {
    this.scrollHistory.clear();
  }
}

export function createScrollManager(router) {
  return new ScrollManager(router);
}
