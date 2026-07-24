// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Timeline component built on the 2.0 reactive core.
 *
 * Reuses the existing `ds-timeline*` CSS classes for styling.
 *
 * ```js
 * import { Timeline } from '@kupola/components/timeline';
 *
 * const view = Timeline({
 *   items: [
 *     { title: 'Created', time: '2024-01-01', description: 'Item created' },
 *     { title: 'Updated', time: '2024-01-05' },
 *   ],
 * });
 * container.appendChild(view.element);
 * ```
 *
 * @module components/timeline
 */

import { html } from '@kupola/core/template';
import { render } from '@kupola/core/render';

/**
 * Create a Timeline component instance.
 *
 * @param {Object}   [options]
 * @param {Array}    [options.items]  Array of { title, time, description }
 * @returns {{ element: DocumentFragment, destroy: Function }}
 */
export function Timeline(options = {}) {
  const { items = [] } = options;

  // ── Public API ─────────────────────────────────────────────────────────────

  function destroy() {
    instance.destroy();
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const tpl = html`<div class="ds-timeline"></div>`;

  const container = document.createDocumentFragment();
  const instance = render(tpl, container);

  const timelineEl = container.querySelector('.ds-timeline');

  // Build timeline items via DOM (template escapes HTML)
  items.forEach((item) => {
    const itemEl = document.createElement('div');
    itemEl.className = 'ds-timeline__item';

    const markerEl = document.createElement('div');
    markerEl.className = 'ds-timeline__marker';
    itemEl.appendChild(markerEl);

    const contentEl = document.createElement('div');
    contentEl.className = 'ds-timeline__content';

    if (item.time) {
      const timeEl = document.createElement('div');
      timeEl.className = 'ds-timeline__time';
      timeEl.textContent = item.time;
      contentEl.appendChild(timeEl);
    }

    if (item.title) {
      const titleEl = document.createElement('div');
      titleEl.className = 'ds-timeline__title';
      titleEl.textContent = item.title;
      contentEl.appendChild(titleEl);
    }

    if (item.description) {
      const descEl = document.createElement('div');
      descEl.className = 'ds-timeline__description';
      descEl.textContent = item.description;
      contentEl.appendChild(descEl);
    }

    itemEl.appendChild(contentEl);
    timelineEl.appendChild(itemEl);
  });

  return {
    get element() { return container; },
    destroy,
  };
}
