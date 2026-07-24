// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Tooltip component built on the 2.0 reactive core.
 *
 * Reuses the existing `ds-tooltip-*` CSS classes for styling.
 *
 * ```js
 * import { Tooltip } from '@kupola/core/components/tooltip';
 *
 * const tip = Tooltip({ target: buttonEl, content: 'Delete this item', placement: 'top' });
 * // Later:
 * tip.destroy();
 * ```
 *
 * @module components/tooltip
 */

// Tooltip creates its element directly via DOM — no template/render needed

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
  const {
    target = null,
    content = '',
    placement = 'top',
    trigger = 'hover',
    delay = 0,
  } = options;

  if (!target) {
    throw new Error('Tooltip requires a target element');
  }

  let _isVisible = false;
  let _showTimer = null;
  let _tooltipEl = null;

  // ── Create tooltip element ─────────────────────────────────────────────────

  function _createTooltip() {
    if (_tooltipEl) {return;}
    _tooltipEl = document.createElement('div');
    _tooltipEl.className = `ds-tooltip ds-tooltip--${placement}`;
    _tooltipEl.setAttribute('role', 'tooltip');
    _tooltipEl.style.opacity = '0';
    _tooltipEl.style.pointerEvents = 'none';
    _tooltipEl.textContent = content;
    document.body.appendChild(_tooltipEl);
  }

  function _positionTooltip() {
    if (!_tooltipEl || !target) {return;}
    const rect = target.getBoundingClientRect();
    const tipRect = _tooltipEl.getBoundingClientRect();
    let top, left;

    switch (placement) {
    case 'bottom':
      top = rect.bottom + 8;
      left = rect.left + rect.width / 2 - tipRect.width / 2;
      break;
    case 'left':
      top = rect.top + rect.height / 2 - tipRect.height / 2;
      left = rect.left - tipRect.width - 8;
      break;
    case 'right':
      top = rect.top + rect.height / 2 - tipRect.height / 2;
      left = rect.right + 8;
      break;
    case 'top':
    default:
      top = rect.top - tipRect.height - 8;
      left = rect.left + rect.width / 2 - tipRect.width / 2;
      break;
    }

    _tooltipEl.style.position = 'fixed';
    _tooltipEl.style.top = top + 'px';
    _tooltipEl.style.left = left + 'px';
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  function show() {
    if (_isVisible) {return;}
    _isVisible = true;
    _createTooltip();
    _tooltipEl.classList.add('is-visible');
    _tooltipEl.style.opacity = '';
    _positionTooltip();
  }

  function hide() {
    if (!_isVisible) {return;}
    _isVisible = false;
    if (_showTimer) {
      clearTimeout(_showTimer);
      _showTimer = null;
    }
    if (_tooltipEl) {
      _tooltipEl.classList.remove('is-visible');
      _tooltipEl.style.opacity = '0';
    }
  }

  function destroy() {
    hide();
    if (_tooltipEl && _tooltipEl.parentNode) {
      _tooltipEl.parentNode.removeChild(_tooltipEl);
      _tooltipEl = null;
    }
    // Remove event listeners
    target.removeEventListener('mouseenter', _onMouseEnter);
    target.removeEventListener('mouseleave', _onMouseLeave);
    target.removeEventListener('click', _onClick);
    target.removeEventListener('focus', _onFocus);
    target.removeEventListener('blur', _onBlur);
    document.removeEventListener('click', _onDocumentClick);
  }

  // ── Event handlers ─────────────────────────────────────────────────────────

  function _onMouseEnter() {
    if (trigger !== 'hover') {return;}
    if (delay > 0) {
      _showTimer = setTimeout(show, delay);
    } else {
      show();
    }
  }

  function _onMouseLeave() {
    if (trigger !== 'hover') {return;}
    hide();
  }

  function _onClick(e) {
    if (trigger !== 'click') {return;}
    e.stopPropagation();
    _isVisible ? hide() : show();
  }

  function _onFocus() {
    if (trigger !== 'focus') {return;}
    show();
  }

  function _onBlur() {
    if (trigger !== 'focus') {return;}
    hide();
  }

  function _onDocumentClick() {
    if (trigger === 'click' && _isVisible) {hide();}
  }

  // ── Bind events ────────────────────────────────────────────────────────────

  target.addEventListener('mouseenter', _onMouseEnter);
  target.addEventListener('mouseleave', _onMouseLeave);
  target.addEventListener('click', _onClick);
  target.addEventListener('focus', _onFocus);
  target.addEventListener('blur', _onBlur);

  if (trigger === 'click') {
    document.addEventListener('click', _onDocumentClick);
  }

  return {
    show,
    hide,
    destroy,
  };
}
