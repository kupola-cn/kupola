/**
 * @navios/http adapter for Kupola HTTP client plugin system.
 * 
 * Allows using @navios/http (with interceptors, custom config, etc.) as the HTTP
 * client for all useDeps() / useQuery() requests.
 * 
 * @navios/http is a lightweight, fetch-based axios replacement that supports
 * interceptors, multiple response types, and works with Next.js / RSC.
 * 
 * @module adapters/navios-http
 * 
 * @example
 * import { configureHttpClient } from 'kupola';
 * import { createNaviosAdapter } from 'kupola/adapters/navios-http';
 * import { create } from '@navios/http';
 * 
 * const client = create({ baseURL: '/api' });
 * 
 * // @navios/http interceptors work as expected
 * client.interceptors.request.use((config) => {
 *   config.headers['Authorization'] = `Bearer ${getToken()}`;
 *   return config;
 * });
 * 
 * configureHttpClient(createNaviosAdapter(client));
 */

/**
 * Create a Kupola-compatible HTTP client from a @navios/http instance.
 * 
 * Translates Kupola's fetch-style calls into @navios/http requests,
 * and maps @navios/http responses back to Kupola's standard format:
 * { ok, status, statusText, headers, url, json(), text() }
 * 
 * @param {Object} naviosClient - A @navios/http client instance (from create() or default import)
 *   Must expose: .request(config), .get(url, config), .post(url, data, config), etc.
 * @param {Object} [options] - Additional @navios/http request config merged into every request.
 *   Supports all @navios/http requestConfig fields:
 *   - responseType {string}: 'json' | 'text' | 'blob' | 'arrayBuffer' | 'formData' | 'stream'
 *   - validateStatus {Function}: custom status validator, e.g. () => true
 *   - credentials {string}: 'omit' | 'same-origin' | 'include'
 *   - params {Object|URLSearchParams}: URL search parameters
 * @returns {{ fetch: Function }} Kupola HTTP client object
 */
export function createNaviosAdapter(naviosClient, options = {}) {
    if (!naviosClient || typeof naviosClient.request !== 'function') {
        throw new TypeError('[Kupola] createNaviosAdapter: invalid @navios/http client (must have .request method)');
    }

    return {
        /**
         * Fetch function compatible with Kupola's HTTP client interface.
         * Translates Fetch API semantics to @navios/http, and response back to
         * Fetch API Response shape.
         * 
         * @param {string} url - Request URL
         * @param {Object} [fetchOptions] - Fetch-style options
         * @param {string} [fetchOptions.method='GET'] - HTTP method
         * @param {Object} [fetchOptions.headers] - Request headers
         * @param {string} [fetchOptions.body] - Request body (JSON string)
         * @returns {Promise<Object>} Response-like object { ok, status, headers, json(), text() }
         */
        fetch: async function (url, fetchOptions = {}) {
            const method = (fetchOptions.method || 'GET').toUpperCase();

            // Build request config for @navios/http
            // Note: @navios/http uses `data` for body (axios-style), not `body` (fetch-style)
            const requestConfig = {
                url,
                method,
                headers: fetchOptions.headers || {},
                // Accept all status codes here; Kupola handles ok/status checking itself
                validateStatus: () => true,
                ...options
            };

            // Parse body if present (Fetch sends body as JSON string,
            // but @navios/http accepts objects directly as `data`)
            if (fetchOptions.body && ['POST', 'PUT', 'PATCH'].includes(method)) {
                try {
                    requestConfig.data = JSON.parse(fetchOptions.body);
                } catch (_) {
                    requestConfig.data = fetchOptions.body;
                }
            }

            try {
                const response = await naviosClient.request(requestConfig);

                // Cache the parsed data to avoid re-parsing on multiple .json() calls
                let _cachedData;
                let _dataParsed = false;

                return {
                    ok: response.status >= 200 && response.status < 300,
                    status: response.status,
                    statusText: response.statusText || '',
                    headers: response.headers || {},
                    url,

                    json() {
                        if (!_dataParsed) {
                            _cachedData = response.data;
                            _dataParsed = true;
                        }
                        return Promise.resolve(_cachedData);
                    },

                    text() {
                        if (!_dataParsed) {
                            _cachedData = typeof response.data === 'string'
                                ? response.data
                                : JSON.stringify(response.data);
                            _dataParsed = true;
                        }
                        return Promise.resolve(_cachedData);
                    }
                };
            } catch (error) {
                // Network error or interceptor rejection.
                // @navios/http error shape: { message, response?: { status, headers, data }, config }
                const errStatus = (error.response && error.response.status) || 0;
                const errHeaders = (error.response && error.response.headers) || {};

                return {
                    ok: false,
                    status: errStatus,
                    statusText: error.message || 'Network Error',
                    headers: errHeaders,
                    url,

                    json() {
                        // Try to return structured error data if available
                        if (error.response && error.response.data !== undefined) {
                            return Promise.resolve(error.response.data);
                        }
                        return Promise.resolve({ error: error.message });
                    },

                    text() {
                        if (error.response && error.response.data !== undefined) {
                            const d = error.response.data;
                            return Promise.resolve(typeof d === 'string' ? d : JSON.stringify(d));
                        }
                        return Promise.resolve(error.message);
                    }
                };
            }
        }
    };
}
