# 核心概念

## Signal

响应式数据的基本单元：

```js
import { signal, computed, effect } from '@kupola/kupola'

const count = signal(0)
const doubled = computed(() => count.value * 2)

effect(() => {
  console.log(`Count: ${count.value}, Doubled: ${doubled.value}`)
})

count.value = 5 // 自动触发 effect
```

## Template

使用模板字面量创建 DOM：

```js
import { html } from '@kupola/kupola'

const name = signal('World')
const template = html`<h1>Hello, ${name}!</h1>`
```

## Render

将模板渲染到 DOM：

```js
import { render } from '@kupola/kupola'

render(template, document.getElementById('app'))
```

## Component

定义可复用组件：

```js
import { defineComponent, html, signal } from '@kupola/kupola'

const Counter = defineComponent({
  props: ['initial'],
  setup(props) {
    const count = signal(props.initial || 0)
    return html`
      <button @click=${() => count.value++}>
        Count: ${count}
      </button>
    `
  },
})
```
