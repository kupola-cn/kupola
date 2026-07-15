// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Unit tests for the Divider component.
 * @jest-environment jsdom
 */

import { resetScheduler } from '../../src/index.js';
import { Divider } from '../../src/components/divider.js';

afterEach(() => {
  document.body.innerHTML = '';
  resetScheduler();
});

// ─── Basic rendering ─────────────────────────────────────────────────────────

describe('Divider rendering', () => {
  test('renders a horizontal divider by default', () => {
    const view = Divider();
    document.body.appendChild(view.element);

    const divider = document.body.querySelector('.ds-divider');
    expect(divider).not.toBeNull();
  });

  test('does not have vertical class by default', () => {
    const view = Divider();
    document.body.appendChild(view.element);

    const divider = document.body.querySelector('.ds-divider');
    expect(divider.classList.contains('ds-divider--vertical')).toBe(false);
  });

  test('renders vertical divider', () => {
    const view = Divider({ vertical: true });
    document.body.appendChild(view.element);

    const divider = document.body.querySelector('.ds-divider');
    expect(divider.classList.contains('ds-divider--vertical')).toBe(true);
  });
});

// ─── Text ────────────────────────────────────────────────────────────────────

describe('Divider with text', () => {
  test('renders text inside divider', () => {
    const view = Divider({ text: 'OR' });
    document.body.appendChild(view.element);

    const text = document.body.querySelector('.ds-divider__text');
    expect(text).not.toBeNull();
    expect(text.textContent).toBe('OR');
  });

  test('no text element when text is not provided', () => {
    const view = Divider();
    document.body.appendChild(view.element);

    const text = document.body.querySelector('.ds-divider__text');
    expect(text).toBeNull();
  });

  test('text divider has both classes', () => {
    const view = Divider({ text: 'Section' });
    document.body.appendChild(view.element);

    const divider = document.body.querySelector('.ds-divider');
    const text = document.body.querySelector('.ds-divider__text');
    expect(divider).not.toBeNull();
    expect(text).not.toBeNull();
  });
});

// ─── Destroy ─────────────────────────────────────────────────────────────────

describe('Divider destroy', () => {
  test('destroy() cleans up the reactive instance', () => {
    const view = Divider();
    document.body.appendChild(view.element);

    expect(document.body.querySelector('.ds-divider')).not.toBeNull();
    expect(() => view.destroy()).not.toThrow();
  });
});
