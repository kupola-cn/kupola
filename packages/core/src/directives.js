// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Declarative directive system.
 *
 * Provides Alpine.js-like interactivity via HTML attributes:
 *   k-data   — create a reactive scope
 *   k-show   — conditional display
 *   k-text   — reactive textContent
 *   k-html   — reactive innerHTML
 *   k-bind   — dynamic attributes  (shorthand:  :attr)
 *   k-on     — event listeners     (shorthand:  @event)
 *   k-model  — two-way input binding
 *
 * @module directives
 */

import { signal } from './signal.js';
import { effect } from './effect.js';
import { flushJobs } from './scheduler.js';

// ─── Scope ────────────────────────────────────────────────────────────────────

/**
 * Create a reactive scope from a plain data object.
 * Each property becomes a signal; the returned Proxy transparently
 * reads/writes signal values so expressions work naturally.
 *
 * @param {Object} data
 * @returns {Proxy}
 */
function createScope(data) {
  const signals = {};
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      signals[key] = signal(data[key]);
    }
  }
  const keys = Object.keys(signals);
  return new Proxy(
    {},
    {
      get(_, key) {
        if (typeof key === 'symbol') {return undefined;}
        const s = signals[key];
        return s ? s.value : undefined;
      },
      set(_, key, val) {
        const s = signals[key];
        if (s) {
          s.value = val;
        } else {
          signals[key] = signal(val);
          keys.push(key);
        }
        return true;
      },
      has(_, key) {
        return key in signals;
      },
      ownKeys() {
        return keys;
      },
      getOwnPropertyDescriptor(_, key) {
        if (key in signals) {
          return { enumerable: true, configurable: true };
        }
        return undefined;
      },
    },
  );
}

// ─── Expression Evaluation ────────────────────────────────────────────────────

/** Cache compiled expression functions. */
const exprCache = new Map();

/**
 * Evaluate an expression for reading (returns a value).
 * Uses `with(scope)` so variable names resolve through the Proxy.
 *
 * @param {string} expr
 * @param {Proxy} scope
 * @returns {any}
 */
function evaluate(expr, scope) {
  let fn = exprCache.get(expr);
  if (!fn) {
    fn = new Function('__s__', `with(__s__){return(${expr})}`);
    exprCache.set(expr, fn);
  }
  return fn(scope);
}

/**
 * Evaluate a statement for writing (event handlers, k-model).
 * Supports assignments like `count++` or `active = !active`.
 * Uses `with(scope)` so assignments go through the Proxy's set trap.
 *
 * @param {string} expr
 * @param {Proxy} scope
 */
function evaluateStatement(expr, scope) {
  const cacheKey = '$$' + expr;
  let fn = exprCache.get(cacheKey);
  if (!fn) {
    fn = new Function('__s__', `with(__s__){${expr}}`);
    exprCache.set(cacheKey, fn);
  }
  fn(scope);
}

// ─── Directive Handlers ───────────────────────────────────────────────────────

/**
 * Parse directive modifiers from an attribute name.
 * e.g. "k-on:click.stop.prevent" → { base: "k-on", arg: "click", modifiers: ["stop","prevent"] }
 */
function parseDirective(name) {
  // Split off modifiers first (dot-separated at the end)
  const parts = name.split('.');
  const fullName = parts[0];
  const modifiers = parts.slice(1);

  // Split directive:arg (e.g. "k-on:click" or "k-bind:class")
  const colonIdx = fullName.indexOf(':');
  if (colonIdx === -1) {
    return { base: fullName, arg: null, modifiers };
  }
  return {
    base: fullName.substring(0, colonIdx),
    arg: fullName.substring(colonIdx + 1),
    modifiers,
  };
}

/**
 * Apply k-show directive: toggle element display.
 */
function handleShow(el, expr, scope, disposers) {
  const dispose = effect(() => {
    const val = evaluate(expr, scope);
    el.style.display = val ? '' : 'none';
  });
  disposers.push(dispose);
}

/**
 * Apply k-text directive: reactive textContent.
 */
function handleText(el, expr, scope, disposers) {
  const dispose = effect(() => {
    el.textContent = String(evaluate(expr, scope) ?? '');
  });
  disposers.push(dispose);
}

/**
 * Apply k-html directive: reactive innerHTML.
 */
function handleHtml(el, expr, scope, disposers) {
  const dispose = effect(() => {
    el.innerHTML = String(evaluate(expr, scope) ?? '');
  });
  disposers.push(dispose);
}

/**
 * Apply k-bind directive: reactive attribute.
 */
function handleBind(el, expr, attrName, scope, disposers) {
  const dispose = effect(() => {
    const val = evaluate(expr, scope);
    if (val === false || val == null) {
      el.removeAttribute(attrName);
    } else if (val === true) {
      el.setAttribute(attrName, '');
    } else {
      el.setAttribute(attrName, String(val));
    }
  });
  disposers.push(dispose);
}

/**
 * Apply k-on directive: event listener.
 */
function handleOn(el, expr, eventName, modifiers, scope, disposers) {
  const stop = modifiers.includes('stop');
  const prevent = modifiers.includes('prevent');
  const once = modifiers.includes('once');
  const self = modifiers.includes('self');

  const handler = (e) => {
    if (self && e.target !== el) {return;}
    if (stop) {e.stopPropagation();}
    if (prevent) {e.preventDefault();}
    evaluateStatement(expr, scope);
    flushJobs();
  };

  el.addEventListener(eventName, handler, { once });
  disposers.push(() => el.removeEventListener(eventName, handler));
}

