// SPDX-License-Identifier: MIT
/**
 * Accessible tabs with dynamic item management and deterministic teardown.
 *
 * @module components/tabs
 */

import { html } from '@kupola/platform/template';
import { render } from '@kupola/platform/render';
import { getIconHtml } from './icon-helper';
import { createListenerRegistry } from './listener-registry';

let tabsId = 0;

function normalizeTabs(value) {
  if (!Array.isArray(value)) {return [];}

  const keys = new Set();
  const result = [];
  for (const candidate of value) {
    if (!candidate || typeof candidate !== 'object' || typeof candidate.key !== 'string') {
      continue;
    }
    if (keys.has(candidate.key)) {continue;}
    keys.add(candidate.key);
    result.push({ ...candidate });
  }
  return result;
}

/**
 * Create a Tabs component instance.
 *
 * `label`, `panels`, and `variant` are retained for backwards compatibility;
 * `title`, per-tab `content`, and `type` are their typed API counterparts.
 */
export function Tabs(options = {}) {
  const items = normalizeTabs(options.tabs);
  const panels = options.panels && typeof options.panels === 'object' ? options.panels : {};
  const onChange = typeof options.onChange === 'function' ? options.onChange : null;
  const onClose = typeof options.onClose === 'function' ? options.onClose : null;
  const selectedVariant = options.variant ?? options.type ?? 'line';
  const variant = selectedVariant === 'card' ? 'filled' : selectedVariant;
  const id = ++tabsId;
  const listeners = createListenerRegistry();

  let destroyed = false;
  let panelInstances = [];
  let tabElements = [];
  let panelElements = [];

  function findEnabledIndex(key) {
    return items.findIndex(item => item.key === key && !item.disabled);
  }

  function firstEnabledKey() {
    return items.find(item => !item.disabled)?.key ?? '';
  }

  const requestedActiveKey = typeof options.activeKey === 'string' ? options.activeKey : null;
  let activeKey = requestedActiveKey !== null && findEnabledIndex(requestedActiveKey) >= 0
    ? requestedActiveKey
    : firstEnabledKey();

  const container = document.createDocumentFragment();
  const instance = render(html`
    <div class="ds-tabs">
      <div class="ds-tabs__list" role="tablist"></div>
      <div class="ds-tabs__content"></div>
    </div>
  `, container);
  const root = container.querySelector('.ds-tabs');
  const list = root.querySelector('.ds-tabs__list');
  const content = root.querySelector('.ds-tabs__content');

  if (variant === 'filled') {root.classList.add('ds-tabs--filled');}
  if (variant === 'bordered') {root.classList.add('ds-tabs--bordered');}

  function destroyPanelInstances(instances = panelInstances) {
    let firstError;
    for (const panelInstance of instances) {
      try {
        panelInstance.destroy();
      } catch (error) {
        if (!firstError) {firstError = error;}
      }
    }
    instances.length = 0;
    if (firstError) {throw firstError;}
  }

  function getLabel(item) {
    return item.label ?? item.title ?? item.key;
  }

  function getPanelContent(item) {
    if (Object.prototype.hasOwnProperty.call(item, 'content')) {return item.content;}
    if (Object.prototype.hasOwnProperty.call(panels, item.key)) {return panels[item.key];}
    return '';
  }

  function syncDOM() {
    for (let index = 0; index < items.length; index++) {
      const isActive = items[index].key === activeKey;
      const tab = tabElements[index];
      const panel = panelElements[index];
      if (!tab || !panel) {continue;}

      tab.classList.toggle('is-active', isActive);
      tab.setAttribute('aria-selected', String(isActive));
      tab.tabIndex = isActive ? 0 : -1;
      panel.hidden = !isActive;
      panel.style.display = isActive ? '' : 'none';
    }
  }

  function renderItems() {
    const nextList = document.createDocumentFragment();
    const nextContent = document.createDocumentFragment();
    const nextTabElements = [];
    const nextPanelElements = [];
    const nextPanelInstances = [];

    try {
      items.forEach((item, index) => {
        const tabId = `ds-tabs-${id}-tab-${index}`;
        const panelId = `ds-tabs-${id}-panel-${index}`;
        const wrapper = document.createElement('span');
        wrapper.className = 'ds-tabs__tab';

        const tab = document.createElement('button');
        tab.type = 'button';
        tab.className = 'ds-tab';
        tab.id = tabId;
        tab.dataset.tabIndex = String(index);
        tab.setAttribute('role', 'tab');
        tab.setAttribute('aria-controls', panelId);
        tab.disabled = !!item.disabled;
        tab.setAttribute('aria-disabled', String(!!item.disabled));
        tab.textContent = String(getLabel(item));
        wrapper.appendChild(tab);

        if (item.closable) {
          const close = document.createElement('button');
          close.type = 'button';
          close.className = 'ds-tabs__close';
          close.dataset.closeIndex = String(index);
          close.disabled = !!item.disabled;
          close.setAttribute('aria-label', `Close ${getLabel(item)}`);
          close.innerHTML = getIconHtml('x');
          wrapper.appendChild(close);
        }

        const panel = document.createElement('div');
        panel.className = 'ds-tabs__panel';
        panel.id = panelId;
        panel.setAttribute('role', 'tabpanel');
        panel.setAttribute('aria-labelledby', tabId);

        const panelContent = getPanelContent(item);
        if (typeof Node !== 'undefined' && panelContent instanceof Node) {
          panel.appendChild(panelContent);
        } else {
          nextPanelInstances.push(render(html`${panelContent}`, panel));
        }

        nextTabElements.push(tab);
        nextPanelElements.push(panel);
        nextList.appendChild(wrapper);
        nextContent.appendChild(panel);
      });
    } catch (error) {
      try {destroyPanelInstances(nextPanelInstances);} catch {
        // Preserve the render error after best-effort cleanup.
      }
      throw error;
    }

    destroyPanelInstances();
    list.replaceChildren(nextList);
    content.replaceChildren(nextContent);
    panelInstances = nextPanelInstances;
    tabElements = nextTabElements;
    panelElements = nextPanelElements;
    syncDOM();
  }

  function setActive(key) {
    if (destroyed || typeof key !== 'string' || key === activeKey) {return;}
    if (findEnabledIndex(key) < 0) {return;}
    activeKey = key;
    syncDOM();
    onChange?.(key);
  }

  function getActive() {
    return activeKey;
  }

  function addTab(tab) {
    if (destroyed) {return;}
    const normalized = normalizeTabs([ tab ])[0];
    if (!normalized || items.some(item => item.key === normalized.key)) {return;}

    items.push(normalized);
    if (!activeKey && !normalized.disabled) {activeKey = normalized.key;}
    renderItems();
  }

  function removeTab(key) {
    if (destroyed || typeof key !== 'string') {return;}
    const index = items.findIndex(item => item.key === key);
    if (index < 0) {return;}

    const wasActive = activeKey === key;
    items.splice(index, 1);
    if (wasActive) {
      const replacement = items.slice(index).find(item => !item.disabled)
        ?? [ ...items.slice(0, index) ].reverse().find(item => !item.disabled);
      activeKey = replacement?.key ?? '';
    }
    renderItems();
    onClose?.(key);
    if (wasActive && activeKey) {onChange?.(activeKey);}
  }

  function getEventIndex(target, attribute) {
    const element = target?.closest?.(`[${attribute}]`);
    if (!element || !list.contains(element)) {return -1;}
    const index = Number(element.getAttribute(attribute));
    return Number.isInteger(index) && index >= 0 && index < items.length ? index : -1;
  }

  listeners.on(list, 'click', event => {
    const closeIndex = getEventIndex(event.target, 'data-close-index');
    if (closeIndex >= 0) {
      removeTab(items[closeIndex].key);
      return;
    }

    const index = getEventIndex(event.target, 'data-tab-index');
    if (index >= 0) {setActive(items[index].key);}
  });

  listeners.on(list, 'keydown', event => {
    const currentIndex = getEventIndex(event.target, 'data-tab-index');
    if (currentIndex < 0) {return;}

    const enabledIndexes = items
      .map((item, index) => item.disabled ? -1 : index)
      .filter(index => index >= 0);
    if (enabledIndexes.length === 0) {return;}

    const position = enabledIndexes.indexOf(currentIndex);
    let nextIndex = -1;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      nextIndex = enabledIndexes[(position + 1) % enabledIndexes.length];
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      nextIndex = enabledIndexes[(position - 1 + enabledIndexes.length) % enabledIndexes.length];
    } else if (event.key === 'Home') {
      nextIndex = enabledIndexes[0];
    } else if (event.key === 'End') {
      nextIndex = enabledIndexes[enabledIndexes.length - 1];
    }

    if (nextIndex < 0) {return;}
    event.preventDefault();
    setActive(items[nextIndex].key);
    tabElements[nextIndex]?.focus();
  });

  renderItems();

  const api = {
    get element() { return container; },
    setActive,
    getActive,
    addTab,
    removeTab,
    destroy() {
      if (destroyed) {return;}
      destroyed = true;
      listeners.destroy();
      tabElements = [];
      panelElements = [];
      let firstError;
      try {destroyPanelInstances();} catch (error) {firstError = error;}
      try {instance.destroy();} catch (error) {if (!firstError) {firstError = error;}}
      Object.freeze(api);
      if (firstError) {throw firstError;}
    },
  };

  return api;
}
