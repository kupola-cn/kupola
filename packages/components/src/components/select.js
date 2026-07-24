// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Select component built on the 3.0 reactive core.
 *
 * Reuses the existing `ds-select-*` CSS classes for styling.
 *
 * ```js
 * import { Select } from '@kupola/components/select';
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

import { html } from '@kupola/platform/template';
import { render } from '@kupola/platform/render';
import { t } from '@kupola/platform/i18n';
import { reactive, watch } from '@kupola/core';
import { getIconHtml } from './icon-helper';

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

  const state = reactive({
    isOpen: false,
    focusIndex: -1,
    searchQuery: '',
    selectedValues: [],
  });

  if (multiple && initialValues) {
    state.selectedValues = [ ...initialValues ];
  } else if (!multiple && initialValue) {
    state.selectedValues = [ initialValue ];
  }

  let wrapEl = null;
  let valueEl = null;
  let menuEl = null;
  let searchEl = null;

  // ── Helpers ────────────────────────────────────────────────────────────────

  function _filteredItems() {
    if (!state.searchQuery) {return items;}
    const q = state.searchQuery.toLowerCase();
    return items.filter((item) => item.text.toLowerCase().includes(q));
  }

  function _getDisplayText() {
    if (state.selectedValues.length === 0) {return '';}
    if (multiple) {return '';}
    const sel = items.find((i) => state.selectedValues.includes(i.value));
    return sel ? sel.text : '';
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  function open() {
    state.isOpen = true;
    state.searchQuery = '';
    state.focusIndex = -1;
    if (searchEl) {
      searchEl.value = '';
      searchEl.focus();
    }
    _renderOptions();
    if (wrapEl) {
      wrapEl.classList.add('is-open');
      wrapEl.setAttribute('aria-expanded', 'true');
    }
  }

  function close() {
    state.isOpen = false;
    state.searchQuery = '';
    state.focusIndex = -1;
    _clearFocus();
    if (wrapEl) {
      wrapEl.classList.remove('is-open');
      wrapEl.setAttribute('aria-expanded', 'false');
    }
  }

  function toggle() {
    if (state.isOpen) {
      close();
    } else {
      open();
    }
  }

  function getValue() {
    if (multiple) {return [ ...state.selectedValues ];}
    return [ ...state.selectedValues ][0] || '';
  }

  function setValue(val) {
    state.selectedValues = [];
    if (multiple && Array.isArray(val)) {
      state.selectedValues = [ ...val ];
    } else if (val) {
      state.selectedValues = [ val ];
    }
    _updateDisplay();
    _renderOptions();
  }

  // ── Internal ───────────────────────────────────────────────────────────────

  function _selectItem(item) {
    if (multiple) {
      const idx = state.selectedValues.indexOf(item.value);
      if (idx >= 0) {
        state.selectedValues = state.selectedValues.filter((v) => v !== item.value);
      } else {
        state.selectedValues = [ ...state.selectedValues, item.value ];
      }
    } else {
      state.selectedValues = [ item.value ];
    }

    if (onChange) {
      onChange({ value: item.value, text: item.text, values: [ ...state.selectedValues ] });
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
    } else if (multiple && state.selectedValues.length > 0) {
      valueEl.textContent = `${state.selectedValues.length} selected`;
      valueEl.classList.remove('ds-select__value--placeholder');
    } else {
      valueEl.textContent = _placeholder;
      valueEl.classList.add('ds-select__value--placeholder');
    }
  }

  function _renderOptions() {
    if (!menuEl) {return;}
    const filtered = _filteredItems();
    const existingItems = menuEl.querySelectorAll('.ds-select__item');
    existingItems.forEach((el) => el.remove());

    filtered.forEach((item, idx) => {
      const btn = document.createElement('button');
      btn.className = 'ds-select__item';
      if (state.selectedValues.includes(item.value)) {btn.classList.add('is-active');}
      if (idx === state.focusIndex) {btn.classList.add('is-focused');}
      btn.setAttribute('data-value', item.value);
      btn.setAttribute('role', 'option');
      btn.setAttribute('aria-selected', state.selectedValues.includes(item.value));
      btn.setAttribute('aria-posinset', idx + 1);
      btn.setAttribute('aria-setsize', filtered.length);
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
    state.focusIndex = ((idx % filtered.length) + filtered.length) % filtered.length;
    if (!menuEl) {return;}
    const opts = menuEl.querySelectorAll('.ds-select__item');
    if (opts[state.focusIndex]) {opts[state.focusIndex].classList.add('is-focused');}
  }

  // ── Event handlers ─────────────────────────────────────────────────────────

  const onTriggerClick = (e) => {
    e.stopPropagation();
    toggle();
  };

  const onDocumentClick = (e) => {
    if (!state.isOpen) {return;}
    if (wrapEl && !wrapEl.contains(e.target)) {
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
      _setFocus(_filteredItems().length - 1);
      break;
    case 'Enter':
      e.preventDefault();
      {
        const filtered = _filteredItems();
        if (state.focusIndex >= 0 && state.focusIndex < filtered.length) {
          _selectItem(filtered[state.focusIndex]);
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

  const onSearchInput = (e) => {
    state.searchQuery = e.target.value;
    state.focusIndex = -1;
    _renderOptions();
  };

  const onClearClick = (e) => {
    e.stopPropagation();
    state.selectedValues = [];
    _updateDisplay();
    _renderOptions();
    if (onChange) {
      onChange({ value: '', text: '', values: [] });
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  const displayText = _getDisplayText();

  const tpl = html`
    ${_hasLabel ? html`<label class="ds-form-label" for="${_id}">${label}</label>` : ''}
    <div class="ds-select" role="combobox" aria-haspopup="listbox" aria-expanded="false" aria-label="${_hasLabel ? label : 'Select'}" aria-controls="ds-select-menu-${_id}">
      <div class="ds-select__trigger" id="${_id}">
        <span class="ds-select__value${!displayText ? ' ds-select__value--placeholder' : ''}" aria-live="polite">${displayText || _placeholder}</span>
        ${clearable ? html`<button class="ds-select__clear" aria-label="Clear selection">&times;</button>` : ''}
        ${getIconHtml('chevron-down')}
      </div>
      <div class="ds-select__menu" role="listbox" id="ds-select-menu-${_id}" aria-multiselectable="${multiple}">
        ${searchable ? html`<div class="ds-select__search"><input class="ds-select__search-input" placeholder="Search..." /></div>` : ''}
        ${items.map((item, index) => {
    const isActive = state.selectedValues.includes(item.value);
    return html`<button class="ds-select__item${isActive ? ' is-active' : ''}" data-value="${item.value}" role="option" aria-selected="${isActive}" aria-posinset="${index + 1}" aria-setsize="${items.length}">${item.text}</button>`;
  })}
      </div>
    </div>
  `;

  const container = document.createDocumentFragment();
  const instance = render(tpl, container);

  wrapEl = container.querySelector('.ds-select');
  valueEl = container.querySelector('.ds-select__value');
  menuEl = container.querySelector('.ds-select__menu');
  searchEl = container.querySelector('.ds-select__search-input');

  const triggerEl = container.querySelector('.ds-select__trigger');
  if (triggerEl) {triggerEl.addEventListener('click', onTriggerClick);}

  if (searchEl) {searchEl.addEventListener('input', onSearchInput);}

  const clearBtnEl = container.querySelector('.ds-select__clear');
  if (clearBtnEl) {clearBtnEl.addEventListener('click', onClearClick);}

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
  _bindInitialOptionClicks();

  watch(() => state.isOpen, (isOpen) => {
    if (wrapEl) {
      if (isOpen) {
        wrapEl.classList.add('is-open');
      } else {
        wrapEl.classList.remove('is-open');
      }
      wrapEl.setAttribute('aria-expanded', String(isOpen));
    }
  });

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