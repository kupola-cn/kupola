class Select {
  constructor(element) {
    this.element = element;
    this.trigger = element.querySelector('.ds-select__trigger');
    this.valueEl = element.querySelector('.ds-select__value') || element.querySelector('.ds-select__trigger span');
    this.optionsEl = element.querySelector('.ds-select__options') || element.querySelector('.ds-select__menu');
    this.nativeSelect = element.querySelector('select');
    this.icon = element.querySelector('.ds-select__icon');
    this.scope = `select-${Math.random().toString(36).substr(2, 9)}`;
    
    this._triggerClickHandler = null;
    this._documentClickHandler = null;
    this._documentClickListener = null;
    this._optionClickHandler = null;
  }

  init() {
    if (!this.trigger || !this.optionsEl) return;
    if (this.element.__kupolaInitialized) return;

    this._optionClickHandler = (e) => {
      const option = e.currentTarget;
      const value = option.getAttribute('data-value');
      if (this.nativeSelect) {
        this.nativeSelect.value = value;
      }
      this.optionsEl.querySelectorAll('.ds-select__option, .ds-select__item').forEach(o => o.classList.remove('is-selected'));
      option.classList.add('is-selected');
      this.updateValue(option.textContent.trim());
      this.hideOptions();
      if (this.nativeSelect) {
        this.nativeSelect.dispatchEvent(new Event('change'));
      }
    };

    this.optionsEl.querySelectorAll('.ds-select__option, .ds-select__item').forEach(option => {
      option.addEventListener('click', this._optionClickHandler);
      option._selectOptionClickHandler = this._optionClickHandler;
    });

    this._triggerClickHandler = (e) => {
      e.stopPropagation();
      this.showOptions();
    };

    this.trigger.addEventListener('click', this._triggerClickHandler);

    this._documentClickHandler = (e) => {
      if (!this.element.contains(e.target)) {
        this.hideOptions();
      }
    };

    if (window.globalEvents) {
      this._documentClickListener = window.globalEvents.on(document, 'click', this._documentClickHandler, { scope: this.scope });
    } else {
      document.addEventListener('click', this._documentClickHandler);
    }

    this.optionsEl.style.display = 'none';
    this.element.__kupolaInitialized = true;
  }

  updateValue(text) {
    if (this.valueEl) {
      this.valueEl.textContent = text || this.valueEl.textContent;
    }
  }

  showOptions() {
    const isOpen = this.optionsEl.style.display === 'block';
    this.optionsEl.style.display = isOpen ? 'none' : 'block';
    if (this.icon) {
      this.icon.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
    }
    this.element.classList.toggle('is-open', !isOpen);
  }

  hideOptions() {
    this.optionsEl.style.display = 'none';
    if (this.icon) {
      this.icon.style.transform = 'rotate(0deg)';
    }
    this.element.classList.remove('is-open');
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

    if (this._documentClickListener && this._documentClickListener.unsubscribe) {
      this._documentClickListener.unsubscribe();
    } else if (this._documentClickHandler) {
      document.removeEventListener('click', this._documentClickHandler);
    }

    this._documentClickHandler = null;
    this._documentClickListener = null;
    this._triggerClickHandler = null;
    this._optionClickHandler = null;
    this.element.__kupolaInitialized = false;
  }
}

function initSelect(element) {
  const select = new Select(element);
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

if (window.kupolaInitializer) {
  window.kupolaInitializer.register('select', initSelect, cleanupSelect);
}