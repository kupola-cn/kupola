// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Calendar module built on the 2.0 reactive core.
 *
 * Full-featured calendar with month/week views, date selection, range mode, and events.
 *
 * ```js
 * import { Calendar } from '@kupola/components/calendar';
 *
 * const cal = Calendar({
 *   selectedDate: new Date(2024, 5, 15),
 *   events: [{ date: '2024-06-20', title: 'Meeting', color: '#3b82f6' }],
 *   onSelect: ({ date, dateStr }) => console.log(dateStr),
 * });
 *
 * document.body.appendChild(cal.element);
 * cal.goToToday();
 * cal.destroy();
 * ```
 *
 * @module components/calendar
 */

import { createListenerRegistry } from './listener-registry';

const DEFAULT_I18N = {
  months: [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ],
  shortMonths: [ 'Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec' ],
  weekdays: [ 'Sun','Mon','Tue','Wed','Thu','Fri','Sat' ],
  today: 'Today',
};

function _fmtDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

function _sameDay(a, b) {
  return a && b && _fmtDate(a) === _fmtDate(b);
}

function _inRange(date, start, end) {
  if (!start || !end) {return false;}
  const d = _fmtDate(date);
  return d >= _fmtDate(start) && d <= _fmtDate(end);
}

function _eventsForDate(events, date) {
  const ds = _fmtDate(date);
  return events.filter(e => {
    const s = e.date || e.start;
    if (!s) {return false;}
    const startStr = typeof s === 'string' ? s : _fmtDate(s);
    const end = e.end ?? e.endDate;
    if (!end) {return startStr === ds;}
    const endStr = typeof end === 'string' ? end : _fmtDate(end);
    return ds >= startStr && ds <= endStr;
  });
}

function _validDate(value, fallback = null) {
  if (value == null || value === '') {return fallback;}
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date : fallback;
}

