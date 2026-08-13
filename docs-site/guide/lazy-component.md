# lazyComponent — 懒加载与代码分割

`lazyComponent()` 创建支持异步加载的组件包装器，配合动态导入实现代码分割。组件模块只在首次使用时加载，后续调用直接返回缓存结果。支持预加载、超时控制和 AbortSignal 取消。

## 快速开始

```js
import { lazyComponent, preloadComponent } from '@kupola/platform'

// 创建懒加载组件 — 只在首次调用时加载
const LazyTable = lazyComponent(() => import('@kupola/components/table'))

// 使用时自动加载模块
const table = await LazyTable({ columns: [...], data: [...] })

// 预加载 — 在后台提前加载
preloadComponent(LazyTable)

// 后续调用立即返回（已缓存）
const table2 = await LazyTable({ columns: [...], data: [...] })
```

## API 参考

### lazyComponent(loader, exportName?, options?)

创建懒加载组件工厂。

```js
lazyComponent(loader, exportName?, options?)
```

| 参数 | 类型 | 说明 |
|------|------|------|
| `loader` | `(signal?: AbortSignal) => Promise<Module>` | 动态导入函数，返回组件模块。 |
| `exportName` | `string` | 要使用的具名导出，默认 `'default'`。如果找不到指定导出，会自动查找第一个函数导出。 |
| `options.timeout` | `number` | 加载超时时间（毫秒）。超时后抛出 `TimeoutError`。 |
| `options.signal` | `AbortSignal` | 外部取消信号。取消后抛出 `AbortError`。 |

**返回值**：`LazyComponentFactory` — 异步组件工厂函数，附带元数据属性。

```js
const LazyCalendar = lazyComponent(
  () => import('@kupola/components/calendar'),
  'Calendar',
  { timeout: 5000 },
)
```

**模块解析规则**：

1. 如果 `loader` 返回的是函数，直接使用。
2. 如果指定了 `exportName`，使用 `mod[exportName]`。
3. 否则使用 `mod.default`。
4. 如果都没有，查找模块中第一个函数导出。

### LazyComponentFactory

懒加载组件工厂是一个异步函数，调用时返回组件实例：

```js
const result = await LazyComponent(props, children)
```

**附加属性**：

| 属性 | 类型 | 说明 |
|------|------|------|
| `_isResolved()` | `() => boolean` | 组件模块是否已加载完成。 |
| `_preload()` | `() => Promise<Function>` | 开始加载组件模块，返回 factory 的 Promise。 |
| `cancel(reason?)` | `(reason?: unknown) => void` | 取消当前加载。 |

```js
const LazyPanel = lazyComponent(() => import('./Panel.js'))

// 检查是否已加载
if (!LazyPanel._isResolved()) {
  showLoading()
}

// 取消加载
LazyPanel.cancel('用户取消了操作')
```

### preloadComponent(lazyFactory)

在后台预加载懒加载组件，提前加载模块以消除后续使用的延迟。

```js
preloadComponent(lazyFactory)
```

**参数**：必须是 `lazyComponent()` 返回的工厂函数。

```js
// 路由切换时预加载目标页面组件
router.beforeEnter(async (to) => {
  if (to.name === 'dashboard') {
    await preloadComponent(LazyDashboard)
  }
})
```

## 错误处理

### 加载失败

当模块加载失败时，`lazyFactory()` 会抛出原始错误：

```js
const LazyComponent = lazyComponent(() => import('./BadModule.js'))

try {
  const result = await LazyComponent()
} catch (err) {
  console.error('组件加载失败:', err)
}
```

### 超时

指定 `timeout` 选项后，超时会抛出 `TimeoutError`：

```js
const LazyComponent = lazyComponent(
  () => import('./HeavyComponent.js'),
  'default',
  { timeout: 3000 },
)

try {
  const result = await LazyComponent()
} catch (err) {
  if (err.name === 'TimeoutError') {
    console.error('组件加载超时')
  }
}
```

### 取消

通过 `AbortSignal` 取消加载：

```js
const controller = new AbortController()

const LazyComponent = lazyComponent(
  () => import('./Component.js'),
  'default',
  { signal: controller.signal },
)

// 取消加载
controller.abort('不再需要该组件')

try {
  await LazyComponent()
} catch (err) {
  if (err.name === 'AbortError') {
    console.log('加载已取消')
  }
}
```

## 加载状态

`lazyComponent` 本身不提供内置的加载状态指示。业务层需要自行管理：

