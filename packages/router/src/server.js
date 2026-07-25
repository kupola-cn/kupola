import { flattenRoutes, matchRoute } from './matcher.js';

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
      if (to.path) {
        if (to.params) {
          let resolvedPath = to.path;
          for (const [key, value] of Object.entries(to.params)) {
            resolvedPath = resolvedPath.replace(`:${key}`, value);
          }
          return resolvedPath;
        }
        return to.path;
      }
      
      if (to.name) {
        const record = records.find(r => r.name === to.name);
        if (record) {
          let resolvedPath = record.path;
          if (to.params) {
            for (const [key, value] of Object.entries(to.params)) {
              resolvedPath = resolvedPath.replace(`:${key}`, value);
            }
          }
          return resolvedPath;
        }
      }
      
      return '/';
    },
    
    get records() {
      return records;
    },
  };
}
