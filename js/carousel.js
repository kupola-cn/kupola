class Carousel {
  constructor(element, options = {}) {
    this.element = element;
    this.track = element.querySelector('.ds-carousel__track');
    this.items = element.querySelectorAll('.ds-carousel__item');
    this.prevBtn = element.querySelector('.ds-carousel__prev');
    this.nextBtn = element.querySelector('.ds-carousel__next');
    this.indicators = element.querySelectorAll('.ds-carousel__indicator');
    this.autoBtn = element.querySelector('.ds-carousel__auto');
    
    // Options
    this.mode = options.mode || element.getAttribute('data-carousel-mode') || 'slide'; // slide | fade
    this.vertical = options.vertical || element.hasAttribute('data-carousel-vertical');
    this.autoPlay = options.autoPlay !== false;
    this.interval = options.interval || parseInt(element.getAttribute('data-carousel-interval')) || 3000;
    this.transitionDuration = options.transitionDuration || parseInt(element.getAttribute('data-carousel-duration')) || 500;
    this.loop = options.loop !== false;
    this.pauseOnHover = options.pauseOnHover !== false;
    this.swipe = options.swipe !== false;
    this.swipeThreshold = options.swipeThreshold || 50;
    this.keyboardNav = options.keyboardNav || element.hasAttribute('data-carousel-keyboard');
    this.onChange = options.onChange || null;
    
    this.currentIndex = 0;
    this.totalItems = this.items.length;
    this.autoPlayTimer = null;
    this.isAutoPlaying = false;
    this.isTransitioning = false;
    
    // Touch state
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.touchDeltaX = 0;
    this.touchDeltaY = 0;
    this.isSwiping = false;
    
    this._mouseEnterHandler = () => { if (this.pauseOnHover) this.stopAutoPlay(); };
    this._mouseLeaveHandler = () => { if (this.pauseOnHover && this.autoPlay) this.startAutoPlay(); };
    
    this.init();
  }
  
  init() {
    this._prevClickHandler = () => this.prev();
    this._nextClickHandler = () => this.next();
    this._autoClickHandler = () => this.toggleAutoPlay();
    this._indicatorClickHandlers = [];
    
    if (this.prevBtn) this.prevBtn.addEventListener('click', this._prevClickHandler);
    if (this.nextBtn) this.nextBtn.addEventListener('click', this._nextClickHandler);
    
    this.indicators.forEach((indicator, index) => {
      const handler = () => this.goTo(index);
      this._indicatorClickHandlers.push(handler);
      indicator.addEventListener('click', handler);
    });
    
    if (this.autoBtn) this.autoBtn.addEventListener('click', this._autoClickHandler);
    
    // Touch/swipe support
    if (this.swipe) {
      this._touchStartHandler = (e) => this._handleTouchStart(e);
      this._touchMoveHandler = (e) => this._handleTouchMove(e);
      this._touchEndHandler = () => this._handleTouchEnd();
      
      this.element.addEventListener('touchstart', this._touchStartHandler, { passive: true });
      this.element.addEventListener('touchmove', this._touchMoveHandler, { passive: false });
      this.element.addEventListener('touchend', this._touchEndHandler);
    }
    
    // Keyboard navigation
    if (this.keyboardNav) {
      this._keydownHandler = (e) => {
        if (!this.element.contains(document.activeElement)) return;
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault();
          this.prev();
        } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault();
          this.next();
        }
      };
      this.element.addEventListener('keydown', this._keydownHandler);
    }
    
    // Apply mode class
    if (this.mode === 'fade') {
      this.element.classList.add('ds-carousel--fade');
    }
    if (this.vertical) {
      this.element.classList.add('ds-carousel--vertical');
    }
    
    // Set transition duration
    if (this.track) {
      this.track.style.transitionDuration = this.transitionDuration + 'ms';
    }
    
    this.updateIndicators();
    if (this.autoPlay) this.startAutoPlay();
    
    this.element.addEventListener('mouseenter', this._mouseEnterHandler);
    this.element.addEventListener('mouseleave', this._mouseLeaveHandler);
  }
  
  goTo(index) {
    if (this.isTransitioning) return;
    if (index < 0 || index >= this.totalItems) return;
    
    this.isTransitioning = true;
    const prevIndex = this.currentIndex;
    this.currentIndex = index;
    
    if (this.mode === 'fade') {
      this.items.forEach((item, i) => {
        item.style.opacity = i === index ? '1' : '0';
        item.style.zIndex = i === index ? '1' : '0';
      });
    } else if (this.vertical) {
      const offset = -index * 100;
      this.track.style.transform = `translateY(${offset}%)`;
    } else {
      const offset = -index * 100;
      this.track.style.transform = `translateX(${offset}%)`;
    }
    
    this.updateIndicators();
    
    setTimeout(() => {
      this.isTransitioning = false;
    }, this.transitionDuration);
    
    if (this.onChange) {
      this.onChange({ index, prevIndex, total: this.totalItems });
    }
    
    this.element.dispatchEvent(new CustomEvent('kupola:carousel-change', {
      detail: { index, prevIndex, total: this.totalItems },
      bubbles: true
    }));
  }
  
  prev() {
    if (this.currentIndex > 0) {
      this.goTo(this.currentIndex - 1);
    } else if (this.loop) {
      this.goTo(this.totalItems - 1);
    }
  }
  
  next() {
    if (this.currentIndex < this.totalItems - 1) {
      this.goTo(this.currentIndex + 1);
    } else if (this.loop) {
      this.goTo(0);
    }
  }
  
  updateIndicators() {
    this.indicators.forEach((indicator, index) => {
      indicator.classList.toggle('is-active', index === this.currentIndex);
    });
    
    // Update prev/next button states for non-loop mode
    if (!this.loop) {
      if (this.prevBtn) this.prevBtn.disabled = this.currentIndex === 0;
      if (this.nextBtn) this.nextBtn.disabled = this.currentIndex === this.totalItems - 1;
    }
  }
  
  startAutoPlay() {
    if (this.totalItems <= 1) return;
    this.stopAutoPlay();
    this.isAutoPlaying = true;
    if (this.autoBtn) this.autoBtn.classList.add('is-active');
    this.autoPlayTimer = setInterval(() => this.next(), this.interval);
  }
  
  stopAutoPlay() {
    if (this.autoPlayTimer) {
      clearInterval(this.autoPlayTimer);
      this.autoPlayTimer = null;
    }
    this.isAutoPlaying = false;
    if (this.autoBtn) this.autoBtn.classList.remove('is-active');
  }
  
  toggleAutoPlay() {
    if (this.isAutoPlaying) {
      this.stopAutoPlay();
    } else {
      this.startAutoPlay();
    }
  }
  
  // Touch handlers
  _handleTouchStart(e) {
    this.touchStartX = e.touches[0].clientX;
    this.touchStartY = e.touches[0].clientY;
    this.touchDeltaX = 0;
    this.touchDeltaY = 0;
    this.isSwiping = true;
    
    if (this.isAutoPlaying) {
      this.stopAutoPlay();
      this._wasAutoPlaying = true;
    }
  }
  
  _handleTouchMove(e) {
    if (!this.isSwiping) return;
    
    this.touchDeltaX = e.touches[0].clientX - this.touchStartX;
    this.touchDeltaY = e.touches[0].clientY - this.touchStartY;
    
    // Prevent page scroll if swiping horizontally
    const absDx = Math.abs(this.touchDeltaX);
    const absDy = Math.abs(this.touchDeltaY);
    
    if (absDx > absDy && absDx > 10) {
      e.preventDefault();
    }
  }
  
  _handleTouchEnd() {
    if (!this.isSwiping) return;
    this.isSwiping = false;
    
    const absDeltaX = Math.abs(this.touchDeltaX);
    const absDeltaY = Math.abs(this.touchDeltaY);
    
    if (absDeltaX > this.swipeThreshold && absDeltaX > absDeltaY) {
      if (this.touchDeltaX > 0) {
        this.prev();
      } else {
        this.next();
      }
    }
    
    if (this._wasAutoPlaying) {
      this.startAutoPlay();
      this._wasAutoPlaying = false;
    }
  }
  
  destroy() {
    this.stopAutoPlay();
    this.element.removeEventListener('mouseenter', this._mouseEnterHandler);
    this.element.removeEventListener('mouseleave', this._mouseLeaveHandler);
    
    if (this.prevBtn && this._prevClickHandler) this.prevBtn.removeEventListener('click', this._prevClickHandler);
    if (this.nextBtn && this._nextClickHandler) this.nextBtn.removeEventListener('click', this._nextClickHandler);
    if (this.autoBtn && this._autoClickHandler) this.autoBtn.removeEventListener('click', this._autoClickHandler);
    
    this.indicators.forEach((indicator, index) => {
      const handler = this._indicatorClickHandlers[index];
      if (handler) indicator.removeEventListener('click', handler);
    });
    
    if (this._touchStartHandler) this.element.removeEventListener('touchstart', this._touchStartHandler);
    if (this._touchMoveHandler) this.element.removeEventListener('touchmove', this._touchMoveHandler);
    if (this._touchEndHandler) this.element.removeEventListener('touchend', this._touchEndHandler);
    if (this._keydownHandler) this.element.removeEventListener('keydown', this._keydownHandler);
    
    this._prevClickHandler = null;
    this._nextClickHandler = null;
    this._autoClickHandler = null;
    this._indicatorClickHandlers = null;
  }
}

function initCarousel(element, options) {
  if (element.__kupolaInitialized) return;
  
  const carousel = new Carousel(element, options);
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

export { Carousel, initCarousel, initCarousels, cleanupCarousel };

if (typeof window !== 'undefined') {
  window.Carousel = Carousel;
  window.initCarousel = initCarousel;
  window.initCarousels = initCarousels;
  
  if (window.kupolaInitializer) {
    window.kupolaInitializer.register('carousel', initCarousel, cleanupCarousel);
  }
}

