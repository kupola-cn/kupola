// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Template renderer: parses html`` templates into DOM
 * and establishes fine-grained reactive bindings via per-Part effects.
 *
 * @module render
 */

import { effect, getErrorHandler, runWithScheduler } from '@kupola/core';
import { HtmlString } from './template.js';
import { walk } from './directives.js';
import {
  createProvideContext,
  disposeProvideContext,
  getCurrentProvideContext,
  provideInContext,
  runWithProvideContext,
} from './context.js';
// ─── Utilities ───────────────────────────────────────────────────────────────

/** Minimal HTML entity escaping for text content. */
export function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Check if a value is a reactive signal-like (has a .value getter). */
export function isSignalLike(v) {
  if (v == null || typeof v !== 'object') {return false;}
  // Check own property first, then prototype chain
  const own = Object.getOwnPropertyDescriptor(v, 'value');
  if (own && typeof own.get === 'function') {return true;}
  const proto = Object.getPrototypeOf(v);
  if (proto) {
    const protoDesc = Object.getOwnPropertyDescriptor(proto, 'value');
    if (protoDesc && typeof protoDesc.get === 'function') {return true;}
  }
  return false;
}

/** Check if a value is a TemplateResult, including results from another bundle entry. */
export function isTemplateResultLike(v) {
  return !!(
    v &&
    typeof v === 'object' &&
    Array.isArray(v.strings) &&
    Array.isArray(v.values)
  );
}

/** Check if a value is an HtmlString (raw HTML that should not be escaped). */
export function isHtmlString(v) {
  return v instanceof HtmlString;
}

// ─── Marker ──────────────────────────────────────────────────────────────────

/** Unique marker prefix — extremely unlikely in real HTML. */
const M = '\u0EBF';
const marker = (i) => `${M}${i}${M}`;

// ─── HTML Serialization ──────────────────────────────────────────────────────

/**
 * Interleave template strings with markers to produce a single HTML string.
 * Static/primitive values are inlined; dynamic values become markers.
 *
 * @param {TemplateResult} tpl
 * @returns {string}
 */
function serialize(tpl) {
  const parts = [];
  for (let i = 0; i < tpl.strings.length; i++) {
    parts.push(tpl.strings[i]);
    if (i < tpl.values.length) {
      const v = tpl.values[i];
      if (isTemplateResultLike(v)
        || (Array.isArray(v) && v.length > 0 && isTemplateResultLike(v[0]))) {
        // Keep nested templates behind the parent value marker so their
        // reactive parts are owned by a TemplateInstance instead of being
        // flattened into the parent's HTML string.
        parts.push(marker(i));
      } else if (typeof v === 'function') {
        parts.push(marker(i));
      } else if (isSignalLike(v)) {
        parts.push(marker(i));
      } else if (isHtmlString(v)) {
        parts.push(v.content);
      } else if (v == null || v === false) {
        const valueMarker = marker(i);
        const position = classifyPosition(`${parts.join('')}${valueMarker}`, valueMarker);
        // Inlining `false` would create a truthy HTML boolean attribute.
        parts.push(position.type === 'text' ? escapeHtml(v ?? '') : valueMarker);
      } else {
        parts.push(escapeHtml(v ?? ''));
      }
    }
  }
  return parts.join('');
}

// ─── Value Classification ────────────────────────────────────────────────────

/**
 * Determine whether a marker sits inside an event attribute (on*),
 * a regular attribute, or text content.
 *
 * @param {string} htmlStr  The full HTML string.
 * @param {string} m        The marker to locate.
 * @returns {{ type: 'event'|'attr'|'text', attrName?: string }}
 */
function classifyPosition(htmlStr, m) {
  const idx = htmlStr.indexOf(m);
  if (idx === -1) {return { type: 'text' };}

  // Find the nearest '<' before the marker
  const before = htmlStr.substring(0, idx);
  const lastOpen = before.lastIndexOf('<');
  if (lastOpen === -1) {return { type: 'text' };}

  // If there's a '>' between '<' and the marker, the marker is in text content
  const between = htmlStr.substring(lastOpen, idx);
  if (between.includes('>')) {return { type: 'text' };}

  // Marker is inside a tag — find the attribute name
  // Look backwards from marker for `attrName=`
  const tagStart = htmlStr.substring(lastOpen + 1, idx);
  const attrMatch = tagStart.match(/([\w\-@:.]+)\s*=\s*(?:"[^"]*|'[^']*|[^\s>]*?)$/);
  if (!attrMatch) {return { type: 'text' };}

  const attrName = attrMatch[1];
  if (attrName.startsWith('on') && attrName.length > 2) {
    return { type: 'event', attrName };
  }
  return { type: 'attr', attrName };
}

