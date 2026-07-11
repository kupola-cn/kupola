class Datepicker {
  constructor(element, options = {}) {
    this.element = element;
    this.input = element.querySelector('input');
    this.endInput = element.querySelector('.ds-datepicker__end-input');
    this.icon = element.querySelector('.ds-datepicker__icon');
    this.calendarEl = element.querySelector('.ds-datepicker__calendar');
    this.scope = `datepicker-${Math.random().toString(36).substr(2, 9)}`;
    
    // Options
    this.format = options.format || element.getAttribute('data-datepicker-format') || 'YYYY-MM-DD';
    this.range = options.range || element.hasAttribute('data-datepicker-range');
    this.minDate = options.minDate || element.getAttribute('data-datepicker-min') || null;
    this.maxDate = options.maxDate || element.getAttribute('data-datepicker-max') || null;
    this.disabledDate = options.disabledDate || null; // function(date) => boolean
    this.weekStart = options.weekStart || parseInt(element.getAttribute('data-datepicker-week-start')) || 0; // 0=Sun, 1=Mon
    this.placeholder = options.placeholder || element.getAttribute('data-datepicker-placeholder') || '';
    this.showToday = options.showToday !== false;
    this.showWeekNumber = options.showWeekNumber || element.hasAttribute('data-datepicker-week-number');
    this.onChange = options.onChange || null;
    
    // i18n
    this.months = options.months || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    this.weekDays = options.weekDays || ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    this.todayText = options.todayText || 'Today';
    this.clearText = options.clearText || 'Clear';
    
    // State
    this.currentDate = new Date();
    this.viewMode = 'days'; // days | months | years
    this.selectedDate = null;
    this.rangeStart = null;
    this.rangeEnd = null;
    this.isSelectingEnd = false;
    
    this._iconClickHandler = null;
    this._inputClickHandler = null;
    this._documentClickHandler = null;
    this._documentClickListener = null;
    this._resizeHandler = null;
    this._resizeListener = null;
    this._keydownHandler = null;
  }

  init() {
    if (!this.calendarEl) return;
    if (this.element.__kupolaInitialized) return;

    // Parse initial value
    if (this.input && this.input.value) {
      if (this.range) {
        const parts = this.input.value.split(' ~ ');
        if (parts.length === 2) {
          this.rangeStart = this._parseDate(parts[0].trim());
          this.rangeEnd = this._parseDate(parts[1].trim());
          this.currentDate = new Date(this.rangeStart);
        }
      } else {
        this.selectedDate = this._parseDate(this.input.value);
        this.currentDate = new Date(this.selectedDate);
      }
    }

    if (this.placeholder && this.input) {
      this.input.placeholder = this.placeholder;
    }

    this._iconClickHandler = (e) => this.toggleCalendar(e);
    this._inputClickHandler = (e) => this.toggleCalendar(e);

    if (this.icon) this.icon.addEventListener('click', this._iconClickHandler);
    if (this.input) this.input.addEventListener('click', this._inputClickHandler);
    if (this.endInput) this.endInput.addEventListener('click', (e) => {
      this.isSelectingEnd = true;
      this.toggleCalendar(e);
    });

    if (window.globalEvents) {
      this._documentClickListener = window.globalEvents.on(document, 'click', (e) => this.hideCalendar(e), { scope: this.scope });
      this._resizeListener = window.globalEvents.on(window, 'resize', () => this.resizeHandler(), { scope: this.scope });
    } else {
      document.addEventListener('click', (e) => this.hideCalendar(e));
      window.addEventListener('resize', () => this.resizeHandler());
      this._documentClickHandler = (e) => this.hideCalendar(e);
      this._resizeHandler = () => this.resizeHandler();
    }

    // Keyboard
    this._keydownHandler = (e) => {
      if (e.key === 'Escape' && this.calendarEl.style.display === 'block') {
        this.hideCalendar(e);
      }
    };
    document.addEventListener('keydown', this._keydownHandler);

    this.element.__kupolaInitialized = true;
    this._renderCalendar();
  }

  _parseDate(str) {
    if (!str) return null;
    const parts = str.split('-');
    if (parts.length === 3) return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    return null;
  }

  _formatDate(date) {
    if (!date) return '';
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    
    return this.format
      .replace('YYYY', y)
      .replace('MM', m)
      .replace('DD', d);
  }

  _isDateDisabled(date) {
    if (this.minDate) {
      const min = typeof this.minDate === 'string' ? this._parseDate(this.minDate) : this.minDate;
      if (date < min) return true;
    }
    if (this.maxDate) {
      const max = typeof this.maxDate === 'string' ? this._parseDate(this.maxDate) : this.maxDate;
      if (date > max) return true;
    }
    if (this.disabledDate) {
      return this.disabledDate(date);
    }
    return false;
  }

  _isToday(date) {
    const today = new Date();
    return date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth() && date.getDate() === today.getDate();
  }

  _isSameDay(d1, d2) {
    if (!d1 || !d2) return false;
    return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
  }

  _isInRange(date) {
    if (!this.range || !this.rangeStart || !this.rangeEnd) return false;
    const time = date.getTime();
    const start = Math.min(this.rangeStart.getTime(), this.rangeEnd.getTime());
    const end = Math.max(this.rangeStart.getTime(), this.rangeEnd.getTime());
    return time >= start && time <= end;
  }

  calculatePosition() {
    const pickerRect = this.element.getBoundingClientRect();
    const calendarRect = this.calendarEl.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    
    const spaceBelow = viewportHeight - pickerRect.bottom;
    const spaceAbove = pickerRect.top;
    const calendarHeight = calendarRect.height || 320;
    
    if (spaceBelow >= calendarHeight) {
      this.calendarEl.style.top = 'calc(100% + 4px)';
      this.calendarEl.style.bottom = 'auto';
    } else if (spaceAbove >= calendarHeight) {
      this.calendarEl.style.top = 'auto';
      this.calendarEl.style.bottom = 'calc(100% + 4px)';
    } else {
      this.calendarEl.style.top = 'calc(100% + 4px)';
      this.calendarEl.style.bottom = 'auto';
    }
  }

  toggleCalendar(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const isVisible = this.calendarEl.style.display === 'block';
    
    // Close all other datepickers
    document.querySelectorAll('.ds-datepicker__calendar').forEach(c => {
      if (c !== this.calendarEl) {
        c.style.display = 'none';
        c.setAttribute('hidden', '');
      }
    });
    
    if (!isVisible) {
      this.calendarEl.style.display = 'block';
      this.calendarEl.removeAttribute('hidden');
      this.calculatePosition();
    }
  }

  hideCalendar(e) {
    if (!this.element.contains(e.target)) {
      this.calendarEl.style.display = 'none';
      this.calendarEl.setAttribute('hidden', '');
      this.viewMode = 'days';
    }
  }

  resizeHandler() {
    if (this.calendarEl.style.display === 'block') {
      this.calculatePosition();
    }
  }

  _renderCalendar() {
    const calendar = this.calendarEl;
    if (!calendar) return;
    
    // Clean up old listeners
    calendar.querySelectorAll('.ds-datepicker__day').forEach(dayEl => {
      if (dayEl._dayClickHandler) dayEl.removeEventListener('click', dayEl._dayClickHandler);
    });
    
    if (this.viewMode === 'years') {
      this._renderYearsView();
      return;
    }
    if (this.viewMode === 'months') {
      this._renderMonthsView();
      return;
    }
    
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    
    calendar.innerHTML = '';
    
    // Header with navigation
    const header = document.createElement('div');
    header.className = 'ds-datepicker__header';
    
    const prevBtn = document.createElement('button');
    prevBtn.className = 'ds-datepicker__nav ds-datepicker__nav--prev';
    prevBtn.type = 'button';
    prevBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>';
    prevBtn.addEventListener('click', (e) => { e.stopPropagation(); this._prevMonth(); });
    
    const titleBtn = document.createElement('button');
    titleBtn.className = 'ds-datepicker__title';
    titleBtn.type = 'button';
    titleBtn.textContent = `${year} ${this.months[month]}`;
    titleBtn.addEventListener('click', (e) => { e.stopPropagation(); this.viewMode = 'months'; this._renderCalendar(); });
    
    const nextBtn = document.createElement('button');
    nextBtn.className = 'ds-datepicker__nav ds-datepicker__nav--next';
    nextBtn.type = 'button';
    nextBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>';
    nextBtn.addEventListener('click', (e) => { e.stopPropagation(); this._nextMonth(); });
    
    header.appendChild(prevBtn);
    header.appendChild(titleBtn);
    header.appendChild(nextBtn);
    calendar.appendChild(header);
    
    // Week day headers
    const weekHeader = document.createElement('div');
    weekHeader.className = 'ds-datepicker__weekdays';
    const orderedDays = [...this.weekDays.slice(this.weekStart), ...this.weekDays.slice(0, this.weekStart)];
    orderedDays.forEach(day => {
      const span = document.createElement('span');
      span.className = 'ds-datepicker__weekday';
      span.textContent = day;
      weekHeader.appendChild(span);
    });
    calendar.appendChild(weekHeader);
    
    // Days grid
    const daysEl = document.createElement('div');
    daysEl.className = 'ds-datepicker__days';
    
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const offset = (firstDay - this.weekStart + 7) % 7;
    
    // Empty cells
    for (let i = 0; i < offset; i++) {
      const emptyDay = document.createElement('span');
      emptyDay.className = 'ds-datepicker__day ds-datepicker__day--empty';
      daysEl.appendChild(emptyDay);
    }
    
    // Day cells
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayEl = document.createElement('button');
      dayEl.className = 'ds-datepicker__day';
      dayEl.type = 'button';
      dayEl.textContent = day;
      
      const dateStr = this._formatDate(date);
      
      if (this._isToday(date)) dayEl.classList.add('is-today');
      
      // Selected state
      if (this.range) {
        if (this._isSameDay(date, this.rangeStart) || this._isSameDay(date, this.rangeEnd)) {
          dayEl.classList.add('is-selected');
        }
        if (this._isInRange(date)) {
          dayEl.classList.add('is-in-range');
        }
      } else {
        if (this._isSameDay(date, this.selectedDate)) {
          dayEl.classList.add('is-selected');
        }
      }
      
      // Disabled state
      if (this._isDateDisabled(date)) {
        dayEl.classList.add('is-disabled');
        dayEl.disabled = true;
      }
      
      const clickHandler = () => this._selectDate(date);
      dayEl.addEventListener('click', clickHandler);
      dayEl._dayClickHandler = clickHandler;
      
      daysEl.appendChild(dayEl);
    }
    
    calendar.appendChild(daysEl);
    
    // Footer with Today / Clear buttons
    if (this.showToday) {
      const footer = document.createElement('div');
      footer.className = 'ds-datepicker__footer';
      
      const todayBtn = document.createElement('button');
      todayBtn.className = 'ds-datepicker__today-btn';
      todayBtn.type = 'button';
      todayBtn.textContent = this.todayText;
      todayBtn.addEventListener('click', (e) => { e.stopPropagation(); this._goToToday(); });
      
      const clearBtn = document.createElement('button');
      clearBtn.className = 'ds-datepicker__clear-btn';
      clearBtn.type = 'button';
      clearBtn.textContent = this.clearText;
      clearBtn.addEventListener('click', (e) => { e.stopPropagation(); this._clearDate(); });
      
      footer.appendChild(todayBtn);
      footer.appendChild(clearBtn);
      calendar.appendChild(footer);
    }
  }

  _renderYearsView() {
    const calendar = this.calendarEl;
    calendar.innerHTML = '';
    
    const currentYear = this.currentDate.getFullYear();
    const startYear = currentYear - 6;
    
    const header = document.createElement('div');
    header.className = 'ds-datepicker__header';
    
    const prevBtn = document.createElement('button');
    prevBtn.className = 'ds-datepicker__nav ds-datepicker__nav--prev';
    prevBtn.type = 'button';
    prevBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>';
    prevBtn.addEventListener('click', (e) => { e.stopPropagation(); this.currentDate.setFullYear(this.currentDate.getFullYear() - 12); this._renderCalendar(); });
    
    const titleBtn = document.createElement('button');
    titleBtn.className = 'ds-datepicker__title';
    titleBtn.type = 'button';
    titleBtn.textContent = `${startYear} - ${startYear + 11}`;
    titleBtn.addEventListener('click', (e) => { e.stopPropagation(); });
    
    const nextBtn = document.createElement('button');
    nextBtn.className = 'ds-datepicker__nav ds-datepicker__nav--next';
    nextBtn.type = 'button';
    nextBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>';
    nextBtn.addEventListener('click', (e) => { e.stopPropagation(); this.currentDate.setFullYear(this.currentDate.getFullYear() + 12); this._renderCalendar(); });
    
    header.appendChild(prevBtn);
    header.appendChild(titleBtn);
    header.appendChild(nextBtn);
    calendar.appendChild(header);
    
    const grid = document.createElement('div');
    grid.className = 'ds-datepicker__years-grid';
    
    for (let i = 0; i < 12; i++) {
      const year = startYear + i;
      const btn = document.createElement('button');
      btn.className = 'ds-datepicker__year-cell';
      btn.type = 'button';
      btn.textContent = year;
      if (year === currentYear) btn.classList.add('is-selected');
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.currentDate.setFullYear(year);
        this.viewMode = 'months';
        this._renderCalendar();
      });
      grid.appendChild(btn);
    }
    
    calendar.appendChild(grid);
  }

  _renderMonthsView() {
    const calendar = this.calendarEl;
    calendar.innerHTML = '';
    
    const year = this.currentDate.getFullYear();
    
    const header = document.createElement('div');
    header.className = 'ds-datepicker__header';
    
    const prevBtn = document.createElement('button');
    prevBtn.className = 'ds-datepicker__nav ds-datepicker__nav--prev';
    prevBtn.type = 'button';
    prevBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>';
    prevBtn.addEventListener('click', (e) => { e.stopPropagation(); this.currentDate.setFullYear(this.currentDate.getFullYear() - 1); this._renderCalendar(); });
    
    const titleBtn = document.createElement('button');
    titleBtn.className = 'ds-datepicker__title';
    titleBtn.type = 'button';
    titleBtn.textContent = year;
    titleBtn.addEventListener('click', (e) => { e.stopPropagation(); this.viewMode = 'years'; this._renderCalendar(); });
    
    const nextBtn = document.createElement('button');
    nextBtn.className = 'ds-datepicker__nav ds-datepicker__nav--next';
    nextBtn.type = 'button';
    nextBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>';
    nextBtn.addEventListener('click', (e) => { e.stopPropagation(); this.currentDate.setFullYear(this.currentDate.getFullYear() + 1); this._renderCalendar(); });
    
    header.appendChild(prevBtn);
    header.appendChild(titleBtn);
    header.appendChild(nextBtn);
    calendar.appendChild(header);
    
    const grid = document.createElement('div');
    grid.className = 'ds-datepicker__months-grid';
    
    this.months.forEach((monthName, idx) => {
      const btn = document.createElement('button');
      btn.className = 'ds-datepicker__month-cell';
      btn.type = 'button';
      btn.textContent = monthName;
      if (idx === this.currentDate.getMonth()) btn.classList.add('is-selected');
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.currentDate.setMonth(idx);
        this.viewMode = 'days';
        this._renderCalendar();
      });
      grid.appendChild(btn);
    });
    
    calendar.appendChild(grid);
  }

  _selectDate(date) {
    if (this._isDateDisabled(date)) return;
    
    if (this.range) {
      if (!this.isSelectingEnd || !this.rangeStart) {
        this.rangeStart = date;
        this.rangeEnd = null;
        this.isSelectingEnd = true;
      } else {
        this.rangeEnd = date;
        // Ensure start <= end
        if (this.rangeEnd < this.rangeStart) {
          [this.rangeStart, this.rangeEnd] = [this.rangeEnd, this.rangeStart];
        }
        this.isSelectingEnd = false;
        
        if (this.input) this.input.value = this._formatDate(this.rangeStart);
        if (this.endInput) this.endInput.value = this._formatDate(this.rangeEnd);
        
        this.calendarEl.style.display = 'none';
        this.calendarEl.setAttribute('hidden', '');
        this._fireChange();
        return;
      }
    } else {
      this.selectedDate = date;
      if (this.input) {
        this.input.value = this._formatDate(date);
      }
      this.calendarEl.style.display = 'none';
      this.calendarEl.setAttribute('hidden', '');
      this._fireChange();
      return;
    }
    
    this._renderCalendar();
  }

  _fireChange() {
    if (this.input) {
      this.input.dispatchEvent(new Event('change', { bubbles: true }));
    }
    
    if (this.onChange) {
      if (this.range) {
        this.onChange({ start: this.rangeStart, end: this.rangeEnd, startStr: this._formatDate(this.rangeStart), endStr: this._formatDate(this.rangeEnd) });
      } else {
        this.onChange({ date: this.selectedDate, dateStr: this._formatDate(this.selectedDate) });
      }
    }
    
    this.element.dispatchEvent(new CustomEvent('kupola:datepicker-change', {
      detail: {
        date: this.selectedDate,
        dateStr: this._formatDate(this.selectedDate),
        rangeStart: this.rangeStart,
        rangeEnd: this.rangeEnd
      },
      bubbles: true
    }));
  }

  _prevMonth() {
    this.currentDate.setMonth(this.currentDate.getMonth() - 1);
    this._renderCalendar();
  }

  _nextMonth() {
    this.currentDate.setMonth(this.currentDate.getMonth() + 1);
    this._renderCalendar();
  }

  _goToToday() {
    const today = new Date();
    this.currentDate = new Date(today);
    
    if (!this._isDateDisabled(today)) {
      this._selectDate(today);
    } else {
      this._renderCalendar();
    }
  }

  _clearDate() {
    this.selectedDate = null;
    this.rangeStart = null;
    this.rangeEnd = null;
    this.isSelectingEnd = false;
    if (this.input) this.input.value = '';
    if (this.endInput) this.endInput.value = '';
    this.calendarEl.style.display = 'none';
    this.calendarEl.setAttribute('hidden', '');
    this._fireChange();
  }

  // Public API
  setDate(date) {
    const d = typeof date === 'string' ? this._parseDate(date) : date;
    if (d) {
      this.selectedDate = d;
      this.currentDate = new Date(d);
      if (this.input) this.input.value = this._formatDate(d);
      this._renderCalendar();
    }
  }

  getDate() {
    return this.selectedDate;
  }

  setRange(start, end) {
    this.rangeStart = typeof start === 'string' ? this._parseDate(start) : start;
    this.rangeEnd = typeof end === 'string' ? this._parseDate(end) : end;
    if (this.input) this.input.value = this._formatDate(this.rangeStart);
    if (this.endInput) this.endInput.value = this._formatDate(this.rangeEnd);
    this._renderCalendar();
  }

  destroy() {
    if (!this.element.__kupolaInitialized) return;

    if (this.icon && this._iconClickHandler) this.icon.removeEventListener('click', this._iconClickHandler);
    if (this.input && this._inputClickHandler) this.input.removeEventListener('click', this._inputClickHandler);
    if (this._keydownHandler) document.removeEventListener('keydown', this._keydownHandler);

    if (this._documentClickListener && this._documentClickListener.unsubscribe) {
      this._documentClickListener.unsubscribe();
    } else if (this._documentClickHandler) {
      document.removeEventListener('click', this._documentClickHandler);
    }

    if (this._resizeListener && this._resizeListener.unsubscribe) {
      this._resizeListener.unsubscribe();
    } else if (this._resizeHandler) {
      window.removeEventListener('resize', this._resizeHandler);
    }

    if (this.calendarEl) {
      this.calendarEl.querySelectorAll('.ds-datepicker__day').forEach(dayEl => {
        if (dayEl._dayClickHandler) dayEl.removeEventListener('click', dayEl._dayClickHandler);
      });
    }

    this._documentClickHandler = null;
    this._resizeHandler = null;
    this._documentClickListener = null;
    this._resizeListener = null;
    this._iconClickHandler = null;
    this._inputClickHandler = null;
    this._keydownHandler = null;
    this.element.__kupolaInitialized = false;
  }
}

function initDatepicker(element, options) {
  const picker = new Datepicker(element, options);
  picker.init();
  element._kupolaDatepicker = picker;
}

function initDatepickers(root = document) {
  root.querySelectorAll('.ds-datepicker').forEach(picker => {
    initDatepicker(picker);
  });
}

function cleanupDatepicker(picker) {
  if (picker._kupolaDatepicker) {
    picker._kupolaDatepicker.destroy();
    picker._kupolaDatepicker = null;
  }
}

function cleanupAllDatepickers() {
  document.querySelectorAll('.ds-datepicker').forEach(picker => {
    cleanupDatepicker(picker);
  });
}

export { Datepicker, initDatepicker, initDatepickers, cleanupDatepicker, cleanupAllDatepickers };

if (typeof window !== 'undefined') {
  window.Datepicker = Datepicker;
  window.initDatepicker = initDatepicker;
  window.initDatepickers = initDatepickers;
  window.cleanupDatepicker = cleanupDatepicker;
  window.cleanupAllDatepickers = cleanupAllDatepickers;
  
  if (window.kupolaInitializer) {
    window.kupolaInitializer.register('datepicker', initDatepicker, cleanupDatepicker);
  }
}
