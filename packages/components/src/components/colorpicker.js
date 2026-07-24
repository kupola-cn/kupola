// SPDX-License-Identifier: MIT
/**
 * @kupola/core — ColorPicker component built on the 2.0 reactive core.
 *
 * Reuses the existing `ds-color-picker*` CSS classes for styling.
 *
 * ```js
 * import { ColorPicker } from '@kupola/core/components/colorpicker';
 *
 * const view = ColorPicker({
 *   value: '#3b82f6',
 *   colors: ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'],
 *   onChange: (color) => console.log(color),
 * });
 * container.appendChild(view.element);
 * ```
 *
 * @module components/colorpicker
 */

import { html } from '@kupola/core';
import { render } from '@kupola/core';

const DEFAULT_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e',
  '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6',
  '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#64748b',
];

/**
 * Create a ColorPicker component instance.
 *
 * @param {Object} [options]
 * @param {string} [options.value]     Initial color value (hex)
 * @param {Array}  [options.colors]    Preset color swatches
 * @param {boolean}[options.showInput] Show custom hex input (default true)
 * @param {boolean}[options.disabled]  Disabled state
 * @param {Function}[options.onChange]  Callback when color changes
 * @returns {{ element: DocumentFragment, getValue: Function, setValue: Function, destroy: Function }}
 */
export function ColorPicker(options = {}) {
  const {
    value: initialValue = '',
    colors = DEFAULT_COLORS,
    showInput = true,
    disabled = false,
    onChange = null,
  } = options;

  let _value = initialValue;

  // ── Public API ─────────────────────────────────────────────────────────────

  function getValue() {
    return _value;
  }

  function setValue(color) {
    _value = color;
    _updateUI();
    if (onChange) {onChange(_value);}
  }

  function destroy() {
    if (triggerEl) {triggerEl.removeEventListener('click', _toggle);}
    instance.destroy();
  }

  // ── Internal ───────────────────────────────────────────────────────────────

  function _toggle() {
    if (panelEl) {panelEl.classList.toggle('is-visible');}
  }

  function _selectColor(color) {
    _value = color;
    _updateUI();
    if (panelEl) {panelEl.classList.remove('is-visible');}
    if (onChange) {onChange(_value);}
  }

  function _updateUI() {
    if (triggerEl) {triggerEl.style.backgroundColor = _value || 'transparent';}
    if (valueEl) {valueEl.textContent = _value || '';}
    // Update selected state on swatches
    if (gridEl) {
      const swatches = gridEl.querySelectorAll('.ds-color-picker__color');
      swatches.forEach((s) => {
        s.classList.toggle('is-selected', s.dataset.color === _value);
      });
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const tpl = html`
    <div class="ds-color-picker">
      <div class="ds-color-picker__trigger">
        <span class="ds-color-picker__swatch"></span>
      </div>
      <div class="ds-color-picker__panel">
        <div class="ds-color-picker__grid"></div>
        <div class="ds-color-picker__custom">
          <input class="ds-color-picker__input" type="color" />
          <span class="ds-color-picker__value"></span>
        </div>
      </div>
    </div>
  `;

  const container = document.createDocumentFragment();
  const instance = render(tpl, container);

  const triggerEl = container.querySelector('.ds-color-picker__trigger');
  const panelEl = container.querySelector('.ds-color-picker__panel');
  const gridEl = container.querySelector('.ds-color-picker__grid');
  const valueEl = container.querySelector('.ds-color-picker__value');
  const colorInput = container.querySelector('.ds-color-picker__input');

  // Build color swatches
  colors.forEach((color) => {
    const swatch = document.createElement('div');
    swatch.className = 'ds-color-picker__color';
    swatch.style.backgroundColor = color;
    swatch.dataset.color = color;
    swatch.addEventListener('click', () => _selectColor(color));
    gridEl.appendChild(swatch);
  });

  // Custom color input
  if (colorInput) {
    if (!showInput) {colorInput.parentElement.style.display = 'none';}
    colorInput.addEventListener('input', (e) => _selectColor(e.target.value));
  }

  if (triggerEl) {triggerEl.addEventListener('click', _toggle);}
  if (disabled) {triggerEl.style.pointerEvents = 'none';}

  _updateUI();

  return {
    get element() { return container; },
    getValue,
    setValue,
    destroy,
  };
}
