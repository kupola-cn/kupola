# Signal

Signal 是 Kupola 响应式体系中最基础的数据单元，核心库仅 4.4KB。Signal 持有一个值，当值发生变化时，所有依赖它的计算属性和副作用会自动更新。

## 创建 Signal

```js
import { signal } from '@kupola/core'

const count = signal(0)
const name = signal('Kupola')
const items = signal([1, 2, 3])
const config = signal({ theme: 'dark' })
```

Signal 可以持有任意类型的值：数字、字符串、数组、对象，甚至是函数。

## .value 读写

Signal 的读写通过 `.value` 属性完成：

```js
const count = signal(0)

// 读取当前值
console.log(count.value) // 0

// 写入新值
count.value = 5

// 基于当前值更新
count.value = count.value + 1
```

读取 `.value` 时，Kupola 会自动追踪依赖关系——记录哪些 computed 或 effect 函数访问了当前 signal。写入 `.value` 时，Kupola 会通知所有依赖该 signal 的消费者重新计算。

## .peek() 无跟踪读取

有时你需要读取 signal 的值，但**不希望**建立依赖关系。此时使用 `.peek()`：

```js
const a = signal(1)
const b = signal(2)

effect(() => {
  // b.value 不会被追踪，因为使用了 .peek()
  console.log(`a=${a.value}, b=${b.peek()}`)
})

// 修改 b 不会触发 effect
b.value = 10 // 不会重新执行
```

`.peek()` 在以下场景非常有用：
- 在 effect 中读取不需要追踪的辅助状态
- 在事件处理中读取当前值但不建立依赖
- 避免不必要的重复计算

## Signal 类

Signal 实际上是一个类实例，它提供了完整的 API：

```js
const s = signal(0)

s.value    // 读取值（建立依赖）
s.peek()   // 读取值（不建立依赖）
s.value = 1 // 写入值（触发更新）
```

Signal 是不可变的引用——你可以将 signal 本身传递给多个消费者，它们共享同一个响应式数据源。

## 与 computed 配合

```js
const count = signal(0)
const doubled = computed(() => count.value * 2)

console.log(doubled.value) // 0
count.value = 5
console.log(doubled.value) // 10
```

## 与模板配合

Signal 可以直接嵌入模板字面量，当值变化时 DOM 自动更新：

```js
import { html } from '@kupola/platform/template'

const count = signal(0)
const template = html`<span>计数：${count}</span>`
```

## 使用场景

- **计数器、开关状态**：简单的 UI 状态
- **表单输入值**：绑定到 `k-model`
- **单个数据源**：不需要深度响应式的场景
- **跨组件共享**：将 signal 作为 props 传递

## 注意事项

- Signal 适合简单的值类型。对于复杂的嵌套对象，推荐使用 `reactive`
- 在 effect 中修改 signal 时注意避免无限循环
- `.peek()` 可以优化性能，但不要滥用——它绕过了依赖追踪