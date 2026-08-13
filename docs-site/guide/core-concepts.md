# 核心概念

Kupola 3.0 的响应式体系建立在几个核心概念之上。以下页面详细介绍了每个概念的原理、用法和使用场景。

## 响应式基础

- **[Signal](/guide/signal)** — 响应式数据的基本单元，`.value` 读写，`.peek()` 无跟踪读取
- **[Computed](/guide/computed)** — 基于 Signal 的派生计算属性，惰性求值，自动依赖追踪
- **[Effect](/guide/effect)** — 副作用执行器，依赖变化时自动重新执行，支持 EffectScope 和清理

## 响应式进阶

- **[Reactive](/guide/reactive)** — 深层响应式对象，自动追踪嵌套属性和数组，`isReactive` / `toRaw`
- **[Watch](/guide/watch)** — 监听数据变化并获取新旧值，支持深度监听和 `immediate`
- **[Batch](/guide/batch)** — 批量更新机制，`batch.atomic`、`flushJobs`、`queueJob`、`nextTick`、调度器

## 其他概念

- **[Template](/guide/templates)** — 使用 `html` 模板字面量创建 DOM，Signal 自动绑定
- **[Render](/guide/ssr)** — 将模板渲染到 DOM，支持服务端渲染和客户端水合
- **[Component](/guide/lifecycle)** — 使用 `defineComponent` 定义可复用组件，支持 props 和生命周期
- **[Provide / Inject](/guide/lifecycle#provide--inject)** — 组件间全局状态共享，无需逐层传递 props
- **[生命周期](/guide/lifecycle)** — `created`、`mounted`、`destroyed` 等生命周期钩子

## 快速示例

```js
import { signal, computed, effect, batch } from '@kupola/core'
import { html } from '@kupola/platform/template'

const count = signal(0)
const doubled = computed(() => count.value * 2)

effect(() => {
  console.log(`Count: ${count.value}, Doubled: ${doubled.value}`)
})

// 批量更新，只触发一次 effect
batch(() => {
  count.value = 5
})
```

核心库仅 4.4KB，零依赖，按需使用。