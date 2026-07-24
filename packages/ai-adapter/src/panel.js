// SPDX-License-Identifier: MIT
/**
 * @kupola/ai-adapter — AIPanel
 *
 * A full-featured AI conversation panel built with Kupola native components.
 *
 * Features:
 * - Drawer or floating panel container (closable)
 * - Message list with three styles: user / system / suggestion
 * - Input area with send button
 * - Quick action buttons rendered from system suggestions
 * - Progress bar for batch action operations
 * - Timeline for flow execution steps
 * - JSON pretty-print for query results
 *
 * Usage:
 *   import { AIAdapter } from '@kupola/ai-adapter';
 *   import { AIPanel } from '@kupola/ai-adapter/panel';
 *
 *   const adapter = new AIAdapter({ ... });
 *   const panel = new AIPanel(adapter, { title: 'AI Assistant' });
 *   panel.mount(document.body);
 *   panel.open();
 */

import { signal, effect } from '@kupola/core';

export class AIPanel {
  /**
   * @param {import('./ai-adapter.js').AIAdapter} adapter
   * @param {object} [options]
   * @param {string} [options.title]        — panel title (default: 'AI Assistant')
   * @param {string} [options.layout]       — 'drawer' | 'floating' (default: 'drawer')
   * @param {string} [options.width]        — panel width (default: '520px')
   * @param {string} [options.height]       — messages area max-height (default: '400px')
   * @param {string} [options.placeholder]  — input placeholder text
   * @param {boolean} [options.showTimestamp] — show timestamps on messages
   * @param {object|Function} [options.context] — process context or async input => context
   */
  constructor(adapter, options = {}) {
    this.adapter = adapter;
    this.options = {
      title: 'AI Assistant',
      layout: 'drawer',
      width: '520px',
      height: '400px',
      placeholder: '输入指令... (查询/添加/执行)',
      showTimestamp: false,
      resultViewer: true,
      resultPageSize: 20,
      maxTableColumns: 12,
      context: {},
      ...options,
    };

    this._container = null;
    this._messagesEl = null;
    this._inputEl = null;
    this._progressEl = null;
    this._timelineEl = null;
    this._unsubscribers = [];
    this._isOpen = signal(false);
    this._messages = signal([]);
    this._resultViewerEl = null;
    this._currentResultView = null;
    this._resultKeydownHandler = (e) => {
      if (e.key === 'Escape') this._closeResultViewer();
    };
  }

