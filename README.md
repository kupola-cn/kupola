[中文文档](./README.zh-CN.md) | [Documentation](https://kupola-cn.github.io/kupola/)

# Kupola

[![CI](https://github.com/kupola-cn/kupola/actions/workflows/ci.yml/badge.svg)](https://github.com/kupola-cn/kupola/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@kupola/platform)](https://www.npmjs.com/package/@kupola/platform)
[![License](https://img.shields.io/npm/l/@kupola/platform)](https://github.com/kupola-cn/kupola/blob/main/LICENSE)

a complete administration console built with Kupola：
**Example application:** [Kupola App](https://github.com/kupola-cn/kupola-app) 

Kupola is a lightweight reactive application platform for building modern web
applications. It provides a complete toolbox — signals, templates, components,
directives, routing, permissions, theme, i18n, SSR, and more — without depending
on any major framework. Use the directive runtime for interactive islands in
server-rendered HTML, or `createApp` for full JavaScript-owned single-page
applications.

## Features

- **Reactivity** — signals, computed, effects, watch, reactive, batch, scheduler
- **Template engine** — `html` tagged template literals, `render`, `mount`, `createApp`
- **Component system** — `defineComponent`, `defineView`, `provide`/`inject`, component registration, lazy loading
- **Directives** — `k-data`, `k-show`, `k-model`, `k-for`, `k-if`, `k-transition`, and 7 more
- **Theme system** — anti-FOUC, light/dark mode, brand colors, 18 theme APIs
- **CSS Modules** — `css` tagged template for scoped styles with `:global()` support
- **Form state** — `useForm` with reactive validation, dirty/touched tracking, async submit
- **Query cache** — `useQuery` for request deduplication, caching, and invalidation
- **i18n** — built-in Chinese/English messages, date/number/currency formatting
- **SSR** — `renderToString` + `hydrate` with hydration markers
- **Error boundary** — `ErrorBoundary` for graceful component error handling
- **DevTools** — signal profiler, `window.__KUPOLA_SIGNALS__` debug registry

## Install

### Directive islands (server-rendered HTML)

```bash
npm install @kupola/platform
```

### Vite single-page application

```bash
npm install @kupola/core @kupola/platform @kupola/components
```

### With routing and permissions

```bash
npm install @kupola/router @kupola/auth
```

## Quick Start

### Directive Islands

```html
<div id="counter" k-data="{ count: 0 }">
  <button @click="count++" k-text="count"></button>
</div>
<script type="module">
  import { walkOnce } from '@kupola/platform/directives';
  walkOnce(document.getElementById('counter'));
</script>
```

Use `walkOnce` on the island root so repeated initialization returns the
existing instance instead of double-binding. When external code removes the
node (e.g. HTMX, Turbo, a modal library), use `walkAuto` for automatic cleanup.

> Directive expressions are for trusted application templates only. They use
> `new Function()` and are not a sandbox. Use `k-text` for user content, and
> provide an application sanitizer before using `k-html`.

### Vite Application

```js
import { createApp, defineComponent, html, signal } from '@kupola/platform';
import '@kupola/platform/css';
import { Panel } from '@kupola/components/panel';

const AppRoot = defineComponent({
  setup() {
    const count = signal(0);
    return html`
      ${Panel({ title: 'Counter' }, html`
        <button onclick=${() => count.value++}>
          Count: ${count}
        </button>
      `)}
    `;
  },
});

await createApp(AppRoot).mountAsync('#app');
```

### SSR

```js
import { renderToString } from '@kupola/platform/server';

const html = await renderToString(AppRoot);
// On client: hydrate(AppRoot, document.getElementById('app'))
```

## Packages

| Package | Purpose | Standalone | README |
|---------|---------|:----------:|:------:|
| `@kupola/core` | Reactive core (signals, computed, effects, watch, batch, scheduler) | Yes | [📖](packages/core/README.md) |
| `@kupola/platform` | Full platform (templates, components, directives, theme, i18n, SSR) | Yes | [📖](packages/platform/README.md) |
| `@kupola/components` | 50+ native UI components (Table, Form, Modal, Tree, SchemaForm, etc.) | — | [📖](packages/components/README.md) |
| `@kupola/router` | SPA routing (Hash/History/Memory, guards, scroll, transitions) | — | [📖](packages/router/README.md) |
| `@kupola/auth` | RBAC + ABAC permission management (directives, HTTP guard, store) | — | [📖](packages/auth/README.md) |
| `@kupola/ai-adapter` | AI/LLM integration adapter (engines, middleware, intent parser) | — | [📖](packages/ai-adapter/README.md) |
| `@kupola/create-kupola` | Project scaffolding (7 templates: static, Vite, Next.js, Nuxt, Flask, FastAPI, Gin) | — | [📖](packages/create-kupola/README.md) |

## Subpath Exports

All packages support tree-shakeable subpath imports for optimal bundle size:

| Import | Content |
|--------|---------|
| `@kupola/platform/template` | `html`, `TemplateResult` |
| `@kupola/platform/render` | `render`, `mount`, `createApp` |
| `@kupola/platform/component` | `defineComponent`, `defineView`, `provide`, `inject` |
| `@kupola/platform/directives` | `walk`, `walkOnce`, `walkAuto`, `defineScope` |
| `@kupola/platform/theme` | `setTheme`, `toggleTheme`, `getBrandColors`, `setBrandColor` |
| `@kupola/platform/lazy` | `lazyComponent`, `preloadComponent` |
| `@kupola/platform/server` | `renderToString`, `hydrate` |
| `@kupola/platform/i18n` | `setLocale`, `t`, `formatDate`, `formatNumber` |
| `@kupola/platform/errors` | `ErrorBoundary` |
| `@kupola/platform/css` | Design tokens, components, responsive CSS |
| `@kupola/core/devtools` | `enableProfiler`, `getProfileReport`, `resetProfiler` |
| `@kupola/components/icon-config` | Icon registration helpers |

## Documentation

- [Getting started](https://kupola-cn.github.io/kupola/guide/getting-started)
- [Vite applications](https://kupola-cn.github.io/kupola/guide/vite-app)
- [Core concepts](https://kupola-cn.github.io/kupola/guide/core-concepts)
- [Business page architecture](https://kupola-cn.github.io/kupola/guide/page-architecture)
- [Component API](https://kupola-cn.github.io/kupola/components/api)
- [Directive capability matrix](https://kupola-cn.github.io/kupola/guide/directive-matrix)
- [Form state](https://kupola-cn.github.io/kupola/guide/form-state)
- [Theme system](https://kupola-cn.github.io/kupola/guide/theme-system)
- [i18n](https://kupola-cn.github.io/kupola/guide/i18n)
- [SSR](https://kupola-cn.github.io/kupola/guide/ssr)
- [Security policy](https://kupola-cn.github.io/kupola/guide/security-policy)
- [Performance](https://kupola-cn.github.io/kupola/guide/performance)

## Development

Run `npm run verify` for the full lint/type/test/build/size gate. Kupola supports
Node 20 and newer. See the [changelog](./CHANGELOG.md),
[contributing guide](./CONTRIBUTING.md), [security policy](./SECURITY.md),
[code of conduct](./CODE_OF_CONDUCT.md), and [MIT license](./LICENSE).