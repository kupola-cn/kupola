// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Lazy component loading.
 *
 * Provides async component initialization for code-splitting and
 * on-demand loading of heavy components (Table, Calendar, etc.).
 *
 * Usage:
 * ```js
 * import { lazyComponent } from '@kupola/kupola';
 *
 * // Lazy-load a component — only fetches the bundle when first used
 * const LazyTable = lazyComponent(() => import('@kupola/kupola/components/table'));
 *
 * // Later, when you need it:
 * const table = await LazyTable({ columns: [...], data: [...] });
 * container.appendChild(table.element);
 * ```
 *
 * Or with preloading:
 * ```js
 * import { lazyComponent, preloadComponent } from '@kupola/kupola';
 *
 * const LazyCalendar = lazyComponent(() => import('@kupola/kupola/components/calendar'));
 *
 * // Start loading in the background
 * preloadComponent(LazyCalendar);
 *
 * // Later — resolves instantly if already loaded
 * const cal = await LazyCalendar({ ... });
 * ```
 *
 * @module lazy
 */

// ── Component cache ─────────────────────────────────────────────────────────

/** @type {Map<Function, Promise<any>>} Cache for in-flight and resolved imports. */
const _cache = new Map();

/**
 * Create a lazy-loaded component wrapper.
 *
 * The dynamic import is only executed on first call. Subsequent calls
 * return the cached component factory.
 *
 * @param {() => Promise<{default?: Function, [key: string]: Function}>} loader
 *   Dynamic import function returning the component module.
 * @param {string} [exportName='default']
 *   Named export to use (default: 'default' or first exported function).
 * @returns {Function}
 *   An async factory: `async (options, ...args) => ComponentResult`.
 *   Resolves to the same shape as calling the component directly.
 */
export function lazyComponent(loader, exportName = 'default') {
  /** @type {Function|null} Resolved component factory. */
  let _resolved = null;

  /** @type {Promise<Function>|null} In-flight import promise. */
  let _pending = null;

  async function resolve() {
    if (_resolved) {return _resolved;}
    if (_pending) {return _pending;}

    _pending = loader().then(mod => {
      // Find the component factory in the module
      if (typeof mod.default === 'function') {
        _resolved = mod.default;
      } else if (exportName !== 'default' && typeof mod[exportName] === 'function') {
        _resolved = mod[exportName];
      } else {
        // First exported function
        const keys = Object.keys(mod);
        for (const key of keys) {
          if (typeof mod[key] === 'function') {
            _resolved = mod[key];
            break;
          }
        }
      }

      if (!_resolved) {
        throw new Error(`[Kupola lazy] No component factory found in module`);
      }

      _pending = null;
      return _resolved;
    });

    return _pending;
  }

  /**
   * Async component factory. Awaits the dynamic import on first call,
   * then delegates to the resolved component.
   *
   * @param {...any} args  Arguments forwarded to the component factory.
   * @returns {Promise<any>} The component result (same as direct call).
   */
  async function lazyFactory(...args) {
    const factory = await resolve();
    return factory(...args);
  }

  // Attach metadata for debugging and preload support
  lazyFactory._lazyLoader = loader;
  lazyFactory._isResolved = () => _resolved !== null;
  lazyFactory._preload = resolve;

  return lazyFactory;
}

/**
 * Preload a lazy component in the background.
 *
 * Call this during idle time or route transitions to warm up the cache
 * before the component is actually needed.
 *
 * @param {Function} lazyFactory  A function returned by `lazyComponent()`.
 * @returns {Promise<void>}  Resolves when the component module is loaded.
 */
export async function preloadComponent(lazyFactory) {
  if (typeof lazyFactory._preload !== 'function') {
    throw new TypeError('[Kupola preload] Argument must be a lazy component from lazyComponent()');
  }
  await lazyFactory._preload();
}
