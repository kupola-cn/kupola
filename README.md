[中文文档](./README.zh-CN.md) | [Documentation](https://kupola-cn.github.io/kupola/)

# Kupola

[![CI](https://github.com/kupola-cn/kupola/actions/workflows/ci.yml/badge.svg)](https://github.com/kupola-cn/kupola/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@kupola/platform)](https://www.npmjs.com/package/@kupola/platform)
[![License](https://img.shields.io/npm/l/@kupola/platform)](https://github.com/kupola-cn/kupola/blob/main/LICENSE)

**Example application:** [Kupola App](https://github.com/kupola-cn/kupola-app) demonstrates a complete administration console built with Kupola.

Kupola is a zero-framework interaction layer for server-rendered HTML. Use its
directive runtime for small interactive islands, its signal/template APIs for
JavaScript-owned views, and its optional native component library where a
reusable component is the better boundary.

Kupola also provides `@kupola/router` for client-side routing and `@kupola/auth`
for permission management, both designed to work seamlessly with server-rendered
applications.

## Install

```bash
npm install @kupola/platform
```

```html
<div k-data="{ count: 0 }">
  <button @click="count++" k-text="count"></button>
</div>
<script type="module">
  import { walk } from '@kupola/platform/directives'
  walk(document.body)
</script>
```

Directive expressions are for trusted application templates only. They use
`new Function()` and therefore are not a sandbox. Use `k-text` for user content;
provide an application sanitizer before using `k-html`.

## Application Lifecycle

`createApp` supports synchronous and asynchronous plugin hooks. Use `mount()` /
`destroy()` only when every plugin hook is synchronous. For asynchronous setup or
cleanup, use the paired async lifecycle methods:

```js
import { createApp, html } from '@kupola/platform';

const app = createApp(html`<main>Ready</main>`).use({
  async install() {
    await loadFeatureFlags();
  },
  async destroy() {
    await closeFeatureConnection();
  },
});

await app.mountAsync(document.querySelector('#app'));
await app.destroyAsync();
```

Lifecycle transitions are serialized. While `mountAsync()` or `destroyAsync()`
is pending, the app cannot be mounted again or receive additional plugins.

## Documentation

- [Getting started](https://kupola-cn.github.io/kupola/guide/getting-started)
- [Directive capability matrix](https://kupola-cn.github.io/kupola/guide/directive-matrix)
- [Form state strategy](https://kupola-cn.github.io/kupola/guide/form-state)
- [Dynamic fragment protocol](https://kupola-cn.github.io/kupola/guide/dynamic-fragments)
- [Security policy integration](https://kupola-cn.github.io/kupola/guide/security-policy)
- [Performance boundaries](https://kupola-cn.github.io/kupola/guide/performance)

For development and release checks, use `npm run verify`. Kupola supports Node
18, 20, and 22. See the [changelog](./CHANGELOG.md),
[contributing guide](./CONTRIBUTING.md), [security policy](./SECURITY.md),
[code of conduct](./CODE_OF_CONDUCT.md), and [MIT license](./LICENSE).