// ─── DOM Parsing ──────────────────────────────────────────────────────────────

/**
 * Parse an HTML string into a DocumentFragment using <template>.
 * @param {string} htmlStr
 * @returns {DocumentFragment}
 */
function parseHTML(htmlStr) {
  const tpl = document.createElement('template');
  tpl.innerHTML = htmlStr;
  return tpl.content;
}

function createMountedTemplate(tpl) {
  const htmlStr = serialize(tpl);
  const fragment = parseHTML(htmlStr);
  const instance = new TemplateInstance();
  instance.fragment = fragment;
  try {
    _processNode(fragment, tpl.values, htmlStr, instance);
    for (const part of instance.parts) {
      part.mount();
    }
  } catch (error) {
    try {
      instance.destroy();
    } catch {
      // Preserve the original template mount error.
    }
    throw error;
  }
  return { fragment, instance };
}

function destroyTemplateInstances(instances) {
  let firstError;
  for (const instance of instances) {
    try {
      instance.destroy();
    } catch (error) {
      if (!firstError) {firstError = error;}
    }
  }
  if (firstError) {throw firstError;}
}

// ─── Part Classes ────────────────────────────────────────────────────────────

/**
 * TextPart — manages a reactive text node.
 */
export class TextPart {
  /**
   * @param {Node} container  Parent node that will hold the text node.
   * @param {any} rawValue    Original template value (Signal, primitive, etc.)
   */
  constructor(container, rawValue) {
    this.container = container;
    this.rawValue = rawValue;
    /** @type {Text|null} */
    this.node = null;
    this._dispose = null;
    this._fragmentNodes = [];
    this._childInstances = [];
    this._anchor = null;
    this._provideContext = getCurrentProvideContext();
  }

  /** Create the initial DOM and bind the reactive effect. */
  mount() {
    const placeholder = this._anchor || document.createTextNode('');
    if (!this._anchor) {
      this.container.appendChild(placeholder);
    }
    this.node = placeholder;

    if (isSignalLike(this.rawValue)) {
      const raw = this.rawValue;
      this._dispose = effect(() => {
        runWithProvideContext(this._provideContext, () => this._setValue(raw.value));
      });
    } else if (typeof this.rawValue === 'function') {
      const fn = this.rawValue;
      this._dispose = effect(() => {
        runWithProvideContext(this._provideContext, () => this._setValue(fn()));
      });
    } else {
      this._setValue(this.rawValue);
    }
  }

  _setValue(value) {
    if (isTemplateResultLike(value)) {
      this._setTemplate(value);
    } else if (Array.isArray(value) && value.length > 0
      && value.every(isTemplateResultLike)) {
      this._setTemplates(value);
    } else if (isHtmlString(value)) {
      this._setHtml(value.content);
    } else {
      this._setText(value);
    }
  }

  _setText(value) {
    this._clearDynamicContent();
    if (this.node) {
      this.node.textContent = value != null ? String(value) : '';
    }
  }

  _setHtml(content) {
    this._replaceDynamicFragment(parseHTML(content));
  }

  _setTemplate(tpl) {
    this._setTemplates([ tpl ]);
  }

  _setTemplates(templates) {
    const fragments = [];
    const instances = [];
    try {
      for (const tpl of templates) {
        const mounted = createMountedTemplate(tpl);
        fragments.push(mounted.fragment);
        instances.push(mounted.instance);
      }

      const fragment = document.createDocumentFragment();
      for (const childFragment of fragments) {
        fragment.appendChild(childFragment);
      }

      const inserted = this._replaceDynamicFragment(fragment, instances);
      if (!inserted) {
        destroyTemplateInstances(instances);
      }
    } catch (error) {
      try {
        destroyTemplateInstances(instances);
      } catch {
        // Preserve the original template replacement error.
      }
      throw error;
    }
  }

