// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Dropdown component built on the 2.0 reactive core.
 *
 * Reuses the existing `ds-dropdown-*` CSS classes for styling.
 *
 * ```js
 * import { Dropdown } from '@kupola/core/components/dropdown';
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

import { html } from '../template.js';
import { render } from '../render.js';

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

  let _isOpen = false;
  let _focusIndex = -1;

  // ── Public API ─────────────────────────────────────────────────────────────

  function open() {
    if (_isOpen) {return;}
    _isOpen = true;
    if (menuEl) {menuEl.classList.add('is-open');}
    if (triggerEl) {triggerEl.setAttribute('aria-expanded', 'true');}
  }

  function close() {
    if (!_isOpen) {return;}
    _isOpen = false;
    _focusIndex = -1;
    if (menuEl) {menuEl.classList.remove('is-open');}
    if (triggerEl) {triggerEl.setAttribute('aria-expanded', 'false');}
    _clearFocus();
  }

  function toggle() {
    _isOpen ? close() : open();
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
    _focusIndex = ((idx % items_.length) + items_.length) % items_.length;
    items_[_focusIndex].classList.add('is-focused');
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

  // Trigger click
  const onTriggerClick = (e) => {
    e.stopPropagation();
    if (trigger === 'click') {
      toggle();
    }
  };

  // Item click
  const onItemClick = (idx) => (e) => {
    e.stopPropagation();
    _selectItem(idx);
  };

  // Click outside
  const onDocumentClick = (e) => {
    if (!_isOpen) {return;}
    if (wrapperEl && !wrapperEl.contains(e.target)) {
      close();
    }
  };
  document.addEventListener('click', onDocumentClick);

  // Keyboard navigation
  const onKeydown = (e) => {
    if (!_isOpen) {return;}

    switch (e.key) {
    case 'ArrowDown':
      e.preventDefault();
      _setFocus(_focusIndex + 1);
      break;
    case 'ArrowUp':
      e.preventDefault();
      _setFocus(_focusIndex - 1);
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
      if (_focusIndex >= 0) {_selectItem(_focusIndex);}
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
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      <div class="ds-dropdown__menu" role="listbox">${itemTemplates}</div>
    </div>
  `;

  const container = document.createDocumentFragment();
  const instance = render(tpl, container);

  // Grab references to key elements
  const wrapperEl = container.querySelector('.ds-dropdown');
  const menuEl = container.querySelector('.ds-dropdown__menu');
  const triggerEl = container.querySelector('.ds-dropdown__trigger');

  // Bind item click handlers (after render, directly on DOM)
  if (menuEl) {
    const itemEls = menuEl.querySelectorAll('.ds-dropdown__item');
    itemEls.forEach((el, i) => {
      el.addEventListener('click', onItemClick(i));
    });
  }

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
