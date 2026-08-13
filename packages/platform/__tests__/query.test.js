// SPDX-License-Identifier: MIT
/**
 * @kupola/platform — Unit tests for useQuery() request dedup + cache.
 */

import {
  useQuery,
  invalidateQuery,
  invalidateQueries,
  prefetchQuery,
  getQueryCacheSize,
  getPendingQueryCount,
  resetQueryCache,
} from '../src/query.js';

beforeEach(() => {
  resetQueryCache();
});

afterEach(() => {
  resetQueryCache();
});

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Create a fetcher that resolves after `ms` with `value`, tracking call count. */
function makeFetcher(value, ms = 0) {
  let calls = 0;
  const fn = () => {
    calls++;
    return new Promise((resolve) => {
      setTimeout(() => resolve(value), ms);
    });
  };
  fn.calls = () => calls;
  return fn;
}

// ── useQuery — deduplication ─────────────────────────────────────────────────

describe('useQuery — deduplication', () => {
  test('concurrent calls with the same key share one request', async () => {
    const fetcher = makeFetcher('data', 10);
    const [ a, b ] = await Promise.all([
      useQuery('k1', fetcher),
      useQuery('k1', fetcher),
    ]);
    expect(a).toBe('data');
    expect(b).toBe('data');
    expect(fetcher.calls()).toBe(1);
  });

  test('sequential calls after completion do NOT dedup (they use cache)', async () => {
    const fetcher = makeFetcher('data');
    await useQuery('k2', fetcher);
    await useQuery('k2', fetcher);
    // Second call hits cache, fetcher only called once.
    expect(fetcher.calls()).toBe(1);
  });

  test('different keys fire separate requests', async () => {
    const fa = makeFetcher('a');
    const fb = makeFetcher('b');
    const [ a, b ] = await Promise.all([
      useQuery('key-a', fa),
      useQuery('key-b', fb),
    ]);
    expect(a).toBe('a');
    expect(b).toBe('b');
    expect(fa.calls()).toBe(1);
    expect(fb.calls()).toBe(1);
  });

  test('throws on empty key', () => {
    expect(() => useQuery('', () => 1)).toThrow(TypeError);
  });

  test('throws on non-function fetcher', () => {
    expect(() => useQuery('k', null)).toThrow(TypeError);
  });
});

// ── useQuery — caching ───────────────────────────────────────────────────────

describe('useQuery — caching', () => {
  test('caches result for staleTime duration', async () => {
    const fetcher = makeFetcher('cached');
    await useQuery('c1', fetcher, { staleTime: 1000 });
    // Immediate second call — should hit cache.
    const result = await useQuery('c1', fetcher, { staleTime: 1000 });
    expect(result).toBe('cached');
    expect(fetcher.calls()).toBe(1);
    expect(getQueryCacheSize()).toBe(1);
  });

  test('re-fetches after staleTime expires', async () => {
    const fetcher = makeFetcher('refreshed');
    await useQuery('c2', fetcher, { staleTime: 10 });
    expect(fetcher.calls()).toBe(1);
    // Wait for cache to expire.
    await new Promise((r) => setTimeout(r, 20));
    const result = await useQuery('c2', fetcher, { staleTime: 10 });
    expect(result).toBe('refreshed');
    expect(fetcher.calls()).toBe(2);
  });

  test('cache=false disables caching but still dedups concurrent calls', async () => {
    const fetcher = makeFetcher('no-cache', 10);
    const [ a, b ] = await Promise.all([
      useQuery('c3', fetcher, { cache: false }),
      useQuery('c3', fetcher, { cache: false }),
    ]);
    expect(a).toBe('no-cache');
    expect(b).toBe('no-cache');
    expect(fetcher.calls()).toBe(1);
    expect(getQueryCacheSize()).toBe(0);
    // Next call should re-fetch (no cache).
    await useQuery('c3', fetcher, { cache: false });
    expect(fetcher.calls()).toBe(2);
  });

  test('staleTime=0 always re-fetches', async () => {
    const fetcher = makeFetcher('fresh');
    await useQuery('c4', fetcher, { staleTime: 0 });
    await useQuery('c4', fetcher, { staleTime: 0 });
    expect(fetcher.calls()).toBe(2);
  });

  test('supports async fetcher returning a Promise', async () => {
    const fetcher = async () => {
      await Promise.resolve();
      return { items: [ 1, 2, 3 ] };
    };
    const result = await useQuery('c5', fetcher, { staleTime: 1000 });
    expect(result).toEqual({ items: [ 1, 2, 3 ] });
  });
});

