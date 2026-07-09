class Countdown {
  constructor(element) {
    this.element = element;
    this.hoursEl = element.querySelector('.ds-countdown__item--hours .ds-countdown__value');
    this.minutesEl = element.querySelector('.ds-countdown__item--minutes .ds-countdown__value');
    this.secondsEl = element.querySelector('.ds-countdown__item--seconds .ds-countdown__value');
    
    this.endTime = this.parseEndTime();
    this.interval = null;
    
    this.init();
  }

  parseEndTime() {
    const dataEndTime = this.element.getAttribute('data-end-time');
    if (dataEndTime) {
      return new Date(dataEndTime).getTime();
    }
    
    const dataHours = parseInt(this.element.getAttribute('data-hours')) || 0;
    const dataMinutes = parseInt(this.element.getAttribute('data-minutes')) || 0;
    const dataSeconds = parseInt(this.element.getAttribute('data-seconds')) || 0;
    
    return new Date().getTime() + (dataHours * 3600 + dataMinutes * 60 + dataSeconds) * 1000;
  }

  init() {
    this.update();
    this.start();
  }

  start() {
    if (this.interval) {
      clearInterval(this.interval);
    }
    this.interval = setInterval(() => {
      this.update();
    }, 1000);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  reset() {
    this.stop();
    this.endTime = this.parseEndTime();
    this.init();
  }

  update() {
    const now = new Date().getTime();
    const distance = this.endTime - now;
    
    if (distance <= 0) {
      this.stop();
      this.displayTime(0, 0, 0);
      this.dispatchComplete();
      return;
    }
    
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);
    
    this.displayTime(hours, minutes, seconds);
  }

  displayTime(hours, minutes, seconds) {
    if (this.hoursEl) {
      this.hoursEl.textContent = String(hours).padStart(2, '0');
    }
    if (this.minutesEl) {
      this.minutesEl.textContent = String(minutes).padStart(2, '0');
    }
    if (this.secondsEl) {
      this.secondsEl.textContent = String(seconds).padStart(2, '0');
    }
  }

  setEndTime(date) {
    this.endTime = date.getTime();
    this.update();
  }

  addTime(seconds) {
    this.endTime += seconds * 1000;
    this.update();
  }

  dispatchComplete() {
    this.element.dispatchEvent(new CustomEvent('ds-countdown-complete', {
      detail: {}
    }));
  }

  destroy() {
    this.stop();
    this.hoursEl = null;
    this.minutesEl = null;
    this.secondsEl = null;
    this.element = null;
  }
}

function initCountdown(element) {
  if (element.__kupolaInitialized) return;

  const instance = new Countdown(element);
  element.__kupolaInstance = instance;
  element.__kupolaInitialized = true;
}

function cleanupCountdown(element) {
  if (!element.__kupolaInitialized || !element.__kupolaInstance) return;

  const instance = element.__kupolaInstance;
  instance.destroy();

  element.__kupolaInstance = null;
  element.__kupolaInitialized = false;
}

function initCountdowns() {
  const countdowns = document.querySelectorAll('.ds-countdown');
  countdowns.forEach(el => {
    initCountdown(el);
  });
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Countdown, initCountdowns, initCountdown, cleanupCountdown };
} else {
  window.Countdown = Countdown;
  window.initCountdown = initCountdown;
  window.cleanupCountdown = cleanupCountdown;
}

if (window.kupolaInitializer) {
  window.kupolaInitializer.register('countdown', initCountdown, cleanupCountdown);
}