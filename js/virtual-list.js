import { kupolaInitializer } from './initializer.js';

class VirtualList {
  constructor(element, options = {}) {
    this.element = element;
    this.data = options.data || [];
    this.itemHeight = options.itemHeight || 48;
    this.itemWidth = options.itemWidth || 200;
    this.bufferSize = options.bufferSize || 5;
    this.renderItem = options.renderItem || this.defaultRenderItem;
    this.onItemClick = options.onItemClick || null;
    this.onItemSelect = options.onItemSelect || null;
    this.onScroll = options.onScroll || null;
    this.onScrollEnd = options.onScrollEnd || null;
    this.selectedKey = options.selectedKey || null;
    this.keyField = options.keyField || 'id';
    this.useDynamicHeight = options.useDynamicHeight || false;
    this.dynamicHeightCache = new Map();
    this.estimatedHeight = options.estimatedHeight || 48;
    
    this.container = null;
    this.scrollbarTrack = null;
    this.scrollbarThumb = null;
    this.totalHeight = 0;
    this.startIndex = 0;
    this.endIndex = 0;
    this.isScrolling = false;
    this.scrollTimeout = null;
    this.lastScrollTop = 0;
    this.lastScrollLeft = 0;
    
    this.init();
  }

  defaultRenderItem(item, index) {
    return `
      <div class="ds-virtual-list__item-content">
        <div class="ds-virtual-list__item-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
        </div>
        <div>
          <div class="ds-virtual-list__item-title">${item.title || item.name || `Item ${index + 1}`}</div>
          <div class="ds-virtual-list__item-subtitle">${item.subtitle || 'Subtitle'}</div>
        </div>
      </div>
    `;
  }

  init() {
    this.createStructure();
    this.update();
    this.bindEvents();
  }

  createStructure() {
    this.element.innerHTML = `
      <div class="ds-virtual-list__scrollbar">
        <div class="ds-virtual-list__scrollbar-track">
          <div class="ds-virtual-list__scrollbar-thumb"></div>
        </div>
      </div>
      <div class="ds-virtual-list__container"></div>
    `;
    
    this.container = this.element.querySelector('.ds-virtual-list__container');
    this.scrollbarThumb = this.element.querySelector('.ds-virtual-list__scrollbar-thumb');
  }

  bindEvents() {
    this._scrollHandler = (e) => this.handleScroll(e);
    this._thumbDragStartHandler = (e) => this.handleThumbDragStart(e);
    this._thumbDragMoveHandler = (e) => this.handleThumbDragMove(e);
    this._thumbDragEndHandler = () => this.handleThumbDragEnd();
    this._wheelHandler = (e) => {
      e.preventDefault();
      
      const isHorizontal = this.element.classList.contains('ds-virtual-list--horizontal');
      
      if (isHorizontal) {
        this.element.scrollLeft += e.deltaX + e.deltaY;
      } else {
        this.element.scrollTop += e.deltaY + e.deltaX;
      }
    };
    
    this.element.addEventListener('scroll', this._scrollHandler);
    this.scrollbarThumb.addEventListener('mousedown', this._thumbDragStartHandler);
    
    document.addEventListener('mousemove', this._thumbDragMoveHandler);
    document.addEventListener('mouseup', this._thumbDragEndHandler);
    
    this.element.addEventListener('wheel', this._wheelHandler, { passive: false });
    
    this._listeners = [
      { el: this.element, event: 'scroll', handler: this._scrollHandler },
      { el: this.scrollbarThumb, event: 'mousedown', handler: this._thumbDragStartHandler },
      { el: document, event: 'mousemove', handler: this._thumbDragMoveHandler },
      { el: document, event: 'mouseup', handler: this._thumbDragEndHandler },
      { el: this.element, event: 'wheel', handler: this._wheelHandler }
    ];
  }

  handleScroll(e) {
    const isHorizontal = this.element.classList.contains('ds-virtual-list--horizontal');
    const scrollOffset = isHorizontal ? this.element.scrollLeft : this.element.scrollTop;
    
    if (this.onScroll) {
      this.onScroll({ 
        scrollOffset, 
        isHorizontal,
        dataLength: this.data.length,
        startIndex: this.startIndex,
        endIndex: this.endIndex
      });
    }
    
    this.updateScrollState();
    this.renderVisibleItems();
    this.updateScrollbar();
  }

  updateScrollState() {
    this.isScrolling = true;
    this.element.classList.add('ds-virtual-list--scrolling');
    
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }
    
