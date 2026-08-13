# Batch

Batch 是 Kupola 的批量更新机制。当你在短时间内多次修改 signal 或 reactive 对象时，batch 可以将多次更新合并为一次，减少不必要的重复计算和 DOM 更新。

## 基本用法

```js
import { batch, signal, effect } from '@kupola/core'

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
// 输出: a: 1, b: 2（只输出一次）
```

如果不使用 batch，每次修改都会触发 effect 重新执行：

```js
a.value = 1 // 输出: a: 1, b: 0
b.value = 2 // 输出: a: 1, b: 2
```

## batch.atomic

`batch.atomic` 提供原子级别的批量更新，确保在更新过程中不会被中断：

```js
import { batch, signal } from '@kupola/core'

const x = signal(0)
const y = signal(0)

batch.atomic(() => {
  x.value = 10
  // 此时 x=10, y=0 的状态不会暴露给任何消费者
  y.value = 20
  // 两个信号同时更新，消费者看到 x=10, y=20
})
```

## flushJobs

`flushJobs` 强制立即执行所有排队的更新任务，而不是等待下一个微任务：

```js
import { batch, flushJobs, signal } from '@kupola/core'

const count = signal(0)

effect(() => {
  console.log('count:', count.value)
})

batch(() => {
  count.value = 1
  count.value = 2
  count.value = 3

  // 强制立即刷新
  flushJobs()
  // 输出: count: 3
})
```

## queueJob

`queueJob` 将单个任务加入更新队列，在下一个微任务中执行：

```js
import { queueJob } from '@kupola/core'

queueJob(() => {
  console.log('下一个微任务执行')
})
```

多个 `queueJob` 调用会被合并到同一个微任务中批量执行，避免重复渲染。

## nextTick

`nextTick` 在所有批量更新完成后执行回调：

```js
import { nextTick, signal, effect } from '@kupola/core'

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
  console.log('所有更新完成')
})
// 输出:
// count: 1
// count: 2
// count: 3
// 所有更新完成
```

nextTick 在以下场景很有用：
- 在更新 DOM 后操作 DOM 元素（如获取元素尺寸）
- 在状态更新后执行依赖 DOM 的逻辑
- 确保多个组件的更新同步完成

## Scheduler

Kupola 内部使用调度器（Scheduler）管理更新队列。更新任务按照优先级排队，在合适的时机批量执行：

```js
// 调度器自动处理以下场景的批量更新：
// 1. 事件处理函数中的多次状态变更
// 2. 异步回调中的状态变更
// 3. 定时器中的状态变更
```

调度器的工作流程：
1. Signal 值变更 → 标记依赖为 dirty
2. Dirty 依赖的任务被加入队列
3. 调度器在微任务中批量执行队列中的任务
4. 执行完成后触发 nextTick 回调

## 自动批量更新

在 Kupola 中，以下场景会自动进行批量更新：

- **事件处理函数**：`@click` 等事件处理中多次修改 signal
- **生命周期钩子**：`mounted`、`created` 等钩子中的状态变更
- **模板更新**：模板表达式中的状态变更

```js
// 事件处理中的多次更新自动合并
<button @click=${() => {
  count.value++
  message.value = 'updated'
  // 两次更新合并为一次渲染
}}>更新</button>
```

## 使用场景

- **表单重置**：同时重置多个字段
- **初始化状态**：组件创建时设置多个初始值
- **数据加载**：API 响应后更新多个关联状态
- **动画优化**：批量更新动画帧中的状态

## 注意事项

- 不要在 batch 回调中执行异步操作，异步操作不会包含在 batch 中
- batch 只能合并同步更新，异步回调中的更新需要新的 batch 包裹
- 过度使用 `flushJobs` 会破坏批量更新的优势，仅在必要时使用