// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Drawer component built on the 2.0 reactive core.
 *
 * Reuses the existing `ds-drawer-*` CSS classes for styling.
 *
 * ```js
 * import { html } from '@kupola/platform/template';
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

import { html } from '@kupola/platform/template';
import { render } from '@kupola/platform/render';
import { getIconTemplate } from './icon-helper';
import { lockBodyScroll } from './body-scroll-lock';
import { registerOverlayKeydown } from './overlay-stack';
import { createListenerRegistry } from './listener-registry';

let drawerId = 0;

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
  const config = options && typeof options === 'object' ? options : {};
  const title = config.title ?? '';
  const placement = config.placement === 'right' ? 'right' : 'left';
  const width = typeof config.width === 'number' ? `${config.width}px` : (config.width ?? '');
  const closable = config.closable ?? true;
  const closableOnMask = config.closableOnMask ?? config.maskClosable ?? true;
  const escClose = config.escClose ?? true;
  const onClose = typeof config.onClose === 'function' ? config.onClose : null;
  const bodyContent = children ?? config.content ?? null;
  const titleId = `ds-drawer-title-${++drawerId}`;

  let _isOpen = false;
  let _destroyed = false;
  let releaseBodyScroll = null;
  let releaseOverlay = null;
  let previousFocus = null;
  let maskEl = null;
  let drawerEl = null;
  let closeBtnEl = null;
  const listeners = createListenerRegistry();

  // ── Public API ─────────────────────────────────────────────────────────────

  function open() {
    if (_destroyed || _isOpen) {return;}
    _isOpen = true;
    previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (maskEl) {maskEl.classList.add('is-visible');}
    if (drawerEl) {drawerEl.classList.add('is-visible');}
    releaseBodyScroll ||= lockBodyScroll();
    releaseOverlay ||= registerOverlayKeydown(onKeydown);
    if (drawerEl) {drawerEl.focus();}
  }

  function close() {
    if (_destroyed || !_isOpen) {return;}
    _isOpen = false;
    if (maskEl) {maskEl.classList.remove('is-visible');}
    if (drawerEl) {drawerEl.classList.remove('is-visible');}
    releaseOverlay?.();
    releaseOverlay = null;
    releaseBodyScroll?.();
    releaseBodyScroll = null;
    if (previousFocus?.isConnected) {previousFocus.focus();}
    previousFocus = null;
    if (onClose) {onClose();}
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
    <div class="ds-drawer-mask">
      <div class="${drawerClass}" style="${styleAttr}" role="dialog" aria-modal="true"
        aria-labelledby="${titleId}" tabindex="-1">
        <div class="ds-drawer__header">
          <span class="ds-drawer__title" id="${titleId}">${title}</span>
          ${closable ? html`
            <button class="ds-drawer__close" aria-label="Close" type="button">
              ${getIconTemplate('x')}
            </button>
          ` : ''}
        </div>
        <div class="ds-drawer__body">${bodyContent}</div>
      </div>
    </div>
  `;

  const container = document.createDocumentFragment();
  const instance = render(tpl, container);

  maskEl = container.querySelector('.ds-drawer-mask');
  drawerEl = container.querySelector('.ds-drawer');
  closeBtnEl = container.querySelector('.ds-drawer__close');

  listeners.on(maskEl, 'click', onMaskClick);
  listeners.on(closeBtnEl, 'click', close);

  const api = {
    get element() { return container; },
    open,
    close,
    toggle,
    isOpen: () => _isOpen,
    destroy() {
      if (_destroyed) {return;}
      let closeError = null;
      try {close();} catch (error) {closeError = error;}
      _destroyed = true;
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
