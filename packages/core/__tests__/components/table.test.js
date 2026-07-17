/**
 * Table Component Tests
 *
 * Tests for Table: basic rendering, columns, data, empty/loading,
 * sort, filter, pagination, selection, expand, inline edit,
 * column resize, row drag, CSV export, tree data, and destroy.
 */
import { Table } from '../../src/components/table.js';

describe('Table', () => {
  const sampleData = [
    { id: 1, name: 'Alice', age: 30, city: 'NYC' },
    { id: 2, name: 'Bob', age: 25, city: 'LA' },
    { id: 3, name: 'Charlie', age: 35, city: 'Chicago' },
    { id: 4, name: 'Diana', age: 28, city: 'NYC' },
    { id: 5, name: 'Eve', age: 22, city: 'LA' },
  ];

  const columns = [
    { key: 'name', title: 'Name' },
    { key: 'age', title: 'Age' },
    { key: 'city', title: 'City' },
  ];

  function getTable(table) {
    return table.element.querySelector('table');
  }

  function getRows(table) {
    return table.element.querySelectorAll('tbody tr:not(.ds-table-expand-row)');
  }

  function getHeaders(table) {
    return table.element.querySelectorAll('thead th');
  }

  // === Basic Rendering ===
  describe('basic rendering', () => {
    test('renders table with data', () => {
      const table = Table({ data: sampleData, columns });
      expect(getTable(table)).toBeTruthy();
      expect(getRows(table).length).toBe(5);
    });

    test('renders correct column headers', () => {
      const table = Table({ data: sampleData, columns });
      const headers = getHeaders(table);
      expect(headers[0].textContent).toBe('Name');
      expect(headers[1].textContent).toBe('Age');
      expect(headers[2].textContent).toBe('City');
    });

    test('renders cell data correctly', () => {
      const table = Table({ data: sampleData, columns });
      const firstRow = getRows(table)[0];
      const cells = firstRow.querySelectorAll('td');
      expect(cells[0].textContent).toBe('Alice');
      expect(cells[1].textContent).toBe('30');
      expect(cells[2].textContent).toBe('NYC');
    });

    test('applies wrapper class', () => {
      const table = Table({ data: [], columns });
      expect(table.element.classList.contains('ds-table-wrapper')).toBe(true);
    });

    test('applies striped class', () => {
      const table = Table({ data: sampleData, columns, striped: true });
      const el = table.element.querySelector('table');
      expect(el.classList.contains('ds-table-striped')).toBe(true);
    });

    test('applies compact class', () => {
      const table = Table({ data: sampleData, columns, compact: true });
      const el = table.element.querySelector('table');
      expect(el.classList.contains('ds-table-compact')).toBe(true);
    });

    test('applies bordered class', () => {
      const table = Table({ data: sampleData, columns, bordered: true });
      const el = table.element.querySelector('table');
      expect(el.classList.contains('ds-table-bordered')).toBe(true);
    });

    test('applies hoverable class by default', () => {
      const table = Table({ data: sampleData, columns });
      const el = table.element.querySelector('table');
      expect(el.classList.contains('ds-table-hover')).toBe(true);
    });

    test('disables hoverable when set to false', () => {
      const table = Table({ data: sampleData, columns, hoverable: false });
      const el = table.element.querySelector('table');
      expect(el.classList.contains('ds-table-hover')).toBe(false);
    });
  });

  // === Empty & Loading ===
  describe('empty and loading states', () => {
    test('shows empty text when no data', () => {
      const table = Table({ data: [], columns, emptyText: 'Nothing here' });
      const empty = table.element.querySelector('.ds-table-empty');
      expect(empty).toBeTruthy();
      expect(empty.textContent).toBe('Nothing here');
    });

    test('shows default empty text', () => {
      const table = Table({ data: [], columns });
      const empty = table.element.querySelector('.ds-table-empty');
      expect(empty.textContent).toBe('No data');
    });

    test('shows loading state', () => {
      const table = Table({ data: sampleData, columns, loadingText: 'Please wait...' });
      table.setLoading(true);
      const loading = table.element.querySelector('.ds-table-loading');
      expect(loading).toBeTruthy();
      expect(loading.textContent).toBe('Please wait...');
    });

    test('hides loading when set to false', () => {
      const table = Table({ data: sampleData, columns });
      table.setLoading(true);
      expect(table.element.querySelector('.ds-table-loading')).toBeTruthy();
      table.setLoading(false);
      expect(table.element.querySelector('.ds-table-loading')).toBeFalsy();
      expect(getRows(table).length).toBe(5);
    });
  });

  // === Column Features ===
  describe('column features', () => {
    test('applies column width', () => {
      const cols = [ { key: 'name', title: 'Name', width: 200 } ];
      const table = Table({ data: sampleData, columns: cols });
      const th = getHeaders(table)[0];
      expect(th.style.width).toBe('200px');
    });

    test('applies column minWidth', () => {
      const cols = [ { key: 'name', title: 'Name', minWidth: 100 } ];
      const table = Table({ data: sampleData, columns: cols });
      const th = getHeaders(table)[0];
      expect(th.style.minWidth).toBe('100px');
    });

    test('applies column align', () => {
      const cols = [ { key: 'age', title: 'Age', align: 'right' } ];
      const table = Table({ data: sampleData, columns: cols });
      const th = getHeaders(table)[0];
      expect(th.style.textAlign).toBe('right');
    });

    test('uses custom render function', () => {
      const cols = [
        { key: 'name', title: 'Name', render: (val) => `<strong>${val}</strong>` },
      ];
      const table = Table({ data: sampleData, columns: cols });
      const cell = getRows(table)[0].querySelector('td');
      expect(cell.querySelector('strong')).toBeTruthy();
      expect(cell.querySelector('strong').textContent).toBe('Alice');
    });

    test('uses column key as title when title not set', () => {
      const cols = [ { key: 'name' } ];
      const table = Table({ data: sampleData, columns: cols });
      const th = getHeaders(table)[0];
      expect(th.textContent).toBe('name');
    });
  });

  // === Sort ===
  describe('sorting', () => {
    test('renders sortable headers', () => {
      const cols = [ { key: 'name', title: 'Name', sortable: true } ];
      const table = Table({ data: sampleData, columns: cols });
      const th = getHeaders(table)[0];
      expect(th.classList.contains('ds-table-sortable')).toBe(true);
    });

    test('sorts ascending on click', () => {
      const cols = [
        { key: 'name', title: 'Name' },
        { key: 'age', title: 'Age', sortable: true },
      ];
      const table = Table({ data: sampleData, columns: cols });
      const th = getHeaders(table)[1]; // Age column
      th.click();
      const rows = getRows(table);
      expect(rows[0].querySelectorAll('td')[0].textContent).toBe('Eve');
      expect(rows[4].querySelectorAll('td')[0].textContent).toBe('Charlie');
    });

    test('toggles to descending on second click', () => {
      const cols = [
        { key: 'name', title: 'Name' },
        { key: 'age', title: 'Age', sortable: true },
      ];
      const table = Table({ data: sampleData, columns: cols });
      const th = getHeaders(table)[1]; // Age column
      th.click(); // asc
      th.click(); // desc
      const rows = getRows(table);
      expect(rows[0].querySelectorAll('td')[0].textContent).toBe('Charlie');
    });

    test('clears sort on third click (single sort mode)', () => {
      const cols = [
        { key: 'name', title: 'Name' },
        { key: 'age', title: 'Age', sortable: true },
      ];
      const table = Table({ data: sampleData, columns: cols });
      const th = getHeaders(table)[1]; // Age column
      th.click(); // asc
      th.click(); // desc
      th.click(); // clear
      // Should be back to original order
      expect(getRows(table)[0].querySelectorAll('td')[0].textContent).toBe('Alice');
    });

    test('supports multi-sort', () => {
      const cols = [
        { key: 'name', title: 'Name' },
        { key: 'city', title: 'City', sortable: true },
        { key: 'age', title: 'Age', sortable: true },
      ];
      const table = Table({ data: sampleData, columns: cols, multiSort: true });
      const headers = getHeaders(table);
      headers[1].click(); // city asc
      headers[2].click(); // age asc
      const rows = getRows(table);
      // Chicago(35), LA(22,25), NYC(28,30)
      expect(rows[0].querySelectorAll('td')[1].textContent).toBe('Chicago');
    });

    test('setSort API works', () => {
      const cols = [
        { key: 'name', title: 'Name' },
        { key: 'age', title: 'Age', sortable: true },
      ];
      const table = Table({ data: sampleData, columns: cols });
      table.setSort('age', 'desc');
      expect(getRows(table)[0].querySelectorAll('td')[0].textContent).toBe('Charlie');
    });

    test('clearSort API works', () => {
      const cols = [
        { key: 'name', title: 'Name' },
        { key: 'age', title: 'Age', sortable: true },
      ];
      const table = Table({ data: sampleData, columns: cols });
      table.setSort('age', 'asc');
      table.clearSort();
      expect(getRows(table)[0].querySelectorAll('td')[0].textContent).toBe('Alice');
    });

    test('calls onSort callback', () => {
      const onSort = jest.fn();
      const cols = [ { key: 'age', title: 'Age', sortable: true } ];
      const table = Table({ data: sampleData, columns: cols, onSort });
      getHeaders(table)[0].click();
      expect(onSort).toHaveBeenCalledWith([ { key: 'age', order: 'asc' } ]);
    });

    test('supports custom sorter function', () => {
      const cols = [ {
        key: 'name', title: 'Name', sortable: true,
        sorter: (a, b, order) => order === 'asc' ? a.length - b.length : b.length - a.length,
      } ];
      const table = Table({ data: sampleData, columns: cols });
      getHeaders(table)[0].click();
      // By name length asc: Bob(3), Eve(3), Alice(5), Diana(5), Charlie(7)
      const names = Array.from(getRows(table)).map(r => r.querySelector('td').textContent);
      expect(names[0]).toBe('Bob');
    });
  });

  // === Filter ===
  describe('filtering', () => {
    test('setFilterText filters data', () => {
      const table = Table({ data: sampleData, columns, showFilter: true });
      table.setFilterText('Alice');
      expect(getRows(table).length).toBe(1);
      expect(getRows(table)[0].querySelector('td').textContent).toBe('Alice');
    });

    test('filter is case-insensitive', () => {
      const table = Table({ data: sampleData, columns });
      table.setFilterText('alice');
      expect(getRows(table).length).toBe(1);
    });

    test('filter searches across all columns', () => {
      const table = Table({ data: sampleData, columns });
      table.setFilterText('NYC');
      expect(getRows(table).length).toBe(2); // Alice and Diana
    });

    test('getFilterText returns current filter', () => {
      const table = Table({ data: sampleData, columns });
      table.setFilterText('test');
      expect(table.getFilterText()).toBe('test');
    });

    test('shows empty when filter matches nothing', () => {
      const table = Table({ data: sampleData, columns });
      table.setFilterText('zzzzz');
      expect(table.element.querySelector('.ds-table-empty')).toBeTruthy();
    });
  });

  // === Pagination ===
  describe('pagination', () => {
    const bigData = Array.from({ length: 25 }, (_, i) => ({ id: i + 1, name: `User${i + 1}`, age: 20 + i, city: 'City' }));

    test('paginates data with default page size', () => {
      const table = Table({ data: bigData, columns, pageSize: 10 });
      expect(getRows(table).length).toBe(10);
    });

    test('shows pagination controls', () => {
      const table = Table({ data: bigData, columns, pageSize: 10 });
      expect(table.element.querySelector('.ds-table-pagination')).toBeTruthy();
    });

    test('shows page info text', () => {
      const table = Table({ data: bigData, columns, pageSize: 10 });
      const info = table.element.querySelector('.ds-table-page-info');
      expect(info.textContent).toContain('1-10');
      expect(info.textContent).toContain('25');
    });

    test('navigates to next page', () => {
      const table = Table({ data: bigData, columns, pageSize: 10 });
      const nextBtn = table.element.querySelector('.ds-table-page-btn:last-child');
      nextBtn.click();
      expect(getRows(table).length).toBe(10);
      expect(getRows(table)[0].querySelector('td').textContent).toBe('User11');
    });

    test('setPage navigates to page', () => {
      const table = Table({ data: bigData, columns, pageSize: 10 });
      table.setPage(3);
      expect(getRows(table).length).toBe(5); // 25 items, page 3 = 5 remaining
    });

    test('setPageSize changes page size', () => {
      const table = Table({ data: bigData, columns, pageSize: 10 });
      table.setPageSize(5);
      expect(getRows(table).length).toBe(5);
    });

    test('hides pagination when data fits in one page', () => {
      const table = Table({ data: sampleData, columns, pageSize: 10 });
      expect(table.element.querySelector('.ds-table-pagination')).toBeFalsy();
    });

    test('disables prev button on first page', () => {
      const table = Table({ data: bigData, columns, pageSize: 10 });
      const prevBtn = table.element.querySelector('.ds-table-page-btn:first-child');
      expect(prevBtn.disabled).toBe(true);
    });

    test('calls onPageChange callback', () => {
      const onPageChange = jest.fn();
      const table = Table({ data: bigData, columns, pageSize: 10, onPageChange });
      table.setPage(2);
      expect(onPageChange).toHaveBeenCalledWith(2);
    });

    test('shows page size selector with pageSizeOptions', () => {
      const table = Table({ data: bigData, columns, pageSize: 10, pageSizeOptions: [ 5, 10, 20 ] });
      const select = table.element.querySelector('.ds-table-page-size');
      expect(select).toBeTruthy();
      expect(select.options.length).toBe(3);
    });
  });

  // === Selection ===
  describe('selection', () => {
    test('renders checkbox column', () => {
      const table = Table({ data: sampleData, columns, selection: 'checkbox' });
      const header = getHeaders(table)[0];
      expect(header.classList.contains('ds-table-col-selection')).toBe(true);
      expect(header.querySelector('input[type="checkbox"]')).toBeTruthy();
    });

    test('renders radio column', () => {
      const table = Table({ data: sampleData, columns, selection: 'radio' });
      const rows = getRows(table);
      const input = rows[0].querySelector('input[type="radio"]');
      expect(input).toBeTruthy();
    });

    test('selectRow selects a row', () => {
      const table = Table({ data: sampleData, columns, selection: 'checkbox' });
      table.selectRow(1);
      expect(table.getSelectedKeys()).toContain(1);
      expect(table.element.querySelector('tr[data-row-key="1"]').classList.contains('ds-table-row-selected')).toBe(true);
    });

    test('deselectRow deselects a row', () => {
      const table = Table({ data: sampleData, columns, selection: 'checkbox' });
      table.selectRow(1);
      table.deselectRow(1);
      expect(table.getSelectedKeys()).not.toContain(1);
    });

    test('selectAll selects all visible rows', () => {
      const table = Table({ data: sampleData, columns, selection: 'checkbox' });
      table.selectAll();
      expect(table.getSelectedKeys().length).toBe(5);
    });

    test('deselectAll clears all selections', () => {
      const table = Table({ data: sampleData, columns, selection: 'checkbox' });
      table.selectAll();
      table.deselectAll();
      expect(table.getSelectedKeys().length).toBe(0);
    });

    test('radio mode allows only one selection', () => {
      const table = Table({ data: sampleData, columns, selection: 'radio' });
      table.selectRow(1);
      table.selectRow(2);
      expect(table.getSelectedKeys().length).toBe(1);
      expect(table.getSelectedKeys()).toContain(2);
    });

    test('getSelectedRows returns full row objects', () => {
      const table = Table({ data: sampleData, columns, selection: 'checkbox' });
      table.selectRow(1);
      table.selectRow(3);
      const rows = table.getSelectedRows();
      expect(rows.length).toBe(2);
      expect(rows[0].name).toBe('Alice');
      expect(rows[1].name).toBe('Charlie');
    });

    test('calls onSelect callback', () => {
      const onSelect = jest.fn();
      const table = Table({ data: sampleData, columns, selection: 'checkbox', onSelect });
      table.selectRow(1);
      expect(onSelect).toHaveBeenCalled();
      expect(onSelect.mock.calls[0][0]).toContain(1);
    });
  });

  // === Expand ===
  describe('expand rows', () => {
    test('renders expand column', () => {
      const table = Table({ data: sampleData, columns, expandable: (row) => `<div>Detail: ${row.name}</div>` });
      const expandHeader = table.element.querySelector('.ds-table-col-expand');
      expect(expandHeader).toBeTruthy();
    });

    test('renders expand buttons', () => {
      const table = Table({ data: sampleData, columns, expandable: (row) => `<div>${row.name}</div>` });
      const btns = table.element.querySelectorAll('.ds-table-expand-btn');
      expect(btns.length).toBe(5);
    });

    test('toggleExpand shows expand content', () => {
      const table = Table({ data: sampleData, columns, expandable: (row) => `<div class="detail">${row.name}</div>` });
      table.toggleExpand(1);
      const expandRow = table.element.querySelector('.ds-table-expand-row');
      expect(expandRow).toBeTruthy();
      expect(expandRow.querySelector('.detail').textContent).toBe('Alice');
    });

    test('toggleExpand hides on second call', () => {
      const table = Table({ data: sampleData, columns, expandable: (row) => `<div>${row.name}</div>` });
      table.toggleExpand(1);
      expect(table.element.querySelector('.ds-table-expand-row')).toBeTruthy();
      table.toggleExpand(1);
      expect(table.element.querySelector('.ds-table-expand-row')).toBeFalsy();
    });

    test('expandAll expands all rows', () => {
      const table = Table({ data: sampleData, columns, expandable: (row) => `<div>${row.name}</div>` });
      table.expandAll();
      const expandRows = table.element.querySelectorAll('.ds-table-expand-row');
      expect(expandRows.length).toBe(5);
    });

    test('collapseAll collapses all rows', () => {
      const table = Table({ data: sampleData, columns, expandable: (row) => `<div>${row.name}</div>` });
      table.expandAll();
      table.collapseAll();
      expect(table.element.querySelectorAll('.ds-table-expand-row').length).toBe(0);
    });

    test('calls onExpand callback', () => {
      const onExpand = jest.fn();
      const table = Table({ data: sampleData, columns, expandable: (row) => `<div>${row.name}</div>`, onExpand });
      table.toggleExpand(1);
      expect(onExpand).toHaveBeenCalledWith(1, true);
    });
  });

  // === Data API ===
  describe('data API', () => {
    test('setData updates table data', () => {
      const table = Table({ data: [], columns });
      expect(table.element.querySelector('.ds-table-empty')).toBeTruthy();
      table.setData(sampleData);
      expect(getRows(table).length).toBe(5);
    });

    test('getData returns current data', () => {
      const table = Table({ data: sampleData, columns });
      const data = table.getData();
      expect(data.length).toBe(5);
      expect(data[0].name).toBe('Alice');
    });

    test('setData with empty array clears table', () => {
      const table = Table({ data: sampleData, columns });
      table.setData([]);
      expect(table.element.querySelector('.ds-table-empty')).toBeTruthy();
    });

    test('throws on non-object options', () => {
      expect(() => Table(null)).toThrow(TypeError);
    });
  });

  // === CSV Export ===
  describe('CSV export', () => {
    test('exports data as CSV', () => {
      const table = Table({ data: sampleData, columns });
      const csv = table.exportCSV();
      const lines = csv.split('\n');
      expect(lines[0]).toBe('Name,Age,City');
      expect(lines[1]).toBe('Alice,30,NYC');
      expect(lines.length).toBe(6); // header + 5 rows
    });

    test('handles commas in values', () => {
      const data = [ { id: 1, name: 'Smith, John', age: 30, city: 'NYC' } ];
      const table = Table({ data, columns });
      const csv = table.exportCSV();
      expect(csv).toContain('"Smith, John"');
    });
  });

  // === Row Click ===
  describe('row click', () => {
    test('calls onRowClick when row is clicked', () => {
      const onRowClick = jest.fn();
      const table = Table({ data: sampleData, columns, onRowClick });
      const row = getRows(table)[0];
      row.click();
      expect(onRowClick).toHaveBeenCalledWith(sampleData[0], 1);
    });
  });

  // === Inline Edit ===
  describe('inline edit', () => {
    test('double click on editable cell starts edit', () => {
      const cols = [ { key: 'name', title: 'Name', editable: true } ];
      const table = Table({ data: sampleData, columns: cols, editable: true });
      const cell = getRows(table)[0].querySelector('td');
      cell.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
      expect(table.element.querySelector('.ds-table-edit-input')).toBeTruthy();
    });

    test('save edit updates data', () => {
      const freshData = sampleData.map(d => ({ ...d }));
      const cols = [ { key: 'name', title: 'Name', editable: true } ];
      const table = Table({ data: freshData, columns: cols, editable: true });
      const cell = getRows(table)[0].querySelector('td');
      cell.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
      const input = table.element.querySelector('.ds-table-edit-input');
      input.value = 'Updated';
      input.dispatchEvent(new Event('input'));
      const saveBtn = table.element.querySelector('.ds-table-edit-save');
      saveBtn.click();
      expect(table.getData()[0].name).toBe('Updated');
    });

    test('cancel edit restores original', () => {
      const freshData = sampleData.map(d => ({ ...d }));
      const cols = [ { key: 'name', title: 'Name', editable: true } ];
      const table = Table({ data: freshData, columns: cols, editable: true });
      const cell = getRows(table)[0].querySelector('td');
      cell.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
      const input = table.element.querySelector('.ds-table-edit-input');
      input.value = 'Updated';
      input.dispatchEvent(new Event('input'));
      const cancelBtn = table.element.querySelector('.ds-table-edit-cancel');
      cancelBtn.click();
      expect(table.element.querySelector('.ds-table-edit-input')).toBeFalsy();
      expect(table.getData()[0].name).toBe('Alice');
    });
  });

  // === Destroy ===
  describe('destroy', () => {
    test('removes element from DOM', () => {
      document.body.appendChild(table_element());
      const table = Table({ data: sampleData, columns });
      document.body.appendChild(table.element);
      expect(document.body.contains(table.element)).toBe(true);
      table.destroy();
      expect(document.body.contains(table.element)).toBe(false);
    });
  });
});

function table_element() { return document.createElement('div'); }
