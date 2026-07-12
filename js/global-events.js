class GlobalEvents {
    constructor() {
        this._listeners = new Map();
        this._scopeListeners = new Map();
    }

    on(target, eventName, handler, options = {}) {
        const { scope = null, once = false, passive = false, capture = false } = options;
        
        const listenerId = this._generateId();
        
        const listener = {
            id: listenerId,
            target,
            eventName,
            handler,
            scope,
            once,
            wrappedHandler: null
        };

        listener.wrappedHandler = (event) => {
            if (once) {
                this.offById(listenerId);
            }
            handler.call(target, event);
        };

        const eventKey = this._getEventKey(target, eventName);
        
        if (!this._listeners.has(eventKey)) {
            this._listeners.set(eventKey, []);
        }
        this._listeners.get(eventKey).push(listener);

        if (scope) {
            if (!this._scopeListeners.has(scope)) {
                this._scopeListeners.set(scope, []);
            }
            this._scopeListeners.get(scope).push(listenerId);
        }

        target.addEventListener(eventName, listener.wrappedHandler, {
            passive,
            capture
        });

        return {
            unsubscribe: () => this.offById(listenerId)
        };
    }

    once(target, eventName, handler, options = {}) {
        return this.on(target, eventName, handler, { ...options, once: true });
    }

    off(target, eventName, handler) {
        const eventKey = this._getEventKey(target, eventName);
        
        if (!this._listeners.has(eventKey)) return;

        const listeners = this._listeners.get(eventKey);
        const filtered = listeners.filter(listener => listener.handler !== handler);
        
        listeners.forEach(listener => {
            if (listener.handler === handler) {
                target.removeEventListener(eventName, listener.wrappedHandler);
                this._removeFromScope(listener);
            }
        });

        if (filtered.length === 0) {
            this._listeners.delete(eventKey);
        } else {
            this._listeners.set(eventKey, filtered);
        }
    }

    offById(listenerId) {
        for (const [eventKey, listeners] of this._listeners) {
            const index = listeners.findIndex(l => l.id === listenerId);
            
            if (index !== -1) {
                const listener = listeners[index];
                listener.target.removeEventListener(listener.eventName, listener.wrappedHandler);
                
                listeners.splice(index, 1);
                
                if (listeners.length === 0) {
                    this._listeners.delete(eventKey);
                }
                
                this._removeFromScope(listener);
                
                return true;
            }
        }
        return false;
    }

    offByScope(scope) {
        if (!this._scopeListeners.has(scope)) return;

        const listenerIds = this._scopeListeners.get(scope);
        
        listenerIds.forEach(listenerId => {
            this.offById(listenerId);
        });
        
        this._scopeListeners.delete(scope);
    }

    offAll(target, eventName = null) {
        if (eventName) {
            const eventKey = this._getEventKey(target, eventName);
            
            if (!this._listeners.has(eventKey)) return;
            
            const listeners = this._listeners.get(eventKey);
            
            listeners.forEach(listener => {
                target.removeEventListener(eventName, listener.wrappedHandler);
                this._removeFromScope(listener);
            });
            
            this._listeners.delete(eventKey);
        } else {
            for (const [eventKey, listeners] of this._listeners) {
                const [targetId] = eventKey.split(':');
                
                if (this._getTargetId(target) === targetId) {
                    listeners.forEach(listener => {
                        target.removeEventListener(listener.eventName, listener.wrappedHandler);
                        this._removeFromScope(listener);
                    });
                    
                    this._listeners.delete(eventKey);
                }
            }
        }
    }

    emit(target, eventName, detail = {}) {
        const event = new CustomEvent(eventName, {
            detail,
            bubbles: true,
            cancelable: true
        });
        
        target.dispatchEvent(event);
        return event;
    }

    emitGlobal(eventName, detail = {}) {
        return this.emit(document, eventName, detail);
    }

    emitToScope(scope, eventName, detail = {}) {
        if (!this._scopeListeners.has(scope)) return;

        const listenerIds = this._scopeListeners.get(scope);
        const targets = new Set();
        
        for (const [eventKey, listeners] of this._listeners) {
            listeners.forEach(listener => {
                if (listenerIds.includes(listener.id)) {
                    targets.add(listener.target);
                }
            });
        }
        
        targets.forEach(target => {
            this.emit(target, eventName, detail);
        });
    }

    getListenerCount(target, eventName = null) {
        if (eventName) {
            const eventKey = this._getEventKey(target, eventName);
            return this._listeners.has(eventKey) ? this._listeners.get(eventKey).length : 0;
        }
        
        let count = 0;
        const targetId = this._getTargetId(target);
        
        for (const [eventKey, listeners] of this._listeners) {
            const [keyTargetId] = eventKey.split(':');
            if (keyTargetId === targetId) {
                count += listeners.length;
            }
        }
        
        return count;
    }

    getScopeListenerCount(scope) {
        return this._scopeListeners.has(scope) ? this._scopeListeners.get(scope).length : 0;
    }

    hasListeners(target, eventName = null) {
        return this.getListenerCount(target, eventName) > 0;
    }

    _getEventKey(target, eventName) {
        return `${this._getTargetId(target)}:${eventName}`;
    }

    _getTargetId(target) {
        if (target === document) return 'document';
        if (target === window) return 'window';
        if (target === document.body) return 'body';
        if (target._kupolaId) return target._kupolaId;
        
        target._kupolaId = this._generateId();
        return target._kupolaId;
    }

    _generateId() {
        return `ge-${Math.random().toString(36).substr(2, 9)}-${Date.now()}`;
    }

    _removeFromScope(listener) {
        if (!listener.scope || !this._scopeListeners.has(listener.scope)) return;
        
        const scopeListeners = this._scopeListeners.get(listener.scope);
        const index = scopeListeners.indexOf(listener.id);
        
        if (index !== -1) {
            scopeListeners.splice(index, 1);
            
            if (scopeListeners.length === 0) {
                this._scopeListeners.delete(listener.scope);
            }
        }
    }

    destroy() {
        for (const [eventKey, listeners] of this._listeners) {
            listeners.forEach(listener => {
                listener.target.removeEventListener(listener.eventName, listener.wrappedHandler);
            });
        }
        
        this._listeners.clear();
        this._scopeListeners.clear();
    }
}

const globalEvents = new GlobalEvents();

function on(target, eventName, handler, options) {
    return globalEvents.on(target, eventName, handler, options);
}

function once(target, eventName, handler, options) {
    return globalEvents.once(target, eventName, handler, options);
}

function off(target, eventName, handler) {
    globalEvents.off(target, eventName, handler);
}

function emit(target, eventName, detail) {
    return globalEvents.emit(target, eventName, detail);
}

function emitGlobal(eventName, detail) {
    return globalEvents.emitGlobal(eventName, detail);
}

function offByScope(scope) {
    globalEvents.offByScope(scope);
}

function offAll(target, eventName) {
    globalEvents.offAll(target, eventName);
}

function getListenerCount(target, eventName) {
    return globalEvents.getListenerCount(target, eventName);
}

export { GlobalEvents, globalEvents, on, once, off, emit, emitGlobal, offByScope, offAll, getListenerCount };