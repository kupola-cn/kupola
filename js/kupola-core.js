/**
 * Kupola Core — Component system bootstrap, registry, and lifecycle management.
 * @module kupola-core
 */

import { KupolaComponent, applyMixin } from './component.js';
import { KupolaComponentRegistry } from './registry.js';
import { KupolaLifecycle } from './kupola-lifecycle.js';
import { kupolaInitializer } from './initializer.js';
import { kupolaData } from './data-bind.js';
import { initTheme } from './theme.js';
import { getConfig, getSecurityConfig } from './kupola-config.js';

let kupolaRegistry = null;

if (typeof window !== 'undefined') {
  kupolaRegistry = new KupolaComponentRegistry();
}

function _applySecurityHeaders() {
  const securityConfig = getSecurityConfig();
  
  if (securityConfig.xssProtection && typeof document !== 'undefined') {
    let metaTag = document.querySelector('meta[http-equiv="X-XSS-Protection"]');
    if (!metaTag) {
      metaTag = document.createElement('meta');
      metaTag.setAttribute('http-equiv', 'X-XSS-Protection');
      metaTag.setAttribute('content', '1; mode=block');
      document.head.insertBefore(metaTag, document.head.firstChild);
    }
    
    metaTag = document.querySelector('meta[http-equiv="X-Content-Type-Options"]');
    if (!metaTag) {
      metaTag = document.createElement('meta');
      metaTag.setAttribute('http-equiv', 'X-Content-Type-Options');
      metaTag.setAttribute('content', 'nosniff');
      document.head.insertBefore(metaTag, document.head.firstChild);
    }
  }
}

/** Bootstrap the Kupola component system (data binding, theme, component discovery). */
async function kupolaBootstrap() {
  if (typeof window !== 'undefined') {
    _applySecurityHeaders();
    
    const config = getConfig();
    // Load persisted data and bind data-bind elements
    kupolaData.loadPersisted();
    kupolaData.bind();
    // Initialize theme
    initTheme();
    
    if (config.components?.autoInit !== false) {
      // Initialize function-based components first
      await kupolaInitializer.initializeAll();
      // Then bootstrap class-based components
      if (kupolaRegistry) {
        await kupolaRegistry.bootstrap();
      }
    }
  }
}

if (typeof document !== 'undefined' && document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', kupolaBootstrap);
} else if (typeof window !== 'undefined') {
  setTimeout(kupolaBootstrap, 0);
}

/** Register a class-based component. */
function registerComponent(name, componentClass) {
  if (kupolaRegistry) {
    kupolaRegistry.register(name, componentClass);
  }
}

/** Register a lazy-loaded component (loaded on first use). */
function registerLazyComponent(name, loader) {
  if (kupolaRegistry) {
    kupolaRegistry.registerLazy(name, loader);
  }
}

/** Manually bootstrap components within a specific root element. */
function bootstrapComponents(root) {
  if (kupolaRegistry) {
    return kupolaRegistry.bootstrap(root);
  }
  return Promise.resolve();
}

/** Define a reusable mixin for component classes. */
function defineMixin(name, mixin) {
  if (kupolaRegistry) {
    kupolaRegistry.defineMixin(name, mixin);
  }
}

/** Apply named mixins to a component class. */
function useMixin(componentClass, ...mixinNames) {
  if (kupolaRegistry) {
    kupolaRegistry.useMixin(componentClass, ...mixinNames);
  }
}

/**
 * Unified component registration API.
 * @param {string} name - Component name
 * @param {object} options
 * @param {Function} [options.init] - Init function (for function-based components)
 * @param {Function} [options.cleanup] - Cleanup function
 * @param {Function} [options.componentClass] - Component class (for class-based components)
 * @param {Function} [options.lazy] - Lazy loader function
 * @param {string} [options.dataAttribute] - Custom data attribute (e.g. 'data-my-component')
 * @param {string} [options.cssClass] - CSS class selector (e.g. 'ds-my-component')
 */
function defineComponent(name, options) {
  if (!options || typeof options !== 'object') {
    throw new Error(`defineComponent("${name}"): options must be an object`);
  }
  // Register with registry (class or lazy)
  if (options.componentClass) {
    if (kupolaRegistry) {
      kupolaRegistry.register(name, options.componentClass);
    }
  } else if (options.lazy) {
    if (kupolaRegistry) {
      kupolaRegistry.registerLazy(name, options.lazy);
    }
  }
  // Register with initializer (function-based)
  if (options.init) {
    kupolaInitializer.register(name, options.init, options.cleanup || null, {
      dataAttribute: options.dataAttribute,
      cssClass: options.cssClass
    });
  } else if (options.dataAttribute || options.cssClass) {
    // Even without init, register selectors so MutationObserver can find them
    kupolaInitializer.register(name, () => {}, null, {
      dataAttribute: options.dataAttribute,
      cssClass: options.cssClass
    });
  }
}

export {
  KupolaComponent,
  applyMixin,
  KupolaComponentRegistry,
  KupolaLifecycle,
  kupolaRegistry,
  kupolaInitializer,
  kupolaBootstrap,
  registerComponent,
  registerLazyComponent,
  bootstrapComponents,
  defineMixin,
  useMixin,
  defineComponent
};