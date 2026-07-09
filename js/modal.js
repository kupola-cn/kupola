class Modal {
  constructor(element) {
    this.element = element;
    this.mask = element.querySelector('.ds-modal-mask');
    this.modal = element.querySelector('.ds-modal');
    this.closeBtn = element.querySelector('.ds-modal__close');
    
    this._keydownHandler = (e) => {
      if (e.key === 'Escape' && this.isVisible()) {
        this.close();
      }
    };
    
    this._closeBtnClickHandler = () => this.close();
    
    this._maskClickHandler = (e) => {
      if (e.target === this.mask) {
        this.close();
      }
    };
    
    this.init();
  }
  
  init() {
    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', this._closeBtnClickHandler);
    }
    
    if (this.mask) {
      this.mask.addEventListener('click', this._maskClickHandler);
    }
    
    document.addEventListener('keydown', this._keydownHandler);
  }
  
  open() {
    this.mask.classList.add('is-visible');
    Modal._openCount = (Modal._openCount || 0) + 1;
    document.body.style.overflow = 'hidden';
  }
  
  close() {
    this.mask.classList.remove('is-visible');
    Modal._openCount = Math.max(0, (Modal._openCount || 0) - 1);
    if (Modal._openCount === 0) {
      document.body.style.overflow = '';
    }
  }
  
  isVisible() {
    return this.mask.classList.contains('is-visible');
  }
  
  destroy() {
    document.removeEventListener('keydown', this._keydownHandler);
    if (this.closeBtn) {
      this.closeBtn.removeEventListener('click', this._closeBtnClickHandler);
    }
    if (this.mask) {
      this.mask.removeEventListener('click', this._maskClickHandler);
    }
    if (this.isVisible()) {
      this.close();
    }
  }
}

Modal._openCount = 0;

function createModal(options = {}) {
  const {
    title = '',
    content = '',
    width = '480px',
    onConfirm,
    onCancel
  } = options;
  
  const container = document.createElement('div');
  container.className = 'ds-modal-container';
  container.innerHTML = `
    <div class="ds-modal-mask">
      <div class="ds-modal" style="max-width: ${width}">
        <div class="ds-modal__header">
          <span class="ds-modal__title"></span>
          <button class="ds-modal__close" aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div class="ds-modal__body"></div>
        ${onConfirm || onCancel ? `
        <div class="ds-modal__footer">
          ${onCancel ? `<button class="ds-btn ds-btn--ghost" data-modal-cancel>Cancel</button>` : ''}
          ${onConfirm ? `<button class="ds-btn ds-btn--brand" data-modal-confirm>OK</button>` : ''}
        </div>
        ` : ''}
      </div>
    </div>
  `;
  
  document.body.appendChild(container);
  
  const modal = new Modal(container);
  
  const titleEl = container.querySelector('.ds-modal__title');
  if (titleEl) titleEl.textContent = title;
  const bodyEl = container.querySelector('.ds-modal__body');
  if (bodyEl) bodyEl.textContent = content;
  
  const confirmBtn = container.querySelector('[data-modal-confirm]');
  const cancelBtn = container.querySelector('[data-modal-cancel]');
  
  const confirmHandler = () => {
      if (onConfirm) onConfirm();
      modal.close();
    };
    
    const cancelHandler = () => {
      if (onCancel) onCancel();
      modal.close();
    };
    
    if (confirmBtn) {
      confirmBtn.addEventListener('click', confirmHandler);
    }
    
    if (cancelBtn) {
      cancelBtn.addEventListener('click', cancelHandler);
    }
    
    const closeAndDestroy = () => {
      setTimeout(() => {
        if (confirmBtn) {
          confirmBtn.removeEventListener('click', confirmHandler);
        }
        if (cancelBtn) {
          cancelBtn.removeEventListener('click', cancelHandler);
        }
        modal.destroy();
        container.remove();
      }, 300);
    };
    
    const originalClose = modal.close.bind(modal);
    modal.close = () => {
      originalClose();
      closeAndDestroy();
    };
  
  modal.open();
  
  return modal;
}

function initModal(element) {
  if (element.__kupolaInitialized) return;

  const modal = new Modal(element);
  element.__kupolaInstance = modal;
  element.__kupolaInitialized = true;
}

function cleanupModal(element) {
  if (!element.__kupolaInitialized || !element.__kupolaInstance) return;

  const modal = element.__kupolaInstance;
  modal.destroy();

  element.__kupolaInstance = null;
  element.__kupolaInitialized = false;
}

function initModals() {
  document.querySelectorAll('.ds-modal-container').forEach(container => {
    initModal(container);
  });
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Modal, initModals, initModal, cleanupModal, createModal };
} else {
  window.initModal = initModal;
  window.cleanupModal = cleanupModal;
}

if (window.kupolaInitializer) {
  window.kupolaInitializer.register('modal', initModal, cleanupModal);
}
