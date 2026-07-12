import { kupolaInitializer } from './initializer.js';

class Tooltip {
    constructor(element, options = {}) {
        this.element = element;
        this.tooltipEl = null;
        
        this.options = options;
        this.delay = options.delay || parseInt(element.getAttribute('data-tooltip-delay')) || 0;
        this.hideDelay = options.hideDelay || parseInt(element.getAttribute('data-tooltip-hide-delay')) || 0;
        this.trigger = options.trigger || element.getAttribute('data-tooltip-trigger') || 'hover'; // hover | click | focus | manual
        this.html = options.html || element.hasAttribute('data-tooltip-html');
        this.theme = options.theme || element.getAttribute('data-tooltip-theme') || 'default'; // default | dark | light
        this.position = options.position || element.getAttribute('data-tooltip-position') || 'top';
        this.animation = options.animation !== false;
        this.mouseFollow = options.mouseFollow || element.hasAttribute('data-tooltip-mouse-follow');
        
        this._showTooltip = null;
        this._hideTooltip = null;
        this._showTimer = null;
        this._hideTimer = null;
        this._clickHandler = null;
        this._focusHandler = null;
        this._blurHandler = null;
        this._mouseMoveHandler = null;
        
        this.isVisible = false;
    }

    init() {
        if (this.element.__kupolaInitialized) return;

        this._showTooltip = () => {
            if (this.delay > 0) {
                this._showTimer = setTimeout(() => this.show(), this.delay);
            } else {
                this.show();
            }
        };

        this._hideTooltip = () => {
            if (this._showTimer) {
                clearTimeout(this._showTimer);
                this._showTimer = null;
            }
            if (this.hideDelay > 0) {
                this._hideTimer = setTimeout(() => this.hide(), this.hideDelay);
            } else {
                this.hide();
            }
        };

        this._clickHandler = () => {
            if (this.isVisible) {
                this.hide();
            } else {
                this.show();
            }
        };

        this._mouseMoveHandler = (e) => {
            if (!this.isVisible || !this.mouseFollow || !this.tooltipEl) return;
            
            const tooltipRect = this.tooltipEl.getBoundingClientRect();
            let left = e.clientX + 10;
            let top = e.clientY + 10;
            
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            
            if (left + tooltipRect.width > viewportWidth) {
                left = e.clientX - tooltipRect.width - 10;
            }
            if (top + tooltipRect.height > viewportHeight) {
                top = e.clientY - tooltipRect.height - 10;
            }
            
            this.tooltipEl.style.left = `${left}px`;
            this.tooltipEl.style.top = `${top}px`;
        };

        if (this.trigger === 'hover' || this.trigger === 'focus') {
            this.element.addEventListener('mouseenter', this._showTooltip);
            this.element.addEventListener('mouseleave', this._hideTooltip);
            
            if (this.mouseFollow) {
                this.element.addEventListener('mousemove', this._mouseMoveHandler);
            }
        }
        
        if (this.trigger === 'click') {
            this.element.addEventListener('click', this._clickHandler);
            
            document.addEventListener('click', (e) => {
                if (this.isVisible && !this.element.contains(e.target) && !this.tooltipEl?.contains(e.target)) {
                    this.hide();
                }
            });
        }
        
        if (this.trigger === 'focus' || this.trigger === 'hover') {
            this.element.addEventListener('focus', this._showTooltip);
            this.element.addEventListener('blur', this._hideTooltip);
        }
        
        this.element.__kupolaInitialized = true;
    }

    show() {
        if (this.isVisible) return;
        
        const text = this.element.getAttribute('data-tooltip');
        if (!text) return;
        
        this.tooltipEl = document.createElement('div');
        this.tooltipEl.className = `ds-tooltip ds-tooltip--${this.position} ds-tooltip--${this.theme}`;
        
        if (this.html) {
            this.tooltipEl.innerHTML = text;
        } else {
            this.tooltipEl.textContent = text;
        }
        
        document.body.appendChild(this.tooltipEl);
        
        requestAnimationFrame(() => {
            this.tooltipEl.classList.add('is-visible');
            
            if (!this.mouseFollow) {
                this._positionTooltip();
            }
            
            this.isVisible = true;
            this.element.dispatchEvent(new CustomEvent('kupola:tooltip-show', { 
                detail: { tooltip: this.tooltipEl },
                bubbles: true 
            }));
        });
    }

