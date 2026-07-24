// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Kbd (keyboard key) component built on the 2.0 reactive core.
 *
 * Reuses the existing `ds-kbd*` CSS classes for styling.
 *
 * ```js
 * import { Kbd } from '@kupola/components/kbd';
 *
 * const view = Kbd({ key: 'Ctrl+S', size: 'sm' });
 * container.appendChild(view.element);
 * ```
 *
 * @module components/kbd
 */

import { html } from '@kupola/platform/template';
import { render } from '@kupola/platform/render';

/**
 * Create a Kbd component instance.
 *
 * @param {Object} [options]
 * @param {string} [options.key]   Key text to display (e.g. 'Ctrl+S', 'Enter')
 * @param {string} [options.size]  'default'|'sm' (default 'default')
 * @returns {{ element: DocumentFragment, destroy: Function }}
 */
export function Kbd(options = {}) {
  const {
    key = '',
    size = 'default',
  } = options;

  // ── Public API ─────────────────────────────────────────────────────────────

  function destroy() {
    instance.destroy();
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const sizeClass = size === 'sm' ? ' ds-kbd--sm' : '';

  const tpl = html`<kbd class="ds-kbd${sizeClass}">${key}</kbd>`;

  const container = document.createDocumentFragment();
  const instance = render(tpl, container);

  return {
    get element() { return container; },
    destroy,
  };
}
