import { ref } from './data-bind.js';
import { getConfig } from './kupola-config.js';

// ============================================================
// Scheduler - 批量更新、去重、微任务调度
// ============================================================

class Scheduler {
    constructor() {
        this._queue = new Set();
        this._scheduled = false;
        this._flushDepth = 0;
        this._maxDepth = 10;
    }

    schedule(fn) {
        this._queue.add(fn);
        if (!this._scheduled) {
            this._scheduled = true;
            queueMicrotask(() => this._flush());
        }
    }

    _flush() {
        if (this._flushDepth >= this._maxDepth) {
            console.warn('[Kupola Scheduler] Max flush depth reached, possible infinite loop detected');
            this._queue.clear();
            this._scheduled = false;
            return;
        }
        const tasks = Array.from(this._queue);
        this._queue.clear();
        this._scheduled = false;
        this._flushDepth++;
        // Deduplicate: same function only runs once
        const seen = new Set();
        for (const task of tasks) {
            if (!seen.has(task)) {
                seen.add(task);
                try { task(); } catch (e) { console.error('[DependsScheduler]', e); }
            }
        }
        this._flushDepth--;
    }
}

const globalScheduler = new Scheduler();

// ============================================================
// Cache Manager - TTL + Stale-While-Revalidate
// ============================================================

class CacheEntry {
    constructor(data, ttl) {
        this.data = data;
        this.createdAt = Date.now();
        this.ttl = ttl; // ms
    }

    get isFresh() {
        return Date.now() - this.createdAt < this.ttl;
    }

    get isStale() {
        return !this.isFresh;
    }
}

class CacheManager {
    constructor() {
        this._store = new Map();
    }

    get(key) {
        const entry = this._store.get(key);
        if (!entry) return null;
        return entry;
    }

    set(key, data, ttl = 60000) {
        this._store.set(key, new CacheEntry(data, ttl));
    }

    has(key) {
        return this._store.has(key);
    }

    delete(key) {
        this._store.delete(key);
    }

    clear() {
        this._store.clear();
    }

    // Get data regardless of freshness (for stale-while-revalidate)
    getStale(key) {
        const entry = this._store.get(key);
        return entry ? entry.data : null;
    }
}

// ============================================================
// Error types
// ============================================================

class DependsError extends Error {
    constructor(message, code, cause) {
        super(message);
        this.name = 'DependsError';
        this.code = code;
        this.cause = cause;
        this.timestamp = Date.now();
    }
}

// ============================================================
// HTTP Client Plugin System
// ============================================================

// Default: native fetch. Stored as direct function reference for performance
// (avoids property lookup on every request).
let _httpClientFetch = typeof globalThis !== 'undefined' && globalThis.fetch
    ? globalThis.fetch.bind(globalThis)
    : (typeof window !== 'undefined' && window.fetch ? window.fetch.bind(window) : null);

/**
 * Configure a custom HTTP client for all useDeps/useQuery requests.
 * 
 * The client must provide a `fetch` function that returns a Response-like object:
 * { ok: boolean, status: number, headers: object, json(): Promise, text(): Promise }
 * 
 * @param {Object} client - HTTP client object
 * @param {Function} client.fetch - fetch function (url, options) => Promise<Response>
 * 
 * @example
 * // Use Axios
 * import { configureHttpClient } from 'kupola';
 * import { createAxiosAdapter } from 'kupola/adapters/axios';
 * import axios from 'axios';
 * configureHttpClient(createAxiosAdapter(axios));
 */
export function configureHttpClient(client) {
    if (!client || typeof client.fetch !== 'function') {
        throw new TypeError('[Kupola] configureHttpClient: client must provide a fetch function');
    }
    _httpClientFetch = client.fetch.bind(client);
}

/**
 * Get the current HTTP client fetch function.
 * @returns {Function}
 */
export function getHttpClient() {
    return _httpClientFetch;
}

/**
 * Reset HTTP client to native fetch (useful for testing).
 */
