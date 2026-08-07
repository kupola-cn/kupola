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

import { createListenerRegistry } from './listener-registry';
import {
  cancelFilterDebounce,
  cancelVirtualFrame,
  renderTable,
  syncSelectionDOM,
} from './table-render.js';
import { cancelEdit, saveEdit } from './table-editing.js';
import {
  escapeCSV as escapeCSVData,
  filterTree as filterTreeData,
  flattenVisible as flattenVisibleData,
  getChildrenKey,
  normalizeData as normalizeDataData,
  rowMatchesFilter as rowMatchesFilterData,
  sortData as sortDataData,
  treeExpandAll as treeExpandAllData,
} from './table-data.js';
import { isVirtualEnabled } from './table-virtual.js';

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
  const columnsMap = new Map(columns.map(col => [ col.key, col ]));

  // Shared state lives in a single object so the render/editing modules can
  // read and mutate it without restructuring the component closure.
  const state = {
    data: normalizeData(options.data),
    loading: false,
    sorts: [], // [{ key, order }]
    currentPage: 1,
    pageSize: options.pageSize || 10,
    filterText: '',
    selectedKeys: new Set(),
    expandedKeys: new Set(),
    treeExpandedKeys: new Set(),
    filterDebounceTimer: null,
    virtualScrollTop: 0,
    virtualFrame: null,
    destroyed: false,
    // Sort cache is keyed by array identity, not stringified row data.
    sortCache: new WeakMap(),
    // Processed data cache (for avoiding repeated calls during render)
    processedCache: null,
  };
  const refs = {
    toolbarElement: null,
    tableContainerElement: null,
    tableElement: null,
    paginationElement: null,
    virtualRowElements: new Map(),
  };
  const editing = { cell: null, buffer: {} }; // { rowKey, colKey } / per-column buffer
  let reactiveCleanups = [];
  let dataSubscription = null;
  let loadingSubscription = null;
  const rendererInstances = new Set();
  const resizeCleanups = new Set();
  const requestFrame = globalThis.requestAnimationFrame || (fn => setTimeout(fn, 16));
  const cancelFrame = globalThis.cancelAnimationFrame || clearTimeout;

  // Tree expand all
  if (treeConfig?.defaultExpandAll) {
    _treeExpandAll(state.data);
  }

  // Init
  element.classList.add('ds-table-wrapper');
  if (virtualScroll) {element.classList.add('ds-table-virtual-wrapper');}

  // Shared context for the render/editing modules. Function declarations are
  // hoisted, so referencing them here is safe; ctx is initialized before the
  // first render call below.
  const ctx = {
    options, columns, rowKey, selection, expandable, editable, resizable, draggable,
    multiSort, mergeCellsFn, virtualScroll, element, columnsMap,
    interactionListeners, rendererInstances, resizeCleanups, state, refs, editing,
    requestFrame, cancelFrame,
    getProcessedData, isVirtualEnabled: _isVirtualEnabled, shouldPaginate: _shouldPaginate,
    clearCaches: _clearCaches, clearProcessedCache: _clearProcessedCache,
    saveEdit: _saveEdit, cancelEdit: _cancelEdit,
    selectRow, deselectRow, selectAll, deselectAll, toggleExpand, setPage, setPageSize,
  };

  _render();

  // === Tree helpers ===
  function _treeExpandAll(data, ck) {
    treeExpandAllData(data, ck || getChildrenKey(treeConfig), rowKey, state.treeExpandedKeys);
  }

  function _flattenVisible(data, level, ck) {
    return flattenVisibleData(data, level, ck || getChildrenKey(treeConfig), rowKey, state.treeExpandedKeys);
  }

  function _isVirtualEnabled() {
    return isVirtualEnabled(options);
  }

  function _shouldPaginate() {
    return !_isVirtualEnabled() && options.showPagination !== false && state.pageSize > 0;
  }

  // === Data processing: sort → filter → paginate ===
  function getProcessedData(includePagination = true) {
    // Check if cache is valid
    if (includePagination && state.processedCache) {
      return state.processedCache;
    }

    let data = state.data;

    // Sort FIRST (before copy/filter) to enable cache based on state.data reference
    if (state.sorts.length > 0) {
      data = _sortData(data);
    }

    // Then copy
    data = [ ...data ];

    // Filter
    if (state.filterText) {
      const text = state.filterText.toLowerCase();
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
      const start = (state.currentPage - 1) * state.pageSize;
      pageData = flatData.slice(start, start + state.pageSize);
    }

    // Cache result for current render cycle
    const result = { pageData, total };
    if (includePagination) {state.processedCache = result;}

    return result;
  }

  function normalizeData(data) {
    return normalizeDataData(data, rowKey, treeConfig);
  }

  function normalizePageAndSelection() {
    const { total } = getProcessedData();
    const totalPages = Math.ceil(total / state.pageSize) || 1;
    state.currentPage = Math.min(Math.max(1, state.currentPage), totalPages);
    const validKeys = new Set();
    const visit = rows => {
      for (const row of rows) {
        if (!row || typeof row !== 'object') {continue;}
        validKeys.add(row[rowKey]);
        const childrenKey = treeConfig?.childrenKey || 'children';
        if (treeConfig && Array.isArray(row[childrenKey])) {visit(row[childrenKey]);}
      }
    };
    visit(state.data);
    state.selectedKeys = new Set([ ...state.selectedKeys ].filter(key => validKeys.has(key)));
    state.expandedKeys = new Set([ ...state.expandedKeys ].filter(key => validKeys.has(key)));
    _clearProcessedCache();
  }

  // Clear caches when data/state changes
  function _clearCaches() {
    state.sortCache = new WeakMap();
    state.processedCache = null;
  }

  function _clearProcessedCache() {
    state.processedCache = null;
  }

  function _filterTree(data, text, ck) {
    return filterTreeData(
      data, text, ck || getChildrenKey(treeConfig), rowKey, state.treeExpandedKeys, columns, state.filterText,
    );
  }

  function _rowMatchesFilter(row, text) {
    return rowMatchesFilterData(row, text, columns, state.filterText);
  }

  function _sortData(data) {
    return sortDataData(data, state.sorts, columnsMap, treeConfig, state.sortCache);
  }
  function _render() {
    renderTable(ctx);
  }
  function _cancelVirtualFrame() {
    cancelVirtualFrame(ctx);
  }

  function _cancelFilterDebounce() {
    cancelFilterDebounce(ctx);
  }
  function _saveEdit(rowKeyVal, colKey) {
    saveEdit(editing, state.data, rowKey, rowKeyVal, colKey, _clearCaches, _render, options.onEditSave);
  }

  function _cancelEdit() {
    cancelEdit(editing, _render, options.onEditCancel);
  }
  function setData(data) {
    // Clear caches before data change
    _clearCaches();
    state.virtualScrollTop = 0;
    if (dataSubscription) {
      dataSubscription();
      reactiveCleanups = reactiveCleanups.filter(cleanup => cleanup !== dataSubscription);
    }
    dataSubscription = null;

    if (data && typeof data === 'object' && 'value' in data) {
      state.data = normalizeData(data.value);
      if (data.subscribe) {
        dataSubscription = data.subscribe((newVal) => {
          _clearCaches();
          state.data = normalizeData(newVal);
          normalizePageAndSelection();
          _render();
        });
        if (typeof dataSubscription === 'function') {
          reactiveCleanups.push(dataSubscription);
        } else {
          dataSubscription = null;
        }
      }
    } else if (Array.isArray(data)) {
      state.data = normalizeData(data);
    } else {
      state.data = [];
    }
    if (treeConfig && treeConfig.defaultExpandAll) {
      state.treeExpandedKeys.clear();
      _treeExpandAll(state.data);
    }
    normalizePageAndSelection();
    _render();
  }

  function setLoading(loading) {
    if (loadingSubscription) {
      loadingSubscription();
      reactiveCleanups = reactiveCleanups.filter(cleanup => cleanup !== loadingSubscription);
    }
    loadingSubscription = null;
    if (loading && typeof loading === 'object' && 'value' in loading) {
      state.loading = !!loading.value;
      if (loading.subscribe) {
        loadingSubscription = loading.subscribe((val) => { state.loading = !!val; _render(); });
        if (typeof loadingSubscription === 'function') {
          reactiveCleanups.push(loadingSubscription);
        } else {
          loadingSubscription = null;
        }
      }
    } else {
      state.loading = !!loading;
    }
    _render();
  }

  function getData() { return [ ...state.data ]; }

  function getSelectedKeys() { return [ ...state.selectedKeys ]; }

  function getSelectedRows() {
    return state.data.filter(r => state.selectedKeys.has(r[rowKey]));
  }

  function selectRow(key) {
    if (selection === 'radio') {
      state.selectedKeys.clear();
      state.selectedKeys.add(key);
    } else {
      state.selectedKeys.add(key);
    }
    syncSelectionDOM({ element, selection, selectedKeys: state.selectedKeys, getProcessedData, rowKey, options });
    if (options.onSelect) {options.onSelect(getSelectedKeys(), getSelectedRows());}
  }

  function deselectRow(key) {
    state.selectedKeys.delete(key);
    syncSelectionDOM({ element, selection, selectedKeys: state.selectedKeys, getProcessedData, rowKey, options });
    if (options.onSelect) {options.onSelect(getSelectedKeys(), getSelectedRows());}
  }

  function selectAll() {
    const { pageData } = getProcessedData();
    pageData.forEach(r => state.selectedKeys.add(r[rowKey]));
    syncSelectionDOM({ element, selection, selectedKeys: state.selectedKeys, getProcessedData, rowKey, options });
    if (options.onSelect) {options.onSelect(getSelectedKeys(), getSelectedRows());}
  }

  function deselectAll() {
    state.selectedKeys.clear();
    syncSelectionDOM({ element, selection, selectedKeys: state.selectedKeys, getProcessedData, rowKey, options });
    if (options.onSelect) {options.onSelect(getSelectedKeys(), getSelectedRows());}
  }

  function toggleExpand(key) {
    if (state.expandedKeys.has(key)) {state.expandedKeys.delete(key);}
    else {state.expandedKeys.add(key);}
    _render();
    if (options.onExpand) {options.onExpand(key, state.expandedKeys.has(key));}
  }

  function expandAll() {
    const { pageData } = getProcessedData();
    pageData.forEach(r => state.expandedKeys.add(r[rowKey]));
    _render();
  }

  function collapseAll() {
    state.expandedKeys.clear();
    _render();
  }

  function setSort(key, order) {
    _clearProcessedCache();
    if (!multiSort) {state.sorts = [ { key, order: order || 'asc' } ];}
    else {
      const existing = state.sorts.find(s => s.key === key);
      if (existing) {existing.order = order || 'asc';}
      else {state.sorts.push({ key, order: order || 'asc' });}
    }
    state.currentPage = 1;
    state.virtualScrollTop = 0;
    _render();
  }

  function clearSort() {
    _clearProcessedCache();
    state.sorts = [];
    state.virtualScrollTop = 0;
    _render();
  }

  function setPage(page) {
    const targetPage = Math.max(1, Math.floor(Number(page)) || 1);
    const { total } = getProcessedData();
    const totalPages = Math.ceil(total / state.pageSize) || 1;
    state.currentPage = Math.min(targetPage, totalPages);
    _clearProcessedCache();
    _render();
    if (options.onPageChange) {options.onPageChange(state.currentPage);}
  }

  function setPageSize(size) {
    state.pageSize = Math.max(1, Math.floor(Number(size)) || 1);
    state.currentPage = 1;
    _clearProcessedCache();
    _render();
  }

  function setFilterText(text) {
    _clearProcessedCache();
    state.filterText = text == null ? '' : String(text);
    state.currentPage = 1;
    state.virtualScrollTop = 0;
    _render();
  }

  function getFilterText() { return state.filterText; }

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
    if (state.destroyed) {return;}
    state.destroyed = true;
    _cancelVirtualFrame();
    for (const cleanup of [ ...resizeCleanups ]) {cleanup();}
    resizeCleanups.clear();
    listeners.destroy();
    interactionListeners.destroy();
    reactiveCleanups.forEach(fn => fn());
    reactiveCleanups.length = 0;
    dataSubscription = null;
    loadingSubscription = null;
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
