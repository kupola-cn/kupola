# Changelog

## 3.0.1 (2026-07-24)

### Maintenance

- Bug fixes and improvements

## 3.0.0 (2026-07-24)

### Architecture

- Separated UI components into standalone `@kupola/components` package (v1.0.0)
- Updated `@kupola/core` to v3.0.0 - pure reactivity engine without UI components
- Updated `@kupola/ai-adapter` to v3.0.0 - now depends on `@kupola/core` instead of `@kupola/kupola`
- `@kupola/kupola` v3.0.0 serves as unified entry point re-exporting all sub-packages
- Added proper module aliases for jest testing

### Breaking Changes

- Components no longer exported from `@kupola/core`
- Import paths changed: `@kupola/kupola/components/button` → `@kupola/components/button`
- `@kupola/ai-adapter` peerDependency changed from `@kupola/kupola` to `@kupola/core`

### Features

- Added `watch()` API for reactive data observation with `immediate` and `deep` options
- Added `provide()`/`inject()` for global state sharing between components
- Added `nextTick()` for batched update callbacks
- Added lifecycle hooks (`created`, `mounted`, `destroyed`) to `defineComponent`
- Added `reactive()` with `dispose()` method for proper cleanup

## 2.2.0 (2026-07-21)

### Accessibility (A11Y)

- Enhanced ARIA attributes for Switch, Radio, Checkbox, Select, and Dialog components
- Added `role="switch"` and `aria-checked`/`aria-disabled` to Switch
- Added `role="radiogroup"` with `aria-posinset`/`aria-setsize` to Radio group
- Added `role="checkbox"` with `aria-checked`/`aria-disabled` to Checkbox
- Added `role="combobox"`/`role="listbox"`/`role="option"` to Select with full ARIA support
- Added `role="alertdialog"` with `aria-modal`/`aria-labelledby`/`aria-describedby` to Dialog

### Internationalization (i18n)

- Added reactive `localeSignal` for automatic component updates on language change
- Implemented `detectLocale()` with priority: URL param → localStorage → browser settings
- Added `formatDate()`, `formatNumber()`, `formatCurrency()`, `formatRelativeTime()` using Intl API
- Added `isRTL()` and `getDirection()` for text direction support
- Added `onLocaleChange()` for language change event listening
- Built-in English (en-US) and Chinese (zh-CN) language packs with 300+ translation keys
- External language packs can be added via `addMessages()` API

### Core enhancements

- Added `watch()` API with `immediate` and `deep` options
- Added component lifecycle hooks: `created`, `mounted`, `destroyed`
- Added `provide()`/`inject()` for global state sharing
- Enhanced `k-model` to support dot notation (`obj.key`) and array indexing (`arr[0]`)

## 2.1.1 (2026-07-18)

### Core directives and release quality

- Hardened dynamic URL binding with element-aware protocol policies, encoded URL checks, Unicode/control-character rejection, and prototype-key protection.
- Defined per-walk HTML sanitizer behavior for synchronous, asynchronous, non-string, and throwing sanitizers.
- Added structural directive diagnostics, keyed list precedence, lifecycle cleanup on failed initialization, and transition event-target filtering.
- Added public API type checks, ESM/CJS package smoke tests, Windows-safe bundle-size checks, and VitePress generated-file isolation.
- Documented directive capabilities, form state, dynamic fragments, security policy integration, and performance boundaries.

## 2.0.0 (2026-07-15)

First stable release of Kupola 2.0 — a zero-dependency, modular UI component library.

### Core
- **Signal-based reactivity**: `signal`, `computed`, `effect`, `batch`
- **Template literals**: `html` tagged template + `render()`
- **SSR**: `renderToString` + `hydrate`
- **Directive system**: `k-data`, `k-show`, `k-bind`, `k-on`, `k-model`, `k-for`
- **48 UI components**: Modal, Table, Form, Select, DatePicker, Drawer, Dialog, Dropdown, etc.
- **TypeScript**: `types.d.ts` covering all 48 components

### Enhancements
- Accessibility: ARIA for Modal/Drawer/Dialog/Dropdown, focus trap, keyboard navigation
- i18n: `setLocale`/`getLocale`/`t`/`addMessages`, component integration (Table/Dialog/Select/DatePicker/TimePicker)
- CSS design system: tokens + components + dark/light themes + responsive breakpoints + minify
- Plugins: Vite & Webpack auto CSS injection, ESLint 3 rules
- DevTools: Signal profiler, lazy loading, ErrorBoundary
- Anti-FOUC: `themePreload`/`setTheme`/`toggleTheme` + `[k-cloak]` + inline preload script
- VS Code extension: snippets + directive auto-completion + hover docs
- Storybook: interactive component docs

### Templates (create-kupola)
- 7 templates: static, static-ts, nextjs, nuxt, flask, fastapi, gin
- Built-in examples: Counter, Todo List, Form Binding, Reactive Computed
- Anti-FOUC theme preload in all templates

### Quality
- 922 tests passing (55 suites)
- Coverage: Statements 86% | Branches 70% | Functions 87% | Lines 89%
- 8 performance benchmarks (Signal/VirtualList/Table/SSR)
- CI/CD: GitHub Actions (lint + test + coverage + build)

---

## 2.0.0-beta

- Accessibility: ARIA for Modal/Drawer/Dialog/Dropdown, focus trap, label association, keyboard navigation (Home/End/Tab)
- i18n/tokens + components + dark/light themes
- Plugins: Vite & Webpack auto CSS injection
- ESLint plugin: 3 rules (no-invalid-directives, prefer-t-function, no-innerhtml-user-input)
- ErrorBoundary utility for graceful error handling
- VS Code extension: snippets + directive auto-completion + hover docs
- Storybook: interactive component docs (Modal/Drawer/Table/Select/Alert/Notification/FAQ)
- DevTools: Signal reactivity profiler (enableProfiler/getProfileReport/printProfileReport)
- Lazy loading: async component initialization (lazyComponent/preloadComponent)
- Anti-FOUC: themePreload/setTheme/toggleTheme + [k-cloak] CSS rule + inline preload script
- Responsive: 4 breakpoints (sm/md/lg/xl) + ds-hide/show utilities + component mobile adaptations
- CSS minify: clean-css build pipeline (55.9KB → 27.6KB, 50.5% saved)
- 922 tests passing (55 suites)

## 2.0.0-alpha.1

- Complete rewrite with Signal-based reactivity engine
- 48 tree-shakeable UI components with independent bundles
- Declarative directive system (`k-data`, `k-show`, `k-bind`, `k-on`, `k-model`, `k-for`)
- SSR support: `renderToString` + `hydrate`
- Full TypeScript definitions included
- Core engine < 5KB gzip, zero dependencies

## 1.9.17 (Deprecated)

> **This version is no longer maintained and is not recommended for use.**
> Please upgrade to 2.0 for security updates, new features, and ongoing support.