```js
import { signal } from '@kupola/core'
import { lazyComponent } from '@kupola/platform'

const LazyDetail = lazyComponent(() => import('./DetailPage.js'))

function useLazyComponent(lazyFactory) {
  const loading = signal(false)
  const error = signal(null)

  async function load(...args) {
    loading.value = true
    error.value = null
    try {
      return await lazyFactory(...args)
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  return { loading, error, load }
}

// 使用
const { loading, error, load } = useLazyComponent(LazyDetail)

// 在模板中
html`${loading.value
  ? html`<div>加载中...</div>`
  : error.value
    ? html`<div class="error">${error.value}</div>`
    : null}`
```

## 完整示例

### 懒加载详情页

```js
import { lazyComponent, preloadComponent } from '@kupola/platform'
import { defineComponent, html } from '@kupola/platform'
import { signal } from '@kupola/core'

// 1. 定义懒加载组件
const LazyUserDetail = lazyComponent(
  () => import('./UserDetail.js'),
  'default',
  { timeout: 10000 },
)

// 2. 创建路由页面
const UserDetailPage = defineComponent({
  setup() {
    const component = signal(null)
    const loading = signal(false)
    const error = signal(null)

    async function mount(props) {
      loading.value = true
      error.value = null
      try {
        component.value = await LazyUserDetail(props)
      } catch (err) {
        error.value = err.message
      } finally {
        loading.value = false
      }
    }

    return { component, loading, error, mount }
  },

  async created({ mount }) {
    // 预加载（不影响当前渲染）
    preloadComponent(LazyUserDetail)
    await mount()
  },
})

// 3. 路由配置
const router = createRouter({
  routes: [
    {
      path: '/users/:id',
      name: 'user-detail',
      component: UserDetailPage,
      beforeEnter: async (to) => {
        // 提前预加载，进入页面时组件已就绪
        await preloadComponent(LazyUserDetail)
      },
    },
  ],
})
```

### 带重试的懒加载

```js
function lazyComponentWithRetry(loader, options = {}) {
  const { maxRetries = 3, retryDelay = 1000 } = options

  return lazyComponent(() => {
    let lastError

    return new Promise((resolve, reject) => {
      async function attempt(remaining) {
        try {
          const mod = await loader()
          resolve(mod)
        } catch (err) {
          lastError = err
          if (remaining > 0) {
            await new Promise(r => setTimeout(r, retryDelay))
            attempt(remaining - 1)
          } else {
            reject(lastError)
          }
        }
      }

      attempt(maxRetries)
    })
  })
}

// 使用
const LazyTable = lazyComponentWithRetry(
  () => import('./Table.js'),
  { maxRetries: 3, retryDelay: 2000 },
)
```

### 代码分割优化

```js
// 按路由拆分
const routes = {
  '/': () => import('./pages/Home.js'),
  '/dashboard': () => import('./pages/Dashboard.js'),
  '/settings': () => import('./pages/Settings.js'),
  '/reports': () => import('./pages/Reports.js'),
}

// 创建懒加载组件
const lazyPages = {}
for (const [path, loader] of Object.entries(routes)) {
  lazyPages[path] = lazyComponent(loader)
}

// 按需加载
async function loadPage(path) {
  const page = lazyPages[path]
  if (!page) throw new Error(`页面不存在: ${path}`)

  // 预加载其他可能访问的页面
  const nextPaths = predictNextPaths(path)
  for (const nextPath of nextPaths) {
    preloadComponent(lazyPages[nextPath])
  }

  return page()
}
```

## 与 defineComponent 配合

`lazyComponent` 返回的工厂函数与 `defineComponent` 返回的工厂函数兼容，可以无缝替换：

```js
// 直接导入
const UserList = defineComponent({
  setup() { /* ... */ },
})

// 懒加载
const LazyUserList = lazyComponent(() => import('./UserList.js'))

// 两种方式使用方式相同
const instance = await UserList(props)
const lazyInstance = await LazyUserList(props)
```

## 注意事项

- 懒加载组件缓存的是模块引用，不是组件实例。每次调用 `lazyFactory()` 会创建新的组件实例。
- `cancel()` 只取消当前飞行中的加载，不会阻止后续调用重新加载。
- `_preload()` 和直接调用 `lazyFactory()` 共享同一个加载 Promise，不会重复加载。
- 在 `AbortSignal` 已取消时创建 `lazyComponent`，首次调用会立即失败。