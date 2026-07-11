class Tag {
    constructor(element, options = {}) {
        this.element = element;
        this.closeBtn = element.querySelector('.ds-tag__close');
        this.checkbox = element.querySelector('.ds-tag__checkbox');
        this.editInput = element.querySelector('.ds-tag__input');
        
        this._listeners = [];
        
        this.color = options.color || element.getAttribute('data-tag-color') || 'default';
        this.size = options.size || element.getAttribute('data-tag-size') || 'default';
        this.checkable = options.checkable || element.hasAttribute('data-tag-checkable');
        this.checked = options.checked || element.hasAttribute('data-tag-checked');
        this.editable = options.editable || element.hasAttribute('data-tag-editable');
        this.maxLength = options.maxLength || parseInt(element.getAttribute('data-tag-maxlength')) || 50;
        
        this.init();
    }

    init() {
        this._applyStyles();
        
        if (this.closeBtn) {
            const closeHandler = (e) => {
                e.stopPropagation();
                this.element.dispatchEvent(new CustomEvent('kupola:tag-remove', {
                    detail: { tag: this.element, content: this.getContent() },
                    bubbles: true
                }));
                this.element.remove();
            };
            this.closeBtn.addEventListener('click', closeHandler);
            this._listeners.push({ el: this.closeBtn, event: 'click', handler: closeHandler });
        }
        
        if (this.checkable) {
            const clickHandler = (e) => {
                if (e.target !== this.checkbox && e.target !== this.closeBtn) {
                    this.toggleChecked();
                }
            };
            this.element.addEventListener('click', clickHandler);
            this._listeners.push({ el: this.element, event: 'click', handler: clickHandler });
            
            if (this.checkbox) {
                const checkboxHandler = () => {
                    this.toggleChecked();
                };
                this.checkbox.addEventListener('change', checkboxHandler);
                this._listeners.push({ el: this.checkbox, event: 'change', handler: checkboxHandler });
            }
        }
        
        if (this.editable) {
            const dblclickHandler = () => {
                this.startEdit();
            };
            this.element.addEventListener('dblclick', dblclickHandler);
            this._listeners.push({ el: this.element, event: 'dblclick', handler: dblclickHandler });
            
            if (this.editInput) {
                const blurHandler = () => {
                    this.endEdit();
                };
                const keydownHandler = (e) => {
                    if (e.key === 'Enter') {
                        this.endEdit();
                    } else if (e.key === 'Escape') {
                        this.cancelEdit();
                    }
                };
                this.editInput.addEventListener('blur', blurHandler);
                this.editInput.addEventListener('keydown', keydownHandler);
                this._listeners.push({ el: this.editInput, event: 'blur', handler: blurHandler });
                this._listeners.push({ el: this.editInput, event: 'keydown', handler: keydownHandler });
            }
        }
    }

    _applyStyles() {
        const colorClasses = ['ds-tag--default', 'ds-tag--primary', 'ds-tag--success', 'ds-tag--warning', 'ds-tag--danger', 'ds-tag--info'];
        const sizeClasses = ['ds-tag--default', 'ds-tag--small', 'ds-tag--large'];
        
        colorClasses.forEach(cls => this.element.classList.remove(cls));
        sizeClasses.forEach(cls => this.element.classList.remove(cls));
        
        if (colorClasses.includes(`ds-tag--${this.color}`)) {
            this.element.classList.add(`ds-tag--${this.color}`);
        }
        if (sizeClasses.includes(`ds-tag--${this.size}`)) {
            this.element.classList.add(`ds-tag--${this.size}`);
        }
        
        if (this.checkable) {
            this.element.classList.add('ds-tag--checkable');
        }
        if (this.checked) {
            this.element.classList.add('is-checked');
        }
        if (this.editable) {
            this.element.classList.add('ds-tag--editable');
        }
    }

    setContent(content) {
        if (this.editable && this.editInput) {
            this.editInput.value = content;
        }
        
        const textNodes = [];
        this.element.childNodes.forEach(node => {
            if (node.nodeType === Node.TEXT_NODE) {
                textNodes.push(node);
            }
        });
        textNodes.forEach(node => node.remove());
        
        const closeBtn = this.element.querySelector('.ds-tag__close');
        const checkbox = this.element.querySelector('.ds-tag__checkbox');
        const input = this.element.querySelector('.ds-tag__input');
        
        const insertBeforeEl = closeBtn || checkbox || input || null;
        this.element.insertBefore(document.createTextNode(content), insertBeforeEl);
        
        this.element.dispatchEvent(new CustomEvent('kupola:tag-change', {
            detail: { tag: this.element, content },
            bubbles: true
        }));
    }

    getContent() {
        if (this.editable && this.editInput && this.element.classList.contains('is-editing')) {
            return this.editInput.value;
        }
        return this.element.textContent.trim();
    }

    setColor(color) {
        const validColors = ['default', 'primary', 'success', 'warning', 'danger', 'info'];
        if (validColors.includes(color)) {
            this.color = color;
            this.element.setAttribute('data-tag-color', color);
            this._applyStyles();
        }
    }

    getColor() {
        return this.color;
    }

    setSize(size) {
        const validSizes = ['default', 'small', 'large'];
        if (validSizes.includes(size)) {
            this.size = size;
            this.element.setAttribute('data-tag-size', size);
            this._applyStyles();
        }
    }

    getSize() {
        return this.size;
    }

    toggleChecked() {
        this.checked = !this.checked;
        this.element.setAttribute('data-tag-checked', this.checked ? 'true' : 'false');
        this._applyStyles();
        
        if (this.checkbox) {
            this.checkbox.checked = this.checked;
        }
        
        this.element.dispatchEvent(new CustomEvent('kupola:tag-check', {
            detail: { tag: this.element, checked: this.checked, content: this.getContent() },
            bubbles: true
        }));
    }

    setChecked(checked) {
        this.checked = checked;
        this.element.setAttribute('data-tag-checked', checked ? 'true' : 'false');
        this._applyStyles();
        
        if (this.checkbox) {
            this.checkbox.checked = checked;
        }
    }

    isChecked() {
        return this.checked;
    }

    startEdit() {
        if (!this.editable) return;
        
        const content = this.getContent();
        
        if (!this.editInput) {
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'ds-tag__input';
            input.value = content;
            input.maxLength = this.maxLength;
            this.editInput = input;
            
            const closeBtn = this.element.querySelector('.ds-tag__close');
            this.element.insertBefore(input, closeBtn);
            
            const blurHandler = () => this.endEdit();
            const keydownHandler = (e) => {
                if (e.key === 'Enter') {
                    this.endEdit();
                } else if (e.key === 'Escape') {
                    this.cancelEdit();
                }
            };
            input.addEventListener('blur', blurHandler);
            input.addEventListener('keydown', keydownHandler);
            this._listeners.push({ el: input, event: 'blur', handler: blurHandler });
            this._listeners.push({ el: input, event: 'keydown', handler: keydownHandler });
        } else {
            this.editInput.value = content;
        }
        
        this.element.classList.add('is-editing');
        
        setTimeout(() => {
            if (this.editInput) {
                this.editInput.focus();
                this.editInput.select();
            }
        }, 0);
    }

    endEdit() {
        if (!this.editable || !this.element.classList.contains('is-editing')) return;
        
        const newContent = this.editInput.value.trim();
        this.element.classList.remove('is-editing');
        
        if (newContent && newContent !== this.getContent()) {
            this.setContent(newContent);
            this.element.dispatchEvent(new CustomEvent('kupola:tag-edit', {
                detail: { tag: this.element, content: newContent },
                bubbles: true
            }));
        }
    }

    cancelEdit() {
        if (!this.editable || !this.element.classList.contains('is-editing')) return;
        
        this.element.classList.remove('is-editing');
        if (this.editInput) {
            this.editInput.value = this.getContent();
        }
    }

    setEditable(editable) {
        this.editable = editable;
        if (editable) {
            this.element.setAttribute('data-tag-editable', '');
        } else {
            this.element.removeAttribute('data-tag-editable');
        }
        this._applyStyles();
    }

    isEditable() {
        return this.editable;
    }

    setCheckable(checkable) {
        if (this.checkable !== checkable) {
            this.destroy();
            this.checkable = checkable;
            if (checkable) {
                this.element.setAttribute('data-tag-checkable', '');
            } else {
                this.element.removeAttribute('data-tag-checkable');
            }
            this.init();
        }
    }

    isCheckable() {
        return this.checkable;
    }

    destroy() {
        this._listeners.forEach(({ el, event, handler }) => {
            el.removeEventListener(event, handler);
        });
        this._listeners = [];
        this.closeBtn = null;
        this.checkbox = null;
        this.editInput = null;
        this.element = null;
    }
}

function initTag(element, options) {
    if (element.__kupolaInitialized) return;

    const instance = new Tag(element, options);
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

export { Tag, initTags, initTag, cleanupTag };

if (typeof window !== 'undefined') {
    window.Tag = Tag;
    window.initTag = initTag;
    window.cleanupTag = cleanupTag;
    window.initTags = initTags;
    
    if (window.kupolaInitializer) {
        window.kupolaInitializer.register('tag', initTag, cleanupTag);
    }
}