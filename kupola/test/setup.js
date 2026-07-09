import '../js/nimbus-core.js';
import '../js/component.js';
import '../js/http.js';
import '../js/router.js';
import '../js/data-bind.js';
import '../js/utils.js';
import '../js/theme.js';

globalThis.requestAnimationFrame = (callback) => {
  setTimeout(callback, 0);
};

globalThis.cancelAnimationFrame = () => {};

globalThis.IntersectionObserver = class IntersectionObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
};

globalThis.ResizeObserver = class ResizeObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
};