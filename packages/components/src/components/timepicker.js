// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Timepicker component built on the 2.0 reactive core.
 *
 * Reuses the existing `ds-timepicker*` CSS classes for styling.
 *
 * ```js
 * import { Timepicker } from '@kupola/components/timepicker';
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

import { html } from '@kupola/platform/template';
import { render } from '@kupola/platform/render';
import { t } from '@kupola/platform/i18n';
import { getIconTemplate } from './icon-helper';
import { createListenerRegistry } from './listener-registry';
import { registerOverlayKeydown } from './overlay-stack';

let timepickerId = 0;

function parseTime(value) {
  if (typeof value !== 'string') {return null;}
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) {return null;}
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) {return null;}
  return { hours, minutes, total: hours * 60 + minutes };
}

function formatTime(hours, minutes) {
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

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
  const config = options && typeof options === 'object' ? options : {};
  const format = config.format === '12h' ? '12h' : '24h';
  const disabled = config.disabled === true;
  const onChange = typeof config.onChange === 'function' ? config.onChange : null;
  const placeholder = config.placeholder ?? t('timepicker.placeholder');
  const name = config.name == null ? '' : String(config.name);
  const minuteStep = Number.isFinite(Number(config.step)) && Number(config.step) > 0
    ? Math.min(60, Math.floor(Number(config.step)) || 1)
    : 1;
  const minTime = parseTime(config.minTime);
  const maxTime = parseTime(config.maxTime);
  const useRange = !minTime || !maxTime || minTime.total <= maxTime.total;

  const parsedInitial = parseTime(config.value);
  let _value = parsedInitial && isAllowed(parsedInitial.total)
    ? formatTime(parsedInitial.hours, parsedInitial.minutes)
    : '';
  let _open = false;
  let destroyed = false;
  let releaseKeydown = null;
  const listeners = createListenerRegistry();
  const openListeners = createListenerRegistry();

  function isAllowed(total) {
    if (!useRange) {return true;}
    return (!minTime || total >= minTime.total) && (!maxTime || total <= maxTime.total);
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  function getValue() {
    return _value;
  }

  function setValue(val) {
    if (destroyed) {return;}
    if (val === '' || val === null || val === undefined) {
      _commitValue('');
      return;
    }
    const parsed = parseTime(val);
    if (!parsed || !isAllowed(parsed.total)) {return;}
    _commitValue(formatTime(parsed.hours, parsed.minutes));
  }

  function clear() {
    setValue('');
  }

  function destroy() {
    if (destroyed) {return;}
    _closePanel();
    destroyed = true;
    releaseKeydown?.();
    releaseKeydown = null;
    openListeners.destroy();
    listeners.destroy();
    instance.destroy();
  }

  // ── Internal ───────────────────────────────────────────────────────────────

  function _togglePanel() {
    if (destroyed || disabled) {return;}
    if (_open) {_closePanel();} else {_openPanel();}
  }

  function _openPanel() {
    if (destroyed || disabled || _open) {return;}
    _open = true;
    if (panelEl) {panelEl.style.display = 'block';}
    inputEl?.setAttribute('aria-expanded', 'true');
    openListeners.on(document, 'click', _handleDocClick);
    releaseKeydown = registerOverlayKeydown(_handleKeydown);
    _updateUI();
  }

  function _closePanel(restoreFocus = false) {
    if (!_open) {return;}
    _open = false;
    if (panelEl) {panelEl.style.display = 'none';}
    inputEl?.setAttribute('aria-expanded', 'false');
    openListeners.clear();
    releaseKeydown?.();
    releaseKeydown = null;
    if (restoreFocus) {inputEl?.focus();}
  }

  function _handleDocClick(e) {
    if (!wrapperEl || !wrapperEl.contains(e.target)) {
      _closePanel();
    }
  }

  function _handleKeydown(event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      _closePanel(true);
    } else if (event.key === 'Tab') {
      _closePanel();
    }
  }

  function _commitValue(value) {
    if (_value === value) {return;}
    _value = value;
    _updateUI();
    if (onChange) {onChange(_value);}
  }

  function _currentParts() {
    return parseTime(_value) || { hours: 0, minutes: 0, total: 0 };
  }

  function _selectHour(displayHour) {
    const current = _currentParts();
    let hours = displayHour;
    if (format === '12h') {
      const isPM = current.hours >= 12;
      hours = displayHour % 12 + (isPM ? 12 : 0);
    }
    const total = hours * 60 + current.minutes;
    if (isAllowed(total)) {_commitValue(formatTime(hours, current.minutes));}
  }

  function _selectMinute(minutes) {
    const current = _currentParts();
    const total = current.hours * 60 + minutes;
    if (!isAllowed(total)) {return;}
    _commitValue(formatTime(current.hours, minutes));
    _closePanel();
  }

  function _setPeriod(period) {
    const current = _currentParts();
    let hours = current.hours % 12;
    if (period === 'PM') {hours += 12;}
    const total = hours * 60 + current.minutes;
    if (isAllowed(total)) {_commitValue(formatTime(hours, current.minutes));}
  }

  function _updateUI() {
    if (inputEl) {inputEl.value = _value;}
    const current = parseTime(_value);
    hourGrid?.querySelectorAll('.ds-timepicker__item').forEach(button => {
      const hour = Number(button.dataset.hour);
      const selected = current && (format === '12h'
        ? (current.hours % 12 || 12) === hour
        : current.hours === hour);
      button.classList.toggle('is-selected', Boolean(selected));
    });
    minGrid?.querySelectorAll('.ds-timepicker__item').forEach(button => {
      button.classList.toggle('is-selected', Boolean(current)
        && current.minutes === Number(button.dataset.minute));
    });
    periodEl?.querySelectorAll('button').forEach(button => {
      button.classList.toggle('is-selected', Boolean(current)
        && button.dataset.period === (current.hours >= 12 ? 'PM' : 'AM'));
    });
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const tpl = html`
    <div class="ds-timepicker${disabled ? ' is-disabled' : ''}">
      <div class="ds-timepicker__input-wrap">
        <input class="ds-timepicker__input" type="text" readonly placeholder="${placeholder}"
          name="${name}" aria-haspopup="dialog" aria-expanded="false"
          aria-controls="ds-timepicker-panel-${++timepickerId}" />
        <span class="ds-timepicker__icon">${getIconTemplate('clock')}</span>
      </div>
      <div class="ds-timepicker__panel" id="ds-timepicker-panel-${timepickerId}" role="dialog">
        <div class="ds-timepicker__body">
          <div class="ds-timepicker__section">
            <span class="ds-timepicker__section-label">Hours</span>
            <div class="ds-timepicker__grid ds-timepicker__grid--hour"></div>
          </div>
          <div class="ds-timepicker__section">
            <span class="ds-timepicker__section-label">Minutes</span>
            <div class="ds-timepicker__grid ds-timepicker__grid--minute"></div>
          </div>
          ${format === '12h' ? html`
            <div class="ds-timepicker__period" aria-label="Period">
              <button type="button" data-period="AM">AM</button>
              <button type="button" data-period="PM">PM</button>
            </div>
          ` : ''}
        </div>
      </div>
    </div>
  `;

  const container = document.createDocumentFragment();
  const instance = render(tpl, container);

  const wrapperEl = container.querySelector('.ds-timepicker');
  const inputEl = container.querySelector('.ds-timepicker__input');
  const panelEl = container.querySelector('.ds-timepicker__panel');
  const hourGrid = container.querySelector('.ds-timepicker__grid--hour');
  const minGrid = container.querySelector('.ds-timepicker__grid--minute');
  const periodEl = container.querySelector('.ds-timepicker__period');

  // Panel starts hidden
  if (panelEl) {panelEl.style.display = 'none';}

  // Populate hour grid
  const startH = format === '12h' ? 1 : 0;
  for (let h = startH; h < (format === '12h' ? 13 : 24); h++) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ds-timepicker__item';
    btn.textContent = String(h).padStart(2, '0');
    btn.dataset.hour = String(h);
    hourGrid.appendChild(btn);
  }

  // Populate minute grid
  for (let m = 0; m < 60; m += minuteStep) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ds-timepicker__item';
    btn.textContent = String(m).padStart(2, '0');
    btn.dataset.minute = String(m);
    minGrid.appendChild(btn);
  }

  listeners.on(hourGrid, 'click', event => {
    const button = event.target.closest?.('[data-hour]');
    if (button && hourGrid.contains(button)) {_selectHour(Number(button.dataset.hour));}
  });
  listeners.on(minGrid, 'click', event => {
    const button = event.target.closest?.('[data-minute]');
    if (button && minGrid.contains(button)) {_selectMinute(Number(button.dataset.minute));}
  });
  listeners.on(periodEl, 'click', event => {
    const button = event.target.closest?.('[data-period]');
    if (button && periodEl.contains(button)) {_setPeriod(button.dataset.period);}
  });

  if (inputEl) {
    inputEl.value = _value;
    inputEl.disabled = disabled;
    listeners.on(inputEl, 'click', _togglePanel);
    listeners.on(inputEl, 'keydown', event => {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        event.stopPropagation();
        _openPanel();
      }
    });
  }

  _updateUI();

  return {
    get element() { return container; },
    getValue,
    setValue,
    clear,
    open: _openPanel,
    close: _closePanel,
    isOpen: () => _open,
    destroy,
  };
}
