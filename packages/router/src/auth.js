// SPDX-License-Identifier: MIT
/**
 * @kupola/router — Authentication guard for route protection.
 *
 * @module auth
 */

/**
 * Setup authentication guard on router.
 * @param {Object} router - Router instance
 * @param {Object} [options={}] - Auth guard options
 * @param {Function|Object|null} options.authContext - Dynamic auth context getter or context object
 * @param {string} [options.loginPath='/login'] - Login page path
 * @param {string} [options.forbiddenPath='/403'] - Forbidden page path
 * @param {string} [options.notFoundPath='/404'] - Not found page path
 * @param {(listener: Function) => Function} [options.onAuthChange] - Auth change subscription
 * @returns {Function} Unsubscribe function
 */
export function setupAuthGuard(router, options = {}) {
  if (!router || typeof router.beforeEach !== 'function') {
    throw new TypeError('[kupola/router] setupAuthGuard() expects a router.');
  }
  if (!options || typeof options !== 'object' || Array.isArray(options)) {
    throw new TypeError('[kupola/router] setupAuthGuard() expects an options object.');
  }

  const {
    authContext,
    loginPath = '/login',
    forbiddenPath = '/403',
    notFoundPath = '/404',
    onAuthChange,
  } = options;

  if (!Object.prototype.hasOwnProperty.call(options, 'authContext')) {
    throw new TypeError(
      '[kupola/router] setupAuthGuard() requires authContext. ' +
      'Pass a dynamic getter such as () => getAuthContext().',
    );
  }
  if (
    authContext !== null &&
    typeof authContext !== 'function' &&
    (typeof authContext !== 'object' || Array.isArray(authContext))
  ) {
    throw new TypeError(
      '[kupola/router] authContext must be a getter, context object, or null.',
    );
  }
  if (onAuthChange !== undefined && typeof onAuthChange !== 'function') {
    throw new TypeError('[kupola/router] onAuthChange must be a function.');
  }
  for (const [ name, value ] of Object.entries({ loginPath, forbiddenPath, notFoundPath })) {
    if (typeof value !== 'string' || value.length === 0) {
      throw new TypeError(`[kupola/router] ${name} must be a non-empty string.`);
    }
  }

  const getAuth = () => {
    if (typeof authContext === 'function') {
      return authContext();
    }
    if (authContext !== undefined) {
      return authContext;
    }
    return null;
  };

  const isAuthenticated = (auth) => {
    if (!auth) {return false;}
    if (typeof auth.isAuthenticated === 'boolean') {
      return auth.isAuthenticated;
    }
    const id = auth.user?.id;
    return typeof id === 'number'
      ? Number.isFinite(id)
      : typeof id === 'string' && id.length > 0;
  };

  const checkRoute = (to) => {
    const currentAuth = getAuth();
    const matchedMeta = Array.isArray(to.matched) && to.matched.length > 0
      ? to.matched.map(record => record.meta || {})
      : [ to.meta || {} ];

    if (matchedMeta.some(meta => meta.requiresAuth)
      && !isAuthenticated(currentAuth) && to.path !== loginPath) {
      return {
        path: loginPath,
        query: { redirect: to.fullPath },
      };
    }

    if (to.path !== forbiddenPath) {
      for (const meta of matchedMeta) {
        if (meta.permission && (!currentAuth
          || typeof currentAuth.hasPermission !== 'function'
          || !currentAuth.hasPermission(meta.permission))) {
          return { path: forbiddenPath };
        }
        if (meta.role && (!currentAuth
          || typeof currentAuth.hasRole !== 'function'
          || !currentAuth.hasRole(meta.role))) {
          return { path: forbiddenPath };
        }
      }
    }

    return true;
  };

  const unsubscribeGuard = router.beforeEach((to) => {
    return checkRoute(to);
  });

  let redirectingOnAuthChange = false;
  let authChangeVersion = 0;
  let disposed = false;

  const syncCurrentRoute = async (version) => {
    if (disposed || !router.currentRoute) {return;}
    const redirect = checkRoute(router.currentRoute);
    if (redirect === true) {return;}

    redirectingOnAuthChange = true;
    try {
      await router.replace(redirect);
    } finally {
      redirectingOnAuthChange = false;
      if (!disposed && version !== authChangeVersion) {
        void syncCurrentRoute(authChangeVersion).catch(error => {
          if (typeof console !== 'undefined' && typeof console.error === 'function') {
            console.error('[kupola/router] Auth change redirect failed:', error);
          }
        });
      }
    }
  };

  const authSubscription = typeof onAuthChange === 'function'
    ? onAuthChange(() => {
      authChangeVersion++;
      if (redirectingOnAuthChange || !router.currentRoute) {return;}
      void syncCurrentRoute(authChangeVersion).catch(error => {
        if (typeof console !== 'undefined' && typeof console.error === 'function') {
          console.error('[kupola/router] Auth change redirect failed:', error);
        }
      });
    })
    : null;
  const unsubscribeAuth = typeof authSubscription === 'function' ? authSubscription : null;

  const unsubscribeNotFound = typeof router.on === 'function'
    ? router.on('navigation:not-found', (missingPath) => {
      if (missingPath !== notFoundPath) {
        void router.replace(notFoundPath);
      }
    })
    : () => {};

  return () => {
    disposed = true;
    unsubscribeGuard?.();
    unsubscribeAuth?.();
    unsubscribeNotFound?.();
  };
}
