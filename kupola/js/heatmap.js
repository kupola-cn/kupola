class Heatmap {
  constructor(element, options = {}) {
    this.element = element;
    this.data = options.data || [];
    this.startDate = options.startDate || this.getOneYearAgo();
    this.endDate = options.endDate || new Date();
    this.cellSize = options.cellSize || 14;
    this.onCellClick = options.onCellClick || null;
    this.tooltip = null;
    this.baseColor = options.color || element.getAttribute('data-color') || '#22c55e';
    this._listeners = [];
    
    this.init();
  }

  getOneYearAgo() {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 1);
    return date;
  }

  init() {
    this.render();
    this.createTooltip();
  }

  getDataByDate(date) {
    const dateStr = this.formatDate(date);
    const item = this.data.find(d => d.date === dateStr);
    return item ? item.value : 0;
  }

  formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  getLevel(value, maxValue) {
    if (value === 0) return 0;
    if (!maxValue || maxValue === 0) maxValue = Math.max(...this.data.map(d => d.value), 1);
    const ratio = value / maxValue;
    if (ratio < 0.2) return 1;
    if (ratio < 0.4) return 2;
    if (ratio < 0.6) return 3;
    if (ratio < 0.8) return 4;
    return 5;
  }

  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 34, g: 197, b: 94 };
  }

  getCellColor(level) {
    const rgb = this.hexToRgb(this.baseColor);
    if (level === 0) return 'rgba(0, 0, 0, 0.1)';
    const opacity = [0.2, 0.4, 0.6, 0.8, 1][level - 1];
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
  }

  getWeekdayLabels() {
    return ['', '一', '', '三', '', '五', ''];
  }

  getMonthLabels() {
    const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    const result = [];
    let currentMonth = -1;
    
    for (let d = new Date(this.startDate); d <= this.endDate; d.setDate(d.getDate() + 1)) {
      const month = d.getMonth();
      const day = d.getDate();
      if (month !== currentMonth && day === 1) {
        result.push({ month, label: months[month], offset: Math.floor((d - this.startDate) / (1000 * 60 * 60 * 24)) });
        currentMonth = month;
      }
    }
    
    return result;
  }

  getWeekCount() {
    let weeks = 0;
    let firstDate = new Date(this.startDate);
    const firstDayOfWeek = firstDate.getDay();
    
    for (let d = new Date(this.startDate); d <= this.endDate; d.setDate(d.getDate() + 1)) {
      if (d.getDay() === 0) {
        weeks++;
      }
    }
    
    if (firstDayOfWeek !== 0) {
      weeks++;
    }
    
    return weeks;
  }

  render() {
    const body = this.element.querySelector('.ds-heatmap__body');
    if (!body) return;
    
    body.innerHTML = '';
    
    const weeks = [];
    let currentWeek = [];
    
    let firstDate = new Date(this.startDate);
    const firstDayOfWeek = firstDate.getDay();
    for (let i = 1; i < firstDayOfWeek; i++) {
      currentWeek.push(null);
    }
    
    for (let d = new Date(this.startDate); d <= this.endDate; d.setDate(d.getDate() + 1)) {
      currentWeek.push(new Date(d));
      if (d.getDay() === 6 || d.getTime() === this.endDate.getTime()) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }
    
    const weekCount = weeks.length;
    const cellWidth = this.element.classList.contains('ds-heatmap--compact') ? 12 : 16;
    const totalGridWidth = weekCount * cellWidth;
    
    const container = document.createElement('div');
    container.className = 'ds-heatmap__container';
    
    const labelsAndGrid = document.createElement('div');
    labelsAndGrid.className = 'ds-heatmap__labels-and-grid';
    
    const weekdayLabels = document.createElement('div');
    weekdayLabels.className = 'ds-heatmap__weekday-labels';
    const weekdayLabelHeight = this.element.classList.contains('ds-heatmap--compact') ? 12 : 16;
    this.getWeekdayLabels().forEach(label => {
      const el = document.createElement('div');
      el.className = 'ds-heatmap__weekday-label';
      el.textContent = label;
      el.style.height = weekdayLabelHeight + 'px';
      el.style.lineHeight = weekdayLabelHeight + 'px';
      weekdayLabels.appendChild(el);
    });
    labelsAndGrid.appendChild(weekdayLabels);
    
    const gridContainer = document.createElement('div');
    gridContainer.className = 'ds-heatmap__grid-container';
    
    const monthLabels = document.createElement('div');
    monthLabels.className = 'ds-heatmap__month-labels';
    monthLabels.style.width = totalGridWidth + 'px';
    
    const monthInfo = this.getMonthLabels();
    monthInfo.forEach((item, index) => {
      const el = document.createElement('div');
      el.className = 'ds-heatmap__month-label';
      el.textContent = item.label;
      
      const nextMonth = monthInfo[index + 1];
      let weekSpan;
      if (nextMonth) {
        weekSpan = Math.ceil((nextMonth.offset - item.offset) / 7);
      } else {
        weekSpan = weekCount - Math.floor(item.offset / 7);
      }
      
      el.style.width = (weekSpan * cellWidth) + 'px';
      monthLabels.appendChild(el);
    });
    gridContainer.appendChild(monthLabels);
    
    const grid = document.createElement('div');
    grid.className = 'ds-heatmap__grid';
    
    weeks.forEach((week) => {
      const weekColumn = document.createElement('div');
      weekColumn.className = 'ds-heatmap__week-column';
      
      week.forEach(date => {
        if (date === null) {
          const emptyCell = document.createElement('div');
          emptyCell.className = 'ds-heatmap__cell';
          emptyCell.style.visibility = 'hidden';
          weekColumn.appendChild(emptyCell);
        } else {
          const value = this.getDataByDate(date);
          const maxValue = Math.max(...this.data.map(d => d.value), 1);
          const level = this.getLevel(value, maxValue);
          
          const cell = document.createElement('div');
          cell.className = 'ds-heatmap__cell';
          cell.dataset.date = this.formatDate(date);
          cell.dataset.value = value;
          cell.style.backgroundColor = this.getCellColor(level);
          
          const mouseenterHandler = (e) => this.showTooltip(e, date, value);
          const mouseleaveHandler = () => this.hideTooltip();
          const clickHandler = () => {
            if (this.onCellClick) {
              this.onCellClick({ date: this.formatDate(date), value });
            }
          };
          
          cell.addEventListener('mouseenter', mouseenterHandler);
          cell.addEventListener('mouseleave', mouseleaveHandler);
          cell.addEventListener('click', clickHandler);
          
          this._listeners.push(
            { el: cell, event: 'mouseenter', handler: mouseenterHandler },
            { el: cell, event: 'mouseleave', handler: mouseleaveHandler },
            { el: cell, event: 'click', handler: clickHandler }
          );
          
          weekColumn.appendChild(cell);
        }
      });
      
      grid.appendChild(weekColumn);
    });
    
    gridContainer.appendChild(grid);
    labelsAndGrid.appendChild(gridContainer);
    container.appendChild(labelsAndGrid);
    
    body.appendChild(container);
    this.renderLegend(body);
  }

  renderLegend(parent) {
    const legend = document.createElement('div');
    legend.className = 'ds-heatmap__legend';
    
    const label = document.createElement('span');
    label.className = 'ds-heatmap__legend-label';
    label.textContent = '少';
    
    const cells = document.createElement('div');
    cells.className = 'ds-heatmap__legend-cells';
    
    for (let i = 0; i <= 5; i++) {
      const cell = document.createElement('div');
      cell.className = 'ds-heatmap__legend-cell';
      cell.style.backgroundColor = this.getCellColor(i);
      cells.appendChild(cell);
    }
    
    const label2 = document.createElement('span');
    label2.className = 'ds-heatmap__legend-label';
    label2.textContent = '多';
    
    legend.appendChild(label);
    legend.appendChild(cells);
    legend.appendChild(label2);
    parent.appendChild(legend);
  }

  createTooltip() {
    this.tooltip = document.createElement('div');
    this.tooltip.className = 'ds-heatmap__tooltip';
    document.body.appendChild(this.tooltip);
  }

  showTooltip(e, date, value) {
    const rect = e.target.getBoundingClientRect();
    const tooltipWidth = 150;
    
    this.tooltip.innerHTML = `
      <div class="ds-heatmap__tooltip-date">${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日</div>
      <div class="ds-heatmap__tooltip-value">${value} contributions</div>
    `;
    
    this.tooltip.style.left = Math.min(rect.left + rect.width / 2 - tooltipWidth / 2, window.innerWidth - tooltipWidth - 16) + 'px';
    this.tooltip.style.top = (rect.top - 50) + 'px';
    this.tooltip.classList.add('is-visible');
  }

  hideTooltip() {
    this.tooltip.classList.remove('is-visible');
  }

  updateData(data) {
    this._listeners.forEach(({ el, event, handler }) => {
      el.removeEventListener(event, handler);
    });
    this._listeners = [];
    this.data = data;
    this.render();
  }

  setDateRange(startDate, endDate) {
    this.startDate = startDate;
    this.endDate = endDate;
    this.render();
  }

  destroy() {
    this._listeners.forEach(({ el, event, handler }) => {
      el.removeEventListener(event, handler);
    });
    this._listeners = null;
    
    if (this.tooltip && this.tooltip.parentNode) {
      this.tooltip.parentNode.removeChild(this.tooltip);
    }
    this.tooltip = null;
    this.data = [];
    this.element = null;
  }
}

