// SPDX-License-Identifier: MIT
/**
 * @kupola/core — VirtualList component built on the 2.0 reactive core.
 *
 * Reuses the existing `ds-virtual-list*` CSS classes for styling.
 *
 * ```js
 * import { VirtualList } from '@kupola/components/virtuallist';
 *
 * const items = Array.from({ length: 10000 }, (_, i) => ({
 *   title: `Item ${i + 1}`,
 *   subtitle: `Description for item ${i + 1}`,
 * }));
 *
 * const view = VirtualList({
 *   items,
 *   itemHeight: 48,
 *   height: 400,
 *   renderItem: (item) => item.title,
 * });
 * container.appendChild(view.element);
 * ```
 *
 * @module components/virtuallist
 */

import { html } from '@kupola/platform/template';
import { render } from '@kupola/platform/render';
import { createListenerRegistry } from './listener-registry';

/**
 * Create a VirtualList component instance.
 *
 * @param {Object}   [options]
 * @param {Array}    [options.items]       Data items array
 * @param {number}   [options.itemHeight]  Height of each item in px (default 48)
 * @param {number}   [options.height]      Visible height in px (default 400)
 * @param {number}   [options.overscan]    Extra items above/below viewport (default 5)
 * @param {Function} [options.renderItem]  Custom render function (item, index) => string
 * @param {Function} [options.onClick]     Callback when item clicked
 * @param {number}   [options.virtualThreshold]  Threshold for virtual scroll (default 200)
 * @returns {{ element: DocumentFragment, scrollTo: Function, destroy: Function }}
 */
