class KupolaErrorHandler {
  constructor() {
    this.handlers = new Map();
    this.errorLog = [];
    this.maxLogs = 100;
    this.globalHandler = null;
  }

  init() {
    this._installGlobalHandlers();
  }

  _installGlobalHandlers() {
    window.addEventListener('error', (event) => {
      this.handleError(event.error || event.message, {
        source: event.filename,
        line: event.lineno,
        column: event.colno,
        type: 'global'
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(event.reason, {
        type: 'promise',
        rejection: true
      });
    });
  }

  setGlobalHandler(handler) {
    if (typeof handler === 'function') {
      this.globalHandler = handler;
    }
  }

  handleError(error, context = {}) {
    const errorInfo = this._normalizeError(error, context);
    
    this._logError(errorInfo);
    this._notifyHandlers(errorInfo);
    
    if (this.globalHandler) {
      try {
        this.globalHandler(errorInfo);
      } catch (e) {
        console.error('[KupolaErrorHandler] Error in global handler:', e);
      }
    }
    
    return errorInfo;
  }

  _normalizeError(error, context) {
    const errorInfo = {
      id: this._generateId(),
      timestamp: Date.now(),
      message: '',
      stack: '',
      type: context.type || 'unknown',
      source: context.source || '',
      line: context.line || 0,
      column: context.column || 0,
      component: context.component || '',
      hook: context.hook || '',
      args: context.args || [],
      ...context
    };

    if (error instanceof Error) {
      errorInfo.message = error.message;
      errorInfo.stack = error.stack || '';
      errorInfo.name = error.name;
    } else if (typeof error === 'string') {
      errorInfo.message = error;
    } else if (error && typeof error === 'object') {
      errorInfo.message = error.message || JSON.stringify(error);
      errorInfo.stack = error.stack || '';
      errorInfo.name = error.name || '';
    }

    return errorInfo;
  }

  _generateId() {
    return `err-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  _logError(errorInfo) {
    this.errorLog.unshift(errorInfo);
    if (this.errorLog.length > this.maxLogs) {
      this.errorLog.pop();
    }
    
    console.error(`[KupolaError] [${errorInfo.type}] ${errorInfo.message}`, errorInfo);
  }

  _notifyHandlers(errorInfo) {
    this.handlers.forEach((handler, key) => {
      try {
        handler(errorInfo);
      } catch (e) {
        console.error(`[KupolaErrorHandler] Error in handler "${key}":`, e);
      }
    });
  }

  on(type, handler) {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, []);
    }
    this.handlers.get(type).push(handler);
  }

  off(type, handler) {
    if (!this.handlers.has(type)) return;
    
    const handlers = this.handlers.get(type);
    const index = handlers.indexOf(handler);
    if (index > -1) {
      handlers.splice(index, 1);
    }
  }

  getErrorLog() {
    return [...this.errorLog];
  }

  clearErrorLog() {
    this.errorLog = [];
  }

  getErrorCount() {
    return this.errorLog.length;
  }

  getErrorByType(type) {
    return this.errorLog.filter(err => err.type === type);
  }

  captureErrors(target, methodNames) {
    if (!target || !methodNames || !Array.isArray(methodNames)) return;

    methodNames.forEach(methodName => {
      if (typeof target[methodName] === 'function') {
        const originalMethod = target[methodName];
        target[methodName] = function(...args) {
          try {
            const result = originalMethod.apply(this, args);
            if (result instanceof Promise) {
              return result.catch(error => {
                kupolaErrorHandler.handleError(error, {
                  type: 'method',
                  component: target.constructor?.name || '',
                  hook: methodName,
                  args
                });
                throw error;
              });
            }
            return result;
          } catch (error) {
            kupolaErrorHandler.handleError(error, {
              type: 'method',
              component: target.constructor?.name || '',
              hook: methodName,
              args
            });
            throw error;
          }
        };
      }
    });
  }
}

const kupolaErrorHandler = new KupolaErrorHandler();
window.kupolaErrorHandler = kupolaErrorHandler;
window.KupolaErrorHandler = KupolaErrorHandler;

export default KupolaErrorHandler;