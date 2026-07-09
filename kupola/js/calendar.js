class Calendar {
    constructor(element) {
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
        this._init();
    }

    _init() {
        this.render();

        const prevHandler = () => {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            this.render();
        };

        const nextHandler = () => {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.render();
        };

        const todayHandler = () => {
            this.currentDate = new Date();
            this.render();
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

    render() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        this.titleEl.textContent = `${year} ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][month]}`;
        
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        this.daysEl.innerHTML = '';
        
        for (let i = 0; i < firstDay; i++) {
            const emptyDay = document.createElement('span');
            emptyDay.className = 'ds-calendar__day ds-calendar__day--empty';
            this.daysEl.appendChild(emptyDay);
        }
        
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        
        for (let day = 1; day <= daysInMonth; day++) {
            const dayEl = document.createElement('button');
            dayEl.className = 'ds-calendar__day';
            dayEl.textContent = day;
            
            const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            
            if (dayStr === todayStr) {
                dayEl.classList.add('is-today');
            }
            
            const clickHandler = () => {
                this.element.querySelectorAll('.ds-calendar__day').forEach(d => d.classList.remove('is-selected'));
                dayEl.classList.add('is-selected');
                this.$emit('select', { date: new Date(year, month, day), dateStr: dayStr });
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
    }

    getDate() {
        return this.currentDate;
    }

    prevMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        this.render();
    }

    nextMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        this.render();
    }

    goToToday() {
        this.currentDate = new Date();
        this.render();
    }

    $emit(eventName, data) {
        if (this.element) {
            const customEvent = new CustomEvent(`kupola:calendar:${eventName}`, {
                detail: data,
                bubbles: true,
                cancelable: true
            });
            this.element.dispatchEvent(customEvent);
        }
    }
}

function initCalendar(element) {
    if (element.__kupolaInitialized) return;

    try {
        const calendar = new Calendar(element);
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

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Calendar, initCalendars, initCalendar, cleanupCalendar };
} else {
    window.Calendar = Calendar;
    window.initCalendar = initCalendar;
    window.cleanupCalendar = cleanupCalendar;
}

if (window.kupolaInitializer) {
    window.kupolaInitializer.register('calendar', initCalendar, cleanupCalendar);
}