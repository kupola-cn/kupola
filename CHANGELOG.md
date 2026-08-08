# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## 3.4.0 (2026-08-08)

### Features

- Add the reusable `Panel` container component with typed options, lifecycle
  management, CSS, documentation, and Storybook coverage.
- Add the public `@kupola/components/icon-config` entry point and strengthen
  cross-entry component and platform runtime behavior.

### Documentation

- Document Vite + ESM applications, component lifecycle, and the recommended
  `pages/*.js` + `view.js` + `state.js` business-page architecture.
- Correct stale Vite/Webpack plugin references and update the static project
  template to use standard Vite configuration.

## 3.3.7 (2026-07-28)

### Bug Fixes

- Share overlay stack state across the package root and subpath entry points
  when both are loaded in the same document.

## 3.3.6 (2026-07-28)

### Bug Fixes

- Use shared symbols for cross-entry component lifecycle and schema form event
  protocols.

## 3.3.5 (2026-07-28)

### Bug Fixes

- Share custom directive registration across the platform root and subpath
  entry points.

## 3.3.4 (2026-07-28)

### Bug Fixes

- Use a global symbol for component instance recognition across independently
  bundled platform entry points.

## 3.3.3 (2026-07-28)

### Bug Fixes

- Preserve external imports for Kupola package subpaths so components and the
  platform share one runtime when installed from npm.
- Remove obsolete root Vite configuration from the package workspace.

## 3.3.2 (2026-07-28)

### Features

- Added schema-driven form, view, overlay, and UI helper entry points.
- Improved router, authentication, component, platform, and TypeScript APIs.

### Documentation

- Added bilingual Kupola App references to the project READMEs.

## 3.3.1 (2026-07-26)

### Breaking Changes

- `@kupola/core` `Signal#toJSON()` now returns the underlying value instead of
  a pre-serialized JSON string. `JSON.stringify(signal)` remains the normal
  serialization path; use `JSON.stringify(signal.value)` when an explicit
  string is required.

### Features

- Enhanced AIAdapter with priority-based CommandBus, lifecycle management, and
  improved error handling.
- Added flow engine persistence with localStorage support.
- Implemented AIPanel drag-to-resize and "My Flows" tab.
- Added async lifecycle hook support for components.

### Fixed

- Fixed circular dependency detection in DI Container.
- Fixed memory leaks in flow engine and panel components.
- Fixed XSS vulnerability in text rendering.
- Fixed ReDoS protection in IntentParser.

## 3.2.4 (2026-07-26)

### Fixed

- Hardened core computed propagation, reactive array mutation batching, and
  reflective array updates.
- Isolated router and auth state between applications and synchronized release
  metadata and package size checks with the workspace layout.

### [3.1.2](https://github.com/kupola-cn/kupola/compare/v3.0.0...v3.1.2) (2026-07-25)


### Features

