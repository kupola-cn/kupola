class KupolaLifecycle {
  constructor(scope = 'app') {
    this.scope = scope;
    this.hooks = new Map();
    this.state = 'created';
    this.stateHistory = ['created'];
    this.transitions = new Map([
      ['created', ['bootstrapped', 'destroyed']],
      ['bootstrapped', ['mounted', 'destroyed']],
      ['mounted', ['updated', 'unmounted', 'destroyed']],
      ['updated', ['updated', 'unmounted', 'destroyed']],
      ['unmounted', ['mounted', 'destroyed']],
      ['destroyed', []]
    ]);
    
    this.phaseStateMap = {
      'bootstrap': { from: 'created', to: 'bootstrapped' },
      'mount': { from: ['bootstrapped', 'unmounted'], to: 'mounted' },
      'update': { from: ['mounted', 'updated'], to: 'updated' },
      'unmount': { from: ['mounted', 'updated'], to: 'unmounted' },
      'destroy': { from: ['bootstrapped', 'mounted', 'updated', 'unmounted'], to: 'destroyed' }
    };

    this.basePhases = ['bootstrap', 'mount', 'update', 'unmount', 'destroy'];
    this.allPhases = ['error', 'errorBoundary'];
    
    this.basePhases.forEach(phase => {
      this.allPhases.push(`before${phase.charAt(0).toUpperCase() + phase.slice(1)}`);
      this.allPhases.push(phase);
      this.allPhases.push(`after${phase.charAt(0).toUpperCase() + phase.slice(1)}`);
    });
    
    this.allPhases.forEach(phase => {
      this.hooks.set(phase, []);
    });
    
    this.pendingHooks = new Set();
    this.trace = [];
    this.errorHandler = null;
    this.errorBoundary = null;
    this.lastError = null;
    this.errorCount = 0;
    this.maxErrors = 10;
    this._onErrorCallback = null;
  }

  _validateTransition(nextState) {
    const allowed = this.transitions.get(this.state);
    if (!allowed || !allowed.includes(nextState)) {
      throw new Error(`Invalid state transition: ${this.state} -> ${nextState}`);
    }
    return true;
  }

  _updateState(nextState) {
    this._validateTransition(nextState);
    this.state = nextState;
    this.stateHistory.push(nextState);
  }

  _resetResolved(phase) {
    const handlers = this.hooks.get(phase);
    if (handlers) {
      handlers.forEach(hook => {
        hook.resolved = false;
      });
    }
  }

  on(phase, handler, options = {}) {
    if (!this.allPhases.includes(phase)) {
      throw new Error(`Unknown lifecycle phase: ${phase}`);
    }
    
    const hooks = this.hooks.get(phase);
    hooks.push({
      handler,
      priority: options.priority || 0,
      depends: options.depends || [],
      name: options.name || handler.name || `anonymous_${hooks.length}`
    });
    
    hooks.sort((a, b) => b.priority - a.priority);
    
    return () => {
      const index = hooks.findIndex(h => h.handler === handler);
      if (index > -1) {
        hooks.splice(index, 1);
      }
    };
  }

  async _resolveDepends(depends, phase) {
    if (!depends || depends.length === 0) return;
    
    for (const depName of depends) {
      const phaseHooks = this.hooks.get(phase);
      const depHook = phaseHooks.find(h => h.name === depName);
      if (depHook && !depHook.resolved) {
        await depHook.handler();
        depHook.resolved = true;
      }
    }
  }

  async emit(phase, ...args) {
    if (this.state === 'destroyed' && phase !== 'error') return;
    
    const handlers = this.hooks.get(phase);
    if (!handlers || handlers.length === 0) return;

    const emitId = `${phase}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.pendingHooks.add(emitId);

    const startTime = performance.now();
    
    try {
      for (const hook of handlers) {
        await this._resolveDepends(hook.depends, phase);
        
        const hookStartTime = performance.now();
        let hookResult, hookError;
        
        try {
          hookResult = hook.handler(...args);
          if (hookResult instanceof Promise) {
            await hookResult;
          }
          hook.resolved = true;
        } catch (error) {
          hookError = error;
          console.error(`[KupolaLifecycle] Error in ${phase} hook "${hook.name}":`, error);
          
          if (phase !== 'error') {
            await this._handleError({ phase, hook: hook.name, error, args });
          }
        }
        
        const hookDuration = performance.now() - hookStartTime;
        
        this.trace.push({
          emitId,
          phase,
          hookName: hook.name,
          duration: hookDuration,
          status: hookError ? 'error' : 'success',
          error: hookError ? hookError.message : null,
          timestamp: Date.now()
        });
      }
      
      const totalDuration = performance.now() - startTime;
      console.debug(`[KupolaLifecycle] ${phase} completed in ${totalDuration.toFixed(2)}ms (${this.scope})`);
    } finally {
      this.pendingHooks.delete(emitId);
    }
  }

  async runPhase(phase, ...args) {
    if (!this.basePhases.includes(phase)) {
      throw new Error(`Unknown base phase: ${phase}`);
    }

    const stateMap = this.phaseStateMap[phase];
    if (stateMap) {
      if (Array.isArray(stateMap.from)) {
        if (!stateMap.from.includes(this.state)) {
          throw new Error(`Cannot ${phase} from state ${this.state}, expected one of: ${stateMap.from.join(', ')}`);
        }
      } else {
        if (this.state !== stateMap.from) {
          throw new Error(`Cannot ${phase} from state ${this.state}, expected ${stateMap.from}`);
        }
      }
    }

    const beforePhase = `before${phase.charAt(0).toUpperCase() + phase.slice(1)}`;
    const afterPhase = `after${phase.charAt(0).toUpperCase() + phase.slice(1)}`;
    
    this._resetResolved(beforePhase);
    this._resetResolved(phase);
    this._resetResolved(afterPhase);

    if (this.allPhases.includes(beforePhase)) {
      await this.emit(beforePhase, ...args);
    }

    await this.emit(phase, ...args);

    if (stateMap) {
      this._updateState(stateMap.to);
    }

    if (this.allPhases.includes(afterPhase)) {
      await this.emit(afterPhase, ...args);
    }
  }

  async bootstrap(...args) {
    await this.runPhase('bootstrap', ...args);
  }

  async _waitForDOMReady() {
    return new Promise((resolve) => {
      if (document.readyState === 'complete' || document.readyState === 'interactive') {
        resolve();
        return;
      }
      
      const onReady = () => {
        document.removeEventListener('DOMContentLoaded', onReady);
        window.removeEventListener('load', onReady);
        resolve();
      };
      
      document.addEventListener('DOMContentLoaded', onReady);
      window.addEventListener('load', onReady);
    });
  }

  async mount(...args) {
    await this.runPhase('mount', ...args);
  }

  async mountWithDOMReady(...args) {
    await this._waitForDOMReady();
    await this.runPhase('mount', ...args);
  }

  async update(...args) {
    await this.runPhase('update', ...args);
  }

  async unmount(...args) {
    await this.runPhase('unmount', ...args);
  }

  async destroy(...args) {
    await this.runPhase('destroy', ...args);
    
    this.hooks.forEach(handlers => {
      handlers.length = 0;
    });
  }

  getPhaseHandlers(phase) {
    return this.hooks.get(phase) || [];
  }

  hasHandlers(phase) {
    const handlers = this.hooks.get(phase);
    return handlers && handlers.length > 0;
  }

  getTrace() {
    return [...this.trace];
  }

  clearTrace() {
    this.trace = [];
  }

  getState() {
    return this.state;
  }

  getStateHistory() {
    return [...this.stateHistory];
  }

  isInState(targetState) {
    return this.state === targetState;
  }

  onError(handler) {
    this._onErrorCallback = handler;
    return this.on('error', handler);
  }

  setErrorBoundary(boundary) {
    this.errorBoundary = boundary;
    return this.on('errorBoundary', (errorInfo) => {
      if (typeof boundary === 'function') {
        return boundary(errorInfo);
      }
      return null;
    });
  }

  setMaxErrors(max) {
    this.maxErrors = max;
  }

  getErrorCount() {
    return this.errorCount;
  }

  getLastError() {
    return this.lastError;
  }

  resetErrorCount() {
    this.errorCount = 0;
    this.lastError = null;
  }

  async _handleError(errorInfo) {
    this.errorCount++;
    this.lastError = errorInfo.error;

    if (this.errorCount >= this.maxErrors) {
      console.error(`[KupolaLifecycle] Error limit reached (${this.maxErrors}), stopping error handling`);
      return;
    }

    await this.emit('error', errorInfo);

    if (typeof this._onErrorCallback === 'function') {
      try {
        await this._onErrorCallback(errorInfo);
      } catch (e) {
        console.error('[KupolaLifecycle] Error in onError callback:', e);
      }
    }

    const boundaryHandlers = this.hooks.get('errorBoundary');
    if (boundaryHandlers && boundaryHandlers.length > 0) {
      for (const hook of boundaryHandlers) {
        try {
          const result = hook.handler(errorInfo);
          if (result instanceof Promise) {
            await result;
          }
          if (result === 'handled') {
            console.debug(`[KupolaLifecycle] Error handled by errorBoundary hook "${hook.name}"`);
            return;
          }
        } catch (e) {
          console.error(`[KupolaLifecycle] Error in errorBoundary hook "${hook.name}":`, e);
        }
      }
    }

    console.error(`[KupolaLifecycle] Unhandled error in ${errorInfo.phase}:`, errorInfo.error);
  }
}

class KupolaPluginManager {
  constructor() {
    this.plugins = new Map();
    this.enabledPlugins = new Set();
    this.pluginHooks = new Map();
  }

  register(name, plugin) {
    if (this.plugins.has(name)) {
      console.warn(`Plugin ${name} already registered, overriding`);
    }
    
    this.plugins.set(name, {
      ...plugin,
      name,
      enabled: false,
      instance: null,
      lifecycle: new KupolaLifecycle(`plugin:${name}`)
    });
  }

  async enable(name) {
    const plugin = this.plugins.get(name);
    if (!plugin) {
      throw new Error(`Plugin ${name} not found`);
    }
    
    if (plugin.enabled) return;
    
    try {
      await plugin.lifecycle.bootstrap();
      
      if (plugin.install) {
        plugin.instance = await plugin.install();
      }
      plugin.enabled = true;
      this.enabledPlugins.add(name);
      
      await plugin.lifecycle.mount();
      
      if (plugin.hooks) {
        this._registerPluginHooks(name, plugin.hooks);
      }
      
      console.log(`Plugin ${name} enabled`);
    } catch (error) {
      console.error(`Failed to enable plugin ${name}:`, error);
      throw error;
    }
  }

  async disable(name) {
    const plugin = this.plugins.get(name);
    if (!plugin || !plugin.enabled) return;
    
    try {
      await plugin.lifecycle.unmount();
      
      if (plugin.uninstall) {
        await plugin.uninstall(plugin.instance);
      }
      
      if (plugin.hooks) {
        this._unregisterPluginHooks(name);
      }
      
      plugin.enabled = false;
      this.enabledPlugins.delete(name);
      plugin.instance = null;
      
      await plugin.lifecycle.destroy();
      
      console.log(`Plugin ${name} disabled`);
    } catch (error) {
      console.error(`Failed to disable plugin ${name}:`, error);
      throw error;
    }
  }

  get(name) {
    const plugin = this.plugins.get(name);
    return plugin?.instance || null;
  }

  getAll() {
    const result = {};
    this.plugins.forEach((plugin, name) => {
      result[name] = {
        name: plugin.name,
        enabled: plugin.enabled,
        instance: plugin.instance,
        state: plugin.lifecycle.getState()
      };
    });
    return result;
  }

  getEnabled() {
    const result = {};
    this.enabledPlugins.forEach(name => {
      const plugin = this.plugins.get(name);
      if (plugin) {
        result[name] = plugin.instance;
      }
    });
    return result;
  }

  async enableAll() {
    const promises = [];
    this.plugins.forEach((_, name) => {
      promises.push(this.enable(name));
    });
    await Promise.all(promises);
  }

  async disableAll() {
    const promises = [];
    this.enabledPlugins.forEach(name => {
      promises.push(this.disable(name));
    });
    await Promise.all(promises);
  }

  _registerPluginHooks(pluginName, hooks) {
    if (!this.pluginHooks.has(pluginName)) {
      this.pluginHooks.set(pluginName, []);
    }
    
    const pluginHooks = this.pluginHooks.get(pluginName);
    
    Object.keys(hooks).forEach(phase => {
      const unsubscribe = window.kupolaLifecycle?.on(phase, hooks[phase], { name: `${pluginName}:${phase}` });
      if (unsubscribe) {
        pluginHooks.push({ phase, unsubscribe });
      }
    });
  }

  _unregisterPluginHooks(pluginName) {
    const pluginHooks = this.pluginHooks.get(pluginName);
    if (!pluginHooks) return;
    
    pluginHooks.forEach(({ unsubscribe }) => {
      if (unsubscribe) unsubscribe();
    });
    
    this.pluginHooks.delete(pluginName);
  }
}

const kupolaLifecycle = new KupolaLifecycle('app');
const kupolaPluginManager = new KupolaPluginManager();

function createLifecycle(scope = 'app') {
  return new KupolaLifecycle(scope);
}

window.KupolaLifecycle = KupolaLifecycle;
window.KupolaPluginManager = KupolaPluginManager;
window.kupolaLifecycle = kupolaLifecycle;
window.kupolaPluginManager = kupolaPluginManager;
window.createLifecycle = createLifecycle;