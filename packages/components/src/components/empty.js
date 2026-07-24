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

import { html } from '@kupola/core';
import { render } from '@kupola/core';

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
  const defaultIcon = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>';
  const iconHtml = icon || defaultIcon;

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