/**
 * Apply k-model directive: two-way binding for form inputs.
 */
function handleModel(el, expr, scope, disposers) {
  // Set initial value
  const dispose = effect(() => {
    const val = evaluate(expr, scope);
    el.value = val != null ? String(val) : '';
  });
  disposers.push(dispose);

  // Listen for user input
  const inputHandler = () => {
    // Parse the expression to find the target property
    // For simple cases like "name" or "user.name"
    const parts = expr.trim().split('.');
    if (parts.length === 1) {
      // Simple variable: "name"
      scope[parts[0]] = el.value;
    } else {
      // Nested property: "user.name" — need to set on the parent
      // Evaluate the parent path to get the object, then set the last key
      const parentExpr = parts.slice(0, -1).join('.');
      const key = parts[parts.length - 1];
      try {
        const parent = evaluate(parentExpr, scope);
        if (parent && typeof parent === 'object') {
          parent[key] = el.value;
        }
      } catch (_) {
        // If parent evaluation fails, try as a simple scope property
        scope[expr] = el.value;
      }
    }
    flushJobs();
  };

  el.addEventListener('input', inputHandler);
  disposers.push(() => el.removeEventListener('input', inputHandler));
}

// ─── DOM Walker ───────────────────────────────────────────────────────────────

/**
 * Check if an attribute name is a directive.
 */
function isDirective(name) {
  return (
    name.startsWith('k-') ||
    name.startsWith(':') ||
    name.startsWith('@')
  );
}

/**
 * Normalize a shorthand to its full directive name.
 *   :class="x"  → k-bind:class="x"
 *   @click="x"  → k-on:click="x"
 */
function normalizeDirective(name) {
  if (name.startsWith(':')) {return 'k-bind:' + name.substring(1);}
  if (name.startsWith('@')) {return 'k-on:' + name.substring(1);}
  return name;
}

/**
 * Process a single element's directive attributes.
 */
function processElement(el, scope, disposers) {
  const attrs = [ ...el.attributes ];

  for (const attr of attrs) {
    const name = attr.name;
    const expr = attr.value;

    if (!isDirective(name)) {continue;}

    const full = normalizeDirective(name);
    const { base, arg, modifiers } = parseDirective(full);

    switch (base) {
    case 'k-show':
      handleShow(el, expr, scope, disposers);
      break;
    case 'k-text':
      handleText(el, expr, scope, disposers);
      break;
    case 'k-html':
      handleHtml(el, expr, scope, disposers);
      break;
    case 'k-bind':
      if (arg) {handleBind(el, expr, arg, scope, disposers);}
      break;
    case 'k-on':
      if (arg) {handleOn(el, expr, arg, modifiers, scope, disposers);}
      break;
    case 'k-model':
      handleModel(el, expr, scope, disposers);
      break;
      // k-data is handled by the walker
    }
  }
}

/**
 * Recursively walk children, processing directives.
 * Stops descending into nested k-data elements (they create their own scope).
 */
function walkChildren(parent, scope, disposers) {
  for (const child of parent.children) {
    if (child.hasAttribute('k-data')) {
      // Nested scope — handled separately
      continue;
    }
    processElement(child, scope, disposers);
    walkChildren(child, scope, disposers);
  }
}

/**
 * Process a k-data element: create scope, process self + children.
 */
function processDataElement(el, disposers) {
  const expr = el.getAttribute('k-data');
  let data = {};
  try {
    data = evaluate(expr, createScope({})) || {};
  } catch (_) {
    console.warn('[kupola] k-data parse error:', expr);
  }

  const scope = createScope(data);

  // Process directives on this element (excluding k-data itself)
  processElement(el, scope, disposers);

  // Walk children
  walkChildren(el, scope, disposers);

  // Handle nested k-data elements
  for (const child of el.children) {
    if (child.hasAttribute('k-data')) {
      processDataElement(child, disposers);
    }
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Walk a DOM tree and activate all Kupola directives.
 *
 * Finds `k-data` elements to create reactive scopes, then processes
 * `k-show`, `k-text`, `k-html`, `k-bind`, `k-on`, `k-model` directives.
 *
 * @param {Element} root  Root element to walk.
 * @returns {{ destroy: Function }}  Call destroy() to clean up all effects/listeners.
 */
export function walk(root) {
  /** @type {Function[]} */
  const disposers = [];

  if (root.hasAttribute && root.hasAttribute('k-data')) {
    processDataElement(root, disposers);
  } else {
    // Find top-level k-data elements within root
    const dataElements = root.querySelectorAll
      ? root.querySelectorAll('[k-data]')
      : [];

    if (dataElements.length > 0) {
      // Check if any data element is a direct child — process it
      // For elements nested inside non-data parents, process them
      for (const el of dataElements) {
        // Only process if no ancestor (up to root) also has k-data
        // (nested scopes are handled by their parent processDataElement)
        let isNested = false;
        let parent = el.parentElement;
        while (parent && parent !== root) {
          if (parent.hasAttribute('k-data')) {
            isNested = true;
            break;
          }
          parent = parent.parentElement;
        }
        if (!isNested) {
          processDataElement(el, disposers);
        }
      }
    } else {
      // No k-data found — process directives on all children with empty scope
      const scope = createScope({});
      for (const child of root.children) {
        processElement(child, scope, disposers);
        walkChildren(child, scope, disposers);
      }
    }
  }

  return {
    destroy() {
      for (const dispose of disposers) {
        dispose();
      }
      disposers.length = 0;
    },
  };
}
