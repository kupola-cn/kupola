// SPDX-License-Identifier: MIT
/**
 * @kupola/router — Core router implementation with navigation lifecycle and middleware pipeline.
 *
 * @module router
 */

import { flattenRoutes, matchRoute, resolvePath, stringifyQuery } from './matcher.js';
import { registerRouterLinkDirective } from './link.js';
import { registerRouterViewDirective } from './view.js';
import { setupAuthGuard } from './auth.js';
import { clearCurrentRouter, provideRouter } from './router-context.js';
import { Navigation, GuardPipeline, createMiddleware } from './navigation.js';
import { HistoryManager, ScrollManager, EventEmitter } from './managers.js';

const INSTALL_STATE = new WeakMap();
const MAX_REDIRECTS = 20;

/**
 * Router options.
 * @typedef {Object} RouterOptions
 * @property {string} [mode='history'] - History mode (hash, history, memory)
 * @property {Array} routes - Route configuration array
 * @property {string} [base=''] - Base path for history mode
 * @property {string|Function} [scrollBehavior='auto'] - Scroll behavior
 * @property {Object} [transition={}] - Transition configuration
 */

/**
 * Create a router instance.
 * @param {RouterOptions} options - Router configuration
 * @returns {Object} Router instance
 */
export function createRouter(options) {
  if (!options || !Array.isArray(options.routes)) {
    throw new TypeError('[kupola/router] createRouter() expects a routes array.');
  }

  const {
    mode = 'history',
    routes,
    base = '',
    scrollBehavior = 'auto',
    transition = {},
    initialLocation = '/',
  } = options;

  if (![ 'history', 'hash', 'memory' ].includes(mode)) {
    throw new TypeError(`[kupola/router] Unsupported mode: ${mode}`);
  }

  const flattenedRecords = flattenRoutes(routes);
  const historyManager = new HistoryManager(mode, base, initialLocation);
  const guardPipeline = new GuardPipeline();
  const scrollManager = new ScrollManager();
  const eventEmitter = new EventEmitter();

  let currentRoute = null;
  let navigationId = 0;
  let currentNavigation = null;
  let unlistenHistory = null;
  let isUpdatingHistory = false;
  let isDestroyed = false;

  function parsePath(fullPath) {
    const separator = fullPath.indexOf('?');
    const path = separator === -1 ? fullPath : fullPath.slice(0, separator);
    const queryString = separator === -1 ? '' : fullPath.slice(separator + 1);
    const query = {};
    if (queryString) {
      new URLSearchParams(queryString).forEach((value, key) => {
        if (Object.prototype.hasOwnProperty.call(query, key)) {
          query[key] = Array.isArray(query[key]) ? [ ...query[key], value ] : [ query[key], value ];
        } else {
          query[key] = value;
        }
      });
    }
    return { path: path || '/', query };
  }

  function appendQuery(path, query) {
    if (typeof path !== 'string') {return '/';}
    const search = stringifyQuery(query);
    if (!search) {return path;}
    return path.includes('?') ? `${path}&${search}` : `${path}?${search}`;
  }

  function formatFullPath(path, query) {
    const search = stringifyQuery(query);
    return search ? `${path}?${search}` : path;
  }

  function handleScroll(to, from, savedPosition) {
    if (scrollBehavior === 'manual') {return;}
    if (typeof window === 'undefined') {return;}

    try {
      if (savedPosition) {
        window.scrollTo(savedPosition.x, savedPosition.y);
        return;
      }

      if (typeof scrollBehavior === 'function') {
        const result = scrollBehavior(to, from, savedPosition);
        if (result) {
          if (result.selector) {
            const el = document.querySelector(result.selector);
            if (el) {
              el.scrollIntoView({ behavior: result.behavior || 'auto' });
            }
          } else {
            window.scrollTo(result.x || 0, result.y || 0);
          }
        }
        return;
      }

      window.scrollTo({ top: 0, behavior: scrollBehavior === 'smooth' ? 'smooth' : 'auto' });
    } catch (error) {
      // Scrolling is a post-commit enhancement. It must not turn a committed
      // route into a failed navigation when app code or the browser rejects it.
      if (typeof console !== 'undefined' && typeof console.error === 'function') {
        console.error('[kupola/router] Scroll behavior failed:', error);
      }
    }
  }

  function resolveLocation(location, options = {}) {
    let path = '/';
    let query = {};

    if (typeof location === 'string') {
      path = location;
    } else if (location?.path || location?.name) {
      path = resolvePath(flattenedRecords, location);
      query = location.query || {};
    }

    return appendQuery(path, { ...query, ...(options.query || {}) });
  }

  function matchWildcard(path, query) {
    const wildcardMatch = matchRoute(flattenedRecords, '*');
    if (wildcardMatch) {
      return { ...wildcardMatch, path, fullPath: formatFullPath(path, query) };
    }
    return null;
  }

  function isSameRecord(left, right) {
    return left.path === right.path && left.name === right.name;
  }

  function collectRouteGuards(to, from) {
    const guards = [];
    to.matched.forEach(record => {
      if (from?.matched.some(previous => isSameRecord(previous, record))) {
        return;
      }
      if (record.beforeEnter) {
        guards.push({
          phase: 'beforeEnter',
          middleware: createMiddleware(record.beforeEnter),
        });
      }
    });
    return guards;
  }

  function collectLeaveGuards(from, to) {
    if (!from) {return [];}
    const guards = [];
    [ ...from.matched ].reverse().forEach(record => {
      if (to?.matched.some(next => isSameRecord(next, record))) {
        return;
      }
      if (record.beforeLeave) {
        guards.push({
          phase: 'beforeLeave',
          middleware: createMiddleware(record.beforeLeave),
        });
      }
    });
    return guards;
  }

  async function navigate(
    fullPath,
    replace = false,
    { shouldRestoreHash = false, fromHistory = false, redirectDepth = 0 } = {},
  ) {
    if (isDestroyed) {return false;}

    const { path, query } = parsePath(fullPath);
    const normalizedFullPath = formatFullPath(path, query);
    if (currentRoute?.fullPath === normalizedFullPath) {
      return false;
    }
    let to = matchRoute(flattenedRecords, path, query);

    if (!to) {
      to = matchWildcard(path, query);
      if (!to) {
        eventEmitter.emit('navigation:not-found', fullPath);
        return false;
      }
    }

    if (currentNavigation && [ 'pending', 'guarding' ].includes(currentNavigation.status)) {
      currentNavigation.cancel();
    }

    const navigation = new Navigation({
      id: ++navigationId,
      from: currentRoute,
      to,
      replace,
      shouldRestoreHash,
    });

    currentNavigation = navigation;

    try {
      eventEmitter.emit('navigation:start', navigation);

      const leaveGuards = collectLeaveGuards(currentRoute, to);
      const enterGuards = collectRouteGuards(to, currentRoute);
      await guardPipeline.execute(navigation, [ ...enterGuards, ...leaveGuards ]);

      if (navigation.status === 'cancelled') {
        eventEmitter.emit('navigation:cancelled', navigation);
        return false;
      }

      if (navigation.status === 'rejected') {
        if (shouldRestoreHash && navigation.from) {
          const previous = parsePath(navigation.from.fullPath);
          historyManager.replaceWithGuard(previous.path, previous.query);
        }
        eventEmitter.emit('navigation:rejected', navigation);
        return false;
      }

      if (navigation.status === 'redirected' && navigation.redirectLocation) {
        if (redirectDepth >= MAX_REDIRECTS) {
          const error = new Error(
            `[kupola/router] Navigation exceeded the maximum of ${MAX_REDIRECTS} redirects.`,
          );
          navigation.status = 'error';
          throw error;
        }
        return await navigate(
          resolveLocation(navigation.redirectLocation),
          true,
          { shouldRestoreHash, fromHistory: false, redirectDepth: redirectDepth + 1 },
        );
      }

      if (!fromHistory) {
        isUpdatingHistory = true;
        try {
          if (replace) {
            historyManager.replace(path, query);
          } else {
            historyManager.push(path, query);
          }
        } finally {
          isUpdatingHistory = false;
        }
      }

      const from = currentRoute;
      currentRoute = to;

      if (from && !replace && typeof window !== 'undefined') {
        scrollManager.save(from.fullPath, { x: window.scrollX, y: window.scrollY });
      }

      const savedPosition = fromHistory ? scrollManager.restore(to.fullPath) : null;
      handleScroll(to, from, savedPosition);

      navigation.complete();
      eventEmitter.emit('navigation:complete', navigation);
      return true;

    } catch (error) {
      if (redirectDepth === 0) {
        eventEmitter.emit('navigation:error', navigation, error);
      }
      throw error;
    } finally {
      if (currentNavigation === navigation) {
        currentNavigation = null;
      }
    }
  }

  const router = {
    push(location, options = {}) {
      const path = resolveLocation(location, options);
      return navigate(path, false);
    },

    replace(location, options = {}) {
      const path = resolveLocation(location, options);
      return navigate(path, true);
    },

    back() {
      if (isDestroyed) {return;}
      historyManager.back();
    },

    forward() {
      if (isDestroyed) {return;}
      historyManager.forward();
    },

    go(delta) {
      if (isDestroyed) {return;}
      historyManager.go(delta);
    },

    match(path) {
      const { path: parsedPath, query } = parsePath(path);
      return matchRoute(flattenedRecords, parsedPath, query);
    },

    resolve(to) {
      const path = resolvePath(flattenedRecords, to);
      return appendQuery(path, to?.query || {});
    },

    beforeEach(guard) {
      return guardPipeline.use('beforeEach', createMiddleware(guard));
    },

    beforeResolve(guard) {
      return guardPipeline.use('beforeResolve', createMiddleware(guard));
    },

    afterEach(callback) {
      return eventEmitter.on('navigation:complete', (nav) => {
        callback(nav.to, nav.from);
      });
    },

    onError(callback) {
      return eventEmitter.on('navigation:error', (nav, error) => {
        callback(error);
      });
    },

    on(event, listener) {
      return eventEmitter.on(event, listener);
    },

    init() {
      if (unlistenHistory) {
        return Promise.resolve(currentRoute);
      }

      isDestroyed = false;
      unlistenHistory = historyManager.on(async (fullPath) => {
        if (isUpdatingHistory || historyManager.getIsGuardRestoring()) {return;}
        try {
          await navigate(fullPath, true, { shouldRestoreHash: true, fromHistory: true });
        } catch {
          // navigate() already emits navigation:error and the caller can use onError().
        }
      });
      historyManager.start();
      scrollManager.start();

      const initialPath = historyManager.getPath();
      return navigate(initialPath, true, { fromHistory: true });
    },

    destroy() {
      isDestroyed = true;
      if (currentNavigation && [ 'pending', 'guarding' ].includes(currentNavigation.status)) {
        currentNavigation.cancel();
      }
      if (unlistenHistory) {
        unlistenHistory();
        unlistenHistory = null;
      }
      historyManager.stop();
      historyManager.clear();
      scrollManager.stop();
      scrollManager.clear();
      eventEmitter.clear();
      const installState = INSTALL_STATE.get(router);
      installState?.authUnsubscribe?.();
      INSTALL_STATE.delete(router);
      clearCurrentRouter(router);
    },

    get currentRoute() {
      return currentRoute;
    },

    get options() {
      return { mode, routes, base, scrollBehavior, transition, initialLocation };
    },

    get records() {
      return flattenedRecords;
    },
  };

  return router;
}

