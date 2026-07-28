// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Dropdown component built on the 3.0 reactive core.
 *
 * Reuses the existing `ds-dropdown-*` CSS classes for styling.
 *
 * ```js
 * import { Dropdown } from '@kupola/components/dropdown';
 *
 * const view = Dropdown({
 *   items: [{ value: 'a', text: 'Option A' }, { value: 'b', text: 'Option B' }],
 *   onSelect: ({ value, text }) => console.log(value, text),
 * });
 * container.appendChild(view.element);
 * ```
 *
 * @module components/dropdown
 */

import { html } from '@kupola/platform/template';
import { render } from '@kupola/platform/render';
import { getIconHtml, getIconTemplate } from './icon-helper';
import { createListenerRegistry } from './listener-registry';
import { registerOverlayKeydown } from './overlay-stack';
import { createPopupPortal, positionPopup } from './popup-position';

let dropdownId = 0;

/**
 * Create a Dropdown component instance.
 *
 * @param {Object}   [options]
 * @param {Array<{value:string, text:string}>} [options.items]       Menu items
 * @param {string}   [options.trigger]        'click' (default) or 'hover'
 * @param {boolean}  [options.closeOnClick]   Close after item selection (default true)
 * @param {Function} [options.onSelect]       Callback: ({ value, text, item }) => void
 * @param {string}   [options.placeholder]    Trigger text when nothing selected
 * @returns {{ element: DocumentFragment, open: Function, close: Function, destroy: Function }}
 */
