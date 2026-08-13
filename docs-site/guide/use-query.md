# useQuery — 请求去重与缓存

`useQuery()` 是 Kupola 内置的请求级数据获取 Hook，提供并发请求去重和响应缓存能力。多个组件同时用相同 key 发起请求时，只产生一次网络调用，其余调用者共享同一个 Promise。

## 快速开始

```js
import { useQuery, invalidateQuery } from '@kupola/platform'

// 获取患者列表，30 秒内不重复请求
const patients = await useQuery(
  'patients:org-5',
  () => api.patients.list({ orgId: 5 }),
  { staleTime: 60_000 },
)

// 创建患者后，使缓存失效
await api.patients.create(payload)
invalidateQuery('patients:org-5')

// 下一次 useQuery('patients:org-5', ...) 会重新请求
```

## API 参考

### useQuery(key, fetcher, options?)

发起数据请求，自动去重和缓存。

```js
useQuery(key, fetcher, options?)
```

| 参数 | 类型 | 说明 |
|------|------|------|
| `key` | `string` | 唯一缓存键，如 `'patients:org-5'`。必须是非空字符串。 |
| `fetcher` | `() => T \| Promise<T>` | 数据获取函数，返回数据或 Promise。 |
| `options.staleTime` | `number` | 缓存有效期（毫秒），默认 `30000`（30 秒）。设为 `0` 每次都重新请求。 |
| `options.cache` | `boolean` | 是否缓存成功结果，默认 `true`。设为 `false` 仅去重，不缓存。 |

**返回值**：`Promise<T>`，与 `fetcher()` 返回值类型一致。

**执行流程**：

1. 如果缓存存在且未过期（`staleTime` 内），直接返回缓存数据。
2. 如果相同 key 的请求正在飞行中，返回同一个 Promise（去重）。
3. 否则调用 `fetcher()`，缓存结果并返回。

**注意**：并发调用时，第一个调用者的 `cache` 和 `staleTime` 选项决定所有并发调用者的行为。

```js
// 去重：并发调用只产生一次请求
const [a, b] = await Promise.all([
  useQuery('k1', () => fetch('/api/data').then(r => r.json())),
  useQuery('k1', () => fetch('/api/data').then(r => r.json())),
])
// fetcher 只被调用一次

// 缓存：后续调用直接返回
await useQuery('k2', fetcher, { staleTime: 5000 })
// 5 秒内再次调用，直接命中缓存
await useQuery('k2', fetcher, { staleTime: 5000 })

// 不缓存：只去重，不保留结果
await useQuery('k3', fetcher, { cache: false })
await useQuery('k3', fetcher, { cache: false }) // 重新请求

// 每次重新请求
await useQuery('k4', fetcher, { staleTime: 0 })
await useQuery('k4', fetcher, { staleTime: 0 }) // 重新请求
```

### invalidateQuery(key)

使指定 key 的缓存失效。下一次 `useQuery()` 会重新请求。

```js
invalidateQuery(key)
```

| 参数 | 类型 | 说明 |
|------|------|------|
| `key` | `string` | 要失效的缓存键。 |

**返回值**：`boolean`，是否成功移除了缓存条目。

```js
await useQuery('patients:list', fetcher, { staleTime: 60000 })
invalidateQuery('patients:list') // true
invalidateQuery('nonexistent')   // false
```

> **注意**：`invalidateQuery()` 不会取消正在飞行中的请求，它只清除已缓存的响应数据。

### invalidateQueries(predicate?)

按条件批量失效缓存。不传参数时清空全部缓存。

```js
invalidateQueries(predicate?)
```

| 参数 | 类型 | 说明 |
|------|------|------|
| `predicate` | `(key: string) => boolean` | 匹配函数，返回 `true` 的缓存条目会被清除。省略时清除全部。 |

**返回值**：`number`，被移除的条目数量。

```js
// 缓存多条数据
await useQuery('patients:1', fetcher)
await useQuery('patients:2', fetcher)
await useQuery('drugs:1', fetcher)

// 按前缀批量失效
invalidateQueries(key => key.startsWith('patients:')) // 返回 2
// 缓存中只剩下 'drugs:1'

// 清空全部缓存
invalidateQueries() // 清除所有条目
```

### prefetchQuery(key, fetcher, options?)

预热缓存：在后台获取数据并缓存，不阻塞当前执行。

```js
prefetchQuery(key, fetcher, options?)
```

| 参数 | 类型 | 说明 |
|------|------|------|
| `key` | `string` | 缓存键。 |
| `fetcher` | `() => any \| Promise<any>` | 数据获取函数。 |
| `options` | `UseQueryOptions` | 与 `useQuery()` 相同的选项。 |

