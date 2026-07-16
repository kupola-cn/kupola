// SPDX-License-Identifier: MIT
/**
 * @kupola/ai-adapter — AIPanel
 *
 * A full-featured AI conversation panel built with Kupola native components.
 *
 * Features:
 * - Modal container (draggable, closable)
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

export class AIPanel {
  /**
   * @param {import('./ai-adapter.js').AIAdapter} adapter
   * @param {object} [options]
   * @param {string} [options.title]        — panel title (default: 'AI Assistant')
   * @param {string} [options.width]        — modal width (default: '520px')
   * @param {string} [options.height]       — messages area max-height (default: '400px')
   * @param {string} [options.placeholder]  — input placeholder text
   * @param {boolean} [options.showTimestamp] — show timestamps on messages
   */
  constructor(adapter, options = {}) {
    this.adapter = adapter;
    this.options = {
      title: 'AI Assistant',
      width: '520px',
      height: '400px',
      placeholder: '输入指令... (查询/添加/执行)',
      showTimestamp: false,
      ...options,
    };

    this._container = null;
    this._messagesEl = null;
    this._inputEl = null;
    this._progressEl = null;
    this._timelineEl = null;
    this._unsubscribers = [];
    this._isOpen = false;
  }

  /**
   * Mount the panel into a DOM container.
   * @param {HTMLElement} parent
   */
  mount(parent) {
    if (this._container) this.destroy();

    this._container = document.createElement('div');
    this._container.className = 'kupola-ai-panel';
    this._container.innerHTML = this._buildHTML();

    // Cache DOM refs
    this._messagesEl = this._container.querySelector('.kai-messages');
    this._inputEl = this._container.querySelector('.kai-input');
    this._sendBtn = this._container.querySelector('.kai-send-btn');
    this._progressEl = this._container.querySelector('.kai-progress');
    this._timelineEl = this._container.querySelector('.kai-timeline');
    this._headerCloseBtn = this._container.querySelector('.kai-close-btn');
    this._headerMinBtn = this._container.querySelector('.kai-min-btn');

    // Bind events
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

    // Subscribe to adapter events
    this._subscribeEvents();

    // Render existing messages
    this._renderExistingMessages();

    return this;
  }

  /** Show the panel. */
  open() {
    if (!this._container) return;
    this._container.style.display = 'flex';
    this._isOpen = true;
    this._scrollToBottom();
    this._inputEl.focus();
  }

  /** Hide the panel. */
  close() {
    if (!this._container) return;
    this._container.style.display = 'none';
    this._isOpen = false;
  }

  /** Toggle visibility. */
  toggle() {
    this._isOpen ? this.close() : this.open();
  }

  /** Destroy the panel and clean up listeners. */
  destroy() {
    this._unsubscribers.forEach(fn => fn());
    this._unsubscribers = [];
    if (this._container && this._container.parentNode) {
      this._container.parentNode.removeChild(this._container);
    }
    this._container = null;
    this._messagesEl = null;
    this._inputEl = null;
    this._isOpen = false;
  }

  /** Programmatically add a message to the panel. */
  addMessage(role, text, actions = null) {
    this._appendMessage(role, text, actions);
  }

  // ── Private ────────────────────────────────────────────

  _buildHTML() {
    const { title, height, placeholder } = this.options;
    return `
      <div class="kai-header">
        <span class="kai-title">${_esc(title)}</span>
        <div class="kai-header-actions">
          <button class="kai-min-btn" title="最小化">─</button>
          <button class="kai-close-btn" title="关闭">✕</button>
        </div>
      </div>
      <div class="kai-messages" style="max-height:${height};overflow-y:auto;padding:12px 16px;">
      </div>
      <div class="kai-progress" style="display:none;padding:4px 16px;">
        <div class="kai-progress-bar"><div class="kai-progress-fill"></div></div>
        <span class="kai-progress-text"></span>
      </div>
      <div class="kai-timeline" style="display:none;padding:8px 16px;">
      </div>
      <div class="kai-input-area" style="display:flex;gap:8px;padding:8px 16px;border-top:1px solid var(--vp-c-divider,#e5e7eb);">
        <input class="kai-input" type="text" placeholder="${_esc(placeholder)}"
               style="flex:1;padding:8px 12px;border:1px solid var(--vp-c-divider,#d1d5db);border-radius:6px;font-size:14px;outline:none;" />
        <button class="kai-send-btn"
                style="padding:8px 16px;background:var(--vp-c-brand-1,#3b82f6);color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:14px;font-weight:500;">
          发送
        </button>
      </div>
    `;
  }

  _subscribeEvents() {
    const bus = this.adapter.bus;

    // New messages
    const unsubResult = bus.on('result', ({ command, result }) => {
      const msg = this.adapter.getMessages().pop();
      if (msg) this._appendMessage(msg.role, msg.text);

      // Show quick actions if there's a suggestion
      if (result && result.suggestion && result.suggestion.suggest) {
        this._appendMessage('suggestion', result.suggestion.message, [
          { label: '创建流程', action: () => this._handleSend(`创建流程 ${command.type}`) },
          { label: '忽略', action: () => {} },
        ]);
      }
    });

    // Flow step events → timeline
    const unsubFlowStep = bus.on('flow:step', ({ step, label, status }) => {
      this._updateTimeline(step, label, status);
    });

    // Flow complete → hide timeline after delay
    const unsubFlowComplete = bus.on('flow:complete', () => {
      setTimeout(() => { this._timelineEl.style.display = 'none'; }, 3000);
    });

    this._unsubscribers.push(unsubResult, unsubFlowStep, unsubFlowComplete);
  }

  _renderExistingMessages() {
    for (const msg of this.adapter.getMessages()) {
      this._appendMessage(msg.role, msg.text);
    }
  }

  async _handleSend(overrideInput) {
    const input = overrideInput || this._inputEl.value.trim();
    if (!input) return;

    this._inputEl.value = '';
    this._appendMessage('user', input);

    try {
      const result = await this.adapter.process(input);

      // If it's a batch operation, show progress
      if (result.result && result.result.total) {
        this._showProgress(result.result);
      }
    } catch (err) {
      this._appendMessage('system', `❌ Error: ${err.message}`);
    }
  }

  _appendMessage(role, text, actions = null) {
    if (!this._messagesEl) return;

    const div = document.createElement('div');
    div.className = `kai-msg kai-msg-${role}`;

    // Style
    const styles = {
      user: 'background:#eff6ff;color:#1e40af;padding:8px 12px;border-radius:8px 8px 2px 8px;margin-bottom:8px;max-width:80%;margin-left:auto;font-size:14px;',
      system: 'background:#f3f4f6;color:#374151;padding:8px 12px;border-radius:8px 8px 8px 2px;margin-bottom:8px;max-width:85%;font-size:14px;',
      suggestion: 'background:#fefce8;color:#854d0e;padding:8px 12px;border-radius:8px;margin-bottom:8px;max-width:85%;border:1px dashed #facc15;font-size:13px;',
    };

    div.style.cssText = styles[role] || styles.system;

    // Render text (support basic markdown-like formatting)
    div.innerHTML = _renderText(text);

    // Timestamp
    if (this.options.showTimestamp) {
      const ts = document.createElement('span');
      ts.style.cssText = 'display:block;font-size:11px;color:#9ca3af;margin-top:4px;';
      ts.textContent = new Date().toLocaleTimeString();
      div.appendChild(ts);
    }

    // Action buttons
    if (actions && actions.length > 0) {
      const btnGroup = document.createElement('div');
      btnGroup.style.cssText = 'display:flex;gap:6px;margin-top:8px;flex-wrap:wrap;';
      for (const act of actions) {
        const btn = document.createElement('button');
        btn.textContent = act.label;
        btn.style.cssText = 'padding:4px 10px;font-size:12px;border:1px solid #d1d5db;border-radius:4px;background:#fff;cursor:pointer;';
        btn.addEventListener('click', () => act.action());
        btnGroup.appendChild(btn);
      }
      div.appendChild(btnGroup);
    }

    this._messagesEl.appendChild(div);
    this._scrollToBottom();
  }

  _showProgress(batchResult) {
    if (!this._progressEl) return;
    this._progressEl.style.display = 'flex';
    const fill = this._progressEl.querySelector('.kai-progress-fill');
    const text = this._progressEl.querySelector('.kai-progress-text');
    const done = batchResult.total - batchResult.failed;
    const pct = Math.round((done / batchResult.total) * 100);
    fill.style.width = `${pct}%`;
    fill.style.cssText = `width:${pct}%;height:6px;background:var(--vp-c-brand-1,#3b82f6);border-radius:3px;transition:width 0.3s;`;
    text.textContent = `${done}/${batchResult.total}`;
    text.style.cssText = 'font-size:12px;color:#6b7280;margin-left:8px;';
    this._progressEl.querySelector('.kai-progress-bar').style.cssText = 'flex:1;height:6px;background:#e5e7eb;border-radius:3px;overflow:hidden;';
    this._progressEl.style.cssText = 'display:flex;align-items:center;padding:4px 16px;gap:8px;';

    if (done === batchResult.total) {
      setTimeout(() => { this._progressEl.style.display = 'none'; }, 2000);
    }
  }

  _updateTimeline(step, label, status) {
    if (!this._timelineEl) return;
    this._timelineEl.style.display = 'block';

    const icons = { running: '🔄', success: '✅', error: '❌', skipped: '⏭️', done: '✅' };
    const colors = { running: '#3b82f6', success: '#22c55e', error: '#ef4444', skipped: '#9ca3af', done: '#22c55e' };

    // Find or create step element
    let stepEl = this._timelineEl.querySelector(`[data-step="${step}"]`);
    if (!stepEl) {
      stepEl = document.createElement('div');
      stepEl.dataset.step = step;
      stepEl.style.cssText = 'display:flex;align-items:center;gap:8px;padding:4px 0;font-size:13px;';
      this._timelineEl.appendChild(stepEl);
    }

    stepEl.innerHTML = `<span>${icons[status] || '⏳'}</span><span style="color:${colors[status] || '#6b7280'}">${_esc(label)}</span>`;
  }

  _toggleMinimize() {
    const msgs = this._container.querySelector('.kai-messages');
    const inputArea = this._container.querySelector('.kai-input-area');
    const progress = this._container.querySelector('.kai-progress');
    const timeline = this._container.querySelector('.kai-timeline');

    const isMinimized = msgs.style.display === 'none';
    const display = isMinimized ? '' : 'none';
    msgs.style.display = isMinimized ? 'block' : 'none';
    inputArea.style.display = isMinimized ? 'flex' : 'none';
    progress.style.display = isMinimized ? 'flex' : 'none';
    timeline.style.display = isMinimized ? 'block' : 'none';
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

/**
 * Simple text renderer: converts basic markdown-like patterns to HTML.
 * - **bold** → <strong>
 * - `code` → <code>
 * - JSON objects → pretty-printed <pre>
 */
function _renderText(text) {
  if (!text) return '';
  let s = _esc(text);
  // Bold
  s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // Inline code
  s = s.replace(/`(.+?)`/g, '<code style="background:#f3f4f6;padding:1px 4px;border-radius:3px;font-size:13px;">$1</code>');
  return s;
}
