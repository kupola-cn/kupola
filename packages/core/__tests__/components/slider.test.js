// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Unit tests for the Slider component.
 * @jest-environment jsdom
 */

import { resetScheduler } from '../../src/index.js';
import { Slider } from '../../src/components/slider.js';

afterEach(() => {
  document.body.innerHTML = '';
  resetScheduler();
});

// ─── Basic rendering ─────────────────────────────────────────────────────────

describe('Slider rendering', () => {
  test('renders a slider element', () => {
    const view = Slider();
    document.body.appendChild(view.element);

    const slider = document.body.querySelector('.ds-slider');
    expect(slider).not.toBeNull();
  });

  test('renders track, fill, thumb, and range input', () => {
    const view = Slider();
    document.body.appendChild(view.element);

    expect(document.body.querySelector('.ds-slider__track')).not.toBeNull();
    expect(document.body.querySelector('.ds-slider__fill')).not.toBeNull();
    expect(document.body.querySelector('.ds-slider__thumb')).not.toBeNull();
    expect(document.body.querySelector('.ds-slider__input')).not.toBeNull();
  });

  test('renders label when provided', () => {
    const view = Slider({ label: 'Volume' });
    document.body.appendChild(view.element);

    const label = document.body.querySelector('.ds-slider__label');
    expect(label).not.toBeNull();
    expect(label.textContent).toBe('Volume');
  });

  test('does not render label when not provided', () => {
    const view = Slider();
    document.body.appendChild(view.element);

    const label = document.body.querySelector('.ds-slider__label');
    expect(label).toBeNull();
  });
});

// ─── Value ───────────────────────────────────────────────────────────────────

describe('Slider value', () => {
  test('sets initial value', () => {
    const view = Slider({ min: 0, max: 100, value: 50 });
    document.body.appendChild(view.element);

    expect(view.getValue()).toBe(50);
  });

  test('clamps value to min', () => {
    const view = Slider({ min: 0, max: 100, value: -10 });
    document.body.appendChild(view.element);

    expect(view.getValue()).toBe(0);
  });

  test('clamps value to max', () => {
    const view = Slider({ min: 0, max: 100, value: 200 });
    document.body.appendChild(view.element);

    expect(view.getValue()).toBe(100);
  });

  test('setValue updates value', () => {
    const view = Slider({ min: 0, max: 100 });
    document.body.appendChild(view.element);

    view.setValue(75);
    expect(view.getValue()).toBe(75);
  });

  test('setValue clamps to range', () => {
    const view = Slider({ min: 0, max: 100 });
    document.body.appendChild(view.element);

    view.setValue(150);
    expect(view.getValue()).toBe(100);
  });
});

// ─── UI update ───────────────────────────────────────────────────────────────

describe('Slider UI', () => {
  test('fill width reflects value percentage', () => {
    const view = Slider({ min: 0, max: 100, value: 50 });
    document.body.appendChild(view.element);

    const fill = document.body.querySelector('.ds-slider__fill');
    expect(fill.style.width).toBe('50%');
  });

  test('thumb position reflects value percentage', () => {
    const view = Slider({ min: 0, max: 100, value: 75 });
    document.body.appendChild(view.element);

    const thumb = document.body.querySelector('.ds-slider__thumb');
    expect(thumb.style.left).toBe('75%');
  });

  test('value display shows current value', () => {
    const view = Slider({ min: 0, max: 100, value: 42, label: 'Vol' });
    document.body.appendChild(view.element);

    const valueEl = document.body.querySelector('.ds-slider__value');
    expect(valueEl.textContent).toBe('42');
  });
});

// ─── onChange ────────────────────────────────────────────────────────────────

describe('Slider onChange', () => {
  test('onChange fires on input event', () => {
    const onChange = jest.fn();
    const view = Slider({ min: 0, max: 100, onChange });
    document.body.appendChild(view.element);

    const input = document.body.querySelector('.ds-slider__input');
    input.value = '60';
    input.dispatchEvent(new Event('input'));

    expect(onChange).toHaveBeenCalledWith(60);
  });

  test('onChange fires on setValue', () => {
    const onChange = jest.fn();
    const view = Slider({ min: 0, max: 100, onChange });
    document.body.appendChild(view.element);

    view.setValue(80);
    expect(onChange).toHaveBeenCalledWith(80);
  });
});

// ─── Disabled ────────────────────────────────────────────────────────────────

describe('Slider disabled', () => {
  test('disabled state is applied to input', () => {
    const view = Slider({ disabled: true });
    document.body.appendChild(view.element);

    const input = document.body.querySelector('.ds-slider__input');
    expect(input.disabled).toBe(true);
  });
});

// ─── Destroy ─────────────────────────────────────────────────────────────────

describe('Slider destroy', () => {
  test('destroy() cleans up event listeners', () => {
    const onChange = jest.fn();
    const view = Slider({ onChange });
    document.body.appendChild(view.element);

    view.destroy();

    const input = document.body.querySelector('.ds-slider__input');
    if (input) {
      input.value = '50';
      input.dispatchEvent(new Event('input'));
      expect(onChange).not.toHaveBeenCalled();
    }
  });
});
