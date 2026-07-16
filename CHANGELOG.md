# Changelog

## 2.0.0-beta

- Accessibility: ARIA for Modal/Drawer/Dialog/Dropdown, focus trap, label association, keyboard navigation (Home/End/Tab)
- i18n: component integration (Table/Dialog/Select/DatePicker/TimePicker), months & weekdays
- CSS design system: tokens + components + dark/light themes
- Plugins: Vite & Webpack auto CSS injection
- ESLint plugin: 3 rules (no-invalid-directives, prefer-t-function, no-innerhtml-user-input)
- ErrorBoundary utility for graceful error handling
- XSS fix: notification component HTML escaping
- Performance benchmarks: Signal/VirtualList/Table/SSR (8 tests)
- VS Code extension: snippets + directive auto-completion + hover docs
- Storybook: interactive component docs (Modal/Drawer/Table/Select/Alert/Notification)
- DevTools: Signal reactivity profiler (enableProfiler/getProfileReport/printProfileReport)
- Lazy loading: async component initialization (lazyComponent/preloadComponent)
- create-kupola: --typescript flag, static-ts template with Vite + TS
- FAQ documentation (FAQ.md)
- Anti-FOUC: themePreload/setTheme/toggleTheme + [k-cloak] CSS rule + inline preload script
- create-kupola templates: inline theme preload + localStorage persistence
- create-kupola templates: rich examples (Counter, Todo, Form, Reactive Computed)
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
