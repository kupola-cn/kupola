// SPDX-License-Identifier: MIT
/**
 * @kupola/ai-adapter — Listener Registry
 *
 * Simple event listener registry for DOM events with batch cleanup.
 */

export function createListenerRegistry() {
  const listeners = new Set();
  let destroyed = false;

  function on(target, eventName, handler, options) {
    if (destroyed) {return;}
    target.addEventListener(eventName, handler, options);
    listeners.add({ target, eventName, handler, options });
  }

  function off(target, eventName, handler, options) {
    target.removeEventListener(eventName, handler, options);
    for (const entry of listeners) {
      if (entry.target === target &&
          entry.eventName === eventName &&
          entry.handler === handler &&
          entry.options === options) {
        listeners.delete(entry);
        break;
      }
    }
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

  return { on, off, clear, destroy };
}
