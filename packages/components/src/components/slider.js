// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Slider component built on the 2.0 reactive core.
 *
 * Reuses the existing `ds-slider*` CSS classes for styling.
 *
 * ```js
 * import { Slider } from '@kupola/components/slider';
 *
 * const view = Slider({
 *   label: 'Volume',
 *   min: 0,
 *   max: 100,
 *   value: 50,
 *   onChange: (val) => console.log(val),
 * });
 * container.appendChild(view.element);
 * ```
 *
 * @module components/slider
 */

import { html } from '@kupola/core/template';
import { render } from '@kupola/core/render';

/**
 * Create a Slider component instance.
 *
 * @param {Object}   [options]
 * @param {string}   [options.label]    Label text
 * @param {number}   [options.min]      Minimum value (default 0)
 * @param {number}   [options.max]      Maximum value (default 100)
 * @param {number}   [options.step]     Step increment (default 1)
 * @param {number}   [options.value]    Initial value (default 0)
 * @param {boolean}  [options.disabled] Disabled state
 * @param {Function} [options.onChange]  Callback when value changes
 * @returns {{ element: DocumentFragment, getValue: Function, setValue: Function, destroy: Function }}
 */
export function Slider(options = {}) {
  const {
    label = '',
    min = 0,
    max = 100,
    step = 1,
    value: initialValue = 0,
    disabled = false,
    onChange = null,
  } = options;

  let _value = _clamp(initialValue, min, max);

  // ── Public API ─────────────────────────────────────────────────────────────

  function getValue() {
    return _value;
  }

  function setValue(val) {
    _value = _clamp(val, min, max);
    _updateUI();
    if (onChange) {onChange(_value);}
  }

  function destroy() {
    if (inputEl) {inputEl.removeEventListener('input', _handleInput);}
    instance.destroy();
  }

  // ── Internal ───────────────────────────────────────────────────────────────

  function _handleInput(e) {
    _value = Number(e.target.value);
    _updateUI();
    if (onChange) {onChange(_value);}
  }

  function _updateUI() {
    if (!inputEl || !fillEl || !thumbEl) {return;}
    inputEl.value = _value;
    const pct = ((_value - min) / (max - min)) * 100;
    fillEl.style.width = pct + '%';
    thumbEl.style.left = pct + '%';
    if (valueEl) {valueEl.textContent = _value;}
  }

  function _clamp(val, lo, hi) {
    return Math.max(lo, Math.min(hi, Number(val) || 0));
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const tpl = html`
    <div class="ds-slider">
      ${label ? html`
        <div class="ds-slider__header">
          <span class="ds-slider__label">${label}</span>
          <span class="ds-slider__value">0</span>
        </div>
      ` : ''}
      <div class="ds-slider__track">
        <div class="ds-slider__fill"></div>
        <div class="ds-slider__thumb"></div>
        <input type="range" class="ds-slider__input" />
      </div>
    </div>
  `;

  const container = document.createDocumentFragment();
  const instance = render(tpl, container);

  const inputEl = container.querySelector('.ds-slider__input');
  const fillEl = container.querySelector('.ds-slider__fill');
  const thumbEl = container.querySelector('.ds-slider__thumb');
  const valueEl = container.querySelector('.ds-slider__value');

  if (inputEl) {
    inputEl.min = min;
    inputEl.max = max;
    inputEl.step = step;
    inputEl.value = _value;
    inputEl.disabled = disabled;
    inputEl.addEventListener('input', _handleInput);
  }

  // Initial UI update
  _updateUI();

  return {
    get element() { return container; },
    getValue,
    setValue,
    destroy,
  };
}
