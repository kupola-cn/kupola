// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Progress bar component built on the 2.0 reactive core.
 *
 * Reuses the existing `ds-progress-*` CSS classes for styling.
 *
 * ```js
 * import { Progress } from '@kupola/components/progress';
 *
 * const view = Progress({
 *   percent: 60,
 *   status: 'active',   // 'active' | 'success' | 'error' | 'warning'
 *   size: 'default',    // 'default' | 'sm'
 * });
 * container.appendChild(view.element);
 *
 * // Later:
 * view.setPercent(100);
 * ```
 *
 * @module components/progress
 */

import { html } from '@kupola/core';
import { render } from '@kupola/core';

/**
 * Create a Progress bar component instance.
 *
 * @param {Object} [options]
 * @param {number} [options.percent]    0–100 (default 0)
 * @param {string} [options.status]     'active'|'success'|'error'|'warning' (default '')
 * @param {string} [options.size]       'default'|'sm' (default 'default')
 * @param {boolean} [options.indeterminate] Indeterminate mode (default false)
 * @returns {{ element: DocumentFragment, setPercent: Function, getPercent: Function, setStatus: Function, destroy: Function }}
 */
export function Progress(options = {}) {
  const {
    percent: initialPercent = 0,
    status = '',
    size = 'default',
    indeterminate = false,
  } = options;

  let _percent = Math.min(100, Math.max(0, initialPercent));
  let _status = status;

  // ── Public API ─────────────────────────────────────────────────────────────

  function setPercent(val) {
    _percent = Math.min(100, Math.max(0, val));
    _syncBar();
  }

  function getPercent() {
    return _percent;
  }

  function setStatus(val) {
    _status = val;
    _syncBar();
  }

  function destroy() {
    instance.destroy();
  }

  // ── Internal ───────────────────────────────────────────────────────────────

  function _syncBar() {
    if (!barEl) {return;}
    barEl.style.width = _percent + '%';

    // Update status classes
    barEl.classList.remove('is-error', 'is-warning', 'is-success');
    if (_status === 'error') {barEl.classList.add('is-error');}
    else if (_status === 'warning') {barEl.classList.add('is-warning');}
    else if (_status === 'success') {barEl.classList.add('is-success');}
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const sizeClass = size === 'sm' ? ' ds-progress--sm' : '';
  const indeterminateClass = indeterminate ? ' ds-progress--indeterminate' : '';

  const tpl = html`
    <div class="ds-progress${sizeClass}${indeterminateClass}">
      <div class="ds-progress__bar"></div>
    </div>
  `;

  const container = document.createDocumentFragment();
  const instance = render(tpl, container);

  const barEl = container.querySelector('.ds-progress__bar');

  // Initial sync
  _syncBar();

  return {
    get element() { return container; },
    setPercent,
    getPercent,
    setStatus,
    destroy,
  };
}
