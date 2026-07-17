// SPDX-License-Identifier: MIT
/**
 * @kupola/ai-adapter — AIDashboard
 *
 * A data dashboard that pins query results to stat cards and tables.
 *
 * Features:
 * - Register named cards bound to query types
 * - Auto-refresh on configurable interval
 * - Stat cards (summary count / aggregate) + detail tables
 * - Responsive grid layout
 *
 * Usage:
 *   import { AIDashboard } from '@kupola/ai-adapter/dashboard';
 *
 *   const dash = new AIDashboard(adapter);
 *   dash.addCard('employees', 'search', { label: '员工总数', aggregate: 'count' });
 *   dash.addCard('attendance', 'attendance', { label: '今日出勤' });
 *   dash.mount(document.getElementById('dashboard'));
 */

export class AIDashboard {
  /**
   * @param {import('./ai-adapter.js').AIAdapter} adapter
   * @param {object} [options]
   * @param {number} [options.refreshInterval] — auto-refresh ms (0 = disabled, default: 0)
   * @param {string} [options.columns]         — grid columns (default: 'repeat(auto-fit, minmax(220px, 1fr))')
   */
  constructor(adapter, options = {}) {
    this.adapter = adapter;
    this.options = {
      refreshInterval: 0,
      columns: 'repeat(auto-fit, minmax(220px, 1fr))',
      ...options,
    };

    /** @type {Map<string, CardConfig>} */
    this.cards = new Map();
    this._container = null;
    this._timer = null;
    this._unsubscribers = [];
  }

  /**
   * Register a dashboard card.
   * @param {string} name       — unique card name
   * @param {string} queryType  — registered query engine type
   * @param {object} [config]
   * @param {string} [config.label]     — display label
   * @param {string} [config.aggregate] — 'count' | 'sum:field' | 'avg:field'
   * @param {object} [config.params]    — query params
   * @param {string} [config.icon]      — emoji icon
   */
  addCard(name, queryType, config = {}) {
    this.cards.set(name, {
      name,
      queryType,
      label: config.label || name,
      aggregate: config.aggregate || null,
      params: config.params || {},
      icon: config.icon || '📊',
      lastData: null,
      lastError: null,
    });
    return this;
  }

  /** Remove a card by name. */
  removeCard(name) {
    this.cards.delete(name);
    if (this._container) this._renderAll();
    return this;
  }

  /**
   * Mount the dashboard into a DOM container.
   * @param {HTMLElement} parent
   */
  mount(parent) {
    if (this._container) this.destroy();

    this._container = document.createElement('div');
    this._container.className = 'ds-ai-dashboard';
    this._container.style.cssText = `display:grid;grid-template-columns:${this.options.columns};gap:16px;`;

    parent.appendChild(this._container);
    this._renderAll();

    // Subscribe to result events for live update
    const unsub = this.adapter.bus.on('result', ({ command, result }) => {
      if (command.engine === 'query') {
        for (const [name, card] of this.cards) {
          if (card.queryType === command.type) {
            this._updateCard(name, result);
          }
        }
      }
    });
    this._unsubscribers.push(unsub);

    // Auto-refresh
    if (this.options.refreshInterval > 0) {
      this._timer = setInterval(() => this.refreshAll(), this.options.refreshInterval);
    }

    return this;
  }

  /** Refresh a specific card by re-executing its query. */
  async refresh(name) {
    const card = this.cards.get(name);
    if (!card) return;

    try {
      const result = await this.adapter.query.execute({
        type: card.queryType,
        params: card.params,
        engine: 'query',
      });
      this._updateCard(name, result);
    } catch (err) {
      card.lastError = err.message;
      this._renderCard(name);
    }
  }

  /** Refresh all cards. */
  async refreshAll() {
    const promises = [];
    for (const name of this.cards.keys()) {
      promises.push(this.refresh(name));
    }
    await Promise.allSettled(promises);
  }

  /** Destroy and clean up. */
  destroy() {
    if (this._timer) clearInterval(this._timer);
    this._unsubscribers.forEach(fn => fn());
    this._unsubscribers = [];
    if (this._container && this._container.parentNode) {
      this._container.parentNode.removeChild(this._container);
    }
    this._container = null;
  }

