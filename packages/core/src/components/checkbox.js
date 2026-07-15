// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Checkbox component built on the 2.0 reactive core.
 *
 * Reuses the existing `ds-checkbox*` CSS classes for styling.
 *
 * ```js
 * import { Checkbox } from '@kupola/core/components/checkbox';
 *
 * const view = Checkbox({
 *   label: 'Accept terms',
 *   checked: false,
 *   disabled: false,
 *   onChange: (checked) => console.log('checked:', checked),
 * });
 * container.appendChild(view.element);
 * ```
 *
 * @module components/checkbox
 */

import { html } from '../template.js';
import { render } from '../render.js';

/**
 * Create a Checkbox component instance.
 *
 * @param {Object}   [options]
 * @param {string}   [options.label]     Label text
 * @param {boolean}  [options.checked]   Initial checked state (default false)
 * @param {boolean}  [options.disabled]  Disabled state (default false)
 * @param {string}   [options.name]      Input name attribute
 * @param {string}   [options.value]     Input value attribute
 * @param {Function} [options.onChange]  Callback when checked state changes
 * @returns {{ element: DocumentFragment, isChecked: Function, setChecked: Function, destroy: Function }}
 */
export function Checkbox(options = {}) {
  const {
    label = '',
    checked: initialChecked = false,
    disabled = false,
    name = '',
    value = '',
    onChange = null,
  } = options;

  let _checked = initialChecked;

  // ── Public API ─────────────────────────────────────────────────────────────

  function isChecked() {
    return _checked;
  }

  function setChecked(val) {
    _checked = !!val;
    if (inputEl) inputEl.checked = _checked;
    if (onChange) onChange(_checked);
  }

  function destroy() {
    if (inputEl) inputEl.removeEventListener('change', _handleChange);
    instance.destroy();
  }

  // ── Internal ───────────────────────────────────────────────────────────────

  function _handleChange() {
    _checked = inputEl.checked;
    if (onChange) onChange(_checked);
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const tpl = html`
    <label class="ds-checkbox">
      <input type="checkbox" />
      <span class="ds-checkbox__box"></span>
      ${label ? html`<span class="ds-checkbox__label">${label}</span>` : ''}
    </label>
  `;

  const container = document.createDocumentFragment();
  const instance = render(tpl, container);

  const inputEl = container.querySelector('input');
  if (inputEl) {
    inputEl.checked = _checked;
    inputEl.disabled = disabled;
    if (name) inputEl.name = name;
    if (value) inputEl.value = value;
    inputEl.addEventListener('change', _handleChange);
  }

  return {
    get element() { return container; },
    isChecked,
    setChecked,
    destroy,
  };
}
