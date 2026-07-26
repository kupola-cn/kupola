// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Component definition API.
 *
 * defineComponent: factory for creating reusable, composable components
 *   with reactive props, internal state, and slot support.
 *
 * register / getComponent: global component registry.
 *
 * @module component
 */

import { getErrorHandler, signal } from '@kupola/core';
import { render } from './render.js';
import {
  createProvideContext,
  disposeProvideContext,
  getCurrentProvideContext,
  injectFromCurrentContext,
  provideInCurrentContext,
  runWithProvideContext,
} from './context.js';

/** Components waiting for their fragment to be inserted into the document. */
const pendingMountChecks = new Set();
/** Mounted components whose root nodes are watched for external removal. */
const activeComponents = new Set();
let mountObserver = null;

function reportLifecycleError(error, phase) {
  const handler = getErrorHandler();
  const context = { source: 'platform', phase };
  if (handler) {
    try {
      handler(error, context);
      return;
    } catch (handlerError) {
      if (typeof console !== 'undefined' && typeof console.error === 'function') {
        console.error('[kupola] Component error handler failed.', handlerError);
      }
      return;
    }
  }
  if (typeof console !== 'undefined' && typeof console.error === 'function') {
    console.error('[kupola] Component lifecycle hook failed.', error);
  }
}

function stopMountObserverIfUnused() {
  if (pendingMountChecks.size !== 0 || activeComponents.size !== 0 || !mountObserver) {return;}
  mountObserver.disconnect();
  mountObserver = null;
}

function ensureMountObserver() {
  if (mountObserver || typeof MutationObserver !== 'function') {return;}

  mountObserver = new MutationObserver(records => {
    for (const check of [ ...pendingMountChecks ]) {
      try {
        check(records);
      } catch (error) {
        reportLifecycleError(error, 'component-mounted');
      }
    }
    for (const entry of [ ...activeComponents ]) {
      if (entry.rootNodes.length > 0 && entry.rootNodes.every(node => !node.isConnected)) {
        try {
          entry.destroy();
        } catch (error) {
          reportLifecycleError(error, 'component-destroyed');
        }
      }
    }
    stopMountObserverIfUnused();
  });
  mountObserver.observe(document, { childList: true, subtree: true });
}

function watchForMount(check) {
  if (typeof MutationObserver !== 'function') {return () => {};}
  pendingMountChecks.add(check);
  ensureMountObserver();
  return () => {
    pendingMountChecks.delete(check);
    stopMountObserverIfUnused();
  };
}

function watchForRemoval(rootNodes, destroy) {
  if (typeof MutationObserver !== 'function' || rootNodes.length === 0) {return () => {};}
  const entry = { rootNodes, destroy };
  activeComponents.add(entry);
  try {
    ensureMountObserver();
  } catch (error) {
    activeComponents.delete(entry);
    stopMountObserverIfUnused();
    throw error;
  }
  return () => {
    activeComponents.delete(entry);
    stopMountObserverIfUnused();
  };
}

export function provide(key, value) {
  provideInCurrentContext(key, value);
}

export function inject(key, defaultValue = undefined) {
  return injectFromCurrentContext(key, defaultValue);
}

// ─── defineComponent ─────────────────────────────────────────────────────────

/**
 * Define a reusable component.
 *
 * ```js
 * const Dialog = defineComponent({
 *   props: ['open', 'title'],
 *   setup(props, children) {
 *     const localOpen = signal(props.open?.value ?? false);
 *     const close = () => { localOpen.value = false; };
 *     return () => html`
 *       <div style="display: ${localOpen.value ? 'block' : 'none'}">
 *         <h2>${props.title}</h2>
 *         <button onclick="${close}">Close</button>
 *         ${children}
 *       </div>
 *     `;
 *   },
 *   mounted() {
 *     console.log('Component mounted');
 *   },
 *   destroyed() {
 *     console.log('Component destroyed');
 *   }
 * });
 *
 * // Use the component:
 * const view = Dialog({ open: true, title: 'Hello' }, html`<p>Content</p>`);
 * render(view, container);
 * ```
 *
 * @param {{ props?: string[], setup: Function, created?: Function,
 *   mounted?: Function, destroyed?: Function }} definition
 * @returns {Function} Component factory: (initialProps?, children?) => ComponentInstance
 */
