// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Lazy component loading.
 *
 * Provides async component initialization for code-splitting and
 * on-demand loading of heavy components (Table, Calendar, etc.).
 *
 * Usage:
 * ```js
 * import { lazyComponent } from '@kupola/platform';
 *
 * // Lazy-load a component — only fetches the bundle when first used
 * const LazyTable = lazyComponent(() => import('@kupola/components/table'));
 *
 * // Later, when you need it:
 * const table = await LazyTable({ columns: [...], data: [...] });
 * container.appendChild(table.element);
 * ```
 *
 * Or with preloading:
 * ```js
 * import { lazyComponent, preloadComponent } from '@kupola/platform';
 *
 * const LazyCalendar = lazyComponent(() => import('@kupola/components/calendar'));
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

/**
 * Create a lazy-loaded component wrapper.
 *
 * The dynamic import is only executed on first call. Subsequent calls
 * return the cached component factory.
 *
 * @param {(signal?: AbortSignal) => Promise<{default?: Function, [key: string]: Function}>} loader
 *   Dynamic import function returning the component module.
 * @param {string} [exportName='default']
 *   Named export to use (default: 'default' or first exported function).
 * @param {{ timeout?: number, signal?: AbortSignal }} [options]
 *   Optional loading timeout and external cancellation signal.
 * @returns {Function}
 *   An async factory: `async (options, ...args) => ComponentResult`.
 *   Resolves to the same shape as calling the component directly.
 */
export function lazyComponent(loader, exportName = 'default', options = {}) {
  if (typeof loader !== 'function') {
    throw new TypeError('[Kupola lazy] loader must be a function.');
  }
  if (typeof exportName !== 'string' || exportName.trim().length === 0) {
    throw new TypeError('[Kupola lazy] exportName must be a non-empty string.');
  }
  if (!options || typeof options !== 'object') {
    throw new TypeError('[Kupola lazy] options must be an object.');
  }

  const { timeout, signal } = options;
  if (timeout !== undefined &&
      (typeof timeout !== 'number' || !Number.isFinite(timeout) || timeout < 0)) {
    throw new TypeError('[Kupola lazy] timeout must be a finite non-negative number.');
  }
  if (signal !== undefined &&
      (!signal || typeof signal.addEventListener !== 'function' ||
        typeof signal.removeEventListener !== 'function' ||
        typeof signal.aborted !== 'boolean')) {
    throw new TypeError('[Kupola lazy] signal must be an AbortSignal.');
  }

  /** @type {Function|null} Resolved component factory. */
  let _resolved = null;

  /** @type {Promise<Function>|null} In-flight import promise. */
  let _pending = null;
  /** @type {{ promise: Promise<Function>, resolve: Function, reject: Function,
   * settled: boolean, controller: AbortController|null, timeoutId: ReturnType<typeof setTimeout>|null,
   * removeSignalListener: Function }}|null} */
  let _request = null;

  function createAbortError(reason) {
    const message = typeof reason === 'string'
      ? reason
      : reason && typeof reason.message === 'string'
        ? reason.message
        : 'Lazy component loading was aborted.';
    const error = new Error(message);
    error.name = 'AbortError';
    if (reason !== undefined && reason !== error) {error.cause = reason;}
    return error;
  }

  function createTimeoutError() {
    const error = new Error(`[Kupola lazy] Component loading timed out after ${timeout}ms.`);
    error.name = 'TimeoutError';
    return error;
  }

  function abortLoader(request, reason) {
    if (!request.controller || request.controller.signal.aborted) {return;}
    try {
      request.controller.abort(reason);
    } catch {
      request.controller.abort();
    }
  }

  function settleRequest(request, rejected, value) {
    if (!request || request.settled) {return;}
    request.settled = true;
    if (request.timeoutId !== null) {
      clearTimeout(request.timeoutId);
      request.timeoutId = null;
    }
    request.removeSignalListener();
    if (_request === request) {_request = null;}
    if (_pending === request.promise) {_pending = null;}

    if (rejected) {
      abortLoader(request, value);
      request.reject(value);
      return;
    }
    _resolved = value;
    request.resolve(value);
  }

  function selectFactory(mod) {
    if (typeof mod === 'function') {return mod;}

    if (mod && exportName !== 'default' && typeof mod[exportName] === 'function') {
      return mod[exportName];
    }
    if (mod && typeof mod.default === 'function') {
      return mod.default;
    }

    const keys = mod && typeof mod === 'object' ? Object.keys(mod) : [];
    for (const key of keys) {
      if (typeof mod[key] === 'function') {
        return mod[key];
      }
    }
    throw new Error('[Kupola lazy] No component factory found in module');
  }

  function resolve() {
    if (_resolved) {return _resolved;}
    if (_pending) {return _pending;}

    let request;
    const pending = new Promise((resolvePromise, rejectPromise) => {
      request = {
        promise: null,
        resolve: resolvePromise,
        reject: rejectPromise,
        settled: false,
        controller: typeof AbortController === 'function' ? new AbortController() : null,
        timeoutId: null,
        removeSignalListener: () => {},
      };
    });
    request.promise = pending;
    _request = request;
    _pending = pending;

    const onAbort = () => {
      settleRequest(request, true, createAbortError(signal.reason));
    };
    if (signal) {
      if (signal.aborted) {
        onAbort();
      } else {
        signal.addEventListener('abort', onAbort, { once: true });
        request.removeSignalListener = () => signal.removeEventListener('abort', onAbort);
      }
    }
    if (request.settled) {return pending;}

    if (timeout !== undefined) {
      request.timeoutId = setTimeout(() => {
        settleRequest(request, true, createTimeoutError());
      }, timeout);
    }

    // The loader is always observed, even after cancellation, so a late
    // rejection cannot become an unhandled promise rejection.
    Promise.resolve()
      .then(() => {
        if (request.settled) {return undefined;}
        return loader(request.controller ? request.controller.signal : signal);
      })
      .then(mod => {
        if (request.settled) {return;}
        let factory;
        try {
          factory = selectFactory(mod);
        } catch (error) {
          settleRequest(request, true, error);
          return;
        }
        settleRequest(request, false, factory);
      }, error => {
        settleRequest(request, true, error);
      });
    return pending;
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
  lazyFactory.cancel = reason => {
    if (_request && !_request.settled) {
      settleRequest(_request, true, createAbortError(reason));
    }
  };

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
  if (!lazyFactory || typeof lazyFactory._preload !== 'function') {
    throw new TypeError('[Kupola preload] Argument must be a lazy component from lazyComponent()');
  }
  await lazyFactory._preload();
}
