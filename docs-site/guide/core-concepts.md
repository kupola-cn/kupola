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

## Reactive

深层响应式对象，支持嵌套对象和数组：

```js
import { reactive, effect } from '@kupola/kupola'

const state = reactive({
  user: {
    name: 'John',
    age: 30,
  },
  todos: ['Learn Kupola', 'Build app'],
})

effect(() => {
  console.log(state.user.name)
})

state.user.name = 'Jane' // 自动触发 effect
state.todos.push('New task') // 数组方法也支持
```

### reactive API

```js
// 创建响应式对象
const state = reactive({ count: 0 })

// 访问属性
state.count // 0

// 修改属性（触发更新）
state.count = 1

// 支持嵌套对象
state.nested = { value: 10 }
state.nested.value = 20 // 深层响应式

// 支持数组
state.items = [1, 2, 3]
state.items.push(4) // 变异方法支持

// 清理（防止内存泄漏）
state.dispose()
```

## Watch

监听响应式数据变化：

```js
import { watch, signal } from '@kupola/kupola'

const count = signal(0)

// 基本用法
const unwatch = watch(
  () => count.value,
  (newVal, oldVal) => {
    console.log(`count changed from ${oldVal} to ${newVal}`)
  }
)

// 立即执行
watch(
  () => count.value,
  (val) => console.log('Current:', val),
  { immediate: true }
)

// 深度监听
const obj = reactive({ nested: { value: 1 } })
watch(
  () => obj,
  (newVal) => console.log('obj changed'),
  { deep: true }
)

// 停止监听
unwatch()
```

## Provide / Inject

组件间全局状态共享：

```js
import { provide, inject, defineComponent } from '@kupola/kupola'

// 在父组件中提供
provide('theme', 'dark')
provide('user', { name: 'John' })

// 在任意子组件中注入
const Child = defineComponent({
  setup() {
    const theme = inject('theme', 'light') // 带默认值
    const user = inject('user')
    return html`<div>Theme: ${theme}</div>`
  }
})
```

## NextTick

批量更新后执行回调：

```js
import { nextTick, signal, effect } from '@kupola/kupola'

const count = signal(0)

effect(() => {
  console.log('count:', count.value)
})

// 批量更新
count.value = 1
count.value = 2
count.value = 3

// 在所有更新完成后执行
nextTick(() => {
  console.log('All updates completed')
})
```

## Batch

手动批量更新：

```js
import { batch, signal, effect } from '@kupola/kupola'

const a = signal(0)
const b = signal(0)

effect(() => {
  console.log(`a: ${a.value}, b: ${b.value}`)
})

// 批量更新，只触发一次 effect
batch(() => {
  a.value = 1
  b.value = 2
})
```

## 生命周期钩子

组件支持 `created`、`mounted`、`destroyed` 钩子：

```js
import { defineComponent, html } from '@kupola/kupola'

const MyComponent = defineComponent({
  props: ['name'],
  
  created() {
    console.log('Component created')
  },
  
  mounted() {
    console.log('Component mounted to DOM')
  },
  
  destroyed() {
    console.log('Component destroyed')
  },
  
  setup(props) {
    return html`<div>Hello, ${props.name}</div>`
  }
})
```
