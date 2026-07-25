export function createRouteRecord(route, parentPath = '') {
  const fullPath = parentPath ? `${parentPath}/${route.path}` : route.path;
  
  const normalizedPath = fullPath
    .replace(/\/+/g, '/')
    .replace(/\/$/, '') || '/';
  
  const paramNames = [];
  const regexPattern = normalizedPath
    .replace(/:(\w+)\?/g, (_, name) => {
      paramNames.push(name);
      return '([^/]*)?';
    })
    .replace(/:(\w+)/g, (_, name) => {
      paramNames.push(name);
      return '([^/]+)';
    })
    .replace(/\*/g, '.*');
  
  const regex = new RegExp(`^${regexPattern}$`);
  
  return {
    path: normalizedPath,
    name: route.name,
    component: route.component,
    components: route.components,
    children: route.children || [],
    meta: route.meta || {},
    beforeEnter: route.beforeEnter,
    beforeLeave: route.beforeLeave,
    transition: route.transition,
    regex,
    paramNames,
  };
}

export function flattenRoutes(routes, parentPath = '', parentRecord = null) {
  const flattened = [];
  
  for (const route of routes) {
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

export function matchRoute(records, path, query = {}) {
  let bestMatch = null;
  let bestScore = -1;
  
  for (const record of records) {
    const match = path.match(record.regex);
    if (match) {
      const params = {};
      record.paramNames.forEach((name, index) => {
        params[name] = match[index + 1] || '';
      });
      
      let score = 0;
      if (!record.path.includes(':') && !record.path.includes('*')) {
        score = 2;
      } else if (!record.path.includes('*')) {
        score = 1;
      } else {
        score = 0;
      }
      
      if (score > bestScore) {
        bestScore = score;
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
  
  return {
    path: path,
    name: lastRecord.name,
    params: lastRecord.params || {},
    query,
    meta: lastRecord.meta,
    fullPath: query ? `${path}?${new URLSearchParams(query).toString()}` : path,
    matched: matchedRecords,
  };
}

export function resolvePath(records, to) {
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
}
