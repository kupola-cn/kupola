// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Unit tests for the Spin component.
 * @jest-environment jsdom
 */

import { resetScheduler } from '../../src/index.js';
import { Spin } from '../../src/components/spin.js';

afterEach(() => {
  document.body.innerHTML = '';
  resetScheduler();
});

// ─── Basic rendering ─────────────────────────────────────────────────────────

describe('Spin rendering', () => {
  test('renders a spin element', () => {
    const view = Spin();
    document.body.appendChild(view.element);

    const spin = document.body.querySelector('.ds-spin');
    expect(spin).not.toBeNull();
  });

  test('renders a loader element', () => {
    const view = Spin();
    document.body.appendChild(view.element);

    const loader = document.body.querySelector('.ds-spin__loader');
    expect(loader).not.toBeNull();
  });

  test('does not render text by default', () => {
    const view = Spin();
    document.body.appendChild(view.element);

    const text = document.body.querySelector('.ds-spin__text');
    expect(text).toBeNull();
  });
});

// ─── Text ────────────────────────────────────────────────────────────────────

describe('Spin with text', () => {
  test('renders text label', () => {
    const view = Spin({ text: 'Loading...' });
    document.body.appendChild(view.element);

    const text = document.body.querySelector('.ds-spin__text');
    expect(text).not.toBeNull();
    expect(text.textContent).toBe('Loading...');
  });
});

// ─── Size variants ───────────────────────────────────────────────────────────

describe('Spin size', () => {
  test('applies sm size class', () => {
    const view = Spin({ size: 'sm' });
    document.body.appendChild(view.element);

    const spin = document.body.querySelector('.ds-spin');
    expect(spin.classList.contains('ds-spin--sm')).toBe(true);
  });

  test('applies lg size class', () => {
    const view = Spin({ size: 'lg' });
    document.body.appendChild(view.element);

    const spin = document.body.querySelector('.ds-spin');
    expect(spin.classList.contains('ds-spin--lg')).toBe(true);
  });

  test('default size has no extra class', () => {
    const view = Spin();
    document.body.appendChild(view.element);

    const spin = document.body.querySelector('.ds-spin');
    expect(spin.classList.contains('ds-spin--sm')).toBe(false);
    expect(spin.classList.contains('ds-spin--lg')).toBe(false);
  });
});

// ─── Destroy ─────────────────────────────────────────────────────────────────

describe('Spin destroy', () => {
  test('destroy() cleans up the reactive instance', () => {
    const view = Spin();
    document.body.appendChild(view.element);

    expect(document.body.querySelector('.ds-spin')).not.toBeNull();
    expect(() => view.destroy()).not.toThrow();
  });
});
