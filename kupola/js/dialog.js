class Dialog {
  static normal(options = {}) {
    return this._create({ type: 'normal', ...options });
  }
  
  static success(options = {}) {
    return this._create({ type: 'success', ...options });
  }
  
  static warning(options = {}) {
    return this._create({ type: 'warning', ...options });
  }
  
  static error(options = {}) {
    return this._create({ type: 'error', ...options });
  }
  
  static info(options = {}) {
    return this._create({ type: 'info', ...options });
  }
  
  static confirm(options = {}) {
    return this._create({ type: 'confirm', ...options });
  }
  
  static _create(options) {
    const {
      type = 'normal',
      title = '',
      content = '',
      onConfirm,
      onCancel
    } = options;
    
    const icons = {
      normal: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
      success: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>`,
      warning: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 9v4M12 17h.01"/><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>`,
      error: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
      info: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
      confirm: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 9v4M12 17h.01"/><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>`
    };
    
    const container = document.createElement('div');
    container.className = 'ds-modal-container';
    container.innerHTML = `
      <div class="ds-modal-mask">
        <div class="ds-modal" style="max-width: 360px">
          <div class="ds-modal__body" style="text-align: center; padding: 24px 16px;">
            <div class="ds-dialog__icon ds-dialog__icon--${type}">${icons[type]}</div>
            ${title ? '<div class="ds-dialog__title"></div>' : ''}
            <div class="ds-dialog__content"></div>
            <div class="ds-dialog__actions">
              ${type === 'confirm' || onCancel ? `<button class="ds-btn ds-btn--ghost" data-dialog-cancel>Cancel</button>` : ''}
              <button class="ds-btn ${type === 'confirm' ? 'ds-btn--brand' : 'ds-btn--ghost'}" data-dialog-confirm>
                ${type === 'confirm' ? 'Confirm' : 'OK'}
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(container);
    
    if (title) container.querySelector('.ds-dialog__title').textContent = title;
    container.querySelector('.ds-dialog__content').textContent = content;
    
    const mask = container.querySelector('.ds-modal-mask');
    const confirmBtn = container.querySelector('[data-dialog-confirm]');
    const cancelBtn = container.querySelector('[data-dialog-cancel]');
    
    const keydownHandler = function(e) {
      if (e.key === 'Escape') {
        if (onCancel) onCancel();
        close();
      }
    };
    
    const maskClickHandler = function(e) {
      if (e.target === mask) {
        if (onCancel) onCancel();
        close();
      }
    };
    
    const confirmClickHandler = function() {
      if (onConfirm) onConfirm();
      close();
    };
    
    const cancelClickHandler = function() {
      if (onCancel) onCancel();
      close();
    };
    
    const close = () => {
      mask.classList.remove('is-visible');
      document.body.style.overflow = '';
      document.removeEventListener('keydown', keydownHandler);
      mask.removeEventListener('click', maskClickHandler);
      if (confirmBtn) {
        confirmBtn.removeEventListener('click', confirmClickHandler);
      }
      if (cancelBtn) {
        cancelBtn.removeEventListener('click', cancelClickHandler);
      }
      setTimeout(() => container.remove(), 300);
    };
    
    mask.classList.add('is-visible');
    document.body.style.overflow = 'hidden';
    
    if (confirmBtn) {
      confirmBtn.addEventListener('click', confirmClickHandler);
    }
    
    if (cancelBtn) {
      cancelBtn.addEventListener('click', cancelClickHandler);
    }
    
    mask.addEventListener('click', maskClickHandler);
    document.addEventListener('keydown', keydownHandler);
    
    return { close };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Dialog;
}