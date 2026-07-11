/**
 * KupolaTable - Full-featured headless table component
 * Features: sort, filter, pagination, selection, expand, inline-edit,
 *           column-resize, row-drag, sticky columns, tree data,
 *           virtual scroll, merge cells, multi-sort, CSV export
 */

import { ref } from './data-bind.js';

class KupolaTable {
    constructor(element, options = {}) {
        this.element = typeof element === 'string' ? document.querySelector(element) : element;
        this.options = options;

        // Columns & data
        this.columns = (options.columns || []).map((c, i) => ({ ...c, _index: i }));
        this.rowKey = options.rowKey || 'id';
        this._data = [];
        this._loading = false;

        // Display
        this.striped = options.striped !== false;
        this.bordered = options.bordered || false;
        this.hoverable = options.hoverable !== false;
        this.compact = options.compact || false;
        this.emptyText = options.emptyText || '暂无数据';
        this.loadingText = options.loadingText || '加载中...';

        // Sort (multi-sort: array of {key, order})
        this.multiSort = options.multiSort || false;
        this._sorts = []; // [{key, order}]

        // Filter
        this._filterText = '';

        // Pagination
        this._showPagination = options.pagination !== false;
        this._pageSizes = options.pageSizes || [10, 20, 50, 100];
        this._pageSize = options.pageSize || 10;
        this._currentPage = 1;
        this._total = 0;

        // Selection
        this.selection = options.selection || null; // 'checkbox' | 'radio'
        this._selectedKeys = new Set();
        this.selectionColumnTitle = options.selectionColumnTitle || '';

        // Expand
        this.expandable = options.expandable || null; // function(row) => HTML/DOM
        this._expandedKeys = new Set();
        this.expandColumnTitle = options.expandColumnTitle || '';

        // Inline edit
        this.editable = options.editable || false; // true or { onSave, onCancel }
        this._editingCell = null; // { rowKey, colKey }
        this._editBuffer = {}; // { colKey: value }

        // Column resize
        this.resizable = options.resizable || false;

        // Row drag
        this.draggable = options.draggable || false;
        this._dragState = null;

        // Tree data
        this.tree = options.tree || null; // { childrenKey: 'children', defaultExpandAll: false }
        this._treeExpandedKeys = new Set();
        if (options.tree?.defaultExpandAll) this._treeExpandAll = true;

        // Virtual scroll
        this.virtualScroll = options.virtualScroll || null; // { rowHeight: 40, overscan: 5 }
        this._scrollContainer = null;

        // Merge cells
        this.mergeCells = options.mergeCells || null; // function(data) => [{row, col, rowSpan, colSpan}]

        // Callbacks
        this.onSort = options.onSort || null;
        this.onPageChange = options.onPageChange || null;
        this.onRowClick = options.onRowClick || null;
        this.onFilter = options.onFilter || null;
        this.onSelect = options.onSelect || null;
        this.onExpand = options.onExpand || null;
        this.onEditSave = options.onEditSave || null;
        this.onEditCancel = options.onEditCancel || null;
        this.onRowDragEnd = options.onRowDragEnd || null;
        this.onColumnResize = options.onColumnResize || null;

        // Reactive refs
        this.sortKey = ref(null);
        this.sortOrder = ref(null);
        this.currentPage = ref(1);
        this.filterText = ref('');
        this.selectedKeys = ref([]);

        this._init();
    }

    _init() {
        this.element.classList.add('kupola-table-wrapper');
        if (this.virtualScroll) this.element.classList.add('kupola-table-virtual-wrapper');
        this.render();
    }

    // ================================================================
    // DATA
    // ================================================================

    setData(data) {
        if (data && typeof data === 'object' && 'value' in data) {
            this._data = Array.isArray(data.value) ? data.value : [];
            data._subscribers?.add((newVal) => {
                this._data = Array.isArray(newVal) ? newVal : [];
                this._total = this._data.length;
                this.render();
            });
        } else if (Array.isArray(data)) {
            this._data = data;
        } else {
            this._data = [];
        }
        if (this.tree && this._treeExpandAll) {
            this._flattenForExpand(this._data);
        }
        this._total = this._getFlatData(this._data).length;
        this.render();
    }

    setLoading(loading) {
        if (loading && typeof loading === 'object' && 'value' in loading) {
            this._loading = loading.value;
            loading._subscribers?.add((val) => { this._loading = val; this.render(); });
        } else {
            this._loading = !!loading;
        }
        this.render();
    }

    // ================================================================
    // TREE HELPERS
    // ================================================================

    _flattenForExpand(data, level = 0, parentKey = null) {
        const ck = this.tree?.childrenKey || 'children';
        const result = [];
        for (const row of data) {
            const key = row[this.rowKey];
            result.push({ ...row, _level: level, _parentKey: parentKey, _hasChildren: !!(row[ck] && row[ck].length) });
            if (row[ck] && row[ck].length) {
                result.push(...this._flattenForExpand(row[ck], level + 1, key));
            }
        }
        return result;
    }

    _getFlatData(data) {
        if (!this.tree) return data;
        return this._flattenVisible(data, 0);
    }

    _flattenVisible(data, level) {
        const ck = this.tree?.childrenKey || 'children';
        const result = [];
        for (const row of data) {
            const key = row[this.rowKey];
            result.push({ ...row, _level: level, _hasChildren: !!(row[ck] && row[ck].length) });
            if (row[ck] && row[ck].length && this._treeExpandedKeys.has(key)) {
                result.push(...this._flattenVisible(row[ck], level + 1));
            }
        }
        return result;
    }

