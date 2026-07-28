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
import { lockBodyScroll } from './body-scroll-lock';
import { createListenerRegistry } from './listener-registry';
import { registerOverlayKeydown, trapOverlayFocus } from './overlay-stack';

const ICON_NAMES = {
  success: 'check-circle',
  warning: 'alert-triangle',
  error: 'x-circle',
  info: 'info-circle',
  normal: 'info-circle',
};
const VALID_TYPES = [ 'normal', 'success', 'warning', 'error', 'info' ];
let dialogId = 0;

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
  const config = options && typeof options === 'object' ? options : {};
  const title = config.title ?? '';
  const content = config.content ?? '';
  const type = VALID_TYPES.includes(config.type) ? config.type : 'normal';
  const confirmText = config.confirmText ?? null;
  const cancelText = config.cancelText ?? null;
  const showCancel = config.showCancel ?? true;
  const _confirmText = confirmText || t('dialog.ok');
  const _cancelText = cancelText || t('dialog.cancel');
  const id = ++dialogId;
  const titleId = `ds-dialog-title-${id}`;
  const contentId = `ds-dialog-content-${id}`;

  return new Promise((resolve) => {
    const iconHtml = getIconHtml(ICON_NAMES[type] || ICON_NAMES.normal);
    const listeners = createListenerRegistry();
    const previousFocus = document.activeElement?.nodeType === 1
      ? document.activeElement
      : null;
    let releaseOverlay = null;
    let releaseBodyScroll = null;
    let cleanedUp = false;

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
      trapOverlayFocus(dialogEl, e);
      if (e.key === 'Escape') {onCancel();}
      if (e.key === 'Enter' && (e.target?.matches?.('[data-action="confirm"]')
        || document.activeElement === dialogEl)) {onConfirm();}
    };

    const tpl = html`
      <div class="ds-modal-mask">
        <div class="ds-dialog" role="alertdialog" aria-modal="true"
          aria-labelledby="${titleId}" aria-describedby="${contentId}" tabindex="-1">
          <div class="ds-dialog__icon ds-dialog__icon--${type}"></div>
          <div class="ds-dialog__title" id="${titleId}">${title}</div>
          <div class="ds-dialog__content" id="${contentId}">${content}</div>
          <div class="ds-dialog__actions">
            ${showCancel ? html`
              <button class="ds-btn ds-btn--ghost"
                data-action="cancel" type="button">${_cancelText}</button>
            ` : ''}
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
    releaseBodyScroll = lockBodyScroll();

    // Focus the dialog
    const dialogEl = maskEl?.querySelector('.ds-dialog');
    if (dialogEl) {dialogEl.focus();}

    // Bind button clicks
    const confirmBtn = maskEl.querySelector('[data-action="confirm"]');
    const cancelBtn = maskEl.querySelector('[data-action="cancel"]');
    if (confirmBtn) {listeners.on(confirmBtn, 'click', onConfirm);}
    if (cancelBtn) {listeners.on(cancelBtn, 'click', onCancel);}
    if (maskEl) {listeners.on(maskEl, 'click', onMaskClick);}
    releaseOverlay = registerOverlayKeydown(onKeydown, { container: dialogEl });

    function cleanup() {
      if (cleanedUp) {return;}
      cleanedUp = true;
      releaseOverlay?.();
      releaseOverlay = null;
      listeners.destroy();
      releaseBodyScroll?.();
      releaseBodyScroll = null;
      if (maskEl) {maskEl.classList.remove('is-visible');}
      instance.destroy();
      maskEl?.remove();
      if (previousFocus?.isConnected) {previousFocus.focus();}
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
