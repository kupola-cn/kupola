// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Collapse (accordion) component built on the 2.0 reactive core.
 *
 * Reuses the existing `ds-collapse` CSS classes for styling.
 *
 * ```js
 * import { html } from '@kupola/core';
 * import { Collapse } from '@kupola/core/components/collapse';
 *
 * const view = Collapse({
 *   items: [
 *     { key: 'a', title: 'Section A', content: html`<p>Content A</p>` },
 *     { key: 'b', title: 'Section B', content: html`<p>Content B</p>` },
 *   ],
 *   accordion: true,
 * });
 * container.appendChild(view.element);
 * ```
 *
 * @module components/collapse
 */

import { html } from '../template.js';
import { render } from '../render.js';

/**
 * Create a Collapse component instance.
 *
 * @param {Object}   [options]
 * @param {Array<{key:string, title:string, content:TemplateResult|string}>} [options.items]
 * @param {boolean}  [options.accordion]   Only one panel open at a time (default false)
 * @param {string[]} [options.defaultOpen] Keys of initially open panels
 * @param {Function} [options.onChange]     Callback: (activeKeys: string[]) => void
 * @returns {{ element: DocumentFragment, toggle: Function, open: Function, close: Function, getActiveKeys: Function, destroy: Function }}
 */
export function Collapse(options = {}) {
  const {
    items = [],
    accordion = false,
    defaultOpen = [],
    onChange = null,
  } = options;

  /** @type {Set<string>} */
  const activeKeys = new Set(defaultOpen);

  // ── Public API ─────────────────────────────────────────────────────────────

  function toggle(key) {
    if (activeKeys.has(key)) {
      activeKeys.delete(key);
    } else {
      if (accordion) activeKeys.clear();
      activeKeys.add(key);
    }
    _syncDOM();
    _notify();
  }

  function open(key) {
    if (activeKeys.has(key)) return;
    if (accordion) activeKeys.clear();
    activeKeys.add(key);
    _syncDOM();
    _notify();
  }

  function close(key) {
    if (!activeKeys.has(key)) return;
    activeKeys.delete(key);
    _syncDOM();
    _notify();
  }

  function getActiveKeys() {
    return [...activeKeys];
  }

  function _notify() {
    if (onChange) onChange(getActiveKeys());
  }

  // ── DOM sync ───────────────────────────────────────────────────────────────

  /** @type {Map<string, Element>} */
  const itemEls = new Map();

  function _syncDOM() {
    for (const [key, el] of itemEls) {
      if (activeKeys.has(key)) {
        el.classList.add('is-active');
      } else {
        el.classList.remove('is-active');
      }
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const itemTemplates = items.map((item) => {
    const isActive = activeKeys.has(item.key);
    return html`
      <div class="ds-collapse__item${isActive ? ' is-active' : ''}" data-key="${item.key}">
        <div class="ds-collapse__header">
          <span class="ds-collapse__title">${item.title}</span>
          <svg class="ds-collapse__icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
        <div class="ds-collapse__content">${item.content}</div>
      </div>
    `;
  });

  const tpl = html`<div class="ds-collapse">${itemTemplates}</div>`;

  const container = document.createDocumentFragment();
  const instance = render(tpl, container);

  // Grab references to collapse items and bind click handlers
  const collapseEl = container.querySelector('.ds-collapse');
  if (collapseEl) {
    const els = collapseEl.querySelectorAll('.ds-collapse__item');
    els.forEach((el) => {
      const key = el.getAttribute('data-key');
      if (key) {
        itemEls.set(key, el);
        const header = el.querySelector('.ds-collapse__header');
        if (header) {
          header.addEventListener('click', () => toggle(key));
        }
      }
    });
  }

  return {
    get element() { return container; },
    toggle,
    open,
    close,
    getActiveKeys,
    destroy() {
      itemEls.clear();
      instance.destroy();
    },
  };
}
