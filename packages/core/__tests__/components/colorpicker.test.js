// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Unit tests for the ColorPicker component.
 * @jest-environment jsdom
 */

import { resetScheduler } from '../../src/index.js';
import { ColorPicker } from '../../src/components/colorpicker.js';

afterEach(() => {
  document.body.innerHTML = '';
  resetScheduler();
});

// ─── Basic rendering ─────────────────────────────────────────────────────────

describe('ColorPicker rendering', () => {
  test('renders a color-picker wrapper', () => {
    const view = ColorPicker();
    document.body.appendChild(view.element);

    expect(document.body.querySelector('.ds-color-picker')).not.toBeNull();
  });

  test('renders a trigger button', () => {
    const view = ColorPicker();
    document.body.appendChild(view.element);

    expect(document.body.querySelector('.ds-color-picker__trigger')).not.toBeNull();
  });

  test('renders a panel', () => {
    const view = ColorPicker();
    document.body.appendChild(view.element);

    expect(document.body.querySelector('.ds-color-picker__panel')).not.toBeNull();
  });

  test('panel is hidden by default', () => {
    const view = ColorPicker();
    document.body.appendChild(view.element);

    expect(document.body.querySelector('.ds-color-picker__panel').classList.contains('is-visible')).toBe(false);
  });

  test('renders default 15 color swatches', () => {
    const view = ColorPicker();
    document.body.appendChild(view.element);

    const swatches = document.body.querySelectorAll('.ds-color-picker__color');
    expect(swatches.length).toBe(15);
  });

  test('renders custom color count', () => {
    const view = ColorPicker({ colors: ['#ff0000', '#00ff00', '#0000ff'] });
    document.body.appendChild(view.element);

    const swatches = document.body.querySelectorAll('.ds-color-picker__color');
    expect(swatches.length).toBe(3);
  });

  test('renders color input', () => {
    const view = ColorPicker();
    document.body.appendChild(view.element);

    expect(document.body.querySelector('.ds-color-picker__input')).not.toBeNull();
  });
});

// ─── Toggle panel ────────────────────────────────────────────────────────────

describe('ColorPicker panel toggle', () => {
  test('clicking trigger opens panel', () => {
    const view = ColorPicker();
    document.body.appendChild(view.element);

    document.body.querySelector('.ds-color-picker__trigger').click();
    expect(document.body.querySelector('.ds-color-picker__panel').classList.contains('is-visible')).toBe(true);
  });

  test('clicking trigger twice closes panel', () => {
    const view = ColorPicker();
    document.body.appendChild(view.element);

    const trigger = document.body.querySelector('.ds-color-picker__trigger');
    trigger.click();
    trigger.click();
    expect(document.body.querySelector('.ds-color-picker__panel').classList.contains('is-visible')).toBe(false);
  });
});

// ─── Value handling ──────────────────────────────────────────────────────────

describe('ColorPicker value', () => {
  test('sets initial value', () => {
    const view = ColorPicker({ value: '#ff0000' });
    document.body.appendChild(view.element);

    expect(view.getValue()).toBe('#ff0000');
  });

  test('setValue updates value', () => {
    const view = ColorPicker();
    document.body.appendChild(view.element);

    view.setValue('#00ff00');
    expect(view.getValue()).toBe('#00ff00');
  });

  test('clicking swatch selects color', () => {
    const onChange = jest.fn();
    const colors = ['#ff0000', '#00ff00', '#0000ff'];
    const view = ColorPicker({ colors, onChange });
    document.body.appendChild(view.element);

    const swatches = document.body.querySelectorAll('.ds-color-picker__color');
    swatches[1].click();

    expect(view.getValue()).toBe('#00ff00');
    expect(onChange).toHaveBeenCalledWith('#00ff00');
  });

  test('selecting swatch closes panel', () => {
    const view = ColorPicker({ colors: ['#ff0000'] });
    document.body.appendChild(view.element);

    // Open panel
    document.body.querySelector('.ds-color-picker__trigger').click();
    // Click swatch
    document.body.querySelector('.ds-color-picker__color').click();

    expect(document.body.querySelector('.ds-color-picker__panel').classList.contains('is-visible')).toBe(false);
  });

  test('selected swatch has is-selected class', () => {
    const view = ColorPicker({ value: '#ff0000', colors: ['#ff0000', '#00ff00'] });
    document.body.appendChild(view.element);

    const swatches = document.body.querySelectorAll('.ds-color-picker__color');
    expect(swatches[0].classList.contains('is-selected')).toBe(true);
    expect(swatches[1].classList.contains('is-selected')).toBe(false);
  });

  test('value display shows hex text', () => {
    const view = ColorPicker({ value: '#3b82f6' });
    document.body.appendChild(view.element);

    const valueEl = document.body.querySelector('.ds-color-picker__value');
    expect(valueEl.textContent).toBe('#3b82f6');
  });
});

// ─── Disabled ────────────────────────────────────────────────────────────────

describe('ColorPicker disabled', () => {
  test('trigger has pointer-events none when disabled', () => {
    const view = ColorPicker({ disabled: true });
    document.body.appendChild(view.element);

    expect(document.body.querySelector('.ds-color-picker__trigger').style.pointerEvents).toBe('none');
  });
});

// ─── Destroy ─────────────────────────────────────────────────────────────────

describe('ColorPicker destroy', () => {
  test('destroy cleans up', () => {
    const view = ColorPicker();
    document.body.appendChild(view.element);

    expect(() => view.destroy()).not.toThrow();
  });
});
