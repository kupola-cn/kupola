// SPDX-License-Identifier: MIT
/**
 * @kupola/platform — Full-featured platform with reactivity + rendering + components + directives.
 *
 * This package includes all Kupola features in a single import:
 * - Signal-based reactivity (from @kupola/core)
 * - HTML template rendering (html tag + render())
 * - Component system (defineComponent, register, provide/inject)
 * - Declarative directives (walk, k-data, k-show, etc.)
 * - Theme utilities (anti-FOUC, brand colors)
 * - Lazy loading (lazyComponent)
 *
 * @module @kupola/platform
 */

// ── Core Reactivity (re-exported from @kupola/core) ──────────────────────────
export {
  batch,
  computed,
  createScheduler,
  effect,
  effectScope,
  flushJobs,
  getCurrentScheduler,
  isReactive,
  nextTick,
  onScopeDispose,
  reactive,
  runWithScheduler,
  shallowReactive,
  signal,
  Signal,
  toRaw,
  watch,
  withoutTracking,
} from '@kupola/core';

// ── Template & Render ──────────────────────────────────────────────────────────
export { html, TemplateResult, htmlString, HtmlString } from './template.js';
export { render, mount, createApp, setIconResolver, isComponentInstanceLike } from './render.js';

// ── Component System ──────────────────────────────────────────────────────────
export {
  defineComponent, defineView, register, getComponent, hasComponent, clearRegistry,
  provide, inject,
} from './component.js';
export { getCurrentProvideContext, hasProvideContext, runWithProvideContext } from './context.js';

// ── Directives ────────────────────────────────────────────────────────────────
export {
  $, $$, walk, walkAuto, walkOnce, getWalk, hasWalk, destroyWalk, defineScope, setHtmlSanitizer,
  registerDirective,
} from './directives.js';

// ── Theme (anti-FOUC) ────────────────────────────────────────────────────────
export {
  DEFAULT_BRAND_COLORS,
  registerBrandColors,
  themePreload,
  stopThemePreload,
  getPreferredTheme,
  setTheme,
  toggleTheme,
  onThemeChange,
  getBrandColors,
  resolveBrandColor,
  getPreferredBrandColor,
  setBrandColor,
  resetBrandColor,
  onBrandColorChange,
  attachBrandColorPicker,
  getThemeInlineScript,
} from './theme.js';

// ── Lazy Load ────────────────────────────────────────────────────────────────
export { lazyComponent, preloadComponent } from './lazy.js';

// ── CSS Modules ──────────────────────────────────────────────────────────────
export { css } from './css.js';

// ── Form State Management ────────────────────────────────────────────────────
export { useForm } from './form.js';

// ── Store (defineStore) ──────────────────────────────────────────────────────
export { defineStore } from './store.js';

// ── Query (dedup + cache) ────────────────────────────────────────────────────
export {
  useQuery,
  invalidateQuery,
  invalidateQueries,
  prefetchQuery,
  getQueryCacheSize,
  getPendingQueryCount,
  resetQueryCache,
} from './query.js';

// ── Error Boundary ───────────────────────────────────────────────────────────
export { ErrorBoundary } from './errors.js';
