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
export { signal, Signal, reactive, isReactive, computed, effect, watch, batch } from '@kupola/core';

// ── Template & Render ──────────────────────────────────────────────────────────
export { html, TemplateResult } from './template.js';
export { render } from './render.js';

// ── Component System ──────────────────────────────────────────────────────────
export { defineComponent, register, getComponent, hasComponent, clearRegistry, provide, inject } from './component.js';

// ── Directives ────────────────────────────────────────────────────────────────
export {
  $, $$, walk, walkAuto, walkOnce, getWalk, hasWalk, destroyWalk, defineScope, setHtmlSanitizer,
} from './directives.js';

// ── Theme (anti-FOUC) ────────────────────────────────────────────────────────
export {
  DEFAULT_BRAND_COLORS,
  registerBrandColors,
  themePreload,
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

// ── Error Boundary ───────────────────────────────────────────────────────────
export { ErrorBoundary } from './errors.js';
