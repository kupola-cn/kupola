# Changelog

## 2.1.1 (2026-07-24)

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
