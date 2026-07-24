// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Datepicker component built on the 3.0 reactive core.
 *
 * Reuses the existing `ds-datepicker-*` CSS classes for styling.
 *
 * ```js
 * import { Datepicker } from '@kupola/components/datepicker';
 *
 * const view = Datepicker({
 *   placeholder: 'Select date',
 *   format: 'YYYY-MM-DD',
 *   onChange: (dateStr, date) => console.log(dateStr),
 * });
 * container.appendChild(view.element);
 * ```
 *
 * @module components/datepicker
 */

import { html } from '@kupola/platform/template';
import { render } from '@kupola/platform/render';
import { t } from '@kupola/platform/i18n';
import { reactive, watch } from '@kupola/core';
import { getIconHtml } from './icon-helper';

const MONTHS = [ 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec' ];
const WEEKDAYS = [ 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su' ];

/**
 * Create a Datepicker component instance.
 *
 * @param {Object}   [options]
 * @param {string}   [options.placeholder]  Input placeholder
 * @param {string}   [options.format]       Date format: 'YYYY-MM-DD' (default), 'MM/DD/YYYY', 'DD/MM/YYYY'
 * @param {string}   [options.value]        Initial value (formatted string)
 * @param {number}   [options.weekStart]    Week start day: 0=Sun, 1=Mon (default 1)
 * @param {string}   [options.minDate]      Min selectable date (formatted string)
 * @param {string}   [options.maxDate]      Max selectable date (formatted string)
 * @param {Function} [options.onChange]      Callback: (dateStr, date) => void
 * @returns {{ element: DocumentFragment, open: Function, close: Function, getValue: Function, setValue: Function, destroy: Function }}
 */
export function Datepicker(options = {}) {
  const {
    placeholder = null,
    format = 'YYYY-MM-DD',
    value: initialValue = '',
    weekStart = 1,
    minDate: minDateStr = null,
    maxDate: maxDateStr = null,
    onChange = null,
  } = options;

  const _placeholder = placeholder || t('datepicker.placeholder');
  const _MONTHS = t('datepicker.months').split(',');
  const _WEEKDAYS = t('datepicker.weekdays').split(',');

  const now = new Date();
  const state = reactive({
    isOpen: false,
    viewYear: now.getFullYear(),
    viewMonth: now.getMonth(),
    selectedDate: null,
  });

  if (initialValue) {
    const parsed = _parseDate(initialValue);
    if (parsed) {
      state.selectedDate = parsed;
      state.viewYear = parsed.getFullYear();
      state.viewMonth = parsed.getMonth();
    }
  }

  const _minDate = minDateStr ? _parseDate(minDateStr) : null;
  const _maxDate = maxDateStr ? _parseDate(maxDateStr) : null;
  let wrapEl = null;
  let _lastInstance = null;

  function _parseDate(str) {
    if (!str) {return null;}
    let m = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (m) {return new Date(+m[1], +m[2] - 1, +m[3]);}
    m = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (m) {return new Date(+m[3], +m[1] - 1, +m[2]);}
    m = str.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
    if (m) {return new Date(+m[3], +m[2] - 1, +m[1]);}
    return null;
  }

  function _formatDate(date) {
    if (!date) {return '';}
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    switch (format) {
    case 'MM/DD/YYYY': return `${m}/${d}/${y}`;
    case 'DD/MM/YYYY': return `${d}.${m}.${y}`;
    default: return `${y}-${m}-${d}`;
    }
  }

  function _isToday(date) {
    const today = new Date();
    return date.getFullYear() === today.getFullYear()
      && date.getMonth() === today.getMonth()
      && date.getDate() === today.getDate();
  }

  function _isSelected(date) {
    if (!state.selectedDate) {return false;}
    return date.getFullYear() === state.selectedDate.getFullYear()
      && date.getMonth() === state.selectedDate.getMonth()
      && date.getDate() === state.selectedDate.getDate();
  }

  function _isDisabled(date) {
    if (_minDate && date < _minDate) {return true;}
    if (_maxDate && date > _maxDate) {return true;}
    return false;
  }

  function _getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
  }

  function _getCalendarDays() {
    const daysInMonth = _getDaysInMonth(state.viewYear, state.viewMonth);
    const firstDay = new Date(state.viewYear, state.viewMonth, 1);
    let startDow = firstDay.getDay();
    if (weekStart === 1) {
      startDow = startDow === 0 ? 6 : startDow - 1;
    }

    const days = [];

    const prevMonth = state.viewMonth === 0 ? 11 : state.viewMonth - 1;
    const prevYear = state.viewMonth === 0 ? state.viewYear - 1 : state.viewYear;
    const daysInPrevMonth = _getDaysInMonth(prevYear, prevMonth);
    for (let i = startDow - 1; i >= 0; i--) {
      days.push({
        date: new Date(prevYear, prevMonth, daysInPrevMonth - i),
        outside: true,
      });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      days.push({
        date: new Date(state.viewYear, state.viewMonth, d),
        outside: false,
      });
    }

    const remaining = 7 - (days.length % 7);
    if (remaining < 7) {
      const nextMonth = state.viewMonth === 11 ? 0 : state.viewMonth + 1;
      const nextYear = state.viewMonth === 11 ? state.viewYear + 1 : state.viewYear;
      for (let d = 1; d <= remaining; d++) {
        days.push({
          date: new Date(nextYear, nextMonth, d),
          outside: true,
        });
      }
    }

    return days;
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  function open() {
    state.isOpen = true;
    const calEl = wrapEl ? wrapEl.querySelector('.ds-datepicker__calendar') : null;
    if (calEl) {calEl.style.display = 'block';}
  }

  function close() {
    state.isOpen = false;
    const calEl = wrapEl ? wrapEl.querySelector('.ds-datepicker__calendar') : null;
    if (calEl) {calEl.style.display = 'none';}
  }

  function toggle() {
    if (state.isOpen) {
      close();
    } else {
      open();
    }
  }

  function getValue() {
    return state.selectedDate ? _formatDate(state.selectedDate) : '';
  }

  function setValue(val) {
    state.selectedDate = _parseDate(val);
    if (state.selectedDate) {
      state.viewYear = state.selectedDate.getFullYear();
      state.viewMonth = state.selectedDate.getMonth();
    }
    _updateInput();
    _rerenderCalendar();
  }

  // ── Internal ───────────────────────────────────────────────────────────────

  function _selectDate(date) {
    if (_isDisabled(date)) {return;}
    state.selectedDate = date;
    state.viewYear = date.getFullYear();
    state.viewMonth = date.getMonth();
    _updateInput();
    _rerenderCalendar();
    close();
    if (onChange) {
      onChange(_formatDate(date), date);
    }
  }

  function _updateInput() {
    const inputEl = wrapEl ? wrapEl.querySelector('.ds-datepicker__input') : null;
    if (inputEl) {
      inputEl.value = state.selectedDate ? _formatDate(state.selectedDate) : '';
    }
  }

  function _prevMonth() {
    if (state.viewMonth === 0) {
      state.viewMonth = 11;
      state.viewYear--;
    } else {
      state.viewMonth--;
    }
    _rerenderCalendar();
  }

  function _nextMonth() {
    if (state.viewMonth === 11) {
      state.viewMonth = 0;
      state.viewYear++;
    } else {
      state.viewMonth++;
    }
    _rerenderCalendar();
  }

  function _rerenderCalendar() {
    const calEl = wrapEl ? wrapEl.querySelector('.ds-datepicker__calendar') : null;
    if (!calEl) {return;}

    const titleEl = calEl.querySelector('.ds-datepicker__title');
    if (titleEl) {
      titleEl.textContent = `${_MONTHS[state.viewMonth]} ${state.viewYear}`;
    }

    const daysEl = calEl.querySelector('.ds-datepicker__days');
    if (!daysEl) {return;}
    daysEl.innerHTML = '';

    const days = _getCalendarDays();
    days.forEach(({ date, outside }) => {
      const btn = document.createElement('button');
      btn.textContent = date.getDate();
      if (outside) {btn.classList.add('is-outside');}
      if (_isToday(date)) {btn.classList.add('is-today');}
      if (_isSelected(date)) {btn.classList.add('is-selected');}
      if (_isDisabled(date)) {
        btn.disabled = true;
        btn.style.opacity = '0.3';
        btn.style.cursor = 'not-allowed';
      }
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        _selectDate(date);
      });
      daysEl.appendChild(btn);
    });
  }

  // ── Event handlers ─────────────────────────────────────────────────────────

  const onInputClick = (e) => {
    e.stopPropagation();
    toggle();
  };

  const onIconClick = (e) => {
    e.stopPropagation();
    toggle();
  };

  const onDocumentClick = (e) => {
    if (!state.isOpen) {return;}
    if (wrapEl && !wrapEl.contains(e.target)) {
      close();
    }
  };
  document.addEventListener('click', onDocumentClick);

  const onKeydown = (e) => {
    if (e.key === 'Escape' && state.isOpen) {
      close();
    }
  };
  document.addEventListener('keydown', onKeydown);

  // ── Render ─────────────────────────────────────────────────────────────────

  const displayValue = state.selectedDate ? _formatDate(state.selectedDate) : '';
  const titleText = `${_MONTHS[state.viewMonth]} ${state.viewYear}`;

  const wdLabels = weekStart === 1
    ? _WEEKDAYS
    : [ _WEEKDAYS[6], ..._WEEKDAYS.slice(0, 6) ];

  const weekdaySpans = wdLabels.map((d) => html`<span>${d}</span>`);

  const tpl = html`
    <div class="ds-datepicker">
      <div class="ds-datepicker__input-wrap" onclick="${onInputClick}">
        <input class="ds-datepicker__input" type="text" readonly placeholder="${_placeholder}" value="${displayValue}" />
        <button class="ds-datepicker__icon" onclick="${onIconClick}">
          ${getIconHtml('calendar')}
        </button>
      </div>
      <div class="ds-datepicker__calendar" style="display:none">
        <div class="ds-datepicker__header">
          <button class="ds-datepicker__nav" onclick="${_prevMonth}" aria-label="Previous month">
            ${getIconHtml('chevron-left')}
          </button>
          <span class="ds-datepicker__title">${titleText}</span>
          <button class="ds-datepicker__nav" onclick="${_nextMonth}" aria-label="Next month">
            ${getIconHtml('chevron-right')}
          </button>
        </div>
        <div class="ds-datepicker__weekdays">${weekdaySpans}</div>
        <div class="ds-datepicker__days"></div>
      </div>
    </div>
  `;

  const container = document.createDocumentFragment();
  _lastInstance = render(tpl, container);

  wrapEl = container.querySelector('.ds-datepicker');

  _rerenderCalendar();

  watch(() => state.isOpen, (isOpen) => {
    const calEl = wrapEl ? wrapEl.querySelector('.ds-datepicker__calendar') : null;
    if (calEl) {
      calEl.style.display = isOpen ? 'block' : 'none';
    }
  });

  return {
    get element() { return container; },
    open,
    close,
    toggle,
    getValue,
    setValue,
    destroy() {
      document.removeEventListener('click', onDocumentClick);
      document.removeEventListener('keydown', onKeydown);
      if (_lastInstance) {_lastInstance.destroy();}
    },
  };
}