class Tag {
    constructor(element) {
        this.element = element;
        this.closeBtn = element.querySelector('.ds-tag__close');
        this._listeners = [];
        this.init();
    }

    init() {
        if (this.closeBtn) {
            const closeHandler = (e) => {
                e.stopPropagation();
                this.element.dispatchEvent(new CustomEvent('ds-tag-remove', {
                    detail: { tag: this.element },
                    bubbles: true
                }));
                this.element.remove();
            };
            this.closeBtn.addEventListener('click', closeHandler);
            this._listeners.push({ el: this.closeBtn, event: 'click', handler: closeHandler });
        }
    }

    setContent(content) {
        const textNodes = [];
        this.element.childNodes.forEach(node => {
            if (node.nodeType === Node.TEXT_NODE) {
                textNodes.push(node);
            }
        });
        textNodes.forEach(node => node.remove());
        this.element.insertBefore(document.createTextNode(content), this.closeBtn || null);
    }

    getContent() {
        return this.element.textContent.trim();
    }

    destroy() {
        this._listeners.forEach(({ el, event, handler }) => {
            el.removeEventListener(event, handler);
        });
        this._listeners = null;
        this.closeBtn = null;
        this.element = null;
    }
}

function initTag(element) {
    if (element.__kupolaInitialized) return;

    const instance = new Tag(element);
    element.__kupolaInstance = instance;
    element.__kupolaInitialized = true;
}

function cleanupTag(element) {
    if (!element.__kupolaInitialized || !element.__kupolaInstance) return;

    const instance = element.__kupolaInstance;
    instance.destroy();

    element.__kupolaInstance = null;
    element.__kupolaInitialized = false;
}

function initTags() {
    document.querySelectorAll('.ds-tag').forEach(tag => {
        initTag(tag);
    });
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Tag, initTags, initTag, cleanupTag };
} else {
    window.Tag = Tag;
    window.initTag = initTag;
    window.cleanupTag = cleanupTag;
}

if (window.kupolaInitializer) {
    window.kupolaInitializer.register('tag', initTag, cleanupTag);
}