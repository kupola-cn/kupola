[中文文档](./README.zh-CN.md) | [Documentation](https://kupola-cn.github.io/kupola/)

# Kupola

Kupola is a zero-framework interaction layer for server-rendered HTML. Use its
directive runtime for small interactive islands, its signal/template APIs for
JavaScript-owned views, and its optional native component library where a
reusable component is the better boundary.

## Install

```bash
npm install @kupola/kupola
```

```html
<div k-data="{ count: 0 }">
  <button @click="count++" k-text="count"></button>
</div>
<script type="module">
  import { walk } from '@kupola/kupola/directives'
  walk(document.body)
</script>
```

Directive expressions are for trusted application templates only. They use
`new Function()` and therefore are not a sandbox. Use `k-text` for user content;
provide an application sanitizer before using `k-html`.

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