  _replaceDynamicFragment(fragment, instance = null) {
    this._clearDynamicContent();
    if (!this.node?.parentNode) {return false;}
    this.node.textContent = '';
    const nodes = [ ...fragment.childNodes ];
    this.node.parentNode.insertBefore(fragment, this.node);
    this._fragmentNodes = nodes;
    if (instance) {
      if (Array.isArray(instance)) {
        this._childInstances.push(...instance);
      } else {
        this._childInstances.push(instance);
      }
    }
    return true;
  }

  _clearDynamicContent() {
    let firstError;
    for (const instance of [ ...this._childInstances ]) {
      try {
        instance.destroy();
      } catch (error) {
        if (!firstError) {firstError = error;}
      }
    }
    this._childInstances.length = 0;
    for (const node of [ ...this._fragmentNodes ]) {
      try {
        node.remove();
      } catch (error) {
        if (!firstError) {firstError = error;}
      }
    }
    this._fragmentNodes.length = 0;
    if (firstError) {throw firstError;}
  }

  destroy() {
    let firstError;
    try {
      this._dispose?.();
    } catch (error) {
      firstError = error;
    } finally {
      this._dispose = null;
    }
    try {
      this._clearDynamicContent();
    } catch (error) {
      if (!firstError) {firstError = error;}
    }
    try {
      this.node?.remove();
    } catch (error) {
      if (!firstError) {firstError = error;}
    }
    if (firstError) {throw firstError;}
  }
}

/**
 * AttrPart — manages a reactive element attribute.
 */
export class AttrPart {
  /**
   * @param {Element} element
   * @param {string} attrName
   * @param {any} rawValue
   */
  constructor(element, attrName, rawValue) {
    this.element = element;
    this.attrName = attrName;
    this.rawValue = rawValue;
    this._dispose = null;
    this._provideContext = getCurrentProvideContext();
  }

  mount() {
    if (isSignalLike(this.rawValue)) {
      const raw = this.rawValue;
      this._dispose = effect(() => {
        runWithProvideContext(this._provideContext, () => {
          const v = raw.value;
          if (v == null || v === false) {
            this.element.removeAttribute(this.attrName);
          } else {
            this.element.setAttribute(this.attrName, String(v));
          }
        });
      });
    } else if (typeof this.rawValue === 'function') {
      const fn = this.rawValue;
      this._dispose = effect(() => {
        runWithProvideContext(this._provideContext, () => {
          const v = fn();
          if (v == null || v === false) {
            this.element.removeAttribute(this.attrName);
          } else {
            this.element.setAttribute(this.attrName, String(v));
          }
        });
      });
    } else {
      if (this.rawValue == null || this.rawValue === false) {
        this.element.removeAttribute(this.attrName);
      } else {
        this.element.setAttribute(this.attrName, String(this.rawValue));
      }
    }
  }

  destroy() {
    this._dispose?.();
  }
}

/**
 * EventPart — manages an event listener bound via on* attribute.
 */
export class EventPart {
  /**
   * @param {Element} element
   * @param {string} attrName  e.g. "onclick"
   * @param {Function} handler
   */
  constructor(element, attrName, handler) {
    this.element = element;
    this.eventName = attrName.slice(2).toLowerCase(); // onclick → click
    this.handler = handler;
    this._bound = null;
    this._provideContext = getCurrentProvideContext();
  }

  mount() {
    if (typeof this.handler === 'function') {
      this._bound = e => runWithProvideContext(
        this._provideContext,
        () => this.handler(e),
      );
      this.element.addEventListener(this.eventName, this._bound);
    }
  }

  destroy() {
    if (this._bound) {
      this.element.removeEventListener(this.eventName, this._bound);
      this._bound = null;
    }
  }
}

let iconResolver = null;

function getIconResolver() {
  return iconResolver;
}

export function setIconResolver(resolver) {
  if (resolver !== null && typeof resolver !== 'function') {
    throw new TypeError('[kupola] setIconResolver() expects a function or null.');
  }
  iconResolver = resolver;
}

function reportIconError(error) {
  const handler = getErrorHandler();
  const context = { source: 'platform', phase: 'icon' };
  if (handler) {
    try {
      handler(error, context);
      return;
    } catch (handlerError) {
      if (typeof console !== 'undefined' && typeof console.error === 'function') {
        console.error('[kupola] Icon error handler failed.', handlerError);
      }
      return;
    }
  }
  if (typeof console !== 'undefined' && typeof console.error === 'function') {
    console.error('[kupola] Icon resolver failed.', error);
  }
}

