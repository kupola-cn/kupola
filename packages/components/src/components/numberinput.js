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

import { html } from '@kupola/platform/template';
import { render } from '@kupola/platform/render';
import { createListenerRegistry } from './listener-registry';

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

  const _id = id || (label ? `ds-numinput-${Math.random().toString(36).slice(2, 8)}` : '');
  const _hasLabel = !!label;
  const listeners = createListenerRegistry();
  let destroyed = false;

  function normalizeValue(val) {
    const num = Number(val);
    const normalized = Number.isFinite(num) ? num : 0;
    return Math.max(min, Math.min(max, normalized));
  }

  let _value = normalizeValue(initialValue);

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
  }

  function _updateButtons() {
    if (decBtn) {decBtn.disabled = disabled || _value <= min;}
    if (incBtn) {incBtn.disabled = disabled || _value >= max;}
  }

  function _handleChange(e) {
    const val = Number(e.target.value);
    if (!Number.isFinite(val)) {return;}
    _value = normalizeValue(val);
    e.target.value = _value;
    _updateButtons();
    onChange?.(_value);
  }

  function _increase() {
    if (disabled || destroyed || _value >= max) {return;}
    _value = normalizeValue(_value + step);
    inputEl.value = _value;
    _updateButtons();
    onChange?.(_value);
  }

  function _decrease() {
    if (disabled || destroyed || _value <= min) {return;}
    _value = normalizeValue(_value - step);
    inputEl.value = _value;
    _updateButtons();
    onChange?.(_value);
  }

  function getValue() {
    return _value;
  }

  function setValue(val) {
    if (destroyed) {return;}
    _value = normalizeValue(val);
    inputEl.value = _value;
    _updateButtons();
    onChange?.(_value);
  }

  _updateButtons();

  listeners.on(inputEl, 'change', _handleChange);
  listeners.on(decBtn, 'click', _decrease);
  listeners.on(incBtn, 'click', _increase);

  const api = {
    get element() { return container; },
    getValue,
    setValue,
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
