// SPDX-License-Identifier: MIT
/**
 * @kupola/platform — CSS Modules: scoped styles via tagged template literal.
 *
 * Usage:
 * ```js
 * import { css } from '@kupola/platform';
 *
 * const styles = css`
 *   .root { color: red; }
 *   .item { padding: 8px; }
 *   .item:hover { color: blue; }
 * `;
 *
 * // styles.root === "k0-root"
 * // styles.item === "k0-item"
 * // In template:
 * html`<div class="${styles.root}"><span class="${styles.item}">Hi</span></div>`
 *
 * // Clean up when the component is unmounted:
 * styles.dispose();
 * ```
 *
 * @module css
 */

let _scopeCounter = 0;

/**
 * @typedef {Object} StyleCacheEntry
 * @property {string} scopeId
 * @property {string[]} classNames
 * @property {HTMLStyleElement|null} [styleEl]
 * @property {number} refCount
 */

/** @type {Map<string, StyleCacheEntry>} */
const _styleCache = new Map();

/**
 * Extract all class names from a CSS string, skipping those inside `:global()`.
 * @param {string} cssText
 * @returns {Set<string>}
 */
function extractClassNames(cssText) {
  const names = new Set();
  // Strip :global() blocks so their class names are not scoped.
  // Use the same robust regex as scopeCss to handle nested parens.
  const cleaned = cssText.replace(/:global\(([^()]*(?:\([^()]*\)[^()]*)*)\)/g, '');
  const pattern = /\.([a-zA-Z_][a-zA-Z0-9_-]*)/g;
  let match;
  while ((match = pattern.exec(cleaned)) !== null) {
    names.add(match[1]);
  }
  return names;
}

/**
 * Extract @keyframes animation names from a CSS string.
 * @param {string} cssText
 * @returns {string[]}
 */
function extractKeyframeNames(cssText) {
  const names = [];
  const pattern = /@keyframes\s+([a-zA-Z_][a-zA-Z0-9_-]*)/g;
  let match;
  while ((match = pattern.exec(cssText)) !== null) {
    names.push(match[1]);
  }
  return names;
}

/**
 * Scope a CSS string:
 * 1. Skip `:global(.class)` — class names inside are left as-is.
 * 2. Replace `.classname` → `.{scopeId}-classname`.
 * 3. Replace `:scope` → `.{scopeId}`.
 * 4. Replace `@keyframes name` → `@keyframes {scopeId}-name`.
 * 5. Replace `animation: name` and `animation-name: name` references
 *    with the scoped keyframe name.
 *
 * @param {string} cssText
 * @param {string} scopeId
 * @returns {string}
 */
function scopeCss(cssText, scopeId) {
  const SCOPE_PLACEHOLDER = '\u0000SCOPE\u0000';

  // 1. Protect :global() blocks — class names inside are left unscoped.
  const globalBlocks = [];
  let scoped = cssText.replace(/:global\(([^()]*(?:\([^()]*\)[^()]*)*)\)/g, (_, content) => {
    globalBlocks.push(content);
    return `\uE000GLOBAL${globalBlocks.length - 1}\uE000`;
  });

  // 2. Collect @keyframes names before scoping them.
  const keyframeNames = extractKeyframeNames(scoped);

  // 3. Replace @keyframes name → @keyframes {scopeId}-name.
  scoped = scoped.replace(
    /@keyframes\s+([a-zA-Z_][a-zA-Z0-9_-]*)/g,
    (_, name) => `@keyframes ${scopeId}-${name}`,
  );

  // 4. Replace :scope with placeholder.
  scoped = scoped.replace(/:scope(?![a-zA-Z-])/g, SCOPE_PLACEHOLDER);

  // 5. Replace .classname with .{scopeId}-classname.
  scoped = scoped.replace(
    /\.([a-zA-Z_][a-zA-Z0-9_-]*)/g,
    (_, name) => `.${scopeId}-${name}`,
  );

  // 6. Replace animation name references (animation: name, animation-name: name).
  for (const name of keyframeNames) {
    // Match the animation name as a whole word in animation/animation-name
    // property values. The name must appear as a standalone identifier
    // (preceded by a space, colon, or comma, followed by a space, semicolon,
    // or end of declaration).
    const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    scoped = scoped.replace(
      new RegExp(`(animation(?:-name)?\\s*:\\s*(?:[^;]*?\\s)?)${escapedName}(\\s*[;,\\s}])`, 'g'),
      `$1${scopeId}-${name}$2`,
    );
  }

  // 7. Restore :scope and :global() blocks.
  scoped = scoped.split(SCOPE_PLACEHOLDER).join(`.${scopeId}`);
  scoped = scoped.replace(new RegExp('\uE000GLOBAL(\\d+)\uE000', 'g'), (_, idx) => {
    const original = globalBlocks[Number(idx)];
    return `:global(${original})`;
  });

  return scoped;
}

/**
 * CSS Modules tagged template literal.
 *
 * Scans the CSS for class selectors, generates a unique scope prefix,
 * rewrites all selectors to be scoped, injects a `<style>` tag, and
 * returns an object mapping original class names to scoped class names.
 *
 * Style tags are deduplicated: calling `css()` with the same CSS text
 * returns the same scope ID and class names, and only injects the
 * `<style>` tag once. A reference count is maintained; call `dispose()`
 * on the returned object to release the reference and remove the style
 * tag when the last reference is disposed.
 *
 * @param {TemplateStringsArray} strings
 * @param {...any} values
 * @returns {Record<string, string> & { dispose(): void }}
 */
export function css(strings, ...values) {
  // Join the template into a single CSS string.
  let cssText = '';
  for (let i = 0; i < strings.length; i++) {
    cssText += strings[i];
    if (i < values.length) {cssText += String(values[i]);}
  }

  const cached = _styleCache.get(cssText);
  if (cached) {
    cached.refCount++;
    return buildResult(cached.scopeId, cached.classNames, cssText);
  }

  const scopeId = `k${_scopeCounter++}`;
  const classNames = [ ...extractClassNames(cssText) ];
  const scopedCss = scopeCss(cssText, scopeId);

  /** @type {HTMLStyleElement|null} */
  let styleEl = null;

  // Inject style tag into document head.
  if (typeof document !== 'undefined') {
    styleEl = document.createElement('style');
    styleEl.setAttribute('data-kupola-scope', scopeId);
    styleEl.textContent = scopedCss;
    document.head.appendChild(styleEl);
  }

  _styleCache.set(cssText, { scopeId, classNames, styleEl, refCount: 1 });

  return buildResult(scopeId, classNames, cssText);
}

/**
 * Build the result object with class name mapping and dispose().
 * @param {string} scopeId
 * @param {string[]} classNames
 * @param {string} cssText
 * @returns {Record<string, string> & { dispose(): void }}
 */
function buildResult(scopeId, classNames, cssText) {
  /** @type {Record<string, string>} */
  const result = {};
  for (const name of classNames) {
    result[name] = `${scopeId}-${name}`;
  }

  let disposed = false;
  result.dispose = function dispose() {
    if (disposed) {return;}
    disposed = true;
    const entry = _styleCache.get(cssText);
    if (!entry) {return;}
    entry.refCount--;
    if (entry.refCount <= 0) {
      if (entry.styleEl && typeof document !== 'undefined') {
        entry.styleEl.remove();
      }
      _styleCache.delete(cssText);
    }
  };

  return result;
}
