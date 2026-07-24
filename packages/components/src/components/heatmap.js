// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Heatmap module built on the 2.0 reactive core.
 *
 * GitHub-style contribution heatmap with date-based data, color levels, and tooltips.
 *
 * ```js
 * import { Heatmap } from '@kupola/components/heatmap';
 *
 * const heatmap = Heatmap({
 *   data: [{ date: '2024-01-15', value: 5 }, ...],
 *   color: '#22c55e',
 *   title: 'Contributions',
 *   onCellClick: (info) => console.log(info),
 * });
 *
 * document.body.appendChild(heatmap.element);
 * heatmap.updateData(newData);
 * heatmap.destroy();
 * ```
 *
 * @module components/heatmap
 */

const MONTHS = [ '1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月' ];
const WEEKDAYS = [ '', '一', '', '三', '', '五', '' ];

function _formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function _hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  } : { r: 34, g: 197, b: 94 };
}

function _getLevel(value, maxValue) {
  if (value === 0) {return 0;}
  if (!maxValue || maxValue === 0) {return 1;}
  const ratio = value / maxValue;
  if (ratio < 0.2) {return 1;}
  if (ratio < 0.4) {return 2;}
  if (ratio < 0.6) {return 3;}
  if (ratio < 0.8) {return 4;}
  return 5;
}

function _getOpacity(level) {
  return [ 0, 0.2, 0.4, 0.6, 0.8, 1 ][level] || 0;
}

