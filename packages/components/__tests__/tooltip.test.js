// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Unit tests for the Tooltip component.
 * @jest-environment jsdom
 */

import { resetScheduler } from '../../core/src/scheduler.js';
import { Tooltip } from '@kupola/components';

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
  document.body.innerHTML = '';
  resetScheduler();
});

// ─── Basic creation ──────────────────────────────────────────────────────────

describe('Tooltip creation', () => {
  test('throws if no target provided', () => {
    expect(() => Tooltip({})).toThrow('Tooltip requires a target element');
  });

  test('creates tooltip bound to target', () => {
    const btn = document.createElement('button');
    document.body.appendChild(btn);

    const tip = Tooltip({ target: btn, content: 'Hello' });
    expect(tip).toBeDefined();
    expect(typeof tip.show).toBe('function');
    expect(typeof tip.hide).toBe('function');
    expect(typeof tip.destroy).toBe('function');
    tip.destroy();
  });
});

// ─── Show/Hide ───────────────────────────────────────────────────────────────

describe('Tooltip show/hide', () => {
  test('show() creates and displays tooltip', () => {
    const btn = document.createElement('button');
    document.body.appendChild(btn);

    const tip = Tooltip({ target: btn, content: 'Tip text' });
    tip.show();

    const tooltipEl = document.body.querySelector('.ds-tooltip');
    expect(tooltipEl).not.toBeNull();
    expect(tooltipEl.textContent).toBe('Tip text');
    expect(tooltipEl.classList.contains('is-visible')).toBe(true);
    tip.destroy();
  });

  test('hide() hides the tooltip', () => {
    const btn = document.createElement('button');
    document.body.appendChild(btn);

    const tip = Tooltip({ target: btn, content: 'Tip text' });
    tip.show();
    tip.hide();

    const tooltipEl = document.body.querySelector('.ds-tooltip');
    expect(tooltipEl.classList.contains('is-visible')).toBe(false);
    tip.destroy();
  });

  test('show() is idempotent', () => {
    const btn = document.createElement('button');
    document.body.appendChild(btn);

    const tip = Tooltip({ target: btn, content: 'Tip' });
    tip.show();
    tip.show();

    const tooltips = document.body.querySelectorAll('.ds-tooltip');
    expect(tooltips.length).toBe(1);
    tip.destroy();
  });

  test('connects the tooltip to its target without replacing existing descriptions', () => {
    const btn = document.createElement('button');
    btn.setAttribute('aria-describedby', 'existing-description');
    const tip = Tooltip({ target: btn, content: 'Tip' });

    tip.show();
    const tooltipEl = document.body.querySelector('.ds-tooltip');
    expect(btn.getAttribute('aria-describedby')).toBe(`existing-description ${tooltipEl.id}`);

    tip.destroy();
    expect(btn.getAttribute('aria-describedby')).toBe('existing-description');
  });
});

// ─── Hover trigger ───────────────────────────────────────────────────────────

describe('Tooltip hover trigger', () => {
  test('shows on mouseenter', () => {
    const btn = document.createElement('button');
    document.body.appendChild(btn);

    const tip = Tooltip({ target: btn, content: 'Hover tip', trigger: 'hover' });

    btn.dispatchEvent(new Event('mouseenter'));

    const tooltipEl = document.body.querySelector('.ds-tooltip');
    expect(tooltipEl).not.toBeNull();
    expect(tooltipEl.classList.contains('is-visible')).toBe(true);
    tip.destroy();
  });

  test('hides on mouseleave', () => {
    const btn = document.createElement('button');
    document.body.appendChild(btn);

    const tip = Tooltip({ target: btn, content: 'Hover tip', trigger: 'hover' });

    btn.dispatchEvent(new Event('mouseenter'));
    btn.dispatchEvent(new Event('mouseleave'));

    const tooltipEl = document.body.querySelector('.ds-tooltip');
    expect(tooltipEl.classList.contains('is-visible')).toBe(false);
    tip.destroy();
  });

  test('cancels a delayed show when the pointer leaves', () => {
    jest.useFakeTimers();
    const btn = document.createElement('button');
    document.body.appendChild(btn);
    const tip = Tooltip({ target: btn, content: 'Delayed', delay: 100 });

    btn.dispatchEvent(new Event('mouseenter'));
    expect(jest.getTimerCount()).toBe(1);
    btn.dispatchEvent(new Event('mouseleave'));
    expect(jest.getTimerCount()).toBe(0);
    jest.advanceTimersByTime(100);
    expect(document.body.querySelector('.ds-tooltip')).toBeNull();
    tip.destroy();
  });

  test('does not schedule duplicate delayed shows', () => {
    jest.useFakeTimers();
    const btn = document.createElement('button');
    const tip = Tooltip({ target: btn, content: 'Delayed', delay: 100 });

    btn.dispatchEvent(new Event('mouseenter'));
    btn.dispatchEvent(new Event('mouseenter'));
    expect(jest.getTimerCount()).toBe(1);
    tip.destroy();
    expect(jest.getTimerCount()).toBe(0);
  });
});

