import { kupolaInitializer } from './initializer.js';

class Slider {
    constructor(element, options = {}) {
        this.element = element;
        this.track = element.querySelector('.ds-slider__track');
        this.fill = element.querySelector('.ds-slider__fill');
        this.input = element.querySelector('.ds-slider__input');
        this.valueEl = element.querySelector('.ds-slider__value');

        // Options
        this.range = options.range || element.hasAttribute('data-slider-range');
        this.vertical = options.vertical || element.hasAttribute('data-slider-vertical');
        this.disabled = options.disabled || element.hasAttribute('data-slider-disabled');
        this.showTooltip = options.showTooltip !== false;
        this.showMarks = options.marks || element.hasAttribute('data-slider-marks');
        this.markStep = options.markStep || parseInt(element.getAttribute('data-slider-mark-step')) || 10;
        this.tooltipFormat = options.tooltipFormat || ((v) => v);
        this.onChange = options.onChange || null;
        this.onInput = options.onInput || null;

        // Range mode
        this.inputEnd = element.querySelector('.ds-slider__input--end');
        this.fillEnd = null;
        this.thumbStart = null;
        this.thumbEnd = null;
        this.tooltipStart = null;
        this.tooltipEnd = null;
        this.marksEl = null;

        this._listeners = [];
        this._isDragging = false;
        this._activeThumb = null;

        if (!this.track || !this.fill) {
            throw new Error('Slider: Missing required elements');
        }

        this._build();
        this._bindEvents();
        this.updateSlider();
    }

    _build() {
        // Add vertical class
        if (this.vertical) {
            this.element.classList.add('ds-slider--vertical');
        }
        if (this.disabled) {
            this.element.classList.add('is-disabled');
        }

        // Create thumb elements for better interaction
        if (!this.element.querySelector('.ds-slider__thumb')) {
            this.thumbStart = document.createElement('div');
            this.thumbStart.className = 'ds-slider__thumb ds-slider__thumb--start';
            this.thumbStart.setAttribute('role', 'slider');
            this.thumbStart.setAttribute('tabindex', this.disabled ? '-1' : '0');
            this.track.appendChild(this.thumbStart);

            // Tooltip
            if (this.showTooltip) {
                this.tooltipStart = document.createElement('div');
                this.tooltipStart.className = 'ds-slider__tooltip';
                this.thumbStart.appendChild(this.tooltipStart);
            }
        } else {
            this.thumbStart = this.element.querySelector('.ds-slider__thumb--start');
        }

        // Range mode: second thumb
        if (this.range) {
            this.element.classList.add('ds-slider--range');
            
            if (!this.element.querySelector('.ds-slider__thumb--end')) {
                this.thumbEnd = document.createElement('div');
                this.thumbEnd.className = 'ds-slider__thumb ds-slider__thumb--end';
                this.thumbEnd.setAttribute('role', 'slider');
                this.thumbEnd.setAttribute('tabindex', this.disabled ? '-1' : '0');
                this.track.appendChild(this.thumbEnd);

                if (this.showTooltip) {
                    this.tooltipEnd = document.createElement('div');
                    this.tooltipEnd.className = 'ds-slider__tooltip';
                    this.thumbEnd.appendChild(this.tooltipEnd);
                }
            } else {
                this.thumbEnd = this.element.querySelector('.ds-slider__thumb--end');
            }
        }

        // Marks
        if (this.showMarks) {
            this._renderMarks();
        }
    }

    _renderMarks() {
        if (this.marksEl) this.marksEl.remove();
        
        this.marksEl = document.createElement('div');
        this.marksEl.className = 'ds-slider__marks';
        
        const min = parseFloat(this.input?.min || 0);
        const max = parseFloat(this.input?.max || 100);
        
        for (let v = min; v <= max; v += this.markStep) {
            const mark = document.createElement('div');
            mark.className = 'ds-slider__mark';
            const pct = ((v - min) / (max - min)) * 100;
            
            if (this.vertical) {
                mark.style.bottom = pct + '%';
            } else {
                mark.style.left = pct + '%';
            }
            
            const label = document.createElement('span');
            label.className = 'ds-slider__mark-label';
            label.textContent = v;
            mark.appendChild(label);
            
            this.marksEl.appendChild(mark);
        }
        
        this.element.appendChild(this.marksEl);
    }

