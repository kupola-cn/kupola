# @kupola/core

> Core reactivity engine for [Kupola](https://github.com/kupola-cn/kupola) — Signal, computed, effect, batch, template, SSR, i18n.

## Install

```bash
npm install @kupola/core
```

## Quick Start

```js
import { signal, computed, effect, html, render } from '@kupola/core';

const count = signal(0);
const double = computed(() => count.value * 2);

effect(() => {
  console.log(`Count: ${count.value}, Double: ${double.value}`);
});

render(html`<button @click=${() => count.value++}>Count: ${count}</button>`, document.body);
```

## Signal API

```js
import { signal } from '@kupola/core';

const name = signal('Kupola');
name.value = 'New Name';
console.log(name.value);
```

## Computed API

```js
import { signal, computed } from '@kupola/core';

const firstName = signal('John');
const lastName = signal('Doe');
const fullName = computed(() => `${firstName.value} ${lastName.value}`);
```

## Effect API

```js
import { signal, effect } from '@kupola/core';

const count = signal(0);
const cleanup = effect(() => {
  console.log(`Count changed: ${count.value}`);
  return () => console.log('Cleanup');
});

// Later: cleanup();
```

## Watch API

```js
import { signal, watch } from '@kupola/core';

const state = signal({ count: 0 });

watch(() => state.value.count, (newVal, oldVal) => {
  console.log(`Count changed from ${oldVal} to ${newVal}`);
});

watch(() => state.value.count, (val) => {
  console.log('Immediate callback');
}, { immediate: true });

watch(() => state.value, (val) => {
  console.log('Deep watch');
}, { deep: true });
```

## Reactive API

```js
import { reactive, watch } from '@kupola/core';

const state = reactive({
  count: 0,
  name: 'Kupola'
});

state.count++; // triggers reactivity

watch(() => state.count, (val) => {
  console.log('Count:', val);
});
```

## Template API

```js
import { html, render } from '@kupola/core';

const name = signal('World');

render(html`<div>Hello ${name}</div>`, document.body);
```

## Batch Updates

```js
import { signal, batch, effect } from '@kupola/core';

const a = signal(0);
const b = signal(0);

effect(() => console.log(`a: ${a.value}, b: ${b.value}`));

batch(() => {
  a.value = 1;
  b.value = 2;
});
// Effect runs only once
```

## NextTick

```js
import { nextTick } from '@kupola/core';

await nextTick();
// DOM updates are flushed
```

## Provide / Inject

```js
import { provide, inject } from '@kupola/core';

// Parent
provide('theme', signal('dark'));

// Child
const theme = inject('theme');
console.log(theme.value);
```

## Server-Side Rendering

```js
import { renderToString } from '@kupola/platform/server';

const html = await renderToString(() => html`<div>SSR Content</div>`);
```

## i18n

```js
import { t, setLocale, addMessages } from '@kupola/platform/i18n';

setLocale('zh-CN');
console.log(t('hello'));

addMessages('zh-CN', {
  custom: '自定义消息'
});
```

## DevTools

```js
import { connectDevTools } from '@kupola/core';

connectDevTools();
```

## TypeScript

```ts
import type { Signal, ComputedSignal, ReactiveObject } from '@kupola/core';
```

## API Reference

| Method | Description |
|--------|-------------|
| `signal(initial)` | Create a reactive signal |
| `computed(fn)` | Create a computed value |
| `effect(fn)` | Run side effects |
| `watch(getter, cb, options?)` | Watch for changes |
| `reactive(obj)` | Create reactive object |
| `isReactive(obj)` | Check if object is reactive |
| `batch(fn)` | Batch updates |
| `nextTick()` | Wait for next tick |
| `provide(key, value)` | Provide value to children |
| `inject(key)` | Inject provided value |
| `html` | Tagged template literal |
| `render(template, container)` | Render to DOM |
| `renderToString(template)` | SSR rendering |

## License

MIT