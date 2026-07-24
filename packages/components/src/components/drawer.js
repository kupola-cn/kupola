// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Drawer component built on the 2.0 reactive core.
 *
 * Reuses the existing `ds-drawer-*` CSS classes for styling.
 *
 * ```js
 * import { html } from '@kupola/core';
 * import { Drawer } from '@kupola/components/drawer';
 *
 * const view = Drawer({ title: 'Settings', placement: 'right', width: '400px' }, html`<p>Content</p>`);
 * container.appendChild(view.element);
 * view.open();
 * view.close();
 * view.destroy();
 * ```
 *
 * @module components/drawer
 */

import { html } from '@kupola/core';
import { render } from '@kupola/core';

/**
 * Create a Drawer component instance.
 *
 * @param {Object}  [options]
 * @param {string}  [options.title]          Drawer title
 * @param {string}  [options.placement]      'left' (default) or 'right'
 * @param {string}  [options.width]          Drawer width (e.g. '400px')
 * @param {boolean} [options.closableOnMask] Close on mask click (default true)
 * @param {boolean} [options.escClose]       Close on ESC (default true)
 * @param {TemplateResult|string|null} [children]  Body content
 * @returns {{ element: DocumentFragment, open: Function, close: Function, toggle: Function, destroy: Function }}
 */
export function Drawer(options = {}, children = null) {
  const {
    title = '',
    placement = 'left',
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
    if (drawerEl) {drawerEl.classList.add('is-visible');}
    document.body.style.overflow = 'hidden';
    // Focus management: focus the drawer panel
    if (drawerEl) {drawerEl.focus();}
  }

  function close() {
    if (!_isOpen) {return;}
    _isOpen = false;
    if (maskEl) {maskEl.classList.remove('is-visible');}
    if (drawerEl) {drawerEl.classList.remove('is-visible');}
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

  const drawerClass = placement === 'right'
    ? 'ds-drawer ds-drawer--right'
    : 'ds-drawer';
  const styleAttr = width ? `width: ${width}` : '';

  const tpl = html`
    <div class="ds-drawer-mask" onclick="${onMaskClick}">
      <div class="${drawerClass}" style="${styleAttr}" role="dialog" aria-modal="true" aria-labelledby="drawer-title" tabindex="-1">
        <div class="ds-drawer__header">
          <span class="ds-drawer__title" id="drawer-title">${title}</span>
          <button class="ds-drawer__close" onclick="${close}" aria-label="Close" type="button">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div class="ds-drawer__body">${children}</div>
      </div>
    </div>
  `;

  const container = document.createDocumentFragment();
  const instance = render(tpl, container);

  // Grab references
  const maskEl = container.querySelector('.ds-drawer-mask');
  const drawerEl = container.querySelector('.ds-drawer');

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
