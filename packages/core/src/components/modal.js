// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Modal component built on the 2.0 reactive core.
 *
 * Reuses the existing `ds-modal-*` CSS classes for styling.
 *
 * ```js
 * import { html } from '@kupola/core';
 * import { Modal } from '@kupola/core/components/modal';
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

import { signal } from '../signal.js';
import { html } from '../template.js';
import { render } from '../render.js';

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
  const {
    title = '',
    width = '',
    closableOnMask = true,
    escClose = true,
  } = options;

  let _isOpen = false;

  // ── Public API ─────────────────────────────────────────────────────────────

  function open() {
    if (_isOpen) {return;}
    _isOpen = true;
    if (maskEl) {maskEl.classList.add('is-visible');}
    document.body.style.overflow = 'hidden';
    // Focus management: focus the dialog element
    const dialogEl = maskEl?.querySelector('.ds-modal');
    if (dialogEl) {dialogEl.focus();}
  }

  function close() {
    if (!_isOpen) {return;}
    _isOpen = false;
    if (maskEl) {maskEl.classList.remove('is-visible');}
    document.body.style.overflow = '';
  }

  function toggle() {
    _isOpen ? close() : open();
  }

  // ── Event handlers ─────────────────────────────────────────────────────────

  const onKeydown = (e) => {
    if (escClose && e.key === 'Escape' && _isOpen) {
      close();
    }
  };
  document.addEventListener('keydown', onKeydown);

  const onMaskClick = (e) => {
    if (closableOnMask && e.target === e.currentTarget) {
      close();
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  const styleAttr = width ? `max-width: ${width}` : '';

  const tpl = html`
    <div class="ds-modal-mask" onclick="${onMaskClick}">
      <div class="ds-modal" style="${styleAttr}" role="dialog" aria-modal="true" aria-labelledby="modal-title" tabindex="-1">
        <div class="ds-modal__header">
          <span class="ds-modal__title" id="modal-title">${title}</span>
          <button class="ds-modal__close" onclick="${close}" aria-label="Close" type="button">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div class="ds-modal__body">${children}</div>
      </div>
    </div>
  `;

  const container = document.createDocumentFragment();
  const instance = render(tpl, container);

  // Grab reference to the mask element (first child of the fragment)
  const maskEl = container.querySelector
    ? container.querySelector('.ds-modal-mask')
    : container.firstChild;

  return {
    get element() { return container; },
    open,
    close,
    toggle,
    destroy() {
      document.removeEventListener('keydown', onKeydown);
      document.body.style.overflow = '';
      instance.destroy();
    },
  };
}
