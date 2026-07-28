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

const KUPOLA_COMPONENT_FACTORY = Symbol.for('kupola.component.factory');
const KUPOLA_COMPONENT_INSTANCE = Symbol.for('kupola.component.instance');
const KUPOLA_COMPONENT_NOTIFY_MOUNTED = Symbol.for('kupola.component.notifyMounted');

/** Observer state is isolated per ownerDocument for iframe/micro-frontend use. */
const observerStates = new WeakMap();

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

function stopMountObserverIfUnused(state) {
  if (!state || state.pending.size !== 0 || state.active.size !== 0 || !state.observer) {
    return;
  }
  state.observer.disconnect();
  observerStates.delete(state.document);
}

function ensureMountObserver(ownerDocument) {
  if (!ownerDocument || typeof MutationObserver !== 'function') {return null;}
  const existing = observerStates.get(ownerDocument);
  if (existing) {return existing;}

  const state = {
    document: ownerDocument,
    pending: new Set(),
    active: new Set(),
    observer: null,
  };
  state.observer = new MutationObserver(records => {
    for (const check of [ ...state.pending ]) {
      try {
        check(records);
      } catch (error) {
        reportLifecycleError(error, 'component-mounted');
      }
    }
    const removedNodes = records.flatMap(record => [ ...record.removedNodes ]);
    for (const entry of [ ...state.active ]) {
      const removed = removedNodes.some(removedNode => entry.rootNodes.some(root =>
        removedNode === root || removedNode.contains?.(root),
      ));
      if (removed && entry.rootNodes.length > 0
        && entry.rootNodes.every(node => !node.isConnected)) {
        try {
          entry.destroy();
        } catch (error) {
          reportLifecycleError(error, 'component-destroyed');
        }
      }
    }
    stopMountObserverIfUnused(state);
  });
  state.observer.observe(ownerDocument, { childList: true, subtree: true });
  observerStates.set(ownerDocument, state);
  return state;
}

function watchForMount(check, rootNodes) {
  if (typeof MutationObserver !== 'function') {return () => {};}
  const ownerDocument = rootNodes.find(node => node.ownerDocument)?.ownerDocument;
  const state = ensureMountObserver(ownerDocument);
  if (!state) {return () => {};}
  state.pending.add(check);
  return () => {
    state.pending.delete(check);
    stopMountObserverIfUnused(state);
  };
}

