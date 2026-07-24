// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Calendar module built on the 2.0 reactive core.
 *
 * Full-featured calendar with month/week views, date selection, range mode, and events.
 *
 * ```js
 * import { Calendar } from '@kupola/core/components/calendar';
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

const DEFAULT_I18N = {
  months: [ 'January','February','March','April','May','June','July','August','September','October','November','December' ],
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
    if (!e.end) {return startStr === ds;}
    const endStr = typeof e.end === 'string' ? e.end : _fmtDate(e.end);
    return ds >= startStr && ds <= endStr;
  });
}

export function Calendar(options = {}) {
  let currentDate = options.currentDate ? new Date(options.currentDate) : new Date();
  let selectedDate = options.selectedDate ? new Date(options.selectedDate) : null;
  let rangeStart = options.rangeStart ? new Date(options.rangeStart) : null;
  let rangeEnd = options.rangeEnd ? new Date(options.rangeEnd) : null;
  let isRangeMode = options.rangeMode || false;
  let viewMode = options.viewMode || 'month';
  let events = (options.events || []).map(e => ({ ...e }));
  let i18n = { ...DEFAULT_I18N, ...options.i18n };
  const onSelect = options.onSelect || null;
  const onRangeSelect = options.onRangeSelect || null;
  const onChange = options.onChange || null;
  const onEventClick = options.onEventClick || null;

  const _listeners = [];
  let titleEl = null;
  let daysEl = null;

  function _emitChange() {
    if (onChange) {
      onChange({ date: new Date(currentDate), selectedDate, rangeStart, rangeEnd, viewMode });
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

    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
      const empty = document.createElement('span');
      empty.className = 'ds-calendar__day ds-calendar__day--empty';
      daysEl.appendChild(empty);
    }

    // Day cells
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month, day);
      const ds = _fmtDate(d);
      const btn = document.createElement('button');
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
      btn.addEventListener('click', clickHandler);
      _listeners.push({ el: btn, event: 'click', handler: clickHandler });

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
    titleEl.textContent = `${i18n.shortMonths[monday.getMonth()]} ${monday.getDate()} - ${i18n.shortMonths[endDate.getMonth()]} ${endDate.getDate()} ${year}`;

    daysEl.innerHTML = '';
    const today = new Date();
    const todayStr = _fmtDate(today);

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const ds = _fmtDate(d);

      const btn = document.createElement('button');
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
      btn.addEventListener('click', clickHandler);
      _listeners.push({ el: btn, event: 'click', handler: clickHandler });

      daysEl.appendChild(btn);
    }
  }

  function _handleDayClick(d, ds, dayEvents, btn) {
    // Clear selection
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
        if (onRangeSelect) {onRangeSelect({ start: rangeStart, end: rangeEnd });}
      }
    } else {
      selectedDate = d;
      if (onSelect) {onSelect({ date: d, dateStr: ds });}
    }

    dayEvents.forEach(ev => {
      if (onEventClick) {onEventClick(ev, d);}
    });

    _render();
  }

  function _render() {
    // Remove old listeners from day buttons only (keep nav buttons)
    const navEls = new Set([ titleEl, daysEl, prevBtn, nextBtn, todayBtn ]);
    _listeners.forEach(({ el, event, handler }) => {
      if (!navEls.has(el)) {
        el.removeEventListener(event, handler);
      }
    });
    // Only remove day button listeners from the array
    const navListeners = _listeners.filter(({ el }) => navEls.has(el));
    _listeners.length = 0;
    navListeners.forEach(l => _listeners.push(l));

    if (viewMode === 'week') {
      _renderWeekView();
    } else {
      _renderMonthView();
    }
  }

  // Build DOM
  const root = document.createElement('div');
  root.className = 'ds-calendar';

  // Header
  const header = document.createElement('div');
  header.className = 'ds-calendar__header';

  const title = document.createElement('div');
  title.className = 'ds-calendar__title';
  titleEl = title;

  const navGroup = document.createElement('div');
  navGroup.className = 'ds-calendar__nav-group';

  const prevBtn = document.createElement('button');
  prevBtn.className = 'ds-calendar__nav ds-calendar__nav--prev';
  prevBtn.textContent = '\u25C0';

  const nextBtn = document.createElement('button');
  nextBtn.className = 'ds-calendar__nav ds-calendar__nav--next';
  nextBtn.textContent = '\u25B6';

  const todayBtn = document.createElement('button');
  todayBtn.className = 'ds-calendar__nav ds-calendar__nav--today';
  todayBtn.textContent = i18n.today;

  navGroup.appendChild(prevBtn);
  navGroup.appendChild(todayBtn);
  navGroup.appendChild(nextBtn);
  header.appendChild(title);
  header.appendChild(navGroup);
  root.appendChild(header);

  // Weekday labels
  root.appendChild(_renderWeekdays());

  // Days grid
  const days = document.createElement('div');
  days.className = 'ds-calendar__days';
  daysEl = days;
  root.appendChild(days);

  // Event handlers
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

  prevBtn.addEventListener('click', prevHandler);
  nextBtn.addEventListener('click', nextHandler);
  todayBtn.addEventListener('click', todayHandler);
  _listeners.push(
    { el: prevBtn, event: 'click', handler: prevHandler },
    { el: nextBtn, event: 'click', handler: nextHandler },
    { el: todayBtn, event: 'click', handler: todayHandler },
  );

  // Initial render
  _render();

  // API
  function destroy() {
    _listeners.forEach(({ el, event, handler }) => {
      el.removeEventListener(event, handler);
    });
    _listeners.length = 0;
    titleEl = null;
    daysEl = null;
    if (root.parentNode) {root.remove();}
  }

  function setDate(date) {
    currentDate = new Date(date);
    _render();
    _emitChange();
  }

  function getDate() { return new Date(currentDate); }

  function setSelectedDate(date) {
    selectedDate = date ? new Date(date) : null;
    _render();
  }

  function getSelectedDate() { return selectedDate; }

  function setRange(start, end) {
    rangeStart = start ? new Date(start) : null;
    rangeEnd = end ? new Date(end) : null;
    _render();
    if (onRangeSelect && rangeStart && rangeEnd) {onRangeSelect({ start: rangeStart, end: rangeEnd });}
  }

  function getRange() { return { start: rangeStart, end: rangeEnd }; }

  function setEvents(newEvents) {
    events = (newEvents || []).map(e => ({ ...e }));
    _render();
  }

  function addEvent(ev) {
    events.push({ ...ev });
    _render();
  }

  function removeEvent(id) {
    events = events.filter(e => e.id !== id);
    _render();
  }

  function setViewMode(mode) {
    if (mode === 'month' || mode === 'week') {
      viewMode = mode;
      _render();
      _emitChange();
    }
  }

  function getViewMode() { return viewMode; }

  function goToToday() {
    currentDate = new Date();
    _render();
    _emitChange();
  }

  function goToDate(date) {
    currentDate = new Date(date);
    _render();
    _emitChange();
  }

  function prevMonth() {
    currentDate.setMonth(currentDate.getMonth() - 1);
    _render();
    _emitChange();
  }

  function nextMonth() {
    currentDate.setMonth(currentDate.getMonth() + 1);
    _render();
    _emitChange();
  }

  function toggleRangeMode() {
    isRangeMode = !isRangeMode;
    rangeStart = null;
    rangeEnd = null;
    _render();
    _emitChange();
  }

  return {
    element: root,
    destroy,
    setDate, getDate,
    setSelectedDate, getSelectedDate,
    setRange, getRange,
    setEvents, addEvent, removeEvent,
    setViewMode, getViewMode,
    goToToday, goToDate,
    prevMonth, nextMonth,
    toggleRangeMode,
  };
}
