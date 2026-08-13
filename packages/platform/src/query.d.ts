// SPDX-License-Identifier: MIT

export interface UseQueryOptions {
  /** Milliseconds before a cached response is considered stale. Default 30s. */
  staleTime?: number;
  /** Whether to cache the successful result. Set to false to dedup only. */
  cache?: boolean;
}

/**
 * Fetch data with automatic request deduplication and response caching.
 *
 * @param key Unique cache key.
 * @param fetcher Function that fetches the data.
 * @param options Configuration options.
 */
export declare function useQuery<T>(
  key: string,
  fetcher: () => T | Promise<T>,
  options?: UseQueryOptions,
): Promise<T>;

/** Invalidate a specific cached query. Returns whether an entry was removed. */
export declare function invalidateQuery(key: string): boolean;

/**
 * Invalidate cached queries matching a predicate.
 * If no predicate is given, clears the entire cache.
 * Returns the number of entries removed.
 */
export declare function invalidateQueries(
  predicate?: (key: string) => boolean,
): number;

/** Warm up the cache by fetching data without awaiting. */
export declare function prefetchQuery(
  key: string,
  fetcher: () => any | Promise<any>,
  options?: UseQueryOptions,
): Promise<void>;

/** Number of entries currently in the cache. */
export declare function getQueryCacheSize(): number;

/** Number of in-flight requests. */
export declare function getPendingQueryCount(): number;

/** Clear all cache entries and cancel dedup tracking. */
export declare function resetQueryCache(): void;
