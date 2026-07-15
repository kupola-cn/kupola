// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Statcard component built on the 2.0 reactive core.
 *
 * Reuses the existing `ds-statcard*` CSS classes for styling.
 *
 * ```js
 * import { Statcard } from '@kupola/core/components/statcard';
 *
 * const view = Statcard({
 *   title: 'Revenue',
 *   value: '$12,345',
 *   trend: 'up',
 *   trendValue: '+12.5%',
 *   icon: '$',
 *   iconType: 'success',
 * });
 * container.appendChild(view.element);
 * ```
 *
 * @module components/statcard
 */

import { html } from '../template.js';
import { render } from '../render.js';

/**
 * Create a Statcard component instance.
 *
 * @param {Object} [options]
 * @param {string} [options.title]      Card title/label
 * @param {string|number} [options.value]  Main stat value
 * @param {string} [options.unit]       Unit suffix (e.g. '%', 'USD')
 * @param {string} [options.trend]      Trend direction: 'up'|'down'|'neutral'
 * @param {string} [options.trendValue] Trend label (e.g. '+12.5%')
 * @param {string} [options.icon]       Icon text/emoji
 * @param {string} [options.iconType]   Icon color type: 'brand'|'success'|'warning'|'error'|'info'
 * @param {string} [options.size]       Value size: 'small'|'default'|'large'
 * @param {boolean}[options.hoverLift]  Enable hover lift effect
 * @param {boolean}[options.compact]    Compact padding mode
 * @param {boolean}[options.gradient]   Gradient background mode
 * @returns {{ element: DocumentFragment, destroy: Function }}
 */
export function Statcard(options = {}) {
  const {
    title = '',
    value = '',
    unit = '',
    trend = '',
    trendValue = '',
    icon = '',
    iconType = '',
    size = 'default',
    hoverLift = false,
    compact = false,
    gradient = false,
  } = options;

  // ── Public API ─────────────────────────────────────────────────────────────

  function destroy() {
    instance.destroy();
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const classes = [ 'ds-statcard' ];
  if (hoverLift) {classes.push('ds-statcard--hover-lift');}
  if (compact) {classes.push('ds-statcard--compact');}
  if (gradient) {classes.push('ds-statcard--gradient');}

  const classStr = classes.join(' ');

  const tpl = html`
    <div class="${classStr}">
      ${title || icon ? html`
        <div class="ds-statcard__header">
          ${title ? html`<div class="ds-statcard__title">${title}</div>` : ''}
          ${icon ? html`<div class="ds-statcard__icon${iconType ? ` ds-statcard__icon--${iconType}` : ''}">${icon}</div>` : ''}
        </div>
      ` : ''}
      <div class="ds-statcard__value${size !== 'default' ? ` ds-statcard__value--${size}` : ''}">
        ${value}${unit ? html`<span class="ds-statcard__unit">${unit}</span>` : ''}
      </div>
      ${trend && trendValue ? html`
        <div class="ds-statcard__footer">
          <span class="ds-statcard__trend ds-statcard__trend--${trend}">${trendValue}</span>
        </div>
      ` : ''}
    </div>
  `;

  const container = document.createDocumentFragment();
  const instance = render(tpl, container);

  return {
    get element() { return container; },
    destroy,
  };
}
