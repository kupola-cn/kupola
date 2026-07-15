// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Message module built on the 2.0 reactive core.
 *
 * Global message notification system with types and positions.
 *
 * ```js
 * import { Message } from '@kupola/core/components/message';
 *
 * const msg = Message();
 * msg.success('Operation completed');
 * msg.error('Something went wrong');
 * msg.warning('Check your input');
 * msg.info('New version available');
 * msg.normal('Hello world');
 * msg.destroy();
 * ```
 *
 * @module components/message
 */

const ICONS = {
  normal:  '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
  success: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>',
  error:   '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
  warning: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  info:    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
};

const VALID_TYPES = [ 'normal', 'success', 'error', 'warning', 'info' ];
const VALID_POSITIONS = [ 'top', 'top-right', 'top-left', 'bottom', 'bottom-right', 'bottom-left' ];

export function Message(options = {}) {
  const defaultDuration = options.duration ?? 3000;
  const defaultPosition = options.position ?? 'top';
  const maxCount = options.maxCount ?? 5;

  let container = null;
  let destroyed = false;

  function _getContainer() {
    if (destroyed) {return null;}
    if (!container) {
      container = document.createElement('div');
      container.className = `ds-message ds-message--${defaultPosition}`;
      document.body.appendChild(container);
    }
    return container;
  }

  function _show(message, type = 'normal', opts = {}) {
    const ctr = _getContainer();
    if (!ctr) {return null;}

    const duration = opts.duration ?? defaultDuration;
    const msgType = VALID_TYPES.includes(type) ? type : 'normal';

    const msg = document.createElement('div');
    msg.className = `ds-message__item ds-message__item--${msgType}`;
    msg.innerHTML = `
      <div class="ds-message__icon ds-message__icon--${msgType}">${ICONS[msgType]}</div>
      <div class="ds-message__content"></div>
    `;
    msg.querySelector('.ds-message__content').textContent = message;

    // Remove excess messages
    const existing = ctr.querySelectorAll('.ds-message__item');
    if (existing.length >= maxCount) {
      const oldest = existing[0];
      oldest.classList.remove('is-visible');
      oldest.classList.add('is-exiting');
      setTimeout(() => { if (oldest.parentNode) {oldest.remove();} }, 300);
    }

    ctr.appendChild(msg);

    // Trigger enter animation
    setTimeout(() => { msg.classList.add('is-visible'); }, 10);

    // Auto-remove
    let timer = null;
    if (duration > 0) {
      timer = setTimeout(() => {
        msg.classList.remove('is-visible');
        msg.classList.add('is-exiting');
        setTimeout(() => { if (msg.parentNode) {msg.remove();} }, 300);
      }, duration);
    }

    return { element: msg, close: () => {
      if (timer) {clearTimeout(timer);}
      msg.classList.remove('is-visible');
      msg.classList.add('is-exiting');
      setTimeout(() => { if (msg.parentNode) {msg.remove();} }, 300);
    } };
  }

  function destroy() {
    destroyed = true;
    if (container && container.parentNode) {
      container.remove();
    }
    container = null;
  }

  return {
    normal: (message, opts) => _show(message, 'normal', opts),
    success: (message, opts) => _show(message, 'success', opts),
    error: (message, opts) => _show(message, 'error', opts),
    warning: (message, opts) => _show(message, 'warning', opts),
    info: (message, opts) => _show(message, 'info', opts),
    show: _show,
    destroy,
  };
}