* icon customization system and style isolation ([1b0767d](https://github.com/kupola-cn/kupola/commit/1b0767d2dde91aca9d1556f8fc42e10f4c3e7d0a))
* split @kupola/kupola into @kupola/core and @kupola/platform packages (v3.1.0) ([8507caf](https://github.com/kupola-cn/kupola/commit/8507caf1886ccea30b23d4a2701aabc12044ad41))
* sync packages with core 3.0.0 and reactive API ([1d6e3c7](https://github.com/kupola-cn/kupola/commit/1d6e3c7ea57f565353151da69c03c4fdf73d88f6))


### Bug Fixes

* **benchmark:** use fileURLToPath for proper path handling ([1ad000a](https://github.com/kupola-cn/kupola/commit/1ad000ab9a77fce813abad61e4436f2692732b08))
* **ci:** update Node.js version to 24.x due to deprecation ([db9ad0f](https://github.com/kupola-cn/kupola/commit/db9ad0f13b6feeab59917bad176e16b2b8a5b8b3))
* **codeowners:** add missing /packages/platform/ entry ([2e38379](https://github.com/kupola-cn/kupola/commit/2e3837938e73774f2febb6fac54890eed7cf17e1))
* update tsconfig.json paths for components package ([acf32d4](https://github.com/kupola-cn/kupola/commit/acf32d4c8c4e38586a8679ff3517811256921f33))
* **vscode-kupola:** add LICENSE and remove missing icon reference for vsce packaging ([fd07425](https://github.com/kupola-cn/kupola/commit/fd07425ae704b8c2f6cd433a6267c1a6d75cfa47))
* **vscode-kupola:** sync snippets to 3.x import paths and export ErrorBoundary from platform ([d6a8788](https://github.com/kupola-cn/kupola/commit/d6a8788a58ce5b83dc43587888f983447e22af4a))


### Chore

* improve package metadata and documentation ([de6b2d1](https://github.com/kupola-cn/kupola/commit/de6b2d1c0ab5c4d144e133f7fdeb29365b52d608))
* update project configuration and documentation ([5281a88](https://github.com/kupola-cn/kupola/commit/5281a884d30409e77bd0c708a46f5a9b5b17f16d))


### Documentation

* add icon library support table to docs-site ([867a0a6](https://github.com/kupola-cn/kupola/commit/867a0a620b20f78b003192e6906277989426e2f9))
* add integration examples for all major icon libraries ([dbd3c49](https://github.com/kupola-cn/kupola/commit/dbd3c49bebea47952c9ce7e4e791ed97e2f14560))
* **css:** update CSS comments from @kupola/kupola/css to @kupola/platform/css ([f1e3215](https://github.com/kupola-cn/kupola/commit/f1e32154b1f809f7a3ea86d0dc0216071e654df5))
* **vscode:** clarify packaging command should run in vscode-kupola directory ([af452fe](https://github.com/kupola-cn/kupola/commit/af452fe0d3dbde4fd99a95be107111ec91767376))
* **vscode:** fix extension install instructions with correct version and packaging steps ([e7188ae](https://github.com/kupola-cn/kupola/commit/e7188ae48d0ee7f283247e350274675b548d9e39))


### Refactor

* **core:** split platform modules from core ([9bd6be2](https://github.com/kupola-cn/kupola/commit/9bd6be20fb22b62204bd494cfa57689aba705250))
* move vscode-kupola to root directory (sibling of packages/) ([acb77d8](https://github.com/kupola-cn/kupola/commit/acb77d8161c1d5930c1f904e04553d97d2fba383))

## 3.1.0 (2026-07-25)

### Architecture

- Split `@kupola/kupola` monolith into two independent packages:
  - `@kupola/core` (~4.4 KB) — pure reactivity engine (Signal, computed, effect, batch)
  - `@kupola/platform` (~47 KB) — template rendering, component system, directives, theme, lazy loading, SSR, i18n
- `@kupola/kupola` is now marked `private: true` and no longer published to npm
- Module imports support three patterns: full core import, platform import, and subpath imports (e.g., `@kupola/core/signal`, `@kupola/platform/theme`)
- All 1281 tests pass after module splitting (70 test suites)
- Updated all documentation, examples, and templates to use new import paths

### Breaking Changes

- `@kupola/kupola` is no longer published; use `@kupola/core` and/or `@kupola/platform` instead
- Import paths changed:
  - `signal`, `computed`, `effect`, `batch` → `@kupola/core`
  - `html`, `render`, `walk`, `defineComponent`, `theme`, `lazy`, `renderToString`, `i18n` → `@kupola/platform`
- `@kupola/components` peerDependencies updated to require `@kupola/core` and `@kupola/platform`
- `@kupola/ai-adapter` peerDependency updated to require `@kupola/core`

### Features

- Subpath exports for all packages (e.g., `@kupola/platform/directives`, `@kupola/components/dialog`)
- Tree-shaking support for removing unused code in final builds
- Separate build entries for core, platform, directives, i18n, and server modules
- Backward compatibility: `@kupola/core` still exports all modules via the full import path

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
