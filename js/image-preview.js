class ImagePreview {
  constructor(options = {}) {
    this.images = options.images || [];
    this.currentIndex = options.currentIndex || 0;
    this.overlay = null;
    this.closeHandler = this.close.bind(this);
    this.keyHandler = this.handleKeydown.bind(this);
    this.clickHandler = this.handleOverlayClick.bind(this);
    
    this.zoom = 1;
    this.rotation = 0;
    this.zoomStep = options.zoomStep || 0.2;
    this.minZoom = options.minZoom || 0.5;
    this.maxZoom = options.maxZoom || 3;
    
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
      <div class="ds-image-preview__toolbar">
        <button class="ds-image-preview__toolbar-btn" type="button" aria-label="Zoom in" data-action="zoom-in">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
        <button class="ds-image-preview__toolbar-btn" type="button" aria-label="Zoom out" data-action="zoom-out">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
        <button class="ds-image-preview__toolbar-btn" type="button" aria-label="Reset zoom" data-action="zoom-reset">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/>
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
        <button class="ds-image-preview__toolbar-btn" type="button" aria-label="Rotate left" data-action="rotate-left">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="1 4 1 10 7 10"/>
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
          </svg>
        </button>
        <button class="ds-image-preview__toolbar-btn" type="button" aria-label="Rotate right" data-action="rotate-right">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23 4 23 10 17 10"/>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
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

    const toolbarBtns = this.overlay.querySelectorAll('.ds-image-preview__toolbar-btn');
    toolbarBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = btn.getAttribute('data-action');
        this.handleToolbarAction(action);
      });
    });

    const content = this.overlay.querySelector('.ds-image-preview__content');
    content.addEventListener('wheel', (e) => {
      e.preventDefault();
      if (e.deltaY < 0) {
        this.zoomIn();
      } else {
        this.zoomOut();
      }
    }, { passive: false });
  }

  handleToolbarAction(action) {
    switch (action) {
      case 'zoom-in':
        this.zoomIn();
        break;
      case 'zoom-out':
        this.zoomOut();
        break;
      case 'zoom-reset':
        this.resetZoom();
        break;
      case 'rotate-left':
        this.rotate(-90);
        break;
      case 'rotate-right':
        this.rotate(90);
        break;
    }
  }

  zoomIn() {
    this.zoom = Math.min(this.maxZoom, this.zoom + this.zoomStep);
    this.updateTransform();
  }

  zoomOut() {
    this.zoom = Math.max(this.minZoom, this.zoom - this.zoomStep);
    this.updateTransform();
  }

  resetZoom() {
    this.zoom = 1;
    this.rotation = 0;
    this.updateTransform();
  }

  rotate(degrees) {
    this.rotation += degrees;
    this.updateTransform();
  }

  setRotation(degrees) {
    this.rotation = degrees;
    this.updateTransform();
  }

  setZoom(zoom) {
    this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, zoom));
    this.updateTransform();
  }

  updateTransform() {
    const img = this.overlay.querySelector('.ds-image-preview__content img');
    if (img) {
      img.style.transform = `scale(${this.zoom}) rotate(${this.rotation}deg)`;
    }
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
      case '+':
      case '=':
        e.preventDefault();
        this.zoomIn();
        break;
      case '-':
      case '_':
        e.preventDefault();
        this.zoomOut();
        break;
      case '0':
        e.preventDefault();
        this.resetZoom();
        break;
      case '[':
        e.preventDefault();
        this.rotate(-90);
        break;
      case ']':
        e.preventDefault();
        this.rotate(90);
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
    
    this.resetZoom();
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
      this.resetZoom();
      this.render();
    }
  }

  next() {
    if (this.currentIndex < this.images.length - 1) {
      this.currentIndex++;
      this.resetZoom();
      this.render();
    }
  }

  goTo(index) {
    if (index >= 0 && index < this.images.length) {
      this.currentIndex = index;
      this.resetZoom();
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

export { ImagePreview, initImagePreview, showImagePreview };

if (typeof window !== 'undefined') {
  window.ImagePreview = ImagePreview;
  window.initImagePreview = initImagePreview;
  window.showImagePreview = showImagePreview;
}