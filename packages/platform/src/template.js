// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Tagged template literal for declarative HTML templates.
 *
 * Usage:
 *   const tpl = html`<div>${signal}</div>`;
 *   render(tpl, container);
 *
 * Values are classified:
 *   - Signal / Computed (has `.value` getter) → reactive text or attribute
 *   - Function → event handler (when used in on* attributes)
 *   - TemplateResult (nested html``) → recursive render
 *   - Array of TemplateResults → list rendering
 *   - Primitives → static escaped text
 *
 * @module template
 */

/**
 * Lightweight template result — holds the raw strings and values
 * from a tagged template literal. No parsing happens here.
 */
export class TemplateResult {
  /**
   * @param {TemplateStringsArray} strings
   * @param {any[]} values
   */
  constructor(strings, values) {
    /** @type {TemplateStringsArray} */
    this.strings = strings;
    /** @type {any[]} */
    this.values = values;
  }
}

/**
 * Tagged template literal for HTML templates.
 *
 * ```js
 * const count = signal(0);
 * const tpl = html`<button onclick="${() => count.value++}">${count}</button>`;
 * render(tpl, document.getElementById('app'));
 * ```
 *
 * @param {TemplateStringsArray} strings
 * @param {...any} values
 * @returns {TemplateResult}
 */
export function html(strings, ...values) {
  return new TemplateResult(strings, values);
}
