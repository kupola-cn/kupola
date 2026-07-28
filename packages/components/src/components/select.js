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
import { getIconTemplate } from './icon-helper';
import { createListenerRegistry } from './listener-registry';
import { registerOverlayKeydown } from './overlay-stack';
import { createPopupPortal, positionPopup } from './popup-position';

let selectId = 0;

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
 * @returns {{ element: DocumentFragment, open: Function, close: Function,
 *   getValue: Function, setValue: Function, destroy: Function }}
 */
export function Select(options = {}) {
  const config = options && typeof options === 'object' ? options : {};
  const label = config.label ?? '';
  const items = Array.isArray(config.items)
    ? config.items
    : (Array.isArray(config.options) ? config.options : []);
  const placeholder = config.placeholder ?? null;
  const searchable = config.searchable === true;
  const clearable = config.clearable === true;
  const multiple = config.multiple === true;
  const disabled = config.disabled === true;
  const onChange = typeof config.onChange === 'function' ? config.onChange : null;

  const _placeholder = placeholder || t('select.placeholder');
  const instanceId = ++selectId;
  const _id = `ds-select-${instanceId}`;
  const menuId = `ds-select-menu-${instanceId}`;
  const _hasLabel = !!label;

  const state = {
    isOpen: false,
    focusIndex: -1,
    searchQuery: '',
    selectedValues: [],
  };

  const initialValue = config.values ?? config.value;
  if (multiple && Array.isArray(initialValue)) {
    state.selectedValues = [ ...initialValue ];
  } else if (multiple && initialValue !== undefined && initialValue !== null && initialValue !== '') {
    state.selectedValues = [ initialValue ];
  } else if (!multiple && Array.isArray(initialValue)) {
    state.selectedValues = initialValue.length > 0 ? [ initialValue[0] ] : [];
  } else if (!multiple && initialValue !== undefined && initialValue !== null && initialValue !== '') {
    state.selectedValues = [ initialValue ];
  }

  let wrapEl = null;
  let valueEl = null;
  let menuEl = null;
  let searchEl = null;
  let releaseKeydown = null;
  let destroyed = false;
  const listeners = createListenerRegistry();
  const openListeners = createListenerRegistry();
  let popupPortal = null;

  // ── Helpers ────────────────────────────────────────────────────────────────

  function _filteredItems() {
    const indexedItems = items
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => item && typeof item === 'object');
    if (!state.searchQuery) {return indexedItems;}
    const q = state.searchQuery.toLowerCase();
    return indexedItems.filter(({ item }) => _itemText(item).toLowerCase().includes(q));
  }

  function _itemText(item) {
    return String(item?.text ?? item?.label ?? '');
  }

  function _getDisplayText() {
    if (state.selectedValues.length === 0) {return '';}
    if (multiple) {return '';}
    const selected = items.find(item => state.selectedValues.includes(item?.value));
    return selected ? _itemText(selected) : '';
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  function open() {
    if (destroyed || disabled || state.isOpen) {return;}
    state.isOpen = true;
    state.searchQuery = '';
    state.focusIndex = -1;
    if (searchEl) {
      searchEl.value = '';
      searchEl.focus();
    }
    _renderOptions();
    popupPortal?.mount();
    positionPopup(menuEl, triggerEl);
    if (wrapEl) {
      wrapEl.classList.add('is-open');
    }
    triggerEl?.setAttribute('aria-expanded', 'true');
    const ownerDocument = triggerEl?.ownerDocument || document;
    openListeners.on(ownerDocument, 'click', onDocumentClick);
    openListeners.on(ownerDocument.defaultView || window, 'resize', () => positionPopup(menuEl, triggerEl));
    openListeners.on(ownerDocument.defaultView || window, 'scroll', () => positionPopup(menuEl, triggerEl), true);
    releaseKeydown = registerOverlayKeydown(onKeydown);
  }

  function close(restoreFocus = false) {
    if (destroyed || !state.isOpen) {return;}
    state.isOpen = false;
    state.searchQuery = '';
    state.focusIndex = -1;
    _clearFocus();
    if (wrapEl) {
      wrapEl.classList.remove('is-open');
    }
    triggerEl?.setAttribute('aria-expanded', 'false');
    popupPortal?.restore();
    openListeners.clear();
    releaseKeydown?.();
    releaseKeydown = null;
    if (restoreFocus) {triggerEl?.focus();}
  }

  function toggle() {
    if (destroyed || disabled) {return;}
    if (state.isOpen) {
      close();
    } else {
      open();
    }
  }

  function getValue() {
    if (multiple) {return [ ...state.selectedValues ];}
    return [ ...state.selectedValues ][0] ?? '';
  }

  function setValue(val, options = {}) {
    if (destroyed) {return;}
    state.selectedValues = [];
    if (multiple && Array.isArray(val)) {
      state.selectedValues = [ ...val ];
    } else if (val !== undefined && val !== null && val !== '') {
      state.selectedValues = [ val ];
    }
    _updateDisplay();
    _renderOptions();
    if (options?.silent !== true && onChange) {
      const values = [ ...state.selectedValues ];
      const value = multiple ? (values[values.length - 1] ?? '') : (values[0] ?? '');
      const selectedItem = items.find(item => Object.is(item.value, value));
      onChange({
        value,
        text: selectedItem ? _itemText(selectedItem) : '',
        values,
      });
    }
  }

  // ── Internal ───────────────────────────────────────────────────────────────

  function _selectItem(item) {
    if (destroyed || disabled || !item || item.disabled) {return;}
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
      onChange({ value: item.value, text: _itemText(item), values: [ ...state.selectedValues ] });
    }

    _updateDisplay();
    _syncOptionStates();

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
    if (!menuEl || destroyed) {return;}
    const filtered = _filteredItems();
    const existingItems = menuEl.querySelectorAll('.ds-select__item');
    existingItems.forEach((el) => el.remove());

    filtered.forEach(({ item, index }, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ds-select__item';
      if (state.selectedValues.includes(item.value)) {btn.classList.add('is-active');}
      if (idx === state.focusIndex) {btn.classList.add('is-focused');}
      btn.dataset.index = String(index);
      btn.dataset.value = String(item.value ?? '');
      btn.setAttribute('role', 'option');
      btn.disabled = item?.disabled === true;
      btn.setAttribute('aria-selected', state.selectedValues.includes(item.value));
      btn.setAttribute('aria-posinset', idx + 1);
      btn.setAttribute('aria-setsize', filtered.length);
      btn.textContent = _itemText(item);
      menuEl.appendChild(btn);
    });
  }

  function _syncOptionStates() {
    if (!menuEl) {return;}
    menuEl.querySelectorAll('.ds-select__item').forEach((optionEl) => {
      const item = items[Number(optionEl.dataset.index)];
      const selected = Boolean(item && state.selectedValues.includes(item.value));
      optionEl.classList.toggle('is-active', selected);
      optionEl.setAttribute('aria-selected', String(selected));
    });
  }

  // ── Focus management ───────────────────────────────────────────────────────

  function _clearFocus() {
    if (!menuEl) {return;}
    const opts = menuEl.querySelectorAll('.ds-select__item');
    opts.forEach((el) => el.classList.remove('is-focused'));
  }

  function _setFocus(idx) {
    const options_ = menuEl?.querySelectorAll('.ds-select__item:not(:disabled)') || [];
    if (options_.length === 0) {return;}
    _clearFocus();
    state.focusIndex = ((idx % options_.length) + options_.length) % options_.length;
    options_[state.focusIndex].classList.add('is-focused');
    options_[state.focusIndex].focus();
  }

  // ── Event handlers ─────────────────────────────────────────────────────────

  const onTriggerClick = (e) => {
    e.stopPropagation();
    toggle();
  };

  const onTriggerKeydown = (event) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      event.stopPropagation();
      open();
      _setFocus(event.key === 'ArrowDown' ? 0 : -1);
    }
  };

  const onDocumentClick = (e) => {
    if (!state.isOpen) {return;}
    if (wrapEl && !wrapEl.contains(e.target) && !menuEl?.contains(e.target)) {
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
      _setFocus(-1);
      break;
    case 'Enter':
      e.preventDefault();
      {
        const focused = menuEl?.querySelectorAll('.ds-select__item:not(:disabled)')[state.focusIndex];
        if (focused) {
          _selectItem(items[Number(focused.dataset.index)]);
        }
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
  const onSearchInput = (e) => {
    state.searchQuery = e.target.value;
    state.focusIndex = -1;
    _renderOptions();
  };

  const onClearClick = (e) => {
    e.stopPropagation();
    if (destroyed || disabled) {return;}
    state.selectedValues = [];
    _updateDisplay();
    _renderOptions();
    if (onChange) {
      onChange({ value: '', text: '', values: [] });
    }
  };

  const onOptionClick = (e) => {
    const optionEl = e.target.closest('.ds-select__item');
    if (!optionEl || !menuEl?.contains(optionEl)) {return;}
    const item = items[Number(optionEl.dataset.index)];
    if (!item) {return;}
    e.stopPropagation();
    _selectItem(item);
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  const displayText = _getDisplayText();

  const tpl = html`
    ${_hasLabel ? html`<label class="ds-form-label" for="${_id}">${label}</label>` : ''}
    <div class="ds-select${disabled ? ' is-disabled' : ''}">
      <div class="ds-select__trigger" id="${_id}" role="combobox"
        tabindex="${disabled ? '-1' : '0'}" aria-haspopup="listbox" aria-expanded="false"
        aria-label="${_hasLabel ? label : 'Select'}"
        aria-controls="${menuId}" aria-disabled="${disabled}">
        <span class="ds-select__value${!displayText ? ' ds-select__value--placeholder' : ''}"
          aria-live="polite">${displayText || _placeholder}</span>
        ${clearable
    ? html`<button class="ds-select__clear" type="button" aria-label="Clear selection"
          ${disabled ? 'disabled' : ''}>&times;</button>`
    : ''}
        ${getIconTemplate('chevron-down')}
      </div>
      <div class="ds-select__menu" role="listbox" id="${menuId}"
        aria-multiselectable="${multiple}">
        ${searchable
    ? html`<div class="ds-select__search">
          <input class="ds-select__search-input" placeholder="Search..." />
        </div>`
    : ''}
      </div>
    </div>
  `;

  const container = document.createDocumentFragment();
  const instance = render(tpl, container);

  wrapEl = container.querySelector('.ds-select');
  valueEl = container.querySelector('.ds-select__value');
  menuEl = container.querySelector('.ds-select__menu');
  searchEl = container.querySelector('.ds-select__search-input');
  popupPortal = createPopupPortal(menuEl, wrapEl);

  const triggerEl = container.querySelector('.ds-select__trigger');
  if (triggerEl) {listeners.on(triggerEl, 'click', onTriggerClick);}
  if (triggerEl) {listeners.on(triggerEl, 'keydown', onTriggerKeydown);}

  if (searchEl) {listeners.on(searchEl, 'input', onSearchInput);}

  const clearBtnEl = container.querySelector('.ds-select__clear');
  if (clearBtnEl) {listeners.on(clearBtnEl, 'click', onClearClick);}
  if (menuEl) {listeners.on(menuEl, 'click', onOptionClick);}

  _renderOptions();

  return {
    get element() { return container; },
    open,
    close,
    toggle,
    getValue,
    setValue,
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
    },
  };
}
