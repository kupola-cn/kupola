/**
 * Kupola Core - Core functionality without UI components.
 * @module kupola/core
 * @example
 * import { ref, reactive, createStore, initTheme, useDeps } from '@kupola/kupola/core';
 */

import { KupolaLifecycle, createLifecycle, kupolaLifecycle } from '../js/kupola-lifecycle.js';
import { KupolaUtils, stringUtils, arrayUtils, objectUtils, numberUtils, dateUtils, debounce, throttle, validatorUtils, cryptoUtils, preloadUtils } from '../js/utils.js';
import {
  KupolaDataBind, KupolaEventBus, KupolaStore, KupolaStoreManager,
  kupolaData, kupolaEvents, kupolaStoreManager, createStore, getStore, ref,
} from '../js/data-bind.js';
import {
  initTheme, setTheme, getTheme, setBrand, getBrand,
  createThemeToggle, createBrandPicker, BRAND_OPTIONS,
} from '../js/theme.js';
import {
  setConfig, getConfig, getIconsPath, getBasePath,
  getDefaultTheme, getDefaultBrand,
  getHttpConfig, getUiConfig, getSecurityConfig,
  getPerformanceConfig, getMessageConfig, getNotificationConfig, getValidationConfig,
  onConfigChange, offConfigChange,
} from '../js/kupola-config.js';
import { sanitizeHtml, escapeHtml, stripHtml, maskData, generateSecureId } from '../js/security.js';
import { ComponentInitializerRegistry, kupolaInitializer } from '../js/initializer.js';
import {
  KupolaComponent, applyMixin,
  KupolaComponentRegistry,
  kupolaRegistry,
  kupolaBootstrap,
  registerComponent,
  registerLazyComponent,
  bootstrapComponents,
  defineMixin,
  useMixin,
  defineComponent,
} from '../js/kupola-core.js';

import {
  KupolaI18n, kupolaI18n, createI18n,
  t, n, setLocale, getLocale,
  formatDate, formatNumber, formatCurrency,
} from '../js/i18n.js';

import { GlobalEvents, globalEvents, on, once, off, emit, emitGlobal, offByScope, offAll, getListenerCount } from '../js/global-events.js';

import { useDeps, useQuery, clearCache, Scheduler, CacheManager, CacheEntry, DependsError, DependsSource, FetchedSource, StorageSource, RouteSource, FunctionSource, StaticSource, WebSocketSource, createSource, configureHttpClient, getHttpClient, resetHttpClient } from '../js/depends.js';

export { KupolaComponent, applyMixin };
export { KupolaComponentRegistry };
export { KupolaLifecycle, createLifecycle, kupolaLifecycle };
export { KupolaUtils };
export { stringUtils, arrayUtils, objectUtils, numberUtils, dateUtils, debounce, throttle, validatorUtils, cryptoUtils, preloadUtils };
export { KupolaDataBind, KupolaEventBus, KupolaStore, KupolaStoreManager };
export { kupolaData, kupolaEvents, kupolaStoreManager, createStore, getStore };
export { initTheme, setTheme, getTheme, setBrand, getBrand, createThemeToggle, createBrandPicker, BRAND_OPTIONS };
export { ComponentInitializerRegistry, kupolaInitializer };
export { kupolaRegistry, kupolaBootstrap };
export { registerComponent, registerLazyComponent, bootstrapComponents };
export { defineMixin, useMixin, defineComponent };
export { GlobalEvents, globalEvents, on, once, off, emit, emitGlobal, offByScope, offAll, getListenerCount };
export { useDeps, useQuery, clearCache, configureHttpClient, getHttpClient, resetHttpClient };
export { Scheduler, CacheManager, CacheEntry, DependsError };
export { DependsSource, FetchedSource, StorageSource, RouteSource, FunctionSource, StaticSource, WebSocketSource, createSource };

export {
  KupolaI18n, kupolaI18n, createI18n,
  t, n, setLocale, getLocale,
  formatDate, formatNumber, formatCurrency,
};

export {
  setConfig, getConfig, getIconsPath, getBasePath,
  getDefaultTheme, getDefaultBrand,
  getHttpConfig, getUiConfig, getSecurityConfig,
  getPerformanceConfig, getMessageConfig, getNotificationConfig, getValidationConfig,
  onConfigChange, offConfigChange,
};
export { sanitizeHtml, escapeHtml, stripHtml, maskData, generateSecureId };
export { ref };