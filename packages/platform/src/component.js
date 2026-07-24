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

import { signal } from '@kupola/core';
import { render } from './render.js';
import { TemplateResult } from './template.js';

/** @type {Map<string, unknown>} Global provide/inject registry. */
const provideRegistry = new Map();

export function provide(key, value) {
  provideRegistry.set(key, value);
}

export function inject(key, defaultValue = undefined) {
  return provideRegistry.has(key) ? provideRegistry.get(key) : defaultValue;
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
 * @param {{ props?: string[], setup: Function, created?: Function, mounted?: Function, destroyed?: Function }} definition
 * @returns {Function} Component factory: (initialProps?, children?) => TemplateResult
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
    const propSignals = {};
    const eventHandlers = new Map();

    for (const name of propNames) {
      propSignals[name] = signal(initialProps[name]);
    }

    const emit = (eventName, ...args) => {
      const handlers = eventHandlers.get(eventName) || [];
      handlers.forEach(handler => handler(...args));
    };

    const renderFn = setup(propSignals, children, emit);

    const template = renderFn();

    const fragment = document.createDocumentFragment();
    const instance = render(template, fragment);

    let mountedCalled = false;
    const checkMounted = () => {
      if (mountedCalled) {return;}
      let node = fragment.firstChild;
      while (node) {
        if (node.isConnected) {
          mountedCalled = true;
          mounted?.();
          observer.disconnect();
          break;
        }
        node = node.nextSibling;
      }
    };

    const observer = new MutationObserver(() => {
      checkMounted();
    });
    observer.observe(document, { childList: true, subtree: true });

    checkMounted();

    if (created) {
      created();
    }

    return {
      get element() { return fragment; },

      _instance: instance,

      on(eventName, handler) {
        const handlers = eventHandlers.get(eventName) || [];
        handlers.push(handler);
        eventHandlers.set(eventName, handlers);
        return () => {
          const currentHandlers = eventHandlers.get(eventName) || [];
          eventHandlers.set(eventName, currentHandlers.filter(h => h !== handler));
        };
      },

      destroy() {
        observer.disconnect();
        instance.destroy();
        destroyed?.();
      },

      update(newProps) {
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
