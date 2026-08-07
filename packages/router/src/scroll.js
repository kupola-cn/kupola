// SPDX-License-Identifier: MIT
/**
 * @kupola/router — Scroll position management.
 *
 * @module scroll
 */

/**
 * Scroll position manager.
 */
class ScrollManager {
  constructor(router) {
    this.router = router;
    this.scrollHistory = new Map();
    this.currentPosition = { x: 0, y: 0 };
    this.handleScroll = () => {
      this.currentPosition = { x: window.scrollX, y: window.scrollY };
    };
  }

  start() {
    if (typeof window === 'undefined') {return;}
    window.addEventListener('scroll', this.handleScroll);
  }

  stop() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('scroll', this.handleScroll);
    }
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
    if (!position) {return;}

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

  destroy() {
    this.stop();
    this.reset();
  }
}

/**
 * Create a scroll manager instance.
 * @param {Object} router - Router instance
 * @returns {ScrollManager} Scroll manager instance
 */
export function createScrollManager(router) {
  return new ScrollManager(router);
}
