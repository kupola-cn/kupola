import { globalEvents } from './global-events.js';
import { kupolaInitializer } from './initializer.js';
import { getUiConfig } from './kupola-config.js';

class Dropdown {
  constructor(element, options = {}) {
    this.element = element;
    this.trigger = element.querySelector('.ds-dropdown__trigger');
    this.menu = element.querySelector('.ds-dropdown__menu');
    this.triggerText = this.trigger ? this.trigger.querySelector('span') : null;
    this.scope = `dropdown-${Math.random().toString(36).substr(2, 9)}`;

    // Options
    const uiConfig = getUiConfig();
    this.triggerMode = options.trigger || element.getAttribute('data-dropdown-trigger') || 'click'; // click | hover
    this.hoverDelay = options.hoverDelay || parseInt(element.getAttribute('data-dropdown-hover-delay')) || 150;
    this.disabled = options.disabled || element.hasAttribute('data-dropdown-disabled');
    this.keyboardNav = options.keyboardNav !== false;
    this.autoPosition = options.autoPosition !== false;
    this.closeOnClick = options.closeOnClick !== undefined ? options.closeOnClick : (uiConfig.dropdown?.closeOnClick !== undefined ? uiConfig.dropdown.closeOnClick : true);
    this.appendToBody = options.appendToBody !== false;
    this.onSelect = options.onSelect || null;
    this.onShow = options.onShow || null;
    this.onHide = options.onHide || null;

    this.isOpen = false;
    this.focusIndex = -1;
    this._hoverTimer = null;
    this._hoverLeaveTimer = null;
    this._originalParent = null;
    this._originalPosition = null;

    this._triggerClickHandler = null;
    this._documentClickHandler = null;
    this._documentClickListener = null;
    this._itemClickHandler = null;
    this._keydownHandler = null;
    this._mouseenterHandler = null;
    this._mouseleaveHandler = null;
    this._triggerMouseenterHandler = null;
    this._triggerMouseleaveHandler = null;
    this._triggerKeydownHandler = null;
  }

  init() {
    if (!this.trigger || !this.menu) {return;}
    if (this.element.__kupolaInitialized) {return;}

    // Item click handler
    this._itemClickHandler = (e) => {
      const item = e.currentTarget;
      if (item.classList.contains('is-disabled') || item.classList.contains('ds-dropdown__divider')) {return;}

      if (this.triggerText && !item.hasAttribute('data-no-update-trigger')) {
        this.triggerText.textContent = item.textContent.trim();
      }

      if (this.onSelect) {
        this.onSelect({ item, value: item.getAttribute('data-value'), text: item.textContent.trim() });
      }

      if (this.closeOnClick) {
        this.hideMenu();
        this.trigger.focus();
      }
    };

    this._bindMenuItems();

    // Trigger click
    this._triggerClickHandler = (e) => {
      e.stopPropagation();
      if (this.disabled) {return;}
      this.toggleMenu();
    };

    // Hover trigger
    this._triggerMouseenterHandler = () => {
      if (this.disabled || this.triggerMode !== 'hover') {return;}
      clearTimeout(this._hoverLeaveTimer);
      this._hoverTimer = setTimeout(() => this.showMenu(), this.hoverDelay);
    };

    this._triggerMouseleaveHandler = () => {
      if (this.triggerMode !== 'hover') {return;}
      clearTimeout(this._hoverTimer);
      this._hoverLeaveTimer = setTimeout(() => this.hideMenu(), this.hoverDelay);
    };

    this._mouseenterHandler = () => {
      if (this.disabled || this.triggerMode !== 'hover') {return;}
      clearTimeout(this._hoverLeaveTimer);
    };

    this._mouseleaveHandler = () => {
      if (this.triggerMode !== 'hover') {return;}
      this._hoverLeaveTimer = setTimeout(() => this.hideMenu(), this.hoverDelay);
    };

    // Keyboard navigation
    this._keydownHandler = (e) => {
      if (!this.isOpen || this.disabled) {return;}

      const items = this._getNavigableItems();
      if (!items.length) {return;}

      switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        this.focusIndex = Math.min(this.focusIndex + 1, items.length - 1);
        this._focusItem(items);
        break;
      case 'ArrowUp':
        e.preventDefault();
        this.focusIndex = Math.max(this.focusIndex - 1, 0);
        this._focusItem(items);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (this.focusIndex >= 0 && items[this.focusIndex]) {
          items[this.focusIndex].click();
        }
        break;
      case 'Escape':
        e.preventDefault();
        this.hideMenu();
        this.trigger.focus();
        break;
      case 'Home':
        e.preventDefault();
        this.focusIndex = 0;
        this._focusItem(items);
        break;
      case 'End':
        e.preventDefault();
        this.focusIndex = items.length - 1;
        this._focusItem(items);
        break;
      }
    };

