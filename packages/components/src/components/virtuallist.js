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

import { html } from '@kupola/core/template';
import { render } from '@kupola/core/render';

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
 * @returns {{ element: DocumentFragment, scrollTo: Function, destroy: Function }}
 */
export function VirtualList(options = {}) {
  const {
    items = [],
    itemHeight = 48,
    height = 400,
    overscan = 5,
    renderItem = null,
    onClick = null,
  } = options;

  let _scrollTop = 0;

  // ── Public API ─────────────────────────────────────────────────────────────

  function scrollTo(index) {
    if (!scrollEl) {return;}
    scrollEl.scrollTop = index * itemHeight;
  }

  function destroy() {
    if (scrollEl) {scrollEl.removeEventListener('scroll', _onScroll);}
    instance.destroy();
  }

  // ── Internal ───────────────────────────────────────────────────────────────

  function _onScroll() {
    if (scrollEl) {_scrollTop = scrollEl.scrollTop;}
    _renderVisible();
  }

  function _renderVisible() {
    if (!containerEl || !spacerEl) {return;}

    const totalHeight = items.length * itemHeight;
    spacerEl.style.height = `${totalHeight}px`;

    const startIdx = Math.max(0, Math.floor(_scrollTop / itemHeight) - overscan);
    const visibleCount = Math.ceil(height / itemHeight) + overscan * 2;
    const endIdx = Math.min(items.length, startIdx + visibleCount);

    // Clear existing items
    const existing = containerEl.querySelectorAll('.ds-virtual-list__item');
    existing.forEach((el) => el.remove());

    // Render visible items
    for (let i = startIdx; i < endIdx; i++) {
      const el = document.createElement('div');
      el.className = 'ds-virtual-list__item';
      el.style.position = 'absolute';
      el.style.top = `${i * itemHeight}px`;
      el.style.height = `${itemHeight}px`;
      el.style.width = '100%';

      if (renderItem) {
        el.textContent = renderItem(items[i], i);
      } else {
        const item = items[i];
        if (typeof item === 'string') {
          el.textContent = item;
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
        }
      }

      if (onClick) {
        el.addEventListener('click', () => onClick(items[i], i));
      }

      containerEl.appendChild(el);
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

  if (scrollEl) {
    scrollEl.style.height = `${height}px`;
    scrollEl.addEventListener('scroll', _onScroll);
  }

  // Initial render
  _renderVisible();

  return {
    get element() { return container; },
    scrollTo,
    destroy,
  };
}
