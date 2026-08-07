// SPDX-License-Identifier: MIT
/**
 * DOM walker: element/attribute processing, k-data scope mounting, subtree
 * walking, auto-destroy observation, and the public walk API.
 *
 * @module directives/walk
 */

import { runWithScheduler } from '@kupola/core';
import {
  describeElement,
  directiveRequiresExpression,
  flushReactiveJobs,
  formatDiagnostic,
  isBlankExpression,
  warn,
  warnDirectiveCombinations,
  warnEmptyDirectiveExpression,
  warnMissingDirectiveArgument,
  walkRootCount,
} from './directives-warnings.js';
import { evaluateStatement, resolveData } from './directives-expressions.js';
import { addRef, createDomContext, createScope } from './directives-scope.js';
import {
  customDirectives,
  isDirective,
  normalizeCustomDirectives,
  normalizeDirective,
  parseDirective,
  validateDirectiveSyntax,
} from './directives-registry.js';
import {
  cleanDisposers,
  handleBind,
  handleClass,
  handleFor,
  handleHtml,
  handleIf,
  handleModel,
  handleOn,
  handleOnce,
  handleShow,
  handleStyle,
  handleText,
} from './directives-builtins.js';

function processElement(el, scope, disposers, ctx, allowRootTransition = false) {
  const attrs = [ ...el.attributes ];

  warnDirectiveCombinations(el);

  if (el.hasAttribute('k-for')) {
    const expr = el.getAttribute('k-for');
    if (isBlankExpression(expr)) {
      warnEmptyDirectiveExpression(el, 'k-for');
    } else {
      handleFor(el, expr, scope, disposers, ctx);
      return true;
    }
  }

  if (el.hasAttribute('k-if')) {
    const expr = el.getAttribute('k-if');
    if (isBlankExpression(expr)) {
      warnEmptyDirectiveExpression(el, 'k-if');
    } else {
      handleIf(el, expr, scope, disposers, ctx);
      return true;
    }
  }

  if (el.hasAttribute('k-else-if') || el.hasAttribute('k-else')) {
    warn(
      'W010',
      `${describeElement(el)} has k-else-if/k-else without an adjacent k-if branch.`,
    );
    return true;
  }

  if (el.hasAttribute('k-transition') && !el.hasAttribute('k-show') && !allowRootTransition) {
    warn(
      'W011',
      `${describeElement(el)} has k-transition, but it only runs with k-show or k-if.`,
    );
  }

  for (const attr of attrs) {
    const name = attr.name;
    const expr = attr.value;

    if (!isDirective(name)) {continue;}

    const full = normalizeDirective(name);
    const { base, arg, modifiers } = parseDirective(full);
    const directiveName = name.startsWith(':') || name.startsWith('@') ? name : full;

    if (!validateDirectiveSyntax(el, directiveName, base, arg, modifiers, ctx.customDirectives)) {
      continue;
    }

    if (base === 'k-on' && !arg) {
      warnMissingDirectiveArgument(el, directiveName, 'an event name');
      continue;
    }

    if (directiveRequiresExpression(base) && isBlankExpression(expr)) {
      warnEmptyDirectiveExpression(el, directiveName);
      continue;
    }

    switch (base) {
    case 'k-show':
      handleShow(el, expr, scope, disposers);
      break;
    case 'k-text':
      handleText(el, expr, scope, disposers);
      break;
    case 'k-html':
      handleHtml(el, expr, scope, disposers, ctx.sanitizer);
      break;
    case 'k-bind':
      handleBind(el, expr, arg, scope, disposers);
      break;
    case 'k-on':
      if (arg) {handleOn(el, expr, arg, modifiers, scope, disposers);}
      break;
    case 'k-model':
      handleModel(el, expr, scope, disposers, modifiers);
      break;
    case 'k-class':
      handleClass(el, expr, scope, disposers);
      break;
    case 'k-style':
      handleStyle(el, expr, scope, disposers);
      break;
    case 'k-init':
      evaluateStatement(expr, scope, null, { directive: 'k-init', element: el });
      flushReactiveJobs();
      break;
    case 'k-cloak':
      el.removeAttribute('k-cloak');
      break;
    case 'k-once':
      handleOnce(el, expr, scope, disposers);
      break;
    case 'k-pre':
      return true;
    case 'k-ref':
      disposers.push(addRef(ctx.refs, expr, el));
      if (ctx.appRefs && ctx.appRefs !== ctx.refs) {
        disposers.push(addRef(ctx.appRefs, expr, el));
      }
      break;
    default: {
      const customDirective = ctx.customDirectives?.has(base)
        ? ctx.customDirectives.get(base)
        : customDirectives.get(base);
      if (customDirective) {
        const binding = { value: expr, arg, modifiers };
        if (customDirective.mount) {
          const instance = customDirective.mount(el, binding);
          if (instance && typeof instance.destroy === 'function') {
            disposers.push(() => instance.destroy());
          }
        }
      }
      break;
    }
      // k-data is handled by the walker
    }
  }
  return false;
}

