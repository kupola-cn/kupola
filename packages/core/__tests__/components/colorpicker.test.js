// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Unit tests for the ColorPicker component.
 * @jest-environment jsdom
 */

import { resetScheduler } from '../../src/scheduler.js';
import { ColorPicker } from '@kupola/components';

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
    const view = ColorPicker({ colors: [ '#ff0000', '#00ff00', '#0000ff' ] });
    document.body.appendChild(view.element);

    const swatches = document.body.querySelectorAll('.ds-color-picker__color');
    expect(swatches.length).toBe(3);
  });

  test('renders color input', () => {
    const view = ColorPicker();
    document.body.appendChild(view.element);

    expect(document.body.querySelector('.ds-color-picker__input')).not.toBeNull();
  });

  test('uses buttons for keyboard-accessible controls and unique aria ids', () => {
    const first = ColorPicker({ colors: [ '#ff0000' ] });
    const second = ColorPicker({ colors: [ '#00ff00' ] });
    document.body.append(first.element, second.element);
    const triggers = document.querySelectorAll('.ds-color-picker__trigger');
    expect(triggers[0].type).toBe('button');
    expect(triggers[0].getAttribute('aria-controls')).not.toBe(
      triggers[1].getAttribute('aria-controls'),
    );
    const swatch = document.querySelector('.ds-color-picker__color');
    expect(swatch.type).toBe('button');
    expect(swatch.getAttribute('role')).toBe('option');
    first.destroy();
    second.destroy();
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

  test('closes on outside click and Escape only affects the topmost picker', () => {
    const first = ColorPicker();
    const second = ColorPicker();
    document.body.append(first.element, second.element);
    first.open();
    second.open();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(first.isOpen()).toBe(true);
    expect(second.isOpen()).toBe(false);
    document.body.click();
    expect(first.isOpen()).toBe(false);
    first.destroy();
    second.destroy();
  });

  test('Tab closes without preventing focus navigation', () => {
    const view = ColorPicker();
    document.body.appendChild(view.element);
    view.open();
    const event = new KeyboardEvent('keydown', { key: 'Tab', cancelable: true });
    document.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
    expect(view.isOpen()).toBe(false);
    view.destroy();
  });

  test('only acquires document listeners while open', () => {
    const addSpy = jest.spyOn(document, 'addEventListener');
    const removeSpy = jest.spyOn(document, 'removeEventListener');
    const view = ColorPicker();
    expect(addSpy.mock.calls.some(([ event ]) => event === 'click' || event === 'keydown')).toBe(false);
    view.open();
    expect(addSpy.mock.calls.some(([ event ]) => event === 'click')).toBe(true);
    expect(addSpy.mock.calls.some(([ event ]) => event === 'keydown')).toBe(true);
    view.close();
    expect(removeSpy.mock.calls.some(([ event ]) => event === 'click')).toBe(true);
    expect(removeSpy.mock.calls.some(([ event ]) => event === 'keydown')).toBe(true);
    addSpy.mockRestore();
    removeSpy.mockRestore();
    view.destroy();
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
    const colors = [ '#ff0000', '#00ff00', '#0000ff' ];
    const view = ColorPicker({ colors, onChange });
    document.body.appendChild(view.element);

    const swatches = document.body.querySelectorAll('.ds-color-picker__color');
    swatches[1].click();

    expect(view.getValue()).toBe('#00ff00');
    expect(onChange).toHaveBeenCalledWith('#00ff00');
  });

  test('selecting swatch closes panel', () => {
    const view = ColorPicker({ colors: [ '#ff0000' ] });
    document.body.appendChild(view.element);

    // Open panel
    document.body.querySelector('.ds-color-picker__trigger').click();
    // Click swatch
    document.body.querySelector('.ds-color-picker__color').click();

    expect(document.body.querySelector('.ds-color-picker__panel').classList.contains('is-visible')).toBe(false);
  });

  test('selected swatch has is-selected class', () => {
    const view = ColorPicker({ value: '#ff0000', colors: [ '#ff0000', '#00ff00' ] });
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

  test('supports color/presets and getColor/setColor aliases', () => {
    const view = ColorPicker({ color: '#112233', presets: [ '#112233' ] });
    document.body.appendChild(view.element);
    expect(view.getColor()).toBe('#112233');
    view.setColor('#445566');
    expect(view.getValue()).toBe('#445566');
    expect(document.querySelector('.ds-color-picker__input').value).toBe('#445566');
    view.destroy();
  });
});

// ─── Disabled ────────────────────────────────────────────────────────────────

describe('ColorPicker disabled', () => {
  test('trigger has pointer-events none when disabled', () => {
    const view = ColorPicker({ disabled: true });
    document.body.appendChild(view.element);

    expect(document.body.querySelector('.ds-color-picker__trigger').style.pointerEvents).toBe('none');
    view.open();
    expect(view.isOpen()).toBe(false);
    view.destroy();
  });
});

// ─── Destroy ─────────────────────────────────────────────────────────────────

describe('ColorPicker destroy', () => {
  test('destroy cleans up', () => {
    const view = ColorPicker();
    document.body.appendChild(view.element);

    view.open();
    expect(() => view.destroy()).not.toThrow();
    expect(view.isOpen()).toBe(false);
    expect(() => view.destroy()).not.toThrow();
    view.open();
    expect(view.isOpen()).toBe(false);
  });
});