// ── useQuery — error handling ────────────────────────────────────────────────

describe('useQuery — error handling', () => {
  test('fetcher rejection propagates and clears pending', async () => {
    let shouldFail = true;
    const fetcher = () => {
      if (shouldFail) {return Promise.reject(new Error('fail'));}
      return Promise.resolve('ok');
    };
    await expect(useQuery('e1', fetcher)).rejects.toThrow('fail');
    // Pending should be cleared so next call can retry.
    expect(getPendingQueryCount()).toBe(0);
    // Retry succeeds.
    shouldFail = false;
    const result = await useQuery('e1', fetcher, { staleTime: 1000 });
    expect(result).toBe('ok');
  });

  test('failed requests are not cached', async () => {
    let calls = 0;
    const fetcher = () => {
      calls++;
      return Promise.reject(new Error('err'));
    };
    await expect(useQuery('e2', fetcher)).rejects.toThrow('err');
    await expect(useQuery('e2', fetcher)).rejects.toThrow('err');
    expect(calls).toBe(2);
    expect(getQueryCacheSize()).toBe(0);
  });
});

// ── invalidateQuery ──────────────────────────────────────────────────────────

describe('invalidateQuery', () => {
  test('removes a specific cache entry', async () => {
    const fetcher = makeFetcher('v1');
    await useQuery('i1', fetcher, { staleTime: 1000 });
    expect(getQueryCacheSize()).toBe(1);
    const removed = invalidateQuery('i1');
    expect(removed).toBe(true);
    expect(getQueryCacheSize()).toBe(0);
    // Next call re-fetches.
    await useQuery('i1', fetcher, { staleTime: 1000 });
    expect(fetcher.calls()).toBe(2);
  });

  test('returns false for non-existent key', () => {
    expect(invalidateQuery('nonexistent')).toBe(false);
  });
});

// ── invalidateQueries ────────────────────────────────────────────────────────

describe('invalidateQueries', () => {
  test('clears all cache when no predicate given', async () => {
    await useQuery('a1', makeFetcher('x'), { staleTime: 1000 });
    await useQuery('a2', makeFetcher('y'), { staleTime: 1000 });
    expect(getQueryCacheSize()).toBe(2);
    const removed = invalidateQueries();
    expect(removed).toBe(2);
    expect(getQueryCacheSize()).toBe(0);
  });

  test('clears only entries matching the predicate', async () => {
    await useQuery('patients:1', makeFetcher('p1'), { staleTime: 1000 });
    await useQuery('patients:2', makeFetcher('p2'), { staleTime: 1000 });
    await useQuery('drugs:1', makeFetcher('d1'), { staleTime: 1000 });
    const removed = invalidateQueries((k) => k.startsWith('patients:'));
    expect(removed).toBe(2);
    expect(getQueryCacheSize()).toBe(1);
  });
});

// ── prefetchQuery ────────────────────────────────────────────────────────────

describe('prefetchQuery', () => {
  test('warms up the cache without blocking', async () => {
    const fetcher = makeFetcher('prefetched', 10);
    await prefetchQuery('p1', fetcher, { staleTime: 1000 });
    expect(getQueryCacheSize()).toBe(1);
    // Subsequent call hits cache.
    const fetcher2 = makeFetcher('should-not-call');
    const result = await useQuery('p1', fetcher2, { staleTime: 1000 });
    expect(result).toBe('prefetched');
    expect(fetcher2.calls()).toBe(0);
  });
});

// ── Cache eviction ───────────────────────────────────────────────────────────

describe('cache eviction', () => {
  test('removes oldest stale entries when cache exceeds limit', async () => {
    // Fill the cache with many entries in parallel.
    const promises = [];
    for (let i = 0; i < 600; i++) {
      promises.push(
        useQuery(`k${i}`, () => Promise.resolve(`v${i}`), { staleTime: 1 }),
      );
    }
    await Promise.all(promises);
    // After 600 entries, eviction should have kicked in.
    expect(getQueryCacheSize()).toBeLessThanOrEqual(500);
  });
});
