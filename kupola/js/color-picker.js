class ColorPicker {
  constructor(element) {
    this.element = element;
    this.trigger = element.querySelector('.ds-color-picker__trigger');
    this.panel = element.querySelector('.ds-color-picker__panel');
    this.valueSpan = element.querySelector('.ds-color-picker__value');
    this.customInput = element.querySelector('.ds-color-picker__input');
    this.scope = `colorpicker-${Math.random().toString(36).substr(2, 9)}`;
    
    this._triggerClickHandler = null;
    this._documentClickHandler = null;
    this._documentClickListener = null;
    this._colorClickHandler = null;
    this._inputInputHandler = null;
  }

  init() {
    if (!this.trigger || !this.panel) return;
    if (this.element.__kupolaInitialized) return;

    this._triggerClickHandler = (e) => {
      e.stopPropagation();
      this.togglePanel();
    };

    this._colorClickHandler = (e) => {
      const colorBtn = e.currentTarget;
      const color = colorBtn.getAttribute('data-color');
      this.updateColor(color);
      this.hidePanel();
    };

    this._inputInputHandler = (e) => {
      this.updateColor(e.target.value);
    };

    this._documentClickHandler = (e) => {
      if (!this.element.contains(e.target)) {
        this.hidePanel();
      }
    };

    this.trigger.addEventListener('click', this._triggerClickHandler);

    this.panel.querySelectorAll('.ds-color-picker__color').forEach(colorBtn => {
      colorBtn.addEventListener('click', this._colorClickHandler);
      colorBtn._colorPickerColorHandler = this._colorClickHandler;
    });

    if (this.customInput) {
      this.customInput.addEventListener('input', this._inputInputHandler);
      this.customInput._colorPickerInputHandler = this._inputInputHandler;
    }

    if (window.globalEvents) {
      this._documentClickListener = window.globalEvents.on(document, 'click', this._documentClickHandler, { scope: this.scope });
    } else {
      document.addEventListener('click', this._documentClickHandler);
    }

    this.element.__kupolaInitialized = true;
  }

  togglePanel() {
    this.panel.classList.toggle('is-visible');
  }

  hidePanel() {
    this.panel.classList.remove('is-visible');
  }

  updateColor(color) {
    this.trigger.style.backgroundColor = color;
    if (this.valueSpan) {
      this.valueSpan.textContent = color.toUpperCase();
    }
    if (this.customInput) {
      this.customInput.value = color;
    }
    this.element.dispatchEvent(new CustomEvent('colorchange', { detail: { color } }));
  }

  destroy() {
    if (!this.element.__kupolaInitialized) return;

    if (this.trigger && this._triggerClickHandler) {
      this.trigger.removeEventListener('click', this._triggerClickHandler);
    }

    if (this.panel) {
      this.panel.querySelectorAll('.ds-color-picker__color').forEach(colorBtn => {
        if (colorBtn._colorPickerColorHandler) {
          colorBtn.removeEventListener('click', colorBtn._colorPickerColorHandler);
        }
      });
    }

    if (this.customInput && this._inputInputHandler) {
      this.customInput.removeEventListener('input', this._inputInputHandler);
    }

    if (this._documentClickListener && this._documentClickListener.unsubscribe) {
      this._documentClickListener.unsubscribe();
    } else if (this._documentClickHandler) {
      document.removeEventListener('click', this._documentClickHandler);
    }

    this._documentClickHandler = null;
    this._documentClickListener = null;
    this._triggerClickHandler = null;
    this._colorClickHandler = null;
    this._inputInputHandler = null;
    this.element.__kupolaInitialized = false;
  }
}

function initColorPicker(element) {
  const picker = new ColorPicker(element);
  picker.init();
  element._kupolaColorPicker = picker;
}

function initColorPickers(root = document) {
  root.querySelectorAll('.ds-color-picker').forEach(picker => {
    initColorPicker(picker);
  });
}

function cleanupColorPicker(picker) {
  if (picker._kupolaColorPicker) {
    picker._kupolaColorPicker.destroy();
    picker._kupolaColorPicker = null;
  }
}

function cleanupAllColorPickers() {
  document.querySelectorAll('.ds-color-picker').forEach(picker => {
    cleanupColorPicker(picker);
  });
}

if (window.kupolaInitializer) {
  window.kupolaInitializer.register('color-picker', initColorPicker, cleanupColorPicker);
}