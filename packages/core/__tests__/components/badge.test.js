// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Unit tests for the Badge component.
 * @jest-environment jsdom
 */

import { resetScheduler } from '../../src/scheduler.js';
import { Badge } from '@kupola/components';

afterEach(() => {
  document.body.innerHTML = '';
  resetScheduler();
});

// ─── Basic rendering ─────────────────────────────────────────────────────────

describe('Badge rendering', () => {
  test('renders a badge element', () => {
    const view = Badge({ value: 5 });
    document.body.appendChild(view.element);

    const badge = document.body.querySelector('.ds-badge');
    expect(badge).not.toBeNull();
  });

  test('displays the numeric value', () => {
    const view = Badge({ value: 42 });
    document.body.appendChild(view.element);

    const badge = document.body.querySelector('.ds-badge');
    expect(badge.textContent).toBe('42');
  });

  test('displays string value', () => {
    const view = Badge({ value: 'new' });
    document.body.appendChild(view.element);

    const badge = document.body.querySelector('.ds-badge');
    expect(badge.textContent).toBe('new');
  });

  test('defaults to empty value', () => {
    const view = Badge();
    expect(view.getValue()).toBe('');
  });
});

// ─── Max value ───────────────────────────────────────────────────────────────

describe('Badge max', () => {
  test('shows max+ when value exceeds max', () => {
    const view = Badge({ value: 150, max: 99 });
    document.body.appendChild(view.element);

    const badge = document.body.querySelector('.ds-badge');
    expect(badge.textContent).toBe('99+');
  });

  test('shows exact value when equal to max', () => {
    const view = Badge({ value: 99, max: 99 });
    document.body.appendChild(view.element);

    const badge = document.body.querySelector('.ds-badge');
    expect(badge.textContent).toBe('99');
  });

  test('custom max value', () => {
    const view = Badge({ value: 15, max: 10 });
    document.body.appendChild(view.element);

    const badge = document.body.querySelector('.ds-badge');
    expect(badge.textContent).toBe('10+');
  });
});

// ─── Type variants ───────────────────────────────────────────────────────────

describe('Badge type', () => {
  test('applies error type class', () => {
    const view = Badge({ value: 3, type: 'error' });
    document.body.appendChild(view.element);

    const badge = document.body.querySelector('.ds-badge');
    expect(badge.classList.contains('ds-badge--error')).toBe(true);
  });

  test('applies success type class', () => {
    const view = Badge({ value: 1, type: 'success' });
    document.body.appendChild(view.element);

    const badge = document.body.querySelector('.ds-badge');
    expect(badge.classList.contains('ds-badge--success')).toBe(true);
  });

  test('applies brand type class', () => {
    const view = Badge({ value: 'N', type: 'brand' });
    document.body.appendChild(view.element);

    const badge = document.body.querySelector('.ds-badge');
    expect(badge.classList.contains('ds-badge--brand')).toBe(true);
  });

  test('applies warning type class', () => {
    const view = Badge({ value: 2, type: 'warning' });
    document.body.appendChild(view.element);

    const badge = document.body.querySelector('.ds-badge');
    expect(badge.classList.contains('ds-badge--warning')).toBe(true);
  });

  test('applies info type class', () => {
    const view = Badge({ value: 1, type: 'info' });
    document.body.appendChild(view.element);

    const badge = document.body.querySelector('.ds-badge');
    expect(badge.classList.contains('ds-badge--info')).toBe(true);
  });
});

// ─── Dot mode ────────────────────────────────────────────────────────────────

describe('Badge dot mode', () => {
  test('applies dot class', () => {
    const view = Badge({ dot: true });
    document.body.appendChild(view.element);

    const badge = document.body.querySelector('.ds-badge');
    expect(badge.classList.contains('ds-badge--dot')).toBe(true);
  });

  test('dot mode has no text content', () => {
    const view = Badge({ dot: true, value: 5 });
    document.body.appendChild(view.element);

    const badge = document.body.querySelector('.ds-badge');
    expect(badge.textContent).toBe('');
  });
});

// ─── Pulse ───────────────────────────────────────────────────────────────────

describe('Badge pulse', () => {
  test('applies pulse class', () => {
    const view = Badge({ value: 1, pulse: true });
    document.body.appendChild(view.element);

    const badge = document.body.querySelector('.ds-badge');
    expect(badge.classList.contains('ds-badge--pulse')).toBe(true);
  });
});

// ─── setValue / getValue ─────────────────────────────────────────────────────

describe('Badge API', () => {
  test('setValue updates displayed value', () => {
    const view = Badge({ value: 0 });
    document.body.appendChild(view.element);

    view.setValue(25);
    expect(view.getValue()).toBe(25);

    const badge = document.body.querySelector('.ds-badge');
    expect(badge.textContent).toBe('25');
  });

  test('setValue respects max', () => {
    const view = Badge({ value: 0, max: 99 });
    document.body.appendChild(view.element);

    view.setValue(200);

    const badge = document.body.querySelector('.ds-badge');
    expect(badge.textContent).toBe('99+');
  });
});

// ─── Destroy ─────────────────────────────────────────────────────────────────

describe('Badge destroy', () => {
  test('destroy() cleans up the reactive instance', () => {
    const view = Badge({ value: 1 });
    document.body.appendChild(view.element);

    expect(document.body.querySelector('.ds-badge')).not.toBeNull();
    expect(() => view.destroy()).not.toThrow();
  });
});
