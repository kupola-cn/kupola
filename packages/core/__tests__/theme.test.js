// SPDX-License-Identifier: MIT
/**
 * @jest-environment jsdom
 */

import {
  attachBrandColorPicker,
  getPreferredBrandColor,
  resetBrandColor,
  setBrandColor,
  themePreload,
} from '../../platform/src/theme.js';

beforeEach(() => {
  localStorage.clear();
  document.body.innerHTML = '';
  document.documentElement.removeAttribute('data-brand');
  document.documentElement.removeAttribute('data-theme');
  document.documentElement.removeAttribute('style');
});

describe('brand color theme utilities', () => {
  test('setBrandColor applies brand CSS variables', () => {
    const brand = setBrandColor('#3b82f6');

    expect(brand.color).toBe('#3B82F6');
    expect(document.documentElement.dataset.brand).toBe('blue');
    expect(document.documentElement.style.getPropertyValue('--bg-brand')).toBe('#3B82F6');
    expect(document.documentElement.style.getPropertyValue('--text-brand')).toBe('#3B82F6');
    expect(document.documentElement.style.getPropertyValue('--bg-brand-disabled')).toBe('rgba(59, 130, 246, 0.3)');
  });

  test('setBrandColor resolves preset ids and persists them', () => {
    const brand = setBrandColor('slate');
    const stored = JSON.parse(localStorage.getItem('kupola-brand-color'));

    expect(brand.id).toBe('slate');
    expect(stored.id).toBe('slate');
    expect(getPreferredBrandColor().color).toBe('#535164');
  });

  test('themePreload applies persisted brand color', () => {
    localStorage.setItem('kupola-brand-color', JSON.stringify({ id: 'blue', color: '#3B82F6', label: 'Blue' }));

    themePreload();

    expect(document.documentElement.dataset.brand).toBe('blue');
    expect(document.documentElement.style.getPropertyValue('--bg-brand')).toBe('#3B82F6');
  });

  test('attachBrandColorPicker opens popover and applies swatch selection', () => {
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    const picker = attachBrandColorPicker(trigger, {
      colors: [{ id: 'test', label: 'Test', color: '#F97316' }],
      custom: false,
    });

    trigger.click();
    expect(document.body.querySelector('.ds-brand-picker').classList.contains('is-open')).toBe(true);

    document.body.querySelector('.ds-brand-picker__swatch').click();
    expect(document.documentElement.dataset.brand).toBe('test');
    expect(document.documentElement.style.getPropertyValue('--bg-brand')).toBe('#F97316');

    picker.destroy();
    expect(document.body.querySelector('.ds-brand-picker')).toBeNull();
  });

  test('attachBrandColorPicker keeps popover open while picking custom color', () => {
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    const picker = attachBrandColorPicker(trigger, {
      colors: [{ id: 'test', label: 'Test', color: '#F97316' }],
    });

    trigger.click();
    const panel = document.body.querySelector('.ds-brand-picker');
    const input = panel.querySelector('.ds-brand-picker__input');

    expect(panel.textContent).toContain('自定义颜色');

    input.value = '#3b82f6';
    input.dispatchEvent(new Event('input', { bubbles: true }));

    expect(panel.classList.contains('is-open')).toBe(true);
    expect(document.documentElement.dataset.brand).toBe('blue');
    expect(document.documentElement.style.getPropertyValue('--bg-brand')).toBe('#3B82F6');

    picker.destroy();
  });

  test('resetBrandColor clears persisted brand color', () => {
    setBrandColor('#F97316');
    resetBrandColor();

    expect(localStorage.getItem('kupola-brand-color')).toBeNull();
    expect(document.documentElement.dataset.brand).toBe('green');
  });
});
