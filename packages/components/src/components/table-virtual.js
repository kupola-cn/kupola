// SPDX-License-Identifier: MIT
/**
 * Table virtual scrolling helpers.
 *
 * Pure math for virtualized rendering: viewport height resolution, visible
 * range computation, and spacer sizing. The Table component feeds in its
 * options and scroll position, then renders only the returned visible rows.
 *
 * Supports both fixed row height and dynamic (variable) row height modes.
 *
 * @module TableVirtual
 */

/**
 * Whether virtual scrolling is active for the given options.
 * @param {object} options
 * @returns {boolean}
 */
export function isVirtualEnabled(options) {
  return !!options.virtualScroll && !options.expandable && !options.mergeCells && !options.draggable;
}

/**
 * Whether dynamic row height mode is enabled.
 * @param {object} virtualScroll
 * @returns {boolean}
 */
export function isDynamicRowHeight(virtualScroll) {
  return !!virtualScroll && (virtualScroll.dynamic === true || typeof virtualScroll.estimatedRowHeight === 'number');
}

/**
 * Resolve the virtual viewport height from config, CSS units, or row count.
 * @param {object} virtualScroll
 * @param {number} pageSize
 * @param {number} rowHeight
 * @param {number} totalRows
 * @returns {number}
 */
export function getVirtualViewportHeight(virtualScroll, pageSize, rowHeight, totalRows) {
  const configured = virtualScroll.height ?? virtualScroll.viewportHeight;
  if (typeof configured === 'number' && configured > 0) {
    return configured;
  }
  if (typeof configured === 'string') {
    const value = configured.trim();
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed) && parsed > 0) {
      if (value.endsWith('px')) {return parsed;}
      if (value.endsWith('vh') && typeof window !== 'undefined') {
        return (window.innerHeight || 0) * parsed / 100;
      }
      if (value.endsWith('rem') && typeof window !== 'undefined') {
        const rootSize = Number.parseFloat(
          window.getComputedStyle?.(document.documentElement)?.fontSize,
        ) || 16;
        return parsed * rootSize;
      }
    }
  }

  const visibleRows = Math.max(1, Number(virtualScroll.visibleRows) || pageSize || 10);
  return rowHeight * Math.min(totalRows || visibleRows, visibleRows);
}

/**
 * Resolve the height style string for the virtual wrapper.
 * @param {object} virtualScroll
 * @param {number} viewportHeight
 * @returns {string}
 */
function getVirtualHeightStyle(virtualScroll, viewportHeight) {
  const configured = virtualScroll.height ?? virtualScroll.viewportHeight;
  return typeof configured === 'string' ? configured : `${viewportHeight}px`;
}

/**
 * Compute cumulative height offsets for dynamic row heights.
 * Returns an array where index i represents the total height of rows 0..i-1.
 * @param {Array<number>} heights - Array of measured heights per row
 * @param {number} totalRows - Total number of rows
 * @param {number} estimatedRowHeight - Fallback height for unmeasured rows
 * @returns {Array<number>}
 */
export function computeCumulativeOffsets(heights, totalRows, estimatedRowHeight) {
  const offsets = new Array(totalRows + 1);
  offsets[0] = 0;
  let cumulative = 0;
  for (let i = 0; i < totalRows; i++) {
    const h = heights[i] || estimatedRowHeight;
    cumulative += h;
    offsets[i + 1] = cumulative;
  }
  return offsets;
}

/**
 * Find which row index contains the given scroll offset using binary search.
 * @param {number} scrollOffset - The scroll position to look up
 * @param {Array<number>} offsets - Cumulative offsets array from computeCumulativeOffsets
 * @returns {number} Row index
 */
function findRowAtOffset(scrollOffset, offsets) {
  let lo = 0;
  let hi = offsets.length - 2;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (offsets[mid + 1] <= scrollOffset) {
      lo = mid + 1;
    } else if (offsets[mid] > scrollOffset) {
      hi = mid - 1;
    } else {
      return mid;
    }
  }
  return lo;
}

/**
 * Compute the visible row slice and spacer sizes for dynamic row heights.
 * @param {Array} data
 * @param {object} virtualScroll
 * @param {number} pageSize
 * @param {number} scrollTop
 * @param {Array<number>} heights - Measured heights per row (undefined for unmeasured)
 * @returns {{rows: Array, topHeight: number, bottomHeight: number,
 *            heightStyle: string, scrollTop: number, offsets: Array<number>}}
 */
export function computeVirtualStateDynamic(data, virtualScroll, pageSize, scrollTop, heights) {
  const estimatedRowHeight = Math.max(1, Number(virtualScroll.estimatedRowHeight) || Number(virtualScroll.rowHeight) || 40);
  const overscan = Math.max(0, Number(virtualScroll.overscan) || 5);
  const viewportHeight = getVirtualViewportHeight(virtualScroll, pageSize, estimatedRowHeight, data.length);

  // Compute cumulative offsets
  const offsets = computeCumulativeOffsets(heights || new Array(data.length), data.length, estimatedRowHeight);
  const totalHeight = offsets[data.length];

  const maxScrollTop = Math.max(0, totalHeight - viewportHeight);
  const clampedScrollTop = Math.max(0, Math.min(scrollTop, maxScrollTop));

  // Find start row
  const startRow = findRowAtOffset(clampedScrollTop, offsets);
  const start = Math.max(0, startRow - overscan);

  // Find end row
  const endOffset = clampedScrollTop + viewportHeight;
  let endRow = findRowAtOffset(endOffset, offsets);
  const end = Math.min(data.length, endRow + overscan + 1);

  return {
    rows: data.slice(start, end),
    topHeight: offsets[start],
    bottomHeight: Math.max(0, totalHeight - offsets[end]),
    heightStyle: getVirtualHeightStyle(virtualScroll, viewportHeight),
    scrollTop: clampedScrollTop,
    offsets,
  };
}

/**
 * Compute the visible row slice and spacer sizes for the current scroll top.
 * Supports both fixed and dynamic row height modes.
 * @param {Array} data
 * @param {object} virtualScroll
 * @param {number} pageSize
 * @param {number} scrollTop
 * @param {Array<number>} [heights] - Measured heights per row (for dynamic mode)
 * @returns {{rows: Array, topHeight: number, bottomHeight: number,
 *            heightStyle: string, scrollTop: number, offsets?: Array<number>}}
 */
export function computeVirtualState(data, virtualScroll, pageSize, scrollTop, heights) {
  if (isDynamicRowHeight(virtualScroll)) {
    return computeVirtualStateDynamic(data, virtualScroll, pageSize, scrollTop, heights);
  }

  const rowHeight = Math.max(1, Number(virtualScroll.rowHeight) || 40);
  const overscan = Math.max(0, Number(virtualScroll.overscan) || 5);
  const viewportHeight = getVirtualViewportHeight(virtualScroll, pageSize, rowHeight, data.length);
  const maxScrollTop = Math.max(0, data.length * rowHeight - viewportHeight);
  const clampedScrollTop = Math.max(0, Math.min(scrollTop, maxScrollTop));

  const start = Math.max(0, Math.floor(clampedScrollTop / rowHeight) - overscan);
  const visibleCount = Math.ceil(viewportHeight / rowHeight) + overscan * 2;
  const end = Math.min(data.length, start + visibleCount);

  return {
    rows: data.slice(start, end),
    topHeight: start * rowHeight,
    bottomHeight: Math.max(0, (data.length - end) * rowHeight),
    heightStyle: getVirtualHeightStyle(virtualScroll, viewportHeight),
    scrollTop: clampedScrollTop,
  };
}
