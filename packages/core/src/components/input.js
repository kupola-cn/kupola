// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Input component built on the 2.0 reactive core.
 *
 * Reuses the existing `ds-input*` CSS classes for styling.
 *
 * ```js
 * import { Input } from '@kupola/core/components/input';
 *
 * const view = Input({
 *   placeholder: 'Enter text...',
 *   value: '',
 *   status: 'error',
 *   onInput: (val) => console.log(val),
 * });
 * container.appendChild(view.element);
 * ```
 *
 * @module components/input
 */

import { html } from '../template.js';
import { render } from '../render.js';

/**
 * Create an Input component instance.
 *
 * @param {Object}   [options]
 * @param {string}   [options.placeholder]  Placeholder text
 * @param {string}   [options.value]        Initial value
 * @param {string}   [options.type]         Input type (text|password|number|email|tel|url)
 * @param {string}   [options.status]       Validation status (error|success|warning)
 * @param {boolean}  [options.disabled]     Disabled state
 * @param {string}   [options.name]         Input name attribute
 * @param {Function} [options.onInput]      Callback on input change
 * @param {Function} [options.onChange]     Callback on blur/change
 * @returns {{ element: DocumentFragment, getValue: Function, setValue: Function, focus: Function, destroy: Function }}
 */
export function Input(options = {}) {
  const {
    placeholder = '',
    value: initialValue = '',
    type = 'text',
    status = '',
    disabled = false,
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
    if (inputEl) inputEl.value = _value;
  }

  function focus() {
    if (inputEl) inputEl.focus();
  }

  function destroy() {
    if (inputEl) {
      inputEl.removeEventListener('input', _handleInput);
      inputEl.removeEventListener('change', _handleChange);
    }
    instance.destroy();
  }

  // ── Internal ───────────────────────────────────────────────────────────────

  function _handleInput(e) {
    _value = e.target.value;
    if (onInput) onInput(_value);
  }

  function _handleChange(e) {
    _value = e.target.value;
    if (onChange) onChange(_value);
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const statusClass = status ? ` ds-input--${status}` : '';

  const tpl = html`
    <div class="ds-input${statusClass}">
      <input type="${type}" placeholder="${placeholder}" />
    </div>
  `;

  const container = document.createDocumentFragment();
  const instance = render(tpl, container);

  const inputEl = container.querySelector('input');
  if (inputEl) {
    inputEl.value = _value;
    inputEl.disabled = disabled;
    if (name) inputEl.name = name;
    inputEl.addEventListener('input', _handleInput);
    inputEl.addEventListener('change', _handleChange);
  }

  return {
    get element() { return container; },
    getValue,
    setValue,
    focus,
    destroy,
  };
}
