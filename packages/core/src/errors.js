// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Error boundary utility for graceful error handling.
 *
 * Wraps component rendering so that exceptions within a component
 * do not crash the entire application. On error, a fallback element
 * is rendered in place of the failed component.
 *
 * ```js
 * import { ErrorBoundary } from '@kupola/core/errors';
 *
 * const view = ErrorBoundary(
 *   () => SomeRiskyComponent({ data: badData }),
 *   { fallback: (err) => html`<div class="ds-alert ds-alert--error">Error: ${err.message}</div>` }
 * );
 * container.appendChild(view.element);
 * ```
 *
 * @module errors
 */

import { html } from './template.js';
import { render } from './render.js';

/**
 * Wrap a component factory with error handling.
 *
 * @param {Function} factory - Component factory function that returns { element, ... }
 * @param {Object}   [options]
 * @param {Function} [options.fallback] - Fallback factory: (error) => TemplateResult|string
 * @param {Function} [options.onError]  - Error callback: (error) => void
 * @returns {{ element: DocumentFragment|HTMLElement, error: Error|null }}
 */
export function ErrorBoundary(factory, options = {}) {
  const {
    fallback = null,
    onError = null,
  } = options;

  try {
    const result = factory();
    return result;
  } catch (err) {
    if (onError) {
      try { onError(err); } catch (_e) { /* swallow callback errors */ }
    }

    // Log to console for debugging
    console.error('[Kupola ErrorBoundary]', err);

    // Create fallback element
    const container = document.createDocumentFragment();
    if (fallback) {
      try {
        const fallbackContent = typeof fallback === 'function' ? fallback(err) : fallback;
        if (typeof fallbackContent === 'string') {
          const el = document.createElement('div');
          el.className = 'ds-error-boundary';
          el.textContent = fallbackContent;
          container.appendChild(el);
        } else {
          render(fallbackContent, container);
        }
      } catch (_fallbackErr) {
        // If fallback also fails, show a minimal error
        const el = document.createElement('div');
        el.className = 'ds-error-boundary';
        el.textContent = `Component error: ${err.message}`;
        container.appendChild(el);
      }
    } else {
      const el = document.createElement('div');
      el.className = 'ds-error-boundary';
      el.textContent = `Component error: ${err.message}`;
      container.appendChild(el);
    }

    return { element: container, error: err };
  }
}