export function Calendar(options = {}) {
  const config = options && typeof options === 'object' ? options : {};
  let currentDate = _validDate(config.currentDate ?? config.date, new Date());
  let selectedDate = _validDate(config.selectedDate);
  let rangeStart = _validDate(config.rangeStart);
  let rangeEnd = _validDate(config.rangeEnd);
  let isRangeMode = config.rangeMode === true || config.selectionMode === 'range';
  let viewMode = config.viewMode === 'week' ? 'week' : 'month';
  let events = Array.isArray(config.events) ? config.events.map(e => ({ ...e })) : [];
  const i18n = { ...DEFAULT_I18N, ...(config.i18n || {}) };
  const onSelect = typeof config.onSelect === 'function' ? config.onSelect : null;
  const onRangeSelect = typeof config.onRangeSelect === 'function' ? config.onRangeSelect : null;
  const onChange = typeof config.onChange === 'function' ? config.onChange : null;
  const onEventClick = typeof config.onEventClick === 'function' ? config.onEventClick : null;

  const navListeners = createListenerRegistry();
  const dayListeners = createListenerRegistry();
  let titleEl = null;
  let daysEl = null;
  let destroyed = false;

  function _emitChange() {
    if (onChange) {
      onChange({
        date: new Date(currentDate),
        selectedDate: selectedDate ? new Date(selectedDate) : null,
        rangeStart: rangeStart ? new Date(rangeStart) : null,
        rangeEnd: rangeEnd ? new Date(rangeEnd) : null,
        viewMode,
      });
    }
  }

  function _renderWeekdays() {
    const wdRow = document.createElement('div');
    wdRow.className = 'ds-calendar__weekdays';
    i18n.weekdays.forEach(wd => {
      const el = document.createElement('div');
      el.className = 'ds-calendar__weekday';
      el.textContent = wd;
      wdRow.appendChild(el);
    });
    return wdRow;
  }

  function _renderMonthView() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    titleEl.textContent = `${year} ${i18n.months[month]}`;
    daysEl.innerHTML = '';

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    const todayStr = _fmtDate(today);

    for (let i = 0; i < firstDay; i++) {
      const empty = document.createElement('span');
      empty.className = 'ds-calendar__day ds-calendar__day--empty';
      daysEl.appendChild(empty);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month, day);
      const ds = _fmtDate(d);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ds-calendar__day';
      btn.textContent = day;

      if (ds === todayStr) {btn.classList.add('is-today');}
      if (_sameDay(d, selectedDate)) {btn.classList.add('is-selected');}

      if (isRangeMode) {
        if (_sameDay(d, rangeStart)) {btn.classList.add('is-range-start');}
        if (_sameDay(d, rangeEnd)) {btn.classList.add('is-range-end');}
        if (_inRange(d, rangeStart, rangeEnd)) {btn.classList.add('is-in-range');}
      }

      const dayEvents = _eventsForDate(events, d);
      if (dayEvents.length > 0) {
        btn.classList.add('has-events');
        const dot = document.createElement('span');
        dot.className = 'ds-calendar__day-event';
        dot.style.backgroundColor = dayEvents[0].color || '#007bff';
        btn.appendChild(dot);
      }

      const clickHandler = () => _handleDayClick(d, ds, dayEvents, btn);
      dayListeners.on(btn, 'click', clickHandler);

      daysEl.appendChild(btn);
    }
  }

  function _renderWeekView() {
    const dayOfWeek = currentDate.getDay();
    const monday = new Date(currentDate);
    monday.setDate(currentDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));

    const endDate = new Date(monday);
    endDate.setDate(monday.getDate() + 6);

    const year = currentDate.getFullYear();
    const startLabel = `${i18n.shortMonths[monday.getMonth()]} ${monday.getDate()}`;
    const endLabel = `${i18n.shortMonths[endDate.getMonth()]} ${endDate.getDate()}`;
    titleEl.textContent = `${startLabel} - ${endLabel} ${year}`;

    daysEl.innerHTML = '';
    const today = new Date();
    const todayStr = _fmtDate(today);

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const ds = _fmtDate(d);

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ds-calendar__day ds-calendar__day--week';

      const header = document.createElement('span');
      header.className = 'ds-calendar__day-header';
      header.textContent = i18n.shortWeekdays ? i18n.shortWeekdays[d.getDay()] : i18n.weekdays[d.getDay()];
      btn.appendChild(header);

      const num = document.createElement('span');
      num.className = 'ds-calendar__day-number';
      num.textContent = d.getDate();
      btn.appendChild(num);

      if (ds === todayStr) {btn.classList.add('is-today');}
      if (_sameDay(d, selectedDate)) {btn.classList.add('is-selected');}

      const dayEvents = _eventsForDate(events, d);
      if (dayEvents.length > 0) {
        const evContainer = document.createElement('span');
        evContainer.className = 'ds-calendar__day-events';
        dayEvents.slice(0, 3).forEach(ev => {
          const dot = document.createElement('span');
          dot.className = 'ds-calendar__day-event';
          dot.style.backgroundColor = ev.color || '#007bff';
          evContainer.appendChild(dot);
        });
        btn.appendChild(evContainer);
      }

      const clickHandler = () => _handleDayClick(d, ds, dayEvents, btn);
      dayListeners.on(btn, 'click', clickHandler);

      daysEl.appendChild(btn);
    }
  }

  function _handleDayClick(d, ds, dayEvents, btn) {
    if (daysEl) {
      daysEl.querySelectorAll('.ds-calendar__day').forEach(el => el.classList.remove('is-selected'));
    }
    btn.classList.add('is-selected');

    if (isRangeMode) {
      if (!rangeStart || (rangeEnd && !_sameDay(d, rangeEnd))) {
        rangeStart = d;
        rangeEnd = null;
      } else if (rangeStart && !rangeEnd) {
        if (d < rangeStart) {
          rangeEnd = rangeStart;
          rangeStart = d;
        } else {
          rangeEnd = d;
        }
        if (onRangeSelect) {
          onRangeSelect({ start: new Date(rangeStart), end: new Date(rangeEnd) });
        }
      }
    } else {
      selectedDate = d;
      if (onSelect) {onSelect({ date: new Date(d), dateStr: ds });}
    }

    dayEvents.forEach(ev => {
      if (onEventClick) {onEventClick(ev, new Date(d));}
    });

    _render();
  }

  function _render() {
    if (destroyed) {return;}
    dayListeners.clear();

    if (viewMode === 'week') {
      _renderWeekView();
    } else {
      _renderMonthView();
    }
  }

  const root = document.createElement('div');
  root.className = 'ds-calendar';

  const header = document.createElement('div');
  header.className = 'ds-calendar__header';

  const title = document.createElement('div');
  title.className = 'ds-calendar__title';
  titleEl = title;

  const navGroup = document.createElement('div');
  navGroup.className = 'ds-calendar__nav-group';

  const prevBtn = document.createElement('button');
  prevBtn.type = 'button';
  prevBtn.className = 'ds-calendar__nav ds-calendar__nav--prev';
  prevBtn.textContent = '\u25C0';

  const nextBtn = document.createElement('button');
  nextBtn.type = 'button';
  nextBtn.className = 'ds-calendar__nav ds-calendar__nav--next';
  nextBtn.textContent = '\u25B6';

  const todayBtn = document.createElement('button');
  todayBtn.type = 'button';
  todayBtn.className = 'ds-calendar__nav ds-calendar__nav--today';
  todayBtn.textContent = i18n.today;

  navGroup.appendChild(prevBtn);
  navGroup.appendChild(todayBtn);
  navGroup.appendChild(nextBtn);
  header.appendChild(title);
  header.appendChild(navGroup);
  root.appendChild(header);

  root.appendChild(_renderWeekdays());

  const days = document.createElement('div');
  days.className = 'ds-calendar__days';
  daysEl = days;
  root.appendChild(days);

  const prevHandler = () => {
    if (viewMode === 'week') {
      currentDate.setDate(currentDate.getDate() - 7);
    } else {
      currentDate.setMonth(currentDate.getMonth() - 1);
    }
    _render();
    _emitChange();
  };
  const nextHandler = () => {
    if (viewMode === 'week') {
      currentDate.setDate(currentDate.getDate() + 7);
    } else {
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    _render();
    _emitChange();
  };
  const todayHandler = () => {
    currentDate = new Date();
    _render();
    _emitChange();
  };

  navListeners.on(prevBtn, 'click', prevHandler);
  navListeners.on(nextBtn, 'click', nextHandler);
  navListeners.on(todayBtn, 'click', todayHandler);

  _render();

  const api = {
    element: root,
    destroy() {
      if (destroyed) {return;}
      destroyed = true;
      navListeners.destroy();
      dayListeners.destroy();
      titleEl = null;
      daysEl = null;
      if (root.parentNode) {root.remove();}
      Object.freeze(api);
    },
    setDate(date) {
      if (destroyed) {return;}
      const parsed = _validDate(date);
      if (!parsed) {return;}
      currentDate = parsed;
      _render();
      _emitChange();
    },
    getDate() { return new Date(currentDate); },
    setSelectedDate(date) {
      if (destroyed) {return;}
      selectedDate = _validDate(date);
      _render();
    },
    getSelectedDate() { return selectedDate ? new Date(selectedDate) : null; },
    setRange(start, end) {
      if (destroyed) {return;}
      rangeStart = _validDate(start);
      rangeEnd = _validDate(end);
      if (rangeStart && rangeEnd && rangeStart > rangeEnd) {
        [ rangeStart, rangeEnd ] = [ rangeEnd, rangeStart ];
      }
      _render();
      if (onRangeSelect && rangeStart && rangeEnd) {
        onRangeSelect({ start: new Date(rangeStart), end: new Date(rangeEnd) });
      }
    },
    getRange() {
      return {
        start: rangeStart ? new Date(rangeStart) : null,
        end: rangeEnd ? new Date(rangeEnd) : null,
      };
    },
    setEvents(newEvents) {
      if (destroyed) {return;}
      events = Array.isArray(newEvents) ? newEvents.map(e => ({ ...e })) : [];
      _render();
    },
    addEvent(ev) {
      if (destroyed || !ev || typeof ev !== 'object') {return;}
      events.push({ ...ev });
      _render();
    },
    removeEvent(id) {
      if (destroyed) {return;}
      events = events.filter(e => e.id !== id);
      _render();
    },
    setViewMode(mode) {
      if (destroyed) {return;}
      if (mode === 'month' || mode === 'week') {
        viewMode = mode;
        _render();
        _emitChange();
      }
    },
    getViewMode() { return viewMode; },
    goToToday() {
      if (destroyed) {return;}
      currentDate = new Date();
      _render();
      _emitChange();
    },
    goToDate(date) {
      if (destroyed) {return;}
      const parsed = _validDate(date);
      if (!parsed) {return;}
      currentDate = parsed;
      _render();
      _emitChange();
    },
    prevMonth() {
      if (destroyed) {return;}
      currentDate.setMonth(currentDate.getMonth() - 1);
      _render();
      _emitChange();
    },
    nextMonth() {
      if (destroyed) {return;}
      currentDate.setMonth(currentDate.getMonth() + 1);
      _render();
      _emitChange();
    },
    toggleRangeMode() {
      if (destroyed) {return;}
      isRangeMode = !isRangeMode;
      rangeStart = null;
      rangeEnd = null;
      _render();
      _emitChange();
    },
  };

  return api;
}
