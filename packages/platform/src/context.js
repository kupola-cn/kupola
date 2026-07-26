// SPDX-License-Identifier: MIT
/**
 * App and component provide/inject context.
 *
 * The legacy registry is retained for calls made outside an application
 * context. App and component contexts are isolated and released on destroy.
 */

const legacyRegistry = new Map();
let activeContext = null;

export function createProvideContext(parent = null) {
  const context = {
    parent: parent && !parent.disposed ? parent : null,
    values: new Map(),
    children: new Set(),
    disposed: false,
  };
  if (context.parent) {context.parent.children.add(context);}
  return context;
}

export function disposeProvideContext(context) {
  if (!context || context.disposed) {return;}
  context.disposed = true;
  if (context.parent) {context.parent.children.delete(context);}
  context.parent = null;
  context.values.clear();
  for (const child of context.children) {
    child.parent = null;
  }
  context.children.clear();
}

export function getCurrentProvideContext() {
  return activeContext;
}

export function hasProvideContext() {
  return Boolean(activeContext && !activeContext.disposed);
}

export function runWithProvideContext(context, fn) {
  if (context !== null && (!context || typeof context !== 'object')) {
    throw new TypeError('[kupola] provide context must be an object or null.');
  }
  if (typeof fn !== 'function') {
    throw new TypeError('[kupola] runWithProvideContext() expects a function.');
  }
  const previous = activeContext;
  activeContext = context && !context.disposed ? context : null;
  try {
    return fn();
  } finally {
    activeContext = previous;
  }
}

export function provideInCurrentContext(key, value) {
  if (activeContext && !activeContext.disposed) {
    activeContext.values.set(key, value);
    return;
  }
  legacyRegistry.set(key, value);
}

export function provideInContext(context, key, value) {
  if (!context || context.disposed) {
    throw new Error('[kupola] Cannot provide into a disposed context.');
  }
  context.values.set(key, value);
}

export function injectFromCurrentContext(key, defaultValue = undefined) {
  let context = activeContext;
  while (context && !context.disposed) {
    if (context.values.has(key)) {return context.values.get(key);}
    context = context.parent;
  }
  return legacyRegistry.has(key) ? legacyRegistry.get(key) : defaultValue;
}

export function clearLegacyProvideRegistry() {
  legacyRegistry.clear();
}
