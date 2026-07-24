// SPDX-License-Identifier: MIT
/**
 * @kupola/core — NumberInput component built on the 2.0 reactive core.
 *
 * Reuses the existing `ds-number-input*` CSS classes for styling.
 *
 * ```js
 * import { NumberInput } from '@kupola/components/numberinput';
 *
 * const view = NumberInput({
 *   min: 0,
 *   max: 100,
 *   step: 1,
 *   value: 10,
 *   onChange: (val) => console.log(val),
 * });
 * container.appendChild(view.element);
 * ```
 *
 * @module components/numberinput
 */

import { html } from '@kupola/core/template';
import { render } from '@kupola/core/render';

/**
 * Create a NumberInput component instance.
 *
 * @param {Object}   [options]
 * @param {string}   [options.label]     Label text (creates <label> linked to input)
 * @param {string}   [options.id]        Input id (auto-generated if label is set)
 * @param {number}   [options.min]       Minimum value (default -Infinity)
 * @param {number}   [options.max]       Maximum value (default Infinity)
 * @param {number}   [options.step]      Step increment (default 1)
 * @param {number}   [options.value]     Initial value (default 0)
 * @param {boolean}  [options.disabled]  Disabled state
 * @param {Function} [options.onChange]  Callback when value changes
 * @returns {{ element: DocumentFragment, getValue: Function, setValue: Function, destroy: Function }}
 */
export function NumberInput(options = {}) {
  const {
    label = '',
    id = '',
    min = -Infinity,
    max = Infinity,
    step = 1,
    value: initialValue = 0,
    disabled = false,
    onChange = null,
  } = options;

  // Generate unique id for label association
  const _id = id || (label ? `ds-numinput-${Math.random().toString(36).slice(2, 8)}` : '');
  const _hasLabel = !!label;

  let _value = _clamp(initialValue);

  // ── Public API ─────────────────────────────────────────────────────────────

  function getValue() {
    return _value;
  }

  function setValue(val) {
    _value = _clamp(Number(val) || 0);
    if (inputEl) {inputEl.value = _value;}
    _updateButtons();
    if (onChange) {onChange(_value);}
  }

  function destroy() {
    if (inputEl) {inputEl.removeEventListener('change', _handleChange);}
    if (decBtn) {decBtn.removeEventListener('click', _decrease);}
    if (incBtn) {incBtn.removeEventListener('click', _increase);}
    instance.destroy();
  }

  // ── Internal ───────────────────────────────────────────────────────────────

  function _clamp(val) {
    return Math.max(min, Math.min(max, val));
  }

  function _handleChange(e) {
    const val = Number(e.target.value);
    if (!isNaN(val)) {
      _value = _clamp(val);
      e.target.value = _value;
      _updateButtons();
      if (onChange) {onChange(_value);}
    }
  }

  function _increase() {
    setValue(_value + step);
  }

  function _decrease() {
    setValue(_value - step);
  }

  function _updateButtons() {
    if (decBtn) {decBtn.disabled = disabled || _value <= min;}
    if (incBtn) {incBtn.disabled = disabled || _value >= max;}
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const tpl = html`
    ${_hasLabel ? html`<label class="ds-form-label" for="${_id}">${label}</label>` : ''}
    <div class="ds-number-input">
      <button class="ds-number-input__btn ds-number-input__btn--decrease" type="button" aria-label="Decrease">−</button>
      <input class="ds-number-input__input" type="number" id="${_id}" ${!label ? 'aria-label="Number input"' : ''} />
      <button class="ds-number-input__btn ds-number-input__btn--increase" type="button" aria-label="Increase">+</button>
    </div>
  `;

  const container = document.createDocumentFragment();
  const instance = render(tpl, container);

  const inputEl = container.querySelector('.ds-number-input__input');
  const decBtn = container.querySelector('.ds-number-input__btn--decrease');
  const incBtn = container.querySelector('.ds-number-input__btn--increase');

  if (inputEl) {
    inputEl.value = _value;
    inputEl.min = min;
    inputEl.max = max;
    inputEl.step = step;
    inputEl.disabled = disabled;
    inputEl.addEventListener('change', _handleChange);
  }

  if (decBtn) {
    decBtn.disabled = disabled || _value <= min;
    decBtn.addEventListener('click', _decrease);
  }

  if (incBtn) {
    incBtn.disabled = disabled || _value >= max;
    incBtn.addEventListener('click', _increase);
  }

  return {
    get element() { return container; },
    getValue,
    setValue,
    destroy,
  };
}
