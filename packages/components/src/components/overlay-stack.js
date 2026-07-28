// SPDX-License-Identifier: MIT

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

const OVERLAY_STATES_KEY = Symbol.for('kupola.components.overlayStates');
const states = globalThis[OVERLAY_STATES_KEY]
  || (globalThis[OVERLAY_STATES_KEY] = new WeakMap());

function getFocusable(container) {
  return Array.from(container?.querySelectorAll?.(FOCUSABLE_SELECTOR) || [])
    .filter(element => !element.hasAttribute('aria-hidden'));
}

export function trapOverlayFocus(container, event) {
  if (!container || event.key !== 'Tab') {return;}
  const focusable = getFocusable(container);
  if (focusable.length === 0) {
    event.preventDefault();
    container.focus?.();
    return;
  }

  const active = container.ownerDocument?.activeElement;
  const currentIndex = focusable.indexOf(active);
  if (event.shiftKey) {
    if (currentIndex <= 0) {
      event.preventDefault();
      focusable[focusable.length - 1].focus();
    }
  } else if (currentIndex === -1 || currentIndex === focusable.length - 1) {
    event.preventDefault();
    focusable[0].focus();
  }
}

function focusFirst(container) {
  const target = container?.querySelector?.('[autofocus], ' + FOCUSABLE_SELECTOR)
    || container;
  target?.focus?.();
}

function createState(ownerDocument) {
  const state = { overlays: [], listening: false };
  state.handleKeydown = event => state.overlays[state.overlays.length - 1]?.handler(event);
  state.handleFocusin = event => {
    const entry = state.overlays[state.overlays.length - 1];
    if (entry?.container && !entry.container.contains(event.target)) {
      focusFirst(entry.container);
    }
  };
  state.update = () => {
    if (state.overlays.length > 0 && !state.listening) {
      ownerDocument.addEventListener('keydown', state.handleKeydown);
      ownerDocument.addEventListener('focusin', state.handleFocusin);
      state.listening = true;
    } else if (state.overlays.length === 0 && state.listening) {
      ownerDocument.removeEventListener('keydown', state.handleKeydown);
      ownerDocument.removeEventListener('focusin', state.handleFocusin);
      state.listening = false;
    }
  };
  return state;
}

export function registerOverlayKeydown(handler, options = {}) {
  if (typeof handler !== 'function') {return () => {};}
  const ownerDocument = options.document || options.container?.ownerDocument
    || (typeof document !== 'undefined' ? document : null);
  if (!ownerDocument) {return () => {};}
  let state = states.get(ownerDocument);
  if (!state) {
    state = createState(ownerDocument);
    states.set(ownerDocument, state);
  }
  const entry = { handler, container: options.container || null };
  state.overlays.push(entry);
  state.update();

  let active = true;
  return () => {
    if (!active) {return;}
    active = false;
    const index = state.overlays.indexOf(entry);
    if (index >= 0) {state.overlays.splice(index, 1);}
    state.update();
  };
}
