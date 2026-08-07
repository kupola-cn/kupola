// SPDX-License-Identifier: MIT
/**
 * Table - 2.0
 *
 * Full-featured data table with sorting, filtering, pagination,
 * selection, expand rows, inline edit, column resize, row drag,
 * tree data, virtual scroll, merge cells, and CSV export.
 *
 * @module Table
 */

import { t } from '@kupola/platform/i18n';
import { createListenerRegistry } from './listener-registry';
import {
  appendRenderResult,
  appendVirtualSpacer,
  getTableClass,
  getTotalColCount,
  renderCellValue,
  renderExpandCell,
  renderSelectionCell,
  syncSelectionDOM,
} from './table-render.js';
import { cancelEdit, renderEditCell, saveEdit, startEdit } from './table-editing.js';
import {
  escapeCSV as escapeCSVData,
  filterTree as filterTreeData,
  flattenVisible as flattenVisibleData,
  getChildrenKey,
  getPageNumbers as getPageNumbersData,
  normalizeData as normalizeDataData,
  rowMatchesFilter as rowMatchesFilterData,
  sortData as sortDataData,
  treeExpandAll as treeExpandAllData,
} from './table-data.js';
import { computeVirtualState, isVirtualEnabled } from './table-virtual.js';

/**
 * @typedef {Object} TableColumn
 * @property {string} key - Column data key
 * @property {string} [title] - Column header title
 * @property {string|number} [width] - Column width
 * @property {string|number} [minWidth] - Min width
 * @property {string} [align] - Text alignment
 * @property {boolean} [sortable] - Enable sorting
 * @property {Function} [sorter] - Custom sort function(a, b, order)
 * @property {Function} [render] - Custom render(value, row) => string|HTMLElement
 * @property {string} [fixed] - 'left' | 'right'
 * @property {boolean} [editable] - Enable inline editing
 * @property {Function} [filterFn] - Custom filter function(value, filterText)
 */

/**
 * Create a Table instance.
 * @param {Object} options
 * @param {Array} [options.data=[]] - Table data
 * @param {Array} options.columns - Column definitions
 * @param {string} [options.rowKey='id'] - Unique row key field
 * @param {boolean} [options.striped=false] - Striped rows
 * @param {boolean} [options.compact=false] - Compact mode
 * @param {boolean} [options.hoverable=true] - Hover highlight
 * @param {boolean} [options.bordered=false] - Bordered
 * @param {string|null} [options.selection=null] - 'checkbox' | 'radio' | null
 * @param {Function|null} [options.expandable=null] - Expand render(row) => string|HTMLElement
 * @param {boolean} [options.editable=false] - Enable inline editing
 * @param {boolean} [options.resizable=false] - Column resize
 * @param {boolean} [options.draggable=false] - Row drag
 * @param {Object|null} [options.tree=null] - Tree data config { childrenKey, defaultExpandAll }
 * @param {Object|null} [options.virtualScroll=null] - Virtual scroll { rowHeight, overscan, height, visibleRows }
 * @param {Function|null} [options.mergeCells=null] - Merge cells function(data) => [{row,col,rowSpan,colSpan}]
 * @param {boolean} [options.showFilter=false] - Show filter input
 * @param {boolean} [options.showToolbar=false] - Show toolbar
 * @param {boolean} [options.showPagination=true] - Show pagination
 * @param {number} [options.pageSize=10] - Page size
 * @param {number[]} [options.pageSizeOptions=[10,20,50]] - Page size options
 * @param {string} [options.emptyText='No data'] - Empty text
 * @param {string} [options.loadingText='Loading...'] - Loading text
 * @param {boolean} [options.multiSort=false] - Multi-column sort
 * @param {Function} [options.onSort=null] - Sort callback
 * @param {Function} [options.onPageChange=null] - Page change callback
 * @param {Function} [options.onRowClick=null] - Row click callback
 * @param {Function} [options.onFilter=null] - Filter callback
 * @param {Function} [options.onSelect=null] - Selection change callback
 * @param {Function} [options.onExpand=null] - Expand callback
 * @param {Function} [options.onEditSave=null] - Edit save callback
 * @param {Function} [options.onEditCancel=null] - Edit cancel callback
 * @param {Function} [options.onRowDragEnd=null] - Row drag end callback
 * @param {Function} [options.onColumnResize=null] - Column resize callback
 * @returns {Object} Table element, state accessors, mutation methods, export, refresh, and destroy lifecycle
 */
