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

import { html } from '@kupola/core';
import { render } from '@kupola/core';
import { reactive, watch } from '@kupola/core';
import { getIconHtml } from './icon-helper';

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
  const {
    items = [],
    trigger = 'click',
    closeOnClick = true,
    onSelect = null,
    placeholder = 'Select...',
  } = options;

  const state = reactive({
    isOpen: false,
    focusIndex: -1,
  });

  let wrapperEl = null;
  let menuEl = null;
  let triggerEl = null;

  // ── Public API ─────────────────────────────────────────────────────────────

  function open() {
    state.isOpen = true;
    if (menuEl) {menuEl.classList.add('is-open');}
    if (triggerEl) {triggerEl.setAttribute('aria-expanded', 'true');}
  }

  function close() {
    state.isOpen = false;
    state.focusIndex = -1;
    _clearFocus();
    if (menuEl) {menuEl.classList.remove('is-open');}
    if (triggerEl) {triggerEl.setAttribute('aria-expanded', 'false');}
  }

  function toggle() {
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

  function _setFocus(idx) {
    if (!menuEl) {return;}
    const items_ = menuEl.querySelectorAll('.ds-dropdown__item');
    if (items_.length === 0) {return;}
    _clearFocus();
    state.focusIndex = ((idx % items_.length) + items_.length) % items_.length;
    items_[state.focusIndex].classList.add('is-focused');
  }

  // ── Item selection ─────────────────────────────────────────────────────────

  function _selectItem(idx) {
    if (idx < 0 || idx >= items.length) {return;}
    const item = items[idx];
    if (onSelect) {
      onSelect({ value: item.value, text: item.text, item });
    }
    if (closeOnClick) {
      close();
    }
  }

  // ── Event handlers ─────────────────────────────────────────────────────────

  const onTriggerClick = (e) => {
    e.stopPropagation();
    if (trigger === 'click') {
      toggle();
    }
  };

  const onItemClick = (idx) => (e) => {
    e.stopPropagation();
    _selectItem(idx);
  };

  const onDocumentClick = (e) => {
    if (!state.isOpen) {return;}
    if (wrapperEl && !wrapperEl.contains(e.target)) {
      close();
    }
  };
  document.addEventListener('click', onDocumentClick);

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
      if (state.focusIndex >= 0) {_selectItem(state.focusIndex);}
      break;
    case 'Escape':
    case 'Tab':
      e.preventDefault();
      close();
      break;
    }
  };
  document.addEventListener('keydown', onKeydown);

  // ── Render ─────────────────────────────────────────────────────────────────

  const itemTemplates = items.map(
    (item) =>
      html`<button class="ds-dropdown__item" data-value="${item.value}" role="option">${item.text}</button>`,
  );

  const tpl = html`
    <div class="ds-dropdown">
      <button class="ds-dropdown__trigger" onclick="${onTriggerClick}" aria-haspopup="listbox" aria-expanded="false">
        <span>${placeholder}</span>
        ${getIconHtml('chevron-down')}
      </button>
      <div class="ds-dropdown__menu" role="listbox">${itemTemplates}</div>
    </div>
  `;

  const container = document.createDocumentFragment();
  const instance = render(tpl, container);

  wrapperEl = container.querySelector('.ds-dropdown');
  menuEl = container.querySelector('.ds-dropdown__menu');
  triggerEl = container.querySelector('.ds-dropdown__trigger');

  if (menuEl) {
    const itemEls = menuEl.querySelectorAll('.ds-dropdown__item');
    itemEls.forEach((el, i) => {
      el.addEventListener('click', onItemClick(i));
    });
  }

  watch(() => state.isOpen, (isOpen) => {
    if (menuEl) {
      if (isOpen) {
        menuEl.classList.add('is-open');
      } else {
        menuEl.classList.remove('is-open');
      }
    }
    if (triggerEl) {
      triggerEl.setAttribute('aria-expanded', String(isOpen));
    }
  });

  return {
    get element() { return container; },
    open,
    close,
    toggle,
    destroy() {
      document.removeEventListener('click', onDocumentClick);
      document.removeEventListener('keydown', onKeydown);
      instance.destroy();
    },
  };
}