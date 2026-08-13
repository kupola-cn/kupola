# Reactive

Reactive 是 Kupola 的深层响应式对象 API。与 Signal 不同，Reactive 会自动追踪对象中所有嵌套属性的访问和修改，支持嵌套对象和数组。

## 创建 Reactive 对象

```js
import { reactive, effect } from '@kupola/core'

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

## 深层响应式

Reactive 的响应式是**深层的**——无论嵌套多少层，所有属性的读写都会被追踪：

```js
const state = reactive({ a: { b: { c: { value: 1 } } } })

effect(() => {
  console.log(state.a.b.c.value)
})

state.a.b.c.value = 2 // 触发 effect
```

## Reactive API

```js
// 创建响应式对象
const state = reactive({ count: 0 })

// 访问属性（建立依赖）
state.count // 0

// 修改属性（触发更新）
state.count = 1

// 动态添加属性
state.newProp = 'hello' // 自动变为响应式

// 支持嵌套对象
state.nested = { value: 10 }
state.nested.value = 20 // 深层响应式

// 支持数组
state.items = [1, 2, 3]
state.items.push(4) // 变异方法支持
state.items[0] = 99 // 索引赋值也支持

// 支持数组方法
state.items = state.items.filter(i => i > 1)
state.items = state.items.map(i => i * 2)
```

## isReactive

检查一个对象是否是 reactive 创建的响应式对象：

```js
import { reactive, isReactive } from '@kupola/core'

const state = reactive({ count: 0 })
const plain = { count: 0 }

console.log(isReactive(state)) // true
console.log(isReactive(plain))  // false
```

## toRaw

获取 reactive 对象的原始（非响应式）版本：

```js
import { reactive, toRaw } from '@kupola/core'

const state = reactive({ count: 0 })
const raw = toRaw(state)

console.log(raw === state) // false
console.log(raw.count) // 0

// 修改原始对象不会触发响应式更新
raw.count = 10 // 不会触发 effect
```

`toRaw` 在以下场景很有用：
- 需要将响应式数据传递给不感知响应式的第三方库
- 在不需要响应式追踪的场景中访问原始数据
- 调试时查看数据的原始状态

## DeepReactive

对于需要更精细控制的大型响应式对象，DeepReactive 提供了额外的能力：

```js
import { DeepReactive } from '@kupola/core'

const state = new DeepReactive({
  users: [
    { id: 1, name: 'Alice', settings: { theme: 'light' } },
    { id: 2, name: 'Bob', settings: { theme: 'dark' } },
  ],
  config: {
    pageSize: 20,
    sortBy: 'name',
  },
})
```

## 与 Signal 的选择

| 场景 | 推荐 |
|------|------|
| 简单值（数字、字符串、布尔值） | `signal` |
| 嵌套对象、复杂数据结构 | `reactive` |
| 需要替换整个对象引用 | `signal` + 对象 |
| 表单数据、配置对象 | `reactive` |

## 清理

```js
// 清理 reactive 的响应式追踪（防止内存泄漏）
state.dispose()
```

当 reactive 对象不再需要时，应该调用 `dispose()` 清理所有追踪和监听器。

## 注意事项

- Reactive 对象不能直接解构，解构会丢失响应式。如需解构，使用 `toRaw` 获取原始值
- 避免在 reactive 中存储大型二进制数据（如 Blob、File），这些数据不需要响应式
- 数组的 `length` 变化也会被追踪，大量数组操作时注意性能