export function defineComponent(definition) {
  const { props: propNames = [], setup, created, mounted, destroyed } = definition;

  /**
   * Component factory function.
   *
   * @param {Object} [initialProps={}]  Initial prop values.
   * @param {TemplateResult|string} [children]  Slot content (children).
   * @returns {{ template: TemplateResult, destroy: Function, update: Function, on: Function }}
   */
  function component(initialProps = {}, children = null) {
    const componentContext = createProvideContext(getCurrentProvideContext());
    const propSignals = {};
    const eventHandlers = new Map();

    for (const name of propNames) {
      propSignals[name] = signal(initialProps[name]);
    }

    const emit = (eventName, ...args) => {
      const handlers = eventHandlers.get(eventName) || [];
      handlers.forEach(handler => handler(...args));
    };

    let fragment;
    let instance;
    let rootNodes;
    try {
      const renderFn = runWithProvideContext(
        componentContext,
        () => setup(propSignals, children, emit),
      );
      const template = runWithProvideContext(
        componentContext,
        () => typeof renderFn === 'function' ? renderFn() : renderFn,
      );

      fragment = document.createDocumentFragment();
      instance = runWithProvideContext(
        componentContext,
        () => render(template, fragment),
      );
      rootNodes = [ ...fragment.childNodes ];
    } catch (error) {
      disposeProvideContext(componentContext);
      throw error;
    }

    let mountedCalled = false;
    let disposed = false;
    let destroyedCalled = false;
    let stopWatchingMount = null;
    let stopWatchingRemoval = null;

    const disconnectMountObserver = () => {
      stopWatchingMount?.();
      stopWatchingMount = null;
      stopWatchingRemoval?.();
      stopWatchingRemoval = null;
    };

    const runDestroyedHook = () => {
      if (destroyedCalled) {return;}
      destroyedCalled = true;
      const result = runWithProvideContext(componentContext, () => destroyed?.());
      if (result && typeof result.then === 'function') {
        result.catch(error => reportLifecycleError(error, 'component-destroyed'));
      }
    };

    const dispose = () => {
      if (disposed) {return;}
      disposed = true;
      disconnectMountObserver();

      let firstError;
      try {
        instance.destroy();
      } catch (error) {
        firstError = error;
      }
      try {
        runDestroyedHook();
      } catch (error) {
        if (!firstError) {firstError = error;}
      }
      eventHandlers.clear();
      disposeProvideContext(componentContext);
      if (firstError) {throw firstError;}
    };

    const abortInitialization = error => {
      try {
        dispose();
      } catch {
        // Preserve the original initialization error.
      }
      throw error;
    };

    const checkMounted = records => {
      if (mountedCalled || disposed) {return;}
      const connected = rootNodes.some(node => node.isConnected);
      if (!connected) {
        const wasInserted = records?.some(
          record => [ ...record.addedNodes ].some(added =>
            rootNodes.some(root => added === root || added.contains?.(root)),
          ),
        );
        if (wasInserted) {dispose();}
        return;
      }

      mountedCalled = true;
      disconnectMountObserver();
      try {
        stopWatchingRemoval = watchForRemoval(rootNodes, dispose);
        const result = runWithProvideContext(componentContext, () => mounted?.());
        if (result && typeof result.then === 'function') {
          result.catch(error => {
            if (disposed) {return;}
            try {
              dispose();
            } catch {
              // Preserve the original async hook error.
            }
            reportLifecycleError(error, 'component-mounted');
          });
        }
      } catch (error) {
        abortInitialization(error);
      }
    };

    try {
      const createdResult = runWithProvideContext(componentContext, () => created?.());
      if (createdResult && typeof createdResult.then === 'function') {
        createdResult.catch(error => {
          if (disposed) {return;}
          try {
            dispose();
          } catch {
            // Preserve the original async hook error.
          }
          reportLifecycleError(error, 'component-created');
        });
      }
      stopWatchingMount = watchForMount(checkMounted);
      checkMounted();
    } catch (error) {
      abortInitialization(error);
    }

    return {
      get element() { return fragment; },

      _instance: instance,

      on(eventName, handler) {
        if (disposed) {return () => {};}
        const handlers = eventHandlers.get(eventName) || [];
        handlers.push(handler);
        eventHandlers.set(eventName, handlers);
        return () => {
          const currentHandlers = eventHandlers.get(eventName) || [];
          eventHandlers.set(eventName, currentHandlers.filter(h => h !== handler));
        };
      },

      destroy() {
        dispose();
      },

      update(newProps) {
        if (disposed || !newProps || typeof newProps !== 'object') {return;}
        for (const name of propNames) {
          if (name in newProps && propSignals[name]) {
            propSignals[name].value = newProps[name];
          }
        }
      },
    };
  }

  component._isKupolaComponent = true;
  component._propNames = propNames;

  return component;
}

// ─── Component Registry ──────────────────────────────────────────────────────

/** @type {Map<string, Function>} Global component registry. */
const registry = new Map();

/**
 * Register a component factory globally.
 *
 * ```js
 * import { register } from '@kupola/core';
 * register('Dialog', Dialog);
 * ```
 *
 * @param {string} name  Component name (PascalCase recommended).
 * @param {Function} componentFactory  Result of defineComponent().
 */
export function register(name, componentFactory) {
  registry.set(name, componentFactory);
}

/**
 * Retrieve a registered component factory by name.
 *
 * @param {string} name
 * @returns {Function|undefined}
 */
export function getComponent(name) {
  return registry.get(name);
}

/**
 * Check if a component name is registered.
 *
 * @param {string} name
 * @returns {boolean}
 */
export function hasComponent(name) {
  return registry.has(name);
}

/**
 * Clear the component registry (mainly for testing).
 */
export function clearRegistry() {
  registry.clear();
}