    // ================================================================
    // PROCESSING: filter → sort → paginate
    // ================================================================

    getProcessedData() {
        let data = this.tree ? [...this._data] : [...this._data];

        // Filter
        if (this._filterText) {
            const text = this._filterText.toLowerCase();
            if (this.tree) {
                data = this._filterTree(data, text);
            } else {
                data = data.filter(row =>
                    this.columns.some(col => {
                        const val = row[col.key];
                        return val != null && String(val).toLowerCase().includes(text);
                    })
                );
            }
        }

        // Sort
        if (this._sorts.length > 0) {
            if (this.tree) {
                data = this._sortTree(data);
            } else {
                data = this._sortFlat(data);
            }
        }

        const flatData = this.tree ? this._flattenVisible(data) : data;
        this._total = flatData.length;

        // Paginate
        let pageData = flatData;
        if (this._showPagination && this._pageSize > 0) {
            const start = (this._currentPage - 1) * this._pageSize;
            pageData = flatData.slice(start, start + this._pageSize);
        }

        return pageData;
    }

    _filterTree(data, text) {
        const ck = this.tree?.childrenKey || 'children';
        return data.reduce((acc, row) => {
            const children = row[ck] ? this._filterTree(row[ck], text) : [];
            const selfMatch = this.columns.some(col => {
                const v = row[col.key];
                return v != null && String(v).toLowerCase().includes(text);
            });
            if (selfMatch || children.length > 0) {
                acc.push({ ...row, [ck]: children });
                if (children.length > 0) this._treeExpandedKeys.add(row[this.rowKey]);
            }
            return acc;
        }, []);
    }

    _sortFlat(data) {
        return [...data].sort((a, b) => {
            for (const s of this._sorts) {
                const col = this.columns.find(c => c.key === s.key);
                let va = a[s.key], vb = b[s.key];
                let cmp = 0;
                if (col?.sorter) { cmp = col.sorter(va, vb, s.order); }
                else {
                    if (va == null) cmp = 1;
                    else if (vb == null) cmp = -1;
                    else if (typeof va === 'number' && typeof vb === 'number') cmp = s.order === 'asc' ? va - vb : vb - va;
                    else cmp = s.order === 'asc' ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
                }
                if (cmp !== 0) return cmp;
            }
            return 0;
        });
    }

    _sortTree(data) {
        const sorted = this._sortFlat(data);
        const ck = this.tree?.childrenKey || 'children';
        return sorted.map(row => row[ck]?.length ? { ...row, [ck]: this._sortTree(row[ck]) } : row);
    }

    // ================================================================
    // RENDER
    // ================================================================

    render() {
        const data = this.getProcessedData();
        const wrapper = this.element;
        wrapper.innerHTML = '';

        // Toolbar
        if (this.options.showFilter || this.options.showToolbar) {
            wrapper.appendChild(this._renderToolbar());
        }

        // Table container (for virtual scroll)
        const tableContainer = document.createElement('div');
        tableContainer.className = 'kupola-table-container';

        const table = document.createElement('table');
        table.className = this._getTableClass();

        // Thead
        table.appendChild(this._renderThead());

        // Tbody
        if (this.virtualScroll) {
            table.appendChild(this._renderVirtualTbody(data));
        } else {
            table.appendChild(this._renderTbody(data));
        }

        tableContainer.appendChild(table);
        wrapper.appendChild(tableContainer);

        // Pagination
        if (this._showPagination && this._total > 0) {
            wrapper.appendChild(this._renderPagination());
        }

        // Post-render hooks
        if (this.resizable) this._initColumnResize();
        if (this.draggable) this._initRowDrag();
        this._applyStickyColumns();
    }

    _renderThead() {
        const thead = document.createElement('thead');
        const tr = document.createElement('tr');

        // Selection column
        if (this.selection) {
            const th = document.createElement('th');
            th.className = 'kupola-table-col-selection';
            if (this.selection === 'checkbox') {
                const cb = document.createElement('input');
                cb.type = 'checkbox';
                const pageData = this.getProcessedData();
                const allKeys = pageData.map(r => r[this.rowKey]);
                cb.checked = allKeys.length > 0 && allKeys.every(k => this._selectedKeys.has(k));
                cb.addEventListener('change', () => cb.checked ? this.selectAll() : this.deselectAll());
                th.appendChild(cb);
            }
            tr.appendChild(th);
        }

        // Expand column
        if (this.expandable) {
            const th = document.createElement('th');
            th.className = 'kupola-table-col-expand';
            tr.appendChild(th);
        }

        // Data columns
        this.columns.forEach(col => {
            const th = document.createElement('th');
            th.textContent = col.title || col.key;
            if (col.width) th.style.width = typeof col.width === 'number' ? col.width + 'px' : col.width;
            if (col.minWidth) th.style.minWidth = typeof col.minWidth === 'number' ? col.minWidth + 'px' : col.minWidth;
            if (col.align) th.style.textAlign = col.align;
            if (col.fixed) th.setAttribute('data-fixed', col.fixed);

            // Sortable
            if (col.sortable) {
                th.classList.add('kupola-table-sortable');
                const sortInfo = this._sorts.find(s => s.key === col.key);
                if (sortInfo) th.classList.add(`kupola-table-sort-${sortInfo.order}`);
                th.addEventListener('click', (e) => {
                    if (this.resizable && e.target.classList.contains('kupola-table-resize-handle')) return;
                    this._handleSort(col.key);
                });
                const indicator = document.createElement('span');
                indicator.className = 'kupola-table-sort-icon';
                if (sortInfo) {
                    indicator.textContent = this.multiSort
                        ? ` ${this._sorts.indexOf(sortInfo) + 1}${sortInfo.order === 'asc' ? '▲' : '▼'}`
                        : (sortInfo.order === 'asc' ? ' ▲' : ' ▼');
                } else {
                    indicator.textContent = ' ⇅';
                }
                th.appendChild(indicator);
            }

            // Resize handle
            if (this.resizable && col.key !== this.columns[this.columns.length - 1]?.key) {
                const handle = document.createElement('span');
                handle.className = 'kupola-table-resize-handle';
                handle.setAttribute('data-col-key', col.key);
                th.appendChild(handle);
            }

            tr.appendChild(th);
        });

        thead.appendChild(tr);
        return thead;
    }

