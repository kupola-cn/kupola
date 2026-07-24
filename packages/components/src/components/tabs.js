// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Tabs component built on the 2.0 reactive core.
 *
 * Reuses the existing `ds-tabs` / `ds-tab` CSS classes for styling.
 *
 * ```js
 * import { html } from '@kupola/core';
 * import { Tabs } from '@kupola/components/tabs';
 *
 * const view = Tabs({
 *   tabs: [
 *     { key: 'a', label: 'Tab A' },
 *     { key: 'b', label: 'Tab B' },
 *   ],
 *   panels: {
 *     a: html`<p>Panel A</p>`,
 *     b: html`<p>Panel B</p>`,
 *   },
 *   activeKey: 'a',
 *   onChange: (key) => console.log(key),
 * });
 * container.appendChild(view.element);
 * ```
 *
 * @module components/tabs
 */

import { html } from '@kupola/core';
import { render } from '@kupola/core';

/**
 * Create a Tabs component instance.
 *
 * @param {Object}   [options]
 * @param {Array<{key:string, label:string}>} [options.tabs]    Tab definitions
 * @param {Object<string, TemplateResult|string>} [options.panels]  Panel content by key
 * @param {string}   [options.activeKey]   Initially active tab key (default: first tab)
 * @param {string}   [options.variant]     'line' (default) or 'filled'
 * @param {Function} [options.onChange]     Callback: (key: string) => void
 * @returns {{ element: DocumentFragment, setActive: Function, getActive: Function, destroy: Function }}
 */
export function Tabs(options = {}) {
  const {
    tabs = [],
    panels = {},
    activeKey = tabs.length > 0 ? tabs[0].key : '',
    variant = 'line',
    onChange = null,
  } = options;

  let _activeKey = activeKey;

  // ── Public API ─────────────────────────────────────────────────────────────

  function setActive(key) {
    if (_activeKey === key) {return;}
    _activeKey = key;
    _syncDOM();
    if (onChange) {onChange(key);}
  }

  function getActive() {
    return _activeKey;
  }

  // ── DOM sync ───────────────────────────────────────────────────────────────

  /** @type {Map<string, { tab: Element, panel: Element }>} */
  const elMap = new Map();

  function _syncDOM() {
    for (const [ key, { tab, panel } ] of elMap) {
      if (key === _activeKey) {
        tab.classList.add('is-active');
        panel.style.display = '';
      } else {
        tab.classList.remove('is-active');
        panel.style.display = 'none';
      }
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const tabButtons = tabs.map(
    (tab) => html`<button class="ds-tab" data-key="${tab.key}">${tab.label}</button>`,
  );

  const panelEls = tabs.map((tab) => {
    const content = panels[tab.key] || '';
    const isHidden = tab.key !== _activeKey;
    return html`<div class="ds-tabs__panel" data-key="${tab.key}" style="${isHidden ? 'display: none' : ''}">${content}</div>`;
  });

  const tabsClass = variant === 'filled' ? 'ds-tabs ds-tabs--filled' : 'ds-tabs';

  const tpl = html`
    <div class="${tabsClass}">
      <div class="ds-tabs__list">${tabButtons}</div>
      <div class="ds-tabs__content">${panelEls}</div>
    </div>
  `;

  const container = document.createDocumentFragment();
  const instance = render(tpl, container);

  // Grab references and bind click handlers
  const tabsEl = container.querySelector('.ds-tabs');
  if (tabsEl) {
    const tabEls = tabsEl.querySelectorAll('.ds-tab');
    const panelDivs = tabsEl.querySelectorAll('.ds-tabs__panel');

    tabEls.forEach((tabEl) => {
      const key = tabEl.getAttribute('data-key');
      if (!key) {return;}

      const panelEl = [ ...panelDivs ].find((p) => p.getAttribute('data-key') === key);
      if (panelEl) {
        elMap.set(key, { tab: tabEl, panel: panelEl });
      }

      tabEl.addEventListener('click', () => setActive(key));
    });
  }

  // Initial sync
  _syncDOM();

  return {
    get element() { return container; },
    setActive,
    getActive,
    destroy() {
      elMap.clear();
      instance.destroy();
    },
  };
}
