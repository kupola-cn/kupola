// SPDX-License-Identifier: MIT
import { Calendar } from '../../src/components/calendar.js';

describe('Calendar', () => {
  // ── Rendering ──
  describe('rendering', () => {
    test('creates root element with ds-calendar class', () => {
      const cal = Calendar();
      expect(cal.element.classList.contains('ds-calendar')).toBe(true);
      cal.destroy();
    });

    test('renders header with title', () => {
      const cal = Calendar({ currentDate: new Date(2024, 5, 15) });
      const title = cal.element.querySelector('.ds-calendar__title');
      expect(title).not.toBeNull();
      expect(title.textContent).toContain('2024');
      expect(title.textContent).toContain('June');
      cal.destroy();
    });

    test('renders navigation buttons', () => {
      const cal = Calendar();
      const prev = cal.element.querySelector('.ds-calendar__nav--prev');
      const next = cal.element.querySelector('.ds-calendar__nav--next');
      const today = cal.element.querySelector('.ds-calendar__nav--today');
      expect(prev).not.toBeNull();
      expect(next).not.toBeNull();
      expect(today).not.toBeNull();
      cal.destroy();
    });

    test('renders weekday labels', () => {
      const cal = Calendar();
      const weekdays = cal.element.querySelectorAll('.ds-calendar__weekday');
      expect(weekdays.length).toBe(7);
      cal.destroy();
    });

    test('renders days grid', () => {
      const cal = Calendar({ currentDate: new Date(2024, 0, 1) }); // Jan 2024
      const days = cal.element.querySelectorAll('.ds-calendar__day:not(.ds-calendar__day--empty)');
      expect(days.length).toBe(31); // January has 31 days
      cal.destroy();
    });

    test('renders empty cells for offset days', () => {
      const cal = Calendar({ currentDate: new Date(2024, 0, 1) }); // Jan 2024 starts on Monday
      const empties = cal.element.querySelectorAll('.ds-calendar__day--empty');
      expect(empties.length).toBe(1); // Monday = 1, so 1 empty (Sunday)
      cal.destroy();
    });

    test('marks today with is-today class', () => {
      const cal = Calendar({ currentDate: new Date() });
      const today = cal.element.querySelector('.ds-calendar__day.is-today');
      expect(today).not.toBeNull();
      cal.destroy();
    });

    test('renders event dots', () => {
      const cal = Calendar({
        currentDate: new Date(2024, 5, 1),
        events: [{ date: '2024-06-15', title: 'Test', color: '#ff0000' }],
      });
      const eventDots = cal.element.querySelectorAll('.ds-calendar__day-event');
      expect(eventDots.length).toBeGreaterThan(0);
      cal.destroy();
    });
  });

  // ── Navigation ──
  describe('navigation', () => {
    test('prev button goes to previous month', () => {
      const cal = Calendar({ currentDate: new Date(2024, 5, 15) });
      const prevBtn = cal.element.querySelector('.ds-calendar__nav--prev');
      prevBtn.click();
      const title = cal.element.querySelector('.ds-calendar__title');
      expect(title.textContent).toContain('May');
      cal.destroy();
    });

    test('next button goes to next month', () => {
      const cal = Calendar({ currentDate: new Date(2024, 5, 15) });
      const nextBtn = cal.element.querySelector('.ds-calendar__nav--next');
      nextBtn.click();
      const title = cal.element.querySelector('.ds-calendar__title');
      expect(title.textContent).toContain('July');
      cal.destroy();
    });

    test('today button goes to current date', () => {
      const cal = Calendar({ currentDate: new Date(2020, 0, 1) });
      const todayBtn = cal.element.querySelector('.ds-calendar__nav--today');
      todayBtn.click();
      const title = cal.element.querySelector('.ds-calendar__title');
      const now = new Date();
      expect(title.textContent).toContain(String(now.getFullYear()));
      cal.destroy();
    });

    test('prevMonth() API works', () => {
      const cal = Calendar({ currentDate: new Date(2024, 5, 15) });
      cal.prevMonth();
      const title = cal.element.querySelector('.ds-calendar__title');
      expect(title.textContent).toContain('May');
      cal.destroy();
    });

    test('nextMonth() API works', () => {
      const cal = Calendar({ currentDate: new Date(2024, 5, 15) });
      cal.nextMonth();
      const title = cal.element.querySelector('.ds-calendar__title');
      expect(title.textContent).toContain('July');
      cal.destroy();
    });

    test('goToToday() resets to current date', () => {
      const cal = Calendar({ currentDate: new Date(2020, 0, 1) });
      cal.goToToday();
      const d = cal.getDate();
      const now = new Date();
      expect(d.getFullYear()).toBe(now.getFullYear());
      expect(d.getMonth()).toBe(now.getMonth());
      cal.destroy();
    });

    test('goToDate() navigates to specific date', () => {
      const cal = Calendar();
      cal.goToDate(new Date(2025, 11, 25));
      const title = cal.element.querySelector('.ds-calendar__title');
      expect(title.textContent).toContain('2025');
      expect(title.textContent).toContain('December');
      cal.destroy();
    });
  });

  // ── Selection ──
  describe('selection', () => {
    test('clicking a day selects it', () => {
      const onSelect = jest.fn();
      const cal = Calendar({
        currentDate: new Date(2024, 0, 1),
        onSelect,
      });
      const days = cal.element.querySelectorAll('.ds-calendar__day:not(.ds-calendar__day--empty)');
      days[14].click(); // Click 15th
      expect(onSelect).toHaveBeenCalled();
      expect(onSelect.mock.calls[0][0].dateStr).toBe('2024-01-15');
      cal.destroy();
    });

    test('setSelectedDate() marks a date as selected', () => {
      const cal = Calendar({ currentDate: new Date(2024, 0, 1) });
      cal.setSelectedDate(new Date(2024, 0, 20));
      const selected = cal.element.querySelector('.ds-calendar__day.is-selected');
      expect(selected).not.toBeNull();
      expect(selected.textContent).toBe('20');
      cal.destroy();
    });

    test('getSelectedDate() returns selected date', () => {
      const cal = Calendar({ selectedDate: new Date(2024, 5, 15) });
      const d = cal.getSelectedDate();
      expect(d).not.toBeNull();
      expect(d.getFullYear()).toBe(2024);
      expect(d.getMonth()).toBe(5);
      cal.destroy();
    });
  });

  // ── Range mode ──
  describe('range mode', () => {
    test('setRange() marks range in view', () => {
      const cal = Calendar({
        currentDate: new Date(2024, 0, 1),
        rangeMode: true,
      });
      cal.setRange(new Date(2024, 0, 10), new Date(2024, 0, 15));
      const rangeStart = cal.element.querySelector('.is-range-start');
      const rangeEnd = cal.element.querySelector('.is-range-end');
      const inRange = cal.element.querySelectorAll('.is-in-range');
      expect(rangeStart).not.toBeNull();
      expect(rangeEnd).not.toBeNull();
      expect(inRange.length).toBeGreaterThan(0);
      cal.destroy();
    });

    test('getRange() returns current range', () => {
      const cal = Calendar({
        rangeMode: true,
        rangeStart: new Date(2024, 0, 10),
        rangeEnd: new Date(2024, 0, 20),
      });
      const range = cal.getRange();
      expect(range.start).not.toBeNull();
      expect(range.end).not.toBeNull();
      cal.destroy();
    });

    test('toggleRangeMode() switches mode', () => {
      const cal = Calendar();
      cal.toggleRangeMode();
      // After toggle, range should be cleared
      const range = cal.getRange();
      expect(range.start).toBeNull();
      expect(range.end).toBeNull();
      cal.destroy();
    });
  });

  // ── View mode ──
  describe('view mode', () => {
    test('defaults to month view', () => {
      const cal = Calendar();
      expect(cal.getViewMode()).toBe('month');
      cal.destroy();
    });

    test('setViewMode switches to week view', () => {
      const cal = Calendar();
      cal.setViewMode('week');
      expect(cal.getViewMode()).toBe('week');
      const weekDays = cal.element.querySelectorAll('.ds-calendar__day--week');
      expect(weekDays.length).toBe(7);
      cal.destroy();
    });

    test('week view shows 7 days', () => {
      const cal = Calendar({ viewMode: 'week' });
      const days = cal.element.querySelectorAll('.ds-calendar__day--week');
      expect(days.length).toBe(7);
      cal.destroy();
    });
  });

  // ── Events ──
  describe('events', () => {
    test('addEvent() adds an event', () => {
      const cal = Calendar({ currentDate: new Date(2024, 5, 1) });
      cal.addEvent({ date: '2024-06-15', title: 'New Event', color: '#ff0000' });
      const dots = cal.element.querySelectorAll('.ds-calendar__day-event');
      expect(dots.length).toBeGreaterThan(0);
      cal.destroy();
    });

    test('removeEvent() removes by id', () => {
      const cal = Calendar({
        currentDate: new Date(2024, 5, 1),
        events: [{ id: 'e1', date: '2024-06-15', title: 'Test' }],
      });
      cal.removeEvent('e1');
      const dots = cal.element.querySelectorAll('.ds-calendar__day-event');
      expect(dots.length).toBe(0);
      cal.destroy();
    });

    test('setEvents() replaces all events', () => {
      const cal = Calendar({
        currentDate: new Date(2024, 5, 1),
        events: [{ date: '2024-06-15', title: 'Old' }],
      });
      cal.setEvents([{ date: '2024-06-20', title: 'New' }]);
      const dots = cal.element.querySelectorAll('.ds-calendar__day-event');
      expect(dots.length).toBe(1);
      cal.destroy();
    });
  });

  // ── onChange ──
  describe('onChange', () => {
    test('fires on navigation', () => {
      const onChange = jest.fn();
      const cal = Calendar({ onChange });
      cal.prevMonth();
      expect(onChange).toHaveBeenCalled();
      cal.destroy();
    });
  });

  // ── destroy ──
  describe('destroy()', () => {
    test('removes element from DOM', () => {
      const container = document.createElement('div');
      const cal = Calendar();
      container.appendChild(cal.element);
      document.body.appendChild(container);
      cal.destroy();
      expect(document.querySelector('.ds-calendar')).toBeNull();
      document.body.innerHTML = '';
    });
  });
});
