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
 *   - HtmlString (from htmlString()) → raw HTML content (NOT escaped)
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

const HTML_STRING_BRAND = Symbol.for('kupola.HtmlString');

function isTrustedHtml(value) {
  if (value == null || typeof value !== 'object') {return false;}
  if (typeof globalThis.TrustedHTML === 'function' && value instanceof globalThis.TrustedHTML) {
    return true;
  }
  return Object.prototype.toString.call(value) === '[object TrustedHTML]';
}

/**
 * Wrapper for raw HTML strings that should NOT be escaped.
 * Use this for SVG icons, third-party icon library output, or any trusted HTML content.
 *
 * ```js
 * import { html, htmlString } from '@kupola/platform';
 * import { svg } from '@kupola/components/icons';
 *
 * const icon = htmlString(svg('dashboard', 18));
 * const tpl = html`<span>${icon}</span>`;
 * ```
 *
 * @param {string} html  Raw HTML content
 * @returns {HtmlString}
 */
export class HtmlString {
  /** @type {string|object} */
  #content;

  [HTML_STRING_BRAND] = true;

  /** @param {string|object} content */
  constructor(content) {
    this.#content = isTrustedHtml(content) ? content : String(content ?? '');
  }

  /** @returns {string} */
  toString() {
    return this.#content;
  }

  /** @returns {string} */
  get content() {
    return this.#content;
  }
}

/**
 * Create a raw HTML string that will not be escaped during template rendering.
 *
 * @param {string} html
 * @returns {HtmlString}
 */
export function htmlString(html) {
  return new HtmlString(html);
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
