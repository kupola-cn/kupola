// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Notification (toast) component built on the 2.0 reactive core.
 *
 * Reuses the existing `ds-notification-*` CSS classes for styling.
 *
 * ```js
 * import { Notification } from '@kupola/components/notification';
 *
 * Notification.success({ title: 'Saved', message: 'Changes saved successfully.' });
 * Notification.error({ title: 'Error', message: 'Failed to save.' });
 * Notification.info({ title: 'Info', message: 'New version available.', duration: 5000 });
 * ```
 *
 * @module components/notification
 */

// Notification items are created via innerHTML for simpler lifecycle (no reactive bindings needed)

/** Escape HTML special chars to prevent XSS. */
function _esc(str) {
  const div = document.createElement('div');
  div.textContent = String(str ?? '');
  return div.innerHTML;
}

let _container = null;
let _position = 'top-right';
let _idCounter = 0;

const ICONS = {
  success: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>',
  warning: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  error: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
  info: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
  normal: '',
};

const POSITION_CLASSES = {
  'top-right': '',
  'top-left': 'ds-notification--top-left',
  'bottom-right': 'ds-notification--bottom-right',
  'bottom-left': 'ds-notification--bottom-left',
  'bottom': 'ds-notification--bottom',
};

function _ensureContainer() {
  if (_container && _container.parentNode) {return _container;}

  _container = document.createElement('div');
  _container.className = 'ds-notification';
  const posClass = POSITION_CLASSES[_position];
  if (posClass) {_container.classList.add(posClass);}
  document.body.appendChild(_container);
  return _container;
}

function _updatePosition() {
  if (!_container) {return;}
  _container.className = 'ds-notification';
  const posClass = POSITION_CLASSES[_position];
  if (posClass) {_container.classList.add(posClass);}
}

/**
 * Show a notification.
 *
 * @param {Object}  [options]
 * @param {string}  [options.title]     Notification title
 * @param {string}  [options.message]   Notification message
 * @param {string}  [options.type]      'normal'|'success'|'warning'|'error'|'info' (default 'normal')
 * @param {number}  [options.duration]  Auto-close delay in ms (default 4500, 0 = no auto-close)
 * @param {boolean} [options.closable]  Show close button (default true)
 * @returns {{ close: Function }}
 */
function _open(options = {}) {
  const {
    title = '',
    message = '',
    type = 'normal',
    duration = 4500,
    closable = true,
  } = options;

  const container = _ensureContainer();
  const id = ++_idCounter;
  const iconHtml = ICONS[type] || ICONS.normal;

  // Create notification item element directly (not via template, for simpler lifecycle)
  const itemEl = document.createElement('div');
  itemEl.className = `ds-notification__item ds-notification__item--${type}`;
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

  // Close handler
  let timer = null;
  function close() {
    if (timer) {clearTimeout(timer);}
    itemEl.classList.add('is-exiting');
    itemEl.addEventListener('animationend', () => {
      itemEl.remove();
      // Remove container if empty
      if (container.childNodes.length === 0 && container.parentNode) {
        container.parentNode.removeChild(container);
        _container = null;
      }
    }, { once: true });
  }

  // Bind close button
  const closeBtn = itemEl.querySelector('.ds-notification__close');
  if (closeBtn) {closeBtn.addEventListener('click', close);}

  // Auto-close timer
  if (duration > 0) {
    timer = setTimeout(close, duration);
  }

  container.appendChild(itemEl);

  return { close };
}

function _setType(type) {
  return (options = {}) => _open({ ...options, type });
}

export const Notification = {
  open: _open,
  success: _setType('success'),
  warning: _setType('warning'),
  error: _setType('error'),
  info: _setType('info'),
  setPosition(pos) {
    _position = pos;
    _updatePosition();
  },
  destroy() {
    if (_container && _container.parentNode) {
      _container.parentNode.removeChild(_container);
      _container = null;
    }
  },
};
