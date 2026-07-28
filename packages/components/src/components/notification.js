// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Notification (toast) component built on the 2.0 reactive core.
 *
 * Reuses the existing `ds-notification-*` CSS classes for styling.
 *
 * ```js
 * import { Notification } from '@kupola/components/notification';
 *
 * const notify = Notification();
 * notify.success({ title: 'Saved', message: 'Changes saved successfully.' });
 * notify.error({ title: 'Error', message: 'Failed to save.' });
 * notify.info({ title: 'Info', message: 'New version available.', duration: 5000 });
 * notify.destroy();
 * ```
 *
 * @module components/notification
 */

import { getIconHtml } from './icon-helper';
import { createListenerRegistry } from './listener-registry';
import { getMotionDuration } from './motion';

function _esc(str) {
  const div = document.createElement('div');
  div.textContent = String(str ?? '');
  return div.innerHTML;
}

const ICON_NAMES = {
  success: 'check-circle',
  warning: 'alert-triangle',
  error: 'x-circle',
  info: 'info-circle',
  normal: '',
};

const POSITION_CLASSES = {
  'top-right': '',
  'top-left': 'ds-notification--top-left',
  'bottom-right': 'ds-notification--bottom-right',
  'bottom-left': 'ds-notification--bottom-left',
  'bottom': 'ds-notification--bottom',
};

export function Notification(options = {}) {
  let _position = options.position && POSITION_CLASSES[options.position] ? options.position : 'top-right';
  let _container = null;
  let _idCounter = 0;
  const _activeItems = new Set();
  let _destroyed = false;

  function _ensureContainer() {
    if (_destroyed) {return null;}
    if (_container && _container.parentNode) {return _container;}

    _container = document.createElement('div');
    _container.className = 'ds-notification';
    _container.setAttribute('role', 'region');
    _container.setAttribute('aria-live', 'polite');
    _container.setAttribute('aria-atomic', 'false');
    const posClass = POSITION_CLASSES[_position];
    if (posClass) {_container.classList.add(posClass);}
    document.body.appendChild(_container);
    return _container;
  }

  function _updatePosition(pos) {
    if (_destroyed) {return;}
    _position = pos;
    if (!_container) {return;}
    _container.className = 'ds-notification';
    const posClass = POSITION_CLASSES[_position];
    if (posClass) {_container.classList.add(posClass);}
  }

  function _open(options = {}) {
    const {
      title = '',
      message = '',
      type = 'normal',
      duration = 4500,
      closable = true,
    } = options;

    const container = _ensureContainer();
    if (!container) {return null;}

    const id = ++_idCounter;
    const iconHtml = ICON_NAMES[type] ? getIconHtml(ICON_NAMES[type]) : '';

    const itemEl = document.createElement('div');
    itemEl.className = `ds-notification__item ds-notification__item--${type}`;
    itemEl.setAttribute('role', type === 'error' ? 'alert' : 'status');
    itemEl.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');
    itemEl.setAttribute('data-id', id);

    let html_content = '';
    if (iconHtml) {
      html_content += `<span class="ds-notification__icon">${iconHtml}</span>`;
    }
    html_content += '<div class="ds-notification__content">';
    if (title) {html_content += `<div class="ds-notification__title">${_esc(title)}</div>`;}
    if (message) {html_content += `<div class="ds-notification__message">${_esc(message)}</div>`;}
    html_content += '</div>';
    if (closable) {
      html_content += '<button class="ds-notification__close" aria-label="Close">&times;</button>';
    }

    itemEl.innerHTML = html_content;

    let timer = null;
    let removalTimer = null;
    let closed = false;
    let removed = false;
    const listeners = createListenerRegistry();

    function removeNow() {
      if (removed) {return;}
      removed = true;
      if (timer !== null) {clearTimeout(timer);}
      if (removalTimer !== null) {clearTimeout(removalTimer);}
      timer = null;
      removalTimer = null;
      listeners.destroy();
      itemEl.remove();
      _activeItems.delete(removeNow);
      if (container.childNodes.length === 0 && container.parentNode) {
        container.parentNode.removeChild(container);
        if (_container === container) {_container = null;}
      }
    }

    function close() {
      if (closed || removed) {return;}
      closed = true;
      if (timer !== null) {clearTimeout(timer);}
      timer = null;
      itemEl.classList.add('is-exiting');
      const exitTimeout = getMotionDuration(itemEl);
      if (exitTimeout <= 0) {
        removeNow();
        return;
      }
      const onExitEnd = event => {
        if (event.target === itemEl) {removeNow();}
      };
      listeners.on(itemEl, 'animationend', onExitEnd);
      listeners.on(itemEl, 'transitionend', onExitEnd);
      removalTimer = setTimeout(removeNow, exitTimeout + 50);
    }

    const closeBtn = itemEl.querySelector('.ds-notification__close');
    if (closeBtn) {listeners.on(closeBtn, 'click', close);}

    if (duration > 0) {
      timer = setTimeout(close, duration);
    }

    container.appendChild(itemEl);
    _activeItems.add(removeNow);

    return { element: itemEl, close };
  }

  function _setType(type) {
    return (options = {}) => _open({ ...options, type });
  }

  const api = {
    open: _open,
    success: _setType('success'),
    warning: _setType('warning'),
    error: _setType('error'),
    info: _setType('info'),
    setPosition(pos) {
      if (_destroyed) {return;}
      _updatePosition(pos);
    },
    destroy() {
      if (_destroyed) {return;}
      _destroyed = true;
      for (const removeNow of [ ..._activeItems ]) {
        removeNow();
      }
      if (_container && _container.parentNode) {
        _container.parentNode.removeChild(_container);
        _container = null;
      }
      Object.freeze(api);
    },
  };

  return api;
}
