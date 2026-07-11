class Calendar {
    constructor(element, options = {}) {
        this.element = element;
        this.titleEl = element.querySelector('.ds-calendar__title');
        this.daysEl = element.querySelector('.ds-calendar__days');
        this.prevBtn = element.querySelector('.ds-calendar__nav--prev');
        this.nextBtn = element.querySelector('.ds-calendar__nav--next');
        this.todayBtn = element.querySelector('.ds-calendar__nav--today');
        this._listeners = [];
        
        if (!this.titleEl || !this.daysEl) {
            throw new Error('Calendar: Missing required elements');
        }

        this.currentDate = new Date();
        this.selectedDate = options.selectedDate ? new Date(options.selectedDate) : null;
        this.rangeStart = options.rangeStart ? new Date(options.rangeStart) : null;
        this.rangeEnd = options.rangeEnd ? new Date(options.rangeEnd) : null;
        this.isRangeMode = options.rangeMode || element.hasAttribute('data-calendar-range');
        this.viewMode = options.viewMode || element.getAttribute('data-calendar-view') || 'month'; // month | week
        this.events = options.events || [];
        this.i18n = options.i18n || {
            months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
            shortMonths: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            weekdays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
            shortWeekdays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
            today: 'Today',
            selectRangeStart: 'Select start date',
            selectRangeEnd: 'Select end date'
        };
        this.onSelect = options.onSelect || null;
        this.onRangeSelect = options.onRangeSelect || null;
        this.onChange = options.onChange || null;
        this.onEventClick = options.onEventClick || null;

        this._init();
    }

    _init() {
        this.render();

        const prevHandler = () => {
            if (this.viewMode === 'week') {
                this.currentDate.setDate(this.currentDate.getDate() - 7);
            } else {
                this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            }
            this.render();
            this._emitChange();
        };

        const nextHandler = () => {
            if (this.viewMode === 'week') {
                this.currentDate.setDate(this.currentDate.getDate() + 7);
            } else {
                this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            }
            this.render();
            this._emitChange();
        };

        const todayHandler = () => {
            this.currentDate = new Date();
            this.render();
            this._emitChange();
        };

        if (this.prevBtn) {
            this.prevBtn.addEventListener('click', prevHandler);
            this._listeners.push({ el: this.prevBtn, event: 'click', handler: prevHandler });
        }

        if (this.nextBtn) {
            this.nextBtn.addEventListener('click', nextHandler);
            this._listeners.push({ el: this.nextBtn, event: 'click', handler: nextHandler });
        }

        if (this.todayBtn) {
            this.todayBtn.addEventListener('click', todayHandler);
            this._listeners.push({ el: this.todayBtn, event: 'click', handler: todayHandler });
        }
    }

    _emitChange() {
        const data = {
            date: this.currentDate,
            selectedDate: this.selectedDate,
            rangeStart: this.rangeStart,
            rangeEnd: this.rangeEnd,
            viewMode: this.viewMode
        };
        if (this.onChange) this.onChange(data);
        this.element.dispatchEvent(new CustomEvent('kupola:calendar-change', { detail: data, bubbles: true }));
    }

    _formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    _isSameDay(date1, date2) {
        if (!date1 || !date2) return false;
        return this._formatDate(date1) === this._formatDate(date2);
    }

    _isDateInRange(date) {
        if (!this.rangeStart || !this.rangeEnd) return false;
        const dateStr = this._formatDate(date);
        const startStr = this._formatDate(this.rangeStart);
        const endStr = this._formatDate(this.rangeEnd);
        return dateStr >= startStr && dateStr <= endStr;
    }

    _isRangeStart(date) {
        return this._isSameDay(date, this.rangeStart);
    }

    _isRangeEnd(date) {
        return this._isSameDay(date, this.rangeEnd);
    }

    _getEventsForDate(date) {
        const dateStr = this._formatDate(date);
        return this.events.filter(e => {
            const eventStart = e.date || e.start;
            const eventEnd = e.end;
            if (!eventStart) return false;
            const startStr = typeof eventStart === 'string' ? eventStart : this._formatDate(eventStart);
            if (!eventEnd) return startStr === dateStr;
            const endStr = typeof eventEnd === 'string' ? eventEnd : this._formatDate(eventEnd);
            return dateStr >= startStr && dateStr <= endStr;
        });
    }

    render() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        if (this.viewMode === 'week') {
            this._renderWeekView(year, month);
        } else {
            this._renderMonthView(year, month);
        }
    }

    _renderMonthView(year, month) {
        this.titleEl.textContent = `${year} ${this.i18n.months[month]}`;
        
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        this.daysEl.innerHTML = '';
        
        for (let i = 0; i < firstDay; i++) {
            const emptyDay = document.createElement('span');
            emptyDay.className = 'ds-calendar__day ds-calendar__day--empty';
            this.daysEl.appendChild(emptyDay);
        }
        
        const today = new Date();
        const todayStr = this._formatDate(today);
        
        for (let day = 1; day <= daysInMonth; day++) {
            const currentDate = new Date(year, month, day);
            const dayEl = document.createElement('button');
            dayEl.className = 'ds-calendar__day';
            dayEl.textContent = day;
            
            const dayStr = this._formatDate(currentDate);
            
            if (dayStr === todayStr) {
                dayEl.classList.add('is-today');
            }
            
            if (this._isSameDay(currentDate, this.selectedDate)) {
                dayEl.classList.add('is-selected');
            }
            
            if (this.isRangeMode) {
                if (this._isRangeStart(currentDate)) {
                    dayEl.classList.add('is-range-start');
                }
                if (this._isRangeEnd(currentDate)) {
                    dayEl.classList.add('is-range-end');
                }
                if (this._isDateInRange(currentDate)) {
                    dayEl.classList.add('is-in-range');
                }
            }
            
            const dayEvents = this._getEventsForDate(currentDate);
            if (dayEvents.length > 0) {
                dayEl.classList.add('has-events');
                const eventDot = document.createElement('span');
                eventDot.className = 'ds-calendar__day-event';
                eventDot.style.backgroundColor = dayEvents[0].color || '#007bff';
                dayEl.appendChild(eventDot);
            }
            
            const clickHandler = () => {
                this.element.querySelectorAll('.ds-calendar__day').forEach(d => d.classList.remove('is-selected'));
                dayEl.classList.add('is-selected');
                
                if (this.isRangeMode) {
                    if (!this.rangeStart || (this.rangeEnd && !this._isSameDay(currentDate, this.rangeEnd))) {
                        this.rangeStart = currentDate;
                        this.rangeEnd = null;
                    } else if (this.rangeStart && !this.rangeEnd) {
                        if (currentDate < this.rangeStart) {
                            this.rangeEnd = this.rangeStart;
                            this.rangeStart = currentDate;
                        } else {
                            this.rangeEnd = currentDate;
                        }
                        
                        if (this.onRangeSelect) {
                            this.onRangeSelect({ start: this.rangeStart, end: this.rangeEnd });
                        }
                        this.element.dispatchEvent(new CustomEvent('kupola:calendar-range-select', {
                            detail: { start: this.rangeStart, end: this.rangeEnd },
                            bubbles: true
                        }));
                    }
                } else {
                    this.selectedDate = currentDate;
                    if (this.onSelect) {
                        this.onSelect({ date: currentDate, dateStr: dayStr });
                    }
                    this.element.dispatchEvent(new CustomEvent('kupola:calendar-select', {
                        detail: { date: currentDate, dateStr: dayStr },
                        bubbles: true
                    }));
                }
                
                dayEvents.forEach(event => {
                    if (this.onEventClick) {
                        this.onEventClick(event, currentDate);
                    }
                });
                
                this.render();
            };
            
            dayEl.addEventListener('click', clickHandler);
            this._listeners.push({ el: dayEl, event: 'click', handler: clickHandler });
            
            this.daysEl.appendChild(dayEl);
        }
    }

    _renderWeekView(year, month) {
        const dayOfWeek = this.currentDate.getDay();
        const monday = new Date(year, month, this.currentDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));
        
        const startDate = monday;
        const endDate = new Date(monday);
        endDate.setDate(monday.getDate() + 6);
        
        this.titleEl.textContent = `${this.i18n.shortMonths[startDate.getMonth()]} ${startDate.getDate()} - ${this.i18n.shortMonths[endDate.getMonth()]} ${endDate.getDate()} ${year}`;
        
        this.daysEl.innerHTML = '';
        
        const today = new Date();
        const todayStr = this._formatDate(today);
        
        for (let i = 0; i < 7; i++) {
            const currentDate = new Date(monday);
            currentDate.setDate(monday.getDate() + i);
            
            const dayEl = document.createElement('button');
            dayEl.className = 'ds-calendar__day ds-calendar__day--week';
            
            const dayHeader = document.createElement('span');
            dayHeader.className = 'ds-calendar__day-header';
            dayHeader.textContent = this.i18n.shortWeekdays[currentDate.getDay()];
            dayEl.appendChild(dayHeader);
            
            const dayNum = document.createElement('span');
            dayNum.className = 'ds-calendar__day-number';
            dayNum.textContent = currentDate.getDate();
            dayEl.appendChild(dayNum);
            
            const dayStr = this._formatDate(currentDate);
            
            if (dayStr === todayStr) {
                dayEl.classList.add('is-today');
            }
            
            if (this._isSameDay(currentDate, this.selectedDate)) {
                dayEl.classList.add('is-selected');
            }
            
            const dayEvents = this._getEventsForDate(currentDate);
            if (dayEvents.length > 0) {
                const eventsContainer = document.createElement('span');
                eventsContainer.className = 'ds-calendar__day-events';
                dayEvents.slice(0, 3).forEach(event => {
                    const eventDot = document.createElement('span');
                    eventDot.className = 'ds-calendar__day-event';
                    eventDot.style.backgroundColor = event.color || '#007bff';
                    eventsContainer.appendChild(eventDot);
                });
                dayEl.appendChild(eventsContainer);
            }
            
            const clickHandler = () => {
                this.element.querySelectorAll('.ds-calendar__day').forEach(d => d.classList.remove('is-selected'));
                dayEl.classList.add('is-selected');
                this.selectedDate = currentDate;
                
                if (this.onSelect) {
                    this.onSelect({ date: currentDate, dateStr: dayStr });
                }
                this.element.dispatchEvent(new CustomEvent('kupola:calendar-select', {
                    detail: { date: currentDate, dateStr: dayStr },
                    bubbles: true
                }));
                
                this.render();
            };
            
            dayEl.addEventListener('click', clickHandler);
            this._listeners.push({ el: dayEl, event: 'click', handler: clickHandler });
            
            this.daysEl.appendChild(dayEl);
        }
    }

    destroy() {
        this._listeners.forEach(({ el, event, handler }) => {
            el.removeEventListener(event, handler);
        });
        this._listeners = null;
        this.titleEl = null;
        this.daysEl = null;
        this.prevBtn = null;
        this.nextBtn = null;
        this.todayBtn = null;
        this.element = null;
    }

    setDate(date) {
        this.currentDate = new Date(date);
        this.render();
        this._emitChange();
    }

    getDate() {
        return this.currentDate;
    }

    setSelectedDate(date) {
        this.selectedDate = date ? new Date(date) : null;
        this.render();
    }

    getSelectedDate() {
        return this.selectedDate;
    }

    setRange(start, end) {
        this.rangeStart = start ? new Date(start) : null;
        this.rangeEnd = end ? new Date(end) : null;
        this.render();
        
        if (this.onRangeSelect && this.rangeStart && this.rangeEnd) {
            this.onRangeSelect({ start: this.rangeStart, end: this.rangeEnd });
        }
    }

    getRange() {
        return { start: this.rangeStart, end: this.rangeEnd };
    }

    setEvents(events) {
        this.events = events || [];
        this.render();
    }

    addEvent(event) {
        this.events.push(event);
        this.render();
    }

    removeEvent(eventId) {
        this.events = this.events.filter(e => e.id !== eventId);
        this.render();
    }

    setViewMode(mode) {
        if (mode === 'month' || mode === 'week') {
            this.viewMode = mode;
            this.render();
            this._emitChange();
        }
    }

    getViewMode() {
        return this.viewMode;
    }

    setI18n(i18n) {
        this.i18n = { ...this.i18n, ...i18n };
        this.render();
    }

    prevMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        this.render();
        this._emitChange();
    }

    nextMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        this.render();
        this._emitChange();
    }

    prevWeek() {
        this.currentDate.setDate(this.currentDate.getDate() - 7);
        this.render();
        this._emitChange();
    }

    nextWeek() {
        this.currentDate.setDate(this.currentDate.getDate() + 7);
        this.render();
        this._emitChange();
    }

    goToToday() {
        this.currentDate = new Date();
        this.render();
        this._emitChange();
    }

    goToDate(date) {
        this.currentDate = new Date(date);
        this.render();
        this._emitChange();
    }

    toggleRangeMode() {
        this.isRangeMode = !this.isRangeMode;
        this.rangeStart = null;
        this.rangeEnd = null;
        this.render();
        this._emitChange();
    }
}

function initCalendar(element, options) {
    if (element.__kupolaInitialized) return;

    try {
        const calendar = new Calendar(element, options);
        element.__kupolaInstance = calendar;
        element.__kupolaInitialized = true;
    } catch (error) {
        console.error('[Calendar] Error initializing:', error);
    }
}

function cleanupCalendar(element) {
    if (!element.__kupolaInitialized || !element.__kupolaInstance) return;

    const calendar = element.__kupolaInstance;
    calendar.destroy();

    element.__kupolaInstance = null;
    element.__kupolaInitialized = false;
}

function initCalendars() {
    document.querySelectorAll('.ds-calendar').forEach(calendar => {
        initCalendar(calendar);
    });
}

export { Calendar, initCalendars, initCalendar, cleanupCalendar };

if (typeof window !== 'undefined') {
    window.Calendar = Calendar;
    window.initCalendar = initCalendar;
    window.cleanupCalendar = cleanupCalendar;
    window.initCalendars = initCalendars;
    
    if (window.kupolaInitializer) {
        window.kupolaInitializer.register('calendar', initCalendar, cleanupCalendar);
    }
}