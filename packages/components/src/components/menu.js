// SPDX-License-Identifier: MIT
/**
 * Accessible command menu with nested submenu and keyboard support.
 *
 * @module components/menu
 */

import { html } from '@kupola/platform/template';
import { render } from '@kupola/platform/render';
import { getIconHtml } from './icon-helper';
import { createListenerRegistry } from './listener-registry';

let menuId = 0;

function isDivider(item) {
  return item?.type === 'divider' || item?.divider === true;
}

function hasAncestor(ancestor, item) {
  for (let current = ancestor; current; current = current.parent) {
    if (current.item === item) {return true;}
  }
  return false;
}

export function Menu(options = {}) {
  const id = ++menuId;
  const listeners = createListenerRegistry();
  const onSelect = typeof options.onSelect === 'function' ? options.onSelect : null;
  const records = [];
  const rootRecords = [];
  let destroyed = false;

  const items = Array.isArray(options.items) ? options.items : [];
  const stack = items
    .map((item, index) => ({ item, parent: null, path: String(index), ancestor: null }))
    .reverse();

  while (stack.length > 0) {
    const entry = stack.pop();
    const item = entry.item;
    if (!item || typeof item !== 'object' || hasAncestor(entry.ancestor, item)) {continue;}

    const record = {
      item,
      parent: entry.parent,
      children: [],
      element: null,
      submenu: null,
      divider: isDivider(item),
      path: entry.path,
    };
    records.push(record);
    if (entry.parent) {entry.parent.children.push(record);} else {rootRecords.push(record);}

    const children = !record.divider && Array.isArray(item.children) ? item.children : [];
    const ancestor = { item, parent: entry.ancestor };
    for (let index = children.length - 1; index >= 0; index--) {
      stack.push({
        item: children[index],
        parent: record,
        path: `${entry.path}.${index}`,
        ancestor,
      });
    }
  }

  const container = document.createDocumentFragment();
  const instance = render(html`<div class="ds-menu" role="menu"></div>`, container);
  const root = container.querySelector('.ds-menu');
  const horizontal = options.mode === 'horizontal';
  if (horizontal) {root.classList.add('ds-menu--horizontal');}
  root.setAttribute('aria-orientation', horizontal ? 'horizontal' : 'vertical');

  const openRecords = new Set();
  let focusedRecord = rootRecords.find(record => !record.divider && !record.item.disabled) ?? null;

  for (const [ index, record ] of records.entries()) {
    const parent = record.parent?.submenu ?? root;
    if (record.divider) {
      const divider = document.createElement('div');
      divider.className = 'ds-menu__divider';
      divider.setAttribute('role', 'separator');
      parent.appendChild(divider);
      record.element = divider;
      continue;
    }

    const entry = document.createElement('div');
    entry.className = 'ds-menu__entry';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'ds-menu__item';
    button.dataset.menuIndex = String(index);
    button.setAttribute('role', 'menuitem');
    button.disabled = !!record.item.disabled;
    button.setAttribute('aria-disabled', String(!!record.item.disabled));
    if (record.item.danger) {button.classList.add('ds-menu__item--danger');}
    record.element = button;

    const content = document.createElement('span');
    content.className = 'ds-menu__content';
    if (record.item.icon) {
      const icon = document.createElement('span');
      icon.className = 'icon ds-menu__icon';
      icon.setAttribute('aria-hidden', 'true');
      const iconHtml = getIconHtml(record.item.icon);
      if (iconHtml) {icon.innerHTML = iconHtml;} else {icon.textContent = String(record.item.icon);}
      content.appendChild(icon);
    }
    const label = document.createElement('span');
    label.className = 'ds-menu__label';
    label.textContent = String(record.item.label ?? '');
    content.appendChild(label);
    button.appendChild(content);

    if (record.item.shortcut) {
      const shortcut = document.createElement('span');
      shortcut.className = 'ds-menu__shortcut';
      shortcut.textContent = String(record.item.shortcut);
      button.appendChild(shortcut);
    }

    if (record.children.length > 0) {
      const submenuId = `ds-menu-${id}-submenu-${index}`;
      const indicator = document.createElement('span');
      indicator.className = 'ds-menu__submenu-indicator';
      indicator.setAttribute('aria-hidden', 'true');
      indicator.innerHTML = getIconHtml('chevron-right');
      button.appendChild(indicator);
      button.setAttribute('aria-haspopup', 'menu');
      button.setAttribute('aria-expanded', 'false');
      button.setAttribute('aria-controls', submenuId);

      const submenu = document.createElement('div');
      submenu.className = 'ds-menu ds-menu__submenu';
      submenu.id = submenuId;
      submenu.setAttribute('role', 'menu');
      submenu.setAttribute('aria-orientation', 'vertical');
      submenu.hidden = true;
      record.submenu = submenu;
      entry.appendChild(button);
      entry.appendChild(submenu);
    } else {
      entry.appendChild(button);
    }
    parent.appendChild(entry);
  }

  function isVisible(record) {
    for (let parent = record.parent; parent; parent = parent.parent) {
      if (!openRecords.has(parent)) {return false;}
    }
    return true;
  }

  function syncDOM() {
    for (const record of records) {
      if (record.divider) {continue;}
      record.element.tabIndex = record === focusedRecord && isVisible(record) ? 0 : -1;
      if (record.submenu) {
        const open = openRecords.has(record);
        record.element.setAttribute('aria-expanded', String(open));
        record.submenu.hidden = !open;
      }
    }
  }

  function setOpen(record, open) {
    if (destroyed || !record?.submenu || record.item.disabled) {return;}
    if (open) {
      for (const sibling of record.parent?.children ?? rootRecords) {
        if (sibling !== record) {closeBranch(sibling);}
      }
      openRecords.add(record);
    } else {
      closeBranch(record);
    }
    syncDOM();
  }

  function closeBranch(record) {
    openRecords.delete(record);
    record.children.forEach(closeBranch);
  }

  function focusRecord(record) {
    if (!record || record.divider || record.item.disabled || !isVisible(record)) {return;}
    focusedRecord = record;
    syncDOM();
    record.element.focus();
  }

  function activate(record) {
    if (destroyed || !record || record.divider || record.item.disabled) {return;}
    if (record.submenu) {
      setOpen(record, !openRecords.has(record));
      return;
    }
    if (typeof record.item.onClick === 'function') {record.item.onClick();}
    onSelect?.(record.item);
  }

  function eventRecord(target) {
    const element = target?.closest?.('[data-menu-index]');
    if (!element || !root.contains(element)) {return null;}
    const index = Number(element.getAttribute('data-menu-index'));
    return Number.isInteger(index) && index >= 0 ? records[index] ?? null : null;
  }

  function enabledSiblings(record) {
    return (record.parent?.children ?? rootRecords)
      .filter(candidate => !candidate.divider && !candidate.item.disabled);
  }

  listeners.on(root, 'click', event => {
    const record = eventRecord(event.target);
    if (!record) {return;}
    focusRecord(record);
    activate(record);
  });

  listeners.on(root, 'focusin', event => {
    const record = eventRecord(event.target);
    if (record && !record.item.disabled) {
      focusedRecord = record;
      syncDOM();
    }
  });

  listeners.on(root, 'keydown', event => {
    const record = eventRecord(event.target);
    if (!record) {return;}
    const siblings = enabledSiblings(record);
    const position = siblings.indexOf(record);
    let next = null;

    if (event.key === 'ArrowDown') {
      if (horizontal && !record.parent && record.submenu) {
        setOpen(record, true);
        next = record.children.find(child => !child.divider && !child.item.disabled) ?? null;
      } else {
        next = siblings[(position + 1) % siblings.length];
      }
    } else if (event.key === 'ArrowUp') {
      next = siblings[(position - 1 + siblings.length) % siblings.length];
    } else if (event.key === 'Home') {
      next = siblings[0];
    } else if (event.key === 'End') {
      next = siblings[siblings.length - 1];
    } else if (event.key === 'ArrowRight') {
      if (record.submenu) {
        setOpen(record, true);
        next = record.children.find(child => !child.divider && !child.item.disabled) ?? null;
      } else if (horizontal && !record.parent) {
        next = siblings[(position + 1) % siblings.length];
      }
    } else if (event.key === 'ArrowLeft') {
      if (record.parent) {
        const parent = record.parent;
        setOpen(parent, false);
        next = parent;
      } else if (horizontal) {
        next = siblings[(position - 1 + siblings.length) % siblings.length];
      }
    } else if (event.key === 'Escape' && record.parent) {
      const parent = record.parent;
      setOpen(parent, false);
      next = parent;
    } else if (event.key === 'Enter' || event.key === ' ') {
      activate(record);
    } else {
      return;
    }

    event.preventDefault();
    if (next) {focusRecord(next);}
  });

  syncDOM();

  return {
    get element() { return container; },
    destroy() {
      if (destroyed) {return;}
      destroyed = true;
      listeners.destroy();
      openRecords.clear();
      instance.destroy();
    },
  };
}
