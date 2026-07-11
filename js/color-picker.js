class ColorPicker {
    constructor(element, options = {}) {
        this.element = element;
        this.trigger = element.querySelector('.ds-color-picker__trigger');
        this.panel = element.querySelector('.ds-color-picker__panel');
        this.valueSpan = element.querySelector('.ds-color-picker__value');
        this.customInput = element.querySelector('.ds-color-picker__input');
        this.scope = `colorpicker-${Math.random().toString(36).substr(2, 9)}`;
        
        this.options = options;
        this.value = options.value || '#007bff';
        this.showAlpha = options.showAlpha !== false;
        this.mode = options.mode || 'hex'; // hex | rgb | hsl
        this.previousColors = options.previousColors || this._getStoredColors();
        this.previousColorsLimit = options.previousColorsLimit || 12;
        
        this._triggerClickHandler = null;
        this._documentClickHandler = null;
        this._documentClickListener = null;
        this._colorClickHandler = null;
        this._inputInputHandler = null;
        this._alphaChangeHandler = null;
        this._modeChangeHandler = null;
        this._hueChangeHandler = null;
        this._saturationChangeHandler = null;
        this._valueChangeHandler = null;
        
        this.hue = 210;
        this.saturation = 100;
        this.brightness = 50;
        this.alpha = 100;
        
        this._colorStringToHSB(this.value);
    }

    _getStoredColors() {
        try {
            const stored = localStorage.getItem('kupola-color-picker-previous');
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    }

    _storeColors() {
        try {
            localStorage.setItem('kupola-color-picker-previous', JSON.stringify(this.previousColors));
        } catch {}
    }

    _addPreviousColor(color) {
        const index = this.previousColors.indexOf(color);
        if (index !== -1) {
            this.previousColors.splice(index, 1);
        }
        this.previousColors.unshift(color);
        this.previousColors = this.previousColors.slice(0, this.previousColorsLimit);
        this._storeColors();
        this._renderPreviousColors();
    }

    _colorStringToHSB(color) {
        const hex = color.replace(/^#/, '');
        const r = parseInt(hex.substring(0, 2), 16) / 255;
        const g = parseInt(hex.substring(2, 4), 16) / 255;
        const b = parseInt(hex.substring(4, 6), 16) / 255;
        const a = hex.length === 8 ? parseInt(hex.substring(6, 8), 16) / 255 : 1;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h = 0, s = 0, v = max;

        const d = max - min;
        s = max === 0 ? 0 : d / max;

        if (max !== min) {
            switch (max) {
                case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
                case g: h = ((b - r) / d + 2) / 6; break;
                case b: h = ((r - g) / d + 4) / 6; break;
            }
        }

        this.hue = Math.round(h * 360);
        this.saturation = Math.round(s * 100);
        this.brightness = Math.round(v * 100);
        this.alpha = Math.round(a * 100);
    }

    _HSBToColorString(h, s, b, a = 1) {
        s /= 100;
        b /= 100;
        a /= 100;

        const k = n => (n + h / 60) % 6;
        const f = n => b * (1 - s * Math.max(0, Math.min(k(n), 4 - k(n), 1)));

        const r = Math.round(f(5) * 255);
        const g = Math.round(f(3) * 255);
        const bVal = Math.round(f(1) * 255);

        if (this.mode === 'rgb') {
            if (a < 1) {
                return `rgba(${r}, ${g}, ${bVal}, ${a.toFixed(2)})`;
            }
            return `rgb(${r}, ${g}, ${bVal})`;
        }

        if (this.mode === 'hsl') {
            if (a < 1) {
                return `hsla(${h}, ${Math.round(s * 100)}%, ${Math.round(b * 100)}%, ${a.toFixed(2)})`;
            }
            return `hsl(${h}, ${Math.round(s * 100)}%, ${Math.round(b * 100)}%)`;
        }

        const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${bVal.toString(16).padStart(2, '0')}`;
        if (a < 1) {
            return hex + Math.round(a * 255).toString(16).padStart(2, '0');
        }
        return hex;
    }

    _renderPreviousColors() {
        const container = this.panel.querySelector('.ds-color-picker__previous');
        if (!container) return;
        
        container.innerHTML = '';
        this.previousColors.forEach(color => {
            const btn = document.createElement('button');
            btn.className = 'ds-color-picker__color';
            btn.style.backgroundColor = color;
            btn.setAttribute('data-color', color);
            btn.addEventListener('click', this._colorClickHandler);
            container.appendChild(btn);
        });
    }

    _renderColorPanel() {
        const hueSlider = this.panel.querySelector('.ds-color-picker__hue');
        const svArea = this.panel.querySelector('.ds-color-picker__sv');
        const alphaSlider = this.panel.querySelector('.ds-color-picker__alpha');
        
        if (hueSlider) {
            hueSlider.value = this.hue;
            hueSlider.style.background = `linear-gradient(to right, hsl(0,100%,50%), hsl(60,100%,50%), hsl(120,100%,50%), hsl(180,100%,50%), hsl(240,100%,50%), hsl(300,100%,50%), hsl(360,100%,50%))`;
        }
        
        if (svArea) {
            svArea.style.background = `hsl(${this.hue}, 100%, 50%)`;
        }
        
        if (alphaSlider && this.showAlpha) {
            alphaSlider.value = this.alpha;
            alphaSlider.style.background = `linear-gradient(to right, transparent, ${this._HSBToColorString(this.hue, this.saturation, this.brightness, 1)})`;
        }
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
            const color = e.target.value;
            if (this._isValidColor(color)) {
                this.updateColor(color);
            }
        };

        this._alphaChangeHandler = (e) => {
            this.alpha = parseInt(e.target.value);
            this._updateFromHSB();
        };

        this._modeChangeHandler = (e) => {
            const btn = e.currentTarget;
            this.mode = btn.getAttribute('data-mode');
            this.panel.querySelectorAll('.ds-color-picker__mode-btn').forEach(b => b.classList.remove('is-active'));
            btn.classList.add('is-active');
            this._updateDisplay();
        };

        this._hueChangeHandler = (e) => {
            this.hue = parseInt(e.target.value);
            this._renderColorPanel();
            this._updateFromHSB();
        };

        this._saturationChangeHandler = (e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            this.saturation = Math.round((x / rect.width) * 100);
            this.brightness = Math.round((1 - y / rect.height) * 100);
            this._updateFromHSB();
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

        const hueSlider = this.panel.querySelector('.ds-color-picker__hue');
        if (hueSlider) {
            hueSlider.addEventListener('input', this._hueChangeHandler);
        }

        const svArea = this.panel.querySelector('.ds-color-picker__sv');
        if (svArea) {
            svArea.addEventListener('click', this._saturationChangeHandler);
            svArea.addEventListener('mousemove', (e) => {
                if (e.buttons === 1) {
                    this._saturationChangeHandler(e);
                }
            });
        }

        const alphaSlider = this.panel.querySelector('.ds-color-picker__alpha');
        if (alphaSlider && this.showAlpha) {
            alphaSlider.addEventListener('input', this._alphaChangeHandler);
        }

        this.panel.querySelectorAll('.ds-color-picker__mode-btn').forEach(btn => {
            btn.addEventListener('click', this._modeChangeHandler);
            if (btn.getAttribute('data-mode') === this.mode) {
                btn.classList.add('is-active');
            }
        });

        if (window.globalEvents) {
            this._documentClickListener = window.globalEvents.on(document, 'click', this._documentClickHandler, { scope: this.scope });
        } else {
            document.addEventListener('click', this._documentClickHandler);
        }

        this._renderPreviousColors();
        this._renderColorPanel();
        this._updateDisplay();

        this.element.__kupolaInitialized = true;
    }

    _isValidColor(color) {
        const s = new Option().style;
        s.color = color;
        return s.color !== '';
    }

    _updateFromHSB() {
        const color = this._HSBToColorString(this.hue, this.saturation, this.brightness, this.alpha);
        this.value = color;
        this._updateDisplay();
        this._addPreviousColor(color);
        this.element.dispatchEvent(new CustomEvent('kupola:color-picker-change', { 
            detail: { 
                color: this.value,
                hsb: { h: this.hue, s: this.saturation, b: this.brightness, a: this.alpha },
                mode: this.mode
            } 
        }));
    }

    _updateDisplay() {
        this.trigger.style.backgroundColor = this.value;
        if (this.valueSpan) {
            this.valueSpan.textContent = this.value.toUpperCase();
        }
        if (this.customInput) {
            this.customInput.value = this.value;
        }
        this._renderColorPanel();
    }

    togglePanel() {
        this.panel.classList.toggle('is-visible');
    }

    hidePanel() {
        this.panel.classList.remove('is-visible');
    }

    showPanel() {
        this.panel.classList.add('is-visible');
    }

    updateColor(color) {
        if (!this._isValidColor(color)) return;
        
        this.value = color;
        this._colorStringToHSB(color);
        this._updateDisplay();
        this._addPreviousColor(color);
        
        this.element.dispatchEvent(new CustomEvent('kupola:color-picker-change', { 
            detail: { 
                color: this.value,
                hsb: { h: this.hue, s: this.saturation, b: this.brightness, a: this.alpha },
                mode: this.mode
            } 
        }));
    }

    setValue(color) {
        this.updateColor(color);
    }

    getValue() {
        return this.value;
    }

    setMode(mode) {
        if (mode === 'hex' || mode === 'rgb' || mode === 'hsl') {
            this.mode = mode;
            this._updateDisplay();
        }
    }

    getMode() {
        return this.mode;
    }

    setAlpha(alpha) {
        this.alpha = Math.max(0, Math.min(100, alpha));
        this._updateFromHSB();
    }

    getAlpha() {
        return this.alpha;
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

        const hueSlider = this.panel?.querySelector('.ds-color-picker__hue');
        if (hueSlider && this._hueChangeHandler) {
            hueSlider.removeEventListener('input', this._hueChangeHandler);
        }

        const svArea = this.panel?.querySelector('.ds-color-picker__sv');
        if (svArea && this._saturationChangeHandler) {
            svArea.removeEventListener('click', this._saturationChangeHandler);
            svArea.removeEventListener('mousemove', this._saturationChangeHandler);
        }

        const alphaSlider = this.panel?.querySelector('.ds-color-picker__alpha');
        if (alphaSlider && this._alphaChangeHandler) {
            alphaSlider.removeEventListener('input', this._alphaChangeHandler);
        }

        this.panel?.querySelectorAll('.ds-color-picker__mode-btn').forEach(btn => {
            btn.removeEventListener('click', this._modeChangeHandler);
        });

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
        this._alphaChangeHandler = null;
        this._modeChangeHandler = null;
        this._hueChangeHandler = null;
        this._saturationChangeHandler = null;
        this._valueChangeHandler = null;
        
        this.element.__kupolaInitialized = false;
    }
}

function initColorPicker(element, options) {
    const picker = new ColorPicker(element, options);
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

export { ColorPicker, initColorPicker, initColorPickers, cleanupColorPicker, cleanupAllColorPickers };

if (typeof window !== 'undefined') {
    window.ColorPicker = ColorPicker;
    window.initColorPicker = initColorPicker;
    window.initColorPickers = initColorPickers;
    window.cleanupColorPicker = cleanupColorPicker;
    window.cleanupAllColorPickers = cleanupAllColorPickers;
    
    if (window.kupolaInitializer) {
        window.kupolaInitializer.register('color-picker', initColorPicker, cleanupColorPicker);
    }
}