// SPDX-License-Identifier: MIT
/**
 * @kupola/router — Lightweight SPA routing with Hash/History/Memory modes.
 *
 * @module router
 */

export { createRouter, installRouter, initRouter } from './router.js';
export { useRouter, useRoute } from './router-context.js';
export { registerRouterLinkDirective } from './link.js';
export { registerRouterViewDirective } from './view.js';
export { setupAuthGuard } from './auth.js';
export { matchRouteServer, createServerRouter } from './server.js';
export { createScrollManager } from './scroll.js';
export { applyTransition, createTransitionManager } from './transition.js';
