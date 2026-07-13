import { kupolaInitializer } from './initializer.js';
import { getUiConfig } from './kupola-config.js';

class Modal {
  constructor(element, options = {}) {
    this.element = element;
    this.mask = element.querySelector('.ds-modal-mask');
    this.modal = element.querySelector('.ds-modal');
    this.closeBtn = element.querySelector('.ds-modal__close');

    // Options - use config default for backdropClick
    const uiConfig = getUiConfig();
    const defaultBackdropClick = uiConfig.modal?.backdropClick !== undefined ? uiConfig.modal.backdropClick : true;

    this.fullscreen = options.fullscreen || element.hasAttribute('data-modal-fullscreen');
    this.closableOnMask = options.closableOnMask !== undefined ? options.closableOnMask : defaultBackdropClick;
    this.escClose = options.escClose !== false;
    this.width = options.width || element.getAttribute('data-modal-width') || '';
    this.center = options.center !== false;
    this.onBeforeOpen = options.onBeforeOpen || null;
    this.onBeforeClose = options.onBeforeClose || null;
    this.onOpened = options.onOpened || null;
    this.onClosed = options.onClosed || null;

    this._isOpen = false; // 实例级跟踪，防止 _openCount 不匹配

    this._keydownHandler = (e) => {
      if (this.escClose && e.key === 'Escape' && this.isVisible()) {
        this.close();
      }
    };

    this._closeBtnClickHandler = () => this.close();

    this._maskClickHandler = (e) => {
      if (this.closableOnMask && e.target === this.mask) {
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

    // Apply fullscreen
    if (this.fullscreen && this.modal) {
      this.modal.classList.add('ds-modal--fullscreen');
    }

    // Apply custom width
    if (this.width && this.modal) {
      this.modal.style.maxWidth = this.width;
    }
  }

  open() {
    if (this.onBeforeOpen) {
      const result = this.onBeforeOpen();
      if (result === false) {return;}
    }

    if (this.mask) {
      this.mask.classList.add('is-visible');
      this.mask.classList.add('ds-modal-fade-enter');
      requestAnimationFrame(() => {
        this.mask.classList.add('ds-modal-fade-enter-active');
      });
    }
    if (this.modal) {
      this.modal.classList.add('ds-modal-zoom-enter');
      requestAnimationFrame(() => {
        this.modal.classList.add('ds-modal-zoom-enter-active');
      });
    }

    if (!this._isOpen) {
      Modal._openCount = (Modal._openCount || 0) + 1;
      this._isOpen = true;
    }
    document.body.style.overflow = 'hidden';

    if (this.onOpened) {
      setTimeout(() => this.onOpened(), 300);
    }

    this.element.dispatchEvent(new CustomEvent('kupola:modal-open', { bubbles: true }));
  }

  close() {
    if (this.onBeforeClose) {
      const result = this.onBeforeClose();
      if (result === false) {return;}
    }

    if (this.mask) {
      this.mask.classList.remove('ds-modal-fade-enter-active');
      this.mask.classList.add('ds-modal-fade-leave-active');
    }
    if (this.modal) {
      this.modal.classList.remove('ds-modal-zoom-enter-active');
      this.modal.classList.add('ds-modal-zoom-leave-active');
    }

    setTimeout(() => {
      if (this.mask) {
        this.mask.classList.remove('is-visible', 'ds-modal-fade-enter', 'ds-modal-fade-leave-active');
      }
      if (this.modal) {
        this.modal.classList.remove('ds-modal-zoom-enter', 'ds-modal-zoom-leave-active');
      }
    }, 300);

    if (this._isOpen) {
      Modal._openCount = Math.max(0, (Modal._openCount || 0) - 1);
      this._isOpen = false;
      if (Modal._openCount === 0) {
        document.body.style.overflow = '';
      }
    }

    if (this.onClosed) {
      setTimeout(() => this.onClosed(), 300);
    }

    this.element.dispatchEvent(new CustomEvent('kupola:modal-close', { bubbles: true }));
  }

  toggleFullscreen() {
    this.fullscreen = !this.fullscreen;
    if (this.modal) {
      this.modal.classList.toggle('ds-modal--fullscreen', this.fullscreen);
    }
  }

  isVisible() {
    return this.mask && this.mask.classList.contains('is-visible');
  }

  destroy() {
    document.removeEventListener('keydown', this._keydownHandler);
    if (this.closeBtn) {
      this.closeBtn.removeEventListener('click', this._closeBtnClickHandler);
    }
    if (this.mask) {
      this.mask.removeEventListener('click', this._maskClickHandler);
    }
    // 防御性：如果 destroy 时 modal 仍处于打开状态，强制修正计数
    if (this._isOpen) {
      Modal._openCount = Math.max(0, (Modal._openCount || 0) - 1);
      this._isOpen = false;
      if (Modal._openCount === 0) {
        document.body.style.overflow = '';
      }
    }
  }
}

Modal._openCount = 0;

function createModal(options = {}) {
  const {
    title = '',
    content = '',
    html = false,
    width = '480px',
    fullscreen = false,
    showCancel = true,
    showConfirm = true,
    confirmText = 'OK',
    cancelText = 'Cancel',
    confirmClass = 'ds-btn--brand',
    cancelClass = 'ds-btn--ghost',
    closable = true,
    maskClosable = true,
    onConfirm,
    onCancel,
    onOpen,
    onClose,
    footer = null,
    size = getUiConfig().defaultSize,
  } = options;

  const sizeClass = size === 'sm' ? 'ds-btn--sm' : size === 'lg' ? 'ds-btn--lg' : '';

  const container = document.createElement('div');
  container.className = 'ds-modal-container';

  let footerHTML = '';
  if (footer !== null) {
    if (typeof footer === 'string') {
      footerHTML = `<div class="ds-modal__footer">${footer}</div>`;
    } else if (showConfirm || showCancel) {
      footerHTML = `<div class="ds-modal__footer">
        ${showCancel ? `<button class="ds-btn ${sizeClass} ${cancelClass}" data-modal-cancel>${cancelText}</button>` : ''}
        ${showConfirm ? `<button class="ds-btn ${sizeClass} ${confirmClass}" data-modal-confirm>${confirmText}</button>` : ''}
      </div>`;
    }
  }

  container.innerHTML = `
    <div class="ds-modal-mask">
      <div class="ds-modal${fullscreen ? ' ds-modal--fullscreen' : ''}" style="${!fullscreen ? 'max-width: ' + width : ''}">
        <div class="ds-modal__header">
          <span class="ds-modal__title"></span>
          ${closable ? `<button class="ds-modal__close" aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>` : ''}
        </div>
        <div class="ds-modal__body"></div>
        ${footerHTML}
      </div>
    </div>
  `;

  document.body.appendChild(container);

  const modal = new Modal(container, { fullscreen, closableOnMask: maskClosable });

  const titleEl = container.querySelector('.ds-modal__title');
  if (titleEl) {titleEl.textContent = title;}
  const bodyEl = container.querySelector('.ds-modal__body');
  if (bodyEl) {
    if (html) {
      bodyEl.innerHTML = content;
    } else {
      bodyEl.textContent = content;
    }
  }

  const confirmBtn = container.querySelector('[data-modal-confirm]');
  const cancelBtn = container.querySelector('[data-modal-cancel]');

  let isConfirming = false;

  const confirmHandler = async () => {
    if (onConfirm) {
      // Support async onConfirm
      confirmBtn.disabled = true;
      confirmBtn.classList.add('is-loading');
      try {
        const result = await onConfirm();
        if (result === false) {
          confirmBtn.disabled = false;
          confirmBtn.classList.remove('is-loading');
          return;
        }
      } catch (e) {
        confirmBtn.disabled = false;
        confirmBtn.classList.remove('is-loading');
        return;
      }
    }
    isConfirming = true;
    modal.close();
  };

  const cancelHandler = () => {
    if (onCancel) {onCancel();}
    modal.close();
  };

  if (confirmBtn) {confirmBtn.addEventListener('click', confirmHandler);}
  if (cancelBtn) {cancelBtn.addEventListener('click', cancelHandler);}

  const closeAndDestroy = () => {
    setTimeout(() => {
      if (confirmBtn) {confirmBtn.removeEventListener('click', confirmHandler);}
      if (cancelBtn) {cancelBtn.removeEventListener('click', cancelHandler);}
      modal.destroy();
      container.remove();
      if (onClose) {onClose(isConfirming);}
    }, 300);
  };

  const originalClose = modal.close.bind(modal);
  modal.close = () => {
    originalClose();
    closeAndDestroy();
  };

  modal.open();
  if (onOpen) {setTimeout(() => onOpen(), 50);}

  return modal;
}

// Convenience methods
function confirmModal(options) {
  if (typeof options === 'string') {
    options = { content: options };
  }
  return createModal({
    ...options,
    showCancel: true,
    showConfirm: true,
  });
}

function alertModal(options) {
  if (typeof options === 'string') {
    options = { content: options };
  }
  return createModal({
    ...options,
    showCancel: false,
    showConfirm: true,
  });
}

function initModal(element) {
  if (element.__kupolaInitialized) {return;}

  const modal = new Modal(element);
  element.__kupolaInstance = modal;
  element.__kupolaInitialized = true;
}

function cleanupModal(element) {
  if (!element.__kupolaInitialized || !element.__kupolaInstance) {return;}

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

export { Modal, initModals, initModal, cleanupModal, createModal, confirmModal, alertModal };

kupolaInitializer.register('modal', initModal, cleanupModal);
