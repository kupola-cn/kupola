class Tooltip {
  constructor(element) {
    this.element = element;
    this.tooltipEl = null;
    
    this._showTooltip = null;
    this._hideTooltip = null;
  }

  init() {
    if (this.element.__kupolaInitialized) return;

    this._showTooltip = () => {
      const text = this.element.getAttribute('data-tooltip');
      const position = this.element.getAttribute('data-tooltip-position') || 'top';
      if (!text) return;
      
      this.tooltipEl = document.createElement('div');
      this.tooltipEl.className = 'ds-tooltip is-visible';
      this.tooltipEl.textContent = text;
      
      document.body.appendChild(this.tooltipEl);
      
      requestAnimationFrame(() => {
        const rect = this.element.getBoundingClientRect();
        const tooltipRect = this.tooltipEl.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        let left, top;
        
        switch (position) {
          case 'bottom':
            left = rect.left + rect.width / 2 - tooltipRect.width / 2;
            top = rect.bottom + 8;
            break;
          case 'right':
            left = rect.right + 8;
            top = rect.top + rect.height / 2 - tooltipRect.height / 2;
            break;
          case 'left':
            left = rect.left - tooltipRect.width - 8;
            top = rect.top + rect.height / 2 - tooltipRect.height / 2;
            break;
          case 'top':
          default:
            left = rect.left + rect.width / 2 - tooltipRect.width / 2;
            top = rect.top - tooltipRect.height - 8;
            break;
        }
        
        if (left < 8) left = 8;
        if (left + tooltipRect.width > viewportWidth) left = viewportWidth - tooltipRect.width - 8;
        if (top < 8) top = 8;
        if (top + tooltipRect.height > viewportHeight) top = viewportHeight - tooltipRect.height - 8;
        
        this.tooltipEl.style.left = `${left}px`;
        this.tooltipEl.style.top = `${top}px`;
        this.tooltipEl.style.position = 'fixed';
      });
    };

    this._hideTooltip = () => {
      if (this.tooltipEl) {
        this.tooltipEl.remove();
        this.tooltipEl = null;
      }
    };

    this.element.addEventListener('mouseenter', this._showTooltip);
    this.element.addEventListener('mouseleave', this._hideTooltip);
    this.element.addEventListener('focus', this._showTooltip);
    this.element.addEventListener('blur', this._hideTooltip);
    
    this.element.__kupolaInitialized = true;
  }

  destroy() {
    if (!this.element.__kupolaInitialized) return;

    if (this._showTooltip) {
      this.element.removeEventListener('mouseenter', this._showTooltip);
      this.element.removeEventListener('focus', this._showTooltip);
    }
    
    if (this._hideTooltip) {
      this.element.removeEventListener('mouseleave', this._hideTooltip);
      this.element.removeEventListener('blur', this._hideTooltip);
    }
    
    if (this._showTooltip && this._hideTooltip) {
      this._hideTooltip();
    }
    
    this._showTooltip = null;
    this._hideTooltip = null;
    this.element.__kupolaInitialized = false;
  }
}

function initTooltip(element) {
  const tooltip = new Tooltip(element);
  tooltip.init();
  element._kupolaTooltip = tooltip;
}

function initTooltips(root = document) {
  root.querySelectorAll('[data-tooltip]').forEach(element => {
    initTooltip(element);
  });
}

function cleanupTooltip(element) {
  if (element._kupolaTooltip) {
    element._kupolaTooltip.destroy();
    element._kupolaTooltip = null;
  }
}

if (window.kupolaInitializer) {
  window.kupolaInitializer.register('tooltip', initTooltip, cleanupTooltip);
}