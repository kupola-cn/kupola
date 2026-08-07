// SPDX-License-Identifier: MIT
/**
 * @kupola/components - Application UI bootstrap helpers.
 */

import { setIconResolver, themePreload } from '@kupola/platform';
import { createKupolaIconProvider } from './icons.js';

function normalizeProvider(provider) {
  if (!provider || typeof provider !== 'object'
    || typeof provider.prefix !== 'string' || provider.prefix.length === 0
    || typeof provider.resolve !== 'function') {
    throw new TypeError(
      '[kupola/components] An icon provider requires a non-empty prefix and resolve(name, size).',
    );
  }
  return provider;
}

export function createIconResolver(options = {}) {
  if (!options || typeof options !== 'object' || Array.isArray(options)) {
    throw new TypeError('[kupola/components] createIconResolver() expects an options object.');
  }

  const { providers, fallback } = options;
  if (!Array.isArray(providers) || providers.length === 0) {
    throw new TypeError('[kupola/components] Icon resolver requires at least one provider.');
  }
  if (fallback !== undefined && fallback !== null && typeof fallback !== 'string') {
    throw new TypeError('[kupola/components] Icon resolver fallback must be a provider prefix or null.');
  }

  const providerMap = new Map();
  for (const provider of providers) {
    const normalized = normalizeProvider(provider);
    if (providerMap.has(normalized.prefix)) {
      throw new Error(`[kupola/components] Duplicate icon provider prefix: ${normalized.prefix}.`);
    }
    providerMap.set(normalized.prefix, normalized);
  }

  const defaultProvider = fallback === null
    ? null
    : fallback === undefined
      ? providers.length === 1 ? providers[0] : null
      : providerMap.get(fallback);
  if (fallback && !defaultProvider) {
    throw new Error(`[kupola/components] Unknown icon fallback provider: ${fallback}.`);
  }

  return (name, size) => {
    if (typeof name !== 'string' || name.length === 0) {return '';}
    const separator = name.indexOf(':');
    if (separator === -1) {
      return defaultProvider ? defaultProvider.resolve(name, size) : '';
    }
    const prefix = name.slice(0, separator);
    const iconName = name.slice(separator + 1);
    return providerMap.get(prefix)?.resolve(iconName, size) || '';
  };
}

export function setupUi(options = {}) {
  if (!options || typeof options !== 'object' || Array.isArray(options)) {
    throw new TypeError('[kupola/components] setupUi() expects an options object.');
  }

  const { theme = true, icons } = options;
  if (theme !== true && theme !== false) {
    throw new TypeError('[kupola/components] setupUi() theme must be a boolean.');
  }
  if (theme) {themePreload();}
  if (icons === undefined) {return;}

  const resolver = typeof icons === 'function' ? icons : createIconResolver(icons);
  setIconResolver(resolver);
}
