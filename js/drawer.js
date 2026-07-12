import { kupolaInitializer } from './initializer.js';

class Drawer {
    constructor(element, options = {}) {
        this.element = element;
        this.mask = element.querySelector('.ds-drawer-mask');
        this.drawerEl = element.querySelector('.ds-drawer');
        
        // Options
        this.placement = options.placement || element.getAttribute('data-drawer-placement') || 'right'; // right | left | top | bottom
        this.width = options.width || element.getAttribute('data-drawer-width') || '400px';
        this.height = options.height || element.getAttribute('data-drawer-height') || '400px';
        this.escClose = options.escClose !== false;
        this.maskClosable = options.maskClosable !== false;
        this.showMask = options.showMask !== false;
        this.onOpen = options.onOpen || null;
        this.onClose = options.onClose || null;
        this.onBeforeClose = options.onBeforeClose || null;
        
        this._keydownHandler = null;
        this._bindEvents();
    }

    _bindEvents() {
        const closeBtn = this.mask?.querySelector('.ds-drawer__close');
        const cancelBtn = this.mask?.querySelector('.ds-drawer__footer .ds-btn--ghost');
        const confirmBtn = this.mask?.querySelector('.ds-drawer__footer .ds-btn--brand');

        this.closeDrawer = () => {
            if (this.onBeforeClose) {
                const result = this.onBeforeClose();
                if (result === false) return;
            }
            
            if (this.mask) {
                this.mask.classList.remove('is-visible');
            }
            if (this.drawerEl) {
                this.drawerEl.classList.remove('is-visible');
            }
            document.body.style.overflow = '';
            
            if (this.onClose) this.onClose();
            this.element.dispatchEvent(new CustomEvent('kupola:drawer-close', { bubbles: true }));
        };

        this.handleMaskClick = (e) => {
            if (this.maskClosable && e.target === this.mask) {
                this.closeDrawer();
            }
        };

        if (this.mask) {
            this.mask.addEventListener('click', this.handleMaskClick);
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', this.closeDrawer);
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', this.closeDrawer);
        }

        if (confirmBtn) {
            confirmBtn.addEventListener('click', this.closeDrawer);
        }

        // ESC key
        if (this.escClose) {
            this._keydownHandler = (e) => {
                if (e.key === 'Escape' && this.drawerEl?.classList.contains('is-visible')) {
                    this.closeDrawer();
                }
            };
            document.addEventListener('keydown', this._keydownHandler);
        }

        this._listeners = [
            { el: this.mask, event: 'click', handler: this.handleMaskClick },
            { el: closeBtn, event: 'click', handler: this.closeDrawer },
            { el: cancelBtn, event: 'click', handler: this.closeDrawer },
            { el: confirmBtn, event: 'click', handler: this.closeDrawer }
        ].filter(item => item.el);
    }

    _applyPlacement() {
        if (!this.drawerEl) return;
        
        // Set direction class
        this.drawerEl.classList.remove('ds-drawer--right', 'ds-drawer--left', 'ds-drawer--top', 'ds-drawer--bottom');
        this.drawerEl.classList.add(`ds-drawer--${this.placement}`);
        
        // Set size
        if (this.placement === 'left' || this.placement === 'right') {
            this.drawerEl.style.width = this.width;
        } else {
            this.drawerEl.style.height = this.height;
        }
        
        // Hide mask if configured
        if (!this.showMask && this.mask) {
            this.mask.style.background = 'transparent';
            this.mask.style.pointerEvents = 'none';
            this.drawerEl.style.boxShadow = '0 0 24px rgba(0,0,0,0.15)';
        }
    }

    destroy() {
        this._listeners?.forEach(({ el, event, handler }) => {
            el.removeEventListener(event, handler);
        });
        if (this._keydownHandler) {
            document.removeEventListener('keydown', this._keydownHandler);
        }
        this._listeners = null;
        this.mask = null;
        this.drawerEl = null;
        this.element = null;
    }

    open() {
        this._applyPlacement();
        
        if (this.mask) {
            this.mask.classList.add('is-visible');
        }
        if (this.drawerEl) {
            this.drawerEl.classList.add('is-visible');
        }
        document.body.style.overflow = 'hidden';
        
        if (this.onOpen) this.onOpen();
        this.element.dispatchEvent(new CustomEvent('kupola:drawer-open', { bubbles: true }));
    }