export function VirtualList(options = {}) {
  const config = options && typeof options === 'object' ? options : {};
  let items = Array.isArray(config.items)
    ? [ ...config.items ]
    : (Array.isArray(config.data) ? [ ...config.data ] : []);
  const itemHeight = Number.isFinite(config.itemHeight) && config.itemHeight > 0
    ? config.itemHeight
    : 48;
  const height = Number.isFinite(config.height) && config.height > 0 ? config.height : 400;
  const overscan = Number.isFinite(config.overscan) && config.overscan >= 0
    ? Math.floor(config.overscan)
    : 5;
  const renderItem = typeof config.renderItem === 'function' ? config.renderItem : null;
  const onClick = typeof config.onClick === 'function'
    ? config.onClick
    : (typeof config.onItemClick === 'function' ? config.onItemClick : null);
  const virtualThreshold = Number.isFinite(config.virtualThreshold) && config.virtualThreshold >= 0
    ? Math.floor(config.virtualThreshold)
    : 200;

  let _scrollTop = 0;
  let _frame = null;
  let _destroyed = false;
  const listeners = createListenerRegistry();

  // Determine if virtual scroll should be used
  let useVirtual = items.length > virtualThreshold;
  const raf = typeof requestAnimationFrame === 'function'
    ? requestAnimationFrame
    : (fn) => setTimeout(fn, 0);
  const caf = typeof cancelAnimationFrame === 'function'
    ? cancelAnimationFrame
    : clearTimeout;

  // ── Public API ─────────────────────────────────────────────────────────────

  function scrollTo(index) {
    if (_destroyed || !scrollEl || items.length === 0) {return;}
    const numericIndex = Number(index);
    const nextIndex = Number.isFinite(numericIndex)
      ? Math.max(0, Math.min(items.length - 1, Math.trunc(numericIndex)))
      : 0;
    scrollEl.scrollTop = nextIndex * itemHeight;
    _scrollTop = scrollEl.scrollTop;
    if (useVirtual) {_scheduleRender();}
  }

  function destroy() {
    if (_destroyed) {return;}
    _destroyed = true;
    if (_frame != null) {
      caf(_frame);
      _frame = null;
    }
    listeners.destroy();
    instance.destroy();
  }

  function setData(data) {
    if (_destroyed) {return;}
    items = Array.isArray(data) ? [ ...data ] : [];
    useVirtual = items.length > virtualThreshold;
    _scrollTop = 0;
    if (scrollEl) {scrollEl.scrollTop = 0;}
    _renderVisible();
  }

  // ── Internal ───────────────────────────────────────────────────────────────

  function _onScroll() {
    if (scrollEl) {_scrollTop = scrollEl.scrollTop;}
    if (useVirtual) {_scheduleRender();}
  }

  function _scheduleRender() {
    if (_destroyed || _frame != null) {return;}
    _frame = raf(() => {
      _frame = null;
      _renderVisible();
    });
  }

  function _createItemElement(item, index) {
    const el = document.createElement('div');
    el.className = 'ds-virtual-list__item';

    if (useVirtual) {
      el.style.position = 'absolute';
      el.style.top = `${index * itemHeight}px`;
      el.style.height = `${itemHeight}px`;
      el.style.width = '100%';
    }

    if (renderItem) {
      const rendered = renderItem(item, index);
      if (rendered instanceof HTMLElement) {
        el.appendChild(rendered);
      } else {
        el.textContent = rendered != null ? String(rendered) : '';
      }
    } else {
      if (typeof item === 'string' || typeof item === 'number') {
        el.textContent = String(item);
      } else if (item && item.title) {
        const content = document.createElement('div');
        content.className = 'ds-virtual-list__item-content';
        const title = document.createElement('span');
        title.className = 'ds-virtual-list__item-title';
        title.textContent = item.title;
        content.appendChild(title);
        if (item.subtitle) {
          const sub = document.createElement('span');
          sub.className = 'ds-virtual-list__item-subtitle';
          sub.textContent = item.subtitle;
          content.appendChild(sub);
        }
        el.appendChild(content);
      } else if (item != null) {el.textContent = String(item);}
    }

    el.dataset.index = String(index);

    return el;
  }

  function _renderVisible() {
    if (_destroyed || !containerEl) {return;}

    const existing = containerEl.querySelectorAll('.ds-virtual-list__item');
    existing.forEach((el) => el.remove());

    // For small data sets, render all items directly without virtualization
    if (!useVirtual) {
      if (spacerEl) {spacerEl.style.height = '';}
      items.forEach((item, i) => {
        containerEl.appendChild(_createItemElement(item, i));
      });
      return;
    }

    if (!spacerEl) {return;}

    const totalHeight = items.length * itemHeight;
    spacerEl.style.height = `${totalHeight}px`;

    const startIdx = Math.max(0, Math.floor(_scrollTop / itemHeight) - overscan);
    const visibleCount = Math.ceil(height / itemHeight) + overscan * 2;
    const endIdx = Math.min(items.length, startIdx + visibleCount);

    // Render visible items
    for (let i = startIdx; i < endIdx; i++) {
      containerEl.appendChild(_createItemElement(items[i], i));
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const tpl = html`
    <div class="ds-virtual-list">
      <div class="ds-virtual-list__container">
        <div class="ds-virtual-list__spacer"></div>
      </div>
    </div>
  `;

  const container = document.createDocumentFragment();
  const instance = render(tpl, container);

  const scrollEl = container.querySelector('.ds-virtual-list');
  const containerEl = container.querySelector('.ds-virtual-list__container');
  const spacerEl = container.querySelector('.ds-virtual-list__spacer');

  const onItemClick = (e) => {
    if (!onClick) {return;}
    const itemEl = e.target.closest('.ds-virtual-list__item');
    if (!itemEl || !containerEl?.contains(itemEl)) {return;}
    const index = Number(itemEl.dataset.index);
    if (Number.isInteger(index) && index >= 0 && index < items.length) {
      onClick(items[index], index);
    }
  };

  if (scrollEl) {
    scrollEl.style.height = `${height}px`;
    listeners.on(scrollEl, 'scroll', _onScroll);
  }
  if (onClick && containerEl) {listeners.on(containerEl, 'click', onItemClick);}

  // Initial render
  _renderVisible();

  return {
    get element() { return container; },
    setData,
    scrollTo,
    destroy,
  };
}
