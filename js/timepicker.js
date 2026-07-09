class Timepicker {
  constructor(element) {
    this.element = element;
    this.input = element.querySelector('input');
    this.inputWrap = element.querySelector('.ds-timepicker__input-wrap');
    this.panelEl = null;
    this.scope = `timepicker-${Math.random().toString(36).substr(2, 9)}`;
    
    this._inputWrapClickHandler = null;
    this._documentClickHandler = null;
    this._documentClickListener = null;
    this._resizeHandler = null;
    this._resizeListener = null;
    
    this.selectedHour = 12;
    this.selectedMinute = 0;
  }

  init() {
    if (this.element.__kupolaInitialized) return;

    this._inputWrapClickHandler = (e) => {
      e.stopPropagation();
      if (this.panelEl && this.panelEl.style.display === 'block') {
        this.panelEl.style.display = 'none';
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

    this.element.__kupolaInitialized = true;
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
      this.calculatePosition();
      return;
    }
    
    this.panelEl = document.createElement('div');
    this.panelEl.className = 'ds-timepicker__panel';
    this.panelEl.innerHTML = `
      <div class="ds-timepicker__header">
        <div class="ds-timepicker__display">
          <span class="ds-timepicker__display-hour">12</span>
          <span class="ds-timepicker__separator">:</span>
          <span class="ds-timepicker__display-minute">00</span>
        </div>
      </div>
      <div class="ds-timepicker__body">
        <div class="ds-timepicker__section">
          <div class="ds-timepicker__section-label">Hour</div>
          <div class="ds-timepicker__grid ds-timepicker__grid--hour" data-type="hour"></div>
        </div>
        <div class="ds-timepicker__section">
          <div class="ds-timepicker__section-label">Minute</div>
          <div class="ds-timepicker__grid ds-timepicker__grid--minute" data-type="minute"></div>
        </div>
      </div>
    `;
    this.element.appendChild(this.panelEl);
    
    if (this.input.value) {
      const timeParts = this.input.value.split(':');
      if (timeParts.length >= 2) {
        this.selectedHour = parseInt(timeParts[0]) || 0;
        this.selectedMinute = parseInt(timeParts[1]) || 0;
      }
    }
    
    const displayHour = this.panelEl.querySelector('.ds-timepicker__display-hour');
    const displayMinute = this.panelEl.querySelector('.ds-timepicker__display-minute');
    
    function updateDisplay() {
      displayHour.textContent = String(this.selectedHour).padStart(2, '0');
      displayMinute.textContent = String(this.selectedMinute).padStart(2, '0');
    }
    
    function updateInput() {
      this.input.value = `${String(this.selectedHour).padStart(2, '0')}:${String(this.selectedMinute).padStart(2, '0')}`;
    }
    
    function selectTimeAndClose() {
      updateInput.call(this);
      this.panelEl.style.display = 'none';
      this.input.dispatchEvent(new Event('change'));
    }
    
    const hourGrid = this.panelEl.querySelector('[data-type="hour"]');
    const minuteGrid = this.panelEl.querySelector('[data-type="minute"]');
    
    for (let i = 0; i < 24; i++) {
      const btn = document.createElement('button');
      btn.className = 'ds-timepicker__item';
      btn.textContent = String(i).padStart(2, '0');
      if (i === this.selectedHour) btn.classList.add('is-selected');
      btn.addEventListener('click', () => {
        hourGrid.querySelectorAll('.ds-timepicker__item').forEach(b => b.classList.remove('is-selected'));
        btn.classList.add('is-selected');
        this.selectedHour = i;
        updateDisplay.call(this);
        selectTimeAndClose.call(this);
      });
      hourGrid.appendChild(btn);
    }
    
    for (let i = 0; i < 60; i += 5) {
      const btn = document.createElement('button');
      btn.className = 'ds-timepicker__item';
      btn.textContent = String(i).padStart(2, '0');
      if (i === this.selectedMinute) btn.classList.add('is-selected');
      btn.addEventListener('click', () => {
        minuteGrid.querySelectorAll('.ds-timepicker__item').forEach(b => b.classList.remove('is-selected'));
        btn.classList.add('is-selected');
        this.selectedMinute = i;
        updateDisplay.call(this);
        selectTimeAndClose.call(this);
      });
      minuteGrid.appendChild(btn);
    }
    
    this.panelEl.addEventListener('click', (e) => {
      e.stopPropagation();
    });
    
    updateDisplay.call(this);
    updateInput.call(this);
    
    setTimeout(() => {
      this.calculatePosition();
    }, 0);
  }

  hideTimepicker(e) {
    if (this.panelEl && this.panelEl.style.display === 'block') {
      if (!this.element.contains(e.target)) {
        this.panelEl.style.display = 'none';
      }
    }
  }

  resizeHandler() {
    if (this.panelEl && this.panelEl.style.display === 'block') {
      this.calculatePosition();
    }
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

    if (this.panelEl) {
      this.panelEl.remove();
      this.panelEl = null;
    }

    this._inputWrapClickHandler = null;
    this._documentClickHandler = null;
    this._documentClickListener = null;
    this._resizeHandler = null;
    this._resizeListener = null;
    this.element.__kupolaInitialized = false;
  }
}

function initTimepicker(element) {
  const picker = new Timepicker(element);
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

if (window.kupolaInitializer) {
  window.kupolaInitializer.register('timepicker', initTimepicker, cleanupTimepicker);
}