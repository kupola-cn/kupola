// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Dialog component built on the 2.0 reactive core.
 *
 * A command-style dialog (confirm/alert pattern) that returns a Promise.
 * Reuses the existing `ds-modal-mask` + `ds-dialog-*` CSS classes.
 *
 * ```js
 * import { Dialog } from '@kupola/core/components/dialog';
 *
 * const ok = await Dialog.confirm({
 *   title: 'Delete item?',
 *   content: 'This action cannot be undone.',
 *   type: 'warning',
 * });
 *
 * await Dialog.alert({ title: 'Done', content: 'Saved successfully.', type: 'success' });
 * ```
 *
 * @module components/dialog
 */

import { html } from '../template.js';
import { render } from '../render.js';

const ICONS = {
  success: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>',
  warning: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  error: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
  info: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
  normal: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
};

/**
 * Show a confirm dialog.
 *
 * @param {Object}  [options]
 * @param {string}  [options.title]     Dialog title
 * @param {string}  [options.content]   Dialog message
 * @param {string}  [options.type]      'normal'|'success'|'warning'|'error'|'info' (default 'normal')
 * @param {string}  [options.confirmText]  Confirm button text (default 'OK')
 * @param {string}  [options.cancelText]   Cancel button text (default 'Cancel')
 * @param {boolean} [options.showCancel]   Show cancel button (default true)
 * @returns {Promise<boolean>}
 */
function confirm(options = {}) {
  const {
    title = '',
    content = '',
    type = 'normal',
    confirmText = 'OK',
    cancelText = 'Cancel',
    showCancel = true,
  } = options;

  return new Promise((resolve) => {
    const iconHtml = ICONS[type] || ICONS.normal;

    const onConfirm = () => {
      cleanup();
      resolve(true);
    };

    const onCancel = () => {
      cleanup();
      resolve(false);
    };

    const onMaskClick = (e) => {
      if (e.target === e.currentTarget) {
        onCancel();
      }
    };

    const onKeydown = (e) => {
      if (e.key === 'Escape') {onCancel();}
      if (e.key === 'Enter') {onConfirm();}
    };

    const tpl = html`
      <div class="ds-modal-mask">
        <div class="ds-dialog">
          <div class="ds-dialog__icon ds-dialog__icon--${type}">${iconHtml}</div>
          <div class="ds-dialog__title">${title}</div>
          <div class="ds-dialog__content">${content}</div>
          <div class="ds-dialog__actions">
            ${showCancel ? html`<button class="ds-btn ds-btn--ghost" data-action="cancel">${cancelText}</button>` : ''}
            <button class="ds-btn ds-btn--primary" data-action="confirm">${confirmText}</button>
          </div>
        </div>
      </div>
    `;

    const container = document.createDocumentFragment();
    const instance = render(tpl, container);

    // Append to body
    document.body.appendChild(container);

    // Show the mask
    const maskEl = document.body.querySelector('.ds-modal-mask:last-of-type')
      || document.body.lastElementChild;
    if (maskEl) {maskEl.classList.add('is-visible');}
    document.body.style.overflow = 'hidden';

    // Bind button clicks
    const confirmBtn = maskEl.querySelector('[data-action="confirm"]');
    const cancelBtn = maskEl.querySelector('[data-action="cancel"]');
    if (confirmBtn) {confirmBtn.addEventListener('click', onConfirm);}
    if (cancelBtn) {cancelBtn.addEventListener('click', onCancel);}
    if (maskEl) {maskEl.addEventListener('click', onMaskClick);}

    document.addEventListener('keydown', onKeydown);

    function cleanup() {
      document.removeEventListener('keydown', onKeydown);
      document.body.style.overflow = '';
      if (maskEl) {maskEl.classList.remove('is-visible');}
      // Small delay for close animation (if any)
      setTimeout(() => {
        instance.destroy();
        if (maskEl && maskEl.parentNode) {maskEl.parentNode.removeChild(maskEl);}
      }, 50);
    }
  });
}

/**
 * Show an alert dialog (no cancel button).
 *
 * @param {Object}  [options]
 * @param {string}  [options.title]     Dialog title
 * @param {string}  [options.content]   Dialog message
 * @param {string}  [options.type]      'normal'|'success'|'warning'|'error'|'info'
 * @param {string}  [options.confirmText]  Confirm button text (default 'OK')
 * @returns {Promise<void>}
 */
function alert(options = {}) {
  return confirm({ ...options, showCancel: false }).then(() => {});
}

export const Dialog = { confirm, alert };
