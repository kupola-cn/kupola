// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Switch (toggle) component built on the 2.0 reactive core.
 *
 * Reuses the existing `ds-switch` CSS classes for styling.
 *
 * ```js
 * import { Switch } from '@kupola/core/components/switch';
 *
 * const view = Switch({
 *   checked: false,
 *   disabled: false,
 *   onChange: (checked) => console.log('Toggled:', checked),
 * });
 * container.appendChild(view.element);
 * ```
 *
 * @module components/switch
 */

import { html } from '@kupola/core';
import { render } from '@kupola/core';

/**
 * Create a Switch component instance.
 *
 * @param {Object}   [options]
 * @param {boolean}  [options.checked]   Initial state (default false)
 * @param {boolean}  [options.disabled]  Disabled state (default false)
 * @param {Function} [options.onChange]   Callback: (checked: boolean) => void
 * @returns {{ element: DocumentFragment, toggle: Function, isChecked: Function, setChecked: Function, destroy: Function }}
 */
export function Switch(options = {}) {
  const {
    checked: initialChecked = false,
    disabled = false,
    onChange = null,
  } = options;

  let _checked = initialChecked;

  // ── Public API ─────────────────────────────────────────────────────────────

  function toggle() {
    if (disabled) {return;}
    _checked = !_checked;
    _syncInput();
    _syncAria();
    if (onChange) {onChange(_checked);}
  }

  function isChecked() {
    return _checked;
  }

  function setChecked(val) {
    if (disabled) {return;}
    _checked = !!val;
    _syncInput();
    _syncAria();
  }

  function destroy() {
    instance.destroy();
  }

  // ── Internal ───────────────────────────────────────────────────────────────

  function _syncInput() {
    if (inputEl) {inputEl.checked = _checked;}
  }

  function _syncAria() {
    if (labelEl) {labelEl.setAttribute('aria-checked', _checked);}
    if (inputEl) {inputEl.setAttribute('aria-checked', _checked);}
  }

  // ── Event handler ──────────────────────────────────────────────────────────

  const onSwitchClick = (e) => {
    e.preventDefault();
    toggle();
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  const tpl = html`
    <label class="ds-switch" role="switch" aria-checked="${_checked}" aria-disabled="${disabled}">
      <input type="checkbox" ${_checked ? 'checked' : ''} ${disabled ? 'disabled' : ''} role="switch" aria-checked="${_checked}" />
      <span class="ds-switch__thumb"></span>
    </label>
  `;

  const container = document.createDocumentFragment();
  const instance = render(tpl, container);

  const labelEl = container.querySelector('.ds-switch');
  const inputEl = container.querySelector('input[type="checkbox"]');

  // Bind click on the label (prevent default checkbox toggle, use our own logic)
  if (labelEl) {
    labelEl.addEventListener('click', onSwitchClick);
  }

  return {
    get element() { return container; },
    toggle,
    isChecked,
    setChecked,
    destroy,
  };
}
