// SPDX-License-Identifier: MIT
/**
 * Table virtual scrolling helpers.
 *
 * Pure math for virtualized rendering: viewport height resolution, visible
 * range computation, and spacer sizing. The Table component feeds in its
 * options and scroll position, then renders only the returned visible rows.
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
export function getVirtualHeightStyle(virtualScroll, viewportHeight) {
  const configured = virtualScroll.height ?? virtualScroll.viewportHeight;
  return typeof configured === 'string' ? configured : `${viewportHeight}px`;
}

/**
 * Compute the visible row slice and spacer sizes for the current scroll top.
 * @param {Array} data
 * @param {object} virtualScroll
 * @param {number} pageSize
 * @param {number} scrollTop
 * @returns {{rows: Array, topHeight: number, bottomHeight: number,
 *            heightStyle: string, scrollTop: number}}
 */
export function computeVirtualState(data, virtualScroll, pageSize, scrollTop) {
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