    close() {
        this.closeDrawer();
    }

    isOpen() {
        return this.drawerEl?.classList.contains('is-visible') || false;
    }
}

function createDrawer(options = {}) {
    const {
        title = '',
        content = '',
        html = false,
        placement = 'right',
        width = '400px',
        height = '400px',
        closable = true,
        showMask = true,
        footer = null,
        onClose,
        onOpen
    } = options;
    
    const container = document.createElement('div');
    container.className = 'ds-drawer-container';
    
    let footerHTML = '';
    if (footer !== null) {
        if (typeof footer === 'string') {
            footerHTML = `<div class="ds-drawer__footer">${footer}</div>`;
        } else {
            footerHTML = `<div class="ds-drawer__footer">
                <button class="ds-btn ds-btn--ghost" data-drawer-cancel>Cancel</button>
                <button class="ds-btn ds-btn--brand" data-drawer-confirm>OK</button>
            </div>`;
        }
    }
    
    container.innerHTML = `
        <div class="ds-drawer-mask">
            <div class="ds-drawer ds-drawer--${placement}" style="${placement === 'left' || placement === 'right' ? 'width:' + width : 'height:' + height}">
                <div class="ds-drawer__header">
                    <span class="ds-drawer__title"></span>
                    ${closable ? `<button class="ds-drawer__close" aria-label="Close">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M18 6L6 18M6 6l12 12"/>
                        </svg>
                    </button>` : ''}
                </div>
                <div class="ds-drawer__body"></div>
                ${footerHTML}
            </div>
        </div>
    `;
    
    document.body.appendChild(container);
    
    const drawer = new Drawer(container, { placement, width, height, showMask, onClose, onOpen });
    
    const titleEl = container.querySelector('.ds-drawer__title');
    if (titleEl) titleEl.textContent = title;
    const bodyEl = container.querySelector('.ds-drawer__body');
    if (bodyEl) {
        if (html) bodyEl.innerHTML = content;
        else bodyEl.textContent = content;
    }
    
    const confirmBtn = container.querySelector('[data-drawer-confirm]');
    const cancelBtn = container.querySelector('[data-drawer-cancel]');
    
    if (cancelBtn) cancelBtn.addEventListener('click', () => drawer.close());
    if (confirmBtn) {
        confirmBtn.addEventListener('click', () => {
            if (options.onConfirm) options.onConfirm();
            drawer.close();
        });
    }
    
    const origClose = drawer.closeDrawer;
    drawer.closeDrawer = () => {
        origClose();
        setTimeout(() => {
            drawer.destroy();
            container.remove();
        }, 300);
    };
    
    drawer.open();
    return drawer;
}

function initDrawer(element, options) {
    if (element.__kupolaInitialized) return;

    const drawer = new Drawer(element, options);
    element.__kupolaInstance = drawer;
    element.__kupolaInitialized = true;
}

function cleanupDrawer(element) {
    if (!element.__kupolaInitialized || !element.__kupolaInstance) return;

    const drawer = element.__kupolaInstance;
    drawer.destroy();

    element.__kupolaInstance = null;
    element.__kupolaInitialized = false;
}

function initDrawers() {
    document.querySelectorAll('[data-drawer]').forEach(trigger => {
        trigger.addEventListener('click', () => {
            const drawerId = trigger.getAttribute('data-drawer');
            const drawer = document.getElementById(drawerId);

            if (!drawer) return;

            initDrawer(drawer, {
                placement: trigger.getAttribute('data-drawer-placement') || 'right',
                width: trigger.getAttribute('data-drawer-width'),
                height: trigger.getAttribute('data-drawer-height')
            });
            drawer.__kupolaInstance?.open();
        });
    });

    document.querySelectorAll('.ds-drawer-mask').forEach(mask => {
        const drawerEl = mask.parentElement;
        if (drawerEl) {
            initDrawer(drawerEl);
        }
    });
}

export { Drawer, initDrawer, initDrawers, cleanupDrawer, createDrawer };

kupolaInitializer.register('drawer', initDrawer, cleanupDrawer);
