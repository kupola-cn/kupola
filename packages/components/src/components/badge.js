// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Badge component built on the 2.0 reactive core.
 *
 * Reuses the existing `ds-badge-*` CSS classes for styling.
 *
 * ```js
 * import { Badge } from '@kupola/components/badge';
 *
 * const view = Badge({ value: 5, type: 'error' });
 * container.appendChild(view.element);
 *
 * // Dot mode (no text, just a small indicator dot):
 * const dot = Badge({ dot: true, type: 'success' });
 *
 * // Update later:
 * view.setValue(10);
 * ```
 *
 * @module components/badge
 */

import { html } from '@kupola/platform/template';
import { render } from '@kupola/platform/render';

/**
 * Create a Badge component instance.
 *
 * @param {Object}       [options]
 * @param {number|string} [options.value]     Badge content (number or string)
 * @param {number}       [options.max]        Max value before showing "max+" (default 99)
 * @param {string}       [options.type]       'brand'|'success'|'warning'|'error'|'info'|'neutral' (default '')
 * @param {boolean}      [options.dot]        Dot mode — small indicator, no text (default false)
 * @param {boolean}      [options.pulse]      Pulse animation (default false)
 * @returns {{ element: DocumentFragment, setValue: Function, getValue: Function, destroy: Function }}
 */
export function Badge(options = {}) {
  const {
    value = '',
    max = 99,
    type = '',
    dot = false,
    pulse = false,
  } = options;

  let _value = value;

  // ── Public API ─────────────────────────────────────────────────────────────

  function setValue(val) {
    _value = val;
    _syncContent();
  }

  function getValue() {
    return _value;
  }

  function destroy() {
    instance.destroy();
  }

  // ── Internal ───────────────────────────────────────────────────────────────

  function _formatValue() {
    if (dot) {return '';}
    const num = Number(_value);
    if (!isNaN(num) && num > max) {return max + '+';}
    return String(_value);
  }

  function _syncContent() {
    if (!badgeEl) {return;}
    if (!dot) {
      badgeEl.textContent = _formatValue();
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const typeClass = type ? ` ds-badge--${type}` : '';
  const dotClass = dot ? ' ds-badge--dot' : '';
  const pulseClass = pulse ? ' ds-badge--pulse' : '';

  const displayText = dot ? '' : String(_value !== '' ? (function () {
    const num = Number(_value);
    if (!isNaN(num) && num > max) {return max + '+';}
    return String(_value);
  }()) : '');

  const tpl = html`
    <span class="ds-badge${typeClass}${dotClass}${pulseClass}">${displayText}</span>
  `;

  const container = document.createDocumentFragment();
  const instance = render(tpl, container);

  const badgeEl = container.querySelector('.ds-badge');

  return {
    get element() { return container; },
    setValue,
    getValue,
    destroy,
  };
}
