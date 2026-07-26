// SPDX-License-Identifier: MIT
/**
 * Accessible collapse/accordion component with deterministic child teardown.
 *
 * @module components/collapse
 */

import { html } from '@kupola/platform/template';
import { isTemplateResultLike, render } from '@kupola/platform/render';
import { getIconTemplate } from './icon-helper';
import { createListenerRegistry } from './listener-registry';

let collapseId = 0;

function normalizeItems(value) {
  if (!Array.isArray(value)) {return [];}

  const keys = new Set();
  return value.filter(item => {
    const validKey = typeof item?.key === 'string'
      || (typeof item?.key === 'number' && Number.isFinite(item.key));
    if (!validKey || keys.has(item.key)) {return false;}
    keys.add(item.key);
    return true;
  });
}

export function Collapse(options = {}) {
  const items = normalizeItems(options.items);
  const accordion = options.accordion === true;
  const onChange = typeof options.onChange === 'function' ? options.onChange : null;
  const onSelect = typeof options.onSelect === 'function' ? options.onSelect : null;
  const listeners = createListenerRegistry();
  const id = ++collapseId;

  let destroyed = false;
  const contentInstances = [];

  function hasContent(item) {
    return item?.content !== undefined && item.content !== null && item.content !== '';
  }

  function findExpandableItem(key) {
    return items.find(item => item.key === key && !item.disabled && hasContent(item));
  }

  const requestedOpen = Array.isArray(options.defaultOpen) ? options.defaultOpen : [];
  const initialOpen = requestedOpen.filter(key => !!findExpandableItem(key));
  const activeKeys = new Set(accordion ? initialOpen.slice(0, 1) : initialOpen);

  const itemTemplates = items.map((item, index) => {
    const expandable = hasContent(item);
    const isActive = activeKeys.has(item.key);
    const headerId = `ds-collapse-${id}-header-${index}`;
    const panelId = `ds-collapse-${id}-panel-${index}`;
    return html`
      <div class="ds-collapse__item${isActive ? ' is-active' : ''}" data-index="${index}">
        <button
          class="ds-collapse__header"
          type="button"
          id="${headerId}"
          data-collapse-index="${index}"
          disabled="${!!item.disabled}"
          aria-disabled="${String(!!item.disabled)}"
          aria-expanded="${expandable ? String(isActive) : null}"
          aria-controls="${expandable ? panelId : null}"
        >
          <span class="ds-collapse__title">${item.title ?? item.key}</span>
          ${expandable ? html`
            <span class="ds-collapse__icon" aria-hidden="true">${getIconTemplate('chevron-down')}</span>
          ` : ''}
        </button>
        ${expandable ? html`
          <div
            class="ds-collapse__content"
            id="${panelId}"
            role="region"
            aria-labelledby="${headerId}"
            hidden="${!isActive}"
          ></div>
        ` : ''}
      </div>
    `;
  });

  const container = document.createDocumentFragment();
  const instance = render(html`<div class="ds-collapse">${itemTemplates}</div>`, container);
  const root = container.querySelector('.ds-collapse');
  const itemElements = [ ...root.querySelectorAll('.ds-collapse__item') ];

  function registerContentInstance(contentInstance) {
    if (contentInstance && typeof contentInstance.destroy === 'function') {
      contentInstances.push(contentInstance);
    }
  }

  function mountContent(value, target) {
    if (value === undefined || value === null) {return;}
    if (Array.isArray(value)) {
      value.forEach(entry => mountContent(entry, target));
      return;
    }
    if (typeof Node !== 'undefined' && value instanceof Node) {
      target.appendChild(value);
      return;
    }
    if (value && typeof value === 'object'
      && typeof Node !== 'undefined' && value.element instanceof Node) {
      target.appendChild(value.element);
      registerContentInstance(value);
      return;
    }
    if (isTemplateResultLike(value)) {
      registerContentInstance(render(value, target));
      return;
    }
    registerContentInstance(render(html`${value}`, target));
  }

  itemElements.forEach((element, index) => {
    const target = element.querySelector('.ds-collapse__content');
    if (target) {mountContent(items[index].content, target);}
  });

  function syncDOM() {
    itemElements.forEach((element, index) => {
      const isActive = activeKeys.has(items[index].key);
      const header = element.querySelector('.ds-collapse__header');
      const panel = element.querySelector('.ds-collapse__content');
      element.classList.toggle('is-active', isActive);
      if (panel) {
        header.setAttribute('aria-expanded', String(isActive));
        panel.hidden = !isActive;
      }
    });
  }

  function notify() {
    onChange?.([ ...activeKeys ]);
  }

  function toggle(key) {
    if (destroyed || !findExpandableItem(key)) {return;}
    if (activeKeys.has(key)) {
      activeKeys.delete(key);
    } else {
      if (accordion) {activeKeys.clear();}
      activeKeys.add(key);
    }
    syncDOM();
    notify();
  }

  function open(key) {
    if (destroyed || activeKeys.has(key) || !findExpandableItem(key)) {return;}
    if (accordion) {activeKeys.clear();}
    activeKeys.add(key);
    syncDOM();
    notify();
  }

  function close(key) {
    if (destroyed || !activeKeys.delete(key)) {return;}
    syncDOM();
    notify();
  }

  function getActiveKeys() {
    return [ ...activeKeys ];
  }

  listeners.on(root, 'click', event => {
    const header = event.target?.closest?.('[data-collapse-index]');
    if (!header || !root.contains(header)) {return;}
    const index = Number(header.getAttribute('data-collapse-index'));
    if (!Number.isInteger(index) || index < 0 || index >= items.length) {return;}

    const item = items[index];
    if (item.disabled) {return;}
    if (hasContent(item)) {
      toggle(item.key);
    } else {
      onSelect?.(item);
    }
  });

  return {
    get element() { return container; },
    toggle,
    open,
    close,
    getActiveKeys,
    destroy() {
      if (destroyed) {return;}
      destroyed = true;
      listeners.destroy();

      let firstError;
      for (const contentInstance of contentInstances.splice(0)) {
        try {contentInstance.destroy();} catch (error) {if (!firstError) {firstError = error;}}
      }
      try {instance.destroy();} catch (error) {if (!firstError) {firstError = error;}}
      if (firstError) {throw firstError;}
    },
  };
}
