// SPDX-License-Identifier: MIT
/**
 * @kupola/auth — Public API.
 *
 * Auth context:
 * - createAuthContext - Create auth context from user data
 * - hydrateAuthContext - Restore auth context from DOM attribute (SSR)
 * - getAuthContext - Get current auth context
 * - setAuthContext - Set current auth context
 * - AUTH_KEY - Symbol for provide/inject
 *
 * Permission handler:
 * - registerPermissionHandler - Register global permission handler
 * - getPermissionHandler - Get current permission handler
 * - clearPermissionHandler - Clear permission handler
 *
 * Directive:
 * - PermissionDirective - k-permission directive class
 * - processPermissionDirectives - Process all k-permission directives in root
 * - clearCache - Clear permission check cache
 *
 * HTTP Guard:
 * - createHttpGuard - Create HTTP guard with interceptors
 *
 * Router tools:
 * - requireAuth - Check if user is authenticated
 * - requirePermission - Check if user has specific permission
 * - requireRole - Check if user has specific role
 * - redirectTo - Redirect to URL
 *
 * @module @kupola/auth
 */

export {
  createAuthContext,
  hydrateAuthContext,
  getAuthContext,
  setAuthContext,
  AUTH_KEY,
} from './auth-context.js';

export {
  registerPermissionHandler,
  getPermissionHandler,
  clearPermissionHandler,
} from './permission-handler.js';

export {
  PermissionDirective,
  processPermissionDirectives,
  clearCache,
} from './directive.js';

export { createHttpGuard } from './http-guard.js';

export {
  requireAuth,
  requirePermission,
  requireRole,
  redirectTo,
} from './router-tools.js';