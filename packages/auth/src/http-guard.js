// SPDX-License-Identifier: MIT
/**
 * @kupola/auth — HTTP guard for request-level permission checking.
 *
 * createHttpGuard - Create an HTTP guard with interceptors
 *
 * @module http-guard
 */

export function createHttpGuard(options = {}) {
  if (!options || typeof options !== 'object' || Array.isArray(options)) {
    throw new TypeError('[kupola/auth] createHttpGuard() expects an options object.');
  }
  const {
    beforeRequest,
    afterResponse,
    onPermissionDenied,
    onUnauthorized,
    interceptors = {},
  } = options;

  if (!interceptors || typeof interceptors !== 'object' || Array.isArray(interceptors)) {
    throw new TypeError('[kupola/auth] HTTP interceptors must be an object.');
  }
  if (interceptors.request !== undefined && !Array.isArray(interceptors.request)) {
    throw new TypeError('[kupola/auth] request interceptors must be an array.');
  }
  if (interceptors.response !== undefined && !Array.isArray(interceptors.response)) {
    throw new TypeError('[kupola/auth] response interceptors must be an array.');
  }
  const requestInterceptors = [ ...(interceptors.request || []) ];
  const responseInterceptors = [ ...(interceptors.response || []) ];

  if ([ ...requestInterceptors, ...responseInterceptors ].some(
    interceptor => typeof interceptor !== 'function',
  )) {
    throw new TypeError('[kupola/auth] HTTP interceptors must be functions.');
  }
  if (beforeRequest !== undefined && typeof beforeRequest !== 'function') {
    throw new TypeError('[kupola/auth] beforeRequest must be a function.');
  }
  if (afterResponse !== undefined && typeof afterResponse !== 'function') {
    throw new TypeError('[kupola/auth] afterResponse must be a function.');
  }
  if (onPermissionDenied !== undefined && typeof onPermissionDenied !== 'function') {
    throw new TypeError('[kupola/auth] onPermissionDenied must be a function.');
  }
  if (onUnauthorized !== undefined && typeof onUnauthorized !== 'function') {
    throw new TypeError('[kupola/auth] onUnauthorized must be a function.');
  }

  if (beforeRequest) {
    requestInterceptors.push(beforeRequest);
  }

  if (afterResponse) {
    responseInterceptors.push(afterResponse);
  }

  async function _request(method, url, data, config = {}) {
    if (config !== undefined
      && (typeof config !== 'object' || Array.isArray(config))) {
      throw new TypeError('[kupola/auth] HTTP request config must be an object.');
    }

    let requestConfig = {
      method,
      url,
      data,
      ...config,
    };

    for (const interceptor of requestInterceptors) {
      try {
        const result = await interceptor(requestConfig);
        if (result !== undefined) {
          assertRequestConfig(result);
          requestConfig = result;
        }
      } catch (error) {
        if (onPermissionDenied && error?.message === 'PERMISSION_DENIED') {
          notify(onPermissionDenied, error, 'onPermissionDenied');
        }
        throw error;
      }
    }

    assertRequestConfig(requestConfig);
    const fetchImpl = globalThis.fetch;
    if (typeof fetchImpl !== 'function') {
      throw new Error('[kupola/auth] fetch is not available in this environment.');
    }

    const fetchOptions = requestConfig.fetchOptions || {};
    const headers = {
      ...(fetchOptions.headers || {}),
      ...(requestConfig.headers || {}),
    };
    let response = await fetchImpl(requestConfig.url, {
      ...fetchOptions,
      method: requestConfig.method,
      headers,
      body: requestConfig.body !== undefined
        ? requestConfig.body
        : serializeBody(requestConfig.data),
    });

    for (const interceptor of responseInterceptors) {
      try {
        const result = await interceptor(response);
        if (result !== undefined) {
          assertResponse(result);
          response = result;
        }
      } catch (error) {
        if (onUnauthorized && response?.status === 401) {
          notify(onUnauthorized, error, 'onUnauthorized');
        } else if (onPermissionDenied && response?.status === 403) {
          notify(onPermissionDenied, error, 'onPermissionDenied');
        }
        throw error;
      }
    }

    assertResponse(response);
    if (response.status === 401 && onUnauthorized) {
      notify(onUnauthorized, new Error('UNAUTHORIZED'), 'onUnauthorized');
    } else if (response.status === 403 && onPermissionDenied) {
      notify(onPermissionDenied, new Error('PERMISSION_DENIED'), 'onPermissionDenied');
    }

    return response;
  }

  return {
    get: (url, config) => _request('GET', url, null, config),
    post: (url, data, config) => _request('POST', url, data, config),
    put: (url, data, config) => _request('PUT', url, data, config),
    patch: (url, data, config) => _request('PATCH', url, data, config),
    delete: (url, config) => _request('DELETE', url, null, config),
    request: _request,
  };
}

function assertRequestConfig(config) {
  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    throw new TypeError('[kupola/auth] Request interceptor must return an object or undefined.');
  }
  if (typeof config.url !== 'string' || config.url.length === 0) {
    throw new TypeError('[kupola/auth] HTTP request URL must be a non-empty string.');
  }
  if (typeof config.method !== 'string' || config.method.length === 0) {
    throw new TypeError('[kupola/auth] HTTP request method must be a non-empty string.');
  }
  if (config.fetchOptions !== undefined && (!config.fetchOptions
    || typeof config.fetchOptions !== 'object' || Array.isArray(config.fetchOptions))) {
    throw new TypeError('[kupola/auth] fetchOptions must be an object.');
  }
}

function assertResponse(response) {
  if (!response || (typeof response !== 'object' && typeof response !== 'function')) {
    throw new TypeError('[kupola/auth] Response interceptor must return a response object or undefined.');
  }
}

function notify(callback, error, name) {
  try {
    callback(error);
  } catch (callbackError) {
    if (typeof console !== 'undefined' && typeof console.error === 'function') {
      console.error(`[kupola/auth] ${name} callback failed:`, callbackError);
    }
  }
}

function serializeBody(data) {
  if (data == null || typeof data === 'string') {return data == null ? undefined : data;}
  if (typeof FormData !== 'undefined' && data instanceof FormData) {return data;}
  if (typeof Blob !== 'undefined' && data instanceof Blob) {return data;}
  if (typeof URLSearchParams !== 'undefined' && data instanceof URLSearchParams) {
    return data;
  }
  if (typeof ArrayBuffer !== 'undefined'
    && (data instanceof ArrayBuffer || ArrayBuffer.isView(data))) {
    return data;
  }
  return JSON.stringify(data);
}
