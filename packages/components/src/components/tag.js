// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Tag component built on the 2.0 reactive core.
 *
 * Reuses the existing `ds-tag-*` CSS classes for styling.
 *
 * ```js
 * import { Tag } from '@kupola/components/tag';
 *
 * const view = Tag({
 *   text: 'Active',
 *   type: 'success',
 *   closable: true,
 *   onClose: () => console.log('removed'),
 * });
 * container.appendChild(view.element);
 * ```
 *
 * @module components/tag
 */

import { html } from '@kupola/platform/template';
import { render } from '@kupola/platform/render';

/**
 * Create a Tag component instance.
 *
 * @param {Object}   [options]
 * @param {string}   [options.text]      Tag label text
 * @param {string}   [options.type]      'brand'|'success'|'warning'|'danger'|'count'|'neutral-strong' (default '')
 * @param {boolean}  [options.closable]  Show close button (default false)
 * @param {Function} [options.onClose]   Callback when close is clicked
 * @returns {{ element: DocumentFragment, dismiss: Function, destroy: Function }}
 */
export function Tag(options = {}) {
  const {
    text = '',
    type = '',
    closable = false,
    onClose = null,
  } = options;

  let _isDismissed = false;

  // ── Public API ─────────────────────────────────────────────────────────────

  function dismiss() {
    if (_isDismissed) {return;}
    _isDismissed = true;
    if (wrapEl) {wrapEl.style.display = 'none';}
    if (onClose) {onClose();}
  }

  function destroy() {
    instance.destroy();
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const typeClass = type ? ` ds-tag--${type}` : '';
  const closableClass = closable ? ' ds-tag--closable' : '';

  const tpl = html`
    <span class="ds-tag${typeClass}${closableClass}">
      ${text}
      ${closable ? html`<button class="ds-tag__close" aria-label="Close">&times;</button>` : ''}
    </span>
  `;

  const container = document.createDocumentFragment();
  const instance = render(tpl, container);

  const wrapEl = container.querySelector('.ds-tag');

  // Bind close button after render
  const closeBtn = container.querySelector('.ds-tag__close');
  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dismiss();
    });
  }

  return {
    get element() { return container; },
    dismiss,
    destroy,
  };
}
