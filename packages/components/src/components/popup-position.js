// SPDX-License-Identifier: MIT

export function createPopupPortal(popup, owner) {
  const ownerDocument = owner?.ownerDocument || popup?.ownerDocument
    || (typeof document !== 'undefined' ? document : null);
  const placeholder = ownerDocument?.createComment?.('kupola-popup-anchor') || null;
  const originalStyles = popup ? {
    position: popup.style.position,
    left: popup.style.left,
    top: popup.style.top,
    right: popup.style.right,
    bottom: popup.style.bottom,
    width: popup.style.width,
    minWidth: popup.style.minWidth,
    zIndex: popup.style.zIndex,
  } : null;
  let portaled = false;

  return {
    mount() {
      if (portaled || !popup || !ownerDocument?.body) {return false;}
      if (popup.parentNode && placeholder) {popup.replaceWith(placeholder);}
      ownerDocument.body.appendChild(popup);
      popup.dataset.kupolaPopupPortal = 'true';
      popup.classList.add('is-open');
      popup.style.position = 'fixed';
      portaled = true;
      return true;
    },
    restore() {
      if (!portaled || !popup) {return;}
      popup.classList.remove('is-open');
      if (placeholder?.parentNode) {placeholder.parentNode.insertBefore(popup, placeholder);}
      else if (owner && !owner.contains(popup)) {owner.appendChild(popup);}
      delete popup.dataset.kupolaPopupPortal;
      for (const [ property, value ] of Object.entries(originalStyles || {})) {
        popup.style[property] = value;
      }
      portaled = false;
    },
    isPortaled() {return portaled;},
    destroy() {
      this.restore();
      placeholder?.remove();
    },
  };
}

/**
 * Position an absolute or portaled popup and flip it when the viewport has
 * less room below the trigger. Coordinates are viewport-relative for portals.
 */
export function positionPopup(popup, trigger) {
  if (!popup || !trigger || typeof popup.getBoundingClientRect !== 'function') {return;}
  const triggerRect = trigger.getBoundingClientRect();
  const popupRect = popup.getBoundingClientRect();
  const ownerDocument = trigger.ownerDocument || document;
  const viewportWidth = ownerDocument.documentElement.clientWidth || window.innerWidth || 0;
  const viewportHeight = ownerDocument.documentElement.clientHeight || window.innerHeight || 0;
  const gap = 4;
  const below = viewportHeight - triggerRect.bottom;
  const above = triggerRect.top;
  if (popup.dataset.kupolaPopupPortal === 'true') {
    const width = Math.max(triggerRect.width || 0, popupRect.width || 0);
    const left = Math.min(
      Math.max(4, triggerRect.left),
      Math.max(4, viewportWidth - width - 4),
    );
    const flip = below < popupRect.height + gap && above > below;
    const top = flip
      ? Math.max(4, triggerRect.top - popupRect.height - gap)
      : Math.min(Math.max(4, triggerRect.bottom + gap),
        Math.max(4, viewportHeight - popupRect.height - 4));
    popup.style.left = `${left}px`;
    popup.style.top = `${top}px`;
    popup.style.right = 'auto';
    popup.style.bottom = 'auto';
    popup.style.minWidth = `${width}px`;
  } else if (below < popupRect.height + gap && above > below) {
    popup.style.top = 'auto';
    popup.style.bottom = `calc(100% + ${gap}px)`;
  } else {
    popup.style.top = `calc(100% + ${gap}px)`;
    popup.style.bottom = 'auto';
  }
}
