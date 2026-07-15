// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Unit tests for the Skeleton component.
 * @jest-environment jsdom
 */

import { resetScheduler } from '../../src/index.js';
import { Skeleton } from '../../src/components/skeleton.js';

afterEach(() => {
  document.body.innerHTML = '';
  resetScheduler();
});

// ─── Basic rendering ─────────────────────────────────────────────────────────

describe('Skeleton rendering', () => {
  test('renders a skeleton group', () => {
    const view = Skeleton();
    document.body.appendChild(view.element);

    const group = document.body.querySelector('.ds-skeleton-group');
    expect(group).not.toBeNull();
  });

  test('renders one skeleton item by default', () => {
    const view = Skeleton();
    document.body.appendChild(view.element);

    const items = document.body.querySelectorAll('.ds-skeleton');
    expect(items.length).toBe(1);
  });

  test('renders multiple skeleton items with count', () => {
    const view = Skeleton({ count: 3 });
    document.body.appendChild(view.element);

    const items = document.body.querySelectorAll('.ds-skeleton');
    expect(items.length).toBe(3);
  });
});

// ─── Variants ────────────────────────────────────────────────────────────────

describe('Skeleton variants', () => {
  test('applies text variant class', () => {
    const view = Skeleton({ variant: 'text' });
    document.body.appendChild(view.element);

    const item = document.body.querySelector('.ds-skeleton');
    expect(item.classList.contains('ds-skeleton--text')).toBe(true);
  });

  test('applies heading variant class', () => {
    const view = Skeleton({ variant: 'heading' });
    document.body.appendChild(view.element);

    const item = document.body.querySelector('.ds-skeleton');
    expect(item.classList.contains('ds-skeleton--heading')).toBe(true);
  });

  test('applies block variant class', () => {
    const view = Skeleton({ variant: 'block' });
    document.body.appendChild(view.element);

    const item = document.body.querySelector('.ds-skeleton');
    expect(item.classList.contains('ds-skeleton--block')).toBe(true);
  });

  test('applies avatar variant with circle class', () => {
    const view = Skeleton({ variant: 'avatar' });
    document.body.appendChild(view.element);

    const item = document.body.querySelector('.ds-skeleton');
    expect(item.classList.contains('ds-skeleton--avatar')).toBe(true);
    expect(item.classList.contains('ds-skeleton--circle')).toBe(true);
  });

  test('applies circle variant', () => {
    const view = Skeleton({ variant: 'circle' });
    document.body.appendChild(view.element);

    const item = document.body.querySelector('.ds-skeleton');
    expect(item.classList.contains('ds-skeleton--circle')).toBe(true);
  });
});

// ─── Custom dimensions ──────────────────────────────────────────────────────

describe('Skeleton custom dimensions', () => {
  test('applies custom width', () => {
    const view = Skeleton({ width: '200px' });
    document.body.appendChild(view.element);

    const item = document.body.querySelector('.ds-skeleton');
    expect(item.style.width).toBe('200px');
  });

  test('applies custom height', () => {
    const view = Skeleton({ height: '50px' });
    document.body.appendChild(view.element);

    const item = document.body.querySelector('.ds-skeleton');
    expect(item.style.height).toBe('50px');
  });

  test('last text line is shorter when count > 1', () => {
    const view = Skeleton({ variant: 'text', count: 3 });
    document.body.appendChild(view.element);

    const items = document.body.querySelectorAll('.ds-skeleton');
    expect(items[2].style.width).toBe('60%');
  });
});

// ─── Destroy ─────────────────────────────────────────────────────────────────

describe('Skeleton destroy', () => {
  test('destroy() cleans up the reactive instance', () => {
    const view = Skeleton();
    document.body.appendChild(view.element);

    expect(document.body.querySelector('.ds-skeleton-group')).not.toBeNull();
    expect(() => view.destroy()).not.toThrow();
  });
});
