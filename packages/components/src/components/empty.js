// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Empty state component built on the 2.0 reactive core.
 *
 * Reuses the existing `ds-empty*` CSS classes for styling.
 *
 * ```js
 * import { Empty } from '@kupola/components/empty';
 *
 * const view = Empty({
 *   title: 'No data',
 *   description: 'There are no items to display.',
 *   icon: '<svg>...</svg>',
 * });
 * container.appendChild(view.element);
 * ```
 *
 * @module components/empty
 */

import { html } from '@kupola/platform/template';
import { render } from '@kupola/platform/render';
import { getIconHtml } from './icon-helper';

/**
 * Create an Empty state component instance.
 *
 * @param {Object} [options]
 * @param {string} [options.title]       Title text
 * @param {string} [options.description] Description text
 * @param {string} [options.icon]        Custom icon HTML (raw HTML string)
 * @returns {{ element: DocumentFragment, destroy: Function }}
 */
export function Empty(options = {}) {
  const {
    title = '',
    description = '',
    icon = '',
  } = options;

  // ── Public API ─────────────────────────────────────────────────────────────

  function destroy() {
    instance.destroy();
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  // Default icon: simple empty-state SVG
  const iconHtml = icon || getIconHtml('table');

  const tpl = html`
    <div class="ds-empty">
      <div class="ds-empty__icon"></div>
      ${title ? html`<div class="ds-empty__title">${title}</div>` : ''}
      ${description ? html`<div class="ds-empty__description">${description}</div>` : ''}
    </div>
  `;

  const container = document.createDocumentFragment();
  const instance = render(tpl, container);

  // Set icon HTML directly (template escapes HTML strings)
  const iconEl = container.querySelector('.ds-empty__icon');
  if (iconEl) {iconEl.innerHTML = iconHtml;}

  return {
    get element() { return container; },
    destroy,
  };
}
