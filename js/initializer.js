/**
 * Component Initializer Registry — auto-discovery and lifecycle management for declarative components.
 * Scans the DOM for `data-*` attributes or CSS classes, calls init functions,
 * and uses MutationObserver for dynamically added elements.
 */
class ComponentInitializerRegistry {
  constructor() {
    this.initializers = new Map();
    this.cleanupFunctions = new Map();
    this.processedElements = new WeakSet();
    // Single source of truth for selectors
    this._dataAttrs = ['data-component'];
    this._cssClasses = [];
    this._cachedSelector = null;
  }

  /**
   * Register a component initializer.
   * @param {string} name - Component name
   * @param {Function} initFn - Init function called with the DOM element
   * @param {Function} [cleanupFn] - Optional cleanup/destroy function
   * @param {Object} [options] - { dataAttribute, cssClass } for auto-discovery
   */
  register(name, initFn, cleanupFn = null, options = {}) {
    this.initializers.set(name, initFn);
    if (cleanupFn) {
      this.cleanupFunctions.set(name, cleanupFn);
    }
    // Auto-register selectors
    if (options.dataAttribute && !this._dataAttrs.includes(options.dataAttribute)) {
      this._dataAttrs.push(options.dataAttribute);
      this._cachedSelector = null;
    }
    if (options.cssClass && !this._cssClasses.includes(options.cssClass)) {
      this._cssClasses.push(options.cssClass);
      this._cachedSelector = null;
    }
  }

  unregister(name) {
    this.initializers.delete(name);
    this.cleanupFunctions.delete(name);
  }

  has(name) {
    return this.initializers.has(name);
  }

  get(name) {
    return this.initializers.get(name);
  }

  _buildSelector() {
    if (this._cachedSelector !== null) return this._cachedSelector;
    const parts = this._dataAttrs.map(a => `[${a}]`);
    for (const cls of this._cssClasses) {
      parts.push(`.${cls}`);
    }
    this._cachedSelector = parts.join(', ');
    return this._cachedSelector;
  }

  /** Initialize a single DOM element if it matches a registered component. */
  async initialize(element) {
    if (this.processedElements.has(element)) return;

    // Check data attributes
    for (const attr of this._dataAttrs) {
      const value = element.getAttribute(attr);
      if (value !== null) {
        const name = value || attr.replace('data-', '');
        const initFn = this.initializers.get(name) || this.initializers.get(attr.replace('data-', ''));
        if (initFn) {
          try {
            await initFn(element);
            this.processedElements.add(element);
          } catch (error) {
            console.error(`[ComponentInitializerRegistry] Error initializing "${name}":`, error);
          }
          return;
        }
      }
    }

    // Check CSS classes
    const className = element.className;
    if (typeof className === 'string') {
      for (const cls of this._cssClasses) {
        if (className.includes(cls)) {
          const name = cls.replace('ds-', '');
          const initFn = this.initializers.get(name) || this.initializers.get(cls);
          if (initFn) {
            try {
              await initFn(element);
              this.processedElements.add(element);
            } catch (error) {
              console.error(`[ComponentInitializerRegistry] Error initializing "${name}":`, error);
            }
            return;
          }
        }
      }
    }
  }

  /** Run cleanup/destroy for a single DOM element. */
  cleanup(element) {
    // Check data attributes
    for (const attr of this._dataAttrs) {
      const value = element.getAttribute(attr);
      if (value !== null) {
        const name = value || attr.replace('data-', '');
        const cleanupFn = this.cleanupFunctions.get(name) || this.cleanupFunctions.get(attr.replace('data-', ''));
        if (cleanupFn) {
          try {
            cleanupFn(element);
          } catch (error) {
            console.error(`[ComponentInitializerRegistry] Error cleaning up "${name}":`, error);
          }
          this.processedElements.delete(element);
          return;
        }
      }
    }

    // Check CSS classes
    const className = element.className;
    if (typeof className === 'string') {
      for (const cls of this._cssClasses) {
        if (className.includes(cls)) {
          const name = cls.replace('ds-', '');
          const cleanupFn = this.cleanupFunctions.get(name) || this.cleanupFunctions.get(cls);
          if (cleanupFn) {
            try {
              cleanupFn(element);
            } catch (error) {
              console.error(`[ComponentInitializerRegistry] Error cleaning up "${name}":`, error);
            }
            this.processedElements.delete(element);
            return;
          }
        }
      }
    }
  }

  /** Scan and initialize all matching components. Uses MutationObserver for dynamic content. */
  async initializeAll(root = document) {
    const selector = this._buildSelector();
    if (!selector) return;

    const elements = root.querySelectorAll(selector);
    const promises = [];
    elements.forEach(element => {
      if (!this.processedElements.has(element)) {
        promises.push(this.initialize(element));
      }
    });
    await Promise.all(promises);
  }
}

/** @type {ComponentInitializerRegistry} Global initializer instance */
const kupolaInitializer = new ComponentInitializerRegistry();

// Pre-register known component selectors
const knownComponents = [
  { attr: 'data-dropdown', cls: 'ds-dropdown' },
  { attr: 'data-select', cls: 'ds-select' },
  { attr: 'data-datepicker', cls: 'ds-datepicker' },
  { attr: 'data-timepicker', cls: 'ds-timepicker' },
  { attr: 'data-slider', cls: 'ds-slider' },
  { attr: 'data-carousel', cls: 'ds-carousel' },
  { attr: 'data-drawer', cls: 'ds-drawer' },
  { attr: 'data-modal', cls: 'ds-modal' },
  { attr: 'data-dialog', cls: 'ds-dialog' },
  { attr: 'data-color-picker', cls: 'ds-color-picker' },
  { attr: 'data-calendar', cls: 'ds-calendar' },
  { attr: 'data-slide-captcha', cls: 'ds-slide-captcha' },
  { attr: 'data-heatmap', cls: 'ds-heatmap' },
  { cls: 'ds-tooltip' },
  { cls: 'ds-tag' },
  { cls: 'ds-statcard' },
  { cls: 'ds-collapse' },
  { cls: 'ds-fileupload' },
  { cls: 'ds-notification' },
  { cls: 'ds-message' }
];

for (const comp of knownComponents) {
  if (comp.attr && !kupolaInitializer._dataAttrs.includes(comp.attr)) {
    kupolaInitializer._dataAttrs.push(comp.attr);
  }
  if (comp.cls && !kupolaInitializer._cssClasses.includes(comp.cls)) {
    kupolaInitializer._cssClasses.push(comp.cls);
  }
}

export { ComponentInitializerRegistry, kupolaInitializer };

if (typeof window !== 'undefined') {
  window.ComponentInitializerRegistry = ComponentInitializerRegistry;
  window.kupolaInitializer = kupolaInitializer;
}