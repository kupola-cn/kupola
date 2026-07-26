// SPDX-License-Identifier: MIT

/**
 * Track manually attached DOM listeners so component teardown is deterministic.
 * The registry is intentionally private to the components package.
 */
export function createListenerRegistry() {
  const listeners = new Set();
  let destroyed = false;

  function on(target, eventName, handler, options) {
    if (destroyed || !target || typeof target.addEventListener !== 'function') {
      return () => {};
    }

    target.addEventListener(eventName, handler, options);
    const entry = { target, eventName, handler, options };
    listeners.add(entry);

    return () => {
      if (!listeners.delete(entry)) {return;}
      target.removeEventListener(eventName, handler, options);
    };
  }

  function clear() {
    for (const entry of listeners) {
        entry.target.removeEventListener(entry.eventName, entry.handler, entry.options);
    }
    listeners.clear();
}

  function destroy() {
    if (destroyed) {return;}
    destroyed = true;
    clear();
  }

  return { on, clear, destroy };
}
