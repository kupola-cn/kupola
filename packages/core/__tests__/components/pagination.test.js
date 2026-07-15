// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Unit tests for the Pagination component.
 * @jest-environment jsdom
 */

import { html, resetScheduler } from '../../src/index.js';
import { Pagination } from '../../src/components/pagination.js';

afterEach(() => {
  document.body.innerHTML = '';
  resetScheduler();
});

// ─── Rendering ───────────────────────────────────────────────────────────────

describe('Pagination rendering', () => {
  test('renders page buttons', () => {
    const view = Pagination({ total: 50, pageSize: 10 });
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    // 5 pages for 50 items / 10 per page
    const pageButtons = container.querySelectorAll('.ds-pagination__item:not([aria-label])');
    // Should have at least the page numbers + prev/next
    expect(pageButtons.length).toBeGreaterThanOrEqual(5);
    view.destroy();
  });

  test('marks current page as active', () => {
    const view = Pagination({ total: 50, pageSize: 10, current: 3 });
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    const activeBtn = container.querySelector('.ds-pagination__item.is-active');
    expect(activeBtn).not.toBeNull();
    expect(activeBtn.textContent).toBe('3');
    view.destroy();
  });

  test('shows total text when showTotal is true', () => {
    const view = Pagination({ total: 100, pageSize: 10, showTotal: true });
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    const totalEl = container.querySelector('.ds-pagination__total');
    expect(totalEl).not.toBeNull();
    expect(totalEl.textContent).toContain('100');
    view.destroy();
  });

  test('hides total text when showTotal is false', () => {
    const view = Pagination({ total: 100, pageSize: 10, showTotal: false });
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    const totalEl = container.querySelector('.ds-pagination__total');
    expect(totalEl).toBeNull();
    view.destroy();
  });

  test('disables prev button on first page', () => {
    const view = Pagination({ total: 50, pageSize: 10, current: 1 });
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    const prevBtn = container.querySelector('[aria-label="Previous"]');
    expect(prevBtn.hasAttribute('disabled')).toBe(true);
    view.destroy();
  });

  test('disables next button on last page', () => {
    const view = Pagination({ total: 50, pageSize: 10, current: 5 });
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    const nextBtn = container.querySelector('[aria-label="Next"]');
    expect(nextBtn.hasAttribute('disabled')).toBe(true);
    view.destroy();
  });
});

// ─── Navigation ──────────────────────────────────────────────────────────────

describe('Pagination navigation', () => {
  test('calls onChange when page is clicked', () => {
    const onChange = jest.fn();
    const view = Pagination({ total: 50, pageSize: 10, current: 1, onChange });
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    // Click page 3
    const pageButtons = container.querySelectorAll('.ds-pagination__item:not([aria-label])');
    // Find button with text "3"
    const btn3 = [ ...pageButtons ].find((b) => b.textContent === '3');
    expect(btn3).toBeDefined();
    btn3.click();

    expect(onChange).toHaveBeenCalledWith(3, 10);
    expect(view.getCurrent()).toBe(3);
    view.destroy();
  });

  test('navigates to next page via next button', () => {
    const onChange = jest.fn();
    const view = Pagination({ total: 50, pageSize: 10, current: 2, onChange });
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    const nextBtn = container.querySelector('[aria-label="Next"]');
    nextBtn.click();

    expect(onChange).toHaveBeenCalledWith(3, 10);
    expect(view.getCurrent()).toBe(3);
    view.destroy();
  });

  test('navigates to prev page via prev button', () => {
    const onChange = jest.fn();
    const view = Pagination({ total: 50, pageSize: 10, current: 3, onChange });
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    const prevBtn = container.querySelector('[aria-label="Previous"]');
    prevBtn.click();

    expect(onChange).toHaveBeenCalledWith(2, 10);
    expect(view.getCurrent()).toBe(2);
    view.destroy();
  });

  test('does not go below page 1', () => {
    const view = Pagination({ total: 50, pageSize: 10, current: 1 });
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    view.setCurrent(0);
    expect(view.getCurrent()).toBe(1);
    view.destroy();
  });

  test('does not exceed total pages', () => {
    const view = Pagination({ total: 50, pageSize: 10, current: 1 });
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    view.setCurrent(100);
    expect(view.getCurrent()).toBe(5);
    view.destroy();
  });
});

// ─── setCurrent / setTotal / setPageSize ─────────────────────────────────────

describe('Pagination API methods', () => {
  test('setCurrent updates active page', () => {
    const view = Pagination({ total: 50, pageSize: 10 });
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    view.setCurrent(4);
    expect(view.getCurrent()).toBe(4);

    const activeBtn = container.querySelector('.ds-pagination__item.is-active');
    expect(activeBtn).not.toBeNull();
    expect(activeBtn.textContent).toBe('4');
    view.destroy();
  });

  test('setTotal updates total and re-renders', () => {
    const view = Pagination({ total: 50, pageSize: 10 });
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    view.setTotal(100);
    const totalEl = container.querySelector('.ds-pagination__total');
    expect(totalEl.textContent).toContain('100');
    view.destroy();
  });

  test('setTotal adjusts current if beyond new total', () => {
    const view = Pagination({ total: 50, pageSize: 10, current: 5 });
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    view.setTotal(20); // Only 2 pages now
    expect(view.getCurrent()).toBe(2);
    view.destroy();
  });

  test('setPageSize resets to page 1', () => {
    const view = Pagination({ total: 100, pageSize: 10, current: 5 });
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    view.setPageSize(20);
    expect(view.getCurrent()).toBe(1);
    view.destroy();
  });
});

// ─── Destroy ─────────────────────────────────────────────────────────────────

describe('Pagination destroy', () => {
  test('cleans up on destroy', () => {
    const view = Pagination({ total: 50, pageSize: 10 });
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    // Should not throw
    view.destroy();
  });
});
