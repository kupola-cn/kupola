// SPDX-License-Identifier: MIT
/**
 * Bounded pagination with stable delegated events.
 *
 * @module components/pagination
 */

import { html } from '@kupola/platform/template';
import { render } from '@kupola/platform/render';
import { getIconTemplate } from './icon-helper';
import { createListenerRegistry } from './listener-registry';

function nonNegativeInteger(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.floor(number)) : fallback;
}

function positiveInteger(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.floor(number) : fallback;
}

function normalizePageSizes(value, current) {
  const source = Array.isArray(value) ? value : [ 10, 20, 50, 100 ];
  const seen = new Set();
  const sizes = [];
  for (const item of source) {
    const size = positiveInteger(item, 0);
    if (!size || seen.has(size)) {continue;}
    seen.add(size);
    sizes.push(size);
  }
  if (!seen.has(current)) {sizes.unshift(current);}
  return sizes;
}

export function Pagination(options = {}) {
  const onChange = typeof options.onChange === 'function' ? options.onChange : null;
  const showTotal = options.showTotal !== false;
  const showSizeChanger = options.showSizeChanger === true;
  const maxPages = positiveInteger(options.maxPages, 7);
  const listeners = createListenerRegistry();
  let total = nonNegativeInteger(options.total, 0);
  let pageSize = positiveInteger(options.pageSize, 10);
  let current = positiveInteger(options.current, 1);
  let pageSizes = normalizePageSizes(options.pageSizeOptions, pageSize);
  let viewInstance = null;
  let destroyed = false;

  const container = document.createDocumentFragment();
  const wrapper = document.createElement('div');
  container.appendChild(wrapper);

  function totalPages() {
    return Math.max(1, Math.ceil(total / pageSize));
  }

  current = Math.min(current, totalPages());

  function pageRange() {
    const count = totalPages();
    const visible = Math.min(maxPages, count);
    const half = Math.floor(visible / 2);
    let start = Math.max(1, current - half);
    let end = Math.min(count, start + visible - 1);
    start = Math.max(1, end - visible + 1);

    const pages = [];
    for (let page = start; page <= end; page++) {pages.push(page);}
    return pages;
  }

  function buildTemplate() {
    const count = totalPages();
    const pageButtons = pageRange().map(page => {
      const active = page === current;
      return html`
        <button
          class="ds-pagination__item${active ? ' is-active' : ''}"
          type="button"
          data-page="${page}"
          aria-label="Page ${page}"
          aria-current="${active ? 'page' : null}"
        >${page}</button>
      `;
    });
    const sizeOptions = pageSizes.map(size => html`
      <option value="${size}" selected="${size === pageSize}">${size} / page</option>
    `);

    return html`
      <nav class="ds-pagination" aria-label="Pagination">
        ${showTotal ? html`<span class="ds-pagination__total">Total ${total} items</span>` : ''}
        ${showSizeChanger ? html`
          <label class="ds-pagination__size-label">
            <span class="ds-visually-hidden">Items per page</span>
            <select class="ds-pagination__size" aria-label="Items per page">${sizeOptions}</select>
          </label>
        ` : ''}
        <button
          class="ds-pagination__item ds-pagination__prev"
          type="button"
          data-action="previous"
          disabled="${current <= 1}"
          aria-label="Previous"
        >${getIconTemplate('chevron-left')}</button>
        ${pageButtons}
        <button
          class="ds-pagination__item ds-pagination__next"
          type="button"
          data-action="next"
          disabled="${current >= count}"
          aria-label="Next"
        >${getIconTemplate('chevron-right')}</button>
      </nav>
    `;
  }

  function rerender() {
    if (destroyed) {return;}
    viewInstance?.destroy();
    const fragment = document.createDocumentFragment();
    viewInstance = render(buildTemplate(), fragment);
    wrapper.replaceChildren(fragment);
  }

  function setCurrent(value) {
    if (destroyed) {return false;}
    const page = positiveInteger(value, 0);
    if (!page) {return false;}
    const next = Math.min(page, totalPages());
    if (next === current) {return false;}
    current = next;
    rerender();
    onChange?.(current, pageSize);
    return true;
  }

  function setTotal(value) {
    if (destroyed) {return false;}
    const nextTotal = nonNegativeInteger(value, -1);
    if (nextTotal < 0 || nextTotal === total) {return false;}
    total = nextTotal;
    const nextCurrent = Math.min(current, totalPages());
    const currentChanged = nextCurrent !== current;
    current = nextCurrent;
    rerender();
    if (currentChanged) {onChange?.(current, pageSize);}
    return true;
  }

  function setPageSize(value) {
    if (destroyed) {return false;}
    const nextSize = positiveInteger(value, 0);
    if (!nextSize || nextSize === pageSize) {return false;}
    pageSize = nextSize;
    current = 1;
    pageSizes = normalizePageSizes(pageSizes, pageSize);
    rerender();
    onChange?.(current, pageSize);
    return true;
  }

  function getCurrent() {
    return current;
  }

  function getTotal() {
    return total;
  }

  function getPageSize() {
    return pageSize;
  }

  listeners.on(wrapper, 'click', event => {
    const button = event.target?.closest?.('button');
    if (!button || !wrapper.contains(button) || button.disabled) {return;}
    const page = Number(button.dataset.page);
    if (Number.isInteger(page) && page > 0) {
      setCurrent(page);
    } else if (button.dataset.action === 'previous') {
      setCurrent(current - 1);
    } else if (button.dataset.action === 'next') {
      setCurrent(current + 1);
    }
  });
  listeners.on(wrapper, 'change', event => {
    if (event.target?.matches?.('.ds-pagination__size')) {
      setPageSize(event.target.value);
    }
  });

  rerender();

  return {
    get element() { return container; },
    setCurrent,
    setTotal,
    setPageSize,
    getCurrent,
    getTotal,
    getPageSize,
    destroy() {
      if (destroyed) {return;}
      destroyed = true;
      listeners.destroy();
      viewInstance?.destroy();
      viewInstance = null;
    },
  };
}
