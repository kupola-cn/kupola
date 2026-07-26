// SPDX-License-Identifier: MIT
/**
 * @kupola/router — Router context for dependency injection.
 *
 * @module router-context
 */

import { hasProvideContext, inject, provide } from '@kupola/platform';

let currentRouter = null;
const ROUTER_NOT_FOUND = Symbol('kupola.router.not-found');
export const ROUTER_KEY = Symbol('kupola.router');

/**
 * Set the current router instance.
 * @param {Object} router - Router instance
 */
export function setCurrentRouter(router) {
  currentRouter = router;
}

/**
 * Provide a router to the current application/component tree.
 * Direct integrations without an active context retain the legacy fallback.
 * @param {Object|null} router - Router instance
 */
export function provideRouter(router) {
  if (hasProvideContext()) {
    provide(ROUTER_KEY, router);
    return;
  }
  setCurrentRouter(router);
}

export function clearCurrentRouter(router) {
  if (currentRouter === router) {
    currentRouter = null;
  }
}

/**
 * Get the current router instance.
 * @returns {Object|null} Router instance
 */
export function useRouter() {
  if (hasProvideContext()) {
    return inject(ROUTER_KEY, null) || null;
  }

  const injected = inject(ROUTER_KEY, ROUTER_NOT_FOUND);
  return injected === ROUTER_NOT_FOUND ? currentRouter || null : injected || null;
}

/**
 * Get the current route.
 * @returns {Object|null} Current route
 */
export function useRoute() {
  const router = useRouter();
  return router ? router.currentRoute : null;
}