function getDirectDataChildren(el) {
  return [ ...el.children ].filter(child => (
    child.parentElement === el && child.hasAttribute('k-data')
  ));
}

function processNestedDataChildren(children, disposers, appRefs, sanitizer, scopedDirectives) {
  for (const child of children) {
    if (!child.parentElement || !child.hasAttribute('k-data')) {continue;}
    processDataElement(child, disposers, appRefs, sanitizer, scopedDirectives);
  }
}

export function processSubtree(el, scope, disposers, ctx, allowRootTransition = false) {
  if (el.hasAttribute('k-data')) {
    processDataElement(el, disposers, ctx.appRefs, ctx.sanitizer, ctx.customDirectives);
    return;
  }

  const skipChildren = processElement(el, scope, disposers, ctx, allowRootTransition);
  const nestedDataChildren = skipChildren ? [] : getDirectDataChildren(el);
  if (!skipChildren) {
    walkChildren(el, scope, disposers, ctx);
    processNestedDataChildren(
      nestedDataChildren,
      disposers,
      ctx.appRefs,
      ctx.sanitizer,
      ctx.customDirectives,
    );
  }
}

/**
 * Recursively walk children, processing directives.
 * Stops descending into nested k-data elements (they create their own scope).
 */
function walkChildren(parent, scope, disposers, ctx) {
  for (const child of [ ...parent.children ]) {
    if (child.parentElement !== parent) {continue;}
    if (child.hasAttribute('k-data')) {
      // Nested scope — handled separately
      continue;
    }
    processSubtree(child, scope, disposers, ctx);
  }
}

/**
 * Process a k-data element: create scope, process self + children.
 */
function processDataElement(
  el,
  disposers,
  appRefs = Object.create(null),
  sanitizer,
  scopedDirectives,
) {
  const expr = el.getAttribute('k-data');
  const ctx = createDomContext(
    el,
    disposers,
    Object.create(null),
    appRefs,
    sanitizer,
    scopedDirectives,
  );
  let data = {};
  if (isBlankExpression(expr)) {
    warnEmptyDirectiveExpression(el, 'k-data');
  } else {
    try {
      data = resolveData(expr, ctx, el);
    } catch (error) {
      console.warn(error?.message || formatDiagnostic('E003', `k-data parse error: ${expr}`));
    }
  }

  const scope = createScope(data);
  ctx.scope = scope;

  // Process directives on this element (excluding k-data itself)
  const skipChildren = processElement(el, scope, disposers, ctx);
  const nestedDataChildren = skipChildren ? [] : getDirectDataChildren(el);

  // Walk children
  if (!skipChildren) {
    walkChildren(el, scope, disposers, ctx);
  }

  if (typeof scope.mounted === 'function') {
    scope.mounted(ctx);
  }

  // Handle nested k-data elements
  if (!skipChildren) {
    processNestedDataChildren(
      nestedDataChildren,
      disposers,
      appRefs,
      sanitizer,
      scopedDirectives,
    );
  }

  return ctx;
}

// ─── Auto Destroy ────────────────────────────────────────────────────────────

const autoDestroyRoots = new Map();
let autoDestroyObserver = null;
const activeWalkRoots = new WeakMap();

function ensureAutoDestroyObserver() {
  if (autoDestroyObserver || typeof MutationObserver !== 'function') {return;}
  const target = document.documentElement || document.body;
  if (!target) {return;}

  autoDestroyObserver = new MutationObserver(() => {
    for (const [ root, destroy ] of [ ...autoDestroyRoots ]) {
      if (!root.isConnected) {
        destroy();
      }
    }
  });
  autoDestroyObserver.observe(target, { childList: true, subtree: true });
}

function unobserveAutoDestroyRoot(root) {
  autoDestroyRoots.delete(root);
  if (autoDestroyRoots.size === 0 && autoDestroyObserver) {
    autoDestroyObserver.disconnect();
    autoDestroyObserver = null;
  }
}

function observeAutoDestroyRoot(root, destroy) {
  if (!root || root === document || !root.isConnected) {return;}
  ensureAutoDestroyObserver();
  if (!autoDestroyObserver) {return;}
  autoDestroyRoots.set(root, destroy);
}

function warnDuplicateWalk(root) {
  if (!activeWalkRoots.has(root)) {return;}
  warn(
    'W012',
    `${describeElement(root)} is already initialized by walk(). ` +
    'Destroy the previous instance before calling walk() on the same root again.',
  );
}

function resolveWalkRoot(root) {
  if (typeof root === 'string') {
    root = document.querySelector(root);
  }
  if (!root || !root.nodeType) {
    throw new TypeError('[kupola] walk() expects an Element or selector.');
  }
  return root;
}

