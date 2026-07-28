// SPDX-License-Identifier: MIT
/**
 * @kupola/auth — HTTP guard for request-level permission checking.
 *
 * createHttpGuard - Create an HTTP guard with interceptors
 *
 * @module http-guard
 */

import { getAuthContext } from './auth-context.js';
import { requirePermission } from './router-tools.js';

export function createHttpGuard(options = {}) {
  if (!options || typeof options !== 'object' || Array.isArray(options)) {
    throw new TypeError('[kupola/auth] createHttpGuard() expects an options object.');
  }
  const {
    beforeRequest,
    afterResponse,
    onPermissionDenied,
    onUnauthorized,
    authContext,
    timeout,
    retry = 0,
    responseType,
    throwOnHttpError = false,
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
  if (authContext !== undefined && authContext !== null
    && typeof authContext !== 'function'
    && (typeof authContext !== 'object' || Array.isArray(authContext))) {
    throw new TypeError('[kupola/auth] authContext must be a context, getter, or null.');
  }
  if (timeout !== undefined && (!Number.isFinite(Number(timeout)) || Number(timeout) < 0)) {
    throw new TypeError('[kupola/auth] timeout must be a finite non-negative number.');
  }
  assertRetryOptions(retry, 'retry');
  assertResponseType(responseType);
  if (typeof throwOnHttpError !== 'boolean') {
    throw new TypeError('[kupola/auth] throwOnHttpError must be a boolean.');
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
    if (requestConfig.requiredPermission !== undefined) {
      const context = typeof authContext === 'function' ? authContext() : authContext;
      const currentAuth = context === undefined ? getAuthContext() : context;
      const granted = requirePermission(
        currentAuth,
        requestConfig.requiredPermission,
        { match: requestConfig.permissionMatch || 'any' },
      );
      if (!granted) {
        const error = new Error('PERMISSION_DENIED');
        if (onPermissionDenied) {notify(onPermissionDenied, error, 'onPermissionDenied');}
        throw error;
      }
    }
    const fetchImpl = globalThis.fetch;
    if (typeof fetchImpl !== 'function') {
      throw new Error('[kupola/auth] fetch is not available in this environment.');
    }

    const fetchOptions = requestConfig.fetchOptions || {};
    const headers = mergeHeaders(fetchOptions.headers, requestConfig.headers);
    const hasExplicitBody = requestConfig.body !== undefined;
    const body = hasExplicitBody ? requestConfig.body : serializeBody(requestConfig.data);
    if (!hasExplicitBody && isJsonData(requestConfig.data) && !hasHeader(headers, 'content-type')) {
      headers['Content-Type'] = 'application/json';
    }
    const requestTimeout = requestConfig.timeout ?? timeout;
    if (requestTimeout !== undefined
      && (!Number.isFinite(Number(requestTimeout)) || Number(requestTimeout) < 0)) {
      throw new TypeError('[kupola/auth] request timeout must be a finite non-negative number.');
    }
    const retryOptions = normalizeRetryOptions(requestConfig.retry ?? retry, requestConfig.method);
    let response;
    let attempt = 0;
    let retrying = true;
    while (retrying) {
      try {
        response = await fetchWithTimeout(fetchImpl, requestConfig.url, {
          ...fetchOptions,
          method: requestConfig.method,
          headers,
          body,
        }, requestTimeout);
      } catch (error) {
        if (!shouldRetry(error, null, attempt, retryOptions, fetchOptions.signal)) {throw error;}
        await waitBeforeRetry(retryOptions, attempt, fetchOptions.signal);
        attempt++;
        continue;
      }

      if (!shouldRetry(null, response, attempt, retryOptions, fetchOptions.signal)) {
        retrying = false;
        break;
      }
      response.body?.cancel?.();
      await waitBeforeRetry(retryOptions, attempt, fetchOptions.signal);
      attempt++;
    }

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

    if (requestConfig.throwOnHttpError ?? throwOnHttpError) {
      if (!response.ok && (response.status === undefined || response.status < 200 || response.status >= 300)) {
        throw createHttpError(response);
      }
    }

    const requestedResponseType = requestConfig.responseType ?? responseType;
    if (requestedResponseType) {
      return parseResponse(response, requestedResponseType);
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
  if (config.requiredPermission !== undefined
    && typeof config.requiredPermission !== 'string'
    && !(Array.isArray(config.requiredPermission)
      && config.requiredPermission.every(permission => typeof permission === 'string'))) {
    throw new TypeError('[kupola/auth] requiredPermission must be a string or string array.');
  }
  if (config.permissionMatch !== undefined
    && ![ 'any', 'all' ].includes(config.permissionMatch)) {
    throw new TypeError('[kupola/auth] permissionMatch must be "any" or "all".');
  }
  if (config.timeout !== undefined
    && (!Number.isFinite(Number(config.timeout)) || Number(config.timeout) < 0)) {
    throw new TypeError('[kupola/auth] request timeout must be a finite non-negative number.');
  }
  if (config.retry !== undefined) {assertRetryOptions(config.retry, 'request retry');}
  if (config.responseType !== undefined) {assertResponseType(config.responseType);}
  if (config.throwOnHttpError !== undefined && typeof config.throwOnHttpError !== 'boolean') {
    throw new TypeError('[kupola/auth] request throwOnHttpError must be a boolean.');
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

function isJsonData(data) {
  if (data == null || typeof data !== 'object') {return false;}
  if (typeof FormData !== 'undefined' && data instanceof FormData) {return false;}
  if (typeof Blob !== 'undefined' && data instanceof Blob) {return false;}
  if (typeof URLSearchParams !== 'undefined' && data instanceof URLSearchParams) {return false;}
  if (typeof ArrayBuffer !== 'undefined'
    && (data instanceof ArrayBuffer || ArrayBuffer.isView(data))) {return false;}
  return true;
}

function mergeHeaders(...sources) {
  const result = {};
  for (const source of sources) {
    if (!source) {continue;}
    if (typeof source.forEach === 'function'
      && (typeof source !== 'object' || !Array.isArray(source))) {
      source.forEach((value, name) => { result[name] = value; });
      continue;
    }
    if (Array.isArray(source)) {
      for (const entry of source) {
        if (Array.isArray(entry) && entry.length >= 2) {result[entry[0]] = entry[1];}
      }
      continue;
    }
    if (typeof source === 'object') {
      Object.assign(result, source);
    }
  }
  return result;
}

function hasHeader(headers, name) {
  const target = name.toLowerCase();
  return Object.keys(headers).some(key => key.toLowerCase() === target);
}

function assertResponseType(value) {
  if (value !== undefined && ![ 'json', 'text', 'blob', 'arrayBuffer' ].includes(value)) {
    throw new TypeError(
      '[kupola/auth] responseType must be "json", "text", "blob", or "arrayBuffer".',
    );
  }
}

function assertRetryOptions(value, name) {
  if (value === undefined || value === false || value === 0) {return;}
  if (Number.isInteger(value) && value >= 0) {return;}
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`[kupola/auth] ${name} must be a non-negative integer or options object.`);
  }
  if (value.retries !== undefined && (!Number.isInteger(value.retries) || value.retries < 0)) {
    throw new TypeError(`[kupola/auth] ${name}.retries must be a non-negative integer.`);
  }
  if (value.delay !== undefined && (!Number.isFinite(Number(value.delay)) || Number(value.delay) < 0)) {
    throw new TypeError(`[kupola/auth] ${name}.delay must be a finite non-negative number.`);
  }
  if (value.factor !== undefined && (!Number.isFinite(Number(value.factor)) || Number(value.factor) < 1)) {
    throw new TypeError(`[kupola/auth] ${name}.factor must be at least 1.`);
  }
  if (value.statuses !== undefined && (!Array.isArray(value.statuses)
    || value.statuses.some(status => !Number.isInteger(status)))) {
    throw new TypeError(`[kupola/auth] ${name}.statuses must be an integer array.`);
  }
  if (value.methods !== undefined && (!Array.isArray(value.methods)
    || value.methods.some(method => typeof method !== 'string'))) {
    throw new TypeError(`[kupola/auth] ${name}.methods must be a string array.`);
  }
}

function normalizeRetryOptions(value, method) {
  const options = typeof value === 'number' ? { retries: value } : (value || {});
  const methods = options.methods || [ 'GET', 'HEAD', 'OPTIONS' ];
  return {
    retries: Math.max(0, Number(options.retries || 0)),
    delay: Math.max(0, Number(options.delay || 0)),
    factor: Math.max(1, Number(options.factor || 1)),
    statuses: options.statuses || [ 408, 425, 429, 500, 502, 503, 504 ],
    methods: new Set(methods.map(item => String(item).toUpperCase())),
    method: String(method).toUpperCase(),
  };
}

function shouldRetry(error, response, attempt, options, signal) {
  if (signal?.aborted || attempt >= options.retries || !options.methods.has(options.method)) {
    return false;
  }
  if (error) {return true;}
  return Boolean(response && options.statuses.includes(response.status));
}

async function waitBeforeRetry(options, attempt, signal) {
  const delay = options.delay * (options.factor ** attempt);
  if (delay <= 0) {
    if (signal?.aborted) {throw signal.reason || createAbortError();}
    return;
  }
  await new Promise((resolve, reject) => {
    let timer = setTimeout(finish, delay);
    function finish() {
      cleanup();
      resolve();
    }
    const onAbort = () => {
      clearTimeout(timer);
      cleanup();
      reject(signal.reason || createAbortError());
    };
    function cleanup() {
      signal?.removeEventListener('abort', onAbort);
      timer = null;
    }
    signal?.addEventListener('abort', onAbort, { once: true });
    if (signal?.aborted) {onAbort();}
  });
}

async function fetchWithTimeout(fetchImpl, url, options, timeout) {
  const controller = timeout > 0 && typeof AbortController === 'function'
    ? new AbortController()
    : null;
  const externalSignal = options.signal;
  let removeAbortListener = null;
  if (controller && externalSignal?.addEventListener) {
    const abort = () => controller.abort(externalSignal.reason);
    if (externalSignal.aborted) {abort();}
    else {
      externalSignal.addEventListener('abort', abort, { once: true });
      removeAbortListener = () => externalSignal.removeEventListener('abort', abort);
    }
  }
  const timer = controller ? setTimeout(
    () => controller.abort(createTimeoutError()),
    Number(timeout),
  ) : null;
  try {
    return await fetchImpl(url, {
      ...options,
      ...(controller ? { signal: controller.signal } : {}),
    });
  } finally {
    if (timer) {clearTimeout(timer);}
    removeAbortListener?.();
  }
}

function createAbortError() {
  return typeof DOMException === 'function'
    ? new DOMException('The request was aborted.', 'AbortError')
    : Object.assign(new Error('The request was aborted.'), { name: 'AbortError' });
}

function createTimeoutError() {
  return typeof DOMException === 'function'
    ? new DOMException('The request timed out.', 'TimeoutError')
    : Object.assign(new Error('The request timed out.'), { name: 'TimeoutError' });
}

function createHttpError(response) {
  const error = new Error(`HTTP request failed with status ${response.status}.`);
  error.name = 'HttpError';
  error.code = 'HTTP_ERROR';
  error.status = response.status;
  error.response = response;
  return error;
}

function parseResponse(response, responseType) {
  const parser = response?.[responseType];
  if (typeof parser !== 'function') {
    throw new TypeError(`[kupola/auth] Response does not support ${responseType}().`);
  }
  return parser.call(response);
}
