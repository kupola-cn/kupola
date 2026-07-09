class DynamicTags {
    constructor(element) {
        this.element = element;
        this.input = element.querySelector('.ds-dynamic-tags__input');
        this._listeners = [];
        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        this.element.querySelectorAll('.ds-dynamic-tags__remove').forEach(removeBtn => {
            const removeHandler = (e) => {
                e.stopPropagation();
                const tag = removeBtn.closest('.ds-dynamic-tags__tag');
                if (tag) {
                    tag.remove();
                    this.dispatchChange();
                }
            };
            removeBtn.addEventListener('click', removeHandler);
            this._listeners.push({ el: removeBtn, event: 'click', handler: removeHandler });
        });

        if (this.input) {
            const addTag = () => {
                const value = this.input.value.trim();
                if (!value) return;

                const tag = document.createElement('span');
                tag.className = 'ds-dynamic-tags__tag';
                const textNode = document.createTextNode(value);
                tag.appendChild(textNode);
                const removeBtn = document.createElement('button');
                removeBtn.className = 'ds-dynamic-tags__remove';
                removeBtn.innerHTML = '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
                tag.appendChild(removeBtn);

                const tagRemoveHandler = (e) => {
                    e.stopPropagation();
                    tag.remove();
                    this.dispatchChange();
                };
                removeBtn.addEventListener('click', tagRemoveHandler);
                this._listeners.push({ el: removeBtn, event: 'click', handler: tagRemoveHandler });

                this.element.insertBefore(tag, this.input);
                this.input.value = '';
                this.input.focus();
                this.dispatchChange();
            };

            const keydownHandler = (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    e.stopPropagation();
                    addTag();
                }
            };
            this.input.addEventListener('keydown', keydownHandler);
            this._listeners.push({ el: this.input, event: 'keydown', handler: keydownHandler });

            const clickHandler = () => {
                this.input.focus();
            };
            this.element.addEventListener('click', clickHandler);
            this._listeners.push({ el: this.element, event: 'click', handler: clickHandler });
        }
    }

    addTag(value) {
        if (!value || !this.input) return;
        this.input.value = value;
        this.input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    }

    removeTag(index) {
        const tags = this.element.querySelectorAll('.ds-dynamic-tags__tag');
        const tag = tags[index];
        if (tag) {
            tag.remove();
            this.dispatchChange();
        }
    }

    getTags() {
        const tags = [];
        this.element.querySelectorAll('.ds-dynamic-tags__tag').forEach(tag => {
            tags.push(tag.textContent);
        });
        return tags;
    }

    clearTags() {
        this.element.querySelectorAll('.ds-dynamic-tags__tag').forEach(tag => {
            tag.remove();
        });
        this.dispatchChange();
    }

    dispatchChange() {
        this.element.dispatchEvent(new CustomEvent('ds-dynamic-tags-change', {
            detail: {
                tags: this.getTags(),
                count: this.getTags().length
            }
        }));
    }

    destroy() {
        this._listeners.forEach(({ el, event, handler }) => {
            el.removeEventListener(event, handler);
        });
        this._listeners = null;
        this.input = null;
        this.element = null;
    }
}

function initDynamicTags(element) {
    if (element.__kupolaInitialized) return;

    const instance = new DynamicTags(element);
    element.__kupolaInstance = instance;
    element.__kupolaInitialized = true;
}

function cleanupDynamicTags(element) {
    if (!element.__kupolaInitialized || !element.__kupolaInstance) return;

    const instance = element.__kupolaInstance;
    instance.destroy();

    element.__kupolaInstance = null;
    element.__kupolaInitialized = false;
}

function initDynamicTagsAll() {
    document.querySelectorAll('.ds-dynamic-tags').forEach(tags => {
        initDynamicTags(tags);
    });
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DynamicTags, initDynamicTagsAll, initDynamicTags, cleanupDynamicTags };
} else {
    window.DynamicTags = DynamicTags;
    window.initDynamicTags = initDynamicTags;
    window.cleanupDynamicTags = cleanupDynamicTags;
}

if (window.kupolaInitializer) {
    window.kupolaInitializer.register('dynamic-tags', initDynamicTags, cleanupDynamicTags);
}