/**
 * Install router directives and optionally setup auth guard.
 * @param {Object} router - Router instance
 * @param {Object} [options={}] - Installation options
 * @param {boolean|Object} [options.auth] - Auth guard configuration
 */
export function installRouter(router, options = {}) {
  if (!router || typeof router.beforeEach !== 'function') {
    throw new TypeError('[kupola/router] installRouter() expects a router.');
  }
  if (!options || typeof options !== 'object' || Array.isArray(options)) {
    throw new TypeError('[kupola/router] installRouter() expects an options object.');
  }
  if (options.auth === true && !Object.prototype.hasOwnProperty.call(options, 'authContext')) {
    throw new TypeError(
      '[kupola/router] installRouter({ auth: true }) requires authContext. ' +
      'Pass authContext: () => getAuthContext().',
    );
  }

  provideRouter(router);
  registerRouterLinkDirective();
  registerRouterViewDirective();

  const state = INSTALL_STATE.get(router) || {};
  if (options.auth && !state.authUnsubscribe) {
    const authOptions = typeof options.auth === 'boolean'
      ? { authContext: options.authContext, onAuthChange: options.onAuthChange }
      : options.auth;
    state.authUnsubscribe = setupAuthGuard(router, authOptions);
    INSTALL_STATE.set(router, state);
  }
}

/**
 * Initialize router with plugin system support.
 * @param {RouterOptions & { auth?: boolean | Object }} options - Router configuration with auth
 * @returns {Object} Plugin object with install/init/destroy methods
 */
export function initRouter(options) {
  if (!options || typeof options !== 'object' || Array.isArray(options)) {
    throw new TypeError('[kupola/router] initRouter() expects an options object.');
  }
  const { auth, authContext, onAuthChange, ...routerOptions } = options;
  const router = createRouter(routerOptions);

  return {
    install() {
      const options = { auth };
      if (authContext !== undefined) {options.authContext = authContext;}
      if (onAuthChange !== undefined) {options.onAuthChange = onAuthChange;}
      installRouter(router, options);
    },
    init() {
      return router.init();
    },
    destroy() {
      router.destroy();
    },
  };
}

export { Navigation, GuardPipeline, HistoryManager, ScrollManager };
