// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Collapse (accordion) component built on the 2.0 reactive core.
 *
 * Reuses the existing `ds-collapse` CSS classes for styling.
 *
 * ```js
 * import { html } from '@kupola/core';
 * import { Collapse } from '@kupola/components/collapse';
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

import { html } from '@kupola/core';
import { render } from '@kupola/core';

/**
 * Create a Collapse component instance.
 *
 * @param {Object}   [options]
 * @param {Array<{key:string, title:string, content?:import('@kupola/core').TemplateResult|string}>} [options.items]
 * @param {boolean}  [options.accordion]   Only one panel open at a time (default false)
 * @param {string[]} [options.defaultOpen] Keys of initially open panels
 * @param {Function} [options.onChange]     Callback: (activeKeys: string[]) => void
 * @param {Function} [options.onSelect]     Callback for non-expandable item clicks: (item) => void
 * @returns {{ element: DocumentFragment, toggle: Function, open: Function, close: Function, getActiveKeys: Function, destroy: Function }}
 */
export function Collapse(options = {}) {
  const {
    items = [],
    accordion = false,
    defaultOpen = [],
    onChange = null,
    onSelect = null,
  } = options;

  /** @type {Set<string>} */
  const activeKeys = new Set(defaultOpen);

  // ── Public API ─────────────────────────────────────────────────────────────

  function toggle(key) {
    if (activeKeys.has(key)) {
      activeKeys.delete(key);
    } else {
      if (accordion) {activeKeys.clear();}
      activeKeys.add(key);
    }
    _syncDOM();
    _notify();
  }

  function open(key) {
    if (activeKeys.has(key)) {return;}
    if (accordion) {activeKeys.clear();}
    activeKeys.add(key);
    _syncDOM();
    _notify();
  }

  function close(key) {
    if (!activeKeys.has(key)) {return;}
    activeKeys.delete(key);
    _syncDOM();
    _notify();
  }

  function getActiveKeys() {
    return [ ...activeKeys ];
  }

  function _notify() {
    if (onChange) {onChange(getActiveKeys());}
  }

  function _hasContent(item) {
    return !!(item?.content && (typeof item.content !== 'string' || item.content.length > 0));
  }

  // ── DOM sync ───────────────────────────────────────────────────────────────

  /** @type {Map<string, Element>} */
  const itemEls = new Map();

  function _syncDOM() {
    for (const [ key, el ] of itemEls) {
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
    const hasContent = _hasContent(item);
    return html`
      <div class="ds-collapse__item${isActive ? ' is-active' : ''}" data-key="${item.key}">
        <div class="ds-collapse__header">
          <span class="ds-collapse__title">${item.title}</span>
          ${hasContent ? html`
            <svg class="ds-collapse__icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          ` : ''}
        </div>
        ${hasContent ? html`<div class="ds-collapse__content"></div>` : ''}
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
    els.forEach((el, index) => {
      const key = el.getAttribute('data-key');
      if (key) {
        itemEls.set(key, el);
        const header = el.querySelector('.ds-collapse__header');
        if (header) {
          header.addEventListener('click', () => {
            const item = items[index];
            if (_hasContent(item)) {
              toggle(key);
              return;
            }
            if (onSelect) {
              onSelect(item);
            }
          });
        }
        const contentEl = el.querySelector('.ds-collapse__content');
        if (contentEl && items[index]) {
          const content = items[index].content;
          if (content && typeof content === 'object') {
            if (content.strings && content.values) {
              render(content, contentEl);
            } else if (content.element) {
              contentEl.appendChild(content.element);
            } else if (Array.isArray(content)) {
              content.forEach(item => {
                if (item && item.strings && item.values) {
                  render(item, contentEl);
                } else {
                  contentEl.textContent += String(item);
                }
              });
            }
          } else if (typeof content === 'string') {
            contentEl.textContent = content;
          }
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
