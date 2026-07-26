// SPDX-License-Identifier: MIT
/**
 * @kupola/auth — Auth context management.
 *
 * createAuthContext - Create an auth context from user data
 * hydrateAuthContext - Restore auth context from DOM attribute (SSR)
 * getAuthContext - Get current auth context
 * setAuthContext - Set current auth context
 *
 * @module auth-context
 */

import { createAuthStore } from './store.js';

export const AUTH_KEY = Symbol('kupola.auth');
export { createAuthStore } from './store.js';

export const defaultAuthStore = createAuthStore();
export const createAuthContext = defaultAuthStore.createAuthContext;
export const hydrateAuthContext = defaultAuthStore.hydrateAuthContext;
export const getAuthContext = defaultAuthStore.getAuthContext;
export const setAuthContext = defaultAuthStore.setAuthContext;
export const onAuthContextChange = defaultAuthStore.onAuthContextChange;
