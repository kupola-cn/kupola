// SPDX-License-Identifier: MIT
/**
 * Text input with normalized state and complete public controls.
 *
 * @module components/input
 */

import { html } from '@kupola/platform/template';
import { render, isTemplateResultLike } from '@kupola/platform/render';
import { getIconTemplate } from './icon-helper';
import { createListenerRegistry } from './listener-registry';

const INPUT_TYPES = new Set([ 'text', 'password', 'email', 'number', 'tel', 'url', 'search' ]);
const INPUT_STATUSES = new Set([ 'error', 'success', 'warning' ]);

export function Input(options = {}) {
  const type = INPUT_TYPES.has(options.type) ? options.type : 'text';
  const status = INPUT_STATUSES.has(options.status) ? options.status : '';
  const disabled = options.disabled === true;
  const readonly = options.readonly === true;
  const clearable = options.clearable === true;
  const maxLength = Number.isFinite(Number(options.maxlength))
    ? Math.max(0, Math.floor(Number(options.maxlength)))
    : null;
  const prefix = isTemplateResultLike(options.prefix)
    ? options.prefix
    : (options.prefix ? String(options.prefix) : null);
  const suffix = isTemplateResultLike(options.suffix)
    ? options.suffix
    : (options.suffix ? String(options.suffix) : null);
  const onInput = typeof options.onInput === 'function' ? options.onInput : null;
  const onChange = typeof options.onChange === 'function' ? options.onChange : null;
  const onFocus = typeof options.onFocus === 'function' ? options.onFocus : null;
  const onBlur = typeof options.onBlur === 'function' ? options.onBlur : null;
  const listeners = createListenerRegistry();
  let destroyed = false;

  function normalizeValue(value) {
    const text = value == null ? '' : String(value);
    return maxLength === null ? text : text.slice(0, maxLength);
  }

  let value = normalizeValue(options.value);
  const statusClass = status ? ` ds-input--${status}` : '';
  const container = document.createDocumentFragment();
  const instance = render(html`
    <div class="ds-input${statusClass}">
      ${prefix ? html`<span class="ds-input__prefix">${prefix}</span>` : ''}
      <input type="${type}" />
      ${suffix ? html`<span class="ds-input__suffix">${suffix}</span>` : ''}
      ${clearable ? html`
        <button class="ds-input__clear" type="button" aria-label="Clear input">
          ${getIconTemplate('x')}
        </button>
      ` : ''}
    </div>
  `, container);
  const root = container.querySelector('.ds-input');
  const input = root.querySelector('input');
  const clearButton = root.querySelector('.ds-input__clear');

  input.value = value;
  input.placeholder = String(options.placeholder ?? '');
  input.disabled = disabled;
  input.readOnly = readonly;
  if (maxLength !== null) {input.maxLength = maxLength;}
  if (options.name) {input.name = String(options.name);}

  function syncClearButton() {
    if (!clearButton) {return;}
    clearButton.hidden = value.length === 0;
    clearButton.disabled = disabled || readonly || destroyed;
  }

  function getValue() {
    return value;
  }

  function setValue(nextValue) {
    if (destroyed) {return;}
    value = normalizeValue(nextValue);
    input.value = value;
    syncClearButton();
  }

  function clear() {
    if (destroyed || disabled || readonly || value === '') {return false;}
    value = '';
    input.value = '';
    syncClearButton();
    onInput?.('');
    onChange?.('');
    return true;
  }

  function focus() {
    if (!destroyed) {input.focus();}
  }

  function blur() {
    if (!destroyed) {input.blur();}
  }

  listeners.on(input, 'input', event => {
    value = normalizeValue(event.target.value);
    if (event.target.value !== value) {event.target.value = value;}
    syncClearButton();
    onInput?.(value);
  });
  listeners.on(input, 'change', event => {
    value = normalizeValue(event.target.value);
    if (event.target.value !== value) {event.target.value = value;}
    syncClearButton();
    onChange?.(value);
  });
  listeners.on(input, 'focus', () => onFocus?.());
  listeners.on(input, 'blur', () => onBlur?.());
  listeners.on(clearButton, 'click', () => {
    if (clear()) {input.focus();}
  });
  syncClearButton();

  const api = {
    get element() { return container; },
    getValue,
    setValue,
    focus,
    blur,
    clear,
    destroy() {
      if (destroyed) {return;}
      destroyed = true;
      listeners.destroy();
      syncClearButton();
      instance.destroy();
      Object.freeze(api);
    },
  };

  return api;
}
