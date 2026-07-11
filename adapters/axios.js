/**
 * Axios adapter for Kupola HTTP client plugin system.
 * 
 * Allows using Axios (with interceptors, custom config, etc.) as the HTTP
 * client for all useDeps() / useQuery() requests.
 * 
 * @module adapters/axios
 * 
 * @example
 * import { configureHttpClient } from 'kupola';
 * import { createAxiosAdapter } from 'kupola/adapters/axios';
 * import axios from 'axios';
 * 
 * const api = axios.create({ baseURL: '/api', timeout: 10000 });
 * 
 * // Axios interceptors work as expected
 * api.interceptors.request.use(config => {
 *   config.headers.Authorization = `Bearer ${getToken()}`;
 *   return config;
 * });
 * 
 * configureHttpClient(createAxiosAdapter(api));
 */

/**
 * Create a Kupola-compatible HTTP client from an Axios instance.
 * 
 * @param {Object} axiosInstance - An Axios instance (from axios.create() or default axios)
 * @param {Object} [options] - Additional Axios request config to merge into every request
 * @returns {{ fetch: Function }} Kupola HTTP client object
 */
export function createAxiosAdapter(axiosInstance, options = {}) {
    if (!axiosInstance || typeof axiosInstance.request !== 'function') {
        throw new TypeError('[Kupola] createAxiosAdapter: invalid Axios instance (must have .request method)');
    }

    return {
        /**
         * Fetch function compatible with Kupola's HTTP client interface.
         * Translates Fetch API semantics to Axios, and Axios response back to
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
            // Build Axios config
            const axiosConfig = {
                url,
                method: (fetchOptions.method || 'GET').toLowerCase(),
                headers: fetchOptions.headers || {},
                // Don't throw on non-2xx — let Kupola handle error status
                validateStatus: () => true,
                ...options
            };

            // Parse body if present (Fetch sends body as JSON string)
            if (fetchOptions.body) {
                try {
                    axiosConfig.data = JSON.parse(fetchOptions.body);
                } catch (_) {
                    axiosConfig.data = fetchOptions.body;
                }
            }

            try {
                const response = await axiosInstance.request(axiosConfig);

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
                // Network error or request was blocked
                return {
                    ok: false,
                    status: 0,
                    statusText: error.message || 'Network Error',
                    headers: {},
                    url,

                    json() {
                        return Promise.resolve({ error: error.message });
                    },

                    text() {
                        return Promise.resolve(error.message);
                    }
                };
            }
        }
    };
}
