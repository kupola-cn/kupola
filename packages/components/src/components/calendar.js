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

function _fmtDate(d, timeZone = null) {
  if (timeZone) {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(d);
    const values = Object.fromEntries(parts.map(part => [ part.type, part.value ]));
    return `${values.year}-${values.month}-${values.day}`;
  }
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

function _sameDay(a, b, timeZone = null) {
  return a && b && _fmtDate(a, timeZone) === _fmtDate(b, timeZone);
}

function _inRange(date, start, end, timeZone = null) {
  if (!start || !end) {return false;}
  const d = _fmtDate(date, timeZone);
  return d >= _fmtDate(start, timeZone) && d <= _fmtDate(end, timeZone);
}

function _dateFromKey(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {return null;}
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return _fmtDate(date) === value ? date : null;
}

function _eventDate(value, timeZone = null) {
  if (typeof value === 'string') {
    const match = /^(\d{4}-\d{2}-\d{2})/.exec(value);
    if (match && value.length === 10) {
      return _dateFromKey(match[1]) ? match[1] : '';
    }
  }
  const date = value instanceof Date ? value : new Date(value);
  return Number.isFinite(date.getTime()) ? _fmtDate(date, timeZone) : '';
}

function _createEventIndex(events, timeZone = null) {
  const exact = new Map();
  const ranges = [];
  for (const event of events) {
    const start = _eventDate(event.date || event.start, timeZone);
    if (!start) {continue;}
    const end = _eventDate(event.end ?? event.endDate, timeZone);
    if (!end) {
      const list = exact.get(start) || [];
      list.push(event);
      exact.set(start, list);
    } else {
      ranges.push({ event, start, end });
    }
  }
  return { exact, ranges };
}

function _eventsForDate(index, date, timeZone = null) {
  const ds = _fmtDate(date, timeZone);
  return [ ...(index.exact.get(ds) || []),
    ...index.ranges.filter(range => ds >= range.start && ds <= range.end).map(range => range.event) ];
}

function _validDate(value, fallback = null, timeZone = null) {
  if (value == null || value === '') {return fallback;}
  if (typeof value === 'string') {
    const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (dateOnly) {
      const local = _dateFromKey(value);
      return local || fallback;
    }
  }
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) {return fallback;}
  return timeZone ? _dateFromKey(_fmtDate(date, timeZone)) : date;
}

export function Calendar(options = {}) {
  const config = options && typeof options === 'object' ? options : {};
  const timeZone = config.timeZone == null ? null : String(config.timeZone);
  if (timeZone) {
    try {
      new Intl.DateTimeFormat('en-US', { timeZone }).format();
    } catch {
      throw new RangeError(`[kupola/components] Invalid Calendar timeZone: ${timeZone}`);
    }
  }
  let currentDate = _validDate(config.currentDate ?? config.date, new Date(), timeZone);
  let selectedDate = _validDate(config.selectedDate, null, timeZone);
  let rangeStart = _validDate(config.rangeStart, null, timeZone);
  let rangeEnd = _validDate(config.rangeEnd, null, timeZone);
  let isRangeMode = config.rangeMode === true || config.selectionMode === 'range';
  let viewMode = config.viewMode === 'week' ? 'week' : 'month';
  let events = Array.isArray(config.events) ? config.events.map(e => ({ ...e })) : [];
  let eventIndex = _createEventIndex(events, timeZone);
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
    const todayStr = _fmtDate(today, timeZone);

    for (let i = 0; i < firstDay; i++) {
      const empty = document.createElement('span');
      empty.className = 'ds-calendar__day ds-calendar__day--empty';
      daysEl.appendChild(empty);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month, day);
      const ds = _fmtDate(d, timeZone);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ds-calendar__day';
      btn.textContent = day;

      if (ds === todayStr) {btn.classList.add('is-today');}
      if (_sameDay(d, selectedDate, timeZone)) {btn.classList.add('is-selected');}

      if (isRangeMode) {
        if (_sameDay(d, rangeStart, timeZone)) {btn.classList.add('is-range-start');}
        if (_sameDay(d, rangeEnd, timeZone)) {btn.classList.add('is-range-end');}
        if (_inRange(d, rangeStart, rangeEnd, timeZone)) {btn.classList.add('is-in-range');}
      }

      const dayEvents = _eventsForDate(eventIndex, d, timeZone);
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
    const todayStr = _fmtDate(today, timeZone);

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const ds = _fmtDate(d, timeZone);

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
      if (_sameDay(d, selectedDate, timeZone)) {btn.classList.add('is-selected');}

      const dayEvents = _eventsForDate(eventIndex, d, timeZone);
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
      if (!rangeStart || (rangeEnd && !_sameDay(d, rangeEnd, timeZone))) {
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
      const parsed = _validDate(date, null, timeZone);
      if (!parsed) {return;}
      currentDate = parsed;
      _render();
      _emitChange();
    },
    getDate() { return new Date(currentDate); },
    setSelectedDate(date) {
      if (destroyed) {return;}
      selectedDate = _validDate(date, null, timeZone);
      _render();
    },
    getSelectedDate() { return selectedDate ? new Date(selectedDate) : null; },
    setRange(start, end) {
      if (destroyed) {return;}
      rangeStart = _validDate(start, null, timeZone);
      rangeEnd = _validDate(end, null, timeZone);
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
      eventIndex = _createEventIndex(events, timeZone);
      _render();
    },
    addEvent(ev) {
      if (destroyed || !ev || typeof ev !== 'object') {return;}
      events.push({ ...ev });
      eventIndex = _createEventIndex(events, timeZone);
      _render();
    },
    removeEvent(id) {
      if (destroyed) {return;}
      events = events.filter(e => e.id !== id);
      eventIndex = _createEventIndex(events);
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
      const parsed = _validDate(date, null, timeZone);
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
