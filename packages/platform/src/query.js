// SPDX-License-Identifier: MIT
/**
 * @kupola/platform — Request deduplication and response caching hook.
 *
 * `useQuery()` ensures that concurrent calls with the same key share a single
 * network request, and caches the result for a configurable `staleTime` so
 * subsequent calls return instantly without re-fetching.
 *
 * Usage:
 * ```js
 * import { useQuery, invalidateQuery } from '@kupola/platform';
 *
 * // Basic — deduplicates concurrent calls, caches for 30s
 * const list = await useQuery('patients:org-5',
 *   () => api.patients.list({ orgId: 5 }),
 *   { staleTime: 60_000 },
 * );
 *
 * // Invalidate after a mutation
 * await api.patients.create(payload);
 * invalidateQuery('patients:org-5');
 *
 * // Invalidate all patient queries
 * invalidateQueries((key) => key.startsWith('patients:'));
 * ```
 *
 * @module query
 */

/** @type {Map<string, { data: any, expireAt: number }>} */
const _cache = new Map();

/** @type {Map<string, Promise<any>>} */
const _pending = new Map();

/** Maximum number of cache entries before eviction kicks in. */
const MAX_CACHE_SIZE = 500;

/**
 * @typedef {Object} UseQueryOptions
 * @property {number} [staleTime=30000]
 *   Milliseconds before a cached response is considered stale. Default 30s.
 * @property {boolean} [cache=true]
 *   Whether to cache the successful result. Set to `false` to dedup only.
 */

/**
 * Default stale time: 30 seconds.
 */
const DEFAULT_STALE_TIME = 30_000;

/**
 * Evict the oldest stale entry from the cache. Called when the cache exceeds
 * MAX_CACHE_SIZE to prevent unbounded memory growth.
 */
function _evictStale() {
  if (_cache.size <= MAX_CACHE_SIZE) {return;}

  // Remove explicitly expired entries first.
  const now = Date.now();
  const stale = [];
  for (const [key, entry] of _cache) {
    if (entry.expireAt <= now) {stale.push(key);}
  }
  for (const key of stale) {_cache.delete(key);}

  // If still over limit, remove the oldest entries (smallest expireAt).
  if (_cache.size > MAX_CACHE_SIZE) {
    const entries = Array.from(_cache.entries());
    entries.sort((a, b) => a[1].expireAt - b[1].expireAt);
    const toRemove = entries.slice(0, _cache.size - MAX_CACHE_SIZE);
    for (const [key] of toRemove) {_cache.delete(key);}
  }
}

/**
 * Fetch data with automatic request deduplication and response caching.
 *
 * - If a fresh cached response exists, returns it immediately.
 * - If a request with the same key is already in-flight, returns the same
 *   Promise (deduplication).
 * - Otherwise, calls `fetcher()` and caches the result.
 *
 * @template T
 * @param {string} key — Unique cache key (e.g. `'patients:org-5'`).
 * @param {() => T | Promise<T>} fetcher — Function that fetches the data.
 * @param {UseQueryOptions} [options]
 * @returns {Promise<T>}
 */
export function useQuery(key, fetcher, options = {}) {
  if (typeof key !== 'string' || key.length === 0) {
    throw new TypeError('[kupola] useQuery() expects a non-empty string key.');
  }
  if (typeof fetcher !== 'function') {
    throw new TypeError('[kupola] useQuery() expects a fetcher function.');
  }

  const { staleTime = DEFAULT_STALE_TIME, cache = true } = options;

  // 1. Cache hit — return cached data if still fresh.
  if (cache && staleTime > 0) {
    const entry = _cache.get(key);
    if (entry && entry.expireAt > Date.now()) {
      return Promise.resolve(entry.data);
    }
  }

  // 2. Dedup — if a request is already in-flight, reuse it.
  //    NOTE: The options of the first caller (cache, staleTime) determine the
  //    behaviour for all concurrent callers. This is a deliberate trade-off:
  //    the second caller reuses the in-flight request and its result, so the
  //    first caller's caching policy applies.
  if (_pending.has(key)) {
    return _pending.get(key);
  }

  // 3. Fire a new request.
  const promise = Promise.resolve().then(fetcher);

  _pending.set(key, promise);

  promise.then(
    (data) => {
      _pending.delete(key);
      if (cache && staleTime > 0) {
        _cache.set(key, { data, expireAt: Date.now() + staleTime });
        _evictStale();
      }
    },
    () => {
      // On error, remove from pending so the next call can retry.
      _pending.delete(key);
    },
  );

  return promise;
}

/**
 * Invalidate a specific cached query. The next `useQuery()` call with the
 * same key will re-fetch.
 *
 * Does NOT cancel an in-flight request — it only clears the cached response.
 *
 * @param {string} key
 * @returns {boolean} Whether a cache entry was removed.
 */
export function invalidateQuery(key) {
  return _cache.delete(key);
}

/**
 * Invalidate cached queries matching a predicate. If no predicate is given,
 * clears the entire cache.
 *
 * @param {(key: string) => boolean} [predicate]
 * @returns {number} Number of entries removed.
 */
export function invalidateQueries(predicate) {
  if (typeof predicate !== 'function') {
    const count = _cache.size;
    _cache.clear();
    return count;
  }
  let removed = 0;
  for (const key of _cache.keys()) {
    if (predicate(key)) {
      _cache.delete(key);
      removed++;
    }
  }
  return removed;
}

/**
 * Warm up the cache by fetching data without awaiting the result.
 * Subsequent `useQuery()` calls with the same key will get the cached data.
 *
 * @param {string} key
 * @param {() => any | Promise<any>} fetcher
 * @param {UseQueryOptions} [options]
 * @returns {Promise<void>}
 */
export function prefetchQuery(key, fetcher, options) {
  return useQuery(key, fetcher, options).then(() => undefined);
}

/**
 * Return the number of entries currently in the cache (for debugging/testing).
 * @returns {number}
 */
export function getQueryCacheSize() {
  return _cache.size;
}

/**
 * Return the number of in-flight requests (for debugging/testing).
 * @returns {number}
 */
export function getPendingQueryCount() {
  return _pending.size;
}

/**
 * Clear all cache entries and cancel dedup tracking. Intended for tests.
 */
export function resetQueryCache() {
  _cache.clear();
  _pending.clear();
}
