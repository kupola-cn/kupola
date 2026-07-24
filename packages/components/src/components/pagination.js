// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Pagination component built on the 2.0 reactive core.
 *
 * Reuses the existing `ds-pagination-*` CSS classes for styling.
 *
 * ```js
 * import { Pagination } from '@kupola/components/pagination';
 *
 * const view = Pagination({
 *   total: 100,
 *   pageSize: 10,
 *   current: 1,
 *   onChange: (page) => console.log('Page:', page),
 * });
 * container.appendChild(view.element);
 * ```
 *
 * @module components/pagination
 */

import { html } from '@kupola/platform/template';
import { render } from '@kupola/platform/render';
import { getIconHtml } from './icon-helper';

/**
 * Create a Pagination component instance.
 *
 * @param {Object}   [options]
 * @param {number}   [options.total]      Total item count
 * @param {number}   [options.pageSize]   Items per page (default 10)
 * @param {number}   [options.current]    Current page (default 1)
 * @param {number}   [options.maxPages]   Max visible page buttons (default 7)
 * @param {boolean}  [options.showTotal]  Show total count text
 * @param {Function} [options.onChange]    Callback: (page, pageSize) => void
 * @returns {{ element: DocumentFragment, setCurrent: Function, setTotal: Function, setPageSize: Function, getCurrent: Function, destroy: Function }}
 */
export function Pagination(options = {}) {
  const {
    total: initialTotal = 0,
    pageSize: initialPageSize = 10,
    current: initialCurrent = 1,
    maxPages = 7,
    showTotal = true,
    onChange = null,
  } = options;

  let _current = initialCurrent;
  let _total = initialTotal;
  let _pageSize = initialPageSize;
  let _lastInstance = null;

  // ── Computed ───────────────────────────────────────────────────────────────

  function _totalPages() {
    return Math.max(1, Math.ceil(_total / _pageSize));
  }

  function _pageRange() {
    const tp = _totalPages();
    const half = Math.floor(maxPages / 2);
    let start = Math.max(1, _current - half);
    let end = Math.min(tp, start + maxPages - 1);
    if (end - start < maxPages - 1) {
      start = Math.max(1, end - maxPages + 1);
    }
    const pages = [];
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  function setCurrent(page) {
    page = Math.max(1, Math.min(page, _totalPages()));
    if (page === _current) {return;}
    _current = page;
    if (onChange) {onChange(page, _pageSize);}
    _rerender();
  }

  function setTotal(total) {
    _total = total;
    if (_current > _totalPages()) {
      _current = _totalPages();
    }
    _rerender();
  }

  function setPageSize(size) {
    _pageSize = size;
    _current = 1;
    _rerender();
  }

  function getCurrent() {
    return _current;
  }

  // ── Internal ───────────────────────────────────────────────────────────────

  function _buildTemplate() {
    const tp = _totalPages();
    const pages = _pageRange();
    const isFirst = _current <= 1;
    const isLast = _current >= tp;

    const pageButtons = pages.map((p) => {
      const isActive = p === _current;
      return html`<button class="ds-pagination__item${isActive ? ' is-active' : ''}" ${isActive ? 'aria-current="page"' : ''} data-page="${p}">${p}</button>`;
    });

    const totalText = showTotal
      ? html`<span class="ds-pagination__total">Total ${_total} items</span>`
      : '';

    return html`
      <nav class="ds-pagination">
        ${totalText}
        <button class="ds-pagination__item ds-pagination__prev" ${isFirst ? 'disabled' : ''} aria-label="Previous">
          ${getIconHtml('chevron-left')}
        </button>
        ${pageButtons}
        <button class="ds-pagination__item ds-pagination__next" ${isLast ? 'disabled' : ''} aria-label="Next">
          ${getIconHtml('chevron-right')}
        </button>
      </nav>
    `;
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const container = document.createDocumentFragment();
  const wrapEl = document.createElement('div');
  container.appendChild(wrapEl);

  function _rerender() {
    if (_lastInstance) {_lastInstance.destroy();}
    const tpl = _buildTemplate();
    const frag = document.createDocumentFragment();
    _lastInstance = render(tpl, frag);
    wrapEl.innerHTML = '';
    wrapEl.appendChild(frag);
    _bindClicks();
  }

  function _bindClicks() {
    const nav = wrapEl.querySelector('.ds-pagination');
    if (!nav) {return;}

    // Prev button
    const prevBtn = nav.querySelector('.ds-pagination__prev');
    if (prevBtn && !prevBtn.hasAttribute('disabled')) {
      prevBtn.addEventListener('click', () => { setCurrent(_current - 1); });
    }

    // Next button
    const nextBtn = nav.querySelector('.ds-pagination__next');
    if (nextBtn && !nextBtn.hasAttribute('disabled')) {
      nextBtn.addEventListener('click', () => { setCurrent(_current + 1); });
    }

    // Page buttons
    const pageBtns = nav.querySelectorAll('.ds-pagination__item[data-page]');
    pageBtns.forEach((btn) => {
      const page = parseInt(btn.getAttribute('data-page'), 10);
      if (!isNaN(page)) {
        btn.addEventListener('click', () => { setCurrent(page); });
      }
    });
  }

  _rerender();

  return {
    get element() { return container; },
    setCurrent,
    setTotal,
    setPageSize,
    getCurrent,
    destroy() {
      if (_lastInstance) {_lastInstance.destroy();}
    },
  };
}
