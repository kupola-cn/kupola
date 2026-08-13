# @kupola/platform

[![npm version](https://img.shields.io/npm/v/@kupola/platform)](https://www.npmjs.com/package/@kupola/platform)
[![License](https://img.shields.io/npm/l/@kupola/platform)](https://github.com/kupola-cn/kupola/blob/main/LICENSE)

Full-featured reactive application platform — signals, templates, components, directives, theme, i18n, SSR, and more.

## Install

```bash
npm install @kupola/platform
```

## Quick Start

### Directive Islands (server-rendered HTML)

```html
<div id="counter" k-data="{ count: 0 }">
  <button @click="count++" k-text="count"></button>
</div>
<script type="module">
  import { walkOnce } from '@kupola/platform/directives';
  walkOnce(document.getElementById('counter'));
</script>
```

### Vite Application

```js
import { createApp, defineComponent, html } from '@kupola/platform';
import '@kupola/platform/css';

const App = defineComponent({
  setup() {
    const count = signal(0);
    return html`
      <button onclick=${() => count.value++}>
        Count: ${count}
      </button>
    `;
  },
});

await createApp(App).mountAsync('#app');
```

### SSR

```js
import { renderToString } from '@kupola/platform/server';
const html = await renderToString(App);
```

## Feature Modules

### Reactivity (re-exported from @kupola/core)

```js
import { signal, computed, effect, watch, reactive, batch, nextTick } from '@kupola/platform';

const count = signal(0);
const doubled = computed(() => count.value * 2);
effect(() => console.log('Count:', count.value));
```

### Template & Rendering

```js
import { html, render, mount, createApp } from '@kupola/platform';

const template = html`<div class="app">${content}</div>`;
render(template, document.getElementById('app'));
```

### Component System

```js
import { defineComponent, defineView, register, provide, inject } from '@kupola/platform';

const MyComponent = defineComponent({
  setup() {
    const state = signal({ name: 'Kupola' });
    return html`<h1>Hello ${state.value.name}</h1>`;
  },
});

// With async setup
const AsyncComponent = defineComponent({
  async setup() {
    const data = await fetchData();
    return html`<div>${data}</div>`;
  },
});
```

### Directives

```js
import { walk, walkOnce, walkAuto, defineScope, $, $$ } from '@kupola/platform/directives';
```

12+ built-in directives: `k-data`, `k-show`, `k-text`, `k-html`, `k-bind`, `k-on`, `k-model`, `k-if`, `k-for`, `k-class`, `k-style`, `k-transition`, `k-once`.

### Theme System

```js
import { setTheme, toggleTheme, getPreferredTheme, setBrandColor, getBrandColors } from '@kupola/platform';
```

- Anti-FOUC via `themePreload()` / `getThemeInlineScript()`
- Light/dark mode with `setTheme()` / `toggleTheme()`
- Brand color customization with `setBrandColor()` / `getBrandColors()`
- 18 theme APIs total

### CSS Modules

```js
import { css } from '@kupola/platform';

const styles = css`
  .card { padding: 16px; border-radius: 8px; }
  .card:hover { background: var(--k-color-bg-hover); }
  :global(.dark) .card { background: #1a1a2e; }
`;
```

### Form State (useForm)

```js
import { useForm } from '@kupola/platform';

const form = useForm(
  { name: '', age: 0 },
  (values) => {
    const errors = {};
    if (!values.name) errors.name = 'Required';
    if (values.age < 0) errors.age = 'Invalid';
    return errors;
  },
);

// Reactive: form.values, form.errors, form.touched, form.isDirty, form.isValid
form.handleSubmit(async (values) => await api.save(values));
```

### Query Cache (useQuery)

```js
import { useQuery, invalidateQuery } from '@kupola/platform';

const patients = await useQuery('patients:list', () => api.listPatients(), { staleTime: 60_000 });
// After mutation:
await api.createPatient(data);
invalidateQuery('patients:list');
```

### Lazy Components

```js
import { lazyComponent, preloadComponent } from '@kupola/platform';

const HeavyPage = lazyComponent(() => import('./HeavyPage.js'));
await preloadComponent(HeavyPage); // Preload on hover
```

### Error Boundary

```js
import { ErrorBoundary } from '@kupola/platform';

const SafeComponent = ErrorBoundary(MyComponent, {
  fallback: html`<div class="error">Something went wrong</div>`,
});
```

### Internationalization (i18n)

```js
import { setLocale, t, formatDate, formatNumber } from '@kupola/platform/i18n';

setLocale('zh-CN');
t('welcome'); // 欢迎
formatDate(new Date()); // 2026/8/13
```

### SSR

```js
import { renderToString, hydrate } from '@kupola/platform/server';

const html = await renderToString(App);
// On client:
hydrate(App, document.getElementById('app'));
```

## Subpath Exports

| Import | Content |
|--------|---------|
| `@kupola/platform` | Full platform (reactivity + render + components + directives) |
| `@kupola/platform/template` | `html`, `TemplateResult`, `htmlString`, `HtmlString` |
| `@kupola/platform/render` | `render`, `mount`, `createApp` |
| `@kupola/platform/component` | `defineComponent`, `defineView`, `register`, `provide`, `inject` |
| `@kupola/platform/directives` | `walk`, `walkOnce`, `walkAuto`, `defineScope`, `$`, `$$` |
| `@kupola/platform/theme` | `setTheme`, `toggleTheme`, `getBrandColors`, `setBrandColor`, etc. |
| `@kupola/platform/lazy` | `lazyComponent`, `preloadComponent` |
| `@kupola/platform/server` | `renderToString`, `hydrate` |
| `@kupola/platform/i18n` | `setLocale`, `t`, `formatDate`, `formatNumber`, `formatCurrency` |
| `@kupola/platform/errors` | `ErrorBoundary` |
| `@kupola/platform/css` | Design tokens CSS |
| `@kupola/platform/css/tokens` | CSS custom properties |
| `@kupola/platform/css/components` | Component styles |
| `@kupola/platform/css/responsive` | Responsive utilities |

## Security

Directive expressions use `new Function()` and are intended for trusted application templates. For user content, use `k-text`. Provide an application sanitizer before using `k-html`.

## License

MIT