// ─── Click trigger ───────────────────────────────────────────────────────────

describe('Tooltip click trigger', () => {
  test('toggles on click', () => {
    const btn = document.createElement('button');
    document.body.appendChild(btn);

    const tip = Tooltip({ target: btn, content: 'Click tip', trigger: 'click' });

    btn.click();
    let tooltipEl = document.body.querySelector('.ds-tooltip');
    expect(tooltipEl).not.toBeNull();
    expect(tooltipEl.classList.contains('is-visible')).toBe(true);

    btn.click();
    expect(tooltipEl.classList.contains('is-visible')).toBe(false);
    tip.destroy();
  });

  test('closes on document click', () => {
    const btn = document.createElement('button');
    document.body.appendChild(btn);

    const tip = Tooltip({ target: btn, content: 'Click tip', trigger: 'click' });

    btn.click();
    const tooltipEl = document.body.querySelector('.ds-tooltip');
    expect(tooltipEl.classList.contains('is-visible')).toBe(true);

    document.body.click();
    expect(tooltipEl.classList.contains('is-visible')).toBe(false);
    tip.destroy();
  });
});

// ─── Focus trigger ───────────────────────────────────────────────────────────

describe('Tooltip focus trigger', () => {
  test('shows on focus', () => {
    const btn = document.createElement('button');
    document.body.appendChild(btn);

    const tip = Tooltip({ target: btn, content: 'Focus tip', trigger: 'focus' });

    btn.dispatchEvent(new Event('focus'));

    const tooltipEl = document.body.querySelector('.ds-tooltip');
    expect(tooltipEl).not.toBeNull();
    expect(tooltipEl.classList.contains('is-visible')).toBe(true);
    tip.destroy();
  });

  test('hides on blur', () => {
    const btn = document.createElement('button');
    document.body.appendChild(btn);

    const tip = Tooltip({ target: btn, content: 'Focus tip', trigger: 'focus' });

    btn.dispatchEvent(new Event('focus'));
    btn.dispatchEvent(new Event('blur'));

    const tooltipEl = document.body.querySelector('.ds-tooltip');
    expect(tooltipEl.classList.contains('is-visible')).toBe(false);
    tip.destroy();
  });
});

// ─── Placement ───────────────────────────────────────────────────────────────

describe('Tooltip placement', () => {
  test('applies placement class', () => {
    const btn = document.createElement('button');
    document.body.appendChild(btn);

    const tip = Tooltip({ target: btn, content: 'Bottom tip', placement: 'bottom' });
    tip.show();

    const tooltipEl = document.body.querySelector('.ds-tooltip');
    expect(tooltipEl.classList.contains('ds-tooltip--bottom')).toBe(true);
    tip.destroy();
  });

  test('default placement is top', () => {
    const btn = document.createElement('button');
    document.body.appendChild(btn);

    const tip = Tooltip({ target: btn, content: 'Top tip' });
    tip.show();

    const tooltipEl = document.body.querySelector('.ds-tooltip');
    expect(tooltipEl.classList.contains('ds-tooltip--top')).toBe(true);
    tip.destroy();
  });

  test('normalizes an unsupported placement', () => {
    const btn = document.createElement('button');
    const tip = Tooltip({ target: btn, content: 'Tip', placement: 'diagonal' });
    tip.show();

    expect(document.body.querySelector('.ds-tooltip').classList.contains('ds-tooltip--top')).toBe(true);
    tip.destroy();
  });
});

// ─── Destroy ─────────────────────────────────────────────────────────────────

describe('Tooltip destroy', () => {
  test('removes tooltip element from DOM', () => {
    const btn = document.createElement('button');
    document.body.appendChild(btn);

    const tip = Tooltip({ target: btn, content: 'Tip' });
    tip.show();

    let tooltipEl = document.body.querySelector('.ds-tooltip');
    expect(tooltipEl).not.toBeNull();

    tip.destroy();

    tooltipEl = document.body.querySelector('.ds-tooltip');
    expect(tooltipEl).toBeNull();
  });

  test('removes event listeners from target', () => {
    const btn = document.createElement('button');
    document.body.appendChild(btn);

    const tip = Tooltip({ target: btn, content: 'Tip' });
    tip.destroy();

    // After destroy, mouseenter should not create a tooltip
    btn.dispatchEvent(new Event('mouseenter'));
    const tooltipEl = document.body.querySelector('.ds-tooltip');
    expect(tooltipEl).toBeNull();
  });

  test('cancels pending work and is idempotent', () => {
    jest.useFakeTimers();
    const btn = document.createElement('button');
    const tip = Tooltip({ target: btn, content: 'Tip', delay: 100 });
    btn.dispatchEvent(new Event('mouseenter'));

    tip.destroy();
    expect(() => tip.destroy()).not.toThrow();
    expect(jest.getTimerCount()).toBe(0);
    jest.advanceTimersByTime(100);
    expect(document.body.querySelector('.ds-tooltip')).toBeNull();
    tip.show();
    expect(document.body.querySelector('.ds-tooltip')).toBeNull();
  });
});
