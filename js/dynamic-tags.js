import { kupolaInitializer } from './initializer.js';

class DynamicTags {
    constructor(element, options = {}) {
        this.element = element;
        this.input = element.querySelector('.ds-dynamic-tags__input');
        this._listeners = [];
        
        this.maxCount = options.maxCount || parseInt(element.getAttribute('data-dynamic-tags-max')) || Infinity;
        this.allowDuplicates = options.allowDuplicates !== false;
        this.color = options.color || element.getAttribute('data-dynamic-tags-color') || 'default';
        
        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        this.element.querySelectorAll('.ds-dynamic-tags__tag').forEach(tag => {
            const removeBtn = tag.querySelector('.ds-dynamic-tags__remove');
            if (removeBtn) {
                const removeHandler = (e) => {
                    e.stopPropagation();
                    tag.remove();
                    this.dispatchChange();
                };
                removeBtn.addEventListener('click', removeHandler);
                this._listeners.push({ el: removeBtn, event: 'click', handler: removeHandler });
            }
        });

        if (this.input) {
            const addTag = () => {
                const value = this.input.value.trim();
                if (!value) return;

                if (!this.allowDuplicates && this.hasTag(value)) {
                    this.input.value = '';
                    return;
                }

                if (this.getTags().length >= this.maxCount) {
                    this.input.value = '';
                    this.element.dispatchEvent(new CustomEvent('kupola:dynamic-tags-max', {
                        detail: { maxCount: this.maxCount }
                    }));
                    return;
                }

                const tag = this.createTag(value);
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

    createTag(value) {
        const tag = document.createElement('span');
        tag.className = `ds-dynamic-tags__tag ds-dynamic-tags__tag--${this.color}`;
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

        return tag;
    }

    hasTag(value) {
        const tags = this.element.querySelectorAll('.ds-dynamic-tags__tag');
        for (const tag of tags) {
            if (tag.textContent.trim() === value) {
                return true;
            }
        }
        return false;
    }

    addTag(value, color) {
        if (!value || !this.input) return;
        
        if (!this.allowDuplicates && this.hasTag(value)) {
            return;
        }

        if (this.getTags().length >= this.maxCount) {
            this.element.dispatchEvent(new CustomEvent('kupola:dynamic-tags-max', {
                detail: { maxCount: this.maxCount }
            }));
            return;
        }

        const tag = this.createTag(value);
        if (color) {
            const colorClasses = ['ds-dynamic-tags__tag--default', 'ds-dynamic-tags__tag--primary', 'ds-dynamic-tags__tag--success', 'ds-dynamic-tags__tag--warning', 'ds-dynamic-tags__tag--danger', 'ds-dynamic-tags__tag--info'];
            colorClasses.forEach(cls => tag.classList.remove(cls));
            if (colorClasses.includes(`ds-dynamic-tags__tag--${color}`)) {
                tag.classList.add(`ds-dynamic-tags__tag--${color}`);
            }
        }
        this.element.insertBefore(tag, this.input);
        this.dispatchChange();
    }

    removeTag(index) {
        const tags = this.element.querySelectorAll('.ds-dynamic-tags__tag');
        const tag = tags[index];
        if (tag) {
            tag.remove();
            this.dispatchChange();
        }
    }

    removeTagByValue(value) {
        const tags = this.element.querySelectorAll('.ds-dynamic-tags__tag');
        for (const tag of tags) {
            if (tag.textContent.trim() === value) {
                tag.remove();
                this.dispatchChange();
                return;
            }
        }
    }

    getTags() {
        const tags = [];
        this.element.querySelectorAll('.ds-dynamic-tags__tag').forEach(tag => {
            tags.push(tag.textContent.trim());
        });
        return tags;
    }

    getTagsWithColor() {
        const tags = [];
        this.element.querySelectorAll('.ds-dynamic-tags__tag').forEach(tag => {
            const color = Array.from(tag.classList).find(cls => cls.startsWith('ds-dynamic-tags__tag--'))?.replace('ds-dynamic-tags__tag--', '') || 'default';
            tags.push({ value: tag.textContent.trim(), color });
        });
        return tags;
    }

    clearTags() {
        this.element.querySelectorAll('.ds-dynamic-tags__tag').forEach(tag => {
            tag.remove();
        });
        this.dispatchChange();
    }

    setTags(tags) {
        this.clearTags();
        tags.forEach(tag => {
            if (typeof tag === 'string') {
                this.addTag(tag);
            } else if (tag && typeof tag === 'object' && tag.value) {
                this.addTag(tag.value, tag.color);
            }
        });
    }

    setMaxCount(max) {
        this.maxCount = max;
        this.element.setAttribute('data-dynamic-tags-max', max);
    }

    getMaxCount() {
        return this.maxCount;
    }

    setAllowDuplicates(allow) {
        this.allowDuplicates = allow;
    }

    isAllowDuplicates() {
        return this.allowDuplicates;
    }

    setColor(color) {
        const validColors = ['default', 'primary', 'success', 'warning', 'danger', 'info'];
        if (validColors.includes(color)) {
            this.color = color;
            this.element.setAttribute('data-dynamic-tags-color', color);
        }
    }

    getColor() {
        return this.color;
    }

    dispatchChange() {
        this.element.dispatchEvent(new CustomEvent('kupola:dynamic-tags-change', {
            detail: {
                tags: this.getTags(),
                tagsWithColor: this.getTagsWithColor(),
                count: this.getTags().length,
                maxCount: this.maxCount
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

function initDynamicTags(element, options) {
    if (element.__kupolaInitialized) return;

    const instance = new DynamicTags(element, options);
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

export { DynamicTags, initDynamicTagsAll, initDynamicTags, cleanupDynamicTags };

kupolaInitializer.register('dynamic-tags', initDynamicTags, cleanupDynamicTags);