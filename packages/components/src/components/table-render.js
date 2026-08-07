// SPDX-License-Identifier: MIT
/**
 * Table DOM rendering helpers.
 *
 * Self-contained DOM builders and sync helpers used by the Table component.
 * They take explicit parameters so rendering behavior stays testable without
 * mounting the full component. The main render orchestration (_render and the
 * toolbar/thead/tbody builders) lives in table.js because it is tightly
 * coupled to component state.
 *
 * @module TableRender
 */

import { render } from '@kupola/platform/render';

/**
 * Append HTML to a container with XSS sanitization.
 * @param {HTMLElement} container
 * @param {*} value
 */
export function appendSanitizedHtml(container, value) {
  const template = document.createElement('template');
  template.innerHTML = String(value);
  template.content.querySelectorAll('script, iframe, object, embed, link, style')
    .forEach(element => element.remove());
  template.content.querySelectorAll('*').forEach(element => {
    for (const attribute of [ ...element.attributes ]) {
      const name = attribute.name.toLowerCase();
      const value = attribute.value.trim();
      if (name.startsWith('on') || name === 'style'
        || ((name === 'href' || name === 'src' || name === 'xlink:href')
          && /^javascript:/i.test(value))) {
        element.removeAttribute(attribute.name);
      }
    }
  });
  container.append(...template.content.childNodes);
}

/**
 * Compute the table element class list from options.
 * @param {object} options
 * @returns {string}
 */
export function getTableClass(options) {
  const classes = [ 'ds-table' ];
  if (options.striped) {classes.push('ds-table-striped');}
  if (options.hoverable !== false) {classes.push('ds-table-hover');}
  if (options.bordered) {classes.push('ds-table-bordered');}
  if (options.compact) {classes.push('ds-table-compact');}
  return classes.join(' ');
}

/**
 * Compute the total column count including selection and expand columns.
 * @param {Array} columns
 * @param {string|null} selection
 * @param {*} expandable
 * @returns {number}
 */
export function getTotalColCount(columns, selection, expandable) {
  return columns.length + (selection ? 1 : 0) + (expandable ? 1 : 0);
}

/**
 * Append a virtual scroll spacer row.
 * @param {HTMLElement} tbody
 * @param {number} height
 * @param {number} colCount
 */
export function appendVirtualSpacer(tbody, height, colCount) {
  const tr = document.createElement('tr');
  tr.className = 'ds-table-virtual-spacer';
  tr.setAttribute('aria-hidden', 'true');
  const td = document.createElement('td');
  td.colSpan = colCount;
  td.style.height = `${height}px`;
  td.style.padding = '0';
  td.style.border = '0';
  tr.appendChild(td);
  tbody.appendChild(tr);
}

/**
 * Append a rendered value (string, node, or TemplateResult) to a container.
 * @param {HTMLElement} container
 * @param {*} result
 * @param {Set} rendererInstances
 */
export function appendRenderResult(container, result, rendererInstances) {
  if (typeof result === 'string') {
    appendSanitizedHtml(container, result);
    return;
  }
  if (result && typeof result === 'object' && typeof result.nodeType === 'number') {
    container.appendChild(result);
    return;
  }
  if (result && typeof result === 'object') {
    const child = render(result, container);
    rendererInstances.add(child);
  }
}

/**
 * Render a data cell value with an optional custom renderer.
 * @param {HTMLElement} td
 * @param {object} col
 * @param {*} value
 * @param {object} row
 * @param {Set} rendererInstances
 */
export function renderCellValue(td, col, value, row, rendererInstances) {
  if (col.render) {
    const result = col.render(value, row);
    appendRenderResult(td, result, rendererInstances);
  } else {
    td.textContent = value != null ? String(value) : '';
  }
}

/**
 * Render a selection cell (checkbox or radio).
 * @param {HTMLElement} tr
 * @param {*} key
 * @param {boolean} isSelected
 * @param {string|null} selection
 * @param {object} listeners
 * @param {Function} onSelect
 * @param {Function} onDeselect
 */
export function renderSelectionCell(tr, key, isSelected, selection, listeners, onSelect, onDeselect) {
  const td = document.createElement('td');
  td.className = 'ds-table-col-selection';
  const input = document.createElement('input');
  input.type = selection === 'radio' ? 'radio' : 'checkbox';
  input.checked = isSelected;
  listeners.on(input, 'change', () => {
    if (input.checked) {onSelect(key);}
    else {onDeselect(key);}
  });
  td.appendChild(input);
  tr.appendChild(td);
}

/**
 * Render an expand toggle cell.
 * @param {HTMLElement} tr
 * @param {*} key
 * @param {boolean} isExpanded
 * @param {object} listeners
 * @param {Function} onToggle
 */
export function renderExpandCell(tr, key, isExpanded, listeners, onToggle) {
  const td = document.createElement('td');
  td.className = 'ds-table-col-expand';
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'ds-table-expand-btn';
  btn.textContent = isExpanded ? '\u25BC' : '\u25B6';
  listeners.on(btn, 'click', () => onToggle(key));
  td.appendChild(btn);
  tr.appendChild(td);
}

/**
 * Sync selection state into the rendered DOM without a full re-render.
 * @param {object} deps
 * @param {HTMLElement} deps.element
 * @param {string|null} deps.selection
 * @param {Set} deps.selectedKeys
 * @param {Function} deps.getProcessedData
 * @param {string} deps.rowKey
 * @param {object} deps.options
 */
export function syncSelectionDOM({ element, selection, selectedKeys, getProcessedData, rowKey, options }) {
  if (!selection) {return;}
  element.querySelectorAll('tbody tr[data-row-key]').forEach(row => {
    const key = row.getAttribute('data-row-key');
    const selected = [ ...selectedKeys ].some(value => String(value) === key);
    row.classList.toggle('ds-table-row-selected', selected);
    const input = row.querySelector('.ds-table-col-selection input');
    if (input) {input.checked = selected;}
  });
  const header = element.querySelector('thead .ds-table-col-selection input');
  if (header) {
    const { pageData } = getProcessedData();
    header.checked = pageData.length > 0
      && pageData.every(row => selectedKeys.has(row[rowKey]));
  }
  const info = element.querySelector('.ds-table-selection-info');
  if (info) {
    if (selectedKeys.size > 0) {
      info.textContent = `Selected ${selectedKeys.size} items`;
    } else {
      info.remove();
    }
  } else if (selectedKeys.size > 0 && (options.showFilter || options.showToolbar)) {
    const left = element.querySelector('.ds-table-toolbar > div:first-child');
    if (left) {
      const next = document.createElement('span');
      next.className = 'ds-table-selection-info';
      next.textContent = `Selected ${selectedKeys.size} items`;
      left.appendChild(next);
    }
  }
}