export function Table(options = {}) {
  if (!(options && typeof options === 'object')) {
    throw new TypeError('Table options must be an object.');
  }

  const element = document.createElement('div');
  const listeners = createListenerRegistry();
  const interactionListeners = createListenerRegistry();

  // Core config
  const columns = options.columns || [];
  const rowKey = options.rowKey || 'id';
  const selection = options.selection || null;
  const expandable = options.expandable || null;
  const editable = options.editable || false;
  const resizable = options.resizable || false;
  const draggable = options.draggable || false;
  const treeConfig = options.tree || null;
  const virtualScroll = options.virtualScroll || null;
  const mergeCellsFn = options.mergeCells || null;
  const multiSort = options.multiSort || false;

  // Column index map for O(1) lookup
  const _columnsMap = new Map(columns.map(col => [ col.key, col ]));

  // State
  let _data = normalizeData(options.data);
  let _loading = false;
  let _sorts = []; // [{ key, order }]
  let _currentPage = 1;
  let _pageSize = options.pageSize || 10;
  let _filterText = '';
  let _selectedKeys = new Set();
  let _expandedKeys = new Set();
  let _treeExpandedKeys = new Set();
  const editing = { cell: null, buffer: {} }; // { rowKey, colKey } / per-column buffer
  let _reactiveCleanups = [];
  let _dataSubscription = null;
  let _loadingSubscription = null;
  let _filterDebounceTimer = null;
  let _virtualScrollTop = 0;
  let _virtualFrame = null;
  let _destroyed = false;
  const rendererInstances = new Set();
  const resizeCleanups = new Set();
  let toolbarElement = null;
  let tableContainerElement = null;
  let tableElement = null;
  let paginationElement = null;
  let virtualRowElements = new Map();
  const _requestFrame = globalThis.requestAnimationFrame || (fn => setTimeout(fn, 16));
  const _cancelFrame = globalThis.cancelAnimationFrame || clearTimeout;

  // Sort cache is keyed by array identity, not stringified row data.
  let _sortCache = new WeakMap();

  // Processed data cache (for avoiding repeated calls during render)
  let _processedCache = null;

  // Tree expand all
  if (treeConfig?.defaultExpandAll) {
    _treeExpandAll(_data);
  }

  // Init
  element.classList.add('ds-table-wrapper');
  if (virtualScroll) {element.classList.add('ds-table-virtual-wrapper');}
  _render();

  // === Tree helpers ===
  function _treeExpandAll(data, ck) {
    treeExpandAllData(data, ck || getChildrenKey(treeConfig), rowKey, _treeExpandedKeys);
  }

  function _flattenVisible(data, level, ck) {
    return flattenVisibleData(data, level, ck || getChildrenKey(treeConfig), rowKey, _treeExpandedKeys);
  }

  function _isVirtualEnabled() {
    return isVirtualEnabled(options);
  }

  function _shouldPaginate() {
    return !_isVirtualEnabled() && options.showPagination !== false && _pageSize > 0;
  }

  // === Data processing: sort → filter → paginate ===
  function getProcessedData(includePagination = true) {
    // Check if cache is valid
    if (includePagination && _processedCache) {
      return _processedCache;
    }

    let data = _data;

    // Sort FIRST (before copy/filter) to enable cache based on _data reference
    if (_sorts.length > 0) {
      data = _sortData(data);
    }

    // Then copy
    data = [ ...data ];

    // Filter
    if (_filterText) {
      const text = _filterText.toLowerCase();
      if (treeConfig) {
        data = _filterTree(data, text);
      } else {
        data = data.filter(row => _rowMatchesFilter(row, text));
      }
    }

    const flatData = treeConfig ? _flattenVisible(data, 0) : data;
    const total = flatData.length;

    // Paginate
    let pageData = flatData;
    if (includePagination && _shouldPaginate()) {
      const start = (_currentPage - 1) * _pageSize;
      pageData = flatData.slice(start, start + _pageSize);
    }

    // Cache result for current render cycle
    const result = { pageData, total };
    if (includePagination) {_processedCache = result;}

    return result;
  }

  function normalizeData(data) {
    return normalizeDataData(data, rowKey, treeConfig);
  }

  function normalizePageAndSelection() {
    const { total } = getProcessedData();
    const totalPages = Math.ceil(total / _pageSize) || 1;
    _currentPage = Math.min(Math.max(1, _currentPage), totalPages);
    const validKeys = new Set();
    const visit = rows => {
      for (const row of rows) {
        if (!row || typeof row !== 'object') {continue;}
        validKeys.add(row[rowKey]);
        const childrenKey = treeConfig?.childrenKey || 'children';
        if (treeConfig && Array.isArray(row[childrenKey])) {visit(row[childrenKey]);}
      }
    };
    visit(_data);
    _selectedKeys = new Set([ ..._selectedKeys ].filter(key => validKeys.has(key)));
    _expandedKeys = new Set([ ..._expandedKeys ].filter(key => validKeys.has(key)));
    _clearProcessedCache();
  }

  // Clear caches when data/state changes
  function _clearCaches() {
    _sortCache = new WeakMap();
    _processedCache = null;
  }

  function _clearProcessedCache() {
    _processedCache = null;
  }

  function _filterTree(data, text, ck) {
    return filterTreeData(
      data, text, ck || getChildrenKey(treeConfig), rowKey, _treeExpandedKeys, columns, _filterText,
    );
  }

  function _rowMatchesFilter(row, text) {
    return rowMatchesFilterData(row, text, columns, _filterText);
  }

  function _sortData(data) {
    return sortDataData(data, _sorts, _columnsMap, treeConfig, _sortCache);
  }

  // === Render ===
  function _render() {
    if (_destroyed) {return;}
    for (const renderer of [ ...rendererInstances ]) {
      try {renderer.destroy?.();} catch { /* continue rebuilding the table */ }
    }
    rendererInstances.clear();
    _cancelFilterDebounce();
    _runInteractionCleanups();

    const { pageData, total } = getProcessedData();
    const virtualState = _isVirtualEnabled() && !_loading && pageData.length > 0
      ? _getVirtualState(pageData)
      : null;
    element.classList.toggle('ds-table-virtual-wrapper', !!virtualState);

    // Toolbar
    toolbarElement?.remove();
    toolbarElement = null;
    if (options.showFilter || options.showToolbar) {
      toolbarElement = _renderToolbar();
      element.insertBefore(toolbarElement, tableContainerElement || null);
    }

    // Keep the table shell stable across data/state updates. Rebuilding only
    // the changed sections avoids invalidating the host layout and focus tree.
    if (!tableContainerElement) {
      tableContainerElement = document.createElement('div');
      tableContainerElement.className = 'ds-table-container';
      tableElement = document.createElement('table');
      element.appendChild(tableContainerElement);
    }
    const tableContainer = tableContainerElement;
    if (virtualState) {
      tableContainer.style.height = virtualState.heightStyle;
      tableContainer.style.overflowY = 'auto';
      interactionListeners.on(tableContainer, 'scroll', _handleVirtualScroll);
    } else {
      tableContainer.style.removeProperty('height');
      tableContainer.style.removeProperty('overflow-y');
    }

    tableElement.className = getTableClass(options);

    tableElement.replaceChildren(
      _renderThead(),
      _renderTbody(virtualState ? virtualState.rows : pageData, virtualState),
    );
    tableContainer.replaceChildren(tableElement);
    if (virtualState) {
      tableContainer.scrollTop = _virtualScrollTop;
    }

    // Pagination
    paginationElement?.remove();
    paginationElement = null;
    if (_shouldPaginate() && total > _pageSize) {
      paginationElement = _renderPagination(total);
      element.appendChild(paginationElement);
    }

    // Post-render
    if (resizable) {_initColumnResize();}
    if (draggable) {_initRowDrag();}
  }

  function _runInteractionCleanups() {
    for (const cleanup of [ ...resizeCleanups ]) {cleanup();}
    interactionListeners.clear();
  }

  function _getVirtualState(data) {
    const state = computeVirtualState(data, virtualScroll, _pageSize, _virtualScrollTop);
    _virtualScrollTop = state.scrollTop;
    return state;
  }

  function _handleVirtualScroll(event) {
    _virtualScrollTop = event.currentTarget.scrollTop;
    _scheduleRender();
  }

  function _scheduleRender() {
    if (_virtualFrame != null || _destroyed) {return;}
    _virtualFrame = _requestFrame(() => {
      _virtualFrame = null;
      _render();
    });
  }

  function _cancelVirtualFrame() {
    if (_virtualFrame == null) {return;}
    _cancelFrame(_virtualFrame);
    _virtualFrame = null;
  }

  function _cancelFilterDebounce() {
    if (_filterDebounceTimer === null) {return;}
    clearTimeout(_filterDebounceTimer);
    _filterDebounceTimer = null;
  }

  function _renderToolbar() {
    const toolbar = document.createElement('div');
    toolbar.className = 'ds-table-toolbar';

    const left = document.createElement('div');
    if (selection === 'checkbox' && _selectedKeys.size > 0) {
      const info = document.createElement('span');
      info.className = 'ds-table-selection-info';
      info.textContent = `Selected ${_selectedKeys.size} items`;
      left.appendChild(info);
    }

    const right = document.createElement('div');
    right.className = 'ds-table-toolbar-right';

    if (options.showFilter) {
      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'ds-table-filter-input';
      input.placeholder = 'Filter...';
      input.value = _filterText;
      interactionListeners.on(input, 'input', () => {
        _cancelFilterDebounce();
        _filterDebounceTimer = setTimeout(() => {
          _filterDebounceTimer = null;
          if (_destroyed) {return;}
          _filterText = input.value;
          _currentPage = 1;
          _virtualScrollTop = 0;
          _clearProcessedCache();
          _render();
          if (options.onFilter) {options.onFilter(_filterText);}
        }, 300);
      });
      right.appendChild(input);
    }

    toolbar.appendChild(left);
    toolbar.appendChild(right);
    return toolbar;
  }

  function _renderThead() {
    const thead = document.createElement('thead');
    const tr = document.createElement('tr');

    if (selection) {_renderSelectionHeader(tr);}
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
        const sortInfo = _sorts.find(s => s.key === col.key);
        if (sortInfo) {th.classList.add(`ds-table-sort-${sortInfo.order}`);}

        interactionListeners.on(th, 'click', () => _handleSort(col.key));

        const indicator = document.createElement('span');
        indicator.className = 'ds-table-sort-icon';
        if (sortInfo) {
          indicator.textContent = multiSort
            ? ` ${_sorts.indexOf(sortInfo) + 1}${sortInfo.order === 'asc' ? '\u25B2' : '\u25BC'}`
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

  function _renderSelectionHeader(tr) {
    const th = document.createElement('th');
    th.className = 'ds-table-col-selection';
    if (selection === 'checkbox') {
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      const { pageData } = getProcessedData();
      const allKeys = pageData.map(r => r[rowKey]);
      cb.checked = allKeys.length > 0 && allKeys.every(k => _selectedKeys.has(k));
      interactionListeners.on(cb, 'change', () => cb.checked ? selectAll() : deselectAll());
      th.appendChild(cb);
    }
    tr.appendChild(th);
  }

  function _renderTbody(data, virtualState = null) {
    const tbody = document.createElement('tbody');
    const nextVirtualRowElements = new Map();

    if (_loading) {
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
        const isSelected = _selectedKeys.has(key);
        const isExpanded = _expandedKeys.has(key);

        const tr = virtualState && virtualRowElements.get(key)
          ? virtualRowElements.get(key)
          : document.createElement('tr');
        if (virtualState && virtualRowElements.has(key)) {
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
            td.appendChild(renderEditCell(editing, td, row, col, key, interactionListeners, _saveEdit, _cancelEdit));
          } else if (col.editable && editable) {
            td.classList.add('ds-table-editable-cell');
            interactionListeners.on(td, 'dblclick', () => startEdit(editing, key, col.key, value, _render));
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
    virtualRowElements = virtualState ? nextVirtualRowElements : new Map();
    return tbody;
  }

  function _saveEdit(rowKeyVal, colKey) {
    saveEdit(editing, _data, rowKey, rowKeyVal, colKey, _clearCaches, _render, options.onEditSave);
  }

  function _cancelEdit() {
    cancelEdit(editing, _render, options.onEditCancel);
  }

  // === Sort ===
  function _handleSort(key) {
    _clearProcessedCache();

    const existing = _sorts.find(s => s.key === key);
    if (existing) {
      if (existing.order === 'asc') {existing.order = 'desc';}
      else if (!multiSort) { _sorts = []; }
      else { _sorts = _sorts.filter(s => s.key !== key); }
    } else {
      if (!multiSort) {_sorts = [ { key, order: 'asc' } ];}
      else {_sorts.push({ key, order: 'asc' });}
    }
    _currentPage = 1;
    _virtualScrollTop = 0;
    _render();
    if (options.onSort) {options.onSort(_sorts);}
  }

  // === Pagination ===
  function _renderPagination(total) {
    const totalPages = Math.ceil(total / _pageSize) || 1;
    const pagination = document.createElement('div');
    pagination.className = 'ds-table-pagination';

    const info = document.createElement('span');
    info.className = 'ds-table-page-info';
    const start = (_currentPage - 1) * _pageSize + 1;
    const end = Math.min(_currentPage * _pageSize, total);
    info.textContent = `${start}-${end} / ${total}`;

    const pages = document.createElement('div');
    pages.className = 'ds-table-pages';

    // Prev
    const prevBtn = document.createElement('button');
    prevBtn.type = 'button';
    prevBtn.className = 'ds-table-page-btn';
    prevBtn.textContent = '\u2039';
    prevBtn.disabled = _currentPage <= 1;
    interactionListeners.on(prevBtn, 'click', () => {
      if (_currentPage > 1) {
        _currentPage--;
        _clearProcessedCache();
        _render();
        if (options.onPageChange) {options.onPageChange(_currentPage);}
      }
    });
    pages.appendChild(prevBtn);

    // Page numbers
    const pageNumbers = _getPageNumbers(_currentPage, totalPages);
    pageNumbers.forEach(p => {
      if (p === '...') {
        const ellipsis = document.createElement('span');
        ellipsis.className = 'ds-table-page-ellipsis';
        ellipsis.textContent = '...';
        pages.appendChild(ellipsis);
      } else {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'ds-table-page-btn' + (p === _currentPage ? ' active' : '');
        btn.textContent = p;
        interactionListeners.on(btn, 'click', () => {
          _currentPage = p;
          _clearProcessedCache();
          _render();
          if (options.onPageChange) {options.onPageChange(_currentPage);}
        });
        pages.appendChild(btn);
      }
    });

    // Next
    const nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className = 'ds-table-page-btn';
    nextBtn.textContent = '\u203A';
    nextBtn.disabled = _currentPage >= totalPages;
    interactionListeners.on(nextBtn, 'click', () => {
      if (_currentPage < totalPages) {
        _currentPage++;
        _clearProcessedCache();
        _render();
        if (options.onPageChange) {options.onPageChange(_currentPage);}
      }
    });
    pages.appendChild(nextBtn);

    // Page size selector
    if (options.pageSizeOptions?.length > 1) {
      const select = document.createElement('select');
      select.className = 'ds-table-page-size';
      options.pageSizeOptions.forEach(size => {
        const opt = document.createElement('option');
        opt.value = size;
        opt.textContent = `${size} / page`;
        if (size === _pageSize) {opt.selected = true;}
        select.appendChild(opt);
      });
      interactionListeners.on(select, 'change', () => {
        _pageSize = Number(select.value);
        _currentPage = 1;
        _clearProcessedCache();
        _render();
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

  function _getPageNumbers(current, total) {
    return getPageNumbersData(current, total);
  }

  // === Column Resize ===
  function _initColumnResize() {
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

  // === Row Drag ===
  function _initRowDrag() {
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
        if (fromKey !== toKey) {_reorderRows(fromKey, toKey);}
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

  function _reorderRows(fromKey, toKey) {
    const fromIdx = _data.findIndex(r => String(r[rowKey]) === String(fromKey));
    const toIdx = _data.findIndex(r => String(r[rowKey]) === String(toKey));
    if (fromIdx === -1 || toIdx === -1) {return;}
    const [ item ] = _data.splice(fromIdx, 1);
    _data.splice(toIdx, 0, item);
    _clearCaches();
    _render();
    if (options.onRowDragEnd) {options.onRowDragEnd(fromKey, toKey);}
  }

  // === Public API ===

  function setData(data) {
    // Clear caches before data change
    _clearCaches();
    _virtualScrollTop = 0;
    if (_dataSubscription) {
      _dataSubscription();
      _reactiveCleanups = _reactiveCleanups.filter(cleanup => cleanup !== _dataSubscription);
    }
    _dataSubscription = null;

    if (data && typeof data === 'object' && 'value' in data) {
      _data = normalizeData(data.value);
      if (data.subscribe) {
        _dataSubscription = data.subscribe((newVal) => {
          _clearCaches();
          _data = normalizeData(newVal);
          normalizePageAndSelection();
          _render();
        });
        if (typeof _dataSubscription === 'function') {
          _reactiveCleanups.push(_dataSubscription);
        } else {
          _dataSubscription = null;
        }
      }
    } else if (Array.isArray(data)) {
      _data = normalizeData(data);
    } else {
      _data = [];
    }
    if (treeConfig && treeConfig.defaultExpandAll) {
      _treeExpandedKeys.clear();
      _treeExpandAll(_data);
    }
    normalizePageAndSelection();
    _render();
  }

  function setLoading(loading) {
    if (_loadingSubscription) {
      _loadingSubscription();
      _reactiveCleanups = _reactiveCleanups.filter(cleanup => cleanup !== _loadingSubscription);
    }
    _loadingSubscription = null;
    if (loading && typeof loading === 'object' && 'value' in loading) {
      _loading = !!loading.value;
      if (loading.subscribe) {
        _loadingSubscription = loading.subscribe((val) => { _loading = !!val; _render(); });
        if (typeof _loadingSubscription === 'function') {
          _reactiveCleanups.push(_loadingSubscription);
        } else {
          _loadingSubscription = null;
        }
      }
    } else {
      _loading = !!loading;
    }
    _render();
  }

  function getData() { return [ ..._data ]; }

  function getSelectedKeys() { return [ ..._selectedKeys ]; }

  function getSelectedRows() {
    return _data.filter(r => _selectedKeys.has(r[rowKey]));
  }

  function selectRow(key) {
    if (selection === 'radio') {
      _selectedKeys.clear();
      _selectedKeys.add(key);
    } else {
      _selectedKeys.add(key);
    }
    syncSelectionDOM({ element, selection, selectedKeys: _selectedKeys, getProcessedData, rowKey, options });
    if (options.onSelect) {options.onSelect(getSelectedKeys(), getSelectedRows());}
  }

  function deselectRow(key) {
    _selectedKeys.delete(key);
    syncSelectionDOM({ element, selection, selectedKeys: _selectedKeys, getProcessedData, rowKey, options });
    if (options.onSelect) {options.onSelect(getSelectedKeys(), getSelectedRows());}
  }

  function selectAll() {
    const { pageData } = getProcessedData();
    pageData.forEach(r => _selectedKeys.add(r[rowKey]));
    syncSelectionDOM({ element, selection, selectedKeys: _selectedKeys, getProcessedData, rowKey, options });
    if (options.onSelect) {options.onSelect(getSelectedKeys(), getSelectedRows());}
  }

  function deselectAll() {
    _selectedKeys.clear();
    syncSelectionDOM({ element, selection, selectedKeys: _selectedKeys, getProcessedData, rowKey, options });
    if (options.onSelect) {options.onSelect(getSelectedKeys(), getSelectedRows());}
  }

  function toggleExpand(key) {
    if (_expandedKeys.has(key)) {_expandedKeys.delete(key);}
    else {_expandedKeys.add(key);}
    _render();
    if (options.onExpand) {options.onExpand(key, _expandedKeys.has(key));}
  }

  function expandAll() {
    const { pageData } = getProcessedData();
    pageData.forEach(r => _expandedKeys.add(r[rowKey]));
    _render();
  }

  function collapseAll() {
    _expandedKeys.clear();
    _render();
  }

  function setSort(key, order) {
    _clearProcessedCache();
    if (!multiSort) {_sorts = [ { key, order: order || 'asc' } ];}
    else {
      const existing = _sorts.find(s => s.key === key);
      if (existing) {existing.order = order || 'asc';}
      else {_sorts.push({ key, order: order || 'asc' });}
    }
    _currentPage = 1;
    _virtualScrollTop = 0;
    _render();
  }

  function clearSort() {
    _clearProcessedCache();
    _sorts = [];
    _virtualScrollTop = 0;
    _render();
  }

  function setPage(page) {
    const targetPage = Math.max(1, Math.floor(Number(page)) || 1);
    const { total } = getProcessedData();
    const totalPages = Math.ceil(total / _pageSize) || 1;
    _currentPage = Math.min(targetPage, totalPages);
    _clearProcessedCache();
    _render();
    if (options.onPageChange) {options.onPageChange(_currentPage);}
  }

  function setPageSize(size) {
    _pageSize = Math.max(1, Math.floor(Number(size)) || 1);
    _currentPage = 1;
    _clearProcessedCache();
    _render();
  }

  function setFilterText(text) {
    _clearProcessedCache();
    _filterText = text == null ? '' : String(text);
    _currentPage = 1;
    _virtualScrollTop = 0;
    _render();
  }

  function getFilterText() { return _filterText; }

  function exportCSV() {
    const headers = columns.map(c => _escapeCSV(c.title || c.key)).join(',');
    const { pageData } = getProcessedData(false);
    const rows = pageData.map(row =>
      columns.map(col => {
        const val = row[col.key];
        return _escapeCSV(val);
      }).join(','),
    );
    return [ headers, ...rows ].join('\n');
  }

  function _escapeCSV(value) {
    return escapeCSVData(value);
  }

  function refresh() { _render(); }

  function destroy() {
    if (_destroyed) {return;}
    _destroyed = true;
    _cancelVirtualFrame();
    for (const cleanup of [ ...resizeCleanups ]) {cleanup();}
    resizeCleanups.clear();
    listeners.destroy();
    interactionListeners.destroy();
    _reactiveCleanups.forEach(fn => fn());
    _reactiveCleanups.length = 0;
    _dataSubscription = null;
    _loadingSubscription = null;
    _cancelFilterDebounce();
    for (const renderer of [ ...rendererInstances ]) {
      try {renderer.destroy?.();} catch { /* preserve table teardown */ }
    }
    rendererInstances.clear();
    element.remove();
  }

  return {
    element, destroy, setData, setLoading, getData, getProcessedData: () => getProcessedData().pageData,
    getSelectedRows, getSelectedKeys, selectRow, deselectRow, selectAll, deselectAll,
    toggleExpand, expandAll, collapseAll,
    setSort, clearSort, setPage, setPageSize, setFilterText, getFilterText,
    exportCSV, refresh,
  };
}
