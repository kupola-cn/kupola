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
import { t } from '@kupola/platform/i18n';
import { createListenerRegistry } from './listener-registry';
import { getPageNumbers as getPageNumbersData } from './table-data.js';
import { renderEditCell, startEdit } from './table-editing.js';
import { computeVirtualState } from './table-virtual.js';

/**
 * Append HTML to a container with XSS sanitization.
 * @param {HTMLElement} container
 * @param {*} value
 */
function appendSanitizedHtml(container, value) {
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
function appendVirtualSpacer(tbody, height, colCount) {
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
function appendRenderResult(container, result, rendererInstances) {
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
function renderCellValue(td, col, value, row, rendererInstances) {
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
function renderSelectionCell(tr, key, isSelected, selection, listeners, onSelect, onDeselect) {
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
function renderExpandCell(tr, key, isExpanded, listeners, onToggle) {
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

/**
 * Full render orchestration: rebuild toolbar, thead, tbody, pagination, and
 * post-render interactions while keeping the table shell stable.
 * @param {object} ctx
 */
export function renderTable(ctx) {
  const {
    options, element, interactionListeners, rendererInstances, state, refs,
    resizable, draggable, getProcessedData, isVirtualEnabled, shouldPaginate,
  } = ctx;
  if (state.destroyed) {return;}
  for (const renderer of [ ...rendererInstances ]) {
    try {renderer.destroy?.();} catch { /* continue rebuilding the table */ }
  }
  rendererInstances.clear();
  cancelFilterDebounce(ctx);
  runInteractionCleanups(ctx);

  const { pageData, total } = getProcessedData();
  const virtualState = isVirtualEnabled() && !state.loading && pageData.length > 0
    ? getVirtualState(ctx, pageData)
    : null;
  element.classList.toggle('ds-table-virtual-wrapper', !!virtualState);

  // Toolbar
  refs.toolbarElement?.remove();
  refs.toolbarElement = null;
  if (options.showFilter || options.showToolbar) {
    refs.toolbarElement = renderToolbar(ctx);
    element.insertBefore(refs.toolbarElement, refs.tableContainerElement || null);
  }

  // Keep the table shell stable across data/state updates. Rebuilding only
  // the changed sections avoids invalidating the host layout and focus tree.
  if (!refs.tableContainerElement) {
    refs.tableContainerElement = document.createElement('div');
    refs.tableContainerElement.className = 'ds-table-container';
    refs.tableElement = document.createElement('table');
    element.appendChild(refs.tableContainerElement);
  }
  const tableContainer = refs.tableContainerElement;
  if (virtualState) {
    tableContainer.style.height = virtualState.heightStyle;
    tableContainer.style.overflowY = 'auto';
    interactionListeners.on(tableContainer, 'scroll', event => handleVirtualScroll(ctx, event));
  } else {
    tableContainer.style.removeProperty('height');
    tableContainer.style.removeProperty('overflow-y');
  }

  refs.tableElement.className = getTableClass(options);

  refs.tableElement.replaceChildren(
    renderThead(ctx),
    renderTbody(ctx, virtualState ? virtualState.rows : pageData, virtualState),
  );
  tableContainer.replaceChildren(refs.tableElement);
  if (virtualState) {
    tableContainer.scrollTop = state.virtualScrollTop;
  }

  // Pagination
  refs.paginationElement?.remove();
  refs.paginationElement = null;
  if (shouldPaginate() && total > state.pageSize) {
    refs.paginationElement = renderPagination(ctx, total);
    element.appendChild(refs.paginationElement);
  }

  // Post-render
  if (resizable) {initColumnResize(ctx);}
  if (draggable) {initRowDrag(ctx);}
}

/**
 * Run registered interaction cleanups before rebuilding the table.
 * @param {object} ctx
 */
function runInteractionCleanups(ctx) {
  const { resizeCleanups, interactionListeners } = ctx;
  for (const cleanup of [ ...resizeCleanups ]) {cleanup();}
  interactionListeners.clear();
}

/**
 * Compute the visible virtual rows and clamp the scroll position.
 * @param {object} ctx
 * @param {Array} data
 * @returns {object}
 */
function getVirtualState(ctx, data) {
  const { state, virtualScroll } = ctx;
  const virtualState = computeVirtualState(data, virtualScroll, state.pageSize, state.virtualScrollTop);
  state.virtualScrollTop = virtualState.scrollTop;
  return virtualState;
}

/**
 * Handle a virtual scroll event and schedule a render.
 * @param {object} ctx
 * @param {Event} event
 */
function handleVirtualScroll(ctx, event) {
  ctx.state.virtualScrollTop = event.currentTarget.scrollTop;
  scheduleRender(ctx);
}

/**
 * Schedule a render on the next animation frame (deduplicated).
 * @param {object} ctx
 */
function scheduleRender(ctx) {
  const { state, requestFrame } = ctx;
  if (state.virtualFrame != null || state.destroyed) {return;}
  state.virtualFrame = requestFrame(() => {
    state.virtualFrame = null;
    renderTable(ctx);
  });
}

/**
 * Cancel a pending scheduled render.
 * @param {object} ctx
 */
export function cancelVirtualFrame(ctx) {
  const { state, cancelFrame } = ctx;
  if (state.virtualFrame == null) {return;}
  cancelFrame(state.virtualFrame);
  state.virtualFrame = null;
}

/**
 * Cancel a pending filter debounce.
 * @param {object} ctx
 */
export function cancelFilterDebounce(ctx) {
  const { state } = ctx;
  if (state.filterDebounceTimer === null) {return;}
  clearTimeout(state.filterDebounceTimer);
  state.filterDebounceTimer = null;
}

/**
 * Build the optional toolbar (selection info + filter input).
 * @param {object} ctx
 * @returns {HTMLElement}
 */
function renderToolbar(ctx) {
  const { options, selection, interactionListeners, state, clearProcessedCache } = ctx;
  const toolbar = document.createElement('div');
  toolbar.className = 'ds-table-toolbar';

  const left = document.createElement('div');
  if (selection === 'checkbox' && state.selectedKeys.size > 0) {
    const info = document.createElement('span');
    info.className = 'ds-table-selection-info';
    info.textContent = `Selected ${state.selectedKeys.size} items`;
    left.appendChild(info);
  }

  const right = document.createElement('div');
  right.className = 'ds-table-toolbar-right';

  if (options.showFilter) {
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'ds-table-filter-input';
    input.placeholder = 'Filter...';
    input.value = state.filterText;
    interactionListeners.on(input, 'input', () => {
      cancelFilterDebounce(ctx);
      state.filterDebounceTimer = setTimeout(() => {
        state.filterDebounceTimer = null;
        if (state.destroyed) {return;}
        state.filterText = input.value;
        state.currentPage = 1;
        state.virtualScrollTop = 0;
        clearProcessedCache();
        renderTable(ctx);
        if (options.onFilter) {options.onFilter(state.filterText);}
      }, 300);
    });
    right.appendChild(input);
  }

  toolbar.appendChild(left);
  toolbar.appendChild(right);
  return toolbar;
}

/**
 * Build the thead with sortable/resizable column headers.
 * @param {object} ctx
 * @returns {HTMLElement}
 */
function renderThead(ctx) {
  const { columns, selection, expandable, multiSort, resizable, interactionListeners, state } = ctx;
  const thead = document.createElement('thead');
  const tr = document.createElement('tr');

  if (selection) {renderSelectionHeader(ctx, tr);}
  if (expandable) {
    const th = document.createElement('th');
    th.className = 'ds-table-col-expand';
    tr.appendChild(th);
  }

  columns.forEach(col => {
    const th = document.createElement('th');
    th.textContent = col.title || col.key;
    if (col.width) {th.style.width = typeof col.width === 'number' ? col.width + 'px' : col.width;}
    if (col.minWidth) {th.style.minWidth = typeof col.minWidth === 'number' ? col.minWidth + 'px' : col.minWidth;}
    if (col.align) {th.style.textAlign = col.align;}
    if (col.fixed) {th.setAttribute('data-fixed', col.fixed);}

    if (col.sortable) {
      th.classList.add('ds-table-sortable');
      const sortInfo = state.sorts.find(s => s.key === col.key);
      if (sortInfo) {th.classList.add(`ds-table-sort-${sortInfo.order}`);}

      interactionListeners.on(th, 'click', () => handleSort(ctx, col.key));

      const indicator = document.createElement('span');
      indicator.className = 'ds-table-sort-icon';
      if (sortInfo) {
        indicator.textContent = multiSort
          ? ` ${state.sorts.indexOf(sortInfo) + 1}${sortInfo.order === 'asc' ? '\u25B2' : '\u25BC'}`
          : (sortInfo.order === 'asc' ? ' \u25B2' : ' \u25BC');
      } else {
        indicator.textContent = ' \u21C5';
      }
      th.appendChild(indicator);
    }

    if (resizable && col.key !== columns[columns.length - 1]?.key) {
      const handle = document.createElement('span');
      handle.className = 'ds-table-resize-handle';
      handle.setAttribute('data-col-key', col.key);
      th.appendChild(handle);
    }

    tr.appendChild(th);
  });

  thead.appendChild(tr);
  return thead;
}

/**
 * Build the selection header cell (select-all checkbox).
 * @param {object} ctx
 * @param {HTMLElement} tr
 */
function renderSelectionHeader(ctx, tr) {
  const { selection, interactionListeners, state, rowKey, getProcessedData, selectAll, deselectAll } = ctx;
  const th = document.createElement('th');
  th.className = 'ds-table-col-selection';
  if (selection === 'checkbox') {
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    const { pageData } = getProcessedData();
    const allKeys = pageData.map(r => r[rowKey]);
    cb.checked = allKeys.length > 0 && allKeys.every(k => state.selectedKeys.has(k));
    interactionListeners.on(cb, 'change', () => cb.checked ? selectAll() : deselectAll());
    th.appendChild(cb);
  }
  tr.appendChild(th);
}

/**
 * Build the tbody, including loading/empty states, merge cells, inline edit,
 * expand rows, and virtual scroll spacers.
 * @param {object} ctx
 * @param {Array} data
 * @param {object|null} virtualState
 * @returns {HTMLElement}
 */
function renderTbody(ctx, data, virtualState = null) {
  const {
    options, rowKey, selection, expandable, editable, draggable, columns,
    mergeCellsFn, interactionListeners, rendererInstances, state, refs, editing,
    toggleExpand, selectRow, deselectRow, saveEdit, cancelEdit,
  } = ctx;
  const tbody = document.createElement('tbody');
  const nextVirtualRowElements = new Map();

  if (state.loading) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = getTotalColCount(columns, selection, expandable);
    td.className = 'ds-table-loading';
    td.textContent = options.loadingText || 'Loading...';
    tr.appendChild(td);
    tbody.appendChild(tr);
  } else if (data.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = getTotalColCount(columns, selection, expandable);
    td.className = 'ds-table-empty';
    td.textContent = options.emptyText || t('table.empty');
    tr.appendChild(td);
    tbody.appendChild(tr);
  } else {
    const mergeConfig = mergeCellsFn ? mergeCellsFn(data) : [];
    const mergeMap = new Map();
    mergeConfig.forEach(m => mergeMap.set(`${m.row}-${m.col}`, m));
    const skipCells = new Set();

    if (virtualState?.topHeight) {
      appendVirtualSpacer(tbody, virtualState.topHeight, getTotalColCount(columns, selection, expandable));
    }

    data.forEach((row, rowIndex) => {
      const key = row[rowKey] ?? rowIndex;
      const isSelected = state.selectedKeys.has(key);
      const isExpanded = state.expandedKeys.has(key);

      const tr = virtualState && refs.virtualRowElements.get(key)
        ? refs.virtualRowElements.get(key)
        : document.createElement('tr');
      if (virtualState && refs.virtualRowElements.has(key)) {
        tr.replaceChildren();
        tr.className = '';
        tr.removeAttribute('data-row-key');
        tr.removeAttribute('draggable');
      }
      if (virtualState) {nextVirtualRowElements.set(key, tr);}
      tr.setAttribute('data-row-key', key);
      if (isSelected) {tr.classList.add('ds-table-row-selected');}
      if (draggable) { tr.draggable = true; tr.classList.add('ds-table-draggable'); }

      if (options.onRowClick) {
        interactionListeners.on(tr, 'click', () => options.onRowClick(row, key));
      }

      if (selection) {
        renderSelectionCell(tr, key, isSelected, selection, interactionListeners, selectRow, deselectRow);
      }
      if (expandable) {renderExpandCell(tr, key, isExpanded, interactionListeners, toggleExpand);}

      // Data cells
      columns.forEach((col, colIndex) => {
        if (skipCells.has(`${rowIndex}-${colIndex}`)) {return;}

        const td = document.createElement('td');
        if (col.align) {td.style.textAlign = col.align;}
        if (col.fixed) {td.setAttribute('data-fixed', col.fixed);}

        // Merge cells
        const merge = mergeMap.get(`${rowIndex}-${colIndex}`);
        if (merge) {
          if (merge.rowSpan > 1) {td.rowSpan = merge.rowSpan;}
          if (merge.colSpan > 1) {td.colSpan = merge.colSpan;}
          for (let r = 0; r < (merge.rowSpan || 1); r++) {
            for (let c = 0; c < (merge.colSpan || 1); c++) {
              if (r === 0 && c === 0) {continue;}
              skipCells.add(`${rowIndex + r}-${colIndex + c}`);
            }
          }
        }

        const value = row[col.key];

        // Inline edit
        if (editing.cell && editing.cell.rowKey === key && editing.cell.colKey === col.key) {
          td.appendChild(renderEditCell(editing, td, row, col, key, interactionListeners, saveEdit, cancelEdit));
        } else if (col.editable && editable) {
          td.classList.add('ds-table-editable-cell');
          interactionListeners.on(
            td, 'dblclick', () => startEdit(editing, key, col.key, value, () => renderTable(ctx)),
          );
          renderCellValue(td, col, value, row, rendererInstances);
        } else if (col.render) {
          const result = col.render(value, row);
          appendRenderResult(td, result, rendererInstances);
        } else {
          td.textContent = value != null ? String(value) : '';
        }

        tr.appendChild(td);
      });

      tbody.appendChild(tr);

      // Expand row
      if (expandable && isExpanded) {
        const expandTr = document.createElement('tr');
        expandTr.className = 'ds-table-expand-row';
        const expandTd = document.createElement('td');
        expandTd.colSpan = getTotalColCount(columns, selection, expandable);
        const content = expandable(row);
        appendRenderResult(expandTd, content, rendererInstances);
        expandTr.appendChild(expandTd);
        tbody.appendChild(expandTr);
      }
    });

    if (virtualState?.bottomHeight) {
      appendVirtualSpacer(tbody, virtualState.bottomHeight, getTotalColCount(columns, selection, expandable));
    }
  }
  refs.virtualRowElements = virtualState ? nextVirtualRowElements : new Map();
  return tbody;
}

/**
 * Build the pagination controls.
 * @param {object} ctx
 * @param {number} total
 * @returns {HTMLElement}
 */
function renderPagination(ctx, total) {
  const { options, interactionListeners, state, clearProcessedCache } = ctx;
  const totalPages = Math.ceil(total / state.pageSize) || 1;
  const pagination = document.createElement('div');
  pagination.className = 'ds-table-pagination';

  const info = document.createElement('span');
  info.className = 'ds-table-page-info';
  const start = (state.currentPage - 1) * state.pageSize + 1;
  const end = Math.min(state.currentPage * state.pageSize, total);
  info.textContent = `${start}-${end} / ${total}`;

  const pages = document.createElement('div');
  pages.className = 'ds-table-pages';

  // Prev
  const prevBtn = document.createElement('button');
  prevBtn.type = 'button';
  prevBtn.className = 'ds-table-page-btn';
  prevBtn.textContent = '\u2039';
  prevBtn.disabled = state.currentPage <= 1;
  interactionListeners.on(prevBtn, 'click', () => {
    if (state.currentPage > 1) {
      state.currentPage--;
      clearProcessedCache();
      renderTable(ctx);
      if (options.onPageChange) {options.onPageChange(state.currentPage);}
    }
  });
  pages.appendChild(prevBtn);

  // Page numbers
  const pageNumbers = getPageNumbersData(state.currentPage, totalPages);
  pageNumbers.forEach(p => {
    if (p === '...') {
      const ellipsis = document.createElement('span');
      ellipsis.className = 'ds-table-page-ellipsis';
      ellipsis.textContent = '...';
      pages.appendChild(ellipsis);
    } else {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ds-table-page-btn' + (p === state.currentPage ? ' active' : '');
      btn.textContent = p;
      interactionListeners.on(btn, 'click', () => {
        state.currentPage = p;
        clearProcessedCache();
        renderTable(ctx);
        if (options.onPageChange) {options.onPageChange(state.currentPage);}
      });
      pages.appendChild(btn);
    }
  });

  // Next
  const nextBtn = document.createElement('button');
  nextBtn.type = 'button';
  nextBtn.className = 'ds-table-page-btn';
  nextBtn.textContent = '\u203A';
  nextBtn.disabled = state.currentPage >= totalPages;
  interactionListeners.on(nextBtn, 'click', () => {
    if (state.currentPage < totalPages) {
      state.currentPage++;
      clearProcessedCache();
      renderTable(ctx);
      if (options.onPageChange) {options.onPageChange(state.currentPage);}
    }
  });
  pages.appendChild(nextBtn);

  // Page size selector
  if (options.pageSizeOptions?.length > 1) {
    pagination.classList.add('ds-table-pagination--with-size');
    const select = document.createElement('select');
    select.className = 'ds-table-page-size';
    options.pageSizeOptions.forEach(size => {
      const opt = document.createElement('option');
      opt.value = size;
      opt.textContent = `${size} / page`;
      if (size === state.pageSize) {opt.selected = true;}
      select.appendChild(opt);
    });
    interactionListeners.on(select, 'change', () => {
      state.pageSize = Number(select.value);
      state.currentPage = 1;
      clearProcessedCache();
      renderTable(ctx);
    });
    pagination.appendChild(info);
    pagination.appendChild(pages);
    pagination.appendChild(select);
  } else {
    pagination.appendChild(info);
    pagination.appendChild(pages);
  }

  return pagination;
}

/**
 * Toggle a column sort (multi-sort aware).
 * @param {object} ctx
 * @param {string} key
 */
function handleSort(ctx, key) {
  const { options, multiSort, state, clearProcessedCache } = ctx;
  clearProcessedCache();

  const existing = state.sorts.find(s => s.key === key);
  if (existing) {
    if (existing.order === 'asc') {existing.order = 'desc';}
    else if (!multiSort) { state.sorts = []; }
    else { state.sorts = state.sorts.filter(s => s.key !== key); }
  } else {
    if (!multiSort) {state.sorts = [ { key, order: 'asc' } ];}
    else {state.sorts.push({ key, order: 'asc' });}
  }
  state.currentPage = 1;
  state.virtualScrollTop = 0;
  renderTable(ctx);
  if (options.onSort) {options.onSort(state.sorts);}
}

/**
 * Initialize column resize handles.
 * @param {object} ctx
 */
function initColumnResize(ctx) {
  const { element, columns, options, interactionListeners, resizeCleanups } = ctx;
  const handles = element.querySelectorAll('.ds-table-resize-handle');
  handles.forEach(handle => {
    let startX, startWidth, col;
    let cleanupDocumentListeners = null;
    const handleMouseDown = (e) => {
      const th = handle.parentElement;
      startX = e.pageX;
      startWidth = th.offsetWidth;
      const colKey = handle.getAttribute('data-col-key');
      col = columns.find(c => c.key === colKey);

      const resizeListeners = createListenerRegistry();

      const onMouseMove = (e) => {
        const diff = e.pageX - startX;
        const newWidth = Math.max(50, startWidth + diff);
        th.style.width = newWidth + 'px';
      };
      const onMouseUp = () => {
        cleanupDocumentListeners?.();
        if (col && options.onColumnResize) {
          options.onColumnResize(col.key, th.offsetWidth);
        }
      };
      cleanupDocumentListeners?.();
      const cleanup = () => {
        resizeListeners.destroy();
        resizeCleanups.delete(cleanup);
        if (cleanupDocumentListeners === cleanup) {cleanupDocumentListeners = null;}
      };
      cleanupDocumentListeners = cleanup;
      resizeCleanups.add(cleanup);
      resizeListeners.on(document, 'mousemove', onMouseMove);
      resizeListeners.on(document, 'mouseup', onMouseUp);
    };
    interactionListeners.on(handle, 'mousedown', handleMouseDown);
  });
}

/**
 * Initialize row drag-and-drop handlers.
 * @param {object} ctx
 */
function initRowDrag(ctx) {
  const { element, interactionListeners } = ctx;
  const rows = element.querySelectorAll('tbody tr[data-row-key]');
  rows.forEach(row => {
    const onDragStart = (e) => {
      row.classList.add('ds-table-dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', row.getAttribute('data-row-key'));
    };
    const onDragOver = (e) => {
      e.preventDefault();
      row.classList.add('ds-table-drag-over');
    };
    const onDragLeave = () => row.classList.remove('ds-table-drag-over');
    const onDrop = (e) => {
      e.preventDefault();
      row.classList.remove('ds-table-drag-over');
      const fromKey = e.dataTransfer.getData('text/plain');
      const toKey = row.getAttribute('data-row-key');
      if (fromKey !== toKey) {reorderRows(ctx, fromKey, toKey);}
    };
    const onDragEnd = () => {
      row.classList.remove('ds-table-dragging');
      rows.forEach(r => r.classList.remove('ds-table-drag-over'));
    };

    interactionListeners.on(row, 'dragstart', onDragStart);
    interactionListeners.on(row, 'dragover', onDragOver);
    interactionListeners.on(row, 'dragleave', onDragLeave);
    interactionListeners.on(row, 'drop', onDrop);
    interactionListeners.on(row, 'dragend', onDragEnd);
  });
}

/**
 * Reorder rows after a drag operation.
 * @param {object} ctx
 * @param {*} fromKey
 * @param {*} toKey
 */
function reorderRows(ctx, fromKey, toKey) {
  const { state, rowKey, options, clearCaches } = ctx;
  const fromIdx = state.data.findIndex(r => String(r[rowKey]) === String(fromKey));
  const toIdx = state.data.findIndex(r => String(r[rowKey]) === String(toKey));
  if (fromIdx === -1 || toIdx === -1) {return;}
  const [ item ] = state.data.splice(fromIdx, 1);
  state.data.splice(toIdx, 0, item);
  clearCaches();
  renderTable(ctx);
  if (options.onRowDragEnd) {options.onRowDragEnd(fromKey, toKey);}
}