    _renderTbody(data) {
        const tbody = document.createElement('tbody');

        if (this._loading) {
            tbody.appendChild(this._renderStatusRow(this.loadingText, 'kupola-table-loading'));
        } else if (data.length === 0) {
            tbody.appendChild(this._renderStatusRow(this.emptyText, 'kupola-table-empty'));
        } else {
            // Merge cells config
            const mergeConfig = this.mergeCells ? this.mergeCells(data) : [];
            const mergeMap = new Map();
            mergeConfig.forEach(m => mergeMap.set(`${m.row}-${m.col}`, m));
            const skipCells = new Set();

            data.forEach((row, rowIndex) => {
                const key = row[this.rowKey] ?? rowIndex;
                const isSelected = this._selectedKeys.has(key);
                const isExpanded = this._expandedKeys.has(key);

                // Data row
                const tr = this._renderDataRow(row, rowIndex, key, isSelected, skipCells, mergeMap);
                tbody.appendChild(tr);

                // Expand row
                if (this.expandable && isExpanded) {
                    const expandTr = document.createElement('tr');
                    expandTr.className = 'kupola-table-expand-row';
                    const expandTd = document.createElement('td');
                    const totalCols = this.columns.length + (this.selection ? 1 : 0) + 1;
                    expandTd.colSpan = totalCols;
                    expandTd.className = 'kupola-table-expand-content';
                    const content = this.expandable(row);
                    if (typeof content === 'string') expandTd.innerHTML = content;
                    else if (content instanceof HTMLElement) expandTd.appendChild(content);
                    expandTr.appendChild(expandTd);
                    tbody.appendChild(expandTr);
                }
            });
        }
        return tbody;
    }