export function mount(tpl, container, options = {}) {
  const root = typeof container === 'string' ? document.querySelector(container) : container;
  if (!root) {
    throw new Error('[kupola] mount() container not found');
  }

  const scheduler = options?.scheduler;
  const walkOptions = {
    scheduler,
    sanitizer: options?.sanitizer,
    customDirectives: options?.customDirectives,
  };
  const existingNodes = new Set(root.childNodes);
  const instance = render(tpl, root, { scheduler });
  const ownedNodes = [ ...root.childNodes ].filter(node => !existingNodes.has(node));
  const removeOwnedNodes = () => {
    for (const node of ownedNodes) {
      if (node.parentNode === root) {node.remove();}
    }
  };
  let walkInstance;
  try {
    walkInstance = walk(root, walkOptions);
  } catch (error) {
    try {
      instance.destroy();
    } catch {
      // Preserve the original walk initialization error.
    } finally {
      removeOwnedNodes();
    }
    throw error;
  }

  const destroyRender = instance.destroy.bind(instance);
  let destroyed = false;
  instance.destroy = () => {
    if (destroyed) {return;}
    destroyed = true;
    let firstError;
    try {
      walkInstance.destroy();
    } catch (error) {
      firstError = error;
    }
    try {
      destroyRender();
    } catch (error) {
      if (!firstError) {firstError = error;}
    } finally {
      removeOwnedNodes();
    }
    if (firstError) {throw firstError;}
  };

  return instance;
}