    _bindEvents() {
        // Native input events (backward compat)
        if (this.input) {
            const inputHandler = () => this.updateSlider();
            const changeHandler = () => this.updateSlider();
            this.input.addEventListener('input', inputHandler);
            this.input.addEventListener('change', changeHandler);
            this._listeners.push(
                { el: this.input, event: 'input', handler: inputHandler },
                { el: this.input, event: 'change', handler: changeHandler }
            );
        }

        if (this.inputEnd) {
            const inputHandler = () => this.updateSlider();
            this.inputEnd.addEventListener('input', inputHandler);
            this._listeners.push({ el: this.inputEnd, event: 'input', handler: inputHandler });
        }

        // Custom thumb drag
        if (this.thumbStart) {
            this._bindThumbDrag(this.thumbStart, 'start');
        }
        if (this.thumbEnd) {
            this._bindThumbDrag(this.thumbEnd, 'end');
        }

        // Track click
        if (this.track) {
            const trackClick = (e) => {
                if (this.disabled) return;
                this._handleTrackClick(e);
            };
            this.track.addEventListener('click', trackClick);
            this._listeners.push({ el: this.track, event: 'click', handler: trackClick });
        }

        // Keyboard
        if (this.thumbStart) {
            const keyHandler = (e) => this._handleKeyboard(e, 'start');
            this.thumbStart.addEventListener('keydown', keyHandler);
            this._listeners.push({ el: this.thumbStart, event: 'keydown', handler: keyHandler });
        }
        if (this.thumbEnd) {
            const keyHandler = (e) => this._handleKeyboard(e, 'end');
            this.thumbEnd.addEventListener('keydown', keyHandler);
            this._listeners.push({ el: this.thumbEnd, event: 'keydown', handler: keyHandler });
        }
    }

    _bindThumbDrag(thumb, which) {
        const startDrag = (e) => {
            if (this.disabled) return;
            e.preventDefault();
            this._isDragging = true;
            this._activeThumb = which;
            this.element.classList.add('is-dragging');
            document.addEventListener('mousemove', onDrag);
            document.addEventListener('mouseup', stopDrag);
            document.addEventListener('touchmove', onDrag, { passive: false });
            document.addEventListener('touchend', stopDrag);
        };

        const onDrag = (e) => {
            if (!this._isDragging) return;
            e.preventDefault();
            
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            
            const rect = this.track.getBoundingClientRect();
            let percentage;
            
            if (this.vertical) {
                percentage = 1 - (clientY - rect.top) / rect.height;
            } else {
                percentage = (clientX - rect.left) / rect.width;
            }
            
            percentage = Math.max(0, Math.min(1, percentage));
            
            const min = parseFloat(this.input?.min || 0);
            const max = parseFloat(this.input?.max || 100);
            const step = parseFloat(this.input?.step || 1);
            let value = min + percentage * (max - min);
            value = Math.round(value / step) * step;
            value = Math.max(min, Math.min(max, value));
            
            if (which === 'start' && this.range && this.inputEnd) {
                const endVal = parseFloat(this.inputEnd.value);
                if (value > endVal) value = endVal;
            }
            if (which === 'end' && this.range && this.input) {
                const startVal = parseFloat(this.input.value);
                if (value < startVal) value = startVal;
            }
            
            if (which === 'start' && this.input) {
                this.input.value = value;
            } else if (which === 'end' && this.inputEnd) {
                this.inputEnd.value = value;
            }
            
            this.updateSlider();
            
            if (this.onInput) {
                this.onInput({ value: this.getValue(), percentage });
            }
        };

        const stopDrag = () => {
            this._isDragging = false;
            this._activeThumb = null;
            this.element.classList.remove('is-dragging');
            document.removeEventListener('mousemove', onDrag);
            document.removeEventListener('mouseup', stopDrag);
            document.removeEventListener('touchmove', onDrag);
            document.removeEventListener('touchend', stopDrag);
            
            if (this.onChange) {
                this.onChange({ value: this.getValue() });
            }
            this.element.dispatchEvent(new CustomEvent('kupola:slider-change', {
                detail: { value: this.getValue() },
                bubbles: true
            }));
        };

        thumb.addEventListener('mousedown', startDrag);
        thumb.addEventListener('touchstart', startDrag, { passive: false });
        this._listeners.push(
            { el: thumb, event: 'mousedown', handler: startDrag },
            { el: thumb, event: 'touchstart', handler: startDrag }
        );
    }

    _handleTrackClick(e) {
        if (e.target.classList.contains('ds-slider__thumb')) return;
        
        const rect = this.track.getBoundingClientRect();
        const clientX = e.clientX;
        const clientY = e.clientY;
        
        let percentage;
        if (this.vertical) {
            percentage = 1 - (clientY - rect.top) / rect.height;
        } else {
            percentage = (clientX - rect.left) / rect.width;
        }
        
        percentage = Math.max(0, Math.min(1, percentage));
        
        const min = parseFloat(this.input?.min || 0);
        const max = parseFloat(this.input?.max || 100);
        const step = parseFloat(this.input?.step || 1);
        let value = min + percentage * (max - min);
        value = Math.round(value / step) * step;
        
        if (this.range) {
            const startVal = parseFloat(this.input?.value || 0);
            const endVal = parseFloat(this.inputEnd?.value || 0);
            const distToStart = Math.abs(value - startVal);
            const distToEnd = Math.abs(value - endVal);
            
            if (distToStart <= distToEnd) {
                if (this.input) this.input.value = Math.min(value, endVal);
            } else {
                if (this.inputEnd) this.inputEnd.value = Math.max(value, startVal);
            }
        } else {
            if (this.input) this.input.value = value;
        }
        
        this.updateSlider();
    }

