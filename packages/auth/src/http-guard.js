// SPDX-License-Identifier: MIT
/**
 * @kupola/auth — HTTP guard for request-level permission checking.
 *
 * createHttpGuard - Create an HTTP guard with interceptors
 *
 * @module http-guard
 */

export function createHttpGuard(options = {}) {
  const {
    beforeRequest,
    afterResponse,
    onPermissionDenied,
    onUnauthorized,
    interceptors = {},
  } = options;

  const requestInterceptors = [...(interceptors.request || [])];
  const responseInterceptors = [...(interceptors.response || [])];

  if (beforeRequest) {
    requestInterceptors.push(beforeRequest);
  }

  if (afterResponse) {
    responseInterceptors.push(afterResponse);
  }

  async function _request(method, url, data, config = {}) {
    let requestConfig = {
      method,
      url,
      data,
      ...config,
    };

    for (const interceptor of requestInterceptors) {
      try {
        const result = interceptor(requestConfig);
        if (result !== undefined) {
          requestConfig = result;
        }
      } catch (error) {
        if (onPermissionDenied && error.message === 'PERMISSION_DENIED') {
          onPermissionDenied(error);
        }
        throw error;
      }
    }

    let response;
    try {
      response = await fetch(requestConfig.url, {
        method: requestConfig.method,
        headers: requestConfig.headers || {},
        body: requestConfig.data ? JSON.stringify(requestConfig.data) : undefined,
        ...requestConfig.fetchOptions,
      });
    } catch (error) {
      throw error;
    }

    for (const interceptor of responseInterceptors) {
      try {
        const result = interceptor(response);
        if (result !== undefined) {
          response = result;
        }
      } catch (error) {
        if (onUnauthorized && response.status === 401) {
          onUnauthorized(error);
        } else if (onPermissionDenied && response.status === 403) {
          onPermissionDenied(error);
        }
        throw error;
      }
    }

    if (response.status === 401 && onUnauthorized) {
      onUnauthorized(new Error('UNAUTHORIZED'));
    } else if (response.status === 403 && onPermissionDenied) {
      onPermissionDenied(new Error('PERMISSION_DENIED'));
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