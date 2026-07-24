// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Tree component built on the 2.0 reactive core.
 *
 * Reuses the existing `ds-tree*` CSS classes for styling.
 *
 * ```js
 * import { Tree } from '@kupola/core/components/tree';
 *
 * const view = Tree({
 *   data: [
 *     { label: 'Parent', children: [
 *       { label: 'Child 1' },
 *       { label: 'Child 2' },
 *     ]},
 *   ],
 *   onSelect: (node) => console.log(node),
 * });
 * container.appendChild(view.element);
 * ```
 *
 * @module components/tree
 */

import { html } from '@kupola/core';
import { render } from '@kupola/core';

/**
 * Create a Tree component instance.
 *
 * @param {Object}   [options]
 * @param {Array}    [options.data]        Tree data array (recursive: { label, children?, icon?, badge? })
 * @param {boolean}  [options.lined]       Show line guides (default false)
 * @param {boolean}  [options.compact]     Compact mode (default false)
 * @param {boolean}  [options.checkable]   Show checkboxes (default false)
 * @param {Function} [options.onSelect]    Callback when node selected
 * @param {Function} [options.onToggle]    Callback when node expanded/collapsed
 * @returns {{ element: DocumentFragment, getSelected: Function, destroy: Function }}
 */
export function Tree(options = {}) {
  const {
    data = [],
    lined = false,
    compact = false,
    checkable = false,
    onSelect = null,
    onToggle = null,
  } = options;

  let _selectedEl = null;

  // ── Public API ─────────────────────────────────────────────────────────────

  function getSelected() {
    if (!_selectedEl) {return null;}
    return _selectedEl._treeNode || null;
  }

  function destroy() {
    instance.destroy();
  }

  // ── Internal ───────────────────────────────────────────────────────────────

  function _buildTree(nodes, parentUl) {
    nodes.forEach((node) => {
      const li = document.createElement('li');

      const itemEl = document.createElement('div');
      itemEl.className = 'ds-tree__item';
      itemEl._treeNode = node;

      // Toggle arrow
      const toggleEl = document.createElement('button');
      toggleEl.type = 'button';
      toggleEl.className = 'ds-tree__toggle';
      if (!node.children || node.children.length === 0) {
        toggleEl.classList.add('is-leaf');
      }
      itemEl.appendChild(toggleEl);

      // Checkbox
      if (checkable) {
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.className = 'ds-tree__checkbox';
        itemEl.appendChild(cb);
      }

      // Label
      const labelEl = document.createElement('span');
      labelEl.className = 'ds-tree__label';
      labelEl.textContent = node.label || '';
      itemEl.appendChild(labelEl);

      // Badge
      if (node.badge) {
        const badgeEl = document.createElement('span');
        badgeEl.className = 'ds-tree__badge';
        badgeEl.textContent = node.badge;
        itemEl.appendChild(badgeEl);
      }

      li.appendChild(itemEl);

      // Children container
      let childrenUl = null;
      if (node.children && node.children.length > 0) {
        childrenUl = document.createElement('ul');
        childrenUl.className = 'ds-tree__children';
        childrenUl.style.display = 'none';
        _buildTree(node.children, childrenUl);
        li.appendChild(childrenUl);
      }

      // Toggle click
      toggleEl.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!childrenUl) {return;}
        const isOpen = toggleEl.classList.contains('is-open');
        toggleEl.classList.toggle('is-open');
        childrenUl.style.display = isOpen ? 'none' : 'block';
        if (onToggle) {onToggle(node, !isOpen);}
      });

      // Item click → select
      itemEl.addEventListener('click', () => {
        if (_selectedEl) {_selectedEl.classList.remove('is-selected');}
        itemEl.classList.add('is-selected');
        _selectedEl = itemEl;
        if (onSelect) {onSelect(node);}
      });

      parentUl.appendChild(li);
    });
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const classes = [ 'ds-tree' ];
  if (lined) {classes.push('ds-tree--lined');}
  if (compact) {classes.push('ds-tree--compact');}

  const tpl = html`<ul class="${classes.join(' ')}"></ul>`;
  const container = document.createDocumentFragment();
  const instance = render(tpl, container);

  const rootEl = container.querySelector('.ds-tree');
  _buildTree(data, rootEl);

  return {
    get element() { return container; },
    getSelected,
    destroy,
  };
}
