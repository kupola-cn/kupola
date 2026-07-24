// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Skeleton loading placeholder component built on the 2.0 reactive core.
 *
 * Reuses the existing `ds-skeleton-*` CSS classes for styling.
 *
 * ```js
 * import { Skeleton } from '@kupola/components/skeleton';
 *
 * const view = Skeleton({ variant: 'text', count: 3 });
 * container.appendChild(view.element);
 * ```
 *
 * @module components/skeleton
 */

import { html } from '@kupola/core';
import { render } from '@kupola/core';

/**
 * Create a Skeleton component instance.
 *
 * @param {Object} [options]
 * @param {string} [options.variant]  'text'|'heading'|'block'|'avatar'|'button'|'input'|'table'|'circle' (default 'text')
 * @param {number} [options.count]    Number of skeleton lines (default 1)
 * @param {string} [options.width]    Custom width (e.g. '50%', '200px')
 * @param {string} [options.height]   Custom height
 * @returns {{ element: DocumentFragment, destroy: Function }}
 */
export function Skeleton(options = {}) {
  const {
    variant = 'text',
    count = 1,
    width = '',
    height = '',
  } = options;

  // ── Public API ─────────────────────────────────────────────────────────────

  function destroy() {
    instance.destroy();
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const tpl = html`<div class="ds-skeleton-group"></div>`;

  const container = document.createDocumentFragment();
  const instance = render(tpl, container);

  const groupEl = container.querySelector('.ds-skeleton-group');

  // Build skeleton items via direct DOM manipulation (HTML strings are escaped by template)
  const variantClass = variant ? `ds-skeleton--${variant}` : '';
  const isCircle = variant === 'circle' || variant === 'avatar';

  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.className = `ds-skeleton ${variantClass}${isCircle ? ' ds-skeleton--circle' : ''}`.trim();

    // Custom dimensions
    if (width) {el.style.width = width;}
    if (height) {el.style.height = height;}

    // Last text line is shorter for visual realism
    if (variant === 'text' && count > 1 && i === count - 1) {
      el.style.width = '60%';
    }

    groupEl.appendChild(el);
  }

  return {
    get element() { return container; },
    destroy,
  };
}
