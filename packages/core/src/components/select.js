// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Select component built on the 2.0 reactive core.
 *
 * Reuses the existing `ds-select-*` CSS classes for styling.
 *
 * ```js
 * import { Select } from '@kupola/core/components/select';
 *
 * const view = Select({
 *   items: [
 *     { value: 'a', text: 'Option A' },
 *     { value: 'b', text: 'Option B' },
 *   ],
 *   placeholder: 'Choose…',
 *   searchable: true,
 *   onChange: ({ value, text }) => console.log(value),
 * });
 * container.appendChild(view.element);
 * ```
 *
 * @module components/select
 */

import { html } from '../template.js';
import { render } from '../render.js';
import { t } from '../i18n.js';

/**
 * Create a Select component instance.
 *
 * @param {Object}  [options]
 * @param {string}  [options.label]          Label text (creates <label> linked to select)
 * @param {Array<{value:string, text:string}>} [options.items]      Option list
 * @param {string}  [options.placeholder]    Placeholder text
 * @param {boolean} [options.searchable]     Enable search filter
 * @param {boolean} [options.clearable]      Show clear button
 * @param {boolean} [options.multiple]       Multi-select mode
 * @param {string}  [options.value]          Initial selected value (single mode)
 * @param {string[]} [options.values]        Initial selected values (multiple mode)
 * @param {Function} [options.onChange]       Callback: ({ value, text }) => void
 * @returns {{ element: DocumentFragment, open: Function, close: Function, getValue: Function, setValue: Function, destroy: Function }}
 */