  // ── Private ────────────────────────────────────────────

  _renderAll() {
    if (!this._container) return;
    this._container.innerHTML = '';
    for (const name of this.cards.keys()) {
      this._renderCard(name);
    }
  }

  _renderCard(name) {
    if (!this._container) return;
    const card = this.cards.get(name);
    if (!card) return;

    let el = this._container.querySelector(`[data-card="${name}"]`);
    if (!el) {
      el = document.createElement('div');
      el.dataset.card = name;
      this._container.appendChild(el);
    }

    const value = this._computeValue(card);

    el.style.cssText = 'background:var(--vp-c-bg-soft,#f9fafb);border:1px solid var(--vp-c-divider,#e5e7eb);border-radius:10px;padding:16px 20px;';
    el.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
        <span style="font-size:20px;">${card.icon}</span>
        <span style="font-size:13px;color:var(--vp-c-text-2,#6b7280);font-weight:500;">${_esc(card.label)}</span>
      </div>
      <div style="font-size:28px;font-weight:700;color:var(--vp-c-text-1,#111827);">${card.lastError ? `<span style="color:#ef4444;font-size:14px;">${_esc(card.lastError)}</span>` : value}</div>
      ${card.lastData && card.lastData.table ? this._renderMiniTable(card.lastData.table) : ''}
    `;
  }

  _computeValue(card) {
    if (!card.lastData) return '—';
    const data = card.lastData;

    if (card.aggregate === 'count') {
      if (Array.isArray(data.data)) return data.data.length;
      if (data.summary) return data.summary;
    }

    if (card.aggregate && card.aggregate.startsWith('sum:')) {
      const field = card.aggregate.split(':')[1];
      if (Array.isArray(data.data)) {
        return data.data.reduce((acc, row) => acc + (Number(row[field]) || 0), 0);
      }
    }

    if (card.aggregate && card.aggregate.startsWith('avg:')) {
      const field = card.aggregate.split(':')[1];
      if (Array.isArray(data.data) && data.data.length > 0) {
        const sum = data.data.reduce((acc, row) => acc + (Number(row[field]) || 0), 0);
        return (sum / data.data.length).toFixed(1);
      }
    }

    // Default: show summary or data count
    if (data.summary) return _esc(data.summary);
    if (Array.isArray(data.data)) return data.data.length;
    return '—';
  }

  _renderMiniTable(table) {
    if (!table || !table.rows || table.rows.length === 0) return '';
    const maxRows = 5;
    const rows = table.rows.slice(0, maxRows);

    let html = '<div style="margin-top:12px;overflow-x:auto;"><table style="width:100%;font-size:12px;border-collapse:collapse;">';
    // Header
    html += '<tr>';
    for (const col of table.columns) {
      html += `<th style="text-align:left;padding:4px 8px;border-bottom:1px solid #e5e7eb;color:#6b7280;font-weight:500;">${_esc(col.title)}</th>`;
    }
    html += '</tr>';
    // Rows
    for (const row of rows) {
      html += '<tr>';
      for (const col of table.columns) {
        html += `<td style="padding:4px 8px;border-bottom:1px solid #f3f4f6;">${_esc(String(row[col.field] ?? ''))}</td>`;
      }
      html += '</tr>';
    }
    html += '</table></div>';
    if (table.rows.length > maxRows) {
      html += `<div style="font-size:11px;color:#9ca3af;margin-top:4px;">+${table.rows.length - maxRows} more rows</div>`;
    }
    return html;
  }

  _updateCard(name, result) {
    const card = this.cards.get(name);
    if (!card) return;

    if (result.success) {
      card.lastData = result;
      card.lastError = null;
    } else {
      card.lastError = result.error || 'Query failed';
    }
    this._renderCard(name);
  }
}

// ── Helpers ───────────────────────────────────────────────

function _esc(str) {
  const d = document.createElement('div');
  d.textContent = String(str ?? '');
  return d.innerHTML;
}
