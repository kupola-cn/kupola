# Computed

Computed 是基于 Signal 派生出的计算属性。当依赖的 signal 发生变化时，computed 会自动重新计算，但只在**被读取时**才执行计算（惰性求值）。

## 创建 Computed

```js
import { signal, computed } from '@kupola/core'

const count = signal(0)
const doubled = computed(() => count.value * 2)

console.log(doubled.value) // 0
count.value = 5
console.log(doubled.value) // 10
```

Computed 接受一个返回值的函数，该函数内部访问的 signal 会被自动追踪为依赖。

## 惰性求值（Lazy Evaluation）

Computed 的核心特性是**惰性求值**：计算函数不会在依赖变化时立即执行，而是在下一次读取 `.value` 时才执行。

```js
const count = signal(0)
const expensive = computed(() => {
  console.log('计算中...')
  return count.value * 100
})

// 此时 control 不会打印任何内容
count.value = 1
count.value = 2
count.value = 3

// 只有读取时才会计算
console.log(expensive.value) // 打印 "计算中..." 然后 300
```

这种机制避免了不必要的计算开销。如果某个 computed 的依赖多次变化但从未被读取，计算函数根本不会执行。

## 依赖追踪

Computed 的依赖追踪是自动且精确的：

```js
const firstName = signal('张')
const lastName = signal('三')
const fullName = computed(() => `${firstName.value}${lastName.value}`)

// 只追踪实际访问的依赖
console.log(fullName.value) // "张三"

firstName.value = '李'
console.log(fullName.value) // "李三"
```

## 链式 Computed

Computed 可以依赖其他 computed，形成计算链：

```js
const price = signal(100)
const quantity = signal(3)

const subtotal = computed(() => price.value * quantity.value)
const tax = computed(() => subtotal.value * 0.13)
const total = computed(() => subtotal.value + tax.value)

console.log(total.value) // 339

price.value = 200
console.log(total.value) // 678
```

当 price 变化时，Kupola 会按依赖顺序依次更新 subtotal → tax → total，每个 computed 只计算一次。

## 与普通函数的区别

```js
// 普通函数：每次调用都重新计算
function getDoubled() {
  return count.value * 2
}

// Computed：缓存结果，只在依赖变化时重新计算
const doubled = computed(() => count.value * 2)
```

多次读取同一个 computed 的 `.value`，只要依赖未变化，计算函数只会执行一次。

## 使用场景

- **数据转换**：过滤、排序、格式化数据显示
- **聚合计算**：合计、平均值、统计信息
- **条件判断**：基于多个状态派生的布尔值
- **模板中的复杂表达式**：将模板逻辑提取到 computed 中

```js
const todos = signal([...])
const doneCount = computed(() => todos.value.filter(t => t.done).length)
const progress = computed(() => doneCount.value / todos.value.length * 100)
```

## 注意事项

- Computed 函数应该是**纯函数**，不应有副作用。副作用逻辑应放在 `effect` 中
- 不要在 computed 中修改其他 signal，这会导致不可预测的行为
- Computed 返回的是只读的——你只能读取 `.value`，不能直接赋值