export function resetHttpClient() {
    _httpClientFetch = typeof globalThis !== 'undefined' && globalThis.fetch
        ? globalThis.fetch.bind(globalThis)
        : (typeof window !== 'undefined' && window.fetch ? window.fetch.bind(window) : null);
}

// ============================================================
// Data Source Adapters
// ============================================================

class DependsSource {
    constructor(config, cacheManager) {
        this.config = config;
        this.cacheKey = config.cacheKey || String(config.source);
        this.staleTime = config.staleTime ?? 60000;
        this.cache = cacheManager;
        this.subscribers = [];
        this.pending = null;
        this.retryCount = config.retry ?? 0;
        this.retryDelay = config.retryDelay ?? 1000;
        this.onError = config.onError || null;
    }

    subscribe(callback) {
        this.subscribers.push(callback);
        return () => {
            const idx = this.subscribers.indexOf(callback);
            if (idx > -1) this.subscribers.splice(idx, 1);
        };
    }

    notify() {
        // Use scheduler to batch notifications
        globalScheduler.schedule(() => {
            this.subscribers.forEach(cb => {
                try { cb(); } catch (e) { console.error('[DependsSource.notify]', e); }
            });
        });
    }

    async fetch(params) {
        throw new DependsError('Source fetch not implemented', 'NOT_IMPLEMENTED');
    }

    async getValue(params) {
        // 1. Check fresh cache
        const cached = this.cache.get(this.cacheKey);
        if (cached && cached.isFresh) {
            return cached.data;
        }

        // 2. Stale-while-revalidate: return stale data immediately, re-fetch in background
        if (cached && cached.isStale) {
            this._revalidate(params); // fire and forget
            return cached.data;
        }

        // 3. No cache - fetch with retry
        return this._fetchWithRetry(params);
    }

    async _fetchWithRetry(params, attempt = 0) {
        try {
            const result = await this.fetch(params);
            this.cache.set(this.cacheKey, result, this.staleTime);
            this.notify();
            return result;
        } catch (error) {
            if (attempt < this.retryCount) {
                // Exponential backoff + random jitter to prevent thundering herd
                const baseDelay = this.retryDelay * Math.pow(2, attempt);
                const jitter = Math.random() * baseDelay * 0.5;
                const delay = baseDelay + jitter;
                await new Promise(resolve => setTimeout(resolve, delay));
                return this._fetchWithRetry(params, attempt + 1);
            }
            const depError = error instanceof DependsError
                ? error
                : new DependsError(error.message || 'Fetch failed', 'FETCH_ERROR', error);
            if (this.onError) {
                try { this.onError(depError); } catch (_) { /* ignore handler errors */ }
            }
            throw depError;
        }
    }

    async _revalidate(params) {
        try {
            await this._fetchWithRetry(params);
        } catch (_) {
            // Silently fail for background revalidation
        }
    }

    invalidate() {
        this.cache.delete(this.cacheKey);
        this.pending = null;
    }

    destroy() {
        this.subscribers = [];
        this.pending = null;
    }
}

// --- HTTP Source ---
class FetchedSource extends DependsSource {
    constructor(config, cacheManager) {
        super(config, cacheManager);
        this.method = config.method || 'GET';
        this.headers = config.headers || {};
        this.queryParams = config.query || {};
    }