export function createApp(tpl, options = {}) {
  const plugins = [];
  let mountedInstance = null;
  let activePlugins = [];
  let mounting = false;
  let destroying = false;
  let destroyingPromise = null;
  const scheduler = options?.scheduler;
  const appProvidedValues = new Map();
  let appContext = createProvideContext();
  const resetAppContext = (clearProvidedValues = false) => {
    disposeProvideContext(appContext);
    appContext = createProvideContext();
    if (clearProvidedValues) {appProvidedValues.clear();}
    for (const [ key, value ] of appProvidedValues) {
      provideInContext(appContext, key, value);
    }
  };
  const withAppContext = fn => runWithProvideContext(appContext, fn);
  const withAppScheduler = fn => scheduler === undefined
    ? withAppContext(fn)
    : runWithScheduler(scheduler, () => withAppContext(fn));
  const runAppHook = hook => withAppScheduler(hook);
  const asyncPluginHook = Symbol('kupolaAsyncPluginHook');
  const runSyncPluginHook = (plugin, hookName, asyncMethod) => {
    const result = plugin[hookName]();
    if (result == null || (typeof result !== 'object' && typeof result !== 'function')
      || typeof result.then !== 'function') {
      return;
    }
    // The synchronous API cannot await this work. Handle a later rejection so
    // the caller gets one actionable error instead of an unhandled rejection.
    Promise.resolve(result).catch(() => {});
    const error = new Error(
      `[kupola] Plugin ${hookName}() returned a Promise; use ${asyncMethod}() instead.`,
    );
    error[asyncPluginHook] = true;
    throw error;
  };

  const destroyPlugins = installedPlugins => {
    let firstError;
    for (const plugin of [ ...installedPlugins ].reverse()) {
      if (typeof plugin.destroy !== 'function') {continue;}
      try {
        runSyncPluginHook(plugin, 'destroy', 'destroyAsync');
      } catch (error) {
        if (!firstError) {firstError = error;}
      }
    }
    if (firstError) {throw firstError;}
  };

  const destroyPluginsAsync = async installedPlugins => {
    let firstError;
    for (const plugin of [ ...installedPlugins ].reverse()) {
      if (typeof plugin.destroy !== 'function') {continue;}
      try {
        await runAppHook(() => plugin.destroy());
      } catch (error) {
        if (!firstError) {firstError = error;}
      }
    }
    if (firstError) {throw firstError;}
  };

  return {
    use(plugin) {
      if (mountedInstance) {
        throw new Error('[kupola] Cannot add plugins after app mount.');
      }
      if (mounting || destroying) {
        throw new Error('[kupola] Cannot add plugins while an app lifecycle transition is pending.');
      }
      if (typeof plugin === 'function') {
        plugins.push({ install: plugin });
      } else if (plugin && typeof plugin.install === 'function') {
        plugins.push(plugin);
      }
      return this;
    },

    provide(key, value) {
      appProvidedValues.set(key, value);
      provideInContext(appContext, key, value);
      return this;
    },

    mount(container) {
      return withAppScheduler(() => {
        if (mounting) {
          throw new Error('[kupola] Cannot mount while an async app mount is pending.');
        }
        if (destroying) {
          throw new Error('[kupola] Cannot mount while async app cleanup is pending.');
        }
        if (mountedInstance) {
          throw new Error('[kupola] Cannot mount an app more than once. Call destroy() first.');
        }

        const installedPlugins = [];
        let instance = null;
        try {
          for (const plugin of plugins) {
            try {
              runSyncPluginHook(plugin, 'install', 'mountAsync');
              installedPlugins.push(plugin);
            } catch (error) {
              if (error?.[asyncPluginHook]) {installedPlugins.push(plugin);}
              throw error;
            }
          }

          instance = mount(tpl, container, options);
          mountedInstance = instance;
          activePlugins = installedPlugins;

          for (const plugin of installedPlugins) {
            if (typeof plugin.init === 'function') {
              runSyncPluginHook(plugin, 'init', 'mountAsync');
            }
          }

          return instance;
        } catch (error) {
          mountedInstance = null;
          activePlugins = [];
          try {
            instance?.destroy();
          } catch {
            // Preserve the original mount or plugin error.
          }
          try {
            destroyPlugins(installedPlugins);
          } catch {
            // Preserve the original mount or plugin error.
          }
          resetAppContext();
          throw error;
        }
      });
    },

    mountAsync(container) {
      if (mounting) {
        return Promise.reject(new Error('[kupola] Cannot mount while an async app mount is pending.'));
      }
      if (destroying) {
        return Promise.reject(new Error('[kupola] Cannot mount while async app cleanup is pending.'));
      }
      if (mountedInstance) {
        return Promise.reject(new Error('[kupola] Cannot mount an app more than once. Call destroy() first.'));
      }

      mounting = true;
      const installedPlugins = [];
      let instance = null;
      const operation = (async () => {
        try {
          for (const plugin of plugins) {
            await runAppHook(() => plugin.install());
            installedPlugins.push(plugin);
          }

          instance = runAppHook(() => mount(tpl, container, options));
          mountedInstance = instance;
          activePlugins = installedPlugins;

          for (const plugin of installedPlugins) {
            if (typeof plugin.init === 'function') {
              await runAppHook(() => plugin.init());
            }
          }

          return instance;
        } catch (error) {
          mountedInstance = null;
          activePlugins = [];
          try {
            if (instance) {runAppHook(() => instance.destroy());}
          } catch {
            // Preserve the original mount or plugin error.
          }
          try {
            await runAppHook(() => destroyPluginsAsync(installedPlugins));
          } catch {
            // Preserve the original mount or plugin error.
          }
          runAppHook(() => resetAppContext());
          throw error;
        } finally {
          mounting = false;
        }
      })();

      return operation;
    },

    destroyAsync() {
      if (mounting) {
        return Promise.reject(new Error('[kupola] Cannot destroy while an async app mount is pending.'));
      }
      if (destroying) {
        return destroyingPromise;
      }

      const instance = mountedInstance;
      const installedPlugins = activePlugins;
      mountedInstance = null;
      activePlugins = [];
      destroying = true;

      const operation = (async () => {
        let firstError;
        try {
          if (instance) {runAppHook(() => instance.destroy());}
        } catch (error) {
          firstError = error;
        }

        try {
          await destroyPluginsAsync(installedPlugins);
        } catch (error) {
          if (!firstError) {firstError = error;}
        } finally {
          try {
            runAppHook(() => resetAppContext(true));
          } catch (error) {
            if (!firstError) {firstError = error;}
          }
          destroying = false;
          destroyingPromise = null;
        }
        if (firstError) {throw firstError;}
      })();
      destroyingPromise = operation;
      return operation;
    },

    destroy() {
      if (mounting) {
        throw new Error('[kupola] Cannot destroy while an async app mount is pending.');
      }
      if (destroying) {
        throw new Error('[kupola] Cannot destroy while async app cleanup is pending.');
      }
      withAppScheduler(() => {
        const instance = mountedInstance;
        const installedPlugins = activePlugins;
        mountedInstance = null;
        activePlugins = [];

        let firstError;
        try {
          instance?.destroy();
        } catch (error) {
          firstError = error;
        }

        try {
          destroyPlugins(installedPlugins);
        } catch (error) {
          if (!firstError) {firstError = error;}
        }

        resetAppContext(true);

        if (firstError) {throw firstError;}
      });
    },
  };
}