    hide() {
        if (!this.isVisible || !this.tooltipEl) return;
        
        this.tooltipEl.classList.remove('is-visible');
        
        const removeEl = this.tooltipEl;
        setTimeout(() => {
            if (removeEl === this.tooltipEl) {
                removeEl.remove();
                this.tooltipEl = null;
            }
        }, this.animation ? 200 : 0);
        
        this.isVisible = false;
        this.element.dispatchEvent(new CustomEvent('kupola:tooltip-hide', { 
            detail: { tooltip: removeEl },
            bubbles: true 
        }));
    }

    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    _positionTooltip() {
        if (!this.tooltipEl) return;
        
        const rect = this.element.getBoundingClientRect();
        const tooltipRect = this.tooltipEl.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        let left, top;
        
        switch (this.position) {
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
    }

    updateContent(content, isHtml = false) {
        this.element.setAttribute('data-tooltip', content);
        if (isHtml) {
            this.element.setAttribute('data-tooltip-html', '');
        } else {
            this.element.removeAttribute('data-tooltip-html');
        }
        this.html = isHtml;
        
        if (this.isVisible && this.tooltipEl) {
            if (this.html) {
                this.tooltipEl.innerHTML = content;
            } else {
                this.tooltipEl.textContent = content;
            }
            this._positionTooltip();
        }
    }

    setPosition(position) {
        if (['top', 'bottom', 'left', 'right'].includes(position)) {
            this.position = position;
            this.element.setAttribute('data-tooltip-position', position);
            
            if (this.tooltipEl) {
                this.tooltipEl.className = `ds-tooltip ds-tooltip--${this.position} ds-tooltip--${this.theme}`;
                if (this.isVisible) {
                    this._positionTooltip();
                }
            }
        }
    }

    setTheme(theme) {
        this.theme = theme;
        this.element.setAttribute('data-tooltip-theme', theme);
        
        if (this.tooltipEl) {
            this.tooltipEl.className = `ds-tooltip ds-tooltip--${this.position} ds-tooltip--${this.theme}`;
        }
    }

    setDelay(delay) {
        this.delay = delay;
        this.element.setAttribute('data-tooltip-delay', delay);
    }

    setHideDelay(delay) {
        this.hideDelay = delay;
        this.element.setAttribute('data-tooltip-hide-delay', delay);
    }

    setTrigger(trigger) {
        if (['hover', 'click', 'focus', 'manual'].includes(trigger)) {
            this.destroy();
            this.trigger = trigger;
            this.element.setAttribute('data-tooltip-trigger', trigger);
            this.init();
        }
    }

    enableMouseFollow(enable) {
        this.mouseFollow = enable;
        if (enable) {
            this.element.setAttribute('data-tooltip-mouse-follow', '');
            this.element.addEventListener('mousemove', this._mouseMoveHandler);
        } else {
            this.element.removeAttribute('data-tooltip-mouse-follow');
            this.element.removeEventListener('mousemove', this._mouseMoveHandler);
        }
    }

    destroy() {
        if (!this.element.__kupolaInitialized) return;

        if (this._showTimer) {
            clearTimeout(this._showTimer);
            this._showTimer = null;
        }
        if (this._hideTimer) {
            clearTimeout(this._hideTimer);
            this._hideTimer = null;
        }

        if (this.trigger === 'hover' || this.trigger === 'focus') {
            this.element.removeEventListener('mouseenter', this._showTooltip);
            this.element.removeEventListener('mouseleave', this._hideTooltip);
        }
        
        if (this.trigger === 'click') {
            this.element.removeEventListener('click', this._clickHandler);
        }
        
        if (this.trigger === 'focus' || this.trigger === 'hover') {
            this.element.removeEventListener('focus', this._showTooltip);
            this.element.removeEventListener('blur', this._hideTooltip);
        }
        
        if (this.mouseFollow) {
            this.element.removeEventListener('mousemove', this._mouseMoveHandler);
        }

        if (this.tooltipEl) {
            this.tooltipEl.remove();
            this.tooltipEl = null;
        }
        
        this.isVisible = false;
        this._showTooltip = null;
        this._hideTooltip = null;
        this._clickHandler = null;
        this._mouseMoveHandler = null;
        this.element.__kupolaInitialized = false;
    }
}

function initTooltip(element, options) {
    const tooltip = new Tooltip(element, options);
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

export { Tooltip, initTooltip, initTooltips, cleanupTooltip };

kupolaInitializer.register('tooltip', initTooltip, cleanupTooltip);