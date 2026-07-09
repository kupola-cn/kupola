class ComponentInitializerRegistry {
  constructor() {
    this.initializers = new Map();
    this.cleanupFunctions = new Map();
    this.processedElements = new WeakSet();
  }

  register(name, initFn, cleanupFn = null) {
    this.initializers.set(name, initFn);
    if (cleanupFn) {
      this.cleanupFunctions.set(name, cleanupFn);
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

  async initialize(element) {
    if (this.processedElements.has(element)) return;

    const dataAttrs = ['data-component', 'data-dropdown', 'data-select', 'data-datepicker', 
                       'data-timepicker', 'data-slider', 'data-carousel', 'data-drawer', 
                       'data-modal', 'data-dialog', 'data-color-picker', 'data-calendar',
                       'data-slide-captcha', 'data-heatmap'];

    for (const attr of dataAttrs) {
      const value = element.getAttribute(attr);
      if (value) {
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

    const className = element.className;
    const classSelectors = [
      '.ds-dropdown', '.ds-select', '.ds-datepicker', '.ds-timepicker', 
      '.ds-slider', '.ds-carousel', '.ds-drawer', '.ds-modal', '.ds-dialog',
      '.ds-color-picker', '.ds-calendar', '.ds-slider-captcha', '.ds-heatmap',
      '.ds-tooltip', '.ds-tag', '.ds-statcard', '.ds-collapse', '.ds-fileupload',
      '.ds-notification', '.ds-message'
    ];

    for (const selector of classSelectors) {
      const classNamePart = selector.replace('.', '');
      if (className.includes(classNamePart)) {
        const name = classNamePart.replace('ds-', '');
        const initFn = this.initializers.get(name) || this.initializers.get(classNamePart);
        
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

  cleanup(element) {
    const dataAttrs = ['data-component', 'data-dropdown', 'data-select', 'data-datepicker', 
                       'data-timepicker', 'data-slider', 'data-carousel', 'data-drawer', 
                       'data-modal', 'data-dialog', 'data-color-picker', 'data-calendar',
                       'data-slide-captcha', 'data-heatmap'];

    for (const attr of dataAttrs) {
      const value = element.getAttribute(attr);
      if (value) {
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

    const className = element.className;
    const classSelectors = [
      '.ds-dropdown', '.ds-select', '.ds-datepicker', '.ds-timepicker', 
      '.ds-slider', '.ds-carousel', '.ds-drawer', '.ds-modal', '.ds-dialog',
      '.ds-color-picker', '.ds-calendar', '.ds-slider-captcha', '.ds-heatmap',
      '.ds-tooltip', '.ds-tag', '.ds-statcard', '.ds-collapse', '.ds-fileupload',
      '.ds-notification', '.ds-message'
    ];

    for (const selector of classSelectors) {
      const classNamePart = selector.replace('.', '');
      if (className.includes(classNamePart)) {
        const name = classNamePart.replace('ds-', '');
        const cleanupFn = this.cleanupFunctions.get(name) || this.cleanupFunctions.get(classNamePart);
        
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

  async initializeAll(root = document) {
    const elements = root.querySelectorAll('[data-component], [data-dropdown], [data-select], ' +
      '[data-datepicker], [data-timepicker], [data-slider], [data-carousel], ' +
      '[data-drawer], [data-modal], [data-dialog], [data-color-picker], ' +
      '[data-calendar], [data-slide-captcha], [data-heatmap], ' +
      '.ds-dropdown, .ds-select, .ds-datepicker, .ds-timepicker, ' +
      '.ds-slider, .ds-carousel, .ds-drawer, .ds-modal, .ds-dialog, ' +
      '.ds-color-picker, .ds-calendar, .ds-slider-captcha, .ds-heatmap, ' +
      '.ds-tooltip, .ds-tag, .ds-statcard, .ds-collapse, .ds-fileupload, ' +
      '.ds-notification, .ds-message');

    const promises = [];
    elements.forEach(element => {
      if (!this.processedElements.has(element)) {
        promises.push(this.initialize(element));
      }
    });
    await Promise.all(promises);
  }
}

const kupolaInitializer = new ComponentInitializerRegistry();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ComponentInitializerRegistry, kupolaInitializer };
} else {
  window.ComponentInitializerRegistry = ComponentInitializerRegistry;
  window.kupolaInitializer = kupolaInitializer;
}