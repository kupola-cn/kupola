// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Modal component built on the 3.0 reactive core.
 *
 * Reuses the existing `ds-modal-*` CSS classes for styling.
 *
 * ```js
 * import { html } from '@kupola/platform/template';
 * import { Modal } from '@kupola/components/modal';
 *
 * const view = Modal({ title: 'Hello', width: '480px' }, html`<p>Content</p>`);
 * container.appendChild(view.element);
 * view.open();
 * view.close();
 * view.destroy();
 * ```
 *
 * @module components/modal
 */

import { html } from '@kupola/platform/template';
import { render } from '@kupola/platform/render';
import { getIconTemplate } from './icon-helper';
import { lockBodyScroll } from './body-scroll-lock';
import { registerOverlayKeydown, trapOverlayFocus } from './overlay-stack';
import { createListenerRegistry } from './listener-registry';

let modalId = 0;

/**
 * Create a Modal component instance.
 *
 * @param {Object}  [options]
 * @param {string}  [options.title]          Modal title
 * @param {string}  [options.width]          Max-width (e.g. '480px')
 * @param {boolean} [options.closableOnMask] Close on mask click (default true)
 * @param {boolean} [options.escClose]       Close on ESC (default true)
 * @param {TemplateResult|string|null} [children]  Body content
 * @returns {{ element: DocumentFragment, open: Function, close: Function, toggle: Function, destroy: Function }}
 */
export function Modal(options = {}, children = null) {
  const config = options && typeof options === 'object' ? options : {};
  const title = config.title ?? '';
  const width = typeof config.width === 'number' ? `${config.width}px` : (config.width ?? '');
  const closable = config.closable ?? true;
  const closableOnMask = config.closableOnMask ?? config.maskClosable ?? true;
  const escClose = config.escClose ?? true;
  const onClose = typeof config.onClose === 'function' ? config.onClose : null;
  const bodyContent = children ?? config.content ?? null;
  const titleId = `ds-modal-title-${++modalId}`;

  let maskEl = null;
  let closeBtnEl = null;
  let releaseBodyScroll = null;
  let releaseOverlay = null;
  let previousFocus = null;
  let isOpen = false;
  let destroyed = false;
  const listeners = createListenerRegistry();

  // ── Public API ─────────────────────────────────────────────────────────────

  function open() {
    if (destroyed || isOpen) {return;}
    isOpen = true;
    previousFocus = document.activeElement?.nodeType === 1 ? document.activeElement : null;
    if (maskEl) {
      maskEl.classList.add('is-visible');
      releaseBodyScroll ||= lockBodyScroll();
      releaseOverlay ||= registerOverlayKeydown(onKeydown, {
        container: maskEl.querySelector('.ds-modal'),
      });
      const dialogEl = maskEl.querySelector('.ds-modal');
      if (dialogEl) {dialogEl.focus();}
    }
  }

  function close() {
    if (destroyed || !isOpen) {return;}
    isOpen = false;
    if (maskEl) {
      maskEl.classList.remove('is-visible');
    }
    releaseOverlay?.();
    releaseOverlay = null;
    releaseBodyScroll?.();
    releaseBodyScroll = null;
    if (previousFocus?.isConnected) {previousFocus.focus();}
    previousFocus = null;
    if (onClose) {onClose();}
  }

  function toggle() {
    if (isOpen) {
      close();
    } else {
      open();
    }
  }

  // ── Event handlers ─────────────────────────────────────────────────────────

  const onKeydown = (e) => {
    if (!isOpen) {return;}
    if (escClose && e.key === 'Escape') {
      close();
      return;
    }
    trapOverlayFocus(maskEl?.querySelector('.ds-modal'), e);
  };
  const onMaskClick = (e) => {
    if (closableOnMask && e.target === e.currentTarget) {
      close();
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  const styleAttr = width ? `max-width: ${width}` : '';

  const tpl = html`
    <div class="ds-modal-mask">
      <div class="ds-modal" style="${styleAttr}" role="dialog" aria-modal="true"
        aria-labelledby="${titleId}" tabindex="-1">
        <div class="ds-modal__header">
          <span class="ds-modal__title" id="${titleId}">${title}</span>
          ${closable ? html`
            <button class="ds-modal__close" aria-label="Close" type="button">
              ${getIconTemplate('x')}
            </button>
          ` : ''}
        </div>
        <div class="ds-modal__body">${bodyContent}</div>
      </div>
    </div>
  `;

  const container = document.createDocumentFragment();
  const instance = render(tpl, container);

  maskEl = container.querySelector
    ? container.querySelector('.ds-modal-mask')
    : container.firstChild;
  closeBtnEl = container.querySelector('.ds-modal__close');

  listeners.on(maskEl, 'click', onMaskClick);
  listeners.on(closeBtnEl, 'click', close);

  const api = {
    get element() { return container; },
    open,
    close,
    toggle,
    isVisible: () => isOpen,
    destroy() {
      if (destroyed) {return;}
      let closeError = null;
      try {close();} catch (error) {closeError = error;}
      destroyed = true;
      listeners.destroy();
      releaseOverlay?.();
      releaseOverlay = null;
      releaseBodyScroll?.();
      releaseBodyScroll = null;
      instance.destroy();
      Object.freeze(api);
      if (closeError) {throw closeError;}
    },
  };

  return api;
}
