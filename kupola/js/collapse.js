class Collapse {
    constructor(element) {
        this.element = element;
        this.headers = [];
        this._listeners = [];
        this._init();
    }

    _init() {
        const headers = this.element.querySelectorAll('.ds-collapse__header');
        
        headers.forEach(header => {
            const item = header.closest('.ds-collapse__item');
            const content = header.nextElementSibling;
            
            if (!item || !content || !content.classList.contains('ds-collapse__content')) return;
            
            const isActive = item.classList.contains('is-active');
            content.style.height = isActive ? content.scrollHeight + 'px' : '0';
            
            const clickHandler = () => {
                const isExpanded = content.style.height !== '0px';
                
                if (isExpanded) {
                    content.style.height = '0';
                    item.classList.remove('is-active');
                } else {
                    content.style.height = content.scrollHeight + 'px';
                    item.classList.add('is-active');
                    
                    const transitionHandler = function onTransitionEnd() {
                        content.removeEventListener('transitionend', transitionHandler);
                        content.style.height = '';
                    };
                    content.addEventListener('transitionend', transitionHandler);
                    this._listeners.push({ el: content, event: 'transitionend', handler: transitionHandler });
                }
            };
            
            header.addEventListener('click', clickHandler);
            this.headers.push({ header, item, content, clickHandler });
            this._listeners.push({ el: header, event: 'click', handler: clickHandler });
        });
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
        if (headerInfo) {
            headerInfo.clickHandler();
        }
    }

    expand(index) {
        const headerInfo = this.headers[index];
        if (headerInfo && !headerInfo.item.classList.contains('is-active')) {
            headerInfo.clickHandler();
        }
    }

    collapse(index) {
        const headerInfo = this.headers[index];
        if (headerInfo && headerInfo.item.classList.contains('is-active')) {
            headerInfo.clickHandler();
        }
    }

    expandAll() {
        this.headers.forEach((headerInfo, index) => {
            if (!headerInfo.item.classList.contains('is-active')) {
                this.toggle(index);
            }
        });
    }

    collapseAll() {
        this.headers.forEach((headerInfo, index) => {
            if (headerInfo.item.classList.contains('is-active')) {
                this.toggle(index);
            }
        });
    }
}

function initCollapse(element) {
    if (element.__kupolaInitialized) return;

    const collapse = new Collapse(element);
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

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Collapse, initCollapses, initCollapse, cleanupCollapse };
} else {
    window.Collapse = Collapse;
    window.initCollapse = initCollapse;
    window.cleanupCollapse = cleanupCollapse;
}

if (window.kupolaInitializer) {
    window.kupolaInitializer.register('collapse', initCollapse, cleanupCollapse);
}