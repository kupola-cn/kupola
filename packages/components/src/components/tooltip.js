// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Tooltip component built on the 2.0 reactive core.
 *
 * Reuses the existing `ds-tooltip-*` CSS classes for styling.
 *
 * ```js
 * import { Tooltip } from '@kupola/components/tooltip';
 *
 * const tip = Tooltip({ target: buttonEl, content: 'Delete this item', placement: 'top' });
 * // Later:
 * tip.destroy();
 * ```
 *
 * @module components/tooltip
 */

// Tooltip creates its element directly via DOM — no template/render needed

import { createListenerRegistry } from './listener-registry';

const VALID_PLACEMENTS = [ 'top', 'bottom', 'left', 'right' ];
const VALID_TRIGGERS = [ 'hover', 'click', 'focus' ];
let tooltipId = 0;

/**
 * Create a Tooltip bound to a target element.
 *
 * @param {Object}  [options]
 * @param {Element} options.target       Target element to attach to
 * @param {string}  [options.content]    Tooltip text
 * @param {string}  [options.placement]  'top' (default) | 'bottom' | 'left' | 'right'
 * @param {string}  [options.trigger]    'hover' (default) | 'click' | 'focus'
 * @param {number}  [options.delay]      Show delay in ms (default 0)
 * @returns {{ show: Function, hide: Function, destroy: Function }}
 */
