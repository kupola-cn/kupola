// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Unit tests for the Statcard component.
 * @jest-environment jsdom
 */

import { resetScheduler } from '../../src/index.js';
import { StatCard as Statcard } from '@kupola/components';

afterEach(() => {
  document.body.innerHTML = '';
  resetScheduler();
});

// ─── Basic rendering ─────────────────────────────────────────────────────────

describe('Statcard rendering', () => {
  test('renders a statcard element', () => {
    const view = Statcard({ title: 'Revenue', value: '$12,345' });
    document.body.appendChild(view.element);

    const card = document.body.querySelector('.ds-statcard');
    expect(card).not.toBeNull();
  });

  test('renders title', () => {
    const view = Statcard({ title: 'Revenue' });
    document.body.appendChild(view.element);

    const title = document.body.querySelector('.ds-statcard__title');
    expect(title).not.toBeNull();
    expect(title.textContent).toBe('Revenue');
  });

  test('renders value', () => {
    const view = Statcard({ value: '$12,345' });
    document.body.appendChild(view.element);

    const value = document.body.querySelector('.ds-statcard__value');
    expect(value).not.toBeNull();
    expect(value.textContent).toContain('$12,345');
  });

  test('renders unit suffix', () => {
    const view = Statcard({ value: '99', unit: '%' });
    document.body.appendChild(view.element);

    const unit = document.body.querySelector('.ds-statcard__unit');
    expect(unit).not.toBeNull();
    expect(unit.textContent).toBe('%');
  });
});

// ─── Header (icon) ──────────────────────────────────────────────────────────

describe('Statcard header', () => {
  test('renders icon', () => {
    const view = Statcard({ icon: '$' });
    document.body.appendChild(view.element);

    const icon = document.body.querySelector('.ds-statcard__icon');
    expect(icon).not.toBeNull();
    expect(icon.textContent).toBe('$');
  });

  test('renders icon with type class', () => {
    const view = Statcard({ icon: '$', iconType: 'success' });
    document.body.appendChild(view.element);

    const icon = document.body.querySelector('.ds-statcard__icon');
    expect(icon.classList.contains('ds-statcard__icon--success')).toBe(true);
  });

  test('no header when no title or icon', () => {
    const view = Statcard({ value: '100' });
    document.body.appendChild(view.element);

    const header = document.body.querySelector('.ds-statcard__header');
    expect(header).toBeNull();
  });
});

// ─── Trend ───────────────────────────────────────────────────────────────────

describe('Statcard trend', () => {
  test('renders trend with direction class', () => {
    const view = Statcard({ trend: 'up', trendValue: '+12.5%' });
    document.body.appendChild(view.element);

    const trend = document.body.querySelector('.ds-statcard__trend');
    expect(trend).not.toBeNull();
    expect(trend.classList.contains('ds-statcard__trend--up')).toBe(true);
    expect(trend.textContent).toBe('+12.5%');
  });

  test('renders down trend', () => {
    const view = Statcard({ trend: 'down', trendValue: '-3.2%' });
    document.body.appendChild(view.element);

    const trend = document.body.querySelector('.ds-statcard__trend');
    expect(trend.classList.contains('ds-statcard__trend--down')).toBe(true);
  });

  test('no trend when not provided', () => {
    const view = Statcard({ value: '100' });
    document.body.appendChild(view.element);

    const trend = document.body.querySelector('.ds-statcard__trend');
    expect(trend).toBeNull();
  });
});

// ─── Variants ────────────────────────────────────────────────────────────────

describe('Statcard variants', () => {
  test('applies hover-lift class', () => {
    const view = Statcard({ hoverLift: true });
    document.body.appendChild(view.element);

    const card = document.body.querySelector('.ds-statcard');
    expect(card.classList.contains('ds-statcard--hover-lift')).toBe(true);
  });

  test('applies compact class', () => {
    const view = Statcard({ compact: true });
    document.body.appendChild(view.element);

    const card = document.body.querySelector('.ds-statcard');
    expect(card.classList.contains('ds-statcard--compact')).toBe(true);
  });

  test('applies gradient class', () => {
    const view = Statcard({ gradient: true });
    document.body.appendChild(view.element);

    const card = document.body.querySelector('.ds-statcard');
    expect(card.classList.contains('ds-statcard--gradient')).toBe(true);
  });

  test('applies small value size', () => {
    const view = Statcard({ size: 'small' });
    document.body.appendChild(view.element);

    const value = document.body.querySelector('.ds-statcard__value');
    expect(value.classList.contains('ds-statcard__value--small')).toBe(true);
  });

  test('applies large value size', () => {
    const view = Statcard({ size: 'large' });
    document.body.appendChild(view.element);

    const value = document.body.querySelector('.ds-statcard__value');
    expect(value.classList.contains('ds-statcard__value--large')).toBe(true);
  });
});

// ─── Destroy ─────────────────────────────────────────────────────────────────

describe('Statcard destroy', () => {
  test('destroy() cleans up the reactive instance', () => {
    const view = Statcard({ title: 'Test', value: '100' });
    document.body.appendChild(view.element);

    expect(document.body.querySelector('.ds-statcard')).not.toBeNull();
    expect(() => view.destroy()).not.toThrow();
  });
});
