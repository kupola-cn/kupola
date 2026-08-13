// SPDX-License-Identifier: MIT
/**
 * @kupola/router — Route matching utilities.
 *
 * @module matcher
 */

/**
 * Create a route record from route configuration.
 * @param {Object} route - Route configuration
 * @param {string} [parentPath=''] - Parent route path
 * @returns {Object} Route record
 */
export function createRouteRecord(route, parentPath = '') {
  assertRouteConfig(route);
  const fullPath = parentPath ? `${parentPath}/${route.path}` : route.path;

  const normalizedPath = fullPath
    .replace(/\/+/g, '/')
    .replace(/\/$/, '') || '/';

  const paramNames = [];
  const tokenPattern = /:(\w+)\?|:(\w+)|\*/g;
  let cursor = 0;
  let regexPattern = '';
  let token;

  while ((token = tokenPattern.exec(normalizedPath))) {
    const staticPart = normalizedPath.slice(cursor, token.index);
    const tokenText = token[0];

    if (tokenText.startsWith(':') && tokenText.endsWith('?')) {
      const name = token[1];
      paramNames.push(name);
      if (staticPart.endsWith('/')) {
        regexPattern += `${_escapeRegex(staticPart.slice(0, -1))}(?:/([^/]+))?`;
      } else {
        regexPattern += `${_escapeRegex(staticPart)}([^/]*)?`;
      }
    } else if (tokenText.startsWith(':')) {
      regexPattern += `${_escapeRegex(staticPart)}([^/]+)`;
      paramNames.push(token[2]);
    } else {
      regexPattern += `${_escapeRegex(staticPart)}.*`;
    }

    cursor = token.index + tokenText.length;
  }

  regexPattern += _escapeRegex(normalizedPath.slice(cursor));

  const regex = new RegExp(`^${regexPattern}$`);

  return {
    path: normalizedPath,
    name: route.name,
    component: route.component,
    components: route.components,
    children: route.children || [],
    meta: route.meta || {},
    paramsSchema: route.params || null,
    beforeEnter: route.beforeEnter,
    beforeLeave: route.beforeLeave,
    transition: route.transition,
    regex,
    paramNames,
    specificity: normalizedPath.split('/').filter(Boolean).map(segment => {
      if (segment === '*') {return 0;}
      if (segment.startsWith(':')) {return 2;}
      return 3;
    }),
  };
}

function _escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function _decodeParam(value) {
  try {return decodeURIComponent(value);}
  catch {return value;}
}

/**
 * Convert a raw string param according to a schema type.
 * Supported types: 'string' (default), 'number', 'boolean', 'json',
 * or a custom parse function `(raw: string) => any`.
 * @param {string} raw
 * @param {string|Function} [type]
 * @returns {*}
 */
function _convertParam(raw, type) {
  if (!type || type === 'string') {return raw;}
  if (typeof type === 'function') {return type(raw);}
  switch (type) {
  case 'number': {
    const num = Number(raw);
    return Number.isNaN(num) ? null : num;
  }
  case 'boolean':
    return raw === 'true' || raw === '1';
  case 'json':
    try {return JSON.parse(raw);} catch {return null;}
  default:
    return raw;
  }
}

function _compareSpecificity(left, right) {
  const leftScore = left.specificity || [];
  const rightScore = right.specificity || [];
  const length = Math.max(leftScore.length, rightScore.length);
  for (let index = 0; index < length; index++) {
    const difference = (leftScore[index] || 0) - (rightScore[index] || 0);
    if (difference !== 0) {return difference;}
  }
  return 0;
}

export function stringifyQuery(query = {}) {
  const params = new URLSearchParams();
  if (query instanceof URLSearchParams) {
    query.forEach((value, key) => params.append(key, value));
    return params.toString();
  }
  if (!query || typeof query !== 'object') {return '';}
  for (const [ key, value ] of Object.entries(query)) {
    if (value === undefined || value === null) {continue;}
    const values = Array.isArray(value) ? value : [ value ];
    for (const item of values) {
      if (item !== undefined && item !== null) {params.append(key, String(item));}
    }
  }
  return params.toString();
}

/**
 * Flatten nested routes into a flat array.
 * @param {Array} routes - Route configuration array
 * @param {string} [parentPath=''] - Parent route path
 * @param {Object} [parentRecord=null] - Parent route record
 * @returns {Array} Flattened route records
 */
export function flattenRoutes(routes, parentPath = '', parentRecord = null) {
  if (!Array.isArray(routes)) {
    throw new TypeError('[kupola/router] routes and children must be arrays.');
  }

  const flattened = [];

  for (const route of routes) {
    assertRouteConfig(route);
    if (route.children !== undefined && !Array.isArray(route.children)) {
      throw new TypeError('[kupola/router] Route children must be an array.');
    }
    const record = createRouteRecord(route, parentPath);
    record.parent = parentRecord;
    flattened.push(record);

    if (route.children && route.children.length > 0) {
      const childRoutes = flattenRoutes(route.children, record.path, record);
      flattened.push(...childRoutes);
    }
  }

  return flattened;
}

function assertRouteConfig(route) {
  if (!route || typeof route !== 'object' || Array.isArray(route)
    || typeof route.path !== 'string') {
    throw new TypeError('[kupola/router] Each route must provide a string path.');
  }
  if (route.beforeEnter !== undefined && typeof route.beforeEnter !== 'function') {
    throw new TypeError('[kupola/router] Route beforeEnter must be a function.');
  }
  if (route.beforeLeave !== undefined && typeof route.beforeLeave !== 'function') {
    throw new TypeError('[kupola/router] Route beforeLeave must be a function.');
  }
}

/**
 * Match a path against route records.
 * @param {Array} records - Flattened route records
 * @param {string} path - Path to match
 * @param {Object} [query={}] - Query parameters
 * @returns {Object|null} Matched route or null
 */
export function matchRoute(records, path, query = {}) {
  let bestMatch = null;
  let bestDepth = -1;

  for (const record of records) {
    const match = path.match(record.regex);
    if (match) {
      const params = {};
      const schema = record.paramsSchema;
      record.paramNames.forEach((name, index) => {
        const raw = match[index + 1] ? _decodeParam(match[index + 1]) : '';
        params[name] = schema && schema[name]
          ? _convertParam(raw, schema[name])
          : raw;
      });

      let depth = 0;
      for (let parent = record.parent; parent; parent = parent.parent) {
        depth++;
      }

      const specificity = _compareSpecificity(record, bestMatch || { specificity: [] });
      if (specificity > 0 || (specificity === 0 && depth > bestDepth)) {
        bestDepth = depth;
        bestMatch = { ...record, params };
      }
    }
  }

  if (!bestMatch) {
    return null;
  }

  const matchedRecords = [];
  let current = bestMatch;
  while (current) {
    matchedRecords.unshift(current);
    current = current.parent;
  }

  const lastRecord = matchedRecords[matchedRecords.length - 1];
  const meta = Object.assign({}, ...matchedRecords.map(record => record.meta || {}));

  const search = stringifyQuery(query);

  return {
    path: path,
    name: lastRecord.name,
    params: lastRecord.params || {},
    query,
    meta,
    fullPath: search ? `${path}?${search}` : path,
    matched: matchedRecords,
  };
}

/**
 * Resolve a route location to a path string.
 * @param {Array} records - Flattened route records
 * @param {string|Object} to - Route location
 * @returns {string} Resolved path
 */
export function resolvePath(records, to) {
  if (!to || typeof to !== 'object') {return '/';}
  const replaceParams = path => {
    let resolvedPath = path;
    for (const [ key, value ] of Object.entries(to.params || {})) {
      const encoded = encodeURIComponent(String(value));
      resolvedPath = resolvedPath.replace(new RegExp(`:${key}\\??`), encoded);
    }
    return resolvedPath;
  };
  if (to.path) {
    if (to.params) {
      return replaceParams(to.path);
    }
    return to.path;
  }

  if (to.name) {
    const record = records.find(r => r.name === to.name);
    if (record) {
      let resolvedPath = record.path;
      if (to.params) {
        for (const [ key, value ] of Object.entries(to.params)) {
          resolvedPath = resolvedPath.replace(
            new RegExp(`:${key}\\??`),
            encodeURIComponent(String(value)),
          );
        }
      }
      return resolvedPath;
    }
  }

  return '/';
}
