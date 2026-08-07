// SPDX-License-Identifier: MIT
/**
 * Focused unit tests for the extracted Table data pipeline and virtual
 * scrolling helpers. The component-level behavior is covered by the full
 * table.test.js suite; these tests pin down the pure math and edge cases.
 */

import {
  escapeCSV,
  filterTree,
  flattenVisible,
  getChildrenKey,
  getPageNumbers,
  normalizeData,
  rowMatchesFilter,
  sortData,
  treeExpandAll,
} from '../src/components/table-data.js';
import {
  computeVirtualState,
  getVirtualViewportHeight,
  isVirtualEnabled,
} from '../src/components/table-virtual.js';
import { getTableClass, getTotalColCount } from '../src/components/table-render.js';
import { cancelEdit, saveEdit, startEdit } from '../src/components/table-editing.js';

describe('table-data: page numbers', () => {
  test('returns every page when total is small', () => {
    expect(getPageNumbers(1, 5)).toEqual([ 1, 2, 3, 4, 5 ]);
  });

  test('groups the start of a large range', () => {
    expect(getPageNumbers(2, 20)).toEqual([ 1, 2, 3, 4, 5, '...', 20 ]);
  });

  test('groups the middle of a large range', () => {
    expect(getPageNumbers(10, 20)).toEqual([ 1, '...', 9, 10, 11, '...', 20 ]);
  });

  test('groups the end of a large range', () => {
    expect(getPageNumbers(19, 20)).toEqual([ 1, '...', 16, 17, 18, 19, 20 ]);
  });
});

describe('table-data: CSV escaping', () => {
  test('leaves plain values untouched', () => {
    expect(escapeCSV('hello')).toBe('hello');
    expect(escapeCSV(42)).toBe('42');
    expect(escapeCSV(null)).toBe('');
  });

  test('quotes values containing commas, quotes, or newlines', () => {
    expect(escapeCSV('a,b')).toBe('"a,b"');
    expect(escapeCSV('say "hi"')).toBe('"say ""hi"""');
    expect(escapeCSV('line1\nline2')).toBe('"line1\nline2"');
  });
});

describe('table-data: normalization and validation', () => {
  test('turns undefined into an empty array', () => {
    expect(normalizeData(undefined, 'id', null)).toEqual([]);
  });

  test('rejects non-array data', () => {
    expect(() => normalizeData({}, 'id', null)).toThrow('data must be an array');
  });

  test('rejects duplicate row keys', () => {
    expect(() => normalizeData([ { id: 1 }, { id: 1 } ], 'id', null))
      .toThrow('duplicate rowKey "1"');
  });

  test('clones tree children recursively', () => {
    const data = [ { id: 1, children: [ { id: 2, children: [ { id: 3 } ] } ] } ];
    const cloned = normalizeData(data, 'id', { childrenKey: 'children' });
    expect(cloned).not.toBe(data);
    expect(cloned[0].children).not.toBe(data[0].children);
    expect(cloned[0].children[0].children[0].id).toBe(3);
  });
});

describe('table-data: sorting', () => {
  const columnsMap = new Map([
    [ 'name', { key: 'name' } ],
    [ 'age', { key: 'age' } ],
  ]);

  test('sorts ascending and descending with nulls last', () => {
    const rows = [ { name: 'b', age: 2 }, { name: 'a', age: null }, { name: 'c', age: 1 } ];
    const asc = sortData(rows, [ { key: 'age', order: 'asc' } ], columnsMap, null, new WeakMap());
    expect(asc.map(r => r.name)).toEqual([ 'c', 'b', 'a' ]);
  });

  test('reuses the cache for identical data and sorts', () => {
    const rows = [ { name: 'b' }, { name: 'a' } ];
    const cache = new WeakMap();
    const first = sortData(rows, [ { key: 'name', order: 'asc' } ], columnsMap, null, cache);
    const second = sortData(rows, [ { key: 'name', order: 'asc' } ], columnsMap, null, cache);
    expect(first).toBe(second);
  });
});

describe('table-data: tree helpers', () => {
  const tree = [
    { id: 1, children: [
      { id: 2, children: [ { id: 3 } ] },
      { id: 4 },
    ] },
  ];

  test('getChildrenKey falls back to children', () => {
    expect(getChildrenKey(null)).toBe('children');
    expect(getChildrenKey({ childrenKey: 'kids' })).toBe('kids');
  });

  test('treeExpandAll marks every parent expanded', () => {
    const expanded = new Set();
    treeExpandAll(tree, 'children', 'id', expanded);
    expect([ ...expanded ]).toEqual([ 1, 2 ]);
  });

  test('flattenVisible only descends into expanded rows', () => {
    const collapsed = flattenVisible(tree, 0, 'children', 'id', new Set());
    expect(collapsed.map(r => r.id)).toEqual([ 1 ]);
    const expanded = flattenVisible(tree, 0, 'children', 'id', new Set([ 1, 2 ]));
    expect(expanded.map(r => r.id)).toEqual([ 1, 2, 3, 4 ]);
    expect(expanded[1]._level).toBe(1);
    expect(expanded[1]._hasChildren).toBe(true);
  });

  test('filterTree keeps matching descendants and expands them', () => {
    const expanded = new Set();
    const result = filterTree(tree, '3', 'children', 'id', expanded, [ { key: 'id' } ], '3');
    expect(result[0].children[0].children[0].id).toBe(3);
    expect(expanded.has(1)).toBe(true);
    expect(expanded.has(2)).toBe(true);
  });

  test('rowMatchesFilter delegates to a custom filterFn with raw text', () => {
    const filterFn = jest.fn(() => true);
    const columns = [ { key: 'name', filterFn } ];
    expect(rowMatchesFilter({ name: 'x' }, 'x', columns, 'Raw Text')).toBe(true);
    expect(filterFn).toHaveBeenCalledWith('x', 'Raw Text');
  });
});

describe('table-virtual: helpers', () => {
  test('isVirtualEnabled requires virtualScroll and no blocking features', () => {
    expect(isVirtualEnabled({ virtualScroll: {} })).toBe(true);
    expect(isVirtualEnabled({ virtualScroll: {}, expandable: true })).toBe(false);
    expect(isVirtualEnabled({ virtualScroll: {}, mergeCells: () => {} })).toBe(false);
    expect(isVirtualEnabled({ virtualScroll: {}, draggable: true })).toBe(false);
    expect(isVirtualEnabled({})).toBe(false);
  });

  test('getVirtualViewportHeight resolves numbers and falls back to rows', () => {
    expect(getVirtualViewportHeight({ height: 300 }, 10, 40, 1000)).toBe(300);
    expect(getVirtualViewportHeight({}, 10, 40, 3)).toBe(120);
    expect(getVirtualViewportHeight({ visibleRows: 5 }, 10, 40, 1000)).toBe(200);
  });

  test('computeVirtualState clamps scroll and returns spacer sizes', () => {
    const data = Array.from({ length: 100 }, (_, i) => ({ id: i + 1 }));
    const state = computeVirtualState(data, { rowHeight: 40, overscan: 2, height: 400 }, 10, 99999);
    expect(state.scrollTop).toBe(100 * 40 - 400);
    expect(state.rows.length).toBeGreaterThan(0);
    expect(state.rows[0].id).toBeGreaterThan(1);
    expect(state.topHeight).toBeGreaterThan(0);
    expect(state.bottomHeight).toBe(0);
    expect(state.heightStyle).toBe('400px');
  });
});

describe('table-render: helpers', () => {
  test('getTableClass maps options to classes', () => {
    expect(getTableClass({})).toBe('ds-table ds-table-hover');
    expect(getTableClass({ striped: true, bordered: true, compact: true }))
      .toBe('ds-table ds-table-striped ds-table-hover ds-table-bordered ds-table-compact');
    expect(getTableClass({ hoverable: false })).toBe('ds-table');
  });

  test('getTotalColCount includes selection and expand columns', () => {
    expect(getTotalColCount([ {}, {} ], null, null)).toBe(2);
    expect(getTotalColCount([ {} ], 'checkbox', () => {})).toBe(3);
  });
});

describe('table-editing: state machine', () => {
  test('startEdit enters edit mode with a buffered value', () => {
    const editing = { cell: null, buffer: {} };
    const rerender = jest.fn();
    startEdit(editing, 1, 'name', 'Alice', rerender);
    expect(editing.cell).toEqual({ rowKey: 1, colKey: 'name' });
    expect(editing.buffer).toEqual({ name: 'Alice' });
    expect(rerender).toHaveBeenCalledTimes(1);
  });

  test('saveEdit writes the buffer into the row and resets state', () => {
    const editing = { cell: { rowKey: 1, colKey: 'name' }, buffer: { name: 'Bob' } };
    const data = [ { id: 1, name: 'Alice' } ];
    const clearCaches = jest.fn();
    const rerender = jest.fn();
    const onEditSave = jest.fn();
    saveEdit(editing, data, 'id', 1, 'name', clearCaches, rerender, onEditSave);
    expect(data[0].name).toBe('Bob');
    expect(clearCaches).toHaveBeenCalledTimes(1);
    expect(editing.cell).toBeNull();
    expect(editing.buffer).toEqual({});
    expect(onEditSave).toHaveBeenCalledWith(data[0], 'name');
    expect(rerender).toHaveBeenCalledTimes(1);
  });

  test('saveEdit without a matching row still resets state', () => {
    const editing = { cell: { rowKey: 99, colKey: 'name' }, buffer: { name: 'Bob' } };
    const data = [ { id: 1, name: 'Alice' } ];
    const rerender = jest.fn();
    saveEdit(editing, data, 'id', 99, 'name', jest.fn(), rerender, undefined);
    expect(data[0].name).toBe('Alice');
    expect(editing.cell).toBeNull();
    expect(editing.buffer).toEqual({});
    expect(rerender).toHaveBeenCalledTimes(1);
  });

  test('cancelEdit discards the buffer and fires onEditCancel', () => {
    const editing = { cell: { rowKey: 1, colKey: 'name' }, buffer: { name: 'Bob' } };
    const rerender = jest.fn();
    const onEditCancel = jest.fn();
    cancelEdit(editing, rerender, onEditCancel);
    expect(editing.cell).toBeNull();
    expect(editing.buffer).toEqual({});
    expect(onEditCancel).toHaveBeenCalledTimes(1);
    expect(rerender).toHaveBeenCalledTimes(1);
  });
});
