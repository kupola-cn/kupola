class Dropdown {
  constructor(element) {
    this.element = element;
    this.trigger = element.querySelector('.ds-dropdown__trigger');
    this.menu = element.querySelector('.ds-dropdown__menu');
    this.triggerText = this.trigger ? this.trigger.querySelector('span') : null;
    this.scope = `dropdown-${Math.random().toString(36).substr(2, 9)}`;
    
    this._triggerClickHandler = null;
    this._documentClickHandler = null;
    this._documentClickListener = null;
    this._itemClickHandler = null;
  }

  init() {
    if (!this.trigger || !this.menu) return;
    if (this.element.__kupolaInitialized) return;

    this._itemClickHandler = (e) => {
      const item = e.currentTarget;
      if (this.triggerText) {
        this.triggerText.textContent = item.textContent.trim();
      }
      this.hideMenu();
    };

    this.menu.querySelectorAll('.ds-dropdown__item').forEach(item => {
      item.addEventListener('click', this._itemClickHandler);
      item._dropdownItemClickHandler = this._itemClickHandler;
    });

    this._triggerClickHandler = (e) => {
      e.stopPropagation();
      this.toggleMenu();
    };

    this.trigger.addEventListener('click', this._triggerClickHandler);

    this._documentClickHandler = (e) => {
      if (!this.element.contains(e.target)) {
        this.hideMenu();
      }
    };

    if (window.globalEvents) {
      this._documentClickListener = window.globalEvents.on(document, 'click', this._documentClickHandler, { scope: this.scope });
    } else {
      document.addEventListener('click', this._documentClickHandler);
    }

    this.menu.style.display = 'none';
    this.element.__kupolaInitialized = true;
  }

  toggleMenu() {
    const isOpen = this.menu.style.display === 'block';
    this.menu.style.display = isOpen ? 'none' : 'block';
    this.element.classList.toggle('is-open', !isOpen);
  }

  hideMenu() {
    this.menu.style.display = 'none';
    this.element.classList.remove('is-open');
  }

  destroy() {
    if (!this.element.__kupolaInitialized) return;

    if (this.trigger && this._triggerClickHandler) {
      this.trigger.removeEventListener('click', this._triggerClickHandler);
    }

    if (this.menu) {
      this.menu.querySelectorAll('.ds-dropdown__item').forEach(item => {
        if (item._dropdownItemClickHandler) {
          item.removeEventListener('click', item._dropdownItemClickHandler);
        }
      });
    }

    if (this._documentClickListener && this._documentClickListener.unsubscribe) {
      this._documentClickListener.unsubscribe();
    } else if (this._documentClickHandler) {
      document.removeEventListener('click', this._documentClickHandler);
    }

    this._documentClickHandler = null;
    this._documentClickListener = null;
    this._triggerClickHandler = null;
    this._itemClickHandler = null;
    this.element.__kupolaInitialized = false;
  }
}

function initDropdown(element) {
  const dropdown = new Dropdown(element);
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

if (window.kupolaInitializer) {
  window.kupolaInitializer.register('dropdown', initDropdown, cleanupDropdown);
}