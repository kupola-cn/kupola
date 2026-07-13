import { globalEvents } from './global-events.js';
import { kupolaInitializer } from './initializer.js';
import { getZIndexConfig } from './kupola-config.js';

class Select {
  constructor(element, options = {}) {
    this.element = element;
    this.trigger = element.querySelector('.ds-select__trigger');
    this.valueEl = element.querySelector('.ds-select__value') || element.querySelector('.ds-select__trigger span');
    this.optionsEl = element.querySelector('.ds-select__options') || element.querySelector('.ds-select__menu');
    this.nativeSelect = element.querySelector('select');
    this.icon = element.querySelector('.ds-select__icon');
    this.scope = `select-${Math.random().toString(36).substr(2, 9)}`;
    
    // Options
    this.multiple = options.multiple || element.hasAttribute('data-select-multiple');
    this.searchable = options.searchable || element.hasAttribute('data-select-search');
    this.clearable = options.clearable || element.hasAttribute('data-select-clear');
    this.placeholder = options.placeholder || element.getAttribute('data-select-placeholder') || '';
    this.disabled = options.disabled || element.hasAttribute('data-select-disabled');
    this.maxSelection = options.maxSelection || parseInt(element.getAttribute('data-select-max')) || Infinity;
    this.remoteMethod = options.remoteMethod || null;
    this.onChange = options.onChange || null;
    this.appendToBody = options.appendToBody !== false;
    
    // State
    this.isOpen = false;
    this.selectedValues = new Set();
    this.allOptions = [];
    this.filteredOptions = [];
    this.focusIndex = -1;
    this.searchInput = null;
    this.clearBtn = null;
    this.tagsWrap = null;
    this._originalParent = null;
    this._originalPosition = null;
    
    this._triggerClickHandler = null;
    this._documentClickHandler = null;
    this._documentClickListener = null;
    this._optionClickHandler = null;
    this._keydownHandler = null;
  }

  init() {
    if (!this.trigger || !this.optionsEl) return;
    if (this.element.__kupolaInitialized) return;

    // Collect existing options
    this._collectOptions();
    
    // Build search input if searchable
    if (this.searchable) {
      this._createSearchInput();
    }
    
    // Build clear button if clearable
    if (this.clearable) {
      this._createClearButton();
    }
    
    // Build tags container for multiple mode
    if (this.multiple) {
      this._createTagsWrap();
    }
    
    // Set placeholder
    if (this.placeholder && this.valueEl) {
      this.valueEl.setAttribute('data-placeholder', this.placeholder);
      if (!this.selectedValues.size) {
        this.valueEl.classList.add('ds-select__value--placeholder');
        this.valueEl.textContent = this.placeholder;
      }
    }

    // Option click handler
    this._optionClickHandler = (e) => {
      e.stopPropagation();
      const option = e.currentTarget;
      if (option.classList.contains('is-disabled')) return;
      
      const value = option.getAttribute('data-value');
      
      if (this.multiple) {
        this._toggleMultiOption(value, option);
      } else {
        this._selectSingleOption(value, option);
      }
    };

    this._bindOptionClicks();

    // Trigger click
    this._triggerClickHandler = (e) => {
      e.stopPropagation();
      if (this.disabled) return;
      this.toggleOptions();
    };

    this.trigger.addEventListener('click', this._triggerClickHandler);

    // Keyboard navigation
    this._keydownHandler = (e) => {
      if (!this.isOpen || this.disabled) return;
      const items = this._getVisibleOptions();
      if (!items.length) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          this.focusIndex = Math.min(this.focusIndex + 1, items.length - 1);
          this._focusOption(items);
          break;
        case 'ArrowUp':
          e.preventDefault();
          this.focusIndex = Math.max(this.focusIndex - 1, 0);
          this._focusOption(items);
          break;
        case 'Enter':
          e.preventDefault();
          if (this.focusIndex >= 0 && items[this.focusIndex]) {
            items[this.focusIndex].click();
          }
          break;
        case 'Escape':
          e.preventDefault();
          this.hideOptions();
          this.trigger.focus();
          break;
      }
    };
    document.addEventListener('keydown', this._keydownHandler);

    // Document click to close
    this._documentClickHandler = (e) => {
      if (!this.isOpen) return;
      const isInElement = this.element.contains(e.target);
      const isInOptions = this.optionsEl && this.optionsEl.contains(e.target);
      if (!isInElement && !isInOptions) {
        this.hideOptions();
      }
    };

