class Datepicker {
  constructor(element) {
    this.element = element;
    this.input = element.querySelector('input');
    this.icon = element.querySelector('.ds-datepicker__icon');
    this.calendarEl = element.querySelector('.ds-datepicker__calendar');
    this.scope = `datepicker-${Math.random().toString(36).substr(2, 9)}`;
    
    this._iconClickHandler = null;
    this._inputClickHandler = null;
    this._documentClickHandler = null;
    this._documentClickListener = null;
    this._resizeHandler = null;
    this._resizeListener = null;
  }

  init() {
    if (!this.calendarEl) return;
    if (this.element.__kupolaInitialized) return;

    this._iconClickHandler = (e) => this.toggleCalendar(e);
    this._inputClickHandler = (e) => this.toggleCalendar(e);

    if (this.icon) {
      this.icon.addEventListener('click', this._iconClickHandler);
    }

    this.input.addEventListener('click', this._inputClickHandler);

    if (window.globalEvents) {
      this._documentClickListener = window.globalEvents.on(document, 'click', (e) => this.hideCalendar(e), { scope: this.scope });
      this._resizeListener = window.globalEvents.on(window, 'resize', () => this.resizeHandler(), { scope: this.scope });
    } else {
      document.addEventListener('click', (e) => this.hideCalendar(e));
      window.addEventListener('resize', () => this.resizeHandler());
      this._documentClickHandler = (e) => this.hideCalendar(e);
      this._resizeHandler = () => this.resizeHandler();
    }

    this.element.__kupolaInitialized = true;
    this.initCalendar();
  }

  calculatePosition() {
    const pickerRect = this.element.getBoundingClientRect();
    const calendarRect = this.calendarEl.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    
    const spaceBelow = viewportHeight - pickerRect.bottom;
    const spaceAbove = pickerRect.top;
    const calendarHeight = calendarRect.height || 280;
    
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
    
    document.querySelectorAll('.ds-datepicker__calendar').forEach(c => {
      c.style.display = 'none';
      c.setAttribute('hidden', '');
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
    }
  }

  resizeHandler() {
    if (this.calendarEl.style.display === 'block') {
      this.calculatePosition();
    }
  }

  initCalendar() {
    const calendar = this.calendarEl;
    const input = this.input;
    const titleEl = calendar.querySelector('.ds-datepicker__title');
    const daysEl = calendar.querySelector('.ds-datepicker__days');
    const prevBtn = calendar.querySelector('.ds-datepicker__nav--prev');
    const nextBtn = calendar.querySelector('.ds-datepicker__nav--next');
    
    let currentDate = new Date();
    if (input.value) {
      const parts = input.value.split('-');
      if (parts.length === 3) {
        currentDate = new Date(parts[0], parts[1] - 1, parts[2]);
      }
    }
    
    function renderCalendar() {
      daysEl.querySelectorAll('.ds-datepicker__day').forEach(dayEl => {
        if (dayEl._dayClickHandler) {
          dayEl.removeEventListener('click', dayEl._dayClickHandler);
        }
      });
      
      daysEl.innerHTML = '';
      
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      
      titleEl.textContent = `${year} ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][month]}`;
      
      const firstDay = new Date(year, month, 1).getDay();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      
      for (let i = 0; i < firstDay; i++) {
        const emptyDay = document.createElement('span');
        emptyDay.className = 'ds-datepicker__day--empty';
        daysEl.appendChild(emptyDay);
      }
      
      for (let day = 1; day <= daysInMonth; day++) {
        const dayEl = document.createElement('button');
        dayEl.className = 'ds-datepicker__day';
        dayEl.textContent = day;
        
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        if (input.value === dateStr) {
          dayEl.classList.add('is-selected');
        }
        
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        if (dateStr === todayStr) {
          dayEl.classList.add('is-today');
        }
        
        const dayClickHandler = () => {
          input.value = dateStr;
          calendar.style.display = 'none';
          calendar.setAttribute('hidden', '');
          input.dispatchEvent(new Event('change'));
        };
        
        dayEl.addEventListener('click', dayClickHandler);
        dayEl._dayClickHandler = dayClickHandler;
        
        daysEl.appendChild(dayEl);
      }
    }
    
    const prevClickHandler = (e) => {
      e.stopPropagation();
      currentDate.setMonth(currentDate.getMonth() - 1);
      renderCalendar();
    };
    
    const nextClickHandler = (e) => {
      e.stopPropagation();
      currentDate.setMonth(currentDate.getMonth() + 1);
      renderCalendar();
    };
    
    if (prevBtn) {
      prevBtn.addEventListener('click', prevClickHandler);
      prevBtn._prevClickHandler = prevClickHandler;
    }
    
    if (nextBtn) {
      nextBtn.addEventListener('click', nextClickHandler);
      nextBtn._nextClickHandler = nextClickHandler;
    }
    
    calendar._calendarInitialized = true;
    renderCalendar();
  }

  destroy() {
    if (!this.element.__kupolaInitialized) return;

    if (this.icon && this._iconClickHandler) {
      this.icon.removeEventListener('click', this._iconClickHandler);
    }

    if (this.input && this._inputClickHandler) {
      this.input.removeEventListener('click', this._inputClickHandler);
    }

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
      const daysEl = this.calendarEl.querySelector('.ds-datepicker__days');
      if (daysEl) {
        daysEl.querySelectorAll('.ds-datepicker__day').forEach(dayEl => {
          if (dayEl._dayClickHandler) {
            dayEl.removeEventListener('click', dayEl._dayClickHandler);
          }
        });
      }
      const prevBtn = this.calendarEl.querySelector('.ds-datepicker__nav--prev');
      const nextBtn = this.calendarEl.querySelector('.ds-datepicker__nav--next');
      if (prevBtn && prevBtn._prevClickHandler) {
        prevBtn.removeEventListener('click', prevBtn._prevClickHandler);
      }
      if (nextBtn && nextBtn._nextClickHandler) {
        nextBtn.removeEventListener('click', nextBtn._nextClickHandler);
      }
    }

    this._documentClickHandler = null;
    this._resizeHandler = null;
    this._documentClickListener = null;
    this._resizeListener = null;
    this._iconClickHandler = null;
    this._inputClickHandler = null;
    this.element.__kupolaInitialized = false;
  }
}

function initDatepicker(element) {
  const picker = new Datepicker(element);
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

if (window.kupolaInitializer) {
  window.kupolaInitializer.register('datepicker', initDatepicker, cleanupDatepicker);
}