export function Select(options = {}) {
  const {
    label = '',
    items = [],
    placeholder = null,
    searchable = false,
    clearable = false,
    multiple = false,
    value: initialValue = '',
    values: initialValues = null,
    onChange = null,
  } = options;

  const _placeholder = placeholder || t('select.placeholder');
  const _id = label ? `ds-select-${Math.random().toString(36).slice(2, 8)}` : '';
  const _hasLabel = !!label;

  let _isOpen = false;
  let _focusIndex = -1;
  let _searchQuery = '';
  let _selectedValues = new Set();

  // Initialize selected values
  if (multiple && initialValues) {
    _selectedValues = new Set(initialValues);
  } else if (!multiple && initialValue) {
    _selectedValues.add(initialValue);
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  function _filteredItems() {
    if (!_searchQuery) {return items;}
    const q = _searchQuery.toLowerCase();
    return items.filter((item) => item.text.toLowerCase().includes(q));
  }

  function _getDisplayText() {
    if (_selectedValues.size === 0) {return '';}
    if (multiple) {return '';}
    const sel = items.find((i) => _selectedValues.has(i.value));
    return sel ? sel.text : '';
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  function open() {
    if (_isOpen) {return;}
    _isOpen = true;
    _searchQuery = '';
    _focusIndex = -1;
    wrapEl.classList.add('is-open');
    if (searchEl) {
      searchEl.value = '';
      searchEl.focus();
    }
    _renderOptions();
  }

  function close() {
    if (!_isOpen) {return;}
    _isOpen = false;
    _searchQuery = '';
    _focusIndex = -1;
    wrapEl.classList.remove('is-open');
    _clearFocus();
  }

  function toggle() {
    _isOpen ? close() : open();
  }

  function getValue() {
    if (multiple) {return [ ..._selectedValues ];}
    return [ ..._selectedValues ][0] || '';
  }

  function setValue(val) {
    _selectedValues.clear();
    if (multiple && Array.isArray(val)) {
      val.forEach((v) => _selectedValues.add(v));
    } else if (val) {
      _selectedValues.add(val);
    }
    _updateDisplay();
    _renderOptions();
  }

  // ── Internal ───────────────────────────────────────────────────────────────

  function _selectItem(item) {
    if (multiple) {
      if (_selectedValues.has(item.value)) {
        _selectedValues.delete(item.value);
      } else {
        _selectedValues.add(item.value);
      }
    } else {
      _selectedValues.clear();
      _selectedValues.add(item.value);
    }

    if (onChange) {
      onChange({ value: item.value, text: item.text, values: [ ..._selectedValues ] });
    }

    _updateDisplay();
    _renderOptions();

    if (!multiple) {
      close();
    }
  }

  function _updateDisplay() {
    if (!valueEl) {return;}
    const text = _getDisplayText();
    if (text) {
      valueEl.textContent = text;
      valueEl.classList.remove('ds-select__value--placeholder');
    } else if (multiple && _selectedValues.size > 0) {
      valueEl.textContent = `${_selectedValues.size} selected`;
      valueEl.classList.remove('ds-select__value--placeholder');
    } else {
      valueEl.textContent = _placeholder;
      valueEl.classList.add('ds-select__value--placeholder');
    }
  }

  function _renderOptions() {
    if (!menuEl) {return;}
    const filtered = _filteredItems();
    // Clear existing options (keep search input if present)
    const existingItems = menuEl.querySelectorAll('.ds-select__item');
    existingItems.forEach((el) => el.remove());

    // Create new option elements directly
    filtered.forEach((item, idx) => {
      const btn = document.createElement('button');
      btn.className = 'ds-select__item';
      if (_selectedValues.has(item.value)) {btn.classList.add('is-active');}
      if (idx === _focusIndex) {btn.classList.add('is-focused');}
      btn.setAttribute('data-value', item.value);
      btn.textContent = item.text;
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        _selectItem(item);
      });
      menuEl.appendChild(btn);
    });
  }

  // ── Focus management ───────────────────────────────────────────────────────

  function _clearFocus() {
    if (!menuEl) {return;}
    const opts = menuEl.querySelectorAll('.ds-select__item');
    opts.forEach((el) => el.classList.remove('is-focused'));
  }

  function _setFocus(idx) {
    const filtered = _filteredItems();
    if (filtered.length === 0) {return;}
    _clearFocus();
    _focusIndex = ((idx % filtered.length) + filtered.length) % filtered.length;
    if (!menuEl) {return;}
    const opts = menuEl.querySelectorAll('.ds-select__item');
    if (opts[_focusIndex]) {opts[_focusIndex].classList.add('is-focused');}
  }

  // ── Event handlers ─────────────────────────────────────────────────────────

  const onTriggerClick = (e) => {
    e.stopPropagation();
    toggle();
  };

  const onDocumentClick = (e) => {
    if (!_isOpen) {return;}
    if (wrapEl && !wrapEl.contains(e.target)) {
      close();
    }
  };
  document.addEventListener('click', onDocumentClick);

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
      _setFocus(_filteredItems().length - 1);
      break;
    case 'Enter':
      e.preventDefault();
      {
        const filtered = _filteredItems();
        if (_focusIndex >= 0 && _focusIndex < filtered.length) {
          _selectItem(filtered[_focusIndex]);
        }
      }
      break;
    case 'Escape':
    case 'Tab':
      e.preventDefault();
      close();
      break;
    }
  };
  document.addEventListener('keydown', onKeydown);

  // Search input handler
  const onSearchInput = (e) => {
    _searchQuery = e.target.value;
    _focusIndex = -1;
    _renderOptions();
  };

  // Clear button handler
  const onClearClick = (e) => {
    e.stopPropagation();
    _selectedValues.clear();
    _updateDisplay();
    _renderOptions();
    if (onChange) {
      onChange({ value: '', text: '', values: [] });
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  const displayText = _getDisplayText();

  // Note: no inline event handlers on items/search/clear — they are bound
  // after render via addEventListener because nested template functions
  // are serialized as static text by the render system.

  const tpl = html`
    ${_hasLabel ? html`<label class="ds-form-label" for="${_id}">${label}</label>` : ''}
    <div class="ds-select" ${!label ? 'aria-label="Select"' : ''}>
      <div class="ds-select__trigger" id="${_id}">
        <span class="ds-select__value${!displayText ? ' ds-select__value--placeholder' : ''}">${displayText || _placeholder}</span>
        ${clearable ? html`<button class="ds-select__clear">&times;</button>` : ''}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </div>
      <div class="ds-select__menu">
        ${searchable ? html`<div class="ds-select__search"><input class="ds-select__search-input" placeholder="Search..." /></div>` : ''}
        ${items.map((item) => {
    const isActive = _selectedValues.has(item.value);
    return html`<button class="ds-select__item${isActive ? ' is-active' : ''}" data-value="${item.value}">${item.text}</button>`;
  })}
      </div>
    </div>
  `;

  const container = document.createDocumentFragment();
  const instance = render(tpl, container);

  // Grab references
  const wrapEl = container.querySelector('.ds-select');
  const valueEl = container.querySelector('.ds-select__value');
  const menuEl = container.querySelector('.ds-select__menu');
  const searchEl = container.querySelector('.ds-select__search-input');

  // Bind event handlers after render
  const triggerEl = container.querySelector('.ds-select__trigger');
  if (triggerEl) {triggerEl.addEventListener('click', onTriggerClick);}

  if (searchEl) {searchEl.addEventListener('input', onSearchInput);}

  const clearBtnEl = container.querySelector('.ds-select__clear');
  if (clearBtnEl) {clearBtnEl.addEventListener('click', onClearClick);}

  // Bind initial option clicks
  _bindInitialOptionClicks();

  function _bindInitialOptionClicks() {
    if (!menuEl) {return;}
    const optionEls = menuEl.querySelectorAll('.ds-select__item');
    optionEls.forEach((el, i) => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        _selectItem(items[i]);
      });
    });
  }

  return {
    get element() { return container; },
    open,
    close,
    toggle,
    getValue,
    setValue,
    destroy() {
      document.removeEventListener('click', onDocumentClick);
      document.removeEventListener('keydown', onKeydown);
      instance.destroy();
    },
  };
}
