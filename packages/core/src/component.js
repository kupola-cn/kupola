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

import { signal } from './signal.js';
import { render } from './render.js';
import { TemplateResult } from './template.js';

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
 *   }
 * });
 *
 * // Use the component:
 * const view = Dialog({ open: true, title: 'Hello' }, html`<p>Content</p>`);
 * render(view, container);
 * ```
 *
 * @param {{ props?: string[], setup: Function }} definition
 * @returns {Function} Component factory: (initialProps?, children?) => TemplateResult
 */
export function defineComponent(definition) {
  const { props: propNames = [], setup } = definition;

  /**
   * Component factory function.
   *
   * @param {Object} [initialProps={}]  Initial prop values.
   * @param {TemplateResult|string} [children]  Slot content (children).
   * @returns {{ template: TemplateResult, destroy: Function, update: Function }}
   */
  function component(initialProps = {}, children = null) {
    // Create reactive prop signals — exposed directly so that templates
    // receive signal objects (which the render system tracks reactively).
    const propSignals = {};

    for (const name of propNames) {
      propSignals[name] = signal(initialProps[name]);
    }

    // Call setup to get the render function.
    // props are signal objects: props.title.value reads the current value.
    const renderFn = setup(propSignals, children);

    // Execute the render function to get the template
    const template = renderFn();

    // Render into a temporary container (DocumentFragment)
    const fragment = document.createDocumentFragment();
    const instance = render(template, fragment);

    return {
      /** The rendered DOM content (DocumentFragment). */
      get element() { return fragment; },

      /** The TemplateInstance (for destroy). */
      _instance: instance,

      /** Destroy the component: clean up all effects and listeners. */
      destroy() {
        instance.destroy();
      },

      /**
       * Update component props.
       * @param {Object} newProps  New prop values to set.
       */
      update(newProps) {
        for (const name of propNames) {
          if (name in newProps && propSignals[name]) {
            propSignals[name].value = newProps[name];
          }
        }
      },
    };
  }

  // Mark as a Kupola component (for identification)
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
