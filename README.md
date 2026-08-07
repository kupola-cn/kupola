[中文文档](./README.zh-CN.md) | [Documentation](https://kupola-cn.github.io/kupola/)

# Kupola

[![CI](https://github.com/kupola-cn/kupola/actions/workflows/ci.yml/badge.svg)](https://github.com/kupola-cn/kupola/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@kupola/platform)](https://www.npmjs.com/package/@kupola/platform)
[![License](https://img.shields.io/npm/l/@kupola/platform)](https://github.com/kupola-cn/kupola/blob/main/LICENSE)

**Example application:** [Kupola App](https://github.com/kupola-cn/kupola-app) — a complete administration console built with Kupola.

Kupola is a zero-framework interaction layer for server-rendered HTML. Use the
directive runtime for interactive islands, signal/template APIs for
JavaScript-owned views, and the optional native component library where a
reusable component is the better boundary. `@kupola/router` and `@kupola/auth`
add client-side routing and permission management built for SSR apps.

## Features

- `k-*` directives — reactive islands in server HTML (`k-data`, `k-show`, `k-model`, `k-for`, …)
- Signals & template literals — state-driven views without a framework
- Native components — table, form, tree, menu, select, and more
- Router & auth — hash/history/memory modes, route guards, permissions
- SSR-friendly — hydrates static markup; islands need no build step

## Install

```bash
npm install @kupola/platform
```

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

## Packages

| Package | Purpose |
|---|---|
| `@kupola/platform` | Directives, signals, templates, rendering |
| `@kupola/components` | Optional native component library |
| `@kupola/router` | Client-side routing |
| `@kupola/auth` | Permission management |
| `@kupola/ai-adapter` | AI/LLM integration adapter |
| `@kupola/create-kupola` | Project scaffolding |

## Documentation

- [Getting started](https://kupola-cn.github.io/kupola/guide/getting-started)
- [Directive capability matrix](https://kupola-cn.github.io/kupola/guide/directive-matrix)
- [Form state strategy](https://kupola-cn.github.io/kupola/guide/form-state)
- [Dynamic fragment protocol](https://kupola-cn.github.io/kupola/guide/dynamic-fragments)
- [Security policy integration](https://kupola-cn.github.io/kupola/guide/security-policy)
- [Performance boundaries](https://kupola-cn.github.io/kupola/guide/performance)

## Development

Run `npm run verify` for the full lint/type/test/build/size gate. Kupola supports
Node 20 and newer. See the [changelog](./CHANGELOG.md),
[contributing guide](./CONTRIBUTING.md), [security policy](./SECURITY.md),
[code of conduct](./CODE_OF_CONDUCT.md), and [MIT license](./LICENSE).
