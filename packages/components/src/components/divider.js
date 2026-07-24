// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Divider component built on the 2.0 reactive core.
 *
 * Reuses the existing `ds-divider*` CSS classes for styling.
 *
 * ```js
 * import { Divider } from '@kupola/components/divider';
 *
 * // Horizontal divider:
 * const h = Divider();
 *
 * // With text:
 * const t = Divider({ text: 'OR' });
 *
 * // Vertical divider:
 * const v = Divider({ vertical: true });
 *
 * container.appendChild(h.element);
 * ```
 *
 * @module components/divider
 */

import { html } from '@kupola/platform/template';
import { render } from '@kupola/platform/render';

/**
 * Create a Divider component instance.
 *
 * @param {Object} [options]
 * @param {string}  [options.text]       Optional text label in the divider
 * @param {boolean} [options.vertical]   Vertical orientation (default false = horizontal)
 * @returns {{ element: DocumentFragment, destroy: Function }}
 */
export function Divider(options = {}) {
  const {
    text = '',
    vertical = false,
  } = options;

  // ── Public API ─────────────────────────────────────────────────────────────

  function destroy() {
    instance.destroy();
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const verticalClass = vertical ? ' ds-divider--vertical' : '';

  const tpl = text
    ? html`<div class="ds-divider${verticalClass}"><span class="ds-divider__text">${text}</span></div>`
    : html`<div class="ds-divider${verticalClass}"></div>`;

  const container = document.createDocumentFragment();
  const instance = render(tpl, container);

  return {
    get element() { return container; },
    destroy,
  };
}
