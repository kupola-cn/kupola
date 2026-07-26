// SPDX-License-Identifier: MIT
/**
 * @kupola/auth - Default permission handler API.
 *
 * The default API remains global for compatibility. Use createAuthStore()
 * from auth-context.js for isolated application state.
 *
 * @module permission-handler
 */

import { defaultAuthStore } from './auth-context.js';

export const registerPermissionHandler = defaultAuthStore.registerPermissionHandler;
export const getPermissionHandler = defaultAuthStore.getPermissionHandler;
export const clearPermissionHandler = defaultAuthStore.clearPermissionHandler;
export const onPermissionHandlerChange = defaultAuthStore.onPermissionHandlerChange;
