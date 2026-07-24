// SPDX-License-Identifier: MIT
/**
 * @kupola/platform — Full-featured platform with reactivity + rendering + components + directives.
 */

// ── Core Reactivity ────────────────────────────────────────────────────────────
export { signal, Signal, reactive, isReactive } from './index.js';
export { computed } from './index.js';
export { effect, watch } from './index.js';
export { batch } from './index.js';

// ── Template & Render ──────────────────────────────────────────────────────────
export { html, TemplateResult } from './index.js';
export { render } from './index.js';

// ── Component System ──────────────────────────────────────────────────────────
export { defineComponent, register, getComponent, hasComponent, clearRegistry, provide, inject } from './index.js';

// ── Directives ────────────────────────────────────────────────────────────────
export {
  $, $$, walk, walkAuto, walkOnce, getWalk, hasWalk, destroyWalk, defineScope, setHtmlSanitizer,
} from './directives.d.ts';

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
} from './index.js';

// ── Lazy Load ────────────────────────────────────────────────────────────────
export { lazyComponent, preloadComponent } from './index.js';
