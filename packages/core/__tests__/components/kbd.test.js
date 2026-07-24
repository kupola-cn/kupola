// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Unit tests for the Kbd component.
 * @jest-environment jsdom
 */

import { resetScheduler } from '../../src/scheduler.js';
import { Kbd } from '@kupola/components';

afterEach(() => {
  document.body.innerHTML = '';
  resetScheduler();
});

// ─── Basic rendering ─────────────────────────────────────────────────────────

describe('Kbd rendering', () => {
  test('renders a kbd element', () => {
    const view = Kbd({ key: 'Enter' });
    document.body.appendChild(view.element);

    const kbd = document.body.querySelector('.ds-kbd');
    expect(kbd).not.toBeNull();
  });

  test('displays the key text', () => {
    const view = Kbd({ key: 'Ctrl+S' });
    document.body.appendChild(view.element);

    const kbd = document.body.querySelector('.ds-kbd');
    expect(kbd.textContent).toBe('Ctrl+S');
  });

  test('renders with empty key', () => {
    const view = Kbd();
    document.body.appendChild(view.element);

    const kbd = document.body.querySelector('.ds-kbd');
    expect(kbd).not.toBeNull();
    expect(kbd.textContent).toBe('');
  });
});

// ─── Size ────────────────────────────────────────────────────────────────────

describe('Kbd size', () => {
  test('applies sm size class', () => {
    const view = Kbd({ key: 'A', size: 'sm' });
    document.body.appendChild(view.element);

    const kbd = document.body.querySelector('.ds-kbd');
    expect(kbd.classList.contains('ds-kbd--sm')).toBe(true);
  });

  test('default size has no extra class', () => {
    const view = Kbd({ key: 'A' });
    document.body.appendChild(view.element);

    const kbd = document.body.querySelector('.ds-kbd');
    expect(kbd.classList.contains('ds-kbd--sm')).toBe(false);
  });
});

// ─── Destroy ─────────────────────────────────────────────────────────────────

describe('Kbd destroy', () => {
  test('destroy() cleans up the reactive instance', () => {
    const view = Kbd({ key: 'Esc' });
    document.body.appendChild(view.element);

    expect(document.body.querySelector('.ds-kbd')).not.toBeNull();
    expect(() => view.destroy()).not.toThrow();
  });
});