/**
 * IconPart — manages an <icon> element with dynamic name/size.
 */
export class IconPart {
  /**
   * @param {Element} element
   * @param {any} nameValue    Icon name (string or signal)
   * @param {any} sizeValue    Icon size (number or signal)
   */
  constructor(element, nameValue, sizeValue) {
    this.element = element;
    this.nameValue = nameValue;
    this.sizeValue = sizeValue;
    this._dispose = null;
    this._activeRequest = null;
    this._isDestroyed = false;
    this._provideContext = getCurrentProvideContext();
  }

  mount() {
    const resolveIcon = getIconResolver();

    const renderIcon = async () => {
      if (this._isDestroyed) {return;}

      let requestId = null;
      try {
        const name = isSignalLike(this.nameValue) ? this.nameValue.value : this.nameValue;
        const size = isSignalLike(this.sizeValue) ? this.sizeValue.value : this.sizeValue;

        if (!name || !resolveIcon) {
          this._activeRequest = null;
          this.element.innerHTML = '';
          return;
        }

        requestId = Symbol();
        this._activeRequest = requestId;
        this.element.innerHTML = '';
        const svgContent = await resolveIcon(name, size);
        if (this._activeRequest === requestId && !this._isDestroyed) {
          this.element.innerHTML = svgContent || '';
        }
      } catch (error) {
        if (!this._isDestroyed && (requestId === null || this._activeRequest === requestId)) {
          this.element.innerHTML = '';
          reportIconError(error);
        }
      } finally {
        if (this._activeRequest === requestId) {
          this._activeRequest = null;
        }
      }
    };

    if (isSignalLike(this.nameValue) || isSignalLike(this.sizeValue)) {
      this._dispose = effect(() => {
        runWithProvideContext(this._provideContext, renderIcon);
      });
    } else {
      runWithProvideContext(this._provideContext, renderIcon);
    }
  }

  destroy() {
    if (this._isDestroyed) {return;}
    this._isDestroyed = true;
    this._activeRequest = null;
    this._dispose?.();
    this._dispose = null;
  }
}

// ─── TemplateInstance ────────────────────────────────────────────────────────

/**
 * Manages all Parts created from a single template render.
 */
export class TemplateInstance {
  constructor() {
    /** @type {(TextPart|AttrPart|EventPart)[]} */
    this.parts = [];
    /** @type {DocumentFragment|null} */
    this.fragment = null;
  }

  /** Remove all reactive effects and event listeners. */
  destroy() {
    let firstError;
    for (const part of this.parts) {
      try {
        part.destroy();
      } catch (error) {
        if (!firstError) {firstError = error;}
      }
    }
    this.parts.length = 0;
    if (firstError) {throw firstError;}
  }
}

// ─── render() ────────────────────────────────────────────────────────────────

/**
 * Render a template into a DOM container with reactive bindings.
 *
 * ```js
 * const count = signal(0);
 * const tpl = html`<button onclick="${() => count.value++}">${count}</button>`;
 * const view = render(tpl, document.getElementById('app'));
 * // Later:
 * view.destroy();
 * ```
 *
 * @param {TemplateResult} tpl       Result of html``
 * @param {Element}        container DOM element to render into
 * @returns {TemplateInstance}       Call `.destroy()` to clean up
 */
function renderTemplate(tpl, container) {
  const { fragment, instance } = createMountedTemplate(tpl);

  try {
    container.appendChild(fragment);
  } catch (error) {
    try {
      instance.destroy();
    } catch {
      // Preserve the original container append error.
    }
    throw error;
  }

  return instance;
}

/**
 * Render with an optional app-local scheduler. Without the option, preserve
 * the legacy global scheduler behavior.
 */
