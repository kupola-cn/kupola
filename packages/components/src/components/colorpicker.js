// SPDX-License-Identifier: MIT
/**
 * @kupola/core — ColorPicker component built on the 2.0 reactive core.
 *
 * Reuses the existing `ds-color-picker*` CSS classes for styling.
 *
 * ```js
 * import { ColorPicker } from '@kupola/components/colorpicker';
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

import { html } from '@kupola/platform/template';
import { render } from '@kupola/platform/render';
import { createListenerRegistry } from './listener-registry';
import { registerOverlayKeydown } from './overlay-stack';

let colorPickerId = 0;

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
  const config = options && typeof options === 'object' ? options : {};
  const initialValue = config.value ?? config.color ?? '';
  const configuredColors = config.colors ?? config.presets;
  const colors = Array.isArray(configuredColors) ? configuredColors : DEFAULT_COLORS;
  const showInput = config.showInput ?? true;
  const disabled = config.disabled === true;
  const onChange = typeof config.onChange === 'function' ? config.onChange : null;
  const panelId = `ds-color-picker-panel-${++colorPickerId}`;

  let _value = String(initialValue || '');
  let _open = false;
  let destroyed = false;
  let releaseKeydown = null;
  const listeners = createListenerRegistry();
  const openListeners = createListenerRegistry();

  // ── Public API ─────────────────────────────────────────────────────────────

  function getValue() {
    return _value;
  }

  function setValue(color) {
    if (destroyed) {return;}
    const nextValue = String(color || '');
    if (nextValue === _value) {return;}
    _value = nextValue;
    _updateUI();
    if (onChange) {onChange(_value);}
  }

  function destroy() {
    if (destroyed) {return;}
    close();
    destroyed = true;
    releaseKeydown?.();
    releaseKeydown = null;
    openListeners.destroy();
    listeners.destroy();
    instance.destroy();
  }

  // ── Internal ───────────────────────────────────────────────────────────────

  function open() {
    if (destroyed || disabled || _open) {return;}
    _open = true;
    panelEl?.classList.add('is-visible');
    triggerEl?.setAttribute('aria-expanded', 'true');
    openListeners.on(document, 'click', _handleDocumentClick);
    releaseKeydown = registerOverlayKeydown(_handleKeydown);
  }

  function close(restoreFocus = false) {
    if (destroyed || !_open) {return;}
    _open = false;
    panelEl?.classList.remove('is-visible');
    triggerEl?.setAttribute('aria-expanded', 'false');
    openListeners.clear();
    releaseKeydown?.();
    releaseKeydown = null;
    if (restoreFocus) {triggerEl?.focus();}
  }

  function toggle() {
    if (_open) {close();} else {open();}
  }

  function _handleDocumentClick(event) {
    if (!wrapperEl?.contains(event.target)) {close();}
  }

  function _handleKeydown(event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      close(true);
    } else if (event.key === 'Tab') {
      close();
    }
  }

  function _selectColor(color) {
    if (destroyed || disabled) {return;}
    setValue(color);
    close();
  }

  function _updateUI() {
    if (triggerEl) {triggerEl.style.backgroundColor = _value || 'transparent';}
    if (valueEl) {valueEl.textContent = _value || '';}
    if (colorInput && /^#[\da-f]{6}$/i.test(_value)) {colorInput.value = _value;}
    // Update selected state on swatches
    if (gridEl) {
      const swatches = gridEl.querySelectorAll('.ds-color-picker__color');
      swatches.forEach((s) => {
        s.classList.toggle('is-selected', s.dataset.color === _value);
        s.setAttribute('aria-selected', String(s.dataset.color === _value));
      });
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const tpl = html`
    <div class="ds-color-picker${disabled ? ' is-disabled' : ''}">
      <button class="ds-color-picker__trigger" type="button" aria-haspopup="dialog"
        aria-expanded="false" aria-controls="${panelId}" aria-label="Choose color">
        <span class="ds-color-picker__swatch"></span>
      </button>
      <div class="ds-color-picker__panel" id="${panelId}" role="dialog">
        <div class="ds-color-picker__grid" role="listbox"></div>
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
  const wrapperEl = container.querySelector('.ds-color-picker');

  // Build color swatches
  colors.forEach((color) => {
    const value = String(color || '');
    if (!value) {return;}
    const swatch = document.createElement('button');
    swatch.type = 'button';
    swatch.className = 'ds-color-picker__color';
    swatch.style.backgroundColor = value;
    swatch.dataset.color = value;
    swatch.setAttribute('role', 'option');
    swatch.setAttribute('aria-label', value);
    gridEl.appendChild(swatch);
  });
  listeners.on(gridEl, 'click', event => {
    const swatch = event.target.closest?.('.ds-color-picker__color');
    if (swatch && gridEl.contains(swatch)) {_selectColor(swatch.dataset.color);}
  });

  // Custom color input
  if (colorInput) {
    if (!showInput) {colorInput.parentElement.style.display = 'none';}
    colorInput.disabled = disabled;
    listeners.on(colorInput, 'input', event => setValue(event.target.value));
    listeners.on(colorInput, 'change', () => close());
  }

  if (triggerEl) {
    triggerEl.disabled = disabled;
    listeners.on(triggerEl, 'click', event => {
      event.stopPropagation();
      toggle();
    });
  }
  if (disabled) {triggerEl.style.pointerEvents = 'none';}

  _updateUI();

  return {
    get element() { return container; },
    getValue,
    setValue,
    getColor: getValue,
    setColor: setValue,
    open,
    close,
    toggle,
    isOpen: () => _open,
    destroy,
  };
}
