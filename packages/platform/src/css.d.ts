// SPDX-License-Identifier: MIT

/** Return type of `css()` — class name mapping with cleanup. */
export interface CssModuleResult {
  [className: string]: string;
  /** Remove the injected style tag and release the cache reference. */
  dispose(): void;
}

/**
 * CSS Modules tagged template literal.
 *
 * Scans the CSS for class selectors, generates a unique scope prefix,
 * rewrites all selectors to be scoped, injects a `<style>` tag, and
 * returns an object mapping original class names to scoped class names.
 *
 * @example
 * ```ts
 * const styles = css`.root { color: red; } .item { padding: 8px; }`;
 * // styles.root === "k0-root"
 * // styles.item === "k0-item"
 * // styles.dispose(); // clean up when unmounted
 * ```
 */
export declare function css(
  strings: TemplateStringsArray,
  ...values: any[]
): CssModuleResult;
