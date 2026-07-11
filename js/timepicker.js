class Timepicker {
  constructor(element, options = {}) {
    this.element = element;
    this.input = element.querySelector('input');
    this.inputWrap = element.querySelector('.ds-timepicker__input-wrap');
    this.panelEl = null;
    this.scope = `timepicker-${Math.random().toString(36).substr(2, 9)}`;
    
    // Options
    this.showSeconds = options.showSeconds || element.hasAttribute('data-timepicker-seconds');
    this.use12Hour = options.use12Hour || element.hasAttribute('data-timepicker-12h');
    this.hourStep = options.hourStep || parseInt(element.getAttribute('data-timepicker-hour-step')) || 1;
    this.minuteStep = options.minuteStep || parseInt(element.getAttribute('data-timepicker-minute-step')) || 5;
    this.secondStep = options.secondStep || parseInt(element.getAttribute('data-timepicker-second-step')) || 5;
    this.minTime = options.minTime || element.getAttribute('data-timepicker-min') || null; // "HH:MM" or "HH:MM:SS"
    this.maxTime = options.maxTime || element.getAttribute('data-timepicker-max') || null;
    this.disabledTime = options.disabledTime || null; // function(hour, minute, second) => boolean
    this.placeholder = options.placeholder || element.getAttribute('data-timepicker-placeholder') || '';
    this.clearable = options.clearable || element.hasAttribute('data-timepicker-clear');
    this.onChange = options.onChange || null;
    
    this.selectedHour = 12;
    this.selectedMinute = 0;
    this.selectedSecond = 0;
    this.isPM = false;
    
    this._inputWrapClickHandler = null;
    this._documentClickHandler = null;
    this._documentClickListener = null;
    this._resizeHandler = null;
    this._resizeListener = null;
    this._keydownHandler = null;
  }

  init() {
    if (this.element.__kupolaInitialized) return;

    if (this.placeholder && this.input) {
      this.input.placeholder = this.placeholder;
    }

    // Parse initial value
    if (this.input && this.input.value) {
      this._parseInputValue();
    }

    this._inputWrapClickHandler = (e) => {
      e.stopPropagation();
      if (this.panelEl && this.panelEl.style.display === 'block') {
        this.hideTimepicker();
      } else {
        this.showTimepicker();
      }
    };

    this.inputWrap.addEventListener('click', this._inputWrapClickHandler);

    if (window.globalEvents) {
      this._documentClickListener = window.globalEvents.on(document, 'click', (e) => this.hideTimepicker(e), { scope: this.scope });
      this._resizeListener = window.globalEvents.on(window, 'resize', () => this.resizeHandler(), { scope: this.scope });
    } else {
      document.addEventListener('click', (e) => this.hideTimepicker(e));
      window.addEventListener('resize', () => this.resizeHandler());
      this._documentClickHandler = (e) => this.hideTimepicker(e);
      this._resizeHandler = () => this.resizeHandler();
    }

    this._keydownHandler = (e) => {
      if (e.key === 'Escape' && this.panelEl && this.panelEl.style.display === 'block') {
        this.hideTimepicker();
      }
    };
    document.addEventListener('keydown', this._keydownHandler);

    this.element.__kupolaInitialized = true;
  }

  _parseInputValue() {
    const val = this.input.value.trim();
    if (!val) return;
    
    // Try 12h format: "2:30 PM"
    const ampmMatch = val.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM|am|pm)$/i);
    if (ampmMatch) {
      this.selectedHour = parseInt(ampmMatch[1]) % 12;
      if (ampmMatch[4].toUpperCase() === 'PM') this.selectedHour += 12;
      this.selectedMinute = parseInt(ampmMatch[2]);
      this.selectedSecond = ampmMatch[3] ? parseInt(ampmMatch[3]) : 0;
      return;
    }
    
    // 24h format: "14:30" or "14:30:45"
    const parts = val.split(':');
    if (parts.length >= 2) {
      this.selectedHour = parseInt(parts[0]) || 0;
      this.selectedMinute = parseInt(parts[1]) || 0;
      this.selectedSecond = parts[2] ? parseInt(parts[2]) || 0 : 0;
    }
  }

  _isTimeDisabled(hour, minute, second) {
    if (this.disabledTime) return this.disabledTime(hour, minute, second);
    
    const timeVal = hour * 3600 + minute * 60 + second;
    
    if (this.minTime) {
      const minParts = this.minTime.split(':');
      const minVal = parseInt(minParts[0]) * 3600 + parseInt(minParts[1]) * 60 + (parseInt(minParts[2]) || 0);
      if (timeVal < minVal) return true;
    }
    
    if (this.maxTime) {
      const maxParts = this.maxTime.split(':');
      const maxVal = parseInt(maxParts[0]) * 3600 + parseInt(maxParts[1]) * 60 + (parseInt(maxParts[2]) || 0);
      if (timeVal > maxVal) return true;
    }
    
    return false;
  }

  _formatTime() {
    let h = this.selectedHour;
    let m = this.selectedMinute;
    let s = this.selectedSecond;
    
    if (this.use12Hour) {
      const period = h >= 12 ? 'PM' : 'AM';
      h = h % 12 || 12;
      if (this.showSeconds) {
        return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')} ${period}`;
      }
      return `${h}:${String(m).padStart(2, '0')} ${period}`;
    }
    
    if (this.showSeconds) {
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  calculatePosition() {
    if (!this.panelEl) return;
    
    const pickerRect = this.element.getBoundingClientRect();
    const panelRect = this.panelEl.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    
    const spaceBelow = viewportHeight - pickerRect.bottom;
    const spaceAbove = pickerRect.top;
    const panelHeight = panelRect.height || 320;
    
    if (spaceBelow >= panelHeight) {
      this.panelEl.style.top = 'calc(100% + 4px)';
      this.panelEl.style.bottom = 'auto';
    } else if (spaceAbove >= panelHeight) {
      this.panelEl.style.top = 'auto';
      this.panelEl.style.bottom = 'calc(100% + 4px)';
    } else {
      this.panelEl.style.top = 'calc(100% + 4px)';
      this.panelEl.style.bottom = 'auto';
    }
  }

  showTimepicker() {
    if (this.panelEl) {
      this.panelEl.style.display = 'block';
      this._syncPanelSelection();
      this.calculatePosition();
      return;
    }
    
    this.panelEl = document.createElement('div');
    this.panelEl.className = 'ds-timepicker__panel';
    
    // Build panel HTML
    let sectionsHTML = '';
    
    // Hour section
    sectionsHTML += `<div class="ds-timepicker__section">
      <div class="ds-timepicker__section-label">Hour</div>
      <div class="ds-timepicker__grid ds-timepicker__grid--hour" data-type="hour"></div>
    </div>`;
    
    // Minute section
    sectionsHTML += `<div class="ds-timepicker__section">
      <div class="ds-timepicker__section-label">Min</div>
      <div class="ds-timepicker__grid ds-timepicker__grid--minute" data-type="minute"></div>
    </div>`;
    
    // Second section (optional)
    if (this.showSeconds) {
      sectionsHTML += `<div class="ds-timepicker__section">
        <div class="ds-timepicker__section-label">Sec</div>
        <div class="ds-timepicker__grid ds-timepicker__grid--second" data-type="second"></div>
      </div>`;
    }
    
    // AM/PM section (optional)
    if (this.use12Hour) {
      sectionsHTML += `<div class="ds-timepicker__section ds-timepicker__section--ampm">
        <div class="ds-timepicker__grid ds-timepicker__grid--ampm" data-type="ampm"></div>
      </div>`;
    }
    
    this.panelEl.innerHTML = `
      <div class="ds-timepicker__header">
        <div class="ds-timepicker__display">
          <span class="ds-timepicker__display-hour">${String(this.selectedHour).padStart(2, '0')}</span>
          <span class="ds-timepicker__separator">:</span>
          <span class="ds-timepicker__display-minute">${String(this.selectedMinute).padStart(2, '0')}</span>
          ${this.showSeconds ? '<span class="ds-timepicker__separator">:</span><span class="ds-timepicker__display-second">' + String(this.selectedSecond).padStart(2, '0') + '</span>' : ''}
          ${this.use12Hour ? '<span class="ds-timepicker__display-ampm">' + (this.selectedHour >= 12 ? 'PM' : 'AM') + '</span>' : ''}
        </div>
      </div>
      <div class="ds-timepicker__body">${sectionsHTML}</div>
      ${this.clearable ? '<div class="ds-timepicker__footer"><button class="ds-timepicker__clear-btn" type="button">Clear</button></div>' : ''}
    `;
    
    this.element.appendChild(this.panelEl);
    
    // Populate grids
    this._populateHourGrid();
    this._populateMinuteGrid();
    if (this.showSeconds) this._populateSecondGrid();
    if (this.use12Hour) this._populateAmPmGrid();
    
    // Clear button
    if (this.clearable) {
      const clearBtn = this.panelEl.querySelector('.ds-timepicker__clear-btn');
      if (clearBtn) {
        clearBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.input.value = '';
          this.hideTimepicker();
          this.input.dispatchEvent(new Event('change'));
        });
      }
    }
    
    this.panelEl.addEventListener('click', (e) => e.stopPropagation());
    
    this._syncPanelSelection();
    
    setTimeout(() => {
      this.calculatePosition();
      // Scroll selected items into view
      this._scrollToSelection();
    }, 0);
  }

  _populateHourGrid() {
    const grid = this.panelEl.querySelector('[data-type="hour"]');
    if (!grid) return;
    
    const max = this.use12Hour ? 12 : 24;
    const start = this.use12Hour ? 1 : 0;
    
    for (let i = start; i < (this.use12Hour ? 13 : 24); i += this.hourStep) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ds-timepicker__item';
      btn.textContent = String(i).padStart(2, '0');
      btn.dataset.value = i;
      
      btn.addEventListener('click', () => {
        let hour = i;
        if (this.use12Hour) {
          if (i === 12) hour = this.isPM ? 12 : 0;
          else hour = this.isPM ? i + 12 : i;
        }
        this.selectedHour = hour;
        this._updateDisplay();
        this._syncGridSelection('hour', i);
        this._confirmSelection();
      });
      
      grid.appendChild(btn);
    }
  }

  _populateMinuteGrid() {
    const grid = this.panelEl.querySelector('[data-type="minute"]');
    if (!grid) return;
    
    for (let i = 0; i < 60; i += this.minuteStep) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ds-timepicker__item';
      btn.textContent = String(i).padStart(2, '0');
      btn.dataset.value = i;
      
      btn.addEventListener('click', () => {
        this.selectedMinute = i;
        this._updateDisplay();
        this._syncGridSelection('minute', i);
        this._confirmSelection();
      });
      
      grid.appendChild(btn);
    }
  }

  _populateSecondGrid() {
    const grid = this.panelEl.querySelector('[data-type="second"]');
    if (!grid) return;
    
    for (let i = 0; i < 60; i += this.secondStep) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ds-timepicker__item';
      btn.textContent = String(i).padStart(2, '0');
      btn.dataset.value = i;
      
      btn.addEventListener('click', () => {
        this.selectedSecond = i;
        this._updateDisplay();
        this._syncGridSelection('second', i);
        this._confirmSelection();
      });
      
      grid.appendChild(btn);
    }
  }

  _populateAmPmGrid() {
    const grid = this.panelEl.querySelector('[data-type="ampm"]');
    if (!grid) return;
    
    ['AM', 'PM'].forEach(label => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ds-timepicker__item';
      btn.textContent = label;
      btn.dataset.value = label;
      
      btn.addEventListener('click', () => {
        this.isPM = label === 'PM';
        if (this.isPM && this.selectedHour < 12) this.selectedHour += 12;
        if (!this.isPM && this.selectedHour >= 12) this.selectedHour -= 12;
        this._updateDisplay();
        grid.querySelectorAll('.ds-timepicker__item').forEach(b => b.classList.remove('is-selected'));
        btn.classList.add('is-selected');
        this._confirmSelection();
      });
      
      grid.appendChild(btn);
    });
  }

  _updateDisplay() {
    if (!this.panelEl) return;
    
    const displayHour = this.panelEl.querySelector('.ds-timepicker__display-hour');
    const displayMinute = this.panelEl.querySelector('.ds-timepicker__display-minute');
    const displaySecond = this.panelEl.querySelector('.ds-timepicker__display-second');
    const displayAmPm = this.panelEl.querySelector('.ds-timepicker__display-ampm');
    
    if (displayHour) {
      const h = this.use12Hour ? (this.selectedHour % 12 || 12) : this.selectedHour;
      displayHour.textContent = String(h).padStart(2, '0');
    }
    if (displayMinute) displayMinute.textContent = String(this.selectedMinute).padStart(2, '0');
    if (displaySecond) displaySecond.textContent = String(this.selectedSecond).padStart(2, '0');
    if (displayAmPm) displayAmPm.textContent = this.selectedHour >= 12 ? 'PM' : 'AM';
  }

  _syncPanelSelection() {
    if (!this.panelEl) return;
    
    // Sync hour grid
    const hourVal = this.use12Hour ? (this.selectedHour % 12 || 12) : this.selectedHour;
    this._syncGridSelection('hour', hourVal);
    this._syncGridSelection('minute', this.selectedMinute);
    this._syncGridSelection('second', this.selectedSecond);
    
    // Sync AM/PM
    const ampmGrid = this.panelEl.querySelector('[data-type="ampm"]');
    if (ampmGrid) {
      ampmGrid.querySelectorAll('.ds-timepicker__item').forEach(b => {
        b.classList.toggle('is-selected', (b.dataset.value === 'PM') === (this.selectedHour >= 12));
      });
    }
    
    this._updateDisplay();
  }

  _syncGridSelection(type, value) {
    const grid = this.panelEl.querySelector(`[data-type="${type}"]`);
    if (!grid) return;
    grid.querySelectorAll('.ds-timepicker__item').forEach(b => {
      b.classList.toggle('is-selected', parseInt(b.dataset.value) === value);
    });
  }

  _scrollToSelection() {
    ['hour', 'minute', 'second'].forEach(type => {
      const grid = this.panelEl.querySelector(`[data-type="${type}"]`);
      if (!grid) return;
      const selected = grid.querySelector('.is-selected');
      if (selected) selected.scrollIntoView({ block: 'center' });
    });
  }

  _confirmSelection() {
    this.input.value = this._formatTime();
  }

  hideTimepicker(e) {
    if (this.panelEl && this.panelEl.style.display === 'block') {
      if (!this.element.contains(e.target)) {
        this.panelEl.style.display = 'none';
        this.input.value = this._formatTime();
        this.input.dispatchEvent(new Event('change'));
        if (this.onChange) {
          this.onChange({ hour: this.selectedHour, minute: this.selectedMinute, second: this.selectedSecond, timeStr: this._formatTime() });
        }
      }
    }
  }

  resizeHandler() {
    if (this.panelEl && this.panelEl.style.display === 'block') {
      this.calculatePosition();
    }
  }

  // Public API
  setTime(hour, minute, second) {
    this.selectedHour = Math.max(0, Math.min(23, hour));
    this.selectedMinute = Math.max(0, Math.min(59, minute));
    this.selectedSecond = Math.max(0, Math.min(59, second || 0));
    this.isPM = this.selectedHour >= 12;
    if (this.input) this.input.value = this._formatTime();
    if (this.panelEl) this._syncPanelSelection();
  }

  getTime() {
    return { hour: this.selectedHour, minute: this.selectedMinute, second: this.selectedSecond };
  }

  destroy() {
    if (!this.element.__kupolaInitialized) return;

    if (this.inputWrap && this._inputWrapClickHandler) {
      this.inputWrap.removeEventListener('click', this._inputWrapClickHandler);
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

    if (this._keydownHandler) document.removeEventListener('keydown', this._keydownHandler);

    if (this.panelEl) {
      this.panelEl.remove();
      this.panelEl = null;
    }

    this._inputWrapClickHandler = null;
    this._documentClickHandler = null;
    this._documentClickListener = null;
    this._resizeHandler = null;
    this._resizeListener = null;
    this._keydownHandler = null;
    this.element.__kupolaInitialized = false;
  }
}

function initTimepicker(element, options) {
  const picker = new Timepicker(element, options);
  picker.init();
  element._kupolaTimepicker = picker;
}

function initTimepickers(root = document) {
  root.querySelectorAll('.ds-timepicker').forEach(picker => {
    initTimepicker(picker);
  });
}

function cleanupTimepicker(element) {
  if (element._kupolaTimepicker) {
    element._kupolaTimepicker.destroy();
    element._kupolaTimepicker = null;
  }
}

export { Timepicker, initTimepicker, initTimepickers, cleanupTimepicker };

if (typeof window !== 'undefined') {
  window.Timepicker = Timepicker;
  window.initTimepicker = initTimepicker;
  window.initTimepickers = initTimepickers;
  window.cleanupTimepicker = cleanupTimepicker;
  
  if (window.kupolaInitializer) {
    window.kupolaInitializer.register('timepicker', initTimepicker, cleanupTimepicker);
  }
}