  /**
   * Mount the panel into a DOM container.
   * @param {HTMLElement} parent
   */
  mount(parent) {
    if (this._container) this.destroy();

    const isFloating = this.options.layout === 'floating';
    this._container = document.createElement('div');
    this._container.className = isFloating
      ? 'ds-ai-panel ds-ai-panel--floating'
      : 'ds-ai-panel ds-ai-panel--drawer ds-drawer ds-drawer--right';
    if (this.options.width) {
      this._container.style.width = this.options.width;
    }
    this._container.style.display = 'none';
    this._container.innerHTML = this._buildHTML();

    this._messagesEl = this._container.querySelector('.ds-ai-messages');
    this._inputEl = this._container.querySelector('.ds-ai-input');
    this._sendBtn = this._container.querySelector('.ds-ai-send-btn');
    this._progressEl = this._container.querySelector('.ds-ai-progress');
    this._timelineEl = this._container.querySelector('.ds-ai-timeline');
    this._headerCloseBtn = this._container.querySelector('.ds-ai-close-btn');
    this._headerMinBtn = this._container.querySelector('.ds-ai-min-btn');

    this._sendBtn.addEventListener('click', () => this._handleSend());
    this._inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this._handleSend();
      }
    });
    this._headerCloseBtn.addEventListener('click', () => this.close());
    this._headerMinBtn.addEventListener('click', () => this._toggleMinimize());

    parent.appendChild(this._container);

    this._subscribeEvents();

    this._messages.value = this.adapter.getMessages().map(m => ({
      role: m.role,
      text: m.text,
      actions: null,
    }));

    effect(() => {
      this._renderMessages();
    });

    effect(() => {
      if (!this._container) return;
      const isOpen = this._isOpen.value;
      this._container.style.display = isOpen ? 'flex' : 'none';
      if (isOpen) {
        this._container.classList.add('is-visible');
        this._scrollToBottom();
        this._inputEl.focus();
      } else {
        this._container.classList.remove('is-visible');
      }
    });

    return this;
  }

  /** Show the panel. */
  open() {
    this._isOpen.value = true;
    if (!this._container) return;
    this._container.style.display = 'flex';
    this._container.classList.add('is-visible');
    this._scrollToBottom();
    if (this._inputEl) {this._inputEl.focus();}
  }

  /** Hide the panel. */
  close() {
    this._isOpen.value = false;
    if (!this._container) return;
    this._container.style.display = 'none';
    this._container.classList.remove('is-visible');
  }

  /** Toggle visibility. */
  toggle() {
    if (this._isOpen.value) {
      this.close();
    } else {
      this.open();
    }
  }

  /** Destroy the panel and clean up listeners. */
  destroy() {
    this._unsubscribers.forEach(fn => fn());
    this._unsubscribers = [];
    this._destroyResultViewer();
    if (this._container && this._container.parentNode) {
      this._container.parentNode.removeChild(this._container);
    }
    this._container = null;
    this._messagesEl = null;
    this._inputEl = null;
    this._isOpen.value = false;
  }

  /** Programmatically add a message to the panel. */
  addMessage(role, text, actions = null) {
    this._messages.value = [...this._messages.value, { role, text, actions }];
    this._renderMessages();
  }

  // ── Private ────────────────────────────────────────────

  _buildHTML() {
    const { title, height, placeholder } = this.options;
    return `
      <div class="ds-ai-header">
        <span class="ds-ai-title">${_esc(title)}</span>
        <div class="ds-ai-header-actions">
          <button class="ds-ai-min-btn" title="最小化">─</button>
          <button class="ds-ai-close-btn" title="关闭">✕</button>
        </div>
      </div>
      <div class="ds-ai-messages" style="max-height:${height};">
      </div>
      <div class="ds-ai-progress">
        <div class="ds-ai-progress-bar"><div class="ds-ai-progress-fill"></div></div>
        <span class="ds-ai-progress-text"></span>
      </div>
      <div class="ds-ai-timeline">
      </div>
      <div class="ds-ai-input-area">
        <input class="ds-ai-input" type="text" placeholder="${_esc(placeholder)}" />
        <button class="ds-ai-send-btn">
          发送
        </button>
      </div>
    `;
  }

  _subscribeEvents() {
    const bus = this.adapter.bus;

    const unsubResult = bus.on('result', ({ command, result }) => {
      const msg = this.adapter.getMessages().pop();
      if (msg) {
        this._messages.value = [...this._messages.value, {
          role: msg.role,
          text: msg.text,
          actions: this._buildResultActions(command, result),
        }];
      }

      if (result && result.suggestion && result.suggestion.suggest) {
        this._messages.value = [...this._messages.value, {
          role: 'suggestion',
          text: result.suggestion.message,
          actions: [
            { label: '创建流程', action: () => this._handleSend(`创建流程 ${command.type}`) },
            { label: '忽略', action: () => {} },
          ],
        }];
      }
    });

    const unsubFlowStep = bus.on('flow:step', ({ step, label, status }) => {
      this._updateTimeline(step, label, status);
    });

    const unsubFlowComplete = bus.on('flow:complete', () => {
      setTimeout(() => { this._timelineEl.classList.remove('is-visible'); }, 3000);
    });

    this._unsubscribers.push(unsubResult, unsubFlowStep, unsubFlowComplete);
  }

  _renderMessages() {
    if (!this._messagesEl) return;

    this._messagesEl.innerHTML = '';
    for (const msg of this._messages.value) {
      const div = document.createElement('div');
      div.className = `ds-ai-msg ds-ai-msg-${msg.role}`;
      div.innerHTML = _renderText(msg.text);

      if (this.options.showTimestamp) {
        const ts = document.createElement('span');
        ts.className = 'ds-ai-ts';
        ts.textContent = new Date().toLocaleTimeString();
        div.appendChild(ts);
      }

      if (msg.actions && msg.actions.length > 0) {
        const btnGroup = document.createElement('div');
        btnGroup.className = 'ds-ai-actions';
        for (const act of msg.actions) {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.textContent = act.label;
          btn.addEventListener('click', () => act.action());
          btnGroup.appendChild(btn);
        }
        div.appendChild(btnGroup);
      }

      this._messagesEl.appendChild(div);
    }
    this._scrollToBottom();
  }

  async _handleSend(overrideInput) {
    const input = overrideInput || this._inputEl.value.trim();
    if (!input) return;

    this._inputEl.value = '';
    this._messages.value = [...this._messages.value, { role: 'user', text: input, actions: null }];

    try {
      const context = await this._resolveContext(input);
      const result = await this.adapter.process(input, context);

      if (result.result && result.result.total) {
        this._showProgress(result.result);
      }
    } catch (err) {
      this._messages.value = [...this._messages.value, {
        role: 'system',
        text: `❌ Error: ${err.message}`,
        actions: null,
      }];
    }
  }

  _buildResultActions(command, result) {
    if (!this.options.resultViewer || command?.engine !== 'query' || !this._hasViewableResult(result)) {
      return null;
    }

    return [
      { label: '查看数据', action: () => this._openResultViewer(command, result) },
      { label: '复制 JSON', action: () => this._copyResultJSON(result) },
      { label: '导出 CSV', action: () => this._downloadResultCSV(command, result) },
    ];
  }

  _hasViewableResult(result) {
    const rows = this._getResultRows(result);
    return result?.success && rows.length > 0;
  }

  _openResultViewer(command, result) {
    const rows = this._getResultRows(result);
    const columns = this._getResultColumns(result, rows);
    const title = this._formatResultTitle(command, rows);

    this._currentResultView = {
      command,
      result,
      rows,
      columns,
      title,
      tab: 'table',
      page: 1,
    };

    this._ensureResultViewer();
    this._renderResultViewer();
  }

  _ensureResultViewer() {
    if (this._resultViewerEl) return;

    this._resultViewerEl = document.createElement('div');
    this._resultViewerEl.className = 'ds-ai-result-viewer';
    document.body.appendChild(this._resultViewerEl);
    document.addEventListener('keydown', this._resultKeydownHandler);
  }

  _renderResultViewer() {
    if (!this._resultViewerEl || !this._currentResultView) return;

    const view = this._currentResultView;
    const pageSize = Math.max(1, this.options.resultPageSize || 20);
    const totalPages = Math.max(1, Math.ceil(view.rows.length / pageSize));
    view.page = Math.min(Math.max(1, view.page || 1), totalPages);

    this._resultViewerEl.innerHTML = this._buildResultViewerHTML(view, pageSize, totalPages);
    this._resultViewerEl.classList.add('is-open');
    this._bindResultViewerEvents();
  }

  _buildResultViewerHTML(view, pageSize, totalPages) {
    const pageStart = (view.page - 1) * pageSize;
    const pageRows = view.rows.slice(pageStart, pageStart + pageSize);
    const subtitle = `${view.rows.length} 条记录 · ${new Date().toLocaleString()}`;
    const tableTab = view.tab === 'table' ? 'active' : '';
    const jsonTab = view.tab === 'json' ? 'active' : '';

    return `
      <div class="ds-ai-result-backdrop" data-ds-ai-result-action="close"></div>
      <div class="ds-ai-result-dialog" role="dialog" aria-modal="true" aria-label="${_esc(view.title)}">
        <div class="ds-ai-result-header">
          <div class="ds-ai-result-heading">
            <div class="ds-ai-result-title">${_esc(view.title)}</div>
            <div class="ds-ai-result-subtitle">${_esc(subtitle)}</div>
          </div>
          <button class="ds-ai-result-close" type="button" data-ds-ai-result-action="close">×</button>
        </div>

        <div class="ds-ai-result-toolbar">
          <div class="ds-ai-result-tabs">
            ${this._renderTabButton('table', '表格', tableTab)}
            ${this._renderTabButton('json', 'JSON', jsonTab)}
          </div>
          <div class="ds-ai-result-tools">
            ${this._renderToolbarButton('copy', '复制 JSON')}
            ${this._renderToolbarButton('csv', '导出 CSV')}
          </div>
        </div>

        <div class="ds-ai-result-body">
          ${view.tab === 'json' ? this._renderJSONView(view.result.data) : this._renderTableView(view.columns, pageRows)}
        </div>

        <div class="ds-ai-result-footer">
          <span>第 ${view.page} / ${totalPages} 页 · 每页 ${pageSize} 条</span>
          <div class="ds-ai-result-pager">
            <button class="ds-ai-result-btn" type="button" data-ds-ai-result-action="prev" ${view.page <= 1 ? 'disabled' : ''}>上一页</button>
            <button class="ds-ai-result-btn" type="button" data-ds-ai-result-action="next" ${view.page >= totalPages ? 'disabled' : ''}>下一页</button>
          </div>
        </div>
      </div>
    `;
  }

  _renderTabButton(tab, label, active) {
    const selected = active === 'active';
    return `
      <button class="ds-ai-result-btn${selected ? ' is-active' : ''}" type="button" data-ds-ai-result-tab="${_esc(tab)}">${_esc(label)}</button>
    `;
  }

  _renderToolbarButton(action, label) {
    return `<button class="ds-ai-result-btn" type="button" data-ds-ai-result-action="${_esc(action)}">${_esc(label)}</button>`;
  }

  _renderTableView(columns, rows) {
    if (!rows.length) {
      return '<div class="ds-ai-result-empty">没有可显示的数据</div>';
    }

    return `
      <div class="ds-ai-result-table-wrap">
        <table class="ds-ai-result-table">
          <thead>
            <tr>
              ${columns.map(col => `<th>${_esc(col.title || col.field)}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${rows.map(row => `
              <tr>
                ${columns.map(col => `<td title="${_esc(this._formatCellValue(row[col.field]))}">${_esc(this._formatCellValue(row[col.field]))}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  _renderJSONView(data) {
    return `
      <pre class="ds-ai-result-json">${_esc(JSON.stringify(data, null, 2))}</pre>
    `;
  }

  _bindResultViewerEvents() {
    this._resultViewerEl.querySelectorAll('[data-ds-ai-result-action]').forEach(el => {
      el.addEventListener('click', (e) => {
        const action = e.currentTarget.dataset.dsAiResultAction;
        if (action === 'close') this._closeResultViewer();
        if (action === 'copy') this._copyResultJSON(this._currentResultView.result);
        if (action === 'csv') this._downloadResultCSV(this._currentResultView.command, this._currentResultView.result);
        if (action === 'prev') this._changeResultPage(-1);
        if (action === 'next') this._changeResultPage(1);
      });
    });

    this._resultViewerEl.querySelectorAll('[data-ds-ai-result-tab]').forEach(el => {
      el.addEventListener('click', (e) => {
        this._currentResultView.tab = e.currentTarget.dataset.dsAiResultTab;
        this._renderResultViewer();
      });
    });
  }

  _changeResultPage(delta) {
    if (!this._currentResultView) return;
    this._currentResultView.page += delta;
    this._renderResultViewer();
  }

  _closeResultViewer() {
    if (this._resultViewerEl) {
      this._resultViewerEl.classList.remove('is-open');
    }
  }

  _destroyResultViewer() {
    if (this._resultViewerEl && this._resultViewerEl.parentNode) {
      this._resultViewerEl.parentNode.removeChild(this._resultViewerEl);
    }
    document.removeEventListener('keydown', this._resultKeydownHandler);
    this._resultViewerEl = null;
    this._currentResultView = null;
  }

  _getResultRows(result) {
    if (!result?.success) return [];
    if (Array.isArray(result.table?.rows)) return result.table.rows;
    if (Array.isArray(result.data)) return result.data;
    if (result.data && typeof result.data === 'object') return [result.data];
    return [];
  }

  _getResultColumns(result, rows) {
    const sourceColumns = Array.isArray(result?.table?.columns) ? result.table.columns : null;
    const columns = sourceColumns || this._inferColumns(rows);
    return columns.slice(0, this.options.maxTableColumns || 12);
  }

  _inferColumns(rows) {
    const fields = [];
    for (const row of rows.slice(0, 20)) {
      Object.keys(row || {}).forEach(key => {
        if (!fields.includes(key)) fields.push(key);
      });
    }
    return fields.map(field => ({ field, title: field }));
  }

  _formatCellValue(value) {
    if (value === null || value === undefined) return '';
    if (Array.isArray(value)) return `[${value.length} items]`;
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  }

  _formatResultTitle(command, rows) {
    const type = command?.type || 'query';
    return `查询结果：${type} (${rows.length})`;
  }

  _copyResultJSON(result) {
    const text = JSON.stringify(result?.data ?? this._getResultRows(result), null, 2);
    this._copyText(text);
  }

  _copyText(text) {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).catch(() => this._fallbackCopyText(text));
      return;
    }
    this._fallbackCopyText(text);
  }

  _fallbackCopyText(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.className = 'ds-ai-clipboard-proxy';
    document.body.appendChild(textarea);
    textarea.select();
    try { document.execCommand('copy'); } catch {}
    textarea.remove();
  }

  _downloadResultCSV(command, result) {
    const rows = this._getResultRows(result);
    if (!rows.length) return;
    const columns = this._getResultColumns(result, rows);
    const csv = this._toCSV(columns, rows);
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${this._safeFilename(command?.type || 'query')}-${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  _toCSV(columns, rows) {
    const header = columns.map(col => this._csvCell(col.title || col.field)).join(',');
    const body = rows.map(row => columns.map(col => this._csvCell(this._formatCellValue(row[col.field]))).join(','));
    return [header, ...body].join('\n');
  }

  _csvCell(value) {
    const text = String(value ?? '');
    return `"${text.replace(/"/g, '""')}"`;
  }

  async _resolveContext(input) {
    if (typeof this.options.context === 'function') {
      return (await this.options.context(input)) || {};
    }
    return this.options.context || {};
  }

  _safeFilename(value) {
    return String(value || 'query').replace(/[\\/:*?"<>|]+/g, '-').slice(0, 80) || 'query';
  }

  _showProgress(batchResult) {
    if (!this._progressEl) return;
    this._progressEl.classList.add('is-visible');
    const fill = this._progressEl.querySelector('.ds-ai-progress-fill');
    const text = this._progressEl.querySelector('.ds-ai-progress-text');
    const done = batchResult.total - batchResult.failed;
    const pct = Math.round((done / batchResult.total) * 100);
    fill.style.width = `${pct}%`;
    text.textContent = `${done}/${batchResult.total}`;

    if (done === batchResult.total) {
      setTimeout(() => { this._progressEl.classList.remove('is-visible'); }, 2000);
    }
  }

  _updateTimeline(step, label, status) {
    if (!this._timelineEl) return;
    this._timelineEl.classList.add('is-visible');

    const icons = { running: '🔄', success: '✅', error: '❌', skipped: '⏭️', done: '✅' };
    let stepEl = this._timelineEl.querySelector(`[data-step="${step}"]`);
    if (!stepEl) {
      stepEl = document.createElement('div');
      stepEl.className = 'ds-ai-timeline-step';
      stepEl.dataset.step = step;
      this._timelineEl.appendChild(stepEl);
    }

    stepEl.dataset.status = status;
    stepEl.innerHTML = `<span class="ds-ai-timeline-icon">${icons[status] || '⏳'}</span><span class="ds-ai-timeline-label">${_esc(label)}</span>`;
  }

  _toggleMinimize() {
    this._container.classList.toggle('is-minimized');
  }

  _scrollToBottom() {
    if (this._messagesEl) {
      this._messagesEl.scrollTop = this._messagesEl.scrollHeight;
    }
  }
}

// ── Helpers ───────────────────────────────────────────────

function _esc(str) {
  const d = document.createElement('div');
  d.textContent = String(str ?? '');
  return d.innerHTML;
}

function _renderText(text) {
  if (!text) return '';
  let s = _esc(text);
  s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/`(.+?)`/g, '<code>$1</code>');
  return s;
}