# Store 状态管理

`defineStore` 是 Kupola 3.5 引入的状态管理原语，用于将多个 signal 和 computed 组织为可维护的嵌套结构。

## 基本用法

```js
import { defineStore } from '@kupola/platform'

const store = defineStore(({ signal, computed }) => ({
  count: signal(0),
  doubled: computed(() => store.count.value * 2),
  increment() {
    this.count.value++
  },
}))
```

`defineStore` 接收一个工厂函数，返回一个代理对象。工厂函数可以访问 `signal`、`computed`、`effect`、`watch` 四个核心 API。

## 分组组织

大幅减少返回值中平铺的属性数量，按领域分组：

```js
const store = defineStore(({ signal, computed }) => ({
  filters: {
    shift: signal('all'),
    status: signal('active'),
    setShift(v) { this.shift.value = v },
  },
  items: {
    list: signal([]),
    loading: signal(false),
    select(id) { /* ... */ },
  },
}))
```

模板中直接使用嵌套路径，信号保持响应式：

```js
html`<div class="filter-bar">
  <select k-model="${store.filters.shift}">...</select>
  <span>${store.filters.status}</span>
</div>`
```

## 内置方法

`defineStore` 返回的代理对象自动提供以下方法：

### `$reset()`

将所有信号恢复到工厂函数调用时的初始值：

```js
store.count.value = 100
store.filters.status.value = 'done'

store.$reset()
// store.count.value → 0
// store.filters.status.value → 'active'
```

### `$dispose()`

销毁 store 内部所有 effect 作用域，释放资源：

```js
store.$dispose()
// 之后信号仍可读写，但依赖这些信号的 effect 不会再触发
```

## 工厂函数参数

`defineStore` 的工厂函数接收一个包含以下 API 的上下文对象：

| 参数 | 说明 |
|------|------|
| `signal` | 创建响应式信号 |
| `computed` | 创建计算属性 |
| `effect` | 创建副作用（自动纳入 store 的作用域） |
| `watch` | 监听信号变化（自动纳入 store 的作用域） |

工厂函数返回的值可以是任意嵌套结构——信号、computed、方法、普通对象都可以混合使用。框架只负责递归代理，不限制分组方式和命名。

## 与组件配合

```js
import { defineStore, defineComponent, html } from '@kupola/platform'

// 定义 store
const counterStore = defineStore(({ signal }) => ({
  count: signal(0),
  inc() { this.count.value++ },
}))

// 在组件中使用
const CounterView = defineComponent({
  setup() {
    return { store: counterStore }
  },
  render({ store }) {
    return html`
      <div>
        <span>${store.count}</span>
        <button @click="${store.inc}">+1</button>
      </div>
    `
  },
})
```

## 与 shallowReactive 的关系

`defineStore` 内部使用 `shallowReactive` 代理嵌套分组，只追踪第一层属性的替换，不追踪深层嵌套属性。这保证了：

- 替换整个分组对象时触发更新
- 分组内 signal 的读写由 signal 自身管理，不经过 proxy
- 内存开销最小化

## 注意事项

- `$dispose()` 后信号仍可读写，但依赖它们的 effect 已被清理
- 工厂函数中的 `effect` 和 `watch` 自动纳入 store 的作用域，`$dispose()` 时会一并清理
- 嵌套对象通过 Proxy 缓存，同对象同代理，避免重复创建