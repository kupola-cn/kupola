# Effect

Effect 是 Kupola 的副作用执行器。当 effect 函数内部访问的 signal 或 computed 发生变化时，effect 函数会自动重新执行。

## 创建 Effect

```js
import { signal, effect } from '@kupola/core'

const count = signal(0)

effect(() => {
  console.log(`计数：${count.value}`)
})

count.value = 1 // 输出: 计数：1
count.value = 2 // 输出: 计数：2
```

Effect 在创建时会**立即执行一次**，之后每当依赖变化时重新执行。

## 自动依赖追踪

Effect 的依赖追踪是自动的，你不需要手动声明依赖：

```js
const a = signal(1)
const b = signal(2)

effect(() => {
  // 只追踪实际访问的 signal
  if (a.value > 5) {
    console.log(b.value) // 只有 a > 5 时才追踪 b
  }
})

a.value = 3 // 不追踪 b，不会触发
b.value = 10 // 不会触发（b 未被追踪）
a.value = 6 // 触发（此时开始追踪 b）
b.value = 20 // 触发（b 已被追踪）
```

## 停止 Effect

Effect 返回一个停止函数，调用后 effect 不再响应依赖变化：

```js
const stop = effect(() => {
  console.log(count.value)
})

stop() // 停止监听

count.value = 10 // 不再触发
```

## EffectScope

`effectScope` 用于批量管理多个 effect 的生命周期。当你需要一次性清理一组 effect 时，将它们放入同一个 scope：

```js
import { effectScope, signal, effect } from '@kupola/core'

const scope = effectScope()

scope.run(() => {
  effect(() => console.log('effect 1:', a.value))
  effect(() => console.log('effect 2:', b.value))
  effect(() => console.log('effect 3:', c.value))
})

// 停止 scope 中的所有 effect
scope.stop()
```

EffectScope 在组件卸载时特别有用——你可以将组件内所有 effect 放入一个 scope，卸载时一键清理。

## onScopeDispose

`onScopeDispose` 注册一个在当前 scope 销毁时执行的清理回调：

```js
const scope = effectScope()

scope.run(() => {
  const timer = setInterval(() => { ... }, 1000)

  onScopeDispose(() => {
    clearInterval(timer)
    console.log('定时器已清理')
  })
})

scope.stop() // 自动调用清理回调，清除定时器
```

## 清理（Cleanup）

Effect 支持在重新执行前清理上一次的副作用：

```js
const keyword = signal('')

effect((onCleanup) => {
  const controller = new AbortController()

  fetch(`/api/search?q=${keyword.value}`, {
    signal: controller.signal,
  }).then(res => res.json()).then(data => {
    // 处理结果
  })

  // 在下一次执行前或停止时取消请求
  onCleanup(() => {
    controller.abort()
  })
})
```

当 keyword 快速变化时，`onCleanup` 确保只有最后一次请求的结果被处理，避免了竞态条件。

## 使用场景

- **DOM 操作**：根据状态更新非 Kupola 管理的 DOM
- **数据持久化**：状态变化时写入 localStorage
- **API 请求**：搜索关键词变化时发送请求
- **第三方库集成**：同步 Kupola 状态到外部库
- **日志和调试**：追踪状态变化历史

## 与 watch 的区别

| 特性 | effect | watch |
|------|--------|-------|
| 触发时机 | 依赖变化时立即执行 | 依赖变化时执行，可获取新旧值 |
| 获取旧值 | 不支持 | 支持 `(newVal, oldVal)` |
| 使用场景 | 声明式副作用 | 需要对比新旧值的场景 |

## 注意事项

- 不要在 effect 中做无限制的状态更新，可能导致无限循环
- effect 在创建时立即执行，如果某些逻辑只需要在变化时执行，考虑使用 `watch`
- 记得在组件销毁时清理 effect，防止内存泄漏