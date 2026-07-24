// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Unit tests for the Progress component.
 * @jest-environment jsdom
 */

import { resetScheduler } from '../../src/index.js';
import { Progress } from '@kupola/components';

afterEach(() => {
  document.body.innerHTML = '';
  resetScheduler();
});

// ─── Basic rendering ─────────────────────────────────────────────────────────

describe('Progress rendering', () => {
  test('renders a progress bar', () => {
    const view = Progress({ percent: 50 });
    document.body.appendChild(view.element);

    const bar = document.body.querySelector('.ds-progress');
    expect(bar).not.toBeNull();
  });

  test('renders the inner bar element', () => {
    const view = Progress({ percent: 50 });
    document.body.appendChild(view.element);

    const inner = document.body.querySelector('.ds-progress__bar');
    expect(inner).not.toBeNull();
  });

  test('sets initial bar width from percent', () => {
    const view = Progress({ percent: 75 });
    document.body.appendChild(view.element);

    const inner = document.body.querySelector('.ds-progress__bar');
    expect(inner.style.width).toBe('75%');
  });

  test('defaults to 0 percent', () => {
    const view = Progress();
    expect(view.getPercent()).toBe(0);
  });

  test('clamps percent to 0–100 range', () => {
    const view1 = Progress({ percent: -10 });
    expect(view1.getPercent()).toBe(0);

    const view2 = Progress({ percent: 150 });
    expect(view2.getPercent()).toBe(100);
  });
});

// ─── Size variants ───────────────────────────────────────────────────────────

describe('Progress size', () => {
  test('applies sm size class', () => {
    const view = Progress({ percent: 50, size: 'sm' });
    document.body.appendChild(view.element);

    const bar = document.body.querySelector('.ds-progress');
    expect(bar.classList.contains('ds-progress--sm')).toBe(true);
  });

  test('default size has no extra class', () => {
    const view = Progress({ percent: 50 });
    document.body.appendChild(view.element);

    const bar = document.body.querySelector('.ds-progress');
    expect(bar.classList.contains('ds-progress--sm')).toBe(false);
  });
});

// ─── Indeterminate ───────────────────────────────────────────────────────────

describe('Progress indeterminate', () => {
  test('applies indeterminate class', () => {
    const view = Progress({ indeterminate: true });
    document.body.appendChild(view.element);

    const bar = document.body.querySelector('.ds-progress');
    expect(bar.classList.contains('ds-progress--indeterminate')).toBe(true);
  });
});

// ─── setPercent / setStatus ──────────────────────────────────────────────────

describe('Progress API', () => {
  test('setPercent updates bar width', () => {
    const view = Progress({ percent: 0 });
    document.body.appendChild(view.element);

    view.setPercent(60);
    expect(view.getPercent()).toBe(60);

    const inner = document.body.querySelector('.ds-progress__bar');
    expect(inner.style.width).toBe('60%');
  });

  test('setPercent clamps values', () => {
    const view = Progress({ percent: 50 });

    view.setPercent(200);
    expect(view.getPercent()).toBe(100);

    view.setPercent(-5);
    expect(view.getPercent()).toBe(0);
  });

  test('setStatus adds error class', () => {
    const view = Progress({ percent: 50 });
    document.body.appendChild(view.element);

    view.setStatus('error');

    const inner = document.body.querySelector('.ds-progress__bar');
    expect(inner.classList.contains('is-error')).toBe(true);
  });

  test('setStatus adds warning class', () => {
    const view = Progress({ percent: 50 });
    document.body.appendChild(view.element);

    view.setStatus('warning');

    const inner = document.body.querySelector('.ds-progress__bar');
    expect(inner.classList.contains('is-warning')).toBe(true);
  });

  test('setStatus removes previous status classes', () => {
    const view = Progress({ percent: 50, status: 'error' });
    document.body.appendChild(view.element);

    const inner = document.body.querySelector('.ds-progress__bar');
    expect(inner.classList.contains('is-error')).toBe(true);

    view.setStatus('warning');
    expect(inner.classList.contains('is-error')).toBe(false);
    expect(inner.classList.contains('is-warning')).toBe(true);
  });
});

// ─── Destroy ─────────────────────────────────────────────────────────────────

describe('Progress destroy', () => {
  test('destroy() cleans up the reactive instance', () => {
    const view = Progress({ percent: 50 });
    document.body.appendChild(view.element);

    expect(document.body.querySelector('.ds-progress')).not.toBeNull();
    // destroy should not throw
    expect(() => view.destroy()).not.toThrow();
  });
});