    _handleKeyboard(e, which) {
        if (this.disabled) return;
        
        const inputEl = which === 'start' ? this.input : this.inputEnd;
        if (!inputEl) return;
        
        const step = parseFloat(inputEl.step || 1);
        const min = parseFloat(inputEl.min || 0);
        const max = parseFloat(inputEl.max || 100);
        let value = parseFloat(inputEl.value);
        
        switch (e.key) {
            case 'ArrowRight':
            case 'ArrowUp':
                e.preventDefault();
                value = Math.min(max, value + step);
                break;
            case 'ArrowLeft':
            case 'ArrowDown':
                e.preventDefault();
                value = Math.max(min, value - step);
                break;
            case 'Home':
                e.preventDefault();
                value = min;
                break;
            case 'End':
                e.preventDefault();
                value = max;
                break;
            default:
                return;
        }
        
        inputEl.value = value;
        this.updateSlider();
        
        if (this.onChange) {
            this.onChange({ value: this.getValue() });
        }
    }

    updateSlider() {
        const min = parseFloat(this.input?.min || 0);
        const max = parseFloat(this.input?.max || 100);

        if (this.range && this.inputEnd) {
            const startVal = parseFloat(this.input?.value || 0);
            const endVal = parseFloat(this.inputEnd?.value || 0);
            const startPct = ((startVal - min) / (max - min)) * 100;
            const endPct = ((endVal - min) / (max - min)) * 100;
            
            if (this.vertical) {
                this.fill.style.bottom = startPct + '%';
                this.fill.style.height = (endPct - startPct) + '%';
            } else {
                this.fill.style.left = startPct + '%';
                this.fill.style.width = (endPct - startPct) + '%';
            }
            
            if (this.thumbStart) {
                if (this.vertical) {
                    this.thumbStart.style.bottom = startPct + '%';
                } else {
                    this.thumbStart.style.left = startPct + '%';
                }
            }
            if (this.thumbEnd) {
                if (this.vertical) {
                    this.thumbEnd.style.bottom = endPct + '%';
                } else {
                    this.thumbEnd.style.left = endPct + '%';
                }
            }
            
            if (this.tooltipStart) {
                this.tooltipStart.textContent = this.tooltipFormat(startVal);
            }
            if (this.tooltipEnd) {
                this.tooltipEnd.textContent = this.tooltipFormat(endVal);
            }
            
            if (this.valueEl) {
                this.valueEl.textContent = `${this.tooltipFormat(startVal)} - ${this.tooltipFormat(endVal)}`;
            }
            
            // ARIA
            if (this.thumbStart) this.thumbStart.setAttribute('aria-valuenow', startVal);
            if (this.thumbEnd) this.thumbEnd.setAttribute('aria-valuenow', endVal);
        } else {
            const value = this.input?.value || 0;
            const percentage = ((value - min) / (max - min)) * 100;

            if (this.vertical) {
                this.fill.style.height = `${percentage}%`;
            } else {
                this.fill.style.width = `${percentage}%`;
            }
            
            if (this.thumbStart) {
                if (this.vertical) {
                    this.thumbStart.style.bottom = percentage + '%';
                } else {
                    this.thumbStart.style.left = percentage + '%';
                }
            }
            
            if (this.tooltipStart) {
                this.tooltipStart.textContent = this.tooltipFormat(parseFloat(value));
            }
            
            if (this.valueEl) {
                this.valueEl.textContent = this.tooltipFormat(parseFloat(value));
            }
            
            if (this.thumbStart) {
                this.thumbStart.setAttribute('aria-valuenow', value);
            }
            this.element.setAttribute('aria-valuenow', value);
        }
    }

    destroy() {
        this._listeners?.forEach(({ el, event, handler }) => {
            el.removeEventListener(event, handler);
        });
        this._listeners = null;
        if (this.marksEl) this.marksEl.remove();
        this.track = null;
        this.fill = null;
        this.input = null;
        this.inputEnd = null;
        this.valueEl = null;
        this.thumbStart = null;
        this.thumbEnd = null;
        this.tooltipStart = null;
        this.tooltipEnd = null;
        this.marksEl = null;
        this.element = null;
    }

    setValue(value, endValue) {
        if (this.input) {
            this.input.value = value;
        }
        if (endValue !== undefined && this.inputEnd) {
            this.inputEnd.value = endValue;
        }
        this.updateSlider();
    }

    getValue() {
        if (this.range && this.inputEnd) {
            return [parseFloat(this.input?.value || 0), parseFloat(this.inputEnd?.value || 0)];
        }
        return parseFloat(this.input?.value || 0);
    }

    enable() {
        this.disabled = false;
        this.element.classList.remove('is-disabled');
    }

    disable() {
        this.disabled = true;
        this.element.classList.add('is-disabled');
    }
}

function initSlider(element, options) {
    if (element.__kupolaInitialized) return;

    try {
        const slider = new Slider(element, options);
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

export { Slider, initSlider, initSliders, cleanupSlider };

kupolaInitializer.register('slider', initSlider, cleanupSlider);