export function Tooltip(options = {}) {
  const config = options && typeof options === 'object' ? options : {};
  const target = config.target ?? null;
  const content = config.content ?? '';
  const placement = VALID_PLACEMENTS.includes(config.placement) ? config.placement : 'top';
  const trigger = VALID_TRIGGERS.includes(config.trigger) ? config.trigger : 'hover';
  const delay = Number.isFinite(config.delay) && config.delay > 0 ? config.delay : 0;

  if (!target || typeof target.addEventListener !== 'function'
    || typeof target.getBoundingClientRect !== 'function') {
    throw new TypeError('Tooltip requires a target element');
  }

  let _isVisible = false;
  let _showTimer = null;
  let _tooltipEl = null;
  let _destroyed = false;
  let _describedByAttached = false;
  const id = `ds-tooltip-${++tooltipId}`;
  const listeners = createListenerRegistry();
  const visibilityListeners = createListenerRegistry();

  // ── Create tooltip element ─────────────────────────────────────────────────

  function _createTooltip() {
    if (!_tooltipEl) {
      _tooltipEl = document.createElement('div');
      _tooltipEl.id = id;
      _tooltipEl.className = `ds-tooltip ds-tooltip--${placement}`;
      _tooltipEl.setAttribute('role', 'tooltip');
      _tooltipEl.style.opacity = '0';
      _tooltipEl.style.pointerEvents = 'none';
      _tooltipEl.textContent = String(content);
    }
    if (!_tooltipEl.parentNode) {document.body.appendChild(_tooltipEl);}
    if (!_describedByAttached) {
      const describedBy = new Set((target.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean));
      describedBy.add(id);
      target.setAttribute('aria-describedby', [ ...describedBy ].join(' '));
      _describedByAttached = true;
    }
  }

  function _positionTooltip() {
    if (!_tooltipEl || !target) {return;}
    const rect = target.getBoundingClientRect();
    const tipRect = _tooltipEl.getBoundingClientRect();
    const ownerDocument = target.ownerDocument || document;
    const viewportWidth = ownerDocument.documentElement.clientWidth || window.innerWidth || 0;
    const viewportHeight = ownerDocument.documentElement.clientHeight || window.innerHeight || 0;
    const gap = 8;
    let effectivePlacement = placement;
    if (placement === 'top' && rect.top < tipRect.height + gap && rect.bottom > viewportHeight / 2) {
      effectivePlacement = 'bottom';
    } else if (placement === 'bottom'
      && viewportHeight - rect.bottom < tipRect.height + gap && rect.top > viewportHeight / 2) {
      effectivePlacement = 'top';
    } else if (placement === 'left' && rect.left < tipRect.width + gap && rect.right > viewportWidth / 2) {
      effectivePlacement = 'right';
    } else if (placement === 'right'
      && viewportWidth - rect.right < tipRect.width + gap && rect.left > viewportWidth / 2) {
      effectivePlacement = 'left';
    }
    let top, left;

    switch (effectivePlacement) {
    case 'bottom':
      top = rect.bottom + gap;
      left = rect.left + rect.width / 2 - tipRect.width / 2;
      break;
    case 'left':
      top = rect.top + rect.height / 2 - tipRect.height / 2;
      left = rect.left - tipRect.width - gap;
      break;
    case 'right':
      top = rect.top + rect.height / 2 - tipRect.height / 2;
      left = rect.right + gap;
      break;
    case 'top':
    default:
      top = rect.top - tipRect.height - gap;
      left = rect.left + rect.width / 2 - tipRect.width / 2;
      break;
    }

    _tooltipEl.style.position = 'fixed';
    if (viewportWidth > 0) {
      left = Math.min(Math.max(8, left), Math.max(8, viewportWidth - tipRect.width - 8));
    }
    if (viewportHeight > 0) {
      top = Math.min(Math.max(8, top), Math.max(8, viewportHeight - tipRect.height - 8));
    }
    _tooltipEl.style.top = `${top}px`;
    _tooltipEl.style.left = `${left}px`;
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  function show() {
    if (_destroyed || (_isVisible && _tooltipEl?.parentNode)) {return;}
    if (_showTimer !== null) {
      clearTimeout(_showTimer);
      _showTimer = null;
    }
    _isVisible = true;
    _createTooltip();
    _tooltipEl.classList.add('is-visible');
    _tooltipEl.style.opacity = '';
    _positionTooltip();
    visibilityListeners.on(window, 'resize', _positionTooltip);
    visibilityListeners.on(document, 'scroll', _positionTooltip, true);
  }

  function hide() {
    if (_showTimer !== null) {
      clearTimeout(_showTimer);
      _showTimer = null;
    }
    visibilityListeners.clear();
    if (!_isVisible) {return;}
    _isVisible = false;
    if (_tooltipEl) {
      _tooltipEl.classList.remove('is-visible');
      _tooltipEl.style.opacity = '0';
    }
  }

  // ── Event handlers ─────────────────────────────────────────────────────────

  function _onMouseEnter() {
    if (delay > 0) {
      if (_showTimer === null) {_showTimer = setTimeout(show, delay);}
    } else {
      show();
    }
  }

  function _onMouseLeave() {
    hide();
  }

  function _onClick(e) {
    e.stopPropagation();
    _isVisible ? hide() : show();
  }

  function _onFocus() {
    show();
  }

  function _onBlur() {
    hide();
  }

  function _onDocumentClick() {
    if (_isVisible) {hide();}
  }

  // ── Bind events ────────────────────────────────────────────────────────────

  if (trigger === 'hover') {
    listeners.on(target, 'mouseenter', _onMouseEnter);
    listeners.on(target, 'mouseleave', _onMouseLeave);
    listeners.on(target, 'focus', _onFocus);
    listeners.on(target, 'blur', _onBlur);
  } else if (trigger === 'click') {
    listeners.on(target, 'click', _onClick);
    listeners.on(document, 'click', _onDocumentClick);
  } else {
    listeners.on(target, 'focus', _onFocus);
    listeners.on(target, 'blur', _onBlur);
  }

  const api = {
    show,
    hide,
    destroy() {
      if (_destroyed) {return;}
      _destroyed = true;
      hide();
      visibilityListeners.destroy();
      listeners.destroy();
      _tooltipEl?.remove();
      _tooltipEl = null;
      if (_describedByAttached) {
        const describedBy = (target.getAttribute('aria-describedby') || '')
          .split(/\s+/)
          .filter(value => value && value !== id);
        if (describedBy.length > 0) {
          target.setAttribute('aria-describedby', describedBy.join(' '));
        } else {
          target.removeAttribute('aria-describedby');
        }
        _describedByAttached = false;
      }
      Object.freeze(api);
    },
  };

  return api;
}
