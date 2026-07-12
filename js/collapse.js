import { kupolaInitializer } from './initializer.js';

class Collapse {
    constructor(element, options = {}) {
        this.element = element;
        this.headers = [];
        this._listeners = [];
        
        // Options
        this.accordion = options.accordion || element.hasAttribute('data-collapse-accordion');
        this.animationDuration = options.animationDuration || parseInt(element.getAttribute('data-collapse-duration')) || 300;
        this.disabledItems = options.disabledItems || [];
        this.defaultExpanded = options.defaultExpanded || []; // indices or 'all'
        
        this._init();
    }

    _init() {
        const headers = this.element.querySelectorAll('.ds-collapse__header');
        
        headers.forEach((header, index) => {
            const item = header.closest('.ds-collapse__item');
            const content = header.nextElementSibling;
            
            if (!item || !content || !content.classList.contains('ds-collapse__content')) return;
            
            const isDisabled = item.hasAttribute('data-collapse-disabled') || this.disabledItems.includes(index);
            if (isDisabled) {
                item.classList.add('is-disabled');
            }
            
            // Handle default expanded
            let isActive = item.classList.contains('is-active');
            if (this.defaultExpanded === 'all') {
                isActive = true;
            } else if (Array.isArray(this.defaultExpanded) && this.defaultExpanded.includes(index)) {
                isActive = true;
            }
            
            if (isActive) {
                item.classList.add('is-active');
                content.style.height = content.scrollHeight + 'px';
                content.style.overflow = 'hidden';
                // After animation, allow overflow
                setTimeout(() => {
                    if (item.classList.contains('is-active')) {
                        content.style.height = 'auto';
                        content.style.overflow = 'visible';
                    }
                }, this.animationDuration);
            } else {
                item.classList.remove('is-active');
                content.style.height = '0';
                content.style.overflow = 'hidden';
            }
            
            const clickHandler = () => {
                if (isDisabled) return;
                const isExpanded = item.classList.contains('is-active');
                
                if (this.accordion && !isExpanded) {
                    // Close all other items first
                    this.headers.forEach((h, i) => {
                        if (i !== index && h.item.classList.contains('is-active')) {
                            this._collapseItem(h);
                        }
                    });
                }
                
                if (isExpanded) {
                    this._collapseItem({ item, content });
                } else {
                    this._expandItem({ item, content });
                }
                
                // Dispatch event
                this.element.dispatchEvent(new CustomEvent('kupola:collapse-toggle', {
                    detail: { index, expanded: !isExpanded, item },
                    bubbles: true
                }));
            };
            
            header.addEventListener('click', clickHandler);
            this.headers.push({ header, item, content, clickHandler, isDisabled });
            this._listeners.push({ el: header, event: 'click', handler: clickHandler });
        });
    }

    _expandItem(headerInfo) {
        const { item, content } = headerInfo;
        content.style.overflow = 'hidden';
        content.style.height = '0';
        
        // Force reflow
        content.offsetHeight;
        
        content.style.transition = `height ${this.animationDuration}ms ease`;
        content.style.height = content.scrollHeight + 'px';
        item.classList.add('is-active');
        
        const transitionHandler = () => {
            content.removeEventListener('transitionend', transitionHandler);
            if (item.classList.contains('is-active')) {
                content.style.height = 'auto';
                content.style.overflow = 'visible';
            }
            content.style.transition = '';
        };
        content.addEventListener('transitionend', transitionHandler);
        this._listeners.push({ el: content, event: 'transitionend', handler: transitionHandler });
    }

    _collapseItem(headerInfo) {
        const { item, content } = headerInfo;
        content.style.overflow = 'hidden';
        content.style.height = content.scrollHeight + 'px';
        
        // Force reflow
        content.offsetHeight;
        
        content.style.transition = `height ${this.animationDuration}ms ease`;
        content.style.height = '0';
        item.classList.remove('is-active');
        
        const transitionHandler = () => {
            content.removeEventListener('transitionend', transitionHandler);
            content.style.transition = '';
        };
        content.addEventListener('transitionend', transitionHandler);
        this._listeners.push({ el: content, event: 'transitionend', handler: transitionHandler });
    }

    destroy() {
        this._listeners.forEach(({ el, event, handler }) => {
            el.removeEventListener(event, handler);
        });
        this._listeners = null;
        this.headers = null;
        this.element = null;
    }

    toggle(index) {
        const headerInfo = this.headers[index];
        if (headerInfo && !headerInfo.isDisabled) {
            headerInfo.clickHandler();
        }
    }

    expand(index) {
        const headerInfo = this.headers[index];
        if (headerInfo && !headerInfo.item.classList.contains('is-active') && !headerInfo.isDisabled) {
            if (this.accordion) {
                this.headers.forEach((h, i) => {
                    if (i !== index && h.item.classList.contains('is-active')) {
                        this._collapseItem(h);
                    }
                });
            }
            this._expandItem(headerInfo);
        }
    }

    collapse(index) {
        const headerInfo = this.headers[index];
        if (headerInfo && headerInfo.item.classList.contains('is-active')) {
            this._collapseItem(headerInfo);
        }
    }

    expandAll() {
        if (this.accordion) return; // Can't expand all in accordion mode
        this.headers.forEach((headerInfo, index) => {
            if (!headerInfo.item.classList.contains('is-active') && !headerInfo.isDisabled) {
                this._expandItem(headerInfo);
            }
        });
    }

    collapseAll() {
        this.headers.forEach((headerInfo) => {
            if (headerInfo.item.classList.contains('is-active')) {
                this._collapseItem(headerInfo);
            }
        });
    }

    getExpandedIndices() {
        return this.headers
            .map((h, i) => h.item.classList.contains('is-active') ? i : -1)
            .filter(i => i >= 0);
    }

    disable(index) {
        if (this.headers[index]) {
            this.headers[index].isDisabled = true;
            this.headers[index].item.classList.add('is-disabled');
        }
    }

    enable(index) {
        if (this.headers[index]) {
            this.headers[index].isDisabled = false;
            this.headers[index].item.classList.remove('is-disabled');
        }
    }
}

function initCollapse(element, options) {
    if (element.__kupolaInitialized) return;

    const collapse = new Collapse(element, options);
    element.__kupolaInstance = collapse;
    element.__kupolaInitialized = true;
}

function cleanupCollapse(element) {
    if (!element.__kupolaInitialized || !element.__kupolaInstance) return;

    const collapse = element.__kupolaInstance;
    collapse.destroy();

    element.__kupolaInstance = null;
    element.__kupolaInitialized = false;
}

function initCollapses() {
    document.querySelectorAll('.ds-collapse').forEach(collapse => {
        initCollapse(collapse);
    });
}

export { Collapse, initCollapses, initCollapse, cleanupCollapse };

kupolaInitializer.register('collapse', initCollapse, cleanupCollapse);
