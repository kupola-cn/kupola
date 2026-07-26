// SPDX-License-Identifier: MIT
/**
 * Textarea with optional autosizing and character count.
 *
 * @module components/textarea
 */

import { html } from '@kupola/platform/template';
import { render } from '@kupola/platform/render';
import { createListenerRegistry } from './listener-registry';

const RESIZE_VALUES = new Set([ 'vertical', 'horizontal', 'both', 'none' ]);

export function Textarea(options = {}) {
  const disabled = options.disabled === true;
  const readonly = options.readonly === true;
  const autosize = options.autosize === true;
  const showCount = options.showCount === true;
  const rows = Number.isFinite(Number(options.rows)) && Number(options.rows) > 0
    ? Math.floor(Number(options.rows))
    : 4;
  const maxLength = Number.isFinite(Number(options.maxlength))
    ? Math.max(0, Math.floor(Number(options.maxlength)))
    : null;
  const resize = autosize ? 'none'
    : (RESIZE_VALUES.has(options.resize) ? options.resize : 'vertical');
  const onInput = typeof options.onInput === 'function' ? options.onInput : null;
  const onChange = typeof options.onChange === 'function' ? options.onChange : null;
  const listeners = createListenerRegistry();
  let destroyed = false;

  function normalizeValue(value) {
    const text = value == null ? '' : String(value);
    return maxLength === null ? text : text.slice(0, maxLength);
  }

  let value = normalizeValue(options.value);
  const container = document.createDocumentFragment();
  const instance = render(html`
    <div class="ds-textarea-wrapper">
      <textarea class="ds-textarea"></textarea>
      ${showCount ? html`<span class="ds-textarea__count" aria-live="polite"></span>` : ''}
    </div>
  `, container);
  const root = container.querySelector('.ds-textarea-wrapper');
  const textarea = root.querySelector('.ds-textarea');
  const count = root.querySelector('.ds-textarea__count');

  textarea.value = value;
  textarea.rows = rows;
  textarea.placeholder = String(options.placeholder ?? '');
  textarea.disabled = disabled;
  textarea.readOnly = readonly;
  textarea.style.resize = resize;
  if (autosize) {textarea.style.overflowY = 'hidden';}
  if (maxLength !== null) {textarea.maxLength = maxLength;}
  if (options.name) {textarea.name = String(options.name);}

  function syncUI() {
    if (count) {
      count.textContent = maxLength === null ? String(value.length) : `${value.length}/${maxLength}`;
    }
    if (autosize) {
      textarea.style.height = 'auto';
      if (textarea.scrollHeight > 0) {textarea.style.height = `${textarea.scrollHeight}px`;}
    }
  }

  function getValue() {
    return value;
  }

  function setValue(nextValue) {
    if (destroyed) {return;}
    value = normalizeValue(nextValue);
    textarea.value = value;
    syncUI();
  }

  function focus() {
    if (!destroyed) {textarea.focus();}
  }

  function blur() {
    if (!destroyed) {textarea.blur();}
  }

  listeners.on(textarea, 'input', event => {
    value = normalizeValue(event.target.value);
    if (event.target.value !== value) {event.target.value = value;}
    syncUI();
    onInput?.(value);
  });
  listeners.on(textarea, 'change', event => {
    value = normalizeValue(event.target.value);
    if (event.target.value !== value) {event.target.value = value;}
    syncUI();
    onChange?.(value);
  });
  syncUI();

  const api = {
    get element() { return container; },
    getValue,
    setValue,
    focus,
    blur,
    destroy() {
      if (destroyed) {return;}
      destroyed = true;
      listeners.destroy();
      instance.destroy();
      Object.freeze(api);
    },
  };

  return api;
}
