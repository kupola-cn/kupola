class NumberInput {
    constructor(element) {
        this.element = element;
        this.minusBtn = element.querySelector('.ds-number-input__btn--decrease');
        this.plusBtn = element.querySelector('.ds-number-input__btn--increase');
        this.inputEl = element.querySelector('.ds-number-input__input');
        this._listeners = [];

        if (!this.minusBtn || !this.plusBtn || !this.inputEl) {
            throw new Error('NumberInput: Missing required elements');
        }

        this.min = parseInt(this.inputEl.getAttribute('min')) || -Infinity;
        this.max = parseInt(this.inputEl.getAttribute('max')) || Infinity;
        this.step = parseInt(this.inputEl.getAttribute('step')) || 1;

        this.init();
    }

    init() {
        this.bindEvents();
        this.updateState();
    }

    bindEvents() {
        const minusHandler = () => this.updateValue(-this.step);
        const plusHandler = () => this.updateValue(this.step);
        const inputHandler = () => this.handleInput();

        this.minusBtn.addEventListener('click', minusHandler);
        this.plusBtn.addEventListener('click', plusHandler);
        this.inputEl.addEventListener('input', inputHandler);

        this._listeners.push(
            { el: this.minusBtn, event: 'click', handler: minusHandler },
            { el: this.plusBtn, event: 'click', handler: plusHandler },
            { el: this.inputEl, event: 'input', handler: inputHandler }
        );
    }

    updateValue(delta) {
        let value = parseInt(this.inputEl.value) || 0;
        value += delta;

        if (value < this.min) value = this.min;
        if (value > this.max) value = this.max;

        this.inputEl.value = value;
        this.inputEl.dispatchEvent(new Event('change'));
        this.updateState();
        this.dispatchChange();
    }

    handleInput() {
        let value = parseInt(this.inputEl.value);
        if (isNaN(value)) value = 0;
        if (value < this.min) value = this.min;
        if (value > this.max) value = this.max;
        this.inputEl.value = value;
        this.updateState();
        this.dispatchChange();
    }

    updateState() {
        const value = parseInt(this.inputEl.value) || 0;
        this.minusBtn.disabled = value <= this.min;
        this.plusBtn.disabled = value >= this.max;
    }

    setValue(value) {
        if (value < this.min) value = this.min;
        if (value > this.max) value = this.max;
        this.inputEl.value = value;
        this.updateState();
        this.dispatchChange();
    }

    getValue() {
        return parseInt(this.inputEl.value) || 0;
    }

    setRange(min, max) {
        this.min = min;
        this.max = max;
        this.updateState();
    }

    dispatchChange() {
        this.element.dispatchEvent(new CustomEvent('kupola:number-input-change', {
            detail: {
                value: this.getValue()
            }
        }));
    }

    destroy() {
        this._listeners.forEach(({ el, event, handler }) => {
            el.removeEventListener(event, handler);
        });
        this._listeners = null;
        this.minusBtn = null;
        this.plusBtn = null;
        this.inputEl = null;
        this.element = null;
    }
}

function initNumberInput(element) {
    if (element.__kupolaInitialized) return;

    try {
        const instance = new NumberInput(element);
        element.__kupolaInstance = instance;
        element.__kupolaInitialized = true;
    } catch (error) {
        console.error('[NumberInput] Error initializing:', error);
    }
}

function cleanupNumberInput(element) {
    if (!element.__kupolaInitialized || !element.__kupolaInstance) return;

    const instance = element.__kupolaInstance;
    instance.destroy();

    element.__kupolaInstance = null;
    element.__kupolaInitialized = false;
}

function initNumberInputs() {
    document.querySelectorAll('.ds-number-input').forEach(input => {
        initNumberInput(input);
    });
}

export { NumberInput, initNumberInputs, initNumberInput, cleanupNumberInput };

if (typeof window !== 'undefined') {
    window.NumberInput = NumberInput;
    window.initNumberInput = initNumberInput;
    window.cleanupNumberInput = cleanupNumberInput;
    window.initNumberInputs = initNumberInputs;
    
    if (window.kupolaInitializer) {
        window.kupolaInitializer.register('number-input', initNumberInput, cleanupNumberInput);
    }
}