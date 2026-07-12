/**
 * KupolaPagination - Standalone pagination component
 * Works with useDeps or plain data
 */

import { ref } from './data-bind.js';

class KupolaPagination {
    constructor(element, options = {}) {
        this.element = typeof element === 'string' ? document.querySelector(element) : element;
        this.options = options;

        // State
        this._current = options.current || 1;
        this._total = options.total || 0;
        this._pageSize = options.pageSize || 10;
        this._maxPages = options.maxPages || 7;
        this._showTotal = options.showTotal !== false;
        this._showSizeChanger = options.showSizeChanger || false;
        this._pageSizes = options.pageSizes || [10, 20, 50, 100];
        this._simple = options.simple || false;

        // Refs for reactive integration
        this.current = ref(this._current);
        this.total = ref(this._total);

        // Callbacks
        this.onChange = options.onChange || null;
        this.onPageSizeChange = options.onPageSizeChange || null;

        this._init();
    }

    _init() {
        this.element.classList.add('kupola-pagination');
        this.render();
    }

    get totalPages() {
        return Math.max(1, Math.ceil(this._total / this._pageSize));
    }

    setCurrent(page) {
        page = Math.max(1, Math.min(page, this.totalPages));
        if (page === this._current) return;
        this._current = page;
        this.current.value = page;
        if (this.onChange) this.onChange(page, this._pageSize);
        this.render();
    }

    setTotal(total) {
        if (total && typeof total === 'object' && 'value' in total) {
            this._total = total.value || 0;
            total._subscribers?.add((val) => {
                this._total = val || 0;
                if (this._current > this.totalPages) {
                    this.setCurrent(this.totalPages);
                } else {
                    this.render();
                }
            });
        } else {
            this._total = total;
        }
        this.total.value = this._total;
        this.render();
    }

    setPageSize(size) {
        this._pageSize = size;
        this._current = 1;
        this.current.value = 1;
        if (this.onPageSizeChange) this.onPageSizeChange(size, this._current);
        this.render();
    }

    render() {
        const el = this.element;
        el.innerHTML = '';

        if (this._total <= 0) return;

        if (this._simple) {
            this._renderSimple(el);
        } else {
            this._renderFull(el);
        }
    }

    _renderSimple(el) {
        const total = this.totalPages;

        const prev = this._btn('‹', () => this.setCurrent(this._current - 1));
        prev.disabled = this._current <= 1;
        el.appendChild(prev);

        const info = document.createElement('span');
        info.className = 'kupola-pagination-simple-info';
        info.textContent = `${this._current} / ${total}`;
        el.appendChild(info);

        const next = this._btn('›', () => this.setCurrent(this._current + 1));
        next.disabled = this._current >= total;
        el.appendChild(next);
    }