    async fetch(params) {
        let url = this.config.source;
        const httpConfig = getConfig('http');
        
        if (httpConfig?.baseURL && !url.startsWith('http://') && !url.startsWith('https://')) {
            url = httpConfig.baseURL + url.replace(/^\//, '');
        }

        // Replace path params (:id -> value)
        for (const key in params) {
            url = url.replace(`:${key}`, encodeURIComponent(params[key]));
        }

        // Build query string
        const queryParts = [];
        for (const [k, v] of Object.entries(this.queryParams || {})) {
            queryParts.push(`${encodeURIComponent(k)}=${encodeURIComponent(v)}`);
        }
        for (const key in params) {
            if (!this.config.source.includes(`:${key}`)) {
                queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`);
            }
        }
        if (queryParts.length > 0) {
            url += (url.includes('?') ? '&' : '?') + queryParts.join('&');
        }

        const globalHeaders = httpConfig?.headers || {};
        const fetchOptions = {
            method: this.method.toUpperCase(),
            headers: { 'Content-Type': 'application/json', ...globalHeaders, ...this.headers }
        };

        if (httpConfig?.withCredentials) {
            fetchOptions.credentials = 'include';
        }

        if (['POST', 'PUT', 'PATCH'].includes(fetchOptions.method)) {
            fetchOptions.body = JSON.stringify(params);
        }

        // Use configurable HTTP client (defaults to native fetch)
        const clientFetch = _httpClientFetch;
        if (!clientFetch) {
            throw new DependsError('No HTTP client available. Use configureHttpClient() to set one.', 'NO_HTTP_CLIENT');
        }

        const response = await clientFetch(url, fetchOptions);

        // Normalize response: support both native Response and adapter format
        const ok = typeof response.ok === 'boolean' ? response.ok : (response.status >= 200 && response.status < 300);
        const status = typeof response.status === 'number' ? response.status : 0;

        if (!ok) {
            throw new DependsError(`HTTP ${status}`, 'HTTP_ERROR');
        }

        // Support both .json() method and plain objects (for adapters that pre-parse)
        const data = typeof response.json === 'function'
            ? await response.json()
            : response.data !== undefined ? response.data : response;
        return data;
    }
}

// --- localStorage Source ---
class StorageSource extends DependsSource {
    constructor(config, cacheManager) {
        super(config, cacheManager);
        this.storageKey = config.source.replace('localStorage:', '');
        this.defaultValue = config.default;
        this.sync = config.sync !== false; // multi-tab sync by default

        if (this.sync && typeof window !== 'undefined') {
            this._storageHandler = (e) => {
                if (e.key === this.storageKey) {
                    this.cache.delete(this.cacheKey);
                    this.notify();
                }
            };
            window.addEventListener('storage', this._storageHandler);
        }
    }

    async fetch() {
        try {
            const value = localStorage.getItem(this.storageKey);
            if (value === null) return this.defaultValue;
            // Try to parse JSON
            try { return JSON.parse(value); } catch (_) { return value; }
        } catch (e) {
            return this.defaultValue;
        }
    }

    setValue(value) {
        const serialized = typeof value === 'string' ? value : JSON.stringify(value);
        localStorage.setItem(this.storageKey, serialized);
        this.cache.delete(this.cacheKey);
        this.notify();
    }

    destroy() {
        super.destroy();
        if (this._storageHandler) {
            window.removeEventListener('storage', this._storageHandler);
        }
    }
}

// --- Route Source ---
class RouteSource extends DependsSource {
    constructor(config, cacheManager) {
        super(config, cacheManager);
        this.paramName = config.source.replace('route:', '');
    }

    async fetch() {
        if (typeof window === 'undefined') return '';
        // Support both hash and history mode
        const hash = location.hash.slice(1);
        const match = hash.match(new RegExp(`/${this.paramName}/([^/]+)`));
        if (match) return decodeURIComponent(match[1]);

        // Fallback to search params
        const urlParams = new URLSearchParams(location.search);
        return urlParams.get(this.paramName) || '';
    }
}

// --- Function Source ---
class FunctionSource extends DependsSource {
    async fetch(params) {
        const result = await this.config.source(params);
        return result;
    }
}

// --- Static Source ---
class StaticSource extends DependsSource {
    async fetch() {
        return this.config.source;
    }
}

// --- WebSocket Source ---
class WebSocketSource extends DependsSource {
    constructor(config, cacheManager) {
        super(config, cacheManager);
        this.ws = null;
        this.reconnect = config.reconnect !== false;
        this.reconnectDelay = config.reconnectDelay || 3000;
        this._reconnectAttempt = 0;
        this._maxReconnectDelay = config.maxReconnectDelay || 30000;
        this.messageHandler = null;
        this._connected = false;
        this._destroyed = false;
    }

    async fetch() {
        return new Promise((resolve, reject) => {
            try {
                this.ws = new WebSocket(this.config.source);

                this.ws.onopen = () => {
                    this._connected = true;
                    this._reconnectAttempt = 0; // Reset on successful connection
                    // Resolve with current cached data or null
                    resolve(this.cache.getStale(this.cacheKey));
                };

                this.messageHandler = (event) => {
                    let data;
                    try { data = JSON.parse(event.data); } catch (_) { data = event.data; }
                    this.cache.set(this.cacheKey, data, this.staleTime);
                    this.notify();
                };

                this.ws.onmessage = this.messageHandler;

                this.ws.onerror = (error) => {
                    if (!this._connected) {
                        reject(new DependsError('WebSocket connection failed', 'WS_ERROR', error));
                    }
                };

                this.ws.onclose = () => {
                    this._connected = false;
                    if (this.reconnect && !this._destroyed) {
                        // Exponential backoff + jitter for reconnection
                        const baseDelay = this.reconnectDelay * Math.pow(2, this._reconnectAttempt);
                        const jitter = Math.random() * baseDelay * 0.3;
                        const delay = Math.min(baseDelay + jitter, this._maxReconnectDelay);
                        this._reconnectAttempt++;
                        setTimeout(() => {
                            if (!this._destroyed) this.fetch().catch(() => {});
                        }, delay);
                    }
                };
            } catch (e) {
                reject(new DependsError('WebSocket creation failed', 'WS_ERROR', e));
            }
        });
    }

    send(data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(typeof data === 'string' ? data : JSON.stringify(data));
        }
    }

    destroy() {
        this._destroyed = true;
        super.destroy();
        if (this.ws) {
            this.ws.onmessage = null;
            this.ws.onclose = null;
            this.ws.close();
            this.ws = null;
        }
    }
}

// ============================================================
// Source Factory
// ============================================================

function createSource(config, cacheManager) {
    const source = config.source;
    if (typeof source === 'function') {
        return new FunctionSource(config, cacheManager);
    } else if (typeof source === 'string' && (source.startsWith('ws://') || source.startsWith('wss://'))) {
        return new WebSocketSource(config, cacheManager);
    } else if (typeof source === 'string' && (source.startsWith('/') || source.startsWith('http'))) {
        return new FetchedSource(config, cacheManager);
    } else if (typeof source === 'string' && source.startsWith('localStorage:')) {
        return new StorageSource(config, cacheManager);
    } else if (typeof source === 'string' && source.startsWith('route:')) {
        return new RouteSource(config, cacheManager);
    } else {
        return new StaticSource(config, cacheManager);
    }
}

// ============================================================
// useDeps - Core API
// ============================================================

export function useDeps(props, depsConfig) {
    const result = {};
    const cacheManager = new CacheManager();
    const unsubscribers = [];

    for (const key in depsConfig) {
        let config = depsConfig[key];
        if (typeof config === 'string') {
            config = { source: config };
        }

        const depConfig = {
            ...config,
            cacheKey: config.cacheKey || `${key}-${JSON.stringify(_extractPropValues(props))}`
        };

        const source = createSource(depConfig, cacheManager);
        const data = ref(null);
        const loading = ref(true);
        const error = ref(null);
        const lastUpdated = ref(null);
        let _loadId = 0; // dedup concurrent loads

        function getParams() {
            return _extractPropValues(props);
        }

        async function load() {
            const thisLoadId = ++_loadId;
            loading.value = true;
            error.value = null;
            try {
                const value = await source.getValue(getParams());
                if (thisLoadId !== _loadId) return; // stale load
                data.value = value;
                lastUpdated.value = Date.now();
            } catch (e) {
                if (thisLoadId !== _loadId) return;
                error.value = e.message || 'Unknown error';
            } finally {
                if (thisLoadId === _loadId) {
                    loading.value = false;
                }
            }
        }

        // Initial load
        load();

        // Subscribe to source notifications (e.g. WebSocket messages, storage events)
        const unsubscribeSource = source.subscribe(() => {
            const cached = cacheManager.getStale(source.cacheKey);
            if (cached !== null && cached !== undefined) {
                data.value = cached;
                lastUpdated.value = Date.now();
            }
        });
        unsubscribers.push(unsubscribeSource);

        // Watch prop changes -> invalidate & reload
        // Use direct ref subscription (works outside setup context)
        const propKeys = Object.keys(props);
        if (propKeys.length > 0) {
            propKeys.forEach(k => {
                const prop = props[k];
                if (prop && typeof prop === 'object' && 'value' in prop && prop._subscribers) {
                    const handler = () => {
                        source.invalidate();
                        load();
                    };
                    prop._subscribers.add(handler);
                    unsubscribers.push(() => prop._subscribers.delete(handler));
                }
            });
        }

        result[key] = {
            data,
            loading,
            error,
            lastUpdated,
            refresh() {
                source.invalidate();
                return load();
            },
            // For StorageSource
            setValue(value) {
                if (source instanceof StorageSource) {
                    source.setValue(value);
                    // Also update data ref immediately
                    data.value = value;
                }
            },
            // For WebSocketSource
            send(msg) {
                if (source instanceof WebSocketSource) {
                    source.send(msg);
                }
            },
            _source: source
        };
    }

    // Cleanup helper
    result._dispose = () => {
        unsubscribers.forEach(fn => fn());
        // Remove from DevTools tracking
        if (window.__kupolaDepInstances) {
            const idx = window.__kupolaDepInstances.indexOf(result);
            if (idx !== -1) window.__kupolaDepInstances.splice(idx, 1);
        }
    };

    // Register for DevTools tracking
    if (!window.__kupolaDepInstances) window.__kupolaDepInstances = [];
    window.__kupolaDepInstances.push(result);

    return result;
}

// ============================================================
// useQuery - Single dependency convenience API
// ============================================================

export function useQuery(config) {
    const cacheManager = new CacheManager();
    const source = createSource(config, cacheManager);
    const data = ref(null);
    const loading = ref(true);
    const error = ref(null);
    let _loadId = 0;

    async function load() {
        const thisLoadId = ++_loadId;
        loading.value = true;
        error.value = null;
        try {
            const value = await source.getValue(config.params || {});
            if (thisLoadId !== _loadId) return;
            data.value = value;
        } catch (e) {
            if (thisLoadId !== _loadId) return;
            error.value = e.message || 'Unknown error';
        } finally {
            if (thisLoadId === _loadId) loading.value = false;
        }
    }

    // Load immediately (works outside setup context)
    load();

    source.subscribe(() => {
        const cached = cacheManager.getStale(source.cacheKey);
        if (cached !== null && cached !== undefined) {
            data.value = cached;
        }
    });

    return {
        data,
        loading,
        error,
        refresh() {
            source.invalidate();
            return load();
        }
    };
}

// ============================================================
// Utilities
// ============================================================

function _extractPropValues(props) {
    const result = {};
    for (const key in props) {
        const value = props[key];
        if (value && typeof value === 'object' && 'value' in value) {
            result[key] = value.value;
        } else {
            result[key] = value;
        }
    }
    return result;
}

export function clearCache() {
    // Global cache clear is no longer applicable; each useDeps has its own cache
}

// ============================================================
// Exports
// ============================================================

export {
    Scheduler,
    CacheManager,
    CacheEntry,
    DependsError,
    DependsSource,
    FetchedSource,
    StorageSource,
    RouteSource,
    FunctionSource,
    StaticSource,
    WebSocketSource,
    createSource
};

// HTTP Client Plugin System exports are above (configureHttpClient, getHttpClient, resetHttpClient)
