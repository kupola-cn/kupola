class KupolaComponentRegistry {
  constructor() {
    this.components = new Map();
    this.lazyComponents = new Map();
    this.loadedComponents = new Map();
    this.instances = new Map();
    this.observer = null;
    this.mixins = new Map();
    this.loadingPromises = new Map();
  }

  register(name, componentClass) {
    if (!(componentClass.prototype instanceof window.KupolaComponent)) {
      throw new Error(`Component ${name} must extend KupolaComponent`);
    }
    this.components.set(name, componentClass);
  }

  registerLazy(name, loader) {
    this.lazyComponents.set(name, loader);
  }

  unregister(name) {
    this.components.delete(name);
    this.lazyComponents.delete(name);
    this.loadedComponents.delete(name);
    this.loadingPromises.delete(name);
  }

  get(name) {
    return this.components.get(name) || this.loadedComponents.get(name);
  }

  async getAsync(name) {
    const cached = this.components.get(name) || this.loadedComponents.get(name);
    if (cached) return cached;

    if (this.loadingPromises.has(name)) {
      return this.loadingPromises.get(name);
    }

    const loader = this.lazyComponents.get(name);
    if (!loader) {
      throw new Error(`Component ${name} not found`);
    }

    const loadingPromise = (async () => {
      try {
        const result = await loader();
        const componentClass = result.default || result;
        if (!(componentClass.prototype instanceof window.KupolaComponent)) {
          throw new Error(`Component ${name} must extend KupolaComponent`);
        }
        this.loadedComponents.set(name, componentClass);
        return componentClass;
      } catch (e) {
        this.loadingPromises.delete(name);
        throw e;
      }
    })();

    this.loadingPromises.set(name, loadingPromise);
    return loadingPromise;
  }

  defineMixin(name, mixin) {
    this.mixins.set(name, mixin);
  }

  useMixin(componentClass, ...mixinNames) {
    mixinNames.forEach(name => {
      const mixin = this.mixins.get(name);
      if (mixin && window.applyMixin) {
        window.applyMixin(componentClass, mixin);
      }
    });
  }

  async bootstrap(root = document) {
    await this._upgradeElements(root);
    this._startObserver(root);
  }

  async _upgradeElements(root) {
    const elements = root.querySelectorAll('[data-component]');
    const promises = [];
    elements.forEach(element => {
      promises.push(this._upgradeElement(element));
    });
    await Promise.all(promises);
  }

  async _upgradeElement(element) {
    if (element.__kupolaInstance || element.__kupolaUpgrading) return;
    
    element.__kupolaUpgrading = true;
    
    try {
      const componentName = element.getAttribute('data-component');
      
      if (window.kupolaInitializer && componentName) {
        const initializer = window.kupolaInitializer.get(componentName);
        if (initializer) {
          try {
            await initializer(element);
            return;
          } catch (e) {
            console.warn(`[KupolaComponentRegistry] Initializer for "${componentName}" failed, trying component class:`, e);
          }
        }
      }
      
      let ComponentClass = this.components.get(componentName);
      
      if (!ComponentClass) {
        try {
          ComponentClass = await this.getAsync(componentName);
        } catch (e) {
          console.error(`Failed to load component ${componentName}:`, e);
          return;
        }
        
        if (!element.isConnected) {
          return;
        }
      }
      
      const mixinNames = element.getAttribute('data-mixins');
      const componentClass = ComponentClass;
      if (mixinNames && window.applyMixin) {
        mixinNames.split(',').forEach(name => {
          const mixin = this.mixins.get(name.trim());
          if (mixin) {
            window.applyMixin(componentClass, mixin);
          }
        });
      }
      
      const instance = new componentClass(element);
      element.__kupolaInstance = instance;
      this.instances.set(element, instance);
      instance.mount();
    } finally {
      element.__kupolaUpgrading = false;
    }
  }

  _startObserver(root) {
    if (this.observer) return;
    
    this.observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.hasAttribute('data-component')) {
              this._upgradeElement(node).catch(e => console.error(e));
            }
            this._upgradeElements(node).catch(e => console.error(e));
          }
        });
        
        mutation.removedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const instance = this.instances.get(node);
            if (instance) {
              instance.unmount();
              this.instances.delete(node);
            }
            node.querySelectorAll('[data-component]').forEach(child => {
              const childInstance = this.instances.get(child);
              if (childInstance) {
                childInstance.unmount();
                this.instances.delete(child);
              }
            });
          }
        });
      });
    });

    this.observer.observe(root, {
      childList: true,
      subtree: true
    });
  }

  destroy() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.instances.forEach(instance => {
      instance.unmount();
    });
    this.instances.clear();
    this.components.clear();
    this.mixins.clear();
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { KupolaComponentRegistry };
} else {
  window.KupolaComponentRegistry = KupolaComponentRegistry;
}