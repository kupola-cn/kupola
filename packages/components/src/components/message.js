// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Message module built on the 2.0 reactive core.
 *
 * Global message notification system with types and positions.
 *
 * ```js
 * import { Message } from '@kupola/components/message';
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

import { getIconHtml } from './icon-helper';

const ICON_NAMES = {
  normal: 'info-circle',
  success: 'check-circle',
  error: 'x-circle',
  warning: 'alert-triangle',
  info: 'info-circle',
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
      <div class="ds-message__icon ds-message__icon--${msgType}">${getIconHtml(ICON_NAMES[msgType])}</div>
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