function resolveOptionalWalkRoot(root) {
  if (typeof root === 'string') {
    root = document.querySelector(root);
  }
  if (!root || !root.nodeType) {return null;}
  return root;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Walk a DOM tree and activate all Kupola directives.
 *
 * Finds `k-data` elements to create reactive scopes, then processes
 * `k-show`, `k-if`, `k-else-if`, `k-else`, `k-for`, `k-text`, `k-html`,
 * `k-bind`, `k-class`, `k-style`, `k-on`, `k-model`, `k-ref`,
 * `k-init`, `k-cloak` directives.
 *
 * @param {Element|string} root  Root element or selector to walk.
 * @param {{ autoDestroy?: boolean, scheduler?: Object|null }} [options]
 * @returns {{
 *   destroy: Function, root: Element, refs: Object,
 *   $: Function, $$: Function, on: Function, watch: Function
 * }}
 *   Call destroy() to clean up all effects/listeners.
 */
export function walk(root, options = {}) {
  if (options && options.scheduler !== undefined) {
    return runWithScheduler(options.scheduler, () => walkInternal(root, options));
  }
  return walkInternal(root, options);
}

function walkInternal(root, options = {}) {
  root = resolveWalkRoot(root);
  warnDuplicateWalk(root);
  if (options.sanitizer != null && typeof options.sanitizer !== 'function') {
    throw new TypeError('[kupola] walk() sanitizer option expects a function or null.');
  }

  walkRootCount.value += 1;

  /** @type {Function[]} */
  const disposers = [];
  const scopedDirectives = normalizeCustomDirectives(options.customDirectives);
  const ctx = createDomContext(
    root,
    disposers,
    Object.create(null),
    undefined,
    options.sanitizer,
    scopedDirectives,
  );

  try {
    if (root.hasAttribute && root.hasAttribute('k-data')) {
      processDataElement(root, disposers, ctx.refs, ctx.sanitizer, ctx.customDirectives);
    } else {
      // Find top-level k-data elements within root
      const dataElements = root.querySelectorAll
        ? root.querySelectorAll('[k-data]')
        : [];

      if (dataElements.length > 0) {
        // Check if any data element is a direct child — process it
        // For elements nested inside non-data parents, process them
        for (const el of dataElements) {
          // Only process if no ancestor (up to root) owns this subtree.
          // Nested scopes and dynamic directive fragments are handled by
          // their parent processDataElement/handleIf/handleFor path.
          let isNested = false;
          let parent = el.parentElement;
          while (parent && parent !== root) {
            if (
              parent.hasAttribute('k-data') ||
              parent.hasAttribute('k-if') ||
              parent.hasAttribute('k-else-if') ||
              parent.hasAttribute('k-else') ||
              parent.hasAttribute('k-for')
            ) {
              isNested = true;
              break;
            }
            parent = parent.parentElement;
          }
          if (!isNested) {
            processDataElement(el, disposers, ctx.refs, ctx.sanitizer, ctx.customDirectives);
          }
        }
      } else {
        // No k-data found — process directives on all children with empty scope
        const scope = createScope({});
        ctx.scope = scope;
        for (const child of [ ...root.children ]) {
          if (child.parentElement !== root) {continue;}
          processSubtree(child, scope, disposers, ctx);
        }
      }
    }
  } catch (error) {
    cleanDisposers(disposers);
    walkRootCount.value -= 1;
    throw error;
  }

  let active = true;
  const result = {
    root,
    refs: ctx.refs,
    $: ctx.$,
    $$: ctx.$$,
    on: ctx.on,
    watch: ctx.watch,
    destroy() {
      if (!active) {return;}
      active = false;
      walkRootCount.value -= 1;
      activeWalkRoots.delete(root);
      unobserveAutoDestroyRoot(root);
      const firstError = cleanDisposers(disposers);
      if (firstError) {throw firstError;}
    },
  };

  activeWalkRoots.set(root, result);

  if (options.autoDestroy) {
    observeAutoDestroyRoot(root, result.destroy);
  }

  return result;
}

/**
 * Walk a DOM tree and automatically destroy the instance when the root is removed.
 *
 * @param {Element|string} root  Root element or selector to walk.
 * @returns {ReturnType<typeof walk>}
 */
export function walkAuto(root, options = {}) {
  return walk(root, { ...options, autoDestroy: true });
}

/**
 * Return the existing walk instance for a root, or create one if needed.
 *
 * @param {Element|string} root  Root element or selector to walk.
 * @param {{ autoDestroy?: boolean }} [options]
 * @returns {ReturnType<typeof walk>}
 */
export function walkOnce(root, options = {}) {
  root = resolveWalkRoot(root);
  return activeWalkRoots.get(root) || walk(root, options);
}

/**
 * Get the active walk instance for a root.
 *
 * @param {Element|string} root  Root element or selector to inspect.
 * @returns {ReturnType<typeof walk>|null}
 */
export function getWalk(root) {
  root = resolveOptionalWalkRoot(root);
  return root ? activeWalkRoots.get(root) || null : null;
}

/**
 * Check whether a root has an active walk instance.
 *
 * @param {Element|string} root  Root element or selector to inspect.
 * @returns {boolean}
 */
export function hasWalk(root) {
  return Boolean(getWalk(root));
}

/**
 * Destroy the active walk instance for a root if one exists.
 *
 * @param {Element|string} root  Root element or selector to destroy.
 * @returns {boolean}
 */
export function destroyWalk(root) {
  const instance = getWalk(root);
  if (!instance) {return false;}
  instance.destroy();
  return true;
}