function initHeatmap(element) {
  if (element.__kupolaInitialized) return;

  const dataAttr = element.getAttribute('data-heatmap-data');
  let data = [];
  
  if (dataAttr) {
    try {
      data = JSON.parse(dataAttr);
    } catch (e) {
      data = generateMockHeatmapData();
    }
  } else {
    data = generateMockHeatmapData();
  }
  
  const instance = new Heatmap(element, {
    data: data,
    onCellClick: (info) => {
    }
  });
  
  element.__kupolaInstance = instance;
  element.__kupolaInitialized = true;
}

function cleanupHeatmap(element) {
  if (!element.__kupolaInitialized || !element.__kupolaInstance) return;

  const instance = element.__kupolaInstance;
  instance.destroy();

  element.__kupolaInstance = null;
  element.__kupolaInitialized = false;
}

function initHeatmaps() {
  document.querySelectorAll('.ds-heatmap').forEach(element => {
    initHeatmap(element);
  });
}

function generateMockHeatmapData() {
  const data = [];
  const today = new Date();
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  
  for (let d = new Date(oneYearAgo); d <= today; d.setDate(d.getDate() + 1)) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
    const baseValue = isWeekend ? Math.random() * 20 : Math.random() * 50;
    const value = Math.floor(baseValue);
    
    data.push({
      date: `${year}-${month}-${day}`,
      value: value > 0 ? value : Math.floor(Math.random() * 30) + 1
    });
  }
  
  return data;
}

function createHeatmap(selector, options = {}) {
  const element = document.querySelector(selector);
  if (element) {
    const data = options.data || generateMockHeatmapData();
    return new Heatmap(element, {
      data: data,
      ...options
    });
  }
  return null;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Heatmap, initHeatmaps, initHeatmap, cleanupHeatmap, createHeatmap, generateMockHeatmapData };
} else {
  window.Heatmap = Heatmap;
  window.initHeatmap = initHeatmap;
  window.cleanupHeatmap = cleanupHeatmap;
}

if (window.kupolaInitializer) {
  window.kupolaInitializer.register('heatmap', initHeatmap, cleanupHeatmap);
}