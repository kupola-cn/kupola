class Slider {
    constructor(element) {
        this.element = element;
        this.track = element.querySelector('.ds-slider__track');
        this.fill = element.querySelector('.ds-slider__fill');
        this.input = element.querySelector('.ds-slider__input');
        this.valueEl = element.querySelector('.ds-slider__value');

        if (!this.track || !this.fill || !this.input) {
            throw new Error('Slider: Missing required elements');
        }

        this._bindEvents();
        this.updateSlider();
    }

    _bindEvents() {
        this.updateSlider = () => {
            const value = this.input.value;
            const min = this.input.min || 0;
            const max = this.input.max || 100;
            const percentage = ((value - min) / (max - min)) * 100;

            this.fill.style.width = `${percentage}%`;
            if (this.valueEl) {
                this.valueEl.textContent = value;
            }
            this.element.setAttribute('aria-valuenow', value);
        };

        this.input.addEventListener('input', this.updateSlider);
        this.input.addEventListener('change', this.updateSlider);

        this._listeners = [
            { el: this.input, event: 'input', handler: this.updateSlider },
            { el: this.input, event: 'change', handler: this.updateSlider }
        ];
    }

    destroy() {
        this._listeners?.forEach(({ el, event, handler }) => {
            el.removeEventListener(event, handler);
        });
        this._listeners = null;
        this.track = null;
        this.fill = null;
        this.input = null;
        this.valueEl = null;
        this.element = null;
    }

    setValue(value) {
        if (this.input) {
            this.input.value = value;
            this.updateSlider();
        }
    }

    getValue() {
        return this.input?.value;
    }
}

function initSlider(element) {
    if (element.__kupolaInitialized) return;

    try {
        const slider = new Slider(element);
        element.__kupolaInstance = slider;
        element.__kupolaInitialized = true;
    } catch (error) {
        console.error('[Slider] Error initializing:', error);
    }
}

function cleanupSlider(element) {
    if (!element.__kupolaInitialized || !element.__kupolaInstance) return;

    const slider = element.__kupolaInstance;
    slider.destroy();

    element.__kupolaInstance = null;
    element.__kupolaInitialized = false;
}

function initSliders() {
    document.querySelectorAll('.ds-slider').forEach(slider => {
        initSlider(slider);
    });
}

if (window.kupolaInitializer) {
    window.kupolaInitializer.register('slider', initSlider, cleanupSlider);
}