    this.scrollTimeout = setTimeout(() => {
      this.isScrolling = false;
      this.element.classList.remove('ds-virtual-list--scrolling');
      
      if (this.onScrollEnd) {
        const isHorizontal = this.element.classList.contains('ds-virtual-list--horizontal');
        const scrollOffset = isHorizontal ? this.element.scrollLeft : this.element.scrollTop;
        this.onScrollEnd({ 
          scrollOffset, 
          isHorizontal,
          dataLength: this.data.length,
          startIndex: this.startIndex,
          endIndex: this.endIndex
        });
      }
    }, 200);
  }

  getItemSize(index) {
    const isHorizontal = this.element.classList.contains('ds-virtual-list--horizontal');
    
    if (this.useDynamicHeight) {
      const key = this.data[index][this.keyField] || index;
      if (this.dynamicHeightCache.has(key)) {
        return this.dynamicHeightCache.get(key);
      }
    }
    
    return isHorizontal ? this.itemWidth : this.itemHeight;
  }

  getItemPositions() {
    const positions = [];
    let currentPosition = 0;
    
    this.data.forEach((item, index) => {
      const size = this.getItemSize(index);
      positions.push({
        start: currentPosition,
        end: currentPosition + size,
        size
      });
      currentPosition += size;
    });
    
    return positions;
  }

  getTotalSize() {
    if (this.useDynamicHeight) {
      return this.data.reduce((total, item, index) => {
        return total + this.getItemSize(index);
      }, 0);
    }
    
    const isHorizontal = this.element.classList.contains('ds-virtual-list--horizontal');
    const itemSize = isHorizontal ? this.itemWidth : this.itemHeight;
    return this.data.length * itemSize;
  }

  getIndexAtOffset(offset) {
    if (this.useDynamicHeight) {
      const positions = this.getItemPositions();
      for (let i = 0; i < positions.length; i++) {
        if (offset >= positions[i].start && offset < positions[i].end) {
          return i;
        }
      }
      return this.data.length - 1;
    }
    
    const isHorizontal = this.element.classList.contains('ds-virtual-list--horizontal');
    const itemSize = isHorizontal ? this.itemWidth : this.itemHeight;
    return Math.floor(offset / itemSize);
  }

  renderVisibleItems() {
    const isHorizontal = this.element.classList.contains('ds-virtual-list--horizontal');
    const scrollOffset = isHorizontal ? this.element.scrollLeft : this.element.scrollTop;
    const viewportSize = isHorizontal ? this.element.clientWidth : this.element.clientHeight;
    
    const startIndex = Math.max(0, this.getIndexAtOffset(scrollOffset) - this.bufferSize);
    let endIndex = Math.min(
      this.data.length - 1,
      this.getIndexAtOffset(scrollOffset + viewportSize) + this.bufferSize
    );
    
    if (endIndex < startIndex) endIndex = startIndex;
    
    this.startIndex = startIndex;
    this.endIndex = endIndex;
    
    const visibleData = this.data.slice(startIndex, endIndex + 1);
    
    let html = '';
    let currentPosition = 0;
    
    if (this.useDynamicHeight) {
      const positions = this.getItemPositions();
      currentPosition = positions[startIndex]?.start || 0;
    } else {
      const itemSize = isHorizontal ? this.itemWidth : this.itemHeight;
      currentPosition = startIndex * itemSize;
    }
    
    visibleData.forEach((item, i) => {
      const actualIndex = startIndex + i;
      const key = item[this.keyField] || actualIndex;
      const isSelected = this.selectedKey === key;
      const itemSize = this.getItemSize(actualIndex);
      html += this._buildItemHtml(item, actualIndex, key, isSelected, itemSize, currentPosition, isHorizontal);
      currentPosition += itemSize;
    });
    
    this.container.innerHTML = html;
    
    if (this.useDynamicHeight) {
      this.updateDynamicHeights();
    }
    
    this.container.querySelectorAll('.ds-virtual-list__item').forEach(item => {
      item.addEventListener('click', () => this.handleItemClick(item));
    });
  }

  _buildItemHtml(item, index, key, isSelected, size, position, isHorizontal) {
    const selectedClass = isSelected ? ' is-selected' : '';
    const content = this.renderItem(item, index);
    if (isHorizontal) {
      return `<div class="ds-virtual-list__item${selectedClass}" style="position: absolute; top: 0; left: ${position}px; width: ${size}px; height: 100%;" data-index="${index}" data-key="${key}">${content}</div>`;
    }
    return `<div class="ds-virtual-list__item${selectedClass}" style="position: absolute; top: ${position}px; left: 0; right: 0; height: ${size}px;" data-index="${index}" data-key="${key}">${content}</div>`;
  }

  updateDynamicHeights() {
    if (this.isUpdating) return;
    
    let hasChanges = false;
    this.container.querySelectorAll('.ds-virtual-list__item').forEach(item => {
      const index = parseInt(item.dataset.index);
      const key = this.data[index][this.keyField] || index;
      const actualHeight = item.offsetHeight;
      
      if (actualHeight !== this.getItemSize(index)) {
        this.dynamicHeightCache.set(key, actualHeight);
        hasChanges = true;
      }
    });
    
    if (hasChanges) {
      this.isUpdating = true;
      this.update();
      this.isUpdating = false;
    }
  }

  handleItemClick(item) {
    const index = parseInt(item.dataset.index);
    const key = item.dataset.key;
    const dataItem = this.data[index];
    
    if (this.onItemClick) {
      this.onItemClick({ item: dataItem, index, key });
    }
    
    if (this.onItemSelect) {
      this.select(key);
    }
  }

  select(key) {
    this.selectedKey = key;
    
    if (this.onItemSelect) {
      const index = this.data.findIndex(item => item[this.keyField] === key);
      if (index !== -1) {
        this.onItemSelect({ item: this.data[index], index, key });
      }
    }
    
    this.renderVisibleItems();
  }

  updateScrollbar() {
    const isHorizontal = this.element.classList.contains('ds-virtual-list--horizontal');
    const totalSize = this.getTotalSize();
    const viewportSize = isHorizontal ? this.element.clientWidth : this.element.clientHeight;
    const scrollOffset = isHorizontal ? this.element.scrollLeft : this.element.scrollTop;
    
    if (isHorizontal) {
      this.scrollbarThumb.style.display = 'none';
      return;
    }
    
    const thumbHeight = Math.max(20, (viewportSize / totalSize) * viewportSize);
    const maxTop = viewportSize - thumbHeight;
    const thumbTop = (scrollOffset / (totalSize - viewportSize || 1)) * maxTop;
    
    this.scrollbarThumb.style.height = thumbHeight + 'px';
    this.scrollbarThumb.style.top = thumbTop + 'px';
  }

  handleThumbDragStart(e) {
    e.preventDefault();
    this.isDragging = true;
    this.dragStartY = e.clientY;
    this.dragStartTop = parseFloat(this.scrollbarThumb.style.top) || 0;
  }

  handleThumbDragMove(e) {
    if (!this.isDragging) return;
    
    const viewportHeight = this.element.clientHeight;
    const totalHeight = this.getTotalSize();
    const thumbHeight = parseFloat(this.scrollbarThumb.style.height) || viewportHeight;
    const maxTop = viewportHeight - thumbHeight;
    
    const deltaY = e.clientY - this.dragStartY;
    let newTop = this.dragStartTop + deltaY;
    newTop = Math.max(0, Math.min(newTop, maxTop));
    
    this.scrollbarThumb.style.top = newTop + 'px';
    
    const scrollTop = (newTop / maxTop) * (totalHeight - viewportHeight || 0);
    this.element.scrollTop = scrollTop;
  }

  handleThumbDragEnd() {
    this.isDragging = false;
  }

  update() {
    const isHorizontal = this.element.classList.contains('ds-virtual-list--horizontal');
    const totalSize = this.getTotalSize();
    
    if (isHorizontal) {
      this.container.style.width = totalSize + 'px';
      this.container.style.height = '100%';
    } else {
      this.container.style.height = totalSize + 'px';
      this.container.style.width = '100%';
    }
    
    this.renderVisibleItems();
    this.updateScrollbar();
  }

  setData(data) {
    this.data = data;
    if (this.useDynamicHeight) {
      this.dynamicHeightCache.clear();
    }
    this.update();
  }

  addItem(item) {
    this.data.push(item);
    this.update();
  }

  removeItem(index) {
    this.data.splice(index, 1);
    if (this.useDynamicHeight) {
      this.dynamicHeightCache.clear();
    }
    this.update();
  }

  insertItem(index, item) {
    this.data.splice(index, 0, item);
    if (this.useDynamicHeight) {
      this.dynamicHeightCache.clear();
    }
    this.update();
  }

  scrollTo(index, behavior = 'smooth') {
    const isHorizontal = this.element.classList.contains('ds-virtual-list--horizontal');
    
    let scrollOffset = 0;
    if (this.useDynamicHeight) {
      const positions = this.getItemPositions();
      scrollOffset = positions[index]?.start || 0;
    } else {
      const itemSize = isHorizontal ? this.itemWidth : this.itemHeight;
      scrollOffset = index * itemSize;
    }
    
    if (isHorizontal) {
      this.element.scrollTo({ left: scrollOffset, behavior });
    } else {
      this.element.scrollTo({ top: scrollOffset, behavior });
    }
  }

  scrollToKey(key, behavior = 'smooth') {
    const index = this.data.findIndex(item => item[this.keyField] === key);
    if (index !== -1) {
      this.scrollTo(index, behavior);
    }
  }

  scrollToTop(behavior = 'smooth') {
    const isHorizontal = this.element.classList.contains('ds-virtual-list--horizontal');
    this.element.scrollTo({ [isHorizontal ? 'left' : 'top']: 0, behavior });
  }

  scrollToBottom(behavior = 'smooth') {
    const isHorizontal = this.element.classList.contains('ds-virtual-list--horizontal');
    const totalSize = this.getTotalSize();
    const viewportSize = isHorizontal ? this.element.clientWidth : this.element.clientHeight;
    this.element.scrollTo({ [isHorizontal ? 'left' : 'top']: totalSize - viewportSize, behavior });
  }

  getVisibleItems() {
    return this.data.slice(this.startIndex, this.endIndex + 1).map((item, i) => ({
      item,
      index: this.startIndex + i,
      key: item[this.keyField] || this.startIndex + i
    }));
  }

  getItemIndex(key) {
    return this.data.findIndex(item => item[this.keyField] === key);
  }

  getItem(key) {
    const index = this.getItemIndex(key);
    return index !== -1 ? this.data[index] : null;
  }

  refreshCache() {
    this.dynamicHeightCache.clear();
    this.update();
  }

  destroy() {
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }
    
    this._listeners?.forEach(({ el, event, handler }) => {
      el.removeEventListener(event, handler);
    });
    
    this.data = [];
    this.dynamicHeightCache.clear();
    this.container.innerHTML = '';
    
    this._listeners = null;
    this._scrollHandler = null;
    this._thumbDragStartHandler = null;
    this._thumbDragMoveHandler = null;
    this._thumbDragEndHandler = null;
    this._wheelHandler = null;
    this.container = null;
    this.scrollbarThumb = null;
    this.element = null;
  }
}

