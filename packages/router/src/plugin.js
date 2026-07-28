// SPDX-License-Identifier: MIT
/** @module @kupola/router/plugin */

import { installRouter } from './router.js';
import { setupAuthGuard } from './auth.js';

export function createRouterPlugin(router, options = {}) {
  if (!router || typeof router.init !== 'function' || typeof router.destroy !== 'function') {
    throw new TypeError('[kupola/router] createRouterPlugin() expects a router.');
  }
  if (!options || typeof options !== 'object' || Array.isArray(options)) {
    throw new TypeError('[kupola/router] createRouterPlugin() expects an options object.');
  }

  const {
    auth = null,
    loginPath = '/login',
    forbiddenPath = '/403',
    notFoundPath = '/404',
    initialize = true,
  } = options;
  let removeAuthGuard = null;

  if (auth && (typeof auth.getContext !== 'function' || typeof auth.onChange !== 'function')) {
    throw new TypeError(
      '[kupola/router] createRouterPlugin({ auth }) requires getContext() and onChange(listener).',
    );
  }

  return {
    async install() {
      installRouter(router);
      if (auth) {
        removeAuthGuard = setupAuthGuard(router, {
          authContext: () => auth.getContext(),
          onAuthChange: listener => auth.onChange(listener),
          loginPath,
          forbiddenPath,
          notFoundPath,
        });
      }
      if (initialize) {
        await router.init();
      }
    },
    destroy() {
      removeAuthGuard?.();
      removeAuthGuard = null;
      router.destroy();
    },
  };
}