    _renderDataRow(row, rowIndex, key, isSelected, skipCells, mergeMap) {
        const tr = document.createElement('tr');
        tr.setAttribute('data-row-key', key);
        if (isSelected) tr.classList.add('kupola-table-row-selected');
        if (this.draggable) {
            tr.draggable = true;
            tr.classList.add('kupola-table-draggable');
        }

        // Selection cell
        if (this.selection) {
            const td = document.createElement('td');
            td.className = 'kupola-table-col-selection';
            const input = document.createElement('input');
            input.type = this.selection;
            input.checked = isSelected;
            input.addEventListener('change', () => {
                if (this.selection === 'radio') {
                    this._selectedKeys.clear();
                    this._selectedKeys.add(key);
                } else {
                    isSelected ? this._selectedKeys.delete(key) : this._selectedKeys.add(key);
                }
                this.selectedKeys.value = [...this._selectedKeys];
                if (this.onSelect) this.onSelect([...this._selectedKeys], this.getSelectedRows());
                this.render();
            });
            td.appendChild(input);
            tr.appendChild(td);
        }

        // Expand cell
        if (this.expandable) {
            const td = document.createElement('td');
            td.className = 'kupola-table-col-expand';
            const btn = document.createElement('button');
            btn.className = 'kupola-table-expand-btn';
            const isExpanded = this._expandedKeys.has(key);
            btn.textContent = isExpanded ? '▼' : '▶';
            btn.type = 'button';
            btn.addEventListener('click', () => this._toggleExpand(key));
            td.appendChild(btn);
            tr.appendChild(td);
        }

        // Data cells
        this.columns.forEach((col, colIndex) => {
            // Skip merged cells
            if (skipCells.has(`${rowIndex}-${colIndex}`)) return;

            const td = document.createElement('td');
            if (col.align) td.style.textAlign = col.align;
            if (col.fixed) {
                td.setAttribute('data-fixed', col.fixed);
                td.classList.add(`kupola-table-fixed-${col.fixed}`);
            }

            // Merge cells
            const mergeInfo = mergeMap.get(`${rowIndex}-${colIndex}`);
            if (mergeInfo) {
                if (mergeInfo.rowSpan > 1) td.rowSpan = mergeInfo.rowSpan;
                if (mergeInfo.colSpan > 1) td.colSpan = mergeInfo.colSpan;
                for (let r = 0; r < (mergeInfo.rowSpan || 1); r++) {
                    for (let c = 0; c < (mergeInfo.colSpan || 1); c++) {
                        if (r === 0 && c === 0) continue;
                        skipCells.add(`${rowIndex + r}-${colIndex + c}`);
                    }
                }
            }

            // Tree indent
            if (this.tree && colIndex === 0 && row._level > 0) {
                const indent = document.createElement('span');
                indent.className = 'kupola-table-tree-indent';
                indent.style.paddingLeft = (row._level * 20) + 'px';
                td.appendChild(indent);
                if (row._hasChildren) {
                    const toggle = document.createElement('button');
                    toggle.className = 'kupola-table-tree-toggle';
                    toggle.textContent = this._treeExpandedKeys.has(row[this.rowKey]) ? '▼' : '▶';
                    toggle.type = 'button';
                    toggle.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this._toggleTreeExpand(row[this.rowKey]);
                    });
                    td.appendChild(toggle);
                } else {
                    const spacer = document.createElement('span');
                    spacer.className = 'kupola-table-tree-toggle-placeholder';
                    td.appendChild(spacer);
                }
            }

            // Editable cell
            const isEditing = this._editingCell &&
                this._editingCell.rowKey === key && this._editingCell.colKey === col.key;

            if (isEditing) {
                td.appendChild(this._renderEditCell(col, row));
            } else if (col.render) {
                const content = col.render(row[col.key], row, rowIndex);
                if (typeof content === 'string') td.innerHTML = content;
                else if (content instanceof HTMLElement) td.appendChild(content);
            } else {
                td.textContent = row[col.key] ?? '';
            }

            // Double-click to edit
            if (this.editable && !isEditing && col.editable !== false) {
                td.classList.add('kupola-table-editable-cell');
                td.addEventListener('dblclick', () => this._startEdit(key, col.key, row[col.key]));
            }

            tr.appendChild(td);
        });

        if (this.onRowClick) {
            tr.style.cursor = 'pointer';
            tr.addEventListener('click', (e) => {
                if (e.target.closest('.kupola-table-expand-btn, .kupola-table-tree-toggle, input, button')) return;
                this.onRowClick(row, rowIndex, e);
            });
        }

        return tr;
    }

    _renderStatusRow(text, className) {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = this.columns.length + (this.selection ? 1 : 0) + (this.expandable ? 1 : 0);
        td.className = className;
        td.textContent = text;
        tr.appendChild(td);
        return tr;
    }

    // ================================================================
    // VIRTUAL SCROLL
    // ================================================================

    _renderVirtualTbody(data) {
        const tbody = document.createElement('tbody');
        const { rowHeight = 40, overscan = 5 } = this.virtualScroll;
        const totalHeight = data.length * rowHeight;

        if (this._loading) {
            return this._renderTbody(data);
        }
        if (data.length === 0) {
            return this._renderTbody(data);
        }

        // Create spacer rows for total height
        const topSpacer = document.createElement('tr');
        topSpacer.className = 'kupola-table-virtual-spacer-top';
        topSpacer.style.height = '0px';
        tbody.appendChild(topSpacer);

        // We'll update positions in _updateVirtualScroll
        this._virtualData = { data, rowHeight, overscan, totalHeight, tbody, topSpacer };
        this._updateVirtualScroll();

        const bottomSpacer = document.createElement('tr');
        bottomSpacer.className = 'kupola-table-virtual-spacer-bottom';
        bottomSpacer.style.height = '0px';
        tbody.appendChild(bottomSpacer);

        // Attach scroll listener
        const wrapper = this.element.querySelector('.kupola-table-container');
        if (wrapper) {
            wrapper.style.maxHeight = this.virtualScroll.maxHeight || '400px';
            wrapper.style.overflowY = 'auto';
            wrapper.addEventListener('scroll', () => this._updateVirtualScroll());
        }

        return tbody;
    }

    _updateVirtualScroll() {
        if (!this._virtualData) return;
        const { data, rowHeight, overscan, tbody, topSpacer } = this._virtualData;
        const wrapper = this.element.querySelector('.kupola-table-container');
        if (!wrapper) return;

        const scrollTop = wrapper.scrollTop;
        const viewHeight = wrapper.clientHeight;
        const startIdx = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
        const endIdx = Math.min(data.length, Math.ceil((scrollTop + viewHeight) / rowHeight) + overscan);

        // Remove existing data rows
        const existingRows = tbody.querySelectorAll('.kupola-table-virtual-row');
        existingRows.forEach(r => r.remove());

        // Insert visible rows
        const fragment = document.createDocumentFragment();
        for (let i = startIdx; i < endIdx; i++) {
            const row = data[i];
            const key = row[this.rowKey] ?? i;
            const tr = this._renderDataRow(row, i, key, this._selectedKeys.has(key), new Set(), new Map());
            tr.classList.add('kupola-table-virtual-row');
            tr.style.height = rowHeight + 'px';
            fragment.appendChild(tr);
        }

        topSpacer.style.height = (startIdx * rowHeight) + 'px';
        const bottomSpacer = tbody.querySelector('.kupola-table-virtual-spacer-bottom');
        if (bottomSpacer) bottomSpacer.style.height = ((data.length - endIdx) * rowHeight) + 'px';

        topSpacer.after(fragment);
    }

    // ================================================================
    // INLINE EDIT
    // ================================================================

    _renderEditCell(col, row) {
        const container = document.createElement('div');
        container.className = 'kupola-table-edit-cell';

        const input = document.createElement('input');
        input.type = col.editType || 'text';
        input.className = 'ds-input kupola-table-edit-input';
        input.value = this._editBuffer[col.key] ?? row[col.key] ?? '';
        if (col.editOptions) {
            // Select dropdown
            const select = document.createElement('select');
            select.className = 'ds-input kupola-table-edit-input';
            col.editOptions.forEach(opt => {
                const o = document.createElement('option');
                o.value = typeof opt === 'object' ? opt.value : opt;
                o.textContent = typeof opt === 'object' ? opt.label : opt;
                if (String(o.value) === String(input.value)) o.selected = true;
                select.appendChild(o);
            });
            select.addEventListener('change', () => { this._editBuffer[col.key] = select.value; });
            container.appendChild(select);
        } else {
            input.addEventListener('input', () => { this._editBuffer[col.key] = input.value; });
            container.appendChild(input);
        }

        // Save / Cancel buttons
        const actions = document.createElement('div');
        actions.className = 'kupola-table-edit-actions';
        const saveBtn = document.createElement('button');
        saveBtn.className = 'kupola-table-edit-save';
        saveBtn.textContent = '✓';
        saveBtn.type = 'button';
        saveBtn.addEventListener('click', () => this._saveEdit(row, col));
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'kupola-table-edit-cancel';
        cancelBtn.textContent = '✗';
        cancelBtn.type = 'button';
        cancelBtn.addEventListener('click', () => this._cancelEdit());
        actions.appendChild(saveBtn);
        actions.appendChild(cancelBtn);
        container.appendChild(actions);

        // Enter to save, Escape to cancel
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this._saveEdit(row, col);
            if (e.key === 'Escape') this._cancelEdit();
        });

        setTimeout(() => input.focus?.(), 0);
        return container;
    }

    _startEdit(rowKey, colKey, currentValue) {
        this._editingCell = { rowKey, colKey };
        this._editBuffer = { [colKey]: currentValue };
        this.render();
    }

    _saveEdit(row, col) {
        const newValue = this._editBuffer[col.key];
        if (this.onEditSave) {
            this.onEditSave(row, col.key, newValue, this._data);
        } else {
            row[col.key] = newValue;
        }
        this._editingCell = null;
        this._editBuffer = {};
        this.render();
    }

    _cancelEdit() {
        if (this.onEditCancel) this.onEditCancel(this._editingCell);
        this._editingCell = null;
        this._editBuffer = {};
        this.render();
    }

    // ================================================================
    // SORT
    // ================================================================

    _handleSort(key) {
        if (this.multiSort) {
            const existing = this._sorts.findIndex(s => s.key === key);
            if (existing >= 0) {
                const s = this._sorts[existing];
                if (s.order === 'asc') s.order = 'desc';
                else this._sorts.splice(existing, 1);
            } else {
                this._sorts.push({ key, order: 'asc' });
            }
        } else {
            const existing = this._sorts.find(s => s.key === key);
            if (existing) {
                if (existing.order === 'asc') existing.order = 'desc';
                else this._sorts = [];
            } else {
                this._sorts = [{ key, order: 'asc' }];
            }
        }
        this.sortKey.value = this._sorts.map(s => s.key).join(',');
        this.sortOrder.value = this._sorts.map(s => s.order).join(',');
        this._currentPage = 1;
        if (this.onSort) this.onSort(this._sorts);
        this.render();
    }

    // ================================================================
    // EXPAND
    // ================================================================

    _toggleExpand(key) {
        this._expandedKeys.has(key) ? this._expandedKeys.delete(key) : this._expandedKeys.add(key);
        if (this.onExpand) this.onExpand(key, this._expandedKeys.has(key));
        this.render();
    }

    _toggleTreeExpand(key) {
        this._treeExpandedKeys.has(key) ? this._treeExpandedKeys.delete(key) : this._treeExpandedKeys.add(key);
        this.render();
    }

    // ================================================================
    // SELECTION API
    // ================================================================

    selectRow(key) { this._selectedKeys.add(key); this._syncSelected(); this.render(); }
    deselectRow(key) { this._selectedKeys.delete(key); this._syncSelected(); this.render(); }
    selectAll() {
        this.getProcessedData().forEach(r => this._selectedKeys.add(r[this.rowKey]));
        this._syncSelected(); this.render();
    }
    deselectAll() { this._selectedKeys.clear(); this._syncSelected(); this.render(); }
    invertSelection() {
        const pageData = this.getProcessedData();
        pageData.forEach(r => {
            const k = r[this.rowKey];
            this._selectedKeys.has(k) ? this._selectedKeys.delete(k) : this._selectedKeys.add(k);
        });
        this._syncSelected(); this.render();
    }
    getSelectedKeys() { return [...this._selectedKeys]; }
    getSelectedRows() {
        const all = this.tree ? this._flattenForExpand(this._data) : this._data;
        return all.filter(r => this._selectedKeys.has(r[this.rowKey]));
    }
    _syncSelected() { this.selectedKeys.value = [...this._selectedKeys]; }

    // ================================================================
    // COLUMN RESIZE
    // ================================================================

    _initColumnResize() {
        const handles = this.element.querySelectorAll('.kupola-table-resize-handle');
        handles.forEach(handle => {
            handle.addEventListener('mousedown', (e) => {
                e.preventDefault();
                const colKey = handle.getAttribute('data-col-key');
                const th = handle.parentElement;
                const startX = e.clientX;
                const startWidth = th.offsetWidth;

                const onMouseMove = (ev) => {
                    const newWidth = Math.max(50, startWidth + (ev.clientX - startX));
                    th.style.width = newWidth + 'px';
                    const col = this.columns.find(c => c.key === colKey);
                    if (col) col.width = newWidth;
                    if (this.onColumnResize) this.onColumnResize(colKey, newWidth);
                };
                const onMouseUp = () => {
                    document.removeEventListener('mousemove', onMouseMove);
                    document.removeEventListener('mouseup', onMouseUp);
                };
                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
            });
        });
    }

    // ================================================================
    // ROW DRAG
    // ================================================================

    _initRowDrag() {
        const rows = this.element.querySelectorAll('tbody tr[data-row-key]');
        rows.forEach(row => {
            row.addEventListener('dragstart', (e) => {
                this._dragState = { fromKey: row.getAttribute('data-row-key') };
                row.classList.add('kupola-table-dragging');
                e.dataTransfer.effectAllowed = 'move';
            });
            row.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                row.classList.add('kupola-table-drag-over');
            });
            row.addEventListener('dragleave', () => row.classList.remove('kupola-table-drag-over'));
            row.addEventListener('drop', (e) => {
                e.preventDefault();
                row.classList.remove('kupola-table-drag-over');
                if (!this._dragState) return;
                const toKey = row.getAttribute('data-row-key');
                if (this._dragState.fromKey === toKey) return;
                const fromIdx = this._data.findIndex(r => String(r[this.rowKey]) === this._dragState.fromKey);
                const toIdx = this._data.findIndex(r => String(r[this.rowKey]) === toKey);
                if (fromIdx >= 0 && toIdx >= 0) {
                    const [moved] = this._data.splice(fromIdx, 1);
                    this._data.splice(toIdx, 0, moved);
                    if (this.onRowDragEnd) this.onRowDragEnd(moved, fromIdx, toIdx, this._data);
                    this.render();
                }
            });
            row.addEventListener('dragend', () => {
                row.classList.remove('kupola-table-dragging');
                this._dragState = null;
            });
        });
    }

    // ================================================================
    // STICKY COLUMNS
    // ================================================================

    _applyStickyColumns() {
        let leftOffset = 0;
        const fixedLeft = this.columns.filter(c => c.fixed === 'left');
        if (this.selection) leftOffset += 40;
        if (this.expandable) leftOffset += 40;

        fixedLeft.forEach(col => {
            const ths = this.element.querySelectorAll(`th[data-fixed="left"]`);
            const tds = this.element.querySelectorAll(`td[data-fixed="left"]`);
            // Apply offset per column
            const colIdx = this.columns.indexOf(col);
            let offset = (this.selection ? 40 : 0) + (this.expandable ? 40 : 0);
            for (let i = 0; i < colIdx; i++) {
                if (this.columns[i].fixed === 'left') offset += (this.columns[i]._resolvedWidth || 120);
            }
            ths.forEach(th => {
                if (th.textContent.startsWith(col.title || col.key)) {
                    th.style.position = 'sticky';
                    th.style.left = offset + 'px';
                    th.style.zIndex = '2';
                    col._resolvedWidth = th.offsetWidth;
                }
            });
            tds.forEach(td => {
                td.style.position = 'sticky';
                td.style.left = offset + 'px';
                td.style.zIndex = '1';
                td.style.background = 'inherit';
            });
        });

        // Fixed right
        let rightOffset = 0;
        const fixedRight = [...this.columns].filter(c => c.fixed === 'right').reverse();
        fixedRight.forEach(col => {
            const tds = this.element.querySelectorAll(`td[data-fixed="right"]`);
            tds.forEach(td => {
                td.style.position = 'sticky';
                td.style.right = rightOffset + 'px';
                td.style.zIndex = '1';
            });
            rightOffset += (col._resolvedWidth || col.width || 120);
        });
    }

    // ================================================================
    // TOOLBAR
    // ================================================================

    _renderToolbar() {
        const toolbar = document.createElement('div');
        toolbar.className = 'kupola-table-toolbar';

        if (this.options.showFilter) {
            const filterInput = document.createElement('input');
            filterInput.type = 'text';
            filterInput.className = 'ds-input kupola-table-filter-input';
            filterInput.placeholder = this.options.filterPlaceholder || '搜索...';
            filterInput.value = this._filterText;
            let debounceTimer;
            filterInput.addEventListener('input', () => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    this._filterText = filterInput.value;
                    this._currentPage = 1;
                    this.filterText.value = this._filterText;
                    if (this.onFilter) this.onFilter(this._filterText);
                    this.render();
                }, 300);
            });
            toolbar.appendChild(filterInput);
        }

        const right = document.createElement('div');
        right.className = 'kupola-table-toolbar-right';

        // Selection info
        if (this.selection && this._selectedKeys.size > 0) {
            const info = document.createElement('span');
            info.className = 'kupola-table-selection-info';
            info.textContent = `已选 ${this._selectedKeys.size} 项`;
            right.appendChild(info);

            const invertBtn = document.createElement('button');
            invertBtn.className = 'ds-btn ds-btn--sm';
            invertBtn.textContent = '反选';
            invertBtn.type = 'button';
            invertBtn.addEventListener('click', () => this.invertSelection());
            right.appendChild(invertBtn);
        }

        // Export button
        if (this.options.showExport) {
            const exportBtn = document.createElement('button');
            exportBtn.className = 'ds-btn ds-btn--sm ds-btn--secondary';
            exportBtn.textContent = '导出 CSV';
            exportBtn.type = 'button';
            exportBtn.addEventListener('click', () => this.exportCSV());
            right.appendChild(exportBtn);
        }

        // Total count
        const totalInfo = document.createElement('span');
        totalInfo.className = 'kupola-table-info';
        totalInfo.textContent = `共 ${this._total} 条`;
        right.appendChild(totalInfo);

        toolbar.appendChild(right);
        return toolbar;
    }

    // ================================================================
    // PAGINATION
    // ================================================================

    _renderPagination() {
        const totalPages = Math.ceil(this._total / this._pageSize);
        if (totalPages <= 1) return document.createElement('div');

        const nav = document.createElement('div');
        nav.className = 'kupola-table-pagination';

        if (this.options.showPageSize) {
            const sizeSelect = document.createElement('select');
            sizeSelect.className = 'kupola-table-page-size';
            this._pageSizes.forEach(size => {
                const opt = document.createElement('option');
                opt.value = size;
                opt.textContent = `${size} 条/页`;
                if (size === this._pageSize) opt.selected = true;
                sizeSelect.appendChild(opt);
            });
            sizeSelect.addEventListener('change', () => {
                this._pageSize = parseInt(sizeSelect.value);
                this._currentPage = 1;
                this.currentPage.value = 1;
                this.render();
            });
            nav.appendChild(sizeSelect);
        }

        const pages = document.createElement('div');
        pages.className = 'kupola-table-pages';

        const prevBtn = this._createPageBtn('‹', () => this._goToPage(this._currentPage - 1));
        prevBtn.disabled = this._currentPage <= 1;
        pages.appendChild(prevBtn);

        this._getPageRange(this._currentPage, totalPages).forEach(p => {
            if (p === '...') {
                const span = document.createElement('span');
                span.className = 'kupola-table-page-ellipsis';
                span.textContent = '...';
                pages.appendChild(span);
            } else {
                const btn = this._createPageBtn(p, () => this._goToPage(p));
                if (p === this._currentPage) btn.classList.add('active');
                pages.appendChild(btn);
            }
        });

        const nextBtn = this._createPageBtn('›', () => this._goToPage(this._currentPage + 1));
        nextBtn.disabled = this._currentPage >= totalPages;
        pages.appendChild(nextBtn);

        nav.appendChild(pages);

        const info = document.createElement('span');
        info.className = 'kupola-table-page-info';
        info.textContent = `${this._currentPage} / ${totalPages}`;
        nav.appendChild(info);

        return nav;
    }

    _createPageBtn(text, onClick) {
        const btn = document.createElement('button');
        btn.className = 'kupola-table-page-btn';
        btn.textContent = text;
        btn.type = 'button';
        btn.addEventListener('click', onClick);
        return btn;
    }

    _goToPage(page) {
        const totalPages = Math.ceil(this._total / this._pageSize);
        if (page < 1 || page > totalPages) return;
        this._currentPage = page;
        this.currentPage.value = page;
        if (this.onPageChange) this.onPageChange(page, this._pageSize);
        this.render();
    }

    _getPageRange(current, total) {
        if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
        const range = [];
        if (current <= 3) { for (let i = 1; i <= 5; i++) range.push(i); range.push('...', total); }
        else if (current >= total - 2) { range.push(1, '...'); for (let i = total - 4; i <= total; i++) range.push(i); }
        else { range.push(1, '...'); for (let i = current - 1; i <= current + 1; i++) range.push(i); range.push('...', total); }
        return range;
    }

    // ================================================================
    // EXPORT CSV
    // ================================================================

    exportCSV(filename = 'export.csv') {
        const data = this.getProcessedData();
        const headers = this.columns.map(c => c.title || c.key);
        const rows = data.map(row =>
            this.columns.map(col => {
                let val = row[col.key];
                if (val == null) val = '';
                val = String(val).replace(/"/g, '""');
                return `"${val}"`;
            }).join(',')
        );
        const csv = '\uFEFF' + [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }

    // ================================================================
    // HELPERS
    // ================================================================

    _getTableClass() {
        const classes = ['kupola-table'];
        if (this.striped) classes.push('kupola-table-striped');
        if (this.bordered) classes.push('kupola-table-bordered');
        if (this.hoverable) classes.push('kupola-table-hover');
        if (this.compact) classes.push('kupola-table-compact');
        return classes.join(' ');
    }

    refresh() { this.render(); }

    getPage() { return { current: this._currentPage, pageSize: this._pageSize, total: this._total }; }

    setColumns(columns) {
        this.columns = columns.map((c, i) => ({ ...c, _index: i }));
        this.render();
    }

    destroy() {
        this.element.innerHTML = '';
        this.element.classList.remove('kupola-table-wrapper', 'kupola-table-virtual-wrapper');
    }
}

// ================================================================
// CSS
// ================================================================

let stylesInjected = false;
function injectTableStyles() {
    if (stylesInjected || typeof document === 'undefined') return;
    const style = document.createElement('style');
    style.textContent = `
        .kupola-table-wrapper { width: 100%; }
        .kupola-table-container { overflow-x: auto; }
        .kupola-table { width: 100%; border-collapse: collapse; font-size: 14px; }
        .kupola-table th, .kupola-table td { padding: 12px 16px; text-align: left; border-bottom: 1px solid #e8e8e8; }
        .kupola-table th { background: #fafafa; font-weight: 600; color: #333; white-space: nowrap; }
        .kupola-table-striped tbody tr:nth-child(even) { background: #fafafa; }
        .kupola-table-hover tbody tr:hover { background: #f0f7ff; }
        .kupola-table-bordered { border: 1px solid #e8e8e8; }
        .kupola-table-bordered th, .kupola-table-bordered td { border: 1px solid #e8e8e8; }
        .kupola-table-compact th, .kupola-table-compact td { padding: 8px 12px; }
        .kupola-table-sortable { cursor: pointer; user-select: none; position: relative; }
        .kupola-table-sortable:hover { background: #f0f0f0; }
        .kupola-table-sort-icon { font-size: 12px; opacity: 0.5; margin-left: 4px; }
        .kupola-table-sort-asc .kupola-table-sort-icon,
        .kupola-table-sort-desc .kupola-table-sort-icon { opacity: 1; color: #1890ff; }
        .kupola-table-empty, .kupola-table-loading { text-align: center; padding: 40px 16px !important; color: #999; }
        .kupola-table-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 8px; }
        .kupola-table-toolbar-right { display: flex; align-items: center; gap: 8px; }
        .kupola-table-filter-input { padding: 6px 12px; border: 1px solid #d9d9d9; border-radius: 4px; font-size: 14px; width: 240px; }
        .kupola-table-filter-input:focus { outline: none; border-color: #1890ff; box-shadow: 0 0 0 2px rgba(24,144,255,0.1); }
        .kupola-table-info { color: #999; font-size: 13px; }
        .kupola-table-selection-info { color: #1890ff; font-size: 13px; font-weight: 500; }
        .kupola-table-col-selection { width: 40px; text-align: center; }
        .kupola-table-col-expand { width: 40px; text-align: center; }
        .kupola-table-expand-btn { background: none; border: none; cursor: pointer; font-size: 12px; padding: 2px 6px; color: #666; }
        .kupola-table-expand-btn:hover { color: #1890ff; }
        .kupola-table-expand-row td { background: #fafafa; padding: 16px; }
        .kupola-table-row-selected { background: #e6f7ff !important; }
        .kupola-table-row-selected:hover { background: #bae7ff !important; }
        /* Resize */
        .kupola-table-resize-handle { position: absolute; right: 0; top: 0; bottom: 0; width: 6px; cursor: col-resize; background: transparent; }
        .kupola-table-resize-handle:hover { background: #1890ff; opacity: 0.3; }
        /* Drag */
        .kupola-table-draggable { transition: opacity 0.2s; }
        .kupola-table-dragging { opacity: 0.4; }
        .kupola-table-drag-over { border-top: 2px solid #1890ff !important; }
        /* Edit */
        .kupola-table-editable-cell { cursor: text; }
        .kupola-table-editable-cell:hover { background: #e6f7ff; }
        .kupola-table-edit-cell { display: flex; gap: 4px; align-items: center; }
        .kupola-table-edit-input { flex: 1; padding: 2px 6px; font-size: 13px; }
        .kupola-table-edit-actions { display: flex; gap: 2px; }
        .kupola-table-edit-save, .kupola-table-edit-cancel { background: none; border: 1px solid #d9d9d9; border-radius: 3px; cursor: pointer; padding: 2px 6px; font-size: 12px; }
        .kupola-table-edit-save { color: #52c41a; border-color: #52c41a; }
        .kupola-table-edit-cancel { color: #ff4d4f; border-color: #ff4d4f; }
        .kupola-table-edit-save:hover { background: #f6ffed; }
        .kupola-table-edit-cancel:hover { background: #fff2f0; }
        /* Tree */
        .kupola-table-tree-indent { display: inline-block; }
        .kupola-table-tree-toggle { background: none; border: none; cursor: pointer; font-size: 10px; padding: 0 4px; color: #666; }
        .kupola-table-tree-toggle:hover { color: #1890ff; }
        .kupola-table-tree-toggle-placeholder { display: inline-block; width: 18px; }
        /* Virtual */
        .kupola-table-virtual-wrapper .kupola-table-container { overflow-y: auto; }
        /* Pagination */
        .kupola-table-pagination { display: flex; justify-content: flex-end; align-items: center; gap: 12px; margin-top: 16px; padding: 8px 0; }
        .kupola-table-pages { display: flex; gap: 4px; align-items: center; }
        .kupola-table-page-btn { min-width: 32px; height: 32px; border: 1px solid #d9d9d9; border-radius: 4px; background: #fff; cursor: pointer; font-size: 14px; display: flex; align-items: center; justify-content: center; }
        .kupola-table-page-btn:hover:not(:disabled):not(.active) { border-color: #1890ff; color: #1890ff; }
        .kupola-table-page-btn.active { background: #1890ff; color: #fff; border-color: #1890ff; }
        .kupola-table-page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .kupola-table-page-ellipsis { padding: 0 4px; color: #999; }
        .kupola-table-page-size { padding: 4px 8px; border: 1px solid #d9d9d9; border-radius: 4px; font-size: 13px; }
        .kupola-table-page-info { color: #999; font-size: 13px; }
    `;
    document.head.appendChild(style);
    stylesInjected = true;
}

function initTable(element, options) {
    injectTableStyles();
    return new KupolaTable(element, options);
}

function initAllTables() {
    document.querySelectorAll('[data-kupola-table]').forEach(el => {
        const config = el.getAttribute('data-kupola-table');
        let options = {};
        if (config) { try { options = JSON.parse(config); } catch (_) { } }
        initTable(el, options);
    });
}

export { KupolaTable, initTable, initAllTables };

if (typeof window !== 'undefined') {
    window.KupolaTable = KupolaTable;
    window.initTable = initTable;
}