    this._documentClickListener = globalEvents.on(document, 'click', this._documentClickHandler, { scope: this.scope });

    // Restore selected state from native select or data attributes
    this._restoreSelectedState();

    this.optionsEl.style.display = 'none';
    this.element.__kupolaInitialized = true;
  }

  _collectOptions() {
    this.allOptions = [];
    this.optionsEl.querySelectorAll('.ds-select__option, .ds-select__item').forEach(opt => {
      this.allOptions.push({
        el: opt,
        value: opt.getAttribute('data-value'),
        text: opt.textContent.trim(),
        group: opt.closest('.ds-select__group')?.getAttribute('data-group') || '',
        disabled: opt.classList.contains('is-disabled')
      });
    });
    this.filteredOptions = [...this.allOptions];
  }

  _createSearchInput() {
    this.searchInput = document.createElement('input');
    this.searchInput.className = 'ds-select__search';
    this.searchInput.type = 'text';
    this.searchInput.placeholder = 'Search...';
    this.searchInput.setAttribute('autocomplete', 'off');
    
    this.searchInput.addEventListener('input', () => this._handleSearch());
    this.searchInput.addEventListener('click', (e) => e.stopPropagation());
    
    // Insert at top of options
    this.optionsEl.insertBefore(this.searchInput, this.optionsEl.firstChild);
  }

  _createClearButton() {
    this.clearBtn = document.createElement('button');
    this.clearBtn.className = 'ds-select__clear';
    this.clearBtn.type = 'button';
    this.clearBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
    this.clearBtn.style.display = 'none';
    
    this.clearBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.clear();
    });
    
    // Insert into trigger area
    const triggerParent = this.trigger.querySelector('.ds-select__value') || this.trigger;
    triggerParent.parentNode.insertBefore(this.clearBtn, triggerParent.nextSibling);
  }

  _createTagsWrap() {
    this.tagsWrap = document.createElement('div');
    this.tagsWrap.className = 'ds-select__tags';
    
    const triggerParent = this.valueEl || this.trigger;
    triggerParent.parentNode.insertBefore(this.tagsWrap, triggerParent.nextSibling);
  }

  _handleSearch() {
    const query = this.searchInput.value.toLowerCase().trim();
    
    if (this.remoteMethod) {
      this.remoteMethod(query, (options) => {
        this._renderRemoteOptions(options);
      });
      return;
    }
    
    this.filteredOptions = this.allOptions.filter(opt => 
      opt.text.toLowerCase().includes(query)
    );
    
    // Hide non-matching options
    this.allOptions.forEach(opt => {
      const visible = this.filteredOptions.includes(opt);
      opt.el.style.display = visible ? '' : 'none';
    });
    
    // Show/hide group headers
    this.optionsEl.querySelectorAll('.ds-select__group-title').forEach(title => {
      const group = title.getAttribute('data-group');
      const hasVisible = this.filteredOptions.some(opt => opt.group === group);
      title.style.display = hasVisible ? '' : 'none';
    });
    
    this.focusIndex = -1;
  }

  _renderRemoteOptions(options) {
    // Ensure _optionClickHandler is defined
    if (!this._optionClickHandler) {
      this._optionClickHandler = (e) => {
        e.stopPropagation();
        const option = e.currentTarget;
        if (option.classList.contains('is-disabled')) return;
        
        const value = option.getAttribute('data-value');
        
        if (this.multiple) {
          this._toggleMultiOption(value, option);
        } else {
          this._selectSingleOption(value, option);
        }
      };
    }

    this.optionsEl.querySelectorAll('.ds-select__option, .ds-select__item').forEach(opt => {
      if (opt._selectOptionClickHandler) {
        opt.removeEventListener('click', opt._selectOptionClickHandler);
      }
      opt.remove();
    });
    
    options.forEach(opt => {
      const el = document.createElement('div');
      el.className = 'ds-select__option';
      el.setAttribute('data-value', opt.value);
      el.textContent = opt.text || opt.label;
      if (opt.disabled) el.classList.add('is-disabled');
      if (this.selectedValues.has(opt.value)) el.classList.add('is-selected');
      
      el._selectOptionClickHandler = (e) => this._optionClickHandler(e);
      el.addEventListener('click', el._selectOptionClickHandler);
      
      this.optionsEl.appendChild(el);
    });
    
    this.allOptions = options.map(opt => ({
      el: this.optionsEl.querySelector(`[data-value="${opt.value}"]`),
      value: opt.value,
      text: opt.text || opt.label,
      group: '',
      disabled: !!opt.disabled
    }));
    this.filteredOptions = [...this.allOptions];
  }

  _selectSingleOption(value, optionEl) {
    // Deselect all
    this.optionsEl.querySelectorAll('.ds-select__option, .ds-select__item').forEach(o => o.classList.remove('is-selected'));
    optionEl.classList.add('is-selected');
    
    this.selectedValues.clear();
    this.selectedValues.add(value);
    
    this.updateValue(optionEl.textContent.trim());
    this._syncNativeSelect();
    this.hideOptions();
    this._updateClearBtn();
    this._fireChange();
  }

  _toggleMultiOption(value, optionEl) {
    if (this.selectedValues.has(value)) {
      this.selectedValues.delete(value);
      optionEl.classList.remove('is-selected');
    } else {
      if (this.selectedValues.size >= this.maxSelection) return;
      this.selectedValues.add(value);
      optionEl.classList.add('is-selected');
    }
    
    this._updateTags();
    this._updateValueDisplay();
    this._syncNativeSelect();
    this._updateClearBtn();
    this._fireChange();
  }

  _updateTags() {
    if (!this.tagsWrap) return;
    this.tagsWrap.innerHTML = '';
    
    this.selectedValues.forEach(value => {
      const opt = this.allOptions.find(o => o.value === value);
      if (!opt) return;
      
      const tag = document.createElement('span');
      tag.className = 'ds-select__tag';
      tag.textContent = opt.text;
      
      const removeBtn = document.createElement('button');
      removeBtn.className = 'ds-select__tag-close';
      removeBtn.type = 'button';
      removeBtn.innerHTML = '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.selectedValues.delete(value);
        const optEl = this.optionsEl.querySelector(`[data-value="${value}"]`);
        if (optEl) optEl.classList.remove('is-selected');
        this._updateTags();
        this._updateValueDisplay();
        this._syncNativeSelect();
        this._updateClearBtn();
        this._fireChange();
      });
      
      tag.appendChild(removeBtn);
      this.tagsWrap.appendChild(tag);
    });
  }

  _updateValueDisplay() {
    if (!this.valueEl) return;
    
    if (this.multiple) {
      const count = this.selectedValues.size;
      if (count === 0) {
        this.valueEl.textContent = this.placeholder || '';
        this.valueEl.classList.add('ds-select__value--placeholder');
      } else {
        this.valueEl.textContent = `Selected ${count}`;
        this.valueEl.classList.remove('ds-select__value--placeholder');
      }
      // Hide trigger text when tags are shown
      if (this.tagsWrap) {
        this.valueEl.style.display = count > 0 ? 'none' : '';
      }
    } else {
      if (this.selectedValues.size === 0) {
        this.valueEl.textContent = this.placeholder || '';
        this.valueEl.classList.add('ds-select__value--placeholder');
      }
    }
  }

  _updateClearBtn() {
    if (!this.clearBtn) return;
    this.clearBtn.style.display = this.selectedValues.size > 0 ? '' : 'none';
  }

  _syncNativeSelect() {
    if (!this.nativeSelect) return;
    if (this.multiple) {
      Array.from(this.nativeSelect.options).forEach(opt => {
        opt.selected = this.selectedValues.has(opt.value);
      });
    } else {
      this.nativeSelect.value = Array.from(this.selectedValues)[0] || '';
    }
  }

  _fireChange() {
    if (this.nativeSelect) {
      this.nativeSelect.dispatchEvent(new Event('change', { bubbles: true }));
    }
    
    const values = this.multiple ? Array.from(this.selectedValues) : Array.from(this.selectedValues)[0];
    
    if (this.onChange) {
      this.onChange({ values, selectedOptions: this.getSelectedOptions() });
    }
    
    this.element.dispatchEvent(new CustomEvent('kupola:select-change', {
      detail: { values, selectedOptions: this.getSelectedOptions() },
      bubbles: true
    }));
  }

  _restoreSelectedState() {
    if (this.nativeSelect) {
      if (this.multiple) {
        Array.from(this.nativeSelect.selectedOptions).forEach(opt => {
          this.selectedValues.add(opt.value);
          const el = this.optionsEl.querySelector(`[data-value="${opt.value}"]`);
          if (el) el.classList.add('is-selected');
        });
        this._updateTags();
        this._updateValueDisplay();
      } else if (this.nativeSelect.value) {
        this.selectedValues.add(this.nativeSelect.value);
        const el = this.optionsEl.querySelector(`[data-value="${this.nativeSelect.value}"]`);
        if (el) {
          el.classList.add('is-selected');
          this.updateValue(el.textContent.trim());
        }
      }
    }
    this._updateClearBtn();
  }

  _bindOptionClicks() {
    this.optionsEl.querySelectorAll('.ds-select__option, .ds-select__item').forEach(option => {
      option._selectOptionClickHandler = (e) => this._optionClickHandler(e);
      option.addEventListener('click', option._selectOptionClickHandler);
    });
  }

  _getVisibleOptions() {
    return Array.from(this.optionsEl.querySelectorAll('.ds-select__option, .ds-select__item'))
      .filter(el => el.style.display !== 'none' && !el.classList.contains('is-disabled'));
  }

  _focusOption(items) {
    items.forEach(item => item.classList.remove('is-focused'));
    if (items[this.focusIndex]) {
      items[this.focusIndex].classList.add('is-focused');
      items[this.focusIndex].scrollIntoView({ block: 'nearest' });
    }
  }

  updateValue(text) {
    if (this.valueEl) {
      this.valueEl.textContent = text || this.valueEl.textContent;
      this.valueEl.classList.remove('ds-select__value--placeholder');
    }
  }

  showOptions() {
    if (this.disabled || this.isOpen) return;
    this.isOpen = true;
    this.element.classList.add('is-open');
    if (this.icon) this.icon.style.transform = 'rotate(180deg)';
    this.focusIndex = -1;

    if (this.appendToBody) {
      this._appendOptionsToBody();
      this._addScrollListener();
    }

    this.optionsEl.style.display = 'block';
    this._calculateOptionsPosition();
    
    if (this.searchInput) {
      setTimeout(() => this.searchInput.focus(), 50);
    }
  }

  hideOptions() {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.optionsEl.style.display = 'none';
    if (this.icon) this.icon.style.transform = 'rotate(0deg)';
    this.element.classList.remove('is-open');

    if (this.appendToBody) {
      this._restoreOptionsFromBody();
      this._removeScrollListener();
    }
    
    // Clear search
    if (this.searchInput) {
      this.searchInput.value = '';
      this._handleSearch();
    }
    
    // Clear focus
    this.optionsEl.querySelectorAll('.ds-select__option, .ds-select__item').forEach(o => o.classList.remove('is-focused'));
  }

  _addScrollListener() {
    this._scrollHandler = () => {
      this.hideOptions();
    };
    window.addEventListener('scroll', this._scrollHandler, true);
  }

  _removeScrollListener() {
    if (this._scrollHandler) {
      window.removeEventListener('scroll', this._scrollHandler, true);
      this._scrollHandler = null;
    }
  }

  _appendOptionsToBody() {
    if (!this.optionsEl) return;
    this._originalParent = this.optionsEl.parentNode;
    this._originalPosition = this.optionsEl.style.position;
    this._originalTop = this.optionsEl.style.top;
    this._originalLeft = this.optionsEl.style.left;
    this._originalRight = this.optionsEl.style.right;
    this._originalWidth = this.optionsEl.style.width;
    this._originalTransform = this.optionsEl.style.transform;
    this._originalZIndex = this.optionsEl.style.zIndex;

    const triggerRect = this.element.getBoundingClientRect();
    const zIndex = getZIndexConfig().dropdown;
    this.optionsEl.style.position = 'fixed';
    this.optionsEl.style.width = `${triggerRect.width}px`;
    this.optionsEl.style.zIndex = zIndex;
    this.optionsEl.style.transform = 'translateZ(0)';
    document.body.appendChild(this.optionsEl);
  }

  _restoreOptionsFromBody() {
    if (!this.optionsEl || !this._originalParent) return;
    this._originalParent.appendChild(this.optionsEl);
    this.optionsEl.style.position = this._originalPosition || '';
    this.optionsEl.style.top = this._originalTop || '';
    this.optionsEl.style.left = this._originalLeft || '';
    this.optionsEl.style.right = this._originalRight || '';
    this.optionsEl.style.width = this._originalWidth || '';
    this.optionsEl.style.zIndex = this._originalZIndex || '';
    this.optionsEl.style.transform = this._originalTransform || '';
    this._originalParent = null;
  }

  _calculateOptionsPosition() {
    if (!this.appendToBody || !this.optionsEl) return;

    const triggerRect = this.element.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    this.optionsEl.style.width = `${triggerRect.width}px`;
    const optionsRect = this.optionsEl.getBoundingClientRect();

    const spaceBelow = viewportHeight - triggerRect.bottom;
    const spaceAbove = triggerRect.top;

    if (spaceBelow < optionsRect.height && spaceAbove > spaceBelow) {
      this.optionsEl.style.top = `${triggerRect.top - optionsRect.height - 4}px`;
    } else {
      this.optionsEl.style.top = `${triggerRect.bottom + 4}px`;
    }

    if (triggerRect.left + optionsRect.width > viewportWidth) {
      this.optionsEl.style.left = `${triggerRect.right - optionsRect.width}px`;
    } else {
      this.optionsEl.style.left = `${triggerRect.left}px`;
    }
  }

  toggleOptions() {
    if (this.isOpen) {
      this.hideOptions();
    } else {
      this.showOptions();
    }
  }

  clear() {
    this.selectedValues.clear();
    this.optionsEl.querySelectorAll('.ds-select__option, .ds-select__item').forEach(o => o.classList.remove('is-selected'));
    this._updateTags();
    this._updateValueDisplay();
    this._syncNativeSelect();
    this._updateClearBtn();
    this._fireChange();
  }

  getSelectedOptions() {
    return Array.from(this.selectedValues).map(value => {
      const opt = this.allOptions.find(o => o.value === value);
      return opt ? { value: opt.value, text: opt.text } : { value, text: '' };
    });
  }

  getValue() {
    return this.multiple ? Array.from(this.selectedValues) : Array.from(this.selectedValues)[0] || '';
  }

  setValue(value) {
    if (this.multiple && Array.isArray(value)) {
      this.selectedValues.clear();
      value.forEach(v => this.selectedValues.add(v));
      this.optionsEl.querySelectorAll('.ds-select__option, .ds-select__item').forEach(o => {
        o.classList.toggle('is-selected', this.selectedValues.has(o.getAttribute('data-value')));
      });
      this._updateTags();
      this._updateValueDisplay();
    } else {
      this.selectedValues.clear();
      this.selectedValues.add(value);
      this.optionsEl.querySelectorAll('.ds-select__option, .ds-select__item').forEach(o => {
        const isSelected = o.getAttribute('data-value') === value;
        o.classList.toggle('is-selected', isSelected);
        if (isSelected) this.updateValue(o.textContent.trim());
      });
    }
    this._syncNativeSelect();
    this._updateClearBtn();
  }

  enable() {
    this.disabled = false;
    this.element.removeAttribute('data-select-disabled');
  }

  disable() {
    this.disabled = true;
    this.element.setAttribute('data-select-disabled', '');
    this.hideOptions();
  }

  destroy() {
    if (!this.element.__kupolaInitialized) return;

    if (this.trigger && this._triggerClickHandler) {
      this.trigger.removeEventListener('click', this._triggerClickHandler);
    }

    if (this.optionsEl) {
      this.optionsEl.querySelectorAll('.ds-select__option, .ds-select__item').forEach(option => {
        if (option._selectOptionClickHandler) {
          option.removeEventListener('click', option._selectOptionClickHandler);
        }
      });
    }

    if (this._keydownHandler) document.removeEventListener('keydown', this._keydownHandler);

    if (this._documentClickListener && this._documentClickListener.unsubscribe) {
      this._documentClickListener.unsubscribe();
    } else if (this._documentClickHandler) {
      document.removeEventListener('click', this._documentClickHandler);
    }

    // Remove created elements
    if (this.searchInput) this.searchInput.remove();
    if (this.clearBtn) this.clearBtn.remove();
    if (this.tagsWrap) this.tagsWrap.remove();

    if (this.appendToBody && this._originalParent) {
      this._restoreOptionsFromBody();
    }

    this._documentClickHandler = null;
    this._documentClickListener = null;
    this._triggerClickHandler = null;
    this._optionClickHandler = null;
    this._keydownHandler = null;
    this.element.__kupolaInitialized = false;
  }
}

function initSelect(element, options) {
  const select = new Select(element, options);
  select.init();
  element._kupolaSelect = select;
}

function initSelects(root = document) {
  root.querySelectorAll('.ds-select').forEach(select => {
    initSelect(select);
  });
}

function cleanupSelect(select) {
  if (select._kupolaSelect) {
    select._kupolaSelect.destroy();
    select._kupolaSelect = null;
  }
}

function cleanupAllSelects() {
  document.querySelectorAll('.ds-select').forEach(select => {
    cleanupSelect(select);
  });
}

export { Select, initSelect, initSelects, cleanupSelect, cleanupAllSelects };

kupolaInitializer.register('select', initSelect, cleanupSelect);