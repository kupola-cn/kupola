// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Public API surface.
 *
 * This is the single entry point for the core reactivity engine.
 * Re-exports all public primitives.
 *
 * @module @kupola/core
 */

// ── Signal ───────────────────────────────────────────────────────────────────
export { signal, Signal } from './signal.js';

// ── Computed ─────────────────────────────────────────────────────────────────
export { computed } from './computed.js';

// ── Effect ───────────────────────────────────────────────────────────────────
export { effect } from './effect.js';

// ── Batch ────────────────────────────────────────────────────────────────────
export { batch } from './batch.js';

// ── Template ─────────────────────────────────────────────────────────────────
export { html, TemplateResult } from './template.js';

// ── Render ───────────────────────────────────────────────────────────────────
export { render } from './render.js';

// ── SSR (client-side hydrate) ───────────────────────────────────────────────
export { hydrate } from './server.js';

// ── Component ────────────────────────────────────────────────────────────────
export { defineComponent, register, getComponent, hasComponent, clearRegistry } from './component.js';

// ── Directives ───────────────────────────────────────────────────────────────
export {
  $, $$, walk, walkAuto, walkOnce, getWalk, hasWalk, destroyWalk, defineScope, setHtmlSanitizer,
} from './directives.js';

// ── Scheduler (advanced / testing) ───────────────────────────────────────────
export { flushJobs, resetScheduler } from './scheduler.js';

// ── i18n ─────────────────────────────────────────────────────────────────────
export { setLocale, getLocale, t, addMessages } from './i18n.js';

// ── Error Boundary ───────────────────────────────────────────────────────────
export { ErrorBoundary } from './errors.js';

// ── DevTools (profiler) ──────────────────────────────────────────────────────
export { enableProfiler, disableProfiler, resetProfiler, getProfileReport, printProfileReport } from './devtools.js';

// ── Lazy Load ────────────────────────────────────────────────────────────────
export { lazyComponent, preloadComponent } from './lazy.js';

// ── Theme (anti-FOUC) ────────────────────────────────────────────────────────
export {
  DEFAULT_BRAND_COLORS,
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