**返回值**：`Promise<void>`。

```js
// 在路由切换前预加载下一页数据
await prefetchQuery('dashboard:stats', () => api.stats.get(), {
  staleTime: 30000,
})

// 后续 useQuery 直接命中缓存
const stats = await useQuery('dashboard:stats', () => api.stats.get())
```

### getQueryCacheSize()

获取当前缓存中的条目数。

```js
import { getQueryCacheSize } from '@kupola/platform'

console.log(getQueryCacheSize()) // 3
```

### getPendingQueryCount()

获取当前飞行中的请求数量。

```js
import { getPendingQueryCount } from '@kupola/platform'

console.log(getPendingQueryCount()) // 2
```

### resetQueryCache()

清空所有缓存并取消去重追踪。通常在测试或全局状态重置时使用。

```js
import { resetQueryCache } from '@kupola/platform'

resetQueryCache()
// 所有缓存清除，所有飞行中请求的 tracking 被移除
```

## 缓存淘汰

当缓存条目超过 `MAX_CACHE_SIZE = 500` 时，`useQuery()` 会自动触发淘汰：

1. 首先移除所有已过期（`expireAt <= Date.now()`）的条目。
2. 如果仍然超过上限，移除 `expireAt` 最小的（最旧的）条目，直到数量降至 500。

```js
// 大量并发请求会自动触发淘汰
const promises = Array.from({ length: 600 }, (_, i) =>
  useQuery(`k${i}`, () => Promise.resolve(`v${i}`), { staleTime: 1 }),
)
await Promise.all(promises)
// 缓存条目数 <= 500
```

## 错误处理

- 请求失败时，失败的 Promise 会传播给调用者，但不会缓存错误结果。
- 失败后飞行中的状态被清除，下一次调用可以重新尝试。
- 只有成功的结果才会被缓存。

```js
// 失败后重试
try {
  await useQuery('data', fetcher, { staleTime: 5000 })
} catch (err) {
  console.error('请求失败:', err)
  // 稍后重试 — 会重新调用 fetcher
  await useQuery('data', fetcher, { staleTime: 5000 })
}
```

## 完整示例

```js
import {
  useQuery,
  invalidateQuery,
  invalidateQueries,
  prefetchQuery,
  getQueryCacheSize,
} from '@kupola/platform'

// ── 数据获取层 ──────────────────────────────────────────────

const api = {
  list: () => fetch('/api/patients').then(r => r.json()),
  create: (data) => fetch('/api/patients', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(r => r.json()),
  delete: (id) => fetch(`/api/patients/${id}`, { method: 'DELETE' }),
}

// ── 页面组件 ────────────────────────────────────────────────

import { defineComponent, html } from '@kupola/platform'
import { signal } from '@kupola/core'

const PatientList = defineComponent({
  setup() {
    const patients = signal([])
    const loading = signal(false)
    const error = signal(null)

    async function load() {
      loading.value = true
      error.value = null
      try {
        patients.value = await useQuery(
          'patients:list',
          () => api.list(),
          { staleTime: 30_000 },
        )
      } catch (err) {
        error.value = err.message
      } finally {
        loading.value = false
      }
    }

    async function create(patient) {
      await api.create(patient)
      // 使列表缓存失效，下次 load 会重新请求
      invalidateQuery('patients:list')
      await load()
    }

    async function deleteAll() {
      await Promise.all(/* ... */)
      // 批量失效所有患者相关缓存
      invalidateQueries(key => key.startsWith('patients:'))
      await load()
    }

    // 初始化加载
    load()

    return { patients, loading, error, load, create, deleteAll }
  },
})
```

## 最佳实践

### 命名约定

推荐使用 `资源:标识` 格式的 key 命名：

```js
'patients:list'          // 列表
'patients:detail:123'    // 详情
'patients:search:keyword' // 搜索
'dashboard:stats:org-5'  // 仪表盘统计
```

### 在 mutation 后失效缓存

```js
async function savePatient(data) {
  await api.patients.save(data)
  invalidateQuery('patients:list')
}
```

### 预加载下一页数据

```js
// 路由守卫中预加载
router.beforeEnter(async (to) => {
  if (to.name === 'patient-detail') {
    await prefetchQuery(
      `patients:detail:${to.params.id}`,
      () => api.patients.get(to.params.id),
      { staleTime: 60_000 },
    )
  }
})
```

### 配合 effectScope 自动清理

```js
import { effectScope } from '@kupola/core'

const scope = effectScope()
scope.run(async () => {
  const data = await useQuery('my-data', fetcher)
  // ...
})

// 组件销毁时
scope.stop()
// 注意：stop() 不会自动清除 query 缓存，需要手动 invalidate
```