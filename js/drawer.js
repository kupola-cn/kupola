class Drawer {
    constructor(element) {
        this.element = element;
        this.mask = element.querySelector('.ds-drawer-mask');
        this.drawerEl = element.querySelector('.ds-drawer');
        this._bindEvents();
    }

    _bindEvents() {
        const closeBtn = this.mask?.querySelector('.ds-drawer__close');
        const cancelBtn = this.mask?.querySelector('.ds-drawer__footer .ds-btn--ghost');
        const confirmBtn = this.mask?.querySelector('.ds-drawer__footer .ds-btn--brand');

        this.closeDrawer = () => {
            if (this.mask) {
                this.mask.classList.remove('is-visible');
            }
            if (this.drawerEl) {
                this.drawerEl.classList.remove('is-visible');
            }
        };

        this.handleMaskClick = (e) => {
            if (e.target === this.mask) {
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

        this._listeners = [
            { el: this.mask, event: 'click', handler: this.handleMaskClick },
            { el: closeBtn, event: 'click', handler: this.closeDrawer },
            { el: cancelBtn, event: 'click', handler: this.closeDrawer },
            { el: confirmBtn, event: 'click', handler: this.closeDrawer }
        ].filter(item => item.el);
    }

    destroy() {
        this._listeners?.forEach(({ el, event, handler }) => {
            el.removeEventListener(event, handler);
        });
        this._listeners = null;
        this.mask = null;
        this.drawerEl = null;
        this.element = null;
    }

    open() {
        if (this.mask) {
            this.mask.classList.add('is-visible');
        }
        if (this.drawerEl) {
            this.drawerEl.classList.add('is-visible');
        }
    }

    close() {
        this.closeDrawer();
    }
}

function initDrawer(element) {
    if (element.__kupolaInitialized) return;

    const drawer = new Drawer(element);
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

            initDrawer(drawer);
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

if (window.kupolaInitializer) {
    window.kupolaInitializer.register('drawer', initDrawer, cleanupDrawer);
}