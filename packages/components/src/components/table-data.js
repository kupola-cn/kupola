// SPDX-License-Identifier: MIT
/**
 * Table data pipeline helpers.
 *
 * Pure data transformations used by the Table component: tree expansion and
 * flattening, filtering, sorting, row normalization, CSV escaping, and page
 * number generation. Every function takes explicit parameters so the logic
 * can be unit-tested in isolation without mounting a Table instance.
 *
 * @module TableData
 */

/**
 * Resolve the tree children key from a tree config.
 * @param {object|null} treeConfig
 * @returns {string}
 */
export function getChildrenKey(treeConfig) {
  return treeConfig?.childrenKey || 'children';
}

/**
 * Recursively mark every parent row as expanded.
 * @param {Array} data
 * @param {string} childrenKey
 * @param {string} rowKey
 * @param {Set} expandedKeys
 */
export function treeExpandAll(data, childrenKey, rowKey, expandedKeys) {
  data.forEach(row => {
    const key = row[rowKey];
    if (row[childrenKey]?.length) {
      expandedKeys.add(key);
      treeExpandAll(row[childrenKey], childrenKey, rowKey, expandedKeys);
    }
  });
}

/**
 * Flatten visible tree rows, tagging each with level and has-children flags.
 * @param {Array} data
 * @param {number} level
 * @param {string} childrenKey
 * @param {string} rowKey
 * @param {Set} expandedKeys
 * @returns {Array}
 */
export function flattenVisible(data, level, childrenKey, rowKey, expandedKeys) {
  const result = [];
  for (const row of data) {
    const key = row[rowKey];
    result.push({ ...row, _level: level, _hasChildren: !!(row[childrenKey]?.length) });
    if (row[childrenKey]?.length && expandedKeys.has(key)) {
      result.push(...flattenVisible(row[childrenKey], level + 1, childrenKey, rowKey, expandedKeys));
    }
  }
  return result;
}

/**
 * Return flattened visible rows, or the raw data when tree mode is off.
 * @param {Array} data
 * @param {object|null} treeConfig
 * @param {string} rowKey
 * @param {Set} expandedKeys
 * @returns {Array}
 */
function getFlatData(data, treeConfig, rowKey, expandedKeys) {
  if (!treeConfig) {return data;}
  return flattenVisible(data, 0, getChildrenKey(treeConfig), rowKey, expandedKeys);
}

/**
 * Filter a tree, keeping rows that match or have matching descendants.
 * Expanded keys are mutated so filtered results stay visible.
 * @param {Array} data
 * @param {string} text - Lowercased filter text.
 * @param {string} childrenKey
 * @param {string} rowKey
 * @param {Set} expandedKeys
 * @param {Array} columns
 * @param {string} filterText - Raw filter text passed to custom filter fns.
 * @returns {Array}
 */
export function filterTree(data, text, childrenKey, rowKey, expandedKeys, columns, filterText) {
  return data.reduce((acc, row) => {
    const children = row[childrenKey]
      ? filterTree(row[childrenKey], text, childrenKey, rowKey, expandedKeys, columns, filterText)
      : [];
    const selfMatch = rowMatchesFilter(row, text, columns, filterText);
    if (selfMatch || children.length > 0) {
      acc.push({ ...row, [childrenKey]: children });
      if (children.length > 0) {expandedKeys.add(row[rowKey]);}
    }
    return acc;
  }, []);
}

/**
 * Check whether a row matches the active filter text.
 * @param {object} row
 * @param {string} text - Lowercased filter text.
 * @param {Array} columns
 * @param {string} filterText - Raw filter text passed to custom filter fns.
 * @returns {boolean}
 */
export function rowMatchesFilter(row, text, columns, filterText) {
  return columns.some(col => {
    const val = row[col.key];
    if (col.filterFn) {return col.filterFn(val, filterText);}
    return val != null && String(val).toLowerCase().includes(text);
  });
}

/**
 * Sort rows by the active sorts, caching by array identity and sort signature.
 * @param {Array} data
 * @param {Array} sorts - [{ key, order }]
 * @param {Map} columnsMap
 * @param {object|null} treeConfig
 * @param {WeakMap} sortCache
 * @returns {Array}
 */
export function sortData(data, sorts, columnsMap, treeConfig, sortCache) {
  const sortKey = JSON.stringify(sorts.map(({ key, order }) => [ key, order ]));
  let cacheForData = sortCache.get(data);

  if (cacheForData?.has(sortKey)) {
    return cacheForData.get(sortKey);
  }

  const sorted = [ ...data ].sort((a, b) => {
    for (const s of sorts) {
      // O(1) lookup using Map instead of O(n) find
      const col = columnsMap.get(s.key);
      const va = a[s.key];
      const vb = b[s.key];
      let cmp = 0;
      if (col?.sorter) {
        cmp = col.sorter(va, vb, s.order);
      } else {
        if (va == null) {cmp = 1;}
        else if (vb == null) {cmp = -1;}
        else if (typeof va === 'number' && typeof vb === 'number') {
          cmp = s.order === 'asc' ? va - vb : vb - va;
        } else {
          cmp = s.order === 'asc' ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
        }
      }
      if (cmp !== 0) {return cmp;}
    }
    return 0;
  });

  let result = sorted;
  if (treeConfig) {
    const ck = getChildrenKey(treeConfig);
    result = sorted.map(row => row[ck]?.length
      ? { ...row, [ck]: sortData(row[ck], sorts, columnsMap, treeConfig, sortCache) }
      : row);
  }

  // Update cache (keep last 5 cache entries)
  if (!cacheForData) {
    cacheForData = new Map();
    sortCache.set(data, cacheForData);
  } else if (cacheForData.size >= 5) {
    const firstKey = cacheForData.keys().next().value;
    cacheForData.delete(firstKey);
  }
  cacheForData.set(sortKey, result);

  return result;
}

/**
 * Deep-clone a row, recursing into tree children when tree mode is active.
 * @param {object} row
 * @param {object|null} treeConfig
 * @returns {object}
 */
function cloneRow(row, treeConfig) {
  if (!row || typeof row !== 'object') {return row;}
  const clone = { ...row };
  const childrenKey = getChildrenKey(treeConfig);
  if (treeConfig && Array.isArray(row[childrenKey])) {
    clone[childrenKey] = row[childrenKey].map(child => cloneRow(child, treeConfig));
  }
  return clone;
}

/**
 * Validate that every row is a plain object with a unique rowKey.
 * @param {Array} data
 * @param {string} rowKey
 * @param {object|null} treeConfig
 * @returns {Array}
 */
function validateData(data, rowKey, treeConfig) {
  const seen = new Set();
  const visit = rows => {
    if (!Array.isArray(rows)) {return;}
    for (const row of rows) {
      if (!row || typeof row !== 'object' || Array.isArray(row)) {
        throw new TypeError(`Table: each row must be an object with a unique ${rowKey}.`);
      }
      const key = row[rowKey];
      if (key === null || key === undefined
        || (typeof key !== 'string' && typeof key !== 'number')) {
        throw new TypeError(`Table: each row must provide a unique ${rowKey}.`);
      }
      const normalizedKey = `${typeof key}:${String(key)}`;
      if (seen.has(normalizedKey)) {
        throw new TypeError(`Table: duplicate rowKey "${String(key)}".`);
      }
      seen.add(normalizedKey);
      if (treeConfig) {visit(row[getChildrenKey(treeConfig)]);}
    }
  };
  visit(data);
  return data;
}

/**
 * Normalize input data: undefined becomes [], non-arrays throw, and each row
 * is cloned so external mutations cannot leak into the table.
 * @param {Array|undefined} data
 * @param {string} rowKey
 * @param {object|null} treeConfig
 * @returns {Array}
 */
export function normalizeData(data, rowKey, treeConfig) {
  if (data === undefined) {return [];}
  if (!Array.isArray(data)) {throw new TypeError('Table: data must be an array.');}
  validateData(data, rowKey, treeConfig);
  return data.map(row => cloneRow(row, treeConfig));
}

/**
 * Escape a value for CSV output.
 * @param {*} value
 * @returns {string}
 */
export function escapeCSV(value) {
  const str = value != null ? String(value) : '';
  return /[",\r\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

/**
 * Generate the pagination page list with ellipsis gaps.
 * @param {number} current
 * @param {number} total
 * @returns {Array<number|string>}
 */
export function getPageNumbers(current, total) {
  if (total <= 7) {return Array.from({ length: total }, (_, i) => i + 1);}
  const pages = [];
  if (current <= 4) {
    for (let i = 1; i <= 5; i++) {pages.push(i);}
    pages.push('...', total);
  } else if (current >= total - 3) {
    pages.push(1, '...');
    for (let i = total - 4; i <= total; i++) {pages.push(i);}
  } else {
    pages.push(1, '...');
    for (let i = current - 1; i <= current + 1; i++) {pages.push(i);}
    pages.push('...', total);
  }
  return pages;
}
