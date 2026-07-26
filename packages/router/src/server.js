// SPDX-License-Identifier: MIT
/**
 * @kupola/router — Server-side routing utilities.
 *
 * @module server
 */

import { flattenRoutes, matchRoute, resolvePath } from './matcher.js';

/**
 * Match route on server side.
 * @param {Array} routes - Route configuration array
 * @param {string} path - Path to match
 * @param {Object} [options={}] - Match options
 * @param {Object} [options.query={}] - Query parameters
 * @returns {Object|null} Matched route
 */
export function matchRouteServer(routes, path, options = {}) {
  const { query = {} } = options;
  const records = flattenRoutes(routes);
  return matchRoute(records, path, query);
}

export function createServerRouter(options) {
  const { routes } = options;
  const records = flattenRoutes(routes);

  return {
    match(path, query = {}) {
      return matchRoute(records, path, query);
    },

    resolve(to) {
      const path = resolvePath(records, to);
      const search = new URLSearchParams(to?.query || {}).toString();
      return search ? `${path}?${search}` : path;
    },

    get records() {
      return records;
    },
  };
}
