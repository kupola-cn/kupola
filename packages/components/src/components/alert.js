// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Alert component built on the 2.0 reactive core.
 *
 * Reuses the existing `ds-alert-*` CSS classes for styling.
 *
 * ```js
 * import { Alert } from '@kupola/components/alert';
 *
 * const view = Alert({
 *   title: 'Warning',
 *   description: 'This action is irreversible.',
 *   type: 'warning',
 *   closable: true,
 *   onClose: () => console.log('dismissed'),
 * });
 * container.appendChild(view.element);
 * ```
 *
 * @module components/alert
 */

import { html } from '@kupola/core/template';
import { render } from '@kupola/core/render';

/**
 * Create an Alert component instance.
 *
 * @param {Object}  [options]
 * @param {string}  [options.title]        Alert title
 * @param {string}  [options.description]  Alert description text
 * @param {string}  [options.type]         'normal'|'success'|'warning'|'danger'|'info' (default 'normal')
 * @param {boolean} [options.closable]     Show close button (default false)
 * @param {Function} [options.onClose]     Callback when dismissed
 * @returns {{ element: DocumentFragment, dismiss: Function, destroy: Function }}
 */
export function Alert(options = {}) {
  const {
    title = '',
    description = '',
    type = 'normal',
    closable = false,
    onClose = null,
  } = options;

  let _isDismissed = false;

  // ── Public API ─────────────────────────────────────────────────────────────

  function dismiss() {
    if (_isDismissed) {return;}
    _isDismissed = true;
    if (wrapEl) {wrapEl.classList.add('is-dismissed');}
    if (onClose) {onClose();}
  }

  function destroy() {
    instance.destroy();
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const tpl = html`
    <div class="ds-alert ds-alert--${type}" role="alert">
      <div class="ds-alert__body">
        ${title ? html`<div class="ds-alert__title">${title}</div>` : ''}
        ${description ? html`<div class="ds-alert__desc">${description}</div>` : ''}
      </div>
      ${closable ? html`<button class="ds-alert__close" aria-label="Close">&times;</button>` : ''}
    </div>
  `;

  const container = document.createDocumentFragment();
  const instance = render(tpl, container);

  const wrapEl = container.querySelector('.ds-alert');

  // Bind close button after render
  const closeBtn = container.querySelector('.ds-alert__close');
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