    // Bind trigger events
    if (this.triggerMode === 'hover') {
      this.trigger.addEventListener('mouseenter', this._triggerMouseenterHandler);
      this.trigger.addEventListener('mouseleave', this._triggerMouseleaveHandler);
      this.menu.addEventListener('mouseenter', this._mouseenterHandler);
      this.menu.addEventListener('mouseleave', this._mouseleaveHandler);
    } else {
      this.trigger.addEventListener('click', this._triggerClickHandler);
    }

    // Keyboard on trigger
    this._triggerKeydownHandler = (e) => {
      if (this.disabled) {return;}
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        this.showMenu();
      }
    };
    this.trigger.addEventListener('keydown', this._triggerKeydownHandler);

    document.addEventListener('keydown', this._keydownHandler);

    // Document click to close
    this._documentClickHandler = (e) => {
      if (!this.element.contains(e.target) && !this.menu.contains(e.target)) {
        this.hideMenu();
      }
    };

    this._documentClickListener = globalEvents.on(document, 'click', this._documentClickHandler, { scope: this.scope });

    this.menu.style.display = 'none';
    this.element.__kupolaInitialized = true;
  }

  _bindMenuItems() {
    this.menu.querySelectorAll('.ds-dropdown__item').forEach(item => {
      item.addEventListener('click', this._itemClickHandler);
      item._dropdownItemClickHandler = this._itemClickHandler;
    });
  }

  _getNavigableItems() {
    return Array.from(this.menu.querySelectorAll('.ds-dropdown__item'))
      .filter(item => !item.classList.contains('is-disabled') && !item.classList.contains('ds-dropdown__divider'));
  }

  _focusItem(items) {
    items.forEach(item => item.classList.remove('is-focused'));
    if (items[this.focusIndex]) {
      items[this.focusIndex].classList.add('is-focused');
      items[this.focusIndex].scrollIntoView({ block: 'nearest' });
    }
  }

  _calculatePosition() {
    if (!this.autoPosition) {return;}

    const triggerRect = this.element.getBoundingClientRect();
    const menuRect = this.menu.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    // Reset
    this.menu.classList.remove('ds-dropdown--top', 'ds-dropdown--right', 'ds-dropdown--dropup');

    if (this.appendToBody) {
      this.menu.style.width = `${Math.max(triggerRect.width, menuRect.width)}px`;

      const spaceBelow = viewportHeight - triggerRect.bottom;
      const spaceAbove = triggerRect.top;

      if (spaceBelow < menuRect.height && spaceAbove > spaceBelow) {
        this.menu.style.top = `${triggerRect.top - menuRect.height - 4}px`;
        this.menu.style.bottom = 'auto';
      } else {
        this.menu.style.top = `${triggerRect.bottom + 4}px`;
        this.menu.style.bottom = 'auto';
      }

      if (triggerRect.left + menuRect.width > viewportWidth) {
        this.menu.style.left = `${triggerRect.right - Math.max(triggerRect.width, menuRect.width)}px`;
        this.menu.style.right = 'auto';
      } else {
        this.menu.style.left = `${triggerRect.left}px`;
        this.menu.style.right = 'auto';
      }
    } else {
      const spaceBelow = viewportHeight - triggerRect.bottom;
      const spaceAbove = triggerRect.top;

      if (spaceBelow < menuRect.height && spaceAbove > spaceBelow) {
        this.menu.classList.add('ds-dropdown--dropup');
        this.menu.style.top = 'auto';
        this.menu.style.bottom = '100%';
        this.menu.style.marginBottom = '4px';
      } else {
        this.menu.style.top = '100%';
        this.menu.style.bottom = 'auto';
        this.menu.style.marginBottom = '0';
      }

      if (triggerRect.left + menuRect.width > viewportWidth) {
        this.menu.style.left = 'auto';
        this.menu.style.right = '0';
      } else {
        this.menu.style.left = '0';
        this.menu.style.right = 'auto';
      }
    }
  }

  showMenu() {
    if (this.disabled || this.isOpen) {return;}
    this.isOpen = true;
    this.focusIndex = -1;
    this.element.classList.add('is-open');

    if (this.appendToBody) {
      this._appendMenuToBody();
      this._addScrollListener();
    }

    this.menu.style.display = 'block';
    this._calculatePosition();
    if (this.onShow) {this.onShow();}
    this.element.dispatchEvent(new CustomEvent('kupola:dropdown-show', { bubbles: true }));
  }

  hideMenu() {
    if (!this.isOpen) {return;}
    this.isOpen = false;
    this.menu.style.display = 'none';
    this.element.classList.remove('is-open');

    if (this.appendToBody) {
      this._restoreMenuFromBody();
      this._removeScrollListener();
    }

    // Clear focus
    this.menu.querySelectorAll('.ds-dropdown__item').forEach(item => item.classList.remove('is-focused'));
    if (this.onHide) {this.onHide();}
    this.element.dispatchEvent(new CustomEvent('kupola:dropdown-hide', { bubbles: true }));
  }

  _appendMenuToBody() {
    if (!this.menu) return;
    this._originalParent = this.menu.parentNode;
    this._originalPosition = this.menu.style.position;
    this._originalTop = this.menu.style.top;
    this._originalLeft = this.menu.style.left;
    this._originalRight = this.menu.style.right;
    this._originalBottom = this.menu.style.bottom;
    this._originalMarginBottom = this.menu.style.marginBottom;
    this._originalWidth = this.menu.style.width;

    this.menu.style.position = 'fixed';
    this.menu.style.zIndex = '9999';
    document.body.appendChild(this.menu);
  }

  _restoreMenuFromBody() {
    if (!this.menu || !this._originalParent) return;
    this._originalParent.appendChild(this.menu);
    this.menu.style.position = this._originalPosition || '';
    this.menu.style.top = this._originalTop || '';
    this.menu.style.left = this._originalLeft || '';
    this.menu.style.right = this._originalRight || '';
    this.menu.style.bottom = this._originalBottom || '';
    this.menu.style.marginBottom = this._originalMarginBottom || '';
    this.menu.style.width = this._originalWidth || '';
    this.menu.style.zIndex = '';
    this._originalParent = null;
  }

  _addScrollListener() {
    this._scrollHandler = () => {
      this.hideMenu();
    };
    window.addEventListener('scroll', this._scrollHandler, true);
  }

  _removeScrollListener() {
    if (this._scrollHandler) {
      window.removeEventListener('scroll', this._scrollHandler, true);
      this._scrollHandler = null;
    }
  }

  toggleMenu() {
    if (this.isOpen) {
      this.hideMenu();
    } else {
      this.showMenu();
    }
  }

  enable() {
    this.disabled = false;
    this.element.removeAttribute('data-dropdown-disabled');
  }

  disable() {
    this.disabled = true;
    this.element.setAttribute('data-dropdown-disabled', '');
    this.hideMenu();
  }

  // Update menu items dynamically
  setItems(items) {
    // Remove old item listeners
    this.menu.querySelectorAll('.ds-dropdown__item').forEach(item => {
      if (item._dropdownItemClickHandler) {
        item.removeEventListener('click', item._dropdownItemClickHandler);
      }
    });

    // Rebuild menu content
    this.menu.innerHTML = '';
    items.forEach(item => {
      if (item.type === 'divider') {
        const divider = document.createElement('div');
        divider.className = 'ds-dropdown__divider';
        this.menu.appendChild(divider);
      } else {
        const el = document.createElement('div');
        el.className = 'ds-dropdown__item' + (item.disabled ? ' is-disabled' : '') + (item.active ? ' is-selected' : '');
        el.textContent = item.text || item.label || '';
        if (item.value !== undefined) {el.setAttribute('data-value', item.value);}
        if (item.icon) {el.innerHTML = item.icon + el.innerHTML;}
        if (item.disabled) {el.classList.add('is-disabled');}
        this.menu.appendChild(el);
      }
    });

    this._bindMenuItems();
  }

  destroy() {
    if (!this.element.__kupolaInitialized) {return;}

    clearTimeout(this._hoverTimer);
    clearTimeout(this._hoverLeaveTimer);

    if (this.trigger) {
      if (this._triggerClickHandler) {this.trigger.removeEventListener('click', this._triggerClickHandler);}
      if (this._triggerMouseenterHandler) {this.trigger.removeEventListener('mouseenter', this._triggerMouseenterHandler);}
      if (this._triggerMouseleaveHandler) {this.trigger.removeEventListener('mouseleave', this._triggerMouseleaveHandler);}
      if (this._triggerKeydownHandler) {this.trigger.removeEventListener('keydown', this._triggerKeydownHandler);}
    }

    if (this.menu) {
      this.menu.querySelectorAll('.ds-dropdown__item').forEach(item => {
        if (item._dropdownItemClickHandler) {
          item.removeEventListener('click', item._dropdownItemClickHandler);
        }
      });
      if (this._mouseenterHandler) {this.menu.removeEventListener('mouseenter', this._mouseenterHandler);}
      if (this._mouseleaveHandler) {this.menu.removeEventListener('mouseleave', this._mouseleaveHandler);}
    }

    if (this._keydownHandler) {document.removeEventListener('keydown', this._keydownHandler);}

    if (this._documentClickListener && this._documentClickListener.unsubscribe) {
      this._documentClickListener.unsubscribe();
    } else if (this._documentClickHandler) {
      document.removeEventListener('click', this._documentClickHandler);
    }

    if (this.appendToBody && this._originalParent) {
      this._restoreMenuFromBody();
    }

    this._documentClickHandler = null;
    this._documentClickListener = null;
    this._triggerClickHandler = null;
    this._itemClickHandler = null;
    this._keydownHandler = null;
    this._mouseenterHandler = null;
    this._mouseleaveHandler = null;
    this._triggerMouseenterHandler = null;
    this._triggerMouseleaveHandler = null;
    this._triggerKeydownHandler = null;
    this.element.__kupolaInitialized = false;
  }
}

function initDropdown(element, options) {
  const dropdown = new Dropdown(element, options);
  dropdown.init();
  element._kupolaDropdown = dropdown;
}

function initDropdowns(root = document) {
  root.querySelectorAll('.ds-dropdown').forEach(dropdown => {
    initDropdown(dropdown);
  });
}

function cleanupDropdown(dropdown) {
  if (dropdown._kupolaDropdown) {
    dropdown._kupolaDropdown.destroy();
    dropdown._kupolaDropdown = null;
  }
}

function cleanupAllDropdowns() {
  document.querySelectorAll('.ds-dropdown').forEach(dropdown => {
    cleanupDropdown(dropdown);
  });
}

export { Dropdown, initDropdown, initDropdowns, cleanupDropdown, cleanupAllDropdowns };

kupolaInitializer.register('dropdown', initDropdown, cleanupDropdown);