export function Dropdown(options = {}) {
  const config = options && typeof options === 'object' ? options : {};
  const items = Array.isArray(config.items) ? config.items : [];
  const trigger = config.trigger === 'hover' ? 'hover' : 'click';
  const closeOnClick = config.closeOnClick ?? true;
  const onSelect = typeof config.onSelect === 'function' ? config.onSelect : null;
  const placeholder = config.placeholder ?? 'Select...';
  const menuId = `ds-dropdown-menu-${++dropdownId}`;

  const state = {
    isOpen: false,
    focusIndex: -1,
  };

  let wrapperEl = null;
  let menuEl = null;
  let triggerEl = null;
  let releaseKeydown = null;
  let destroyed = false;
  const listeners = createListenerRegistry();
  const openListeners = createListenerRegistry();
  let popupPortal = null;

  // ── Public API ─────────────────────────────────────────────────────────────

  function open() {
    if (destroyed || state.isOpen) {return;}
    state.isOpen = true;
    popupPortal?.mount();
    if (menuEl) {menuEl.classList.add('is-open');}
    positionPopup(menuEl, triggerEl);
    if (triggerEl) {triggerEl.setAttribute('aria-expanded', 'true');}
    if (trigger === 'click') {
      const ownerDocument = triggerEl?.ownerDocument || document;
      openListeners.on(ownerDocument, 'click', onDocumentClick);
      openListeners.on(ownerDocument.defaultView || window, 'resize', () => positionPopup(menuEl, triggerEl));
      openListeners.on(ownerDocument.defaultView || window, 'scroll', () => positionPopup(menuEl, triggerEl), true);
    }
    releaseKeydown = registerOverlayKeydown(onKeydown);
  }

  function close(restoreFocus = false) {
    if (destroyed || !state.isOpen) {return;}
    state.isOpen = false;
    state.focusIndex = -1;
    _clearFocus();
    if (menuEl) {menuEl.classList.remove('is-open');}
    popupPortal?.restore();
    if (triggerEl) {triggerEl.setAttribute('aria-expanded', 'false');}
    openListeners.clear();
    releaseKeydown?.();
    releaseKeydown = null;
    if (restoreFocus) {triggerEl?.focus();}
  }

  function toggle() {
    if (destroyed) {return;}
    if (state.isOpen) {
      close();
    } else {
      open();
    }
  }

  // ── Focus management ───────────────────────────────────────────────────────

  function _clearFocus() {
    if (!menuEl) {return;}
    const items_ = menuEl.querySelectorAll('.ds-dropdown__item');
    items_.forEach((el) => el.classList.remove('is-focused'));
  }

  function _getFocusableItems() {
    return menuEl?.querySelectorAll('.ds-dropdown__item:not(:disabled)') || [];
  }

  function _setFocus(idx) {
    if (!menuEl) {return;}
    const items_ = _getFocusableItems();
    if (items_.length === 0) {return;}
    _clearFocus();
    state.focusIndex = ((idx % items_.length) + items_.length) % items_.length;
    items_[state.focusIndex].classList.add('is-focused');
    items_[state.focusIndex].focus();
  }

  // ── Item selection ─────────────────────────────────────────────────────────

  function _selectItem(idx) {
    if (destroyed || idx < 0 || idx >= items.length) {return;}
    const item = items[idx];
    if (!item || item.disabled || item.divider) {return;}
    const text = String(item.text ?? item.label ?? '');
    if (closeOnClick) {close();}
    if (typeof item.onClick === 'function') {item.onClick(item);}
    if (onSelect) {onSelect({ value: item.value, text, item });}
  }

  // ── Event handlers ─────────────────────────────────────────────────────────

  const onTriggerClick = (e) => {
    e.stopPropagation();
    toggle();
  };

  const onDocumentClick = (e) => {
    if (!state.isOpen) {return;}
    if (wrapperEl && !wrapperEl.contains(e.target) && !menuEl?.contains(e.target)) {
      close();
    }
  };
  const onKeydown = (e) => {
    if (!state.isOpen) {return;}

    switch (e.key) {
    case 'ArrowDown':
      e.preventDefault();
      _setFocus(state.focusIndex + 1);
      break;
    case 'ArrowUp':
      e.preventDefault();
      _setFocus(state.focusIndex - 1);
      break;
    case 'Home':
      e.preventDefault();
      _setFocus(0);
      break;
    case 'End':
      e.preventDefault();
      _setFocus(items.length - 1);
      break;
    case 'Enter':
      e.preventDefault();
      if (state.focusIndex >= 0) {
        const itemEl = _getFocusableItems()[state.focusIndex];
        if (itemEl) {_selectItem(Number(itemEl.dataset.index));}
      }
      break;
    case 'Escape':
      e.preventDefault();
      close(true);
      break;
    case 'Tab':
      close();
      break;
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  const tpl = html`
    <div class="ds-dropdown">
      <button class="ds-dropdown__trigger" type="button" aria-haspopup="listbox"
        aria-controls="${menuId}" aria-expanded="false">
        <span>${placeholder}</span>
        ${getIconTemplate('chevron-down')}
      </button>
      <div class="ds-dropdown__menu" id="${menuId}" role="listbox"></div>
    </div>
  `;

  const container = document.createDocumentFragment();
  const instance = render(tpl, container);

  wrapperEl = container.querySelector('.ds-dropdown');
  menuEl = container.querySelector('.ds-dropdown__menu');
  triggerEl = container.querySelector('.ds-dropdown__trigger');
  popupPortal = createPopupPortal(menuEl, wrapperEl);

  if (menuEl) {
    items.forEach((item, index) => {
      if (!item || item.divider) {
        const divider = document.createElement('div');
        divider.className = 'ds-dropdown__divider';
        divider.setAttribute('role', 'separator');
        menuEl.appendChild(divider);
        return;
      }
      const itemEl = document.createElement('button');
      itemEl.type = 'button';
      itemEl.className = 'ds-dropdown__item';
      itemEl.dataset.index = String(index);
      itemEl.setAttribute('role', 'option');
      itemEl.disabled = item.disabled === true;
      if (item.icon) {
        const iconEl = document.createElement('span');
        iconEl.className = 'ds-dropdown__item-icon';
        iconEl.innerHTML = getIconHtml(item.icon);
        itemEl.appendChild(iconEl);
      }
      const labelEl = document.createElement('span');
      labelEl.textContent = String(item.text ?? item.label ?? '');
      itemEl.appendChild(labelEl);
      menuEl.appendChild(itemEl);
    });
    listeners.on(menuEl, 'click', event => {
      const itemEl = event.target.closest?.('.ds-dropdown__item');
      if (!itemEl || !menuEl.contains(itemEl)) {return;}
      event.stopPropagation();
      _selectItem(Number(itemEl.dataset.index));
    });
  }

  if (trigger === 'click') {
    listeners.on(triggerEl, 'click', onTriggerClick);
  } else {
    listeners.on(wrapperEl, 'mouseenter', open);
    listeners.on(wrapperEl, 'mouseleave', () => close());
    listeners.on(wrapperEl, 'focusin', open);
    listeners.on(wrapperEl, 'focusout', event => {
      if (!wrapperEl.contains(event.relatedTarget)) {close();}
    });
  }

  const api = {
    get element() { return container; },
    open,
    close,
    toggle,
    isOpen: () => state.isOpen,
    destroy() {
      if (destroyed) {return;}
      close();
      destroyed = true;
      releaseKeydown?.();
      releaseKeydown = null;
      openListeners.destroy();
      listeners.destroy();
      instance.destroy();
      popupPortal?.destroy();
      Object.freeze(api);
    },
  };

  return api;
}
