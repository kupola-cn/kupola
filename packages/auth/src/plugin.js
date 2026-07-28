// SPDX-License-Identifier: MIT
/**
 * @kupola/auth - Application auth provider integration.
 *
 * The provider owns session restoration and mutation while this plugin makes
 * that provider available to all components in the current application tree.
 */

import { inject, provide } from '@kupola/platform';

export const AUTH_PROVIDER_KEY = Symbol('kupola.auth-provider');

export function createAuthPlugin(provider) {
  if (!provider || typeof provider !== 'object' || typeof provider.restore !== 'function') {
    throw new TypeError('[kupola/auth] createAuthPlugin() expects a provider with restore().');
  }

  return {
    async install() {
      provide(AUTH_PROVIDER_KEY, provider);
      await provider.restore();
    },
  };
}

export function useAuth() {
  const provider = inject(AUTH_PROVIDER_KEY, null);
  if (!provider) {
    throw new Error('[kupola/auth] No auth provider is installed. Call app.use(createAuthPlugin(provider)).');
  }
  return provider;
}