export function Heatmap(options = {}) {
  const data = (options.data || []).map(d => ({ ...d }));
  const startDate = options.startDate || _oneYearAgo();
  const endDate = options.endDate || new Date();
  const baseColor = options.color || '#22c55e';
  const title = options.title || '';
  const subtitle = options.subtitle || '';
  const onCellClick = options.onCellClick || null;

  const _listeners = [];
  let tooltip = null;

  function _oneYearAgo() {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 1);
    return d;
  }

  function _dataByDate(dateStr) {
    const item = data.find(d => d.date === dateStr);
    return item ? item.value : 0;
  }

  function _cellColor(level) {
    if (level === 0) {return 'rgba(0, 0, 0, 0.1)';}
    const rgb = _hexToRgb(baseColor);
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${_getOpacity(level)})`;
  }

  function _buildWeeks() {
    const weeks = [];
    let currentWeek = [];
    const first = new Date(startDate);
    const firstDay = first.getDay();
    for (let i = 1; i < firstDay; i++) {
      currentWeek.push(null);
    }
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      currentWeek.push(new Date(d));
      if (d.getDay() === 6 || d.getTime() === endDate.getTime()) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }
    return weeks;
  }

  function _monthLabels(weeks) {
    const result = [];
    let currentMonth = -1;
    const start = new Date(startDate);
    const dayOffset = Math.floor((start - new Date(start.getFullYear(), 0, 1)) / 86400000);

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const month = d.getMonth();
      if (d.getDate() === 1 && month !== currentMonth) {
        const totalDays = Math.floor((d - startDate) / 86400000);
        const weekIndex = Math.floor(totalDays / 7);
        result.push({ month, label: MONTHS[month], weekIndex });
        currentMonth = month;
      }
    }
    return result;
  }

  function _render() {
    const weeks = _buildWeeks();
    const maxValue = Math.max(...data.map(d => d.value), 1);
    const rgb = _hexToRgb(baseColor);

    // Root
    const root = document.createElement('div');
    root.className = 'ds-heatmap';

    // Header
    if (title || subtitle) {
      const header = document.createElement('div');
      header.className = 'ds-heatmap__header';
      const headerLeft = document.createElement('div');
      if (title) {
        const titleEl = document.createElement('div');
        titleEl.className = 'ds-heatmap__title';
        titleEl.textContent = title;
        headerLeft.appendChild(titleEl);
      }
      if (subtitle) {
        const subEl = document.createElement('div');
        subEl.className = 'ds-heatmap__subtitle';
        subEl.textContent = subtitle;
        headerLeft.appendChild(subEl);
      }
      header.appendChild(headerLeft);
      root.appendChild(header);
    }

    // Body
    const body = document.createElement('div');
    body.className = 'ds-heatmap__body';

    const container = document.createElement('div');
    container.className = 'ds-heatmap__container';

    const labelsAndGrid = document.createElement('div');
    labelsAndGrid.className = 'ds-heatmap__labels-and-grid';

    // Weekday labels
    const weekdayLabels = document.createElement('div');
    weekdayLabels.className = 'ds-heatmap__weekday-labels';
    WEEKDAYS.forEach(label => {
      const el = document.createElement('div');
      el.className = 'ds-heatmap__weekday-label';
      el.textContent = label;
      weekdayLabels.appendChild(el);
    });
    labelsAndGrid.appendChild(weekdayLabels);

    // Grid container
    const gridContainer = document.createElement('div');
    gridContainer.className = 'ds-heatmap__grid-container';

    // Month labels
    const monthLabelsEl = document.createElement('div');
    monthLabelsEl.className = 'ds-heatmap__month-labels';
    const monthInfo = _monthLabels(weeks);
    monthInfo.forEach((item, index) => {
      const el = document.createElement('div');
      el.className = 'ds-heatmap__month-label';
      el.textContent = item.label;
      const nextItem = monthInfo[index + 1];
      const span = nextItem ? nextItem.weekIndex - item.weekIndex : weeks.length - item.weekIndex;
      el.style.width = `${span * 16}px`;
      monthLabelsEl.appendChild(el);
    });
    gridContainer.appendChild(monthLabelsEl);

    // Grid
    const grid = document.createElement('div');
    grid.className = 'ds-heatmap__grid';

    weeks.forEach(week => {
      const weekCol = document.createElement('div');
      weekCol.className = 'ds-heatmap__week-column';

      week.forEach(date => {
        if (date === null) {
          const empty = document.createElement('div');
          empty.className = 'ds-heatmap__cell';
          empty.style.visibility = 'hidden';
          weekCol.appendChild(empty);
        } else {
          const dateStr = _formatDate(date);
          const value = _dataByDate(dateStr);
          const level = _getLevel(value, maxValue);

          const cell = document.createElement('div');
          cell.className = 'ds-heatmap__cell';
          cell.dataset.date = dateStr;
          cell.dataset.value = String(value);
          cell.style.backgroundColor = _cellColor(level);

          const mouseenterHandler = (e) => {
            if (tooltip) {
              const rect = e.target.getBoundingClientRect();
              tooltip.innerHTML = `<div class="ds-heatmap__tooltip-date">${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日</div><div class="ds-heatmap__tooltip-value">${value} contributions</div>`;
              tooltip.style.left = `${rect.left + rect.width / 2 - 75}px`;
              tooltip.style.top = `${rect.top - 50}px`;
              tooltip.classList.add('is-visible');
            }
          };
          const mouseleaveHandler = () => {
            if (tooltip) {tooltip.classList.remove('is-visible');}
          };
          const clickHandler = () => {
            if (onCellClick) {onCellClick({ date: dateStr, value });}
          };

          cell.addEventListener('mouseenter', mouseenterHandler);
          cell.addEventListener('mouseleave', mouseleaveHandler);
          cell.addEventListener('click', clickHandler);

          _listeners.push(
            { el: cell, event: 'mouseenter', handler: mouseenterHandler },
            { el: cell, event: 'mouseleave', handler: mouseleaveHandler },
            { el: cell, event: 'click', handler: clickHandler },
          );

          weekCol.appendChild(cell);
        }
      });

      grid.appendChild(weekCol);
    });

    gridContainer.appendChild(grid);
    labelsAndGrid.appendChild(gridContainer);
    container.appendChild(labelsAndGrid);

    // Legend
    const legend = document.createElement('div');
    legend.className = 'ds-heatmap__legend';
    const lessLabel = document.createElement('span');
    lessLabel.className = 'ds-heatmap__legend-label';
    lessLabel.textContent = '少';
    const legendCells = document.createElement('div');
    legendCells.className = 'ds-heatmap__legend-cells';
    for (let i = 0; i <= 5; i++) {
      const lc = document.createElement('div');
      lc.className = 'ds-heatmap__legend-cell';
      lc.style.backgroundColor = _cellColor(i);
      legendCells.appendChild(lc);
    }
    const moreLabel = document.createElement('span');
    moreLabel.className = 'ds-heatmap__legend-label';
    moreLabel.textContent = '多';
    legend.appendChild(lessLabel);
    legend.appendChild(legendCells);
    legend.appendChild(moreLabel);
    container.appendChild(legend);

    body.appendChild(container);
    root.appendChild(body);

    // Tooltip (appended to body)
    tooltip = document.createElement('div');
    tooltip.className = 'ds-heatmap__tooltip';
    root.appendChild(tooltip);

    return root;
  }

  const element = _render();

  function updateData(newData) {
    _listeners.forEach(({ el, event, handler }) => {
      el.removeEventListener(event, handler);
    });
    _listeners.length = 0;

    // Replace data
    data.length = 0;
    newData.forEach(d => data.push({ ...d }));

    // Re-render in-place
    const newEl = _render();
    element.innerHTML = newEl.innerHTML;
    // Copy attributes
    for (const attr of newEl.attributes) {
      if (!element.hasAttribute(attr.name)) {
        element.setAttribute(attr.name, attr.value);
      }
    }
  }

  function destroy() {
    _listeners.forEach(({ el, event, handler }) => {
      el.removeEventListener(event, handler);
    });
    _listeners.length = 0;
    tooltip = null;
    if (element && element.parentNode) {
      element.remove();
    }
  }

  return { element, updateData, destroy };
}
