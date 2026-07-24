// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Menu component built on the 2.0 reactive core.
 *
 * Reuses the existing `ds-menu*` CSS classes for styling.
 *
 * ```js
 * import { Menu } from '@kupola/components/menu';
 *
 * const view = Menu({
 *   items: [
 *     { label: 'Edit', shortcut: 'Ctrl+E', onClick: () => {} },
 *     { type: 'divider' },
 *     { label: 'Delete', danger: true, onClick: () => {} },
 *   ],
 * });
 * container.appendChild(view.element);
 * ```
 *
 * @module components/menu
 */

import { html } from '@kupola/core';
import { render } from '@kupola/core';

/**
 * Create a Menu component instance.
 *
 * @param {Object} [options]
 * @param {Array}  [options.items]  Menu items: { label, shortcut?, danger?, disabled?, icon?, onClick }
 *                                 or { type: 'divider' }
 * @param {Function} [options.onSelect]  Global callback when item selected
 * @returns {{ element: DocumentFragment, destroy: Function }}
 */
export function Menu(options = {}) {
  const { items = [], onSelect = null } = options;

  // ── Public API ─────────────────────────────────────────────────────────────

  function destroy() {
    instance.destroy();
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const tpl = html`<div class="ds-menu"></div>`;
  const container = document.createDocumentFragment();
  const instance = render(tpl, container);

  const menuEl = container.querySelector('.ds-menu');

  // Build menu items
  items.forEach((item) => {
    if (item.type === 'divider') {
      const divider = document.createElement('div');
      divider.className = 'ds-menu__divider';
      menuEl.appendChild(divider);
      return;
    }

    const el = document.createElement('div');
    el.className = 'ds-menu__item';
    if (item.danger) {el.classList.add('ds-menu__item--danger');}
    if (item.disabled) {
      el.style.opacity = '0.5';
      el.style.pointerEvents = 'none';
    }

    // Icon
    if (item.icon) {
      const iconEl = document.createElement('span');
      iconEl.className = 'icon';
      iconEl.textContent = item.icon;
      el.appendChild(iconEl);
    }

    // Label
    const labelEl = document.createElement('span');
    labelEl.textContent = item.label || '';
    el.appendChild(labelEl);

    // Shortcut
    if (item.shortcut) {
      const shortcutEl = document.createElement('span');
      shortcutEl.className = 'ds-menu__shortcut';
      shortcutEl.textContent = item.shortcut;
      el.appendChild(shortcutEl);
    }

    // Click handler
    if (!item.disabled && item.onClick) {
      el.addEventListener('click', () => item.onClick());
    }
    if (!item.disabled && onSelect) {
      el.addEventListener('click', () => onSelect(item));
    }

    menuEl.appendChild(el);
  });

  return {
    get element() { return container; },
    destroy,
  };
}
