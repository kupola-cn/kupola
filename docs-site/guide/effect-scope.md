# effectScope — 显式生命周期

`effectScope()` 创建一个独立的 effect 作用域，用于管理一组 effect 的生命周期。当作用域被停止时，其内部所有 effect、computed 和通过 `onScopeDispose()` 注册的清理函数都会被自动销毁。

## 快速开始

```js
import { effectScope, effect, onScopeDispose } from '@kupola/core'

const scope = effectScope()

scope.run(() => {
  // 在作用域内创建 effect — 作用域停止时自动销毁
  effect(() => {
    console.log('数据更新:', state.value)
  })

  // 注册清理回调
  onScopeDispose(() => {
    console.log('清理资源')
  })
})

// 停止作用域 — 所有 effect 被销毁，清理回调执行
scope.stop()
```

## API 参考

### effectScope()

创建一个新的 effect 作用域。

```js
const scope = effectScope()
```

**返回值**：`EffectScope` 对象，包含 `run()` 和 `stop()` 方法。

作用域在创建时自动激活。如果当前有一个活跃的父作用域，新作用域会作为子作用域注册。

### scope.run(fn)

在作用域内执行函数。在 `run()` 回调中创建的 effect 和 computed 会自动注册到该作用域。

```js
scope.run(() => {
  // 这里的 effect 属于 scope
  effect(() => {
    doSomething(signal.value)
  })
})
```

如果作用域已停止，调用 `run()` 会抛出错误。

### scope.stop()

停止作用域，销毁所有已注册的 effect 和 computed，执行所有清理回调。

```js
scope.stop()
```

停止顺序：
1. 递归停止所有子作用域。
2. 销毁所有 effect（取消依赖追踪，执行 dispose 回调）。
3. 执行所有 `onScopeDispose()` 注册的清理函数。
4. 从父作用域中移除自身。

**注意**：`stop()` 是幂等的，多次调用安全。

### onScopeDispose(fn)

在当前活跃作用域中注册一个清理回调。作用域停止时自动执行。

```js
scope.run(() => {
  const controller = new AbortController()

  onScopeDispose(() => {
    controller.abort()
  })

  // 使用 controller 发起请求
  fetch('/api/data', { signal: controller.signal })
})
```

**注意**：必须在 `effectScope.run()` 内部调用，否则会抛出错误。

**返回值**：取消注册的函数。调用它可以手动移除清理回调。

## 嵌套作用域

作用域可以嵌套，子作用域停止时会自动从父作用域移除：

```js
const parent = effectScope()

parent.run(() => {
  effect(() => console.log('parent effect'))

  const child = effectScope()

  child.run(() => {
    effect(() => console.log('child effect'))
    onScopeDispose(() => console.log('child cleanup'))
  })

  // 停止子作用域只影响子 effect
  child.stop()
  // 输出: "child cleanup"
  // parent effect 仍然活跃
})

// 停止父作用域
parent.stop()
// parent effect 被销毁
```

## 使用场景

### 组件生命周期

在组件 `setup` 中创建作用域，组件销毁时停止：

```js
import { defineComponent } from '@kupola/platform'
import { effectScope, effect, signal } from '@kupola/core'

const MyComponent = defineComponent({
  setup() {
    const scope = effectScope()
    const data = signal(null)

    scope.run(() => {
      // 这些 effect 会在组件销毁时自动清理
      effect(() => {
        if (data.value) {
          updateChart(data.value)
        }
      })

      effect(() => {
        document.title = data.value?.title || 'My App'
      })
    })

    return {
      data,
      destroy: () => scope.stop(),
    }
  },

  destroyed({ destroy }) {
    destroy()
  },
})
```

### 请求取消

在作用域中发起请求，组件销毁时自动取消：

```js
import { effectScope, effect, signal, onScopeDispose } from '@kupola/core'

function useFetch(url) {
  const scope = effectScope()
  const data = signal(null)
  const loading = signal(false)
  const error = signal(null)

  scope.run(() => {
    const controller = new AbortController()

    onScopeDispose(() => {
      controller.abort()
    })

    async function fetchData() {
      loading.value = true
      error.value = null
      try {
        const res = await fetch(url, { signal: controller.signal })
        data.value = await res.json()
      } catch (err) {
        if (err.name !== 'AbortError') {
          error.value = err.message
        }
      } finally {
        loading.value = false
      }
    }

    fetchData()
  })

  return {
    data,
    loading,
    error,
    destroy: () => scope.stop(),
  }
}

// 使用
const { data, loading, destroy } = useFetch('/api/users')

// 不再需要时取消请求
destroy()
```

### 定时器清理

```js
import { effectScope, onScopeDispose } from '@kupola/core'

const scope = effectScope()

scope.run(() => {
  const intervalId = setInterval(() => {
    console.log('tick')
  }, 1000)

  onScopeDispose(() => {
    clearInterval(intervalId)
    console.log('定时器已清除')
  })
})

// 5 秒后停止
setTimeout(() => scope.stop(), 5000)
```

### 事件监听器清理

```js
import { effectScope, onScopeDispose } from '@kupola/core'

function useEventListener(target, event, handler) {
  const scope = effectScope()

  scope.run(() => {
    target.addEventListener(event, handler)

    onScopeDispose(() => {
      target.removeEventListener(event, handler)
    })
  })

  return scope
}

// 使用
const scope = useEventListener(window, 'resize', () => {
  console.log('窗口大小变化')
})

// 清理
scope.stop()
```

### 第三方库集成

```js
import { effectScope, effect, onScopeDispose, signal } from '@kupola/core'

function useChart(container, dataSignal) {
  const scope = effectScope()
  let chartInstance = null

  scope.run(() => {
    // 初始化第三方图表库
    chartInstance = new ThirdPartyChart(container)

    effect(() => {
      chartInstance.update(dataSignal.value)
    })

    onScopeDispose(() => {
      chartInstance.destroy()
      chartInstance = null
    })
  })

  return {
    destroy: () => scope.stop(),
  }
}
```

## 完整示例

```js
import { effectScope, effect, onScopeDispose, signal } from '@kupola/core'

// 创建一个可复用的数据获取组合函数
function useQuery(fetcher, { staleTime = 30000 } = {}) {
  const scope = effectScope()
  const data = signal(null)
  const loading = signal(false)
  const error = signal(null)
  let lastFetch = 0

  scope.run(() => {
    const controller = new AbortController()

    onScopeDispose(() => {
      controller.abort()
    })

    async function fetch() {
      // 简单的 staleTime 检查
      if (Date.now() - lastFetch < staleTime && data.value !== null) {
        return data.value
      }

      loading.value = true
      error.value = null

      try {
        const result = await fetcher({ signal: controller.signal })
        data.value = result
        lastFetch = Date.now()
      } catch (err) {
        if (err.name !== 'AbortError') {
          error.value = err.message
        }
      } finally {
        loading.value = false
      }
    }

    // 自动加载
    fetch()
  })

  return {
    data,
    loading,
    error,
    refetch: async () => {
      // 在作用域内重新获取
      scope.run(async () => {
        const controller = new AbortController()
        loading.value = true
        try {
          const result = await fetcher({ signal: controller.signal })
          data.value = result
        } catch (err) {
          error.value = err.message
        } finally {
          loading.value = false
        }
      })
    },
    destroy: () => scope.stop(),
  }
}

// 使用
const { data, loading, error, destroy } = useQuery(
  (opts) => fetch('/api/users', { signal: opts.signal }).then(r => r.json()),
  { staleTime: 60000 },
)

// 组件销毁时
destroy()
```

## 注意事项

### 不要在 effect 中意外创建作用域

Effect 重执行时不会自动为新的 effect 创建作用域继承。Kupola 的 effect 不会将新创建的 effect 隐式绑定到父 effect 的作用域，这避免了动态渲染时子 effect 在父 effect 重执行中被意外丢失的问题。

```js
const scope = effectScope()

scope.run(() => {
  // ✅ 这些 effect 属于 scope
  effect(() => { /* ... */ })
})

// ❌ 在外部创建的 effect 不属于 scope
effect(() => { /* ... */ })
```

### 已停止的作用域不能重用

```js
const scope = effectScope()
scope.stop()

// ❌ 抛出错误
scope.run(() => {
  effect(() => { /* ... */ })
})
```

### stop() 中的错误处理

单个 effect 或清理函数中的错误不会阻止其他 effect 的清理。如果多个清理函数失败，只有第一个错误会被抛出：

```js
scope.run(() => {
  onScopeDispose(() => { throw new Error('A') })
  onScopeDispose(() => { throw new Error('B') })
})

scope.stop() // 抛出 Error('A')，但 Error('B') 仍会被执行
```