    _renderFull(el) {
        const total = this.totalPages;

        // Total info
        if (this._showTotal) {
            const info = document.createElement('span');
            info.className = 'kupola-pagination-total';
            info.textContent = `共 ${this._total} 条`;
            el.appendChild(info);
        }

        // Size changer
        if (this._showSizeChanger) {
            const select = document.createElement('select');
            select.className = 'kupola-pagination-size';
            this._pageSizes.forEach(size => {
                const opt = document.createElement('option');
                opt.value = size;
                opt.textContent = `${size} 条/页`;
                if (size === this._pageSize) opt.selected = true;
                select.appendChild(opt);
            });
            select.addEventListener('change', () => this.setPageSize(parseInt(select.value)));
            el.appendChild(select);
        }

        // Page buttons container
        const pages = document.createElement('div');
        pages.className = 'kupola-pagination-pages';

        // Prev
        const prev = this._btn('‹', () => this.setCurrent(this._current - 1));
        prev.disabled = this._current <= 1;
        pages.appendChild(prev);

        // Page numbers
        this._getPageRange().forEach(p => {
            if (p === '...') {
                const span = document.createElement('span');
                span.className = 'kupola-pagination-ellipsis';
                span.textContent = '···';
                pages.appendChild(span);
            } else {
                const btn = this._btn(p, () => this.setCurrent(p));
                if (p === this._current) btn.classList.add('active');
                pages.appendChild(btn);
            }
        });

        // Next
        const next = this._btn('›', () => this.setCurrent(this._current + 1));
        next.disabled = this._current >= total;
        pages.appendChild(next);

        el.appendChild(pages);

        // Jumper
        if (total > 10) {
            const jumper = document.createElement('span');
            jumper.className = 'kupola-pagination-jumper';
            jumper.innerHTML = '跳至 <input type="number" min="1" max="' + total + '" value="' + this._current + '"> 页';
            const input = jumper.querySelector('input');
            input.addEventListener('change', () => {
                const page = parseInt(input.value);
                if (page >= 1 && page <= total) {
                    this.setCurrent(page);
                }
            });
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    const page = parseInt(input.value);
                    if (page >= 1 && page <= total) {
                        this.setCurrent(page);
                    }
                }
            });
            el.appendChild(jumper);
        }
    }

    _btn(text, onClick) {
        const btn = document.createElement('button');
        btn.className = 'kupola-pagination-btn';
        btn.textContent = text;
        btn.type = 'button';
        btn.addEventListener('click', onClick);
        return btn;
    }

    _getPageRange() {
        const total = this.totalPages;
        const max = this._maxPages;

        if (total <= max) {
            return Array.from({ length: total }, (_, i) => i + 1);
        }

        const range = [];
        const half = Math.floor(max / 2);

        if (this._current <= half + 1) {
            for (let i = 1; i <= max - 2; i++) range.push(i);
            range.push('...', total);
        } else if (this._current >= total - half) {
            range.push(1, '...');
            for (let i = total - max + 3; i <= total; i++) range.push(i);
        } else {
            range.push(1, '...');
            for (let i = this._current - half + 2; i <= this._current + half - 2; i++) range.push(i);
            range.push('...', total);
        }

        return range;
    }

    destroy() {
        this.element.innerHTML = '';
        this.element.classList.remove('kupola-pagination');
    }
}

// CSS styles
let stylesInjected = false;
function injectPaginationStyles() {
    if (stylesInjected || typeof document === 'undefined') return;
    const style = document.createElement('style');
    style.textContent = `
        .kupola-pagination { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
        .kupola-pagination-pages { display: flex; gap: 4px; align-items: center; }
        .kupola-pagination-btn { min-width: 32px; height: 32px; border: 1px solid #d9d9d9; border-radius: 4px; background: #fff; cursor: pointer; font-size: 14px; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
        .kupola-pagination-btn:hover:not(:disabled):not(.active) { border-color: #1890ff; color: #1890ff; }
        .kupola-pagination-btn.active { background: #1890ff; color: #fff; border-color: #1890ff; }
        .kupola-pagination-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .kupola-pagination-ellipsis { padding: 0 4px; color: #999; user-select: none; }
        .kupola-pagination-total { color: #666; font-size: 14px; }
        .kupola-pagination-size { padding: 4px 8px; border: 1px solid #d9d9d9; border-radius: 4px; font-size: 13px; }
        .kupola-pagination-simple-info { padding: 0 8px; font-size: 14px; color: #333; }
        .kupola-pagination-jumper { font-size: 14px; color: #666; }
        .kupola-pagination-jumper input { width: 50px; height: 28px; margin: 0 4px; padding: 0 8px; border: 1px solid #d9d9d9; border-radius: 4px; text-align: center; font-size: 13px; }
        .kupola-pagination-jumper input:focus { outline: none; border-color: #1890ff; }
    `;
    document.head.appendChild(style);
    stylesInjected = true;
}

function initPagination(element, options) {
    injectPaginationStyles();
    return new KupolaPagination(element, options);
}

export { KupolaPagination, initPagination };
