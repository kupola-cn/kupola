class ImagePreview {
  constructor(options = {}) {
    this.images = options.images || [];
    this.currentIndex = options.currentIndex || 0;
    this.overlay = null;
    this.closeHandler = this.close.bind(this);
    this.keyHandler = this.handleKeydown.bind(this);
    this.clickHandler = this.handleOverlayClick.bind(this);
    
    this.init();
  }

  init() {
    this.createOverlay();
  }

  createOverlay() {
    this.overlay = document.createElement('div');
    this.overlay.className = 'ds-image-preview-overlay';
    this.overlay.innerHTML = `
      <button class="ds-image-preview__close" type="button" aria-label="Close preview">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6L6 18"/>
          <path d="M6 6l12 12"/>
        </svg>
      </button>
      <div class="ds-image-preview__nav">
        <button class="ds-image-preview__nav-btn ds-image-preview__nav-btn--prev" type="button" aria-label="Previous image">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <button class="ds-image-preview__nav-btn ds-image-preview__nav-btn--next" type="button" aria-label="Next image">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      </div>
      <div class="ds-image-preview__content">
        <img src="" alt="" />
      </div>
      <div class="ds-image-preview__info">
        <div class="ds-image-preview__title"></div>
        <div class="ds-image-preview__meta"></div>
      </div>
      <div class="ds-image-preview__indicators"></div>
    `;
    
    document.body.appendChild(this.overlay);
    
    this.bindEvents();
  }

  bindEvents() {
    const closeBtn = this.overlay.querySelector('.ds-image-preview__close');
    const prevBtn = this.overlay.querySelector('.ds-image-preview__nav-btn--prev');
    const nextBtn = this.overlay.querySelector('.ds-image-preview__nav-btn--next');
    
    this._prevHandler = () => this.prev();
    this._nextHandler = () => this.next();
    
    closeBtn.addEventListener('click', this.closeHandler);
    prevBtn.addEventListener('click', this._prevHandler);
    nextBtn.addEventListener('click', this._nextHandler);
  }

  handleKeydown(e) {
    if (!this.overlay.classList.contains('is-visible')) return;
    
    switch (e.key) {
      case 'Escape':
        this.close();
        break;
      case 'ArrowLeft':
        this.prev();
        break;
      case 'ArrowRight':
        this.next();
        break;
    }
  }

  handleOverlayClick(e) {
    if (e.target === this.overlay) {
      this.close();
    }
  }

  show(images, index = 0) {
    this.images = images;
    this.currentIndex = Math.min(Math.max(index, 0), images.length - 1);
    
    this.render();
    this.overlay.classList.add('is-visible');
    
    document.addEventListener('keydown', this.keyHandler);
    this.overlay.addEventListener('click', this.clickHandler);
    document.body.style.overflow = 'hidden';
  }

  close() {
    this.overlay.classList.remove('is-visible');
    
    document.removeEventListener('keydown', this.keyHandler);
    this.overlay.removeEventListener('click', this.clickHandler);
    document.body.style.overflow = '';
  }

  prev() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.render();
    }
  }

  next() {
    if (this.currentIndex < this.images.length - 1) {
      this.currentIndex++;
      this.render();
    }
  }

  goTo(index) {
    if (index >= 0 && index < this.images.length) {
      this.currentIndex = index;
      this.render();
    }
  }

  render() {
    const img = this.overlay.querySelector('.ds-image-preview__content img');
    const title = this.overlay.querySelector('.ds-image-preview__title');
    const meta = this.overlay.querySelector('.ds-image-preview__meta');
    const indicators = this.overlay.querySelector('.ds-image-preview__indicators');
    const prevBtn = this.overlay.querySelector('.ds-image-preview__nav-btn--prev');
    const nextBtn = this.overlay.querySelector('.ds-image-preview__nav-btn--next');
    
    const currentImage = this.images[this.currentIndex];
    
    img.src = currentImage.src;
    img.alt = currentImage.alt || '';
    title.textContent = currentImage.title || '';
    meta.textContent = currentImage.meta || `${this.currentIndex + 1} / ${this.images.length}`;
    
    prevBtn.disabled = this.currentIndex === 0;
    nextBtn.disabled = this.currentIndex === this.images.length - 1;
    
    indicators.innerHTML = this.images.map((_, i) => `
      <button class="ds-image-preview__indicator${i === this.currentIndex ? ' is-active' : ''}" type="button" data-index="${i}" aria-label="Go to image ${i + 1}"></button>
    `).join('');
    
    indicators.querySelectorAll('.ds-image-preview__indicator').forEach(indicator => {
      const clickHandler = () => {
        this.goTo(parseInt(indicator.dataset.index));
      };
      indicator.addEventListener('click', clickHandler);
      indicator._clickHandler = clickHandler;
    });
  }

  destroy() {
    this.close();
    
    const indicators = this.overlay?.querySelector('.ds-image-preview__indicators');
    if (indicators) {
      indicators.querySelectorAll('.ds-image-preview__indicator').forEach(indicator => {
        if (indicator._clickHandler) {
          indicator.removeEventListener('click', indicator._clickHandler);
        }
      });
    }
    
    const closeBtn = this.overlay?.querySelector('.ds-image-preview__close');
    const prevBtn = this.overlay?.querySelector('.ds-image-preview__nav-btn--prev');
    const nextBtn = this.overlay?.querySelector('.ds-image-preview__nav-btn--next');
    
    if (closeBtn) {
      closeBtn.removeEventListener('click', this.closeHandler);
    }
    if (prevBtn && this._prevHandler) {
      prevBtn.removeEventListener('click', this._prevHandler);
    }
    if (nextBtn && this._nextHandler) {
      nextBtn.removeEventListener('click', this._nextHandler);
    }
    
    if (this.overlay && this.overlay.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay);
    }
  }
}

let imagePreviewInstance = null;

function initImagePreview() {
  if (!imagePreviewInstance) {
    imagePreviewInstance = new ImagePreview();
  }
  
  document.querySelectorAll('[data-image-preview]').forEach(trigger => {
    trigger.addEventListener('click', () => {
      const images = JSON.parse(trigger.getAttribute('data-image-preview'));
      const index = parseInt(trigger.getAttribute('data-image-index')) || 0;
      imagePreviewInstance.show(images, index);
    });
  });
}

function showImagePreview(images, index = 0) {
  if (!imagePreviewInstance) {
    imagePreviewInstance = new ImagePreview();
  }
  imagePreviewInstance.show(images, index);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ImagePreview, initImagePreview, showImagePreview };
}