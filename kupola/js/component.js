class KupolaComponent {
  constructor(element) {
    this.element = element;
    this.isMounted = false;
    this.isDestroyed = false;
    this.props = this._parseProps();
    this.state = {};
    this.slots = this._parseSlots();
    this._eventListeners = {};
    this._appliedMixins = [];
    this.lifecycle = window.KupolaLifecycle 
      ? new window.KupolaLifecycle()
      : {
          on: () => () => {},
          emit: () => {},
          bootstrap: () => {},
          mount: () => {},
          update: () => {},
          unmount: () => {},
          destroy: () => {},
          state: 'created'
        };
    this.setupContext = null;
  }

  _parseProps() {
    const props = {};
    for (const attr of this.element.attributes) {
      if (attr.name.startsWith('data-prop-')) {
        const name = attr.name.replace('data-prop-', '');
        let value = attr.value;
        try {
          value = JSON.parse(value);
        } catch (e) {}
        props[name] = value;
      }
    }
    return props;
  }

  _parseSlots() {
    const slots = {};
    const slotElements = this.element.querySelectorAll('[data-slot]');
    
    slotElements.forEach(slotEl => {
      const slotName = slotEl.getAttribute('data-slot') || 'default';
      slots[slotName] = slotEl.innerHTML.trim();
      slotEl.remove();
    });
    
    if (!slots.default && this.element.children.length > 0) {
      slots.default = this.element.innerHTML.trim();
    }
    
    return slots;
  }

  $slot(name = 'default') {
    return this.slots[name] || '';
  }

  $emit(eventName, data) {
    const handlers = this._eventListeners[eventName] || [];
    handlers.forEach(handler => {
      try {
        handler(data);
      } catch (e) {
        console.error(`Error in event handler for ${eventName}:`, e);
      }
    });
    
    if (this.element) {
      const customEvent = new CustomEvent(`kupola:${eventName}`, {
        detail: data,
        bubbles: true,
        cancelable: true
      });
      this.element.dispatchEvent(customEvent);
    }
  }

  $on(eventName, handler) {
    if (!this._eventListeners[eventName]) {
      this._eventListeners[eventName] = [];
    }
    this._eventListeners[eventName].push(handler);
    return handler;
  }

  $off(eventName, handler) {
    if (this._eventListeners[eventName]) {
      this._eventListeners[eventName] = this._eventListeners[eventName].filter(cb => cb !== handler);
    }
  }

  async setProps(newProps) {
    try {
      this.props = { ...this.props, ...newProps };
      await this.lifecycle.update();
      this.setupContext?._executeUpdated();
    } catch (error) {
      console.error(`[KupolaComponent] Error in setProps for "${this.constructor.name}":`, error);
      
      if (this.lifecycle && typeof this.lifecycle._handleError === 'function') {
        await this.lifecycle._handleError({ phase: 'update', hook: 'setProps', error, args: [newProps] });
      }
    }
  }

  async setState(newState) {
    try {
      this.state = { ...this.state, ...newState };
      await this.lifecycle.update();
      this.setupContext?._executeUpdated();
    } catch (error) {
      console.error(`[KupolaComponent] Error in setState for "${this.constructor.name}":`, error);
      
      if (this.lifecycle && typeof this.lifecycle._handleError === 'function') {
        await this.lifecycle._handleError({ phase: 'update', hook: 'setState', error, args: [newState] });
      }
    }
  }

  async mount() {
    if (this.isMounted || this.isDestroyed) return;

    try {
      this._bindLifecycleHooks();

      await this.lifecycle.bootstrap();

      if (window._setCurrentSetupContext && window.SetupContext) {
        this.setupContext = new window.SetupContext(this);
        window._setCurrentSetupContext(this.setupContext);
        
        if (typeof this.setup === 'function') {
          const result = this.setup();
          if (result instanceof Promise) {
            await result;
          }
        }
      }

      this.isMounted = true;
      await this.lifecycle.mount();

      this.setupContext?._executeMounted();
      
      if (window._clearSetupContext) {
        window._clearSetupContext();
      }
    } catch (error) {
      console.error(`[KupolaComponent] Error mounting component "${this.constructor.name}":`, error);
      
      if (this.lifecycle && typeof this.lifecycle._handleError === 'function') {
        await this.lifecycle._handleError({ phase: 'mount', hook: 'component', error, args: [] });
      }
      
      if (typeof this.renderError === 'function') {
        try {
          this.renderError(error);
        } catch (e) {
          console.error(`[KupolaComponent] Error in renderError for "${this.constructor.name}":`, e);
        }
      } else {
        this.element.innerHTML = `
          <div style="padding: 16px; background: #fee2e2; border: 1px solid #fecaca; border-radius: 8px; color: #991b1b;">
            <div style="font-weight: bold; margin-bottom: 8px;">Component Error</div>
            <div style="font-size: 12px; white-space: pre-wrap;">${error.message}</div>
          </div>
        `;
      }
    }
  }

  _bindLifecycleHooks() {
    if (this._hooksBound) return;
    
    const hookMap = {
      beforeMount: 'beforeMount',
      render: ['mount', 'update'],
      afterMount: 'afterMount',
      updated: 'afterUpdate',
      beforeUnmount: 'beforeUnmount',
      afterUnmount: 'afterUnmount',
      renderError: 'errorBoundary'
    };
    
    let proto = Object.getPrototypeOf(this);
    const registeredHooks = new Set();
    
    while (proto && proto.constructor !== Object && proto.constructor !== KupolaComponent) {
      for (const [methodName, lifecyclePhase] of Object.entries(hookMap)) {
        if (registeredHooks.has(methodName)) continue;
        
        if (proto.hasOwnProperty(methodName)) {
          if (Array.isArray(lifecyclePhase)) {
            lifecyclePhase.forEach(phase => {
              if (methodName === 'render') {
                this.lifecycle.on(phase, () => this.render?.());
              }
            });
          } else if (methodName === 'renderError') {
            this.lifecycle.on(lifecyclePhase, (errorInfo) => {
              this.renderError(errorInfo.error);
              return 'handled';
            });
          } else {
            this.lifecycle.on(lifecyclePhase, () => this[methodName]?.());
          }
          registeredHooks.add(methodName);
        }
      }
      proto = Object.getPrototypeOf(proto);
    }
    
    this._hooksBound = true;
  }

  async unmount() {
    if (!this.isMounted || this.isDestroyed) return;

    try {
      this.setupContext?._executeUnmounted();
      
      await this.lifecycle.unmount();
      this.isMounted = false;
      this.isDestroyed = true;
      await this.lifecycle.destroy();
    } catch (error) {
      console.error(`[KupolaComponent] Error unmounting component "${this.constructor.name}":`, error);
      
      if (this.lifecycle && typeof this.lifecycle._handleError === 'function') {
        await this.lifecycle._handleError({ phase: 'unmount', hook: 'component', error, args: [] });
      }
      
      this.isMounted = false;
      this.isDestroyed = true;
    }
  }

  beforeMount() {}
  afterMount() {}
  beforeUnmount() {}
  afterUnmount() {}
  render() {}
  renderError(error) {}
  updated() {}
  setup() {}
}

function applyMixin(componentClass, mixin) {
  Object.keys(mixin).forEach(key => {
    if (key === 'constructor') return;
    if (typeof mixin[key] === 'function') {
      const original = componentClass.prototype[key];
      if (original) {
        componentClass.prototype[key] = function(...args) {
          mixin[key].apply(this, args);
          return original.apply(this, args);
        };
      } else {
        componentClass.prototype[key] = mixin[key];
      }
    } else {
      componentClass.prototype[key] = mixin[key];
    }
  });
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { KupolaComponent, applyMixin };
} else {
  window.KupolaComponent = KupolaComponent;
  window.applyMixin = applyMixin;
}