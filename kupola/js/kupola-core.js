if (typeof window === 'undefined') {
  const { KupolaComponent, applyMixin } = require('./component.js');
  const { KupolaComponentRegistry } = require('./registry.js');
  const { KupolaRouter, createRouter } = require('./router.js');
  const { KupolaHttp, createHttp } = require('./http.js');
  
  module.exports = {
    KupolaComponent,
    applyMixin,
    KupolaComponentRegistry,
    KupolaRouter,
    KupolaHttp,
    createRouter,
    createHttp
  };
}

if (window.KupolaComponentRegistry) {
  window.kupolaRegistry = new window.KupolaComponentRegistry();
}

async function kupolaBootstrap() {
  if (window.kupolaData) {
    window.kupolaData.loadPersisted();
  }
  if (window.kupolaRegistry) {
    await window.kupolaRegistry.bootstrap();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', kupolaBootstrap);
} else {
  setTimeout(kupolaBootstrap, 0);
}

window.registerComponent = function(name, componentClass) {
  if (window.kupolaRegistry) {
    window.kupolaRegistry.register(name, componentClass);
  }
};

window.registerLazyComponent = function(name, loader) {
  if (window.kupolaRegistry) {
    window.kupolaRegistry.registerLazy(name, loader);
  }
};

window.bootstrapComponents = function(root) {
  if (window.kupolaRegistry) {
    return window.kupolaRegistry.bootstrap(root);
  }
  return Promise.resolve();
};

window.defineMixin = function(name, mixin) {
  if (window.kupolaRegistry) {
    window.kupolaRegistry.defineMixin(name, mixin);
  }
};

window.useMixin = function(componentClass, ...mixinNames) {
  if (window.kupolaRegistry) {
    window.kupolaRegistry.useMixin(componentClass, ...mixinNames);
  }
};