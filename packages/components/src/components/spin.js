// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Spin (loading spinner) component built on the 2.0 reactive core.
 *
 * Reuses the existing `ds-spin-*` CSS classes for styling.
 *
 * ```js
 * import { Spin } from '@kupola/components/spin';
 *
 * const view = Spin({ text: 'Loading...', size: 'lg' });
 * container.appendChild(view.element);
 * ```
 *
 * @module components/spin
 */

import { html } from '@kupola/core/template';
import { render } from '@kupola/core/render';

/**
 * Create a Spin component instance.
 *
 * @param {Object} [options]
 * @param {string} [options.text]  Loading text label
 * @param {string} [options.size]  'sm'|'default'|'lg' (default 'default')
 * @returns {{ element: DocumentFragment, destroy: Function }}
 */
export function Spin(options = {}) {
  const {
    text = '',
    size = 'default',
  } = options;

  // ── Public API ─────────────────────────────────────────────────────────────

  function destroy() {
    instance.destroy();
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const sizeClass = size !== 'default' ? ` ds-spin--${size}` : '';

  const tpl = html`
    <div class="ds-spin${sizeClass}">
      <div class="ds-spin__loader"></div>
      ${text ? html`<span class="ds-spin__text">${text}</span>` : ''}
    </div>
  `;

  const container = document.createDocumentFragment();
  const instance = render(tpl, container);

  return {
    get element() { return container; },
    destroy,
  };
}
