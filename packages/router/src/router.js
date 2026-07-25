import { flattenRoutes, matchRoute, resolvePath } from './matcher.js';
import { HashHistory } from './hash.js';
import { HistoryHistory } from './history.js';
import { MemoryHistory } from './memory.js';

export function createRouter(options) {
  const {
    mode = 'history',
    routes,
    base = '',
    scrollBehavior = 'auto',
    transition = {},
  } = options;
  
  const flattenedRecords = flattenRoutes(routes);
  
  let history;
  if (mode === 'hash') {
    history = new HashHistory({ options });
  } else if (mode === 'memory') {
    history = new MemoryHistory({ options });
  } else {
    history = new HistoryHistory({ options, base });
  }
  
  let currentRoute = null;
  const beforeEachGuards = [];
  const beforeResolveGuards = [];
  const afterEachCallbacks = [];
  const errorCallbacks = [];
  const scrollHistory = new Map();
  
  function parsePath(fullPath) {
    const [path, queryString] = fullPath.split('?');
    const query = {};
    if (queryString) {
      new URLSearchParams(queryString).forEach((value, key) => {
        query[key] = value;
      });
    }
    return { path: path || '/', query };
  }
  
  function handleScroll(to, from, savedPosition) {
    if (scrollBehavior === 'manual') return;
    
    if (savedPosition) {
      window.scrollTo(savedPosition.x, savedPosition.y);
      return;
    }
    
    if (typeof scrollBehavior === 'function') {
      const result = scrollBehavior(to, from, savedPosition);
      if (result) {
        if (result.selector) {
          const el = document.querySelector(result.selector);
          if (el) el.scrollIntoView({ behavior: scrollBehavior === 'smooth' ? 'smooth' : 'auto' });
        } else {
          window.scrollTo(result.x || 0, result.y || 0);
        }
      }
      return;
    }
    
    window.scrollTo({ top: 0, behavior: scrollBehavior === 'smooth' ? 'smooth' : 'auto' });
  }
  
  async function navigate(fullPath, replace = false) {
    const { path, query } = parsePath(fullPath);
    let to = matchRoute(flattenedRecords, path, query);
    
    if (!to) {
      const wildcardMatch = matchRoute(flattenedRecords, '*');
      if (wildcardMatch) {
        to = { ...wildcardMatch, path: fullPath, fullPath };
      } else {
        return;
      }
    }
    
    const from = currentRoute;
    
    try {
      for (const guard of beforeEachGuards) {
        const result = await guard(to, from);
        if (result === false) return;
        if (result && result.path) {
          navigate(result.path, replace);
          return;
        }
      }
      
      for (const guard of beforeResolveGuards) {
        const result = await guard(to, from);
        if (result === false) return;
        if (result && result.path) {
          navigate(result.path, replace);
          return;
        }
      }
      
      const record = to.matched[to.matched.length - 1];
      if (record.beforeEnter) {
        const result = await record.beforeEnter(to, from);
        if (result === false) return;
        if (result && result.path) {
          navigate(result.path, replace);
          return;
        }
      }
      
      if (from) {
        const fromRecord = from.matched[from.matched.length - 1];
        if (fromRecord && fromRecord.beforeLeave) {
          const result = await fromRecord.beforeLeave(to, from);
          if (result === false) return;
        }
      }
      
      if (!replace) {
        history.push(path, query);
      } else {
        history.replace(path, query);
      }
      
      currentRoute = to;
      
      if (from && !replace) {
        scrollHistory.set(from.fullPath, { x: window.scrollX, y: window.scrollY });
      }
      
      const savedPosition = from ? scrollHistory.get(from.fullPath) || null : null;
      handleScroll(to, from, savedPosition);
      
      afterEachCallbacks.forEach(cb => cb(to, from));
    } catch (error) {
      errorCallbacks.forEach(cb => cb(error));
    }
  }
  
  const router = {
    push(location, options = {}) {
      let path;
      if (typeof location === 'string') {
        path = location;
      } else if (location.path) {
        path = resolvePath(flattenedRecords, location);
      } else if (location.name) {
        path = resolvePath(flattenedRecords, location);
      }
      navigate(path, false, options.query);
    },
    
    replace(location, options = {}) {
      let path;
      if (typeof location === 'string') {
        path = location;
      } else if (location.path) {
        path = resolvePath(flattenedRecords, location);
      } else if (location.name) {
        path = resolvePath(flattenedRecords, location);
      }
      navigate(path, true, options.query);
    },
    
    back() {
      history.back();
    },
    
    forward() {
      history.forward();
    },
    
    go(delta) {
      history.go(delta);
    },
    
    match(path) {
      const { path: parsedPath, query } = parsePath(path);
      return matchRoute(flattenedRecords, parsedPath, query);
    },
    
    resolve(to) {
      return resolvePath(flattenedRecords, to);
    },
    
    beforeEach(guard) {
      beforeEachGuards.push(guard);
      return () => {
        const index = beforeEachGuards.indexOf(guard);
        if (index > -1) beforeEachGuards.splice(index, 1);
      };
    },
    
    beforeResolve(guard) {
      beforeResolveGuards.push(guard);
      return () => {
        const index = beforeResolveGuards.indexOf(guard);
        if (index > -1) beforeResolveGuards.splice(index, 1);
      };
    },
    
    afterEach(callback) {
      afterEachCallbacks.push(callback);
      return () => {
        const index = afterEachCallbacks.indexOf(callback);
        if (index > -1) afterEachCallbacks.splice(index, 1);
      };
    },
    
    onError(callback) {
      errorCallbacks.push(callback);
      return () => {
        const index = errorCallbacks.indexOf(callback);
        if (index > -1) errorCallbacks.splice(index, 1);
      };
    },
    
    init() {
      history.on((fullPath) => {
        const { path, query } = parsePath(fullPath);
        const match = matchRoute(flattenedRecords, path, query);
        if (match) {
          currentRoute = match;
          afterEachCallbacks.forEach(cb => cb(currentRoute, null));
        }
      });
      history.start();
      
      const initialPath = history.getPath();
      navigate(initialPath);
    },
    
    destroy() {
      history.stop();
    },
    
    get currentRoute() {
      return currentRoute;
    },
    
    get options() {
      return { mode, routes, base, scrollBehavior, transition };
    },
    
    get records() {
      return flattenedRecords;
    },
  };
  
  return router;
}

export function useRouter() {
  return globalThis.__KUPOLA_ROUTER__ || null;
}

export function useRoute() {
  const router = useRouter();
  return router ? router.currentRoute : null;
}

export function installRouter(router) {
  globalThis.__KUPOLA_ROUTER__ = router;
}
