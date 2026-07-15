// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Textarea component built on the 2.0 reactive core.
 *
 * Reuses the existing `ds-textarea` CSS class for styling.
 *
 * ```js
 * import { Textarea } from '@kupola/core/components/textarea';
 *
 * const view = Textarea({
 *   placeholder: 'Enter description...',
 *   value: '',
 *   rows: 4,
 *   onInput: (val) => console.log(val),
 * });
 * container.appendChild(view.element);
 * ```
 *
 * @module components/textarea
 */

import { html } from '../template.js';
import { render } from '../render.js';

/**
 * Create a Textarea component instance.
 *
 * @param {Object}   [options]
 * @param {string}   [options.placeholder]  Placeholder text
 * @param {string}   [options.value]        Initial value
 * @param {number}   [options.rows]         Number of visible rows (default 4)
 * @param {boolean}  [options.disabled]     Disabled state
 * @param {string}   [options.resize]       CSS resize value (vertical|horizontal|both|none)
 * @param {string}   [options.name]         Input name attribute
 * @param {Function} [options.onInput]      Callback on input
 * @param {Function} [options.onChange]     Callback on change/blur
 * @returns {{ element: DocumentFragment, getValue: Function, setValue: Function, focus: Function, destroy: Function }}
 */
export function Textarea(options = {}) {
  const {
    placeholder = '',
    value: initialValue = '',
    rows = 4,
    disabled = false,
    resize = 'vertical',
    name = '',
    onInput = null,
    onChange = null,
  } = options;

  let _value = initialValue;

  // ── Public API ─────────────────────────────────────────────────────────────

  function getValue() {
    return _value;
  }

  function setValue(val) {
    _value = val;
    if (textareaEl) {textareaEl.value = _value;}
  }

  function focus() {
    if (textareaEl) {textareaEl.focus();}
  }

  function destroy() {
    if (textareaEl) {
      textareaEl.removeEventListener('input', _handleInput);
      textareaEl.removeEventListener('change', _handleChange);
    }
    instance.destroy();
  }

  // ── Internal ───────────────────────────────────────────────────────────────

  function _handleInput(e) {
    _value = e.target.value;
    if (onInput) {onInput(_value);}
  }

  function _handleChange(e) {
    _value = e.target.value;
    if (onChange) {onChange(_value);}
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const tpl = html`
    <textarea class="ds-textarea" rows="${rows}"></textarea>
  `;

  const container = document.createDocumentFragment();
  const instance = render(tpl, container);

  const textareaEl = container.querySelector('.ds-textarea');
  if (textareaEl) {
    textareaEl.value = _value;
    textareaEl.placeholder = placeholder;
    textareaEl.disabled = disabled;
    textareaEl.style.resize = resize;
    if (name) {textareaEl.name = name;}
    textareaEl.addEventListener('input', _handleInput);
    textareaEl.addEventListener('change', _handleChange);
  }

  return {
    get element() { return container; },
    getValue,
    setValue,
    focus,
    destroy,
  };
}