function watchForRemoval(rootNodes, destroy) {
  if (typeof MutationObserver !== 'function' || rootNodes.length === 0) {return () => {};}
  const ownerDocument = rootNodes.find(node => node.ownerDocument)?.ownerDocument;
  const state = ensureMountObserver(ownerDocument);
  if (!state) {return () => {};}
  const entry = { rootNodes, destroy };
  state.active.add(entry);
  try {
    if (!state.observer) {throw new Error('Unable to create component observer.');}
  } catch (error) {
    state.active.delete(entry);
    stopMountObserverIfUnused(state);
    throw error;
  }
  return () => {
    state.active.delete(entry);
    stopMountObserverIfUnused(state);
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
 *   setup({ props, children }) {
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
 * ### Async Hooks
 *
 * Lifecycle hooks (`created`, `mounted`, `destroyed`) support async functions.
 * However, the component will NOT wait for async hooks to complete before rendering.
 * This ensures immediate DOM insertion and prevents blocking the main thread.
 *
 * ```js
 * const DataList = defineComponent({
 *   setup() {
 *     const items = signal([]);
 *     const loading = signal(true);
 *     const error = signal(null);
 *     return { items, loading, error };
 *   },
 *   async mounted() {
 *     try {
 *       items.value = await fetch('/api/items').then(r => r.json());
 *     } catch (e) {
 *       error.value = e.message;
 *     } finally {
 *       loading.value = false;
 *     }
 *   }
 * });
 * ```
 *
 * ### Error Handling
 *
 * Async hook errors are automatically caught and reported. Use `try/catch`
 * within the hook for custom error handling.
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
    let renderFactory = null;
    let rootNodes = [];
    let mountedCalled = false;
    let disposed = false;
    let destroyedCalled = false;
    let stopWatchingMount = null;
    let stopWatchingRemoval = null;
    const mountedCallbacks = new Set();
    const cleanupCallbacks = new Set();
    const lifecycleController = typeof AbortController === 'function'
      ? new AbortController()
      : null;
    const lifecycleContext = {
      props: propSignals,
      get element() {
        return rootNodes.find(node => node.nodeType === 1) || rootNodes[0] || null;
      },
      get elements() {
        return rootNodes.slice();
      },
      signal: lifecycleController?.signal,
      onMounted(callback) {
        if (typeof callback !== 'function') {
          throw new TypeError('[kupola] onMounted() expects a function.');
        }
        if (disposed) {return () => {};}
        if (mountedCalled) {
          callback(lifecycleContext);
          return () => {};
        }
        mountedCallbacks.add(callback);
        return () => mountedCallbacks.delete(callback);
      },
      onCleanup(callback) {
        if (typeof callback !== 'function') {
          throw new TypeError('[kupola] onCleanup() expects a function.');
        }
        if (disposed) {
          callback();
          return () => {};
        }
        cleanupCallbacks.add(callback);
        return () => cleanupCallbacks.delete(callback);
      },
    };
    const setupContext = Object.freeze({
      props: propSignals,
      children,
      emit,
      lifecycle: lifecycleContext,
    });
    try {
      const renderFn = runWithProvideContext(
        componentContext,
        () => setup(setupContext),
      );
      renderFactory = typeof renderFn === 'function' ? renderFn : null;
      const template = runWithProvideContext(
        componentContext,
        () => renderFactory ? renderFactory() : renderFn,
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

    const disconnectMountObserver = () => {
      stopWatchingMount?.();
      stopWatchingMount = null;
      stopWatchingRemoval?.();
      stopWatchingRemoval = null;
    };

    const runDestroyedHook = () => {
      if (destroyedCalled) {return;}
      destroyedCalled = true;
      const result = runWithProvideContext(componentContext, () => destroyed?.(lifecycleContext));
      if (result && typeof result.then === 'function') {
        result.catch(error => reportLifecycleError(error, 'component-destroyed'));
      }
    };

    const dispose = () => {
      if (disposed) {return;}
      disposed = true;
      disconnectMountObserver();
      lifecycleController?.abort();

      let firstError;
      for (const cleanup of [ ...cleanupCallbacks ].reverse()) {
        try {
          cleanup();
        } catch (error) {
          if (!firstError) {firstError = error;}
        }
      }
      cleanupCallbacks.clear();
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
        const result = runWithProvideContext(componentContext, () => mounted?.(lifecycleContext));
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
        for (const callback of [ ...mountedCallbacks ]) {
          runWithProvideContext(componentContext, () => callback(lifecycleContext));
        }
        mountedCallbacks.clear();
      } catch (error) {
        abortInitialization(error);
      }
    };

    const rerenderStructuralTemplate = () => {
      if (!renderFactory || disposed) {return;}
      const nextTemplate = runWithProvideContext(componentContext, () => renderFactory());
      const nextFragment = document.createDocumentFragment();
      const nextInstance = runWithProvideContext(
        componentContext,
        () => render(nextTemplate, nextFragment),
      );
      const nextNodes = [ ...nextFragment.childNodes ];
      const oldNodes = [ ...rootNodes ];
      const parent = oldNodes.find(node => node.parentNode)?.parentNode || null;
      const nextSibling = oldNodes[oldNodes.length - 1]?.nextSibling || null;
      stopWatchingRemoval?.();
      stopWatchingRemoval = null;
      oldNodes.forEach(node => node.remove());
      if (parent) {
        nextNodes.forEach(node => parent.insertBefore(node, nextSibling));
      } else {
        nextNodes.forEach(node => fragment.appendChild(node));
      }
      instance.destroy();
      instance = nextInstance;
      rootNodes = nextNodes;
      if (mountedCalled) {stopWatchingRemoval = watchForRemoval(rootNodes, dispose);}
    };

    try {
      const createdResult = runWithProvideContext(componentContext, () => created?.(lifecycleContext));
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
      stopWatchingMount = watchForMount(checkMounted, rootNodes);
      checkMounted();
    } catch (error) {
      abortInitialization(error);
    }

    return {
      [KUPOLA_COMPONENT_INSTANCE]: true,
      [KUPOLA_COMPONENT_NOTIFY_MOUNTED]() {
        checkMounted();
      },
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
        if (renderFactory) {
          try {
            rerenderStructuralTemplate();
          } catch (error) {
            reportLifecycleError(error, 'component-updated');
          }
        }
      },
    };
  }

  component[KUPOLA_COMPONENT_FACTORY] = true;
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
