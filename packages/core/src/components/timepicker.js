// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Timepicker component built on the 2.0 reactive core.
 *
 * Reuses the existing `ds-timepicker*` CSS classes for styling.
 *
 * ```js
 * import { Timepicker } from '@kupola/core/components/timepicker';
 *
 * const view = Timepicker({
 *   value: '14:30',
 *   format: '24h',
 *   onChange: (val) => console.log(val),
 * });
 * container.appendChild(view.element);
 * ```
 *
 * @module components/timepicker
 */

import { html } from '../template.js';
import { render } from '../render.js';

/**
 * Create a Timepicker component instance.
 *
 * @param {Object}   [options]
 * @param {string}   [options.value]     Initial time value (HH:MM format)
 * @param {string}   [options.format]    '12h'|'24h' (default '24h')
 * @param {number}   [options.step]      Minute step (default 1)
 * @param {boolean}  [options.disabled]  Disabled state
 * @param {Function} [options.onChange]  Callback when time changes
 * @returns {{ element: DocumentFragment, getValue: Function, setValue: Function, destroy: Function }}
 */
export function Timepicker(options = {}) {
  const {
    value: initialValue = '',
    format = '24h',
    step = 1,
    disabled = false,
    onChange = null,
  } = options;

  let _value = initialValue;
  let _open = false;

  // ── Public API ─────────────────────────────────────────────────────────────

  function getValue() {
    return _value;
  }

  function setValue(val) {
    _value = val;
    if (inputEl) {inputEl.value = _value;}
    _updateDisplay();
    if (onChange) {onChange(_value);}
  }

  function destroy() {
    _closePanel();
    if (inputEl) {inputEl.removeEventListener('click', _togglePanel);}
    if (inputEl) {inputEl.removeEventListener('change', _handleInput);}
    instance.destroy();
  }

  // ── Internal ───────────────────────────────────────────────────────────────

  function _togglePanel() {
    if (_open) {_closePanel();} else {_openPanel();}
  }

  function _openPanel() {
    _open = true;
    if (panelEl) {panelEl.style.display = 'block';}
    if (!_docClickBound) {
      document.addEventListener('click', _handleDocClick);
      _docClickBound = true;
    }
  }

  function _closePanel() {
    _open = false;
    if (panelEl) {panelEl.style.display = 'none';}
  }

  function _handleDocClick(e) {
    if (!wrapperEl || !wrapperEl.contains(e.target)) {
      _closePanel();
    }
  }

  function _handleInput(e) {
    _value = e.target.value;
    _updateDisplay();
    if (onChange) {onChange(_value);}
  }

  function _selectTime(h, m) {
    const hh = String(h).padStart(2, '0');
    const mm = String(m).padStart(2, '0');
    _value = `${hh}:${mm}`;
    if (inputEl) {inputEl.value = _value;}
    _updateDisplay();
    _closePanel();
    if (onChange) {onChange(_value);}
  }

  function _updateDisplay() {
    if (!displayEl) {return;}
    if (!_value) { displayEl.textContent = '--:--'; return; }
    const parts = _value.split(':');
    let h = parseInt(parts[0]) || 0;
    const m = parseInt(parts[1]) || 0;
    if (format === '12h') {
      const ampm = h >= 12 ? 'PM' : 'AM';
      h = h % 12 || 12;
      displayEl.textContent = `${h}:${String(m).padStart(2, '0')} ${ampm}`;
    } else {
      displayEl.textContent = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const tpl = html`
    <div class="ds-timepicker">
      <div class="ds-timepicker__input-wrap">
        <input class="ds-timepicker__input" type="text" readonly placeholder="Select time..." />
        <span class="ds-timepicker__icon">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        </span>
      </div>
      <div class="ds-timepicker__panel">
        <div class="ds-timepicker__body">
          <div class="ds-timepicker__section">
            <span class="ds-timepicker__section-label">Hours</span>
            <div class="ds-timepicker__grid ds-timepicker__grid--hour"></div>
          </div>
          <div class="ds-timepicker__section">
            <span class="ds-timepicker__section-label">Minutes</span>
            <div class="ds-timepicker__grid ds-timepicker__grid--minute"></div>
          </div>
        </div>
      </div>
    </div>
  `;

  const container = document.createDocumentFragment();
  const instance = render(tpl, container);

  const wrapperEl = container.querySelector('.ds-timepicker');
  const inputEl = container.querySelector('.ds-timepicker__input');
  const panelEl = container.querySelector('.ds-timepicker__panel');
  const displayEl = container.querySelector('.ds-timepicker__icon');

  // Panel starts hidden
  if (panelEl) {panelEl.style.display = 'none';}

  let _docClickBound = false;

  // Populate hour grid
  const hourGrid = container.querySelector('.ds-timepicker__grid--hour');
  const maxH = format === '12h' ? 12 : 24;
  const startH = format === '12h' ? 1 : 0;
  for (let h = startH; h < (format === '12h' ? 13 : 24); h++) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ds-timepicker__item';
    btn.textContent = String(h).padStart(2, '0');
    btn.addEventListener('click', () => {
      const curM = _value ? (parseInt(_value.split(':')[1]) || 0) : 0;
      let finalH = h;
      if (format === '12h') {
        const isPM = _value && parseInt(_value.split(':')[0]) >= 12;
        if (isPM && h < 12) {finalH = h + 12;}
        else if (!isPM && h === 12) {finalH = 0;}
      }
      _selectTime(finalH, curM);
    });
    hourGrid.appendChild(btn);
  }

  // Populate minute grid
  const minGrid = container.querySelector('.ds-timepicker__grid--minute');
  for (let m = 0; m < 60; m += step) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ds-timepicker__item';
    btn.textContent = String(m).padStart(2, '0');
    btn.addEventListener('click', () => {
      const curH = _value ? (parseInt(_value.split(':')[0]) || 0) : 0;
      _selectTime(curH, m);
    });
    minGrid.appendChild(btn);
  }

  if (inputEl) {
    inputEl.value = _value;
    inputEl.disabled = disabled;
    inputEl.addEventListener('click', _togglePanel);
  }

  _updateDisplay();

  return {
    get element() { return container; },
    getValue,
    setValue,
    destroy,
  };
}
