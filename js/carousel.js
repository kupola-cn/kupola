class Carousel {
  constructor(element) {
    this.element = element;
    this.track = element.querySelector('.ds-carousel__track');
    this.items = element.querySelectorAll('.ds-carousel__item');
    this.prevBtn = element.querySelector('.ds-carousel__prev');
    this.nextBtn = element.querySelector('.ds-carousel__next');
    this.indicators = element.querySelectorAll('.ds-carousel__indicator');
    this.autoBtn = element.querySelector('.ds-carousel__auto');
    
    this.currentIndex = 0;
    this.totalItems = this.items.length;
    this.autoPlayTimer = null;
    this.isAutoPlaying = false;
    
    this._mouseEnterHandler = () => this.stopAutoPlay();
    this._mouseLeaveHandler = () => { if (this.isAutoPlaying) this.startAutoPlay(); };
    
    this.init();
  }
  
  init() {
    this._prevClickHandler = () => this.prev();
    this._nextClickHandler = () => this.next();
    this._autoClickHandler = () => this.toggleAutoPlay();
    this._indicatorClickHandlers = [];
    
    if (this.prevBtn) {
      this.prevBtn.addEventListener('click', this._prevClickHandler);
    }
    if (this.nextBtn) {
      this.nextBtn.addEventListener('click', this._nextClickHandler);
    }
    
    this.indicators.forEach((indicator, index) => {
      const handler = () => this.goTo(index);
      this._indicatorClickHandlers.push(handler);
      indicator.addEventListener('click', handler);
    });
    
    if (this.autoBtn) {
      this.autoBtn.addEventListener('click', this._autoClickHandler);
    }
    
    this.updateIndicators();
    this.startAutoPlay();
    
    this.element.addEventListener('mouseenter', this._mouseEnterHandler);
    this.element.addEventListener('mouseleave', this._mouseLeaveHandler);
  }
  
  goTo(index) {
    if (index < 0 || index >= this.totalItems) return;
    
    this.currentIndex = index;
    const offset = -index * 100;
    this.track.style.transform = `translateX(${offset}%)`;
    this.updateIndicators();
  }
  
  prev() {
    const newIndex = this.currentIndex > 0 ? this.currentIndex - 1 : this.totalItems - 1;
    this.goTo(newIndex);
  }
  
  next() {
    const newIndex = this.currentIndex < this.totalItems - 1 ? this.currentIndex + 1 : 0;
    this.goTo(newIndex);
  }
  
  updateIndicators() {
    this.indicators.forEach((indicator, index) => {
      if (index === this.currentIndex) {
        indicator.classList.add('is-active');
      } else {
        indicator.classList.remove('is-active');
      }
    });
  }
  
  startAutoPlay() {
    if (this.totalItems <= 1) return;
    this.stopAutoPlay();
    this.isAutoPlaying = true;
    if (this.autoBtn) {
      this.autoBtn.classList.add('is-active');
    }
    this.autoPlayTimer = setInterval(() => this.next(), 3000);
  }
  
  stopAutoPlay() {
    if (this.autoPlayTimer) {
      clearInterval(this.autoPlayTimer);
      this.autoPlayTimer = null;
    }
    if (this.autoBtn) {
      this.autoBtn.classList.remove('is-active');
    }
  }
  
  toggleAutoPlay() {
    if (this.isAutoPlaying) {
      this.isAutoPlaying = false;
      this.stopAutoPlay();
    } else {
      this.startAutoPlay();
    }
  }
  
  destroy() {
    this.stopAutoPlay();
    this.element.removeEventListener('mouseenter', this._mouseEnterHandler);
    this.element.removeEventListener('mouseleave', this._mouseLeaveHandler);
    
    if (this.prevBtn && this._prevClickHandler) {
      this.prevBtn.removeEventListener('click', this._prevClickHandler);
    }
    if (this.nextBtn && this._nextClickHandler) {
      this.nextBtn.removeEventListener('click', this._nextClickHandler);
    }
    if (this.autoBtn && this._autoClickHandler) {
      this.autoBtn.removeEventListener('click', this._autoClickHandler);
    }
    
    this.indicators.forEach((indicator, index) => {
      const handler = this._indicatorClickHandlers[index];
      if (handler) {
        indicator.removeEventListener('click', handler);
      }
    });
    
    this._prevClickHandler = null;
    this._nextClickHandler = null;
    this._autoClickHandler = null;
    this._indicatorClickHandlers = null;
  }
}

function initCarousel(element) {
  if (element.__kupolaInitialized) return;
  
  const carousel = new Carousel(element);
  element.__kupolaInstance = carousel;
  element.__kupolaInitialized = true;
}

function initCarousels(root = document) {
  root.querySelectorAll('.ds-carousel').forEach(carousel => {
    initCarousel(carousel);
  });
}

function cleanupCarousel(element) {
  if (!element.__kupolaInitialized || !element.__kupolaInstance) return;
  
  const carousel = element.__kupolaInstance;
  carousel.destroy();
  
  element.__kupolaInstance = null;
  element.__kupolaInitialized = false;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Carousel, initCarousel, initCarousels, cleanupCarousel };
} else {
  window.Carousel = Carousel;
  window.initCarousel = initCarousel;
  window.initCarousels = initCarousels;
  
  if (window.kupolaInitializer) {
    window.kupolaInitializer.register('carousel', initCarousel, cleanupCarousel);
  }
}
