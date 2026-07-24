// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Breadcrumb component built on the 2.0 reactive core.
 *
 * Reuses the existing `ds-breadcrumb*` CSS classes for styling.
 *
 * ```js
 * import { Breadcrumb } from '@kupola/core/components/breadcrumb';
 *
 * const view = Breadcrumb({
 *   items: [
 *     { label: 'Home', href: '/' },
 *     { label: 'Products', href: '/products' },
 *     { label: 'Detail' },
 *   ],
 *   separator: '>',
 * });
 * container.appendChild(view.element);
 * ```
 *
 * @module components/breadcrumb
 */

import { html } from '@kupola/core';
import { render } from '@kupola/core';

/**
 * Create a Breadcrumb component instance.
 *
 * @param {Object}   [options]
 * @param {Array}    [options.items]      Array of { label, href }
 * @param {string}   [options.separator]  Separator character (default '/')
 * @returns {{ element: DocumentFragment, destroy: Function }}
 */
export function Breadcrumb(options = {}) {
  const {
    items = [],
    separator = '/',
  } = options;

  // ── Public API ─────────────────────────────────────────────────────────────

  function destroy() {
    instance.destroy();
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const tpl = html`<nav class="ds-breadcrumb" aria-label="Breadcrumb"></nav>`;

  const container = document.createDocumentFragment();
  const instance = render(tpl, container);

  const navEl = container.querySelector('.ds-breadcrumb');

  // Build breadcrumb items via DOM
  items.forEach((item, index) => {
    const itemEl = document.createElement('span');
    itemEl.className = 'ds-breadcrumb__item';

    if (item.href && index < items.length - 1) {
      const link = document.createElement('a');
      link.href = item.href;
      link.textContent = item.label;
      itemEl.appendChild(link);
    } else {
      itemEl.textContent = item.label;
    }

    // Add separator icon (not on last item, handled by CSS :last-child)
    const sepEl = document.createElement('span');
    sepEl.className = 'ds-breadcrumb__icon';
    sepEl.textContent = separator;
    itemEl.appendChild(sepEl);

    navEl.appendChild(itemEl);
  });

  return {
    get element() { return container; },
    destroy,
  };
}
