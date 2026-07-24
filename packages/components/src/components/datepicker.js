// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Datepicker component built on the 2.0 reactive core.
 *
 * Reuses the existing `ds-datepicker-*` CSS classes for styling.
 *
 * ```js
 * import { Datepicker } from '@kupola/core/components/datepicker';
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

import { html } from '@kupola/core';
import { render } from '@kupola/core';
import { t } from '@kupola/core/i18n';

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

  let _isOpen = false;
  let _viewYear = new Date().getFullYear();
  let _viewMonth = new Date().getMonth();
  let _selectedDate = null;
  let _lastInstance = null;

  // Parse initial value
  if (initialValue) {
    _selectedDate = _parseDate(initialValue);
    if (_selectedDate) {
      _viewYear = _selectedDate.getFullYear();
      _viewMonth = _selectedDate.getMonth();
    }
  }

  const _minDate = minDateStr ? _parseDate(minDateStr) : null;
  const _maxDate = maxDateStr ? _parseDate(maxDateStr) : null;

  // ── Helpers ────────────────────────────────────────────────────────────────

  function _parseDate(str) {
    if (!str) {return null;}
    // Try YYYY-MM-DD first
    let m = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (m) {return new Date(+m[1], +m[2] - 1, +m[3]);}
    // Try MM/DD/YYYY
    m = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (m) {return new Date(+m[3], +m[1] - 1, +m[2]);}
    // Try DD/MM/YYYY
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
    if (!_selectedDate) {return false;}
    return date.getFullYear() === _selectedDate.getFullYear()
      && date.getMonth() === _selectedDate.getMonth()
      && date.getDate() === _selectedDate.getDate();
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
    const daysInMonth = _getDaysInMonth(_viewYear, _viewMonth);
    const firstDay = new Date(_viewYear, _viewMonth, 1);
    // Calculate offset from weekStart
    let startDow = firstDay.getDay(); // 0=Sun
    if (weekStart === 1) {
      startDow = startDow === 0 ? 6 : startDow - 1; // Convert to Mon=0
    }

    const days = [];

    // Previous month days
    const prevMonth = _viewMonth === 0 ? 11 : _viewMonth - 1;
    const prevYear = _viewMonth === 0 ? _viewYear - 1 : _viewYear;
    const daysInPrevMonth = _getDaysInMonth(prevYear, prevMonth);
    for (let i = startDow - 1; i >= 0; i--) {
      days.push({
        date: new Date(prevYear, prevMonth, daysInPrevMonth - i),
        outside: true,
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      days.push({
        date: new Date(_viewYear, _viewMonth, d),
        outside: false,
      });
    }

    // Next month days to fill last row
    const remaining = 7 - (days.length % 7);
    if (remaining < 7) {
      const nextMonth = _viewMonth === 11 ? 0 : _viewMonth + 1;
      const nextYear = _viewMonth === 11 ? _viewYear + 1 : _viewYear;
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
    if (_isOpen) {return;}
    _isOpen = true;
    const calEl = wrapEl ? wrapEl.querySelector('.ds-datepicker__calendar') : null;
    if (calEl) {calEl.style.display = 'block';}
  }

  function close() {
    if (!_isOpen) {return;}
    _isOpen = false;
    const calEl = wrapEl ? wrapEl.querySelector('.ds-datepicker__calendar') : null;
    if (calEl) {calEl.style.display = 'none';}
  }

  function toggle() {
    _isOpen ? close() : open();
  }

  function getValue() {
    return _selectedDate ? _formatDate(_selectedDate) : '';
  }

  function setValue(val) {
    _selectedDate = _parseDate(val);
    if (_selectedDate) {
      _viewYear = _selectedDate.getFullYear();
      _viewMonth = _selectedDate.getMonth();
    }
    _updateInput();
    _rerenderCalendar();
  }

  // ── Internal ───────────────────────────────────────────────────────────────

  function _selectDate(date) {
    if (_isDisabled(date)) {return;}
    _selectedDate = date;
    _viewYear = date.getFullYear();
    _viewMonth = date.getMonth();
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
      inputEl.value = _selectedDate ? _formatDate(_selectedDate) : '';
    }
  }

  function _prevMonth() {
    if (_viewMonth === 0) {
      _viewMonth = 11;
      _viewYear--;
    } else {
      _viewMonth--;
    }
    _rerenderCalendar();
  }

  function _nextMonth() {
    if (_viewMonth === 11) {
      _viewMonth = 0;
      _viewYear++;
    } else {
      _viewMonth++;
    }
    _rerenderCalendar();
  }

  function _rerenderCalendar() {
    const calEl = wrapEl ? wrapEl.querySelector('.ds-datepicker__calendar') : null;
    if (!calEl) {return;}

    // Update title
    const titleEl = calEl.querySelector('.ds-datepicker__title');
    if (titleEl) {
      titleEl.textContent = `${_MONTHS[_viewMonth]} ${_viewYear}`;
    }

    // Update days grid
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
    if (!_isOpen) {return;}
    if (wrapEl && !wrapEl.contains(e.target)) {
      close();
    }
  };
  document.addEventListener('click', onDocumentClick);

  const onKeydown = (e) => {
    if (e.key === 'Escape' && _isOpen) {
      close();
    }
  };
  document.addEventListener('keydown', onKeydown);

  // ── Render ─────────────────────────────────────────────────────────────────

  const displayValue = _selectedDate ? _formatDate(_selectedDate) : '';
  const titleText = `${_MONTHS[_viewMonth]} ${_viewYear}`;

  // Adjusted weekday labels based on weekStart
  const adjustedWeekdays = [];
  for (let i = 0; i < 7; i++) {
    const idx = weekStart === 1 ? i : (i + weekStart) % 7;
    // weekStart=1 → Mo Tu We Th Fr Sa Su
    // weekStart=0 → Su Mo Tu We Th Fr Sa
    adjustedWeekdays.push(WEEKDAYS[weekStart === 1 ? i : (i + 6) % 7]);
  }
  // Simplify: just use the standard order based on weekStart
  const wdLabels = weekStart === 1
    ? _WEEKDAYS
    : [ _WEEKDAYS[6], ..._WEEKDAYS.slice(0, 6) ];

  const weekdaySpans = wdLabels.map((d) => html`<span>${d}</span>`);

  // Initial days (will be replaced by _rerenderCalendar)
  const initialDays = [];

  const tpl = html`
    <div class="ds-datepicker">
      <div class="ds-datepicker__input-wrap" onclick="${onInputClick}">
        <input class="ds-datepicker__input" type="text" readonly placeholder="${_placeholder}" value="${displayValue}" />
        <button class="ds-datepicker__icon" onclick="${onIconClick}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
        </button>
      </div>
      <div class="ds-datepicker__calendar" style="display:none">
        <div class="ds-datepicker__header">
          <button class="ds-datepicker__nav" onclick="${_prevMonth}" aria-label="Previous month">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <span class="ds-datepicker__title">${titleText}</span>
          <button class="ds-datepicker__nav" onclick="${_nextMonth}" aria-label="Next month">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
        <div class="ds-datepicker__weekdays">${weekdaySpans}</div>
        <div class="ds-datepicker__days"></div>
      </div>
    </div>
  `;

  const container = document.createDocumentFragment();
  _lastInstance = render(tpl, container);

  const wrapEl = container.querySelector('.ds-datepicker');

  // Render initial days
  _rerenderCalendar();

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
