class GlobalEventManager {
  constructor() {
    this.listeners = new Map();
    this.scopes = new Map();
  }

  on(target, eventType, handler, options = {}) {
    const key = this._getKey(target, eventType);
    
    if (!this.listeners.has(key)) {
      this.listeners.set(key, []);
    }
    
    const wrapper = (e) => {
      if (handler.before && typeof handler.before === 'function') {
        handler.before(e);
      }
      
      const result = handler(e);
      
      if (handler.after && typeof handler.after === 'function') {
        handler.after(e, result);
      }
      
      return result;
    };
    
    const listener = {
      handler,
      wrapper,
      options,
      active: true
    };
    
    this.listeners.get(key).push(listener);
    
    if (options.scope) {
      if (!this.scopes.has(options.scope)) {
        this.scopes.set(options.scope, []);
      }
      this.scopes.get(options.scope).push({ target, eventType, handler, wrapper });
    }
    
    target.addEventListener(eventType, wrapper, options);
    
    const unsubscribe = () => {
      target.removeEventListener(eventType, wrapper, options);
      if (this.listeners.has(key)) {
        const list = this.listeners.get(key);
        const idx = list.indexOf(listener);
        if (idx !== -1) {
          list.splice(idx, 1);
        }
      }
      if (options.scope && this.scopes.has(options.scope)) {
        const scopeList = this.scopes.get(options.scope);
        const idx = scopeList.findIndex(
          s => s.target === target && s.eventType === eventType && s.handler === handler
        );
        if (idx !== -1) {
          scopeList.splice(idx, 1);
        }
      }
      listener.active = false;
    };
    
    listener.unsubscribe = unsubscribe;
    
    return listener;
  }

  off(target, eventType, handler) {
    const key = this._getKey(target, eventType);
    
    if (!this.listeners.has(key)) return;
    
    const listenerList = this.listeners.get(key);
    const index = listenerList.findIndex(l => l.handler === handler);
    
    if (index !== -1) {
      const listener = listenerList[index];
      target.removeEventListener(eventType, listener.wrapper, listener.options);
      listener.active = false;
      listenerList.splice(index, 1);
      
      if (listener.options.scope) {
        this._removeFromScope(listener.options.scope, target, eventType, handler);
      }
    }
  }

  once(target, eventType, handler, options = {}) {
    const onceHandler = (e) => {
      this.off(target, eventType, onceHandler);
      return handler(e);
    };
    
    return this.on(target, eventType, onceHandler, options);
  }

  clearScope(scope) {
    if (!this.scopes.has(scope)) return;
    
    const scopeListeners = this.scopes.get(scope);
    
    scopeListeners.forEach(({ target, eventType, handler, wrapper }) => {
      target.removeEventListener(eventType, wrapper);
      
      const key = this._getKey(target, eventType);
      if (this.listeners.has(key)) {
        const listenerList = this.listeners.get(key);
        const index = listenerList.findIndex(l => l.handler === handler);
        if (index !== -1) {
          listenerList[index].active = false;
          listenerList.splice(index, 1);
        }
      }
    });
    
    this.scopes.delete(scope);
  }

  _removeFromScope(scope, target, eventType, handler) {
    if (!this.scopes.has(scope)) return;
    
    const scopeListeners = this.scopes.get(scope);
    const index = scopeListeners.findIndex(
      l => l.target === target && l.eventType === eventType && l.handler === handler
    );
    
    if (index !== -1) {
      scopeListeners.splice(index, 1);
    }
  }

  _getKey(target, eventType) {
    const targetName = target === document ? 'document' : 
                       target === window ? 'window' : 
                       target === document.body ? 'body' : 
                       target.nodeName ? target.nodeName : 
                       'unknown';
    
    return `${targetName}:${eventType}`;
  }

  getListenerCount(target, eventType) {
    const key = this._getKey(target, eventType);
    return this.listeners.has(key) ? this.listeners.get(key).length : 0;
  }

  getAllListenerCounts() {
    const counts = {};
    this.listeners.forEach((listeners, key) => {
      counts[key] = listeners.filter(l => l.active).length;
    });
    return counts;
  }

  cleanup() {
    this.listeners.forEach((listenerList, key) => {
      const [targetName, eventType] = key.split(':');
      let target;
      
      if (targetName === 'document') target = document;
      else if (targetName === 'window') target = window;
      else if (targetName === 'body') target = document.body;
      
      if (target) {
        listenerList.forEach(listener => {
          target.removeEventListener(eventType, listener.wrapper, listener.options);
        });
      }
    });
    
    this.listeners.clear();
    this.scopes.clear();
  }
}

const globalEvents = new GlobalEventManager();

function on(target, eventType, handler, options) {
  return globalEvents.on(target, eventType, handler, options);
}

function off(target, eventType, handler) {
  globalEvents.off(target, eventType, handler);
}

function once(target, eventType, handler, options) {
  return globalEvents.once(target, eventType, handler, options);
}

function clearScope(scope) {
  globalEvents.clearScope(scope);
}

window.GlobalEventManager = GlobalEventManager;
window.globalEvents = globalEvents;
window.on = on;
window.off = off;
window.once = once;
window.clearScope = clearScope;