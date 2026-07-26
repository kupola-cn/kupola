// SPDX-License-Identifier: MIT

const overlays = [];
let listening = false;

function handleKeydown(event) {
  overlays[overlays.length - 1]?.handler(event);
}

function updateListener() {
  if (typeof document === 'undefined') {return;}
  if (overlays.length > 0 && !listening) {
    document.addEventListener('keydown', handleKeydown);
    listening = true;
  } else if (overlays.length === 0 && listening) {
    document.removeEventListener('keydown', handleKeydown);
    listening = false;
  }
}

export function registerOverlayKeydown(handler) {
  if (typeof handler !== 'function') {return () => {};}
  const entry = { handler };
  overlays.push(entry);
  updateListener();

  let active = true;
  return () => {
    if (!active) {return;}
    active = false;
    const index = overlays.indexOf(entry);
    if (index >= 0) {overlays.splice(index, 1);}
    updateListener();
  };
}
