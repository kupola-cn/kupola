class StatCard {
  constructor(element) {
    this.element = element;
    this.valueElement = element.querySelector('.ds-statcard__value');
    this.progressFill = element.querySelector('.ds-statcard__progress-fill');
    this.animated = false;
    this._observer = null;
    
    this.init();
  }

  init() {
    this.animateValue();
    this.animateProgress();
    
    this._observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !this.animated) {
          this.animateValue();
          this.animateProgress();
          this.animated = true;
        }
      });
    }, { threshold: 0.3 });
    
    this._observer.observe(this.element);
  }

  animateValue() {
    if (!this.valueElement) return;
    
    const text = this.valueElement.textContent;
    const match = text.match(/[\d.,]+/);
    if (!match) return;
    
    const targetValue = parseFloat(match[0].replace(',', ''));
    const prefix = text.substring(0, match.index);
    const suffix = text.substring(match.index + match[0].length);
    
    const duration = 1500;
    const startTime = performance.now();
    const startValue = 0;
    
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      
      const currentValue = startValue + (targetValue - startValue) * easeProgress;
      
      let formattedValue;
      if (targetValue >= 1000000) {
        formattedValue = (currentValue / 1000000).toFixed(1) + 'M';
      } else if (targetValue >= 1000) {
        formattedValue = (currentValue / 1000).toFixed(1) + 'K';
      } else if (Number.isInteger(targetValue)) {
        formattedValue = Math.floor(currentValue).toLocaleString();
      } else {
        formattedValue = currentValue.toFixed(2);
      }
      
      this.valueElement.textContent = prefix + formattedValue + suffix;
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }

  animateProgress() {
    if (!this.progressFill) return;
    
    const width = this.progressFill.getAttribute('data-width') || '0%';
    this.progressFill.style.width = width;
  }

  updateValue(newValue, options = {}) {
    if (!this.valueElement) return;
    
    const duration = options.duration || 800;
    const text = this.valueElement.textContent;
    const match = text.match(/[\d.,]+/);
    
    if (!match) {
      this.valueElement.textContent = newValue;
      return;
    }
    
    const prefix = text.substring(0, match.index);
    const suffix = text.substring(match.index + match[0].length);
    const startValue = parseFloat(match[0].replace(',', ''));
    const targetValue = parseFloat(newValue);
    
    const startTime = performance.now();
    
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      
      const currentValue = startValue + (targetValue - startValue) * easeProgress;
      
      let formattedValue;
      if (targetValue >= 1000000) {
        formattedValue = (currentValue / 1000000).toFixed(1) + 'M';
      } else if (targetValue >= 1000) {
        formattedValue = (currentValue / 1000).toFixed(1) + 'K';
      } else if (Number.isInteger(targetValue)) {
        formattedValue = Math.floor(currentValue).toLocaleString();
      } else {
        formattedValue = currentValue.toFixed(2);
      }
      
      this.valueElement.textContent = prefix + formattedValue + suffix;
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }

  updateProgress(percent, options = {}) {
    if (!this.progressFill) return;
    
    const duration = options.duration || 600;
    const currentWidth = parseFloat(this.progressFill.style.width || '0');
    const targetWidth = Math.min(Math.max(percent, 0), 100);
    
    const startTime = performance.now();
    
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      
      const currentWidthValue = currentWidth + (targetWidth - currentWidth) * easeProgress;
      this.progressFill.style.width = currentWidthValue + '%';
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }

  setTrend(direction, value) {
    const trendElement = this.element.querySelector('.ds-statcard__trend');
    if (!trendElement) return;
    
    trendElement.className = `ds-statcard__trend ds-statcard__trend--${direction}`;
    
    const iconSvg = direction === 'up' 
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/></svg>'
      : direction === 'down'
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 18 10.5 8.5 15.5 13.5 23 6"/></svg>'
      : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="12 19 18 13 12 7 6 13"/></svg>';
    
    trendElement.innerHTML = iconSvg + value;
  }

  destroy() {
    if (this._observer) {
      this._observer.disconnect();
      this._observer = null;
    }
    this.animated = false;
    this.valueElement = null;
    this.progressFill = null;
    this.element = null;
  }
}

function initStatCard(element) {
  if (element.__kupolaInitialized) return;

  const instance = new StatCard(element);
  element.__kupolaInstance = instance;
  element.__kupolaInitialized = true;
}

function cleanupStatCard(element) {
  if (!element.__kupolaInitialized || !element.__kupolaInstance) return;

  const instance = element.__kupolaInstance;
  instance.destroy();

  element.__kupolaInstance = null;
  element.__kupolaInitialized = false;
}

function initStatCards() {
  document.querySelectorAll('.ds-statcard').forEach(card => {
    initStatCard(card);
  });
}

function updateStatCard(selector, newValue) {
  const card = document.querySelector(selector);
  if (card && card.__kupolaInstance) {
    card.__kupolaInstance.updateValue(newValue);
  }
}

export { StatCard, initStatCards, initStatCard, cleanupStatCard, updateStatCard };

if (typeof window !== 'undefined') {
  window.StatCard = StatCard;
  window.initStatCard = initStatCard;
  window.cleanupStatCard = cleanupStatCard;
  window.initStatCards = initStatCards;
  window.updateStatCard = updateStatCard;
  
  if (window.kupolaInitializer) {
    window.kupolaInitializer.register('statcard', initStatCard, cleanupStatCard);
  }
}