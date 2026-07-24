// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Dialog component built on the 2.0 reactive core.
 *
 * A command-style dialog (confirm/alert pattern) that returns a Promise.
 * Reuses the existing `ds-modal-mask` + `ds-dialog-*` CSS classes.
 *
 * ```js
 * import { Dialog } from '@kupola/components/dialog';
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

import { html } from '@kupola/platform/template';
import { render } from '@kupola/platform/render';
import { t } from '@kupola/platform/i18n';
import { getIconHtml } from './icon-helper';

const ICON_NAMES = {
  success: 'check-circle',
  warning: 'alert-triangle',
  error: 'x-circle',
  info: 'info-circle',
  normal: 'info-circle',
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
    confirmText = null,
    cancelText = null,
    showCancel = true,
  } = options;
  const _confirmText = confirmText || t('dialog.ok');
  const _cancelText = cancelText || t('dialog.cancel');

  return new Promise((resolve) => {
    const iconHtml = getIconHtml(ICON_NAMES[type] || ICON_NAMES.normal);

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
        <div class="ds-dialog" role="alertdialog" aria-modal="true" aria-labelledby="dialog-title" aria-describedby="dialog-content" tabindex="-1">
          <div class="ds-dialog__icon ds-dialog__icon--${type}"></div>
          <div class="ds-dialog__title" id="dialog-title">${title}</div>
          <div class="ds-dialog__content" id="dialog-content">${content}</div>
          <div class="ds-dialog__actions">
            ${showCancel ? html`<button class="ds-btn ds-btn--ghost" data-action="cancel" type="button">${_cancelText}</button>` : ''}
            <button class="ds-btn ds-btn--primary" data-action="confirm" type="button">${_confirmText}</button>
          </div>
        </div>
      </div>
    `;

    const container = document.createDocumentFragment();
    const instance = render(tpl, container);
    const maskEl = container.querySelector('.ds-modal-mask');
    const iconEl = container.querySelector('.ds-dialog__icon');
    if (iconEl) {iconEl.innerHTML = iconHtml;}

    // Append to body
    document.body.appendChild(container);

    // Show the mask
    if (maskEl) {maskEl.classList.add('is-visible');}
    document.body.style.overflow = 'hidden';

    // Focus the dialog
    const dialogEl = maskEl?.querySelector('.ds-dialog');
    if (dialogEl) {dialogEl.focus();}

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
