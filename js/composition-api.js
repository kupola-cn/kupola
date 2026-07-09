(function(window) {
    let currentSetupContext = null;

    class SetupContext {
        constructor(component) {
            this.component = component;
            this.lifecycle = (component && component.lifecycle) || null;
            this._onMountedHandlers = [];
            this._onUnmountedHandlers = [];
            this._onUpdatedHandlers = [];
            this._watches = [];
            this._refs = new Map();
            this._computedDeps = new Map();
        }

        ref(initialValue = null) {
            if (window.kupolaData) {
                const key = `__ref_${Math.random().toString(36).slice(2, 11)}__`;
                window.kupolaData.set(key, initialValue);
                
                return {
                    get value() {
                        return window.kupolaData.get(key);
                    },
                    set value(newValue) {
                        window.kupolaData.set(key, newValue);
                    },
                    _key: key
                };
            }

            const refObj = {
                _value: initialValue,
                _subscribers: new Set()
            };

            Object.defineProperty(refObj, 'value', {
                get() {
                    return refObj._value;
                },
                set(newValue) {
                    if (newValue !== refObj._value) {
                        refObj._value = newValue;
                        refObj._subscribers.forEach(sub => sub(newValue));
                    }
                }
            });

            return refObj;
        }

        reactive(target) {
            if (window.kupolaData) {
                return window.kupolaData.createReactive(target);
            }

            const self = this;
            const handler = {
                get(target, key) {
                    if (key === '__isReactive') return true;
                    if (key === '__raw') return target;
                    const result = target[key];
                    if (typeof result === 'object' && result !== null && !result.__isReactive) {
                        target[key] = self.reactive(result);
                    }
                    return target[key];
                },
                set(target, key, value) {
                    if (target[key] === value) return true;
                    target[key] = value;
                    self._notifyWatchers(key, value);
                    return true;
                },
                deleteProperty(target, key) {
                    delete target[key];
                    self._notifyWatchers(key, undefined);
                    return true;
                }
            };

            const proxy = new Proxy(target, handler);
            proxy.__isReactive = true;
            return proxy;
        }

        onMounted(handler) {
            if (this.lifecycle) {
                this.lifecycle.on('mount', handler, { name: 'onMounted' });
            } else {
                this._onMountedHandlers.push(handler);
            }
        }

        onUnmounted(handler) {
            if (this.lifecycle) {
                this.lifecycle.on('unmount', handler, { name: 'onUnmounted' });
            } else {
                this._onUnmountedHandlers.push(handler);
            }
        }

        onUpdated(handler) {
            if (this.lifecycle) {
                this.lifecycle.on('update', handler, { name: 'onUpdated' });
            } else {
                this._onUpdatedHandlers.push(handler);
            }
        }

        watch(source, handler, options = {}) {
            if (typeof source === 'function') {
                const watcher = () => {
                    const newValue = source();
                    if (newValue !== watcher._oldValue) {
                        handler(newValue, watcher._oldValue);
                        watcher._oldValue = newValue;
                    }
                };
                watcher._oldValue = undefined;
                this._watches.push(watcher);
                watcher();

                if (window.kupolaData) {
                    const trackedPaths = [];
                    const originalGet = window.kupolaData.get;
                    window.kupolaData.get = function(k) {
                        trackedPaths.push(k);
                        return originalGet.call(this, k);
                    };
                    source();
                    window.kupolaData.get = originalGet;
                    
                    trackedPaths.forEach(path => {
                        window.kupolaData.observe(path, watcher);
                    });
                }
            } else if (typeof source === 'object' && source !== null) {
                if (source._subscribers) {
                    source._subscribers.add(handler);
                } else if (source._key && window.kupolaData) {
                    window.kupolaData.observe(source._key, () => {
                        handler(source.value);
                    });
                }
            }
        }

        computed(getter) {
            const result = this.ref();
            const self = this;
            
            let update = () => {
                try {
                    result.value = getter();
                } catch (e) {
                    console.error('Computed property error:', e);
                }
            };

            const trackedPaths = [];
            if (window.kupolaData) {
                const originalGet = window.kupolaData.get;
                window.kupolaData.get = function(k) {
                    trackedPaths.push(k);
                    return originalGet.call(this, k);
                };
                
                update();
                
                window.kupolaData.get = originalGet;
                
                trackedPaths.forEach(path => {
                    window.kupolaData.observe(path, update);
                });
                
                this._computedDeps.set(result, trackedPaths);
            } else {
                update();
            }

            let computedValue = result._value;
            
            Object.defineProperty(result, 'value', {
                get: () => computedValue,
                set: (newValue) => {
                    console.warn('Cannot assign to a computed property');
                }
            });

            const originalUpdate = update;
            update = () => {
                try {
                    computedValue = getter();
                } catch (e) {
                    console.error('Computed property error:', e);
                }
            };

            return result;
        }

        emit(eventName, data) {
            if (this.component) {
                this.component.$emit(eventName, data);
            }
        }

        _notifyWatchers(key, value) {
            this._watches.forEach(watcher => {
                try { watcher(); } catch (e) { console.error(e); }
            });
        }

        _executeMounted() {
            this._onMountedHandlers.forEach(handler => {
                try { handler(); } catch (e) { console.error(e); }
            });
        }

        _executeUnmounted() {
            this._onUnmountedHandlers.forEach(handler => {
                try { handler(); } catch (e) { console.error(e); }
            });
        }

        _executeUpdated() {
            this._onUpdatedHandlers.forEach(handler => {
                try { handler(); } catch (e) { console.error(e); }
            });
        }

        destroy() {
            this._watches.forEach(watcher => {
                if (watcher._subscribers) {
                    watcher._subscribers.clear();
                }
            });
            this._watches = [];
            
            this._computedDeps.forEach((paths, result) => {
                paths.forEach(path => {
                    if (window.kupolaData) {
                        window.kupolaData.unobserve(path);
                    }
                });
            });
            this._computedDeps.clear();
            
            this._refs.clear();
            this._onMountedHandlers = [];
            this._onUnmountedHandlers = [];
            this._onUpdatedHandlers = [];
            
            this.component = null;
            this.lifecycle = null;
        }
    }

    function ref(initialValue = null) {
        if (currentSetupContext) {
            return currentSetupContext.ref(initialValue);
        }

        if (window.kupolaData) {
            const key = `__ref_${Math.random().toString(36).slice(2, 11)}__`;
            window.kupolaData.set(key, initialValue);

            return {
                get value() {
                    return window.kupolaData.get(key);
                },
                set value(newValue) {
                    window.kupolaData.set(key, newValue);
                },
                _key: key
            };
        }

        const refObj = {
            _value: initialValue,
            _subscribers: new Set()
        };

        Object.defineProperty(refObj, 'value', {
            get() {
                return refObj._value;
            },
            set(newValue) {
                if (newValue !== refObj._value) {
                    refObj._value = newValue;
                    refObj._subscribers.forEach(sub => sub(newValue));
                }
            }
        });

        return refObj;
    }

    function reactive(target) {
        if (currentSetupContext) {
            return currentSetupContext.reactive(target);
        }

        if (window.kupolaData) {
            return window.kupolaData.createReactive(target);
        }

        const handler = {
            get(target, key) {
                if (key === '__isReactive') return true;
                if (key === '__raw') return target;
                const result = target[key];
                if (typeof result === 'object' && result !== null && !result.__isReactive) {
                    target[key] = new Proxy(result, handler);
                    target[key].__isReactive = true;
                }
                return target[key];
            },
            set(target, key, value) {
                if (target[key] === value) return true;
                target[key] = value;
                if (currentSetupContext) {
                    currentSetupContext._notifyWatchers(key, value);
                }
                return true;
            },
            deleteProperty(target, key) {
                delete target[key];
                if (currentSetupContext) {
                    currentSetupContext._notifyWatchers(key, undefined);
                }
                return true;
            }
        };

        const proxy = new Proxy(target, handler);
        proxy.__isReactive = true;
        return proxy;
    }

    function onMounted(handler) {
        if (currentSetupContext) {
            currentSetupContext.onMounted(handler);
        } else {
            console.warn('onMounted called outside of setup()');
        }
    }

    function onUnmounted(handler) {
        if (currentSetupContext) {
            currentSetupContext.onUnmounted(handler);
        } else {
            console.warn('onUnmounted called outside of setup()');
        }
    }

    function onUpdated(handler) {
        if (currentSetupContext) {
            currentSetupContext.onUpdated(handler);
        } else {
            console.warn('onUpdated called outside of setup()');
        }
    }

    function watch(source, handler, options = {}) {
        if (currentSetupContext) {
            currentSetupContext.watch(source, handler, options);
        }
    }

    function computed(getter) {
        if (currentSetupContext) {
            return currentSetupContext.computed(getter);
        }

        const result = ref();

        let update = () => {
        try {
            result.value = getter();
        } catch (e) {
            console.error('Computed property error:', e);
        }
    };

    if (window.kupolaData) {
        const trackedPaths = [];
        const originalGet = window.kupolaData.get;
        window.kupolaData.get = function(k) {
            trackedPaths.push(k);
            return originalGet.call(this, k);
        };
        
        update();
        
        window.kupolaData.get = originalGet;
        
        trackedPaths.forEach(path => {
            window.kupolaData.observe(path, update);
        });
    } else {
        update();
    }

    let computedValue = result._value;
        
        Object.defineProperty(result, 'value', {
            get: () => computedValue,
            set: (newValue) => {
                console.warn('Cannot assign to a computed property');
            }
        });

        const originalUpdate = update;
        update = () => {
            try {
                computedValue = getter();
            } catch (e) {
                console.error('Computed property error:', e);
            }
        };

        return result;
}

    function setup(setupFn) {
        if (typeof setupFn !== 'function') {
            console.error('setup() requires a function argument');
            return;
        }

        const setupContext = new SetupContext();
        const prevContext = currentSetupContext;
        currentSetupContext = setupContext;

        let result;
        try {
            result = setupFn(setupContext);
        } finally {
            currentSetupContext = prevContext;
        }

        return result;
    }

    window.SetupContext = SetupContext;
    window.ref = ref;
    window.reactive = reactive;
    window.onMounted = onMounted;
    window.onUnmounted = onUnmounted;
    window.onUpdated = onUpdated;
    window.watch = watch;
    window.computed = computed;
    window.setup = setup;
    window._getCurrentSetupContext = () => currentSetupContext;
    window._setCurrentSetupContext = (ctx) => { currentSetupContext = ctx; };
    window._clearSetupContext = () => { currentSetupContext = null; };
})(window);