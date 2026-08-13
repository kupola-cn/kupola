# Watch

Watch 用于监听响应式数据的变化，并在变化时执行回调。与 effect 不同，watch 可以获取变化前后的旧值和新值，适合需要对比数据的场景。

## 基本用法

```js
import { watch, signal } from '@kupola/core'

const count = signal(0)

// 基本用法：监听 + 获取新旧值
const unwatch = watch(
  () => count.value,
  (newVal, oldVal) => {
    console.log(`count 从 ${oldVal} 变为 ${newVal}`)
  }
)

count.value = 5 // 输出: count 从 0 变为 5
count.value = 10 // 输出: count 从 5 变为 10
```

Watch 接受两个参数：
1. **getter 函数**：返回要监听的值
2. **回调函数**：`(newVal, oldVal) => void`，值变化时调用

## 立即执行（immediate）

默认情况下，watch 只在值变化时触发回调。设置 `immediate: true` 可以在创建时立即执行一次：

```js
watch(
  () => count.value,
  (current) => {
    console.log('当前值:', current)
  },
  { immediate: true }
)
// 创建时立即输出: 当前值: 0
// count.value = 5 时输出: 当前值: 5
```

## 深度监听（deep）

当监听的是 reactive 对象时，默认只监听引用变化。设置 `deep: true` 可以监听深层属性变化：

```js
import { watch, reactive } from '@kupola/core'

const obj = reactive({ nested: { value: 1 } })

// 不设置 deep：只有 obj 被整体替换时才触发
watch(
  () => obj,
  (newVal) => console.log('obj 变化了'),
  { deep: false }
)

// 设置 deep：任何嵌套属性变化都会触发
watch(
  () => obj,
  (newVal) => console.log('obj 深层变化了'),
  { deep: true }
)

obj.nested.value = 2 // 只有 deep: true 的 watch 会触发
```

## onCleanup

Watch 回调支持 `onCleanup`，用于在下次执行前清理上一次的副作用：

```js
const keyword = signal('')

watch(
  () => keyword.value,
  async (newVal, oldVal, onCleanup) => {
    let cancelled = false

    onCleanup(() => {
      cancelled = true
    })

    const data = await fetch(`/api/search?q=${newVal}`).then(r => r.json())

    if (!cancelled) {
      // 只有最新的请求结果才会被处理
      updateResults(data)
    }
  }
)
```

## 监听多个源

Watch 可以同时监听多个数据源：

```js
const firstName = signal('')
const lastName = signal('')

watch(
  () => [firstName.value, lastName.value],
  ([newFirst, newLast], [oldFirst, oldLast]) => {
    console.log(`姓名从 ${oldFirst}${oldLast} 变为 ${newFirst}${newLast}`)
  }
)
```

## 停止监听

Watch 返回一个停止函数，调用后不再监听：

```js
const unwatch = watch(() => count.value, (v) => console.log(v))

// 停止监听
unwatch()

count.value = 100 // 不会触发回调
```

## 与 effect 的对比

| 特性 | watch | effect |
|------|-------|--------|
| 获取旧值 | 支持 `(newVal, oldVal)` | 不支持 |
| 立即执行 | 可选（`immediate`） | 默认立即执行 |
| 深度监听 | 可选（`deep`） | 自动追踪 |
| 使用场景 | 数据对比、异步请求 | 声明式副作用 |

## 使用场景

- **搜索输入**：监听关键词变化，发送 API 请求
- **表单校验**：监听字段变化，实时校验
- **路由同步**：监听状态变化，更新 URL 参数
- **数据持久化**：监听数据变化，写入 localStorage
- **跨组件通信**：监听共享状态变化

## 注意事项

- Watch 回调中尽量避免修改被监听的数据源，可能导致无限循环
- 高频变化的数据源（如滚动位置）考虑使用 `debounce` 节流
- 在组件销毁时 watch 会自动停止，手动创建的 watch 需要手动停止