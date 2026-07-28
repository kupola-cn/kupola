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
import { createListenerRegistry } from './listener-registry';
import { getMotionDuration } from './motion';

const ICON_NAMES = {
  normal: 'info-circle',
  success: 'check-circle',
  error: 'x-circle',
  warning: 'alert-triangle',
  info: 'info-circle',
};

const VALID_TYPES = [ 'normal', 'success', 'error', 'warning', 'info' ];
const VALID_POSITIONS = [ 'top', 'top-right', 'top-left', 'bottom', 'bottom-right', 'bottom-left' ];
const EXIT_TIMEOUT_BUFFER = 50;

function _duration(value, fallback) {
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

function _maxCount(value) {
  return Number.isFinite(value) && value >= 1 ? Math.floor(value) : 5;
}

export function Message(options = {}) {
  const defaultDuration = _duration(options?.duration, 3000);
  const defaultPosition = VALID_POSITIONS.includes(options?.position) ? options.position : 'top';
  const maxCount = _maxCount(options?.maxCount);

  let container = null;
  let destroyed = false;
  const activeItems = new Set();

  function _getContainer() {
    if (destroyed) {return null;}
    if (!container || !container.parentNode) {
      container = document.createElement('div');
      container.className = `ds-message ds-message--${defaultPosition}`;
      container.setAttribute('role', 'status');
      container.setAttribute('aria-live', 'polite');
      container.setAttribute('aria-atomic', 'true');
      document.body.appendChild(container);
    }
    return container;
  }

  function _show(message, type = 'normal', opts = {}) {
    const ctr = _getContainer();
    if (!ctr) {return null;}

    const duration = _duration(opts?.duration, defaultDuration);
    const msgType = VALID_TYPES.includes(type) ? type : 'normal';

    while (activeItems.size >= maxCount) {
      activeItems.values().next().value.removeNow();
    }

    const msg = document.createElement('div');
    msg.className = `ds-message__item ds-message__item--${msgType}`;
    msg.setAttribute('role', msgType === 'error' ? 'alert' : 'status');
    msg.setAttribute('aria-live', msgType === 'error' ? 'assertive' : 'polite');
    msg.innerHTML = `
      <div class="ds-message__icon ds-message__icon--${msgType}">${getIconHtml(ICON_NAMES[msgType])}</div>
      <div class="ds-message__content"></div>
    `;
    msg.querySelector('.ds-message__content').textContent = String(message ?? '');

    ctr.appendChild(msg);
    msg.classList.add('is-visible');

    let timer = null;
    let removalTimer = null;
    let closed = false;
    let removed = false;
    const listeners = createListenerRegistry();
    let itemState = null;

    function removeNow() {
      if (removed) {return;}
      removed = true;
      if (timer !== null) {clearTimeout(timer);}
      if (removalTimer !== null) {clearTimeout(removalTimer);}
      timer = null;
      removalTimer = null;
      listeners.destroy();
      msg.remove();
      activeItems.delete(itemState);
      if (ctr.childElementCount === 0) {
        ctr.remove();
        if (container === ctr) {container = null;}
      }
    }

    function close() {
      if (closed || removed) {return;}
      closed = true;
      if (timer !== null) {clearTimeout(timer);}
      timer = null;
      msg.classList.remove('is-visible');
      msg.classList.add('is-exiting');
      const exitTimeout = getMotionDuration(msg);
      if (exitTimeout <= 0) {
        removeNow();
        return;
      }
      const onExitEnd = event => {
        if (event.target === msg) {removeNow();}
      };
      listeners.on(msg, 'animationend', onExitEnd);
      listeners.on(msg, 'transitionend', onExitEnd);
      removalTimer = setTimeout(removeNow, exitTimeout + EXIT_TIMEOUT_BUFFER);
    }

    itemState = { close, removeNow };
    activeItems.add(itemState);

    if (duration > 0) {
      timer = setTimeout(close, duration);
    }

    return { element: msg, close };
  }

  const api = {
    normal: (message, opts) => _show(message, 'normal', opts),
    success: (message, opts) => _show(message, 'success', opts),
    error: (message, opts) => _show(message, 'error', opts),
    warning: (message, opts) => _show(message, 'warning', opts),
    info: (message, opts) => _show(message, 'info', opts),
    show: _show,
    destroy() {
      if (destroyed) {return;}
      destroyed = true;
      for (const item of [ ...activeItems ]) {
        item.removeNow();
      }
      container?.remove();
      container = null;
      Object.freeze(api);
    },
  };

  return api;
}