export function render(tpl, container, options = {}) {
  if (options && options.scheduler !== undefined) {
    return runWithScheduler(options.scheduler, () => renderTemplate(tpl, container));
  }
  return renderTemplate(tpl, container);
}

/**
 * Recursively walk DOM nodes, finding markers and creating Parts.
 *
 * @param {Node}              node
 * @param {any[]}             values   Original template values
 * @param {string}            htmlStr  Full HTML string (for classification)
 * @param {TemplateInstance}  instance
 */
function _processNode(node, values, htmlStr, instance) {
  // Process child nodes (snapshot first — we mutate the list)
  const children = [ ...node.childNodes ];
  for (const child of children) {
    if (child.nodeType === 3 /* TEXT_NODE */) {
      _processTextNode(child, values, htmlStr, instance, node);
    } else if (child.nodeType === 1 /* ELEMENT_NODE */) {
      _processElement(child, values, htmlStr, instance);
    }
  }
}

/**
 * Check a text node for markers. If found, replace with a TextPart.
 */
function _processTextNode(textNode, values, htmlStr, instance, parent) {
  const text = textNode.textContent || '';
  for (let i = 0; i < values.length; i++) {
    const m = marker(i);
    const idx = text.indexOf(m);
    if (idx === -1) {continue;}

    // Only create a Part if this marker is for TEXT content
    // (attribute markers are handled in _processElement)
    const cls = classifyPosition(htmlStr, m);
    if (cls.type !== 'text') {continue;}

    const before = text.substring(0, idx);
    const after = text.substring(idx + m.length);

    // Insert "before" text node (if any)
    if (before) {
      parent.insertBefore(document.createTextNode(before), textNode);
    }

    const anchor = document.createTextNode('');
    parent.insertBefore(anchor, textNode);

    // Create TextPart
    const part = new TextPart(parent, values[i]);
    instance.parts.push(part);

    // Insert "after" text node (if any) — may contain more markers
    let afterNode = textNode;
    if (after) {
      afterNode = document.createTextNode(after);
      parent.insertBefore(afterNode, textNode);
    }

    // Remove original marker text node
    parent.removeChild(textNode);

    // The TextPart will create its own text node during mount().
    // We need to tell it where to insert (before afterNode, or at end).
    part._anchor = anchor;

    // Recursively check the "after" text for more markers
    if (after) {
      _processTextNode(afterNode, values, htmlStr, instance, parent);
    }
    return; // Only handle one marker per call; recursion handles the rest
  }
}

/**
 * Check an element's attributes for markers.
 */
function _processElement(element, values, htmlStr, instance) {
  if (element.tagName.toLowerCase() === 'icon') {
    const nameAttr = element.getAttribute('name');
    const sizeAttr = element.getAttribute('size');

    let nameValue = nameAttr;
    let sizeValue = sizeAttr ? parseInt(sizeAttr, 10) : 16;

    for (let i = 0; i < values.length; i++) {
      const m = marker(i);
      if (nameAttr && nameAttr.includes(m)) {
        nameValue = values[i];
        element.removeAttribute('name');
      }
      if (sizeAttr && sizeAttr.includes(m)) {
        sizeValue = values[i];
        element.removeAttribute('size');
      }
    }

    const part = new IconPart(element, nameValue, sizeValue);
    instance.parts.push(part);
    return;
  }

  const attrs = [ ...element.attributes ];
  for (const attr of attrs) {
    for (let i = 0; i < values.length; i++) {
      const m = marker(i);
      if (!attr.value.includes(m)) {continue;}

      const cls = classifyPosition(htmlStr, m);

      if (cls.type === 'event' && cls.attrName === attr.name) {
        // Event handler
        element.removeAttribute(attr.name);
        const part = new EventPart(element, attr.name, values[i]);
        instance.parts.push(part);
      } else if (cls.type === 'attr' && cls.attrName === attr.name) {
        // Regular attribute with reactive value
        // Remove the marker from the attribute value
        const cleanVal = attr.value.replace(m, '');
        if (cleanVal) {
          element.setAttribute(attr.name, cleanVal);
        } else {
          element.removeAttribute(attr.name);
        }
        const part = new AttrPart(element, attr.name, values[i]);
        instance.parts.push(part);
      }
      // If classification doesn't match, skip (marker is literal text)
    }
  }

  // Recurse into children
  _processNode(element, values, htmlStr, instance);
}