function generateMockVirtualListData(count = 1000) {
  const data = [];
  const titles = ['Document', 'Image', 'Video', 'Folder', 'Archive', 'Spreadsheet', 'Presentation', 'Code'];
  
  for (let i = 1; i <= count; i++) {
    const titleIndex = Math.floor(Math.random() * titles.length);
    const randomNum = Math.floor(Math.random() * 10000);
    
    data.push({
      id: i,
      title: `${titles[titleIndex]} ${randomNum}`,
      subtitle: `Last modified ${Math.floor(Math.random() * 30)} days ago`,
      type: titles[titleIndex].toLowerCase()
    });
  }
  
  return data;
}

function createVirtualList(selector, options = {}) {
  const element = document.querySelector(selector);
  if (element) {
    const data = options.data || generateMockVirtualListData(options.count || 1000);
    return new VirtualList(element, {
      data: data,
      ...options
    });
  }
  return null;
}

function initVirtualList(element) {
  if (element.__kupolaInitialized) return;

  const dataAttr = element.getAttribute('data-virtual-list');
  let data = [];
  
  if (dataAttr) {
    try {
      data = JSON.parse(dataAttr);
    } catch (e) {
      data = generateMockVirtualListData(1000);
    }
  } else {
    data = generateMockVirtualListData(1000);
  }
  
  const instance = new VirtualList(element, {
    data: data,
    onItemClick: (info) => {},
    onItemSelect: (info) => {}
  });
  
  element.__kupolaInstance = instance;
  element.__kupolaInitialized = true;
}

function cleanupVirtualList(element) {
  if (!element.__kupolaInitialized || !element.__kupolaInstance) return;

  const instance = element.__kupolaInstance;
  instance.destroy();

  element.__kupolaInstance = null;
  element.__kupolaInitialized = false;
}

function initVirtualLists() {
  document.querySelectorAll('.ds-virtual-list').forEach(element => {
    initVirtualList(element);
  });
}

export { VirtualList, initVirtualLists, initVirtualList, cleanupVirtualList, createVirtualList, generateMockVirtualListData };

kupolaInitializer.register('virtual-list', initVirtualList, cleanupVirtualList);