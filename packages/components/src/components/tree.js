// SPDX-License-Identifier: MIT
/**
 * Accessible tree with indexed state, delegated events, and complete APIs.
 *
 * @module components/tree
 */

import { html } from '@kupola/platform/template';
import { render } from '@kupola/platform/render';
import { getIconHtml } from './icon-helper';
import { createListenerRegistry } from './listener-registry';

let treeId = 0;

function isValidKey(key) {
  return typeof key === 'string' || (typeof key === 'number' && Number.isFinite(key));
}

function hasAncestor(ancestor, node) {
  for (let current = ancestor; current; current = current.parent) {
    if (current.node === node) {return true;}
  }
  return false;
}

export function Tree(options = {}) {
  const id = ++treeId;
  const listeners = createListenerRegistry();
  const onSelect = typeof options.onSelect === 'function' ? options.onSelect : null;
  const onCheck = typeof options.onCheck === 'function' ? options.onCheck : null;
  const onExpand = typeof options.onExpand === 'function' ? options.onExpand : null;
  const onToggle = typeof options.onToggle === 'function' ? options.onToggle : null;
  let records = [];
  let recordMap = new Map();
  let destroyed = false;

  function buildRecords(data) {
    const nextRecords = [];
    const nextRecordMap = new Map();
    const roots = Array.isArray(data) ? data : [];
    const stack = roots
      .map((node, index) => ({ node, parent: null, path: String(index), ancestor: null }))
      .reverse();

    while (stack.length > 0) {
      const entry = stack.pop();
      const node = entry.node;
      if (!node || typeof node !== 'object' || hasAncestor(entry.ancestor, node)) {continue;}

      if (isValidKey(node.key) && nextRecordMap.has(node.key)
        && nextRecordMap.get(node.key).node !== node) {
        throw new TypeError(`[kupola/components] Tree duplicate key: ${String(node.key)}`);
      }
      let key = isValidKey(node.key) && !nextRecordMap.has(node.key) ? node.key : null;
      if (key === null) {
        key = `__tree_${id}_${entry.path}`;
        while (nextRecordMap.has(key)) {key += '_';}
      }

      const record = {
        key,
        node,
        parent: entry.parent,
        children: [],
        element: null,
        toggle: null,
        checkbox: null,
        childrenElement: null,
      };
      nextRecords.push(record);
      nextRecordMap.set(key, record);
      entry.parent?.children.push(record);

      const children = node.isLeaf || !Array.isArray(node.children) ? [] : node.children;
      const ancestor = { node, parent: entry.ancestor };
      for (let index = children.length - 1; index >= 0; index--) {
        stack.push({
          node: children[index],
          parent: record,
          path: `${entry.path}.${index}`,
          ancestor,
        });
      }
    }
    return { records: nextRecords, recordMap: nextRecordMap };
  }

  ({ records, recordMap } = buildRecords(options.data));

  const selectedKeys = new Set();
  const checkedKeys = new Set();
  const indeterminateKeys = new Set();
  const expandedKeys = new Set();

  const shouldExpandAll = options.expandAll === true || options.defaultExpandAll === true;
  const defaultExpandKeys = new Set(Array.isArray(options.defaultExpandKeys)
    ? options.defaultExpandKeys
    : []);

  function initializeState(preserve = false, previous = {}) {
    selectedKeys.clear();
    checkedKeys.clear();
    indeterminateKeys.clear();
    expandedKeys.clear();

    if (preserve) {
      for (const key of previous.selectedKeys || []) {
        const record = recordMap.get(key);
        if (record && !record.node.disabled) {selectedKeys.add(key);}
      }
      for (const key of previous.checkedKeys || []) {
        const record = recordMap.get(key);
        if (record && !record.node.disabled) {checkedKeys.add(key);}
      }
      for (const key of previous.expandedKeys || []) {
        const record = recordMap.get(key);
        if (record && record.children.length > 0 && !record.node.disabled) {
          expandedKeys.add(key);
        }
      }
    } else {
      const initialSelectedKey = options.selectedKey
        ?? (Array.isArray(options.defaultSelectedKeys) ? options.defaultSelectedKeys[0] : undefined);
      const initialSelected = recordMap.get(initialSelectedKey);
      if (initialSelected && !initialSelected.node.disabled) {
        selectedKeys.add(initialSelected.key);
      }

      for (const record of records) {
        if (record.children.length > 0 && !record.node.disabled
          && (shouldExpandAll || defaultExpandKeys.has(record.key))) {
          expandedKeys.add(record.key);
        }
      }

      const defaultCheckedKeys = Array.isArray(options.defaultCheckedKeys)
        ? options.defaultCheckedKeys
        : [];
      defaultCheckedKeys.forEach(key => {
        const record = recordMap.get(key);
        if (record) {setSubtreeChecked(record, true);}
      });
    }

    for (let index = records.length - 1; index >= 0; index--) {
      recomputeRecordCheck(records[index]);
    }
  }

  function setSubtreeChecked(record, checked) {
    if (record.node.disabled) {return;}
    indeterminateKeys.delete(record.key);
    if (checked) {checkedKeys.add(record.key);} else {checkedKeys.delete(record.key);}
    record.children.forEach(child => setSubtreeChecked(child, checked));
  }

  function recomputeRecordCheck(record) {
    const children = record.children.filter(child => !child.node.disabled);
    if (children.length === 0) {return;}
    const allChecked = children.every(child => checkedKeys.has(child.key));
    const someChecked = children.some(child => checkedKeys.has(child.key)
      || indeterminateKeys.has(child.key));

    if (!record.node.disabled) {
      if (allChecked) {checkedKeys.add(record.key);} else {checkedKeys.delete(record.key);}
    }
    if (someChecked && !allChecked) {
      indeterminateKeys.add(record.key);
    } else {
      indeterminateKeys.delete(record.key);
    }
  }

  initializeState();

  const classes = [ 'ds-tree' ];
  if (options.lined) {classes.push('ds-tree--lined');}
  if (options.compact) {classes.push('ds-tree--compact');}

  // Virtual scroll: when enabled, wrap the tree in a scrollable container and
  // apply CSS content-visibility to skip off-screen node rendering.
  const virtualScroll = options.virtualScroll === true
    || (options.virtualScroll && typeof options.virtualScroll === 'object');
  const vsMaxHeight = (typeof options.virtualScroll === 'object' && options.virtualScroll?.maxHeight)
    || options.maxHeight || 400;
  const vsItemHeight = (typeof options.virtualScroll === 'object' && options.virtualScroll?.itemHeight)
    || 36;

  const container = virtualScroll && typeof document !== 'undefined'
    ? document.createElement('div')
    : document.createDocumentFragment();
  const instance = render(html`<ul class="ds-tree" role="tree"></ul>`, container);
  const root = container.querySelector('.ds-tree');
  root.className = classes.join(' ');

  if (virtualScroll && container.nodeType === 1) {
    container.className = 'ds-tree__scroll-container';
    container.style.maxHeight = `${vsMaxHeight}px`;
    container.style.overflowY = 'auto';
  }

  function renderRecords() {
    root.replaceChildren();
    for (const [ index, record ] of records.entries()) {
      const label = record.node.title ?? record.node.label ?? '';
      const itemId = `ds-tree-${id}-item-${index}`;
      const childrenId = `ds-tree-${id}-group-${index}`;
      const li = document.createElement('li');
      li.setAttribute('role', 'none');
      if (virtualScroll) {
        li.style.contentVisibility = 'auto';
        li.style.containIntrinsicSize = `${vsItemHeight}px`;
      }

      const item = document.createElement('div');
      item.className = 'ds-tree__item';
      item.id = itemId;
      item.dataset.treeIndex = String(index);
      item.setAttribute('role', 'treeitem');
      item.setAttribute('aria-level', String(recordDepth(record) + 1));
      item.setAttribute('aria-disabled', String(!!record.node.disabled));
      record.element = item;

      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'ds-tree__toggle';
      toggle.dataset.treeToggleIndex = String(index);
      toggle.tabIndex = -1;
      record.toggle = toggle;
      if (record.children.length === 0) {
        toggle.classList.add('is-leaf');
        toggle.disabled = true;
        toggle.setAttribute('aria-hidden', 'true');
      } else {
        toggle.setAttribute('aria-controls', childrenId);
        toggle.setAttribute('aria-label', `Expand ${label}`);
      }
      item.appendChild(toggle);

      if (options.checkable) {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'ds-tree__checkbox';
        checkbox.dataset.treeCheckIndex = String(index);
        checkbox.disabled = !!record.node.disabled;
        checkbox.setAttribute('aria-label', `Select ${label}`);
        record.checkbox = checkbox;
        item.appendChild(checkbox);
      }

      if (record.node.icon) {
        const icon = document.createElement('span');
        icon.className = 'ds-tree__icon';
        icon.setAttribute('aria-hidden', 'true');
        icon.innerHTML = getIconHtml(record.node.icon);
        item.appendChild(icon);
      }

      const labelElement = document.createElement('span');
      labelElement.className = 'ds-tree__label';
      labelElement.textContent = String(label);
      item.appendChild(labelElement);

      if (record.node.badge !== undefined && record.node.badge !== null) {
        const badge = document.createElement('span');
        badge.className = 'ds-tree__badge';
        badge.textContent = String(record.node.badge);
        item.appendChild(badge);
      }

      li.appendChild(item);
      if (record.children.length > 0) {
        const children = document.createElement('ul');
        children.className = 'ds-tree__children';
        children.id = childrenId;
        children.setAttribute('role', 'group');
        record.childrenElement = children;
        li.appendChild(children);
      }

      const parent = record.parent?.childrenElement ?? root;
      parent.appendChild(li);
    }
  }

  renderRecords();

  let focusedKey = selectedKeys.values().next().value ?? records[0]?.key ?? null;

  function recordDepth(record) {
    let depth = 0;
    for (let parent = record.parent; parent; parent = parent.parent) {depth++;}
    return depth;
  }

  function isVisible(record) {
    for (let parent = record.parent; parent; parent = parent.parent) {
      if (!expandedKeys.has(parent.key)) {return false;}
    }
    return true;
  }

  function syncDOM() {
    for (const record of records) {
      const selected = selectedKeys.has(record.key);
      const expanded = expandedKeys.has(record.key);
      record.element.classList.toggle('is-selected', selected);
      record.element.classList.toggle('is-disabled', !!record.node.disabled);
      record.element.setAttribute('aria-selected', String(selected));
      record.element.tabIndex = record.key === focusedKey ? 0 : -1;

      if (record.childrenElement) {
        record.toggle.classList.toggle('is-open', expanded);
        record.toggle.setAttribute('aria-expanded', String(expanded));
        const action = expanded ? 'Collapse' : 'Expand';
        const label = record.node.title ?? record.node.label ?? '';
        record.toggle.setAttribute('aria-label', `${action} ${label}`);
        record.element.setAttribute('aria-expanded', String(expanded));
        record.childrenElement.hidden = !expanded;
        record.childrenElement.style.display = expanded ? 'block' : 'none';
      }
      if (record.checkbox) {
        record.checkbox.checked = checkedKeys.has(record.key);
        record.checkbox.indeterminate = indeterminateKeys.has(record.key);
      }
    }
  }

  function getSelectedKeys() {
    return [ ...selectedKeys ];
  }

  function getSelectedNodes() {
    return getSelectedKeys().map(key => recordMap.get(key)?.node).filter(Boolean);
  }

  function getSelected() {
    return getSelectedNodes()[0] ?? null;
  }

  function getCheckedKeys() {
    return records.filter(record => checkedKeys.has(record.key)).map(record => record.key);
  }

  function getCheckedNodes() {
    return records.filter(record => checkedKeys.has(record.key)).map(record => record.node);
  }

  function getExpandedKeys() {
    return records.filter(record => expandedKeys.has(record.key)).map(record => record.key);
  }

  function selectKey(key) {
    if (destroyed) {return;}
    const record = recordMap.get(key);
    if (!record || record.node.disabled || selectedKeys.has(key)) {return;}
    selectedKeys.clear();
    selectedKeys.add(key);
    focusedKey = key;
    syncDOM();
    onSelect?.(getSelectedKeys(), getSelectedNodes());
  }

  function updateAncestors(record) {
    for (let parent = record.parent; parent; parent = parent.parent) {
      recomputeRecordCheck(parent);
    }
  }

  function setChecked(key, checked) {
    if (destroyed) {return;}
    const record = recordMap.get(key);
    if (!record || record.node.disabled) {return;}
    setSubtreeChecked(record, checked);
    updateAncestors(record);
    syncDOM();
    onCheck?.(getCheckedKeys(), getCheckedNodes());
  }

  function checkKey(key) {
    setChecked(key, true);
  }

  function uncheckKey(key) {
    setChecked(key, false);
  }

  function toggleCheck(key) {
    if (destroyed) {return;}
    setChecked(key, !checkedKeys.has(key));
  }

  function setExpanded(record, expanded, notify = true) {
    if (destroyed || !record || record.children.length === 0 || record.node.disabled) {return;}
    const changed = expanded ? !expandedKeys.has(record.key) : expandedKeys.has(record.key);
    if (!changed) {return;}
    if (expanded) {
      expandedKeys.add(record.key);
    } else {
      expandedKeys.delete(record.key);
      const focused = recordMap.get(focusedKey);
      if (focused && focused !== record && isDescendantOf(focused, record)) {focusedKey = record.key;}
    }
    syncDOM();
    if (notify) {
      onToggle?.(record.node, expanded);
      onExpand?.(getExpandedKeys());
    }
  }

  function isDescendantOf(record, ancestor) {
    for (let parent = record.parent; parent; parent = parent.parent) {
      if (parent === ancestor) {return true;}
    }
    return false;
  }

  function expand(key) {
    setExpanded(recordMap.get(key), true);
  }

  function collapse(key) {
    setExpanded(recordMap.get(key), false);
  }

  function expandAll() {
    if (destroyed) {return;}
    let changed = false;
    for (const record of records) {
      if (record.children.length > 0 && !record.node.disabled && !expandedKeys.has(record.key)) {
        expandedKeys.add(record.key);
        changed = true;
      }
    }
    if (!changed) {return;}
    syncDOM();
    onExpand?.(getExpandedKeys());
  }

  function collapseAll() {
    if (destroyed || expandedKeys.size === 0) {return;}
    expandedKeys.clear();
    const focused = recordMap.get(focusedKey);
    if (focused?.parent) {focusedKey = records[0]?.key ?? null;}
    syncDOM();
    onExpand?.([]);
  }

  function eventRecord(target, attribute) {
    const element = target?.closest?.(`[${attribute}]`);
    if (!element || !root.contains(element)) {return null;}
    const index = Number(element.getAttribute(attribute));
    return Number.isInteger(index) && index >= 0 ? records[index] ?? null : null;
  }

  function focusRecord(record) {
    if (!record) {return;}
    focusedKey = record.key;
    syncDOM();
    record.element.focus();
  }

  function setData(data) {
    if (destroyed) {return;}
    const previous = {
      selectedKeys: [ ...selectedKeys ],
      checkedKeys: [ ...checkedKeys ],
      expandedKeys: [ ...expandedKeys ],
      focusedKey,
    };
    const next = buildRecords(data);
    records = next.records;
    recordMap = next.recordMap;
    initializeState(true, previous);
    focusedKey = recordMap.has(previous.focusedKey)
      ? previous.focusedKey
      : selectedKeys.values().next().value ?? records[0]?.key ?? null;
    renderRecords();
    syncDOM();
  }

  listeners.on(root, 'click', event => {
    if (eventRecord(event.target, 'data-tree-check-index')) {return;}
    const toggleRecord = eventRecord(event.target, 'data-tree-toggle-index');
    if (toggleRecord) {
      setExpanded(toggleRecord, !expandedKeys.has(toggleRecord.key));
      return;
    }
    const record = eventRecord(event.target, 'data-tree-index');
    if (!record) {return;}
    focusRecord(record);
    selectKey(record.key);
  });

  listeners.on(root, 'change', event => {
    const record = eventRecord(event.target, 'data-tree-check-index');
    if (record) {setChecked(record.key, event.target.checked);}
  });

  listeners.on(root, 'focusin', event => {
    const record = eventRecord(event.target, 'data-tree-index');
    if (record) {
      focusedKey = record.key;
      for (const candidate of records) {
        candidate.element.tabIndex = candidate === record ? 0 : -1;
      }
    }
  });

  listeners.on(root, 'keydown', event => {
    const record = eventRecord(event.target, 'data-tree-index');
    if (!record) {return;}
    const visible = records.filter(isVisible);
    const position = visible.indexOf(record);
    let next = null;

    if (event.key === 'ArrowDown') {
      next = visible[Math.min(position + 1, visible.length - 1)];
    } else if (event.key === 'ArrowUp') {
      next = visible[Math.max(position - 1, 0)];
    } else if (event.key === 'Home') {
      next = visible[0];
    } else if (event.key === 'End') {
      next = visible[visible.length - 1];
    } else if (event.key === 'ArrowRight') {
      if (record.children.length > 0 && !expandedKeys.has(record.key)) {
        setExpanded(record, true);
      } else {
        next = record.children[0] ?? null;
      }
    } else if (event.key === 'ArrowLeft') {
      if (expandedKeys.has(record.key)) {
        setExpanded(record, false);
      } else {
        next = record.parent;
      }
    } else if (event.key === 'Enter') {
      selectKey(record.key);
    } else if (event.key === ' ' && options.checkable) {
      toggleCheck(record.key);
    } else {
      return;
    }

    event.preventDefault();
    if (next) {focusRecord(next);}
  });

  syncDOM();

  return {
    get element() { return container; },
    getSelected,
    getSelectedKeys,
    getCheckedKeys,
    getExpandedKeys,
    setData,
    selectKey,
    select: selectKey,
    checkKey,
    uncheckKey,
    toggleCheck,
    expand,
    collapse,
    expandAll,
    collapseAll,
    destroy() {
      if (destroyed) {return;}
      destroyed = true;
      listeners.destroy();
      instance.destroy();
    },
  };
}
