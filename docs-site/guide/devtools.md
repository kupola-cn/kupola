# DevTools — 开发调试

Kupola 内置 Signal 响应式性能分析器，用于追踪信号读取、写入、触发器以及 effect 和 computed 的执行情况。在开发模式下，`window.__KUPOLA_SIGNALS__` 提供全局信号注册表用于调试。

## 快速开始

```js
import { enableProfiler, getProfileReport, printProfileReport } from '@kupola/core/devtools'

// 启用分析器
enableProfiler()

// ... 运行你的应用 ...

// 获取分析报告
const report = getProfileReport()
console.table(report.signals)
console.table(report.effects)

// 打印格式化报告到控制台
printProfileReport()

// 重置分析数据
resetProfiler()
```

## API 参考

### enableProfiler(options?)

启用响应式分析器。调用后开始收集信号读取、写入、effect 执行等性能数据。

```js
enableProfiler(options?)
```

| 参数 | 类型 | 说明 |
|------|------|------|
| `options.console` | `boolean` | 是否在控制台实时输出事件，默认 `false`。 |

```js
import { enableProfiler } from '@kupola/core/devtools'

// 基础用法
enableProfiler()

// 启用控制台日志
enableProfiler({ console: true })
```

> **注意**：每次调用 `enableProfiler()` 会清除之前的数据，开始新的分析会话。

### disableProfiler()

停用分析器，停止收集数据，但保留已收集的数据。

```js
import { disableProfiler } from '@kupola/core/devtools'

disableProfiler()
```

### isProfilerEnabled()

检查分析器是否已启用。

```js
import { isProfilerEnabled } from '@kupola/core/devtools'

if (isProfilerEnabled()) {
  console.log('分析器正在运行')
}
```

### getProfileReport()

获取当前分析会话的完整报告。

```js
const report = getProfileReport()
```

**返回值**：`ProfileReport` 对象：

```js
{
  duration: 1234.56,          // 分析时长（毫秒）
  totalTriggers: 42,           // 信号触发总数
  totalEffectRuns: 18,         // effect 执行总数
  totalComputedRecomputes: 7,  // computed 重新计算总数
  signals: [
    {
      label: 'count',
      reads: 25,
      writes: 5,
      triggers: 5,
      creationStack: '...',  // 创建时的调用栈（仅在 profiler 启用时）
    },
  ],
  effects: [
    {
      label: 'effect#1',
      runs: 10,
      totalTime: '12.50ms',
      maxTime: '3.20ms',
      avgTime: '1.25ms',
    },
  ],
  computeds: [
    {
      label: 'computed#2',
      recomputes: 5,
      totalTime: '2.10ms',
      maxTime: '0.80ms',
      avgTime: '0.42ms',
    },
  ],
}
```

### printProfileReport()

在控制台打印人类可读的分析报告，包含表格和摘要。

```js
import { printProfileReport } from '@kupola/core/devtools'

printProfileReport()
```

输出示例：

```
═══════════════════════════════════════════════════════
  Kupola Reactivity Profile Report
═══════════════════════════════════════════════════════
  Duration:            1234.56ms
  Total triggers:      42
  Total effect runs:   18
  Total recomputes:    7
───────────────────────────────────────────────────────
  Signals:
  ┌─────────┬───────┬────────┬──────────┬─────────────┐
  │  label  │ reads │ writes │ triggers │    ...      │
  ├─────────┼───────┼────────┼──────────┼─────────────┤
  │ count   │   25  │    5   │    5     │    ...      │
  └─────────┴───────┴────────┴──────────┴─────────────┘
  Effects:
  ...
═══════════════════════════════════════════════════════
```

### resetProfiler()

重置所有分析数据并停用分析器。在两次分析会话之间调用。

```js
import { resetProfiler } from '@kupola/core/devtools'

resetProfiler()
```

### clearProfilerData()

清除所有分析数据，但保持分析器状态不变。用于在不重启分析器的情况下清空数据。

```js
import { clearProfilerData } from '@kupola/core/devtools'

clearProfilerData()
```

## 全局信号注册表

在开发模式下，`window.__KUPOLA_SIGNALS__` 提供实时信号注册表，用于控制台调试。

```js
// 在浏览器控制台中
window.__KUPOLA_SIGNALS__.list()
// 返回所有已注册信号的数组：
// [
//   { id: 0, signal: Signal, label: 'count', creationStack: '...' },
//   { id: 1, signal: Signal, label: 'name', creationStack: '...' },
// ]

window.__KUPOLA_SIGNALS__.findByLabel('count')
// 返回所有 label 匹配的信号

window.__KUPOLA_SIGNALS__.count()
// 返回当前注册的信号总数
```

信号在创建时自动注册，在 `dispose()` 时自动移除。`resetProfiler()` 会清空注册表。

## 完整示例

### 分析组件性能

```js
import { signal, computed, effect } from '@kupola/core'
import {
  enableProfiler,
  getProfileReport,
  printProfileReport,
  resetProfiler,
} from '@kupola/core/devtools'

// 1. 启用分析器
enableProfiler({ console: true })

// 2. 运行需要分析的代码
const count = signal(0, { label: 'count' })
const doubled = computed(() => count.value * 2)
const stop = effect(() => {
  console.log('doubled:', doubled.value)
})

// 模拟交互
for (let i = 0; i < 100; i++) {
  count.value = i
}

// 3. 查看报告
printProfileReport()

// 4. 清理
stop()
resetProfiler()
```

### 定位性能瓶颈

```js
import { enableProfiler, getProfileReport } from '@kupola/core/devtools'

enableProfiler()

// 执行复杂操作
await performComplexOperation()

const report = getProfileReport()

// 找出读/写次数最多的信号
const mostRead = report.signals
  .sort((a, b) => b.reads - a.reads)[0]
console.log('读取最多的信号:', mostRead.label, mostRead.reads, '次')

const mostWritten = report.signals
  .sort((a, b) => b.writes - a.writes)[0]
console.log('写入最多的信号:', mostWritten.label, mostWritten.writes, '次')

// 找出执行时间最长的 effect
const slowestEffect = report.effects
  .sort((a, b) => parseFloat(b.totalTime) - parseFloat(a.totalTime))[0]
console.log('最慢的 effect:', slowestEffect.label, slowestEffect.totalTime)

// 分析创建栈（追踪信号来源）
const signalWithStack = report.signals.find(s => s.creationStack)
if (signalWithStack) {
  console.log('信号创建位置:', signalWithStack.creationStack)
}
```

### 在测试中使用

```js
import { enableProfiler, getProfileReport, resetProfiler } from '@kupola/core/devtools'
import { signal, effect } from '@kupola/core'

describe('性能测试', () => {
  beforeEach(() => {
    resetProfiler()
  })

  test('signal 写入不应触发过多 effect 重新执行', () => {
    enableProfiler()

    const s = signal(0, { label: 'test' })
    const fn = jest.fn()
    effect(() => fn(s.value))

    // 批量更新
    for (let i = 0; i < 50; i++) {
      s.value = i
    }

    const report = getProfileReport()
    const sig = report.signals.find(s => s.label === 'test')

    expect(sig.writes).toBe(50)
    expect(report.totalTriggers).toBe(50)

    resetProfiler()
  })
})
```

## 最佳实践

### 在开发环境条件启用

```js
if (import.meta.env.DEV) {
  const { enableProfiler } = await import('@kupola/core/devtools')
  enableProfiler()
}
```

### 分析特定操作

```js
async function profileAction(fn) {
  const { enableProfiler, getProfileReport, resetProfiler } =
    await import('@kupola/core/devtools')

  enableProfiler()
  await fn()
  return getProfileReport()
}

const report = await profileAction(async () => {
  await loadComplexPage()
})
console.log('页面加载性能:', report)
```

### 使用 creationStack 追踪信号来源

`creationStack` 记录了信号创建时的调用栈，帮助追踪意外的信号创建：

```js
const report = getProfileReport()
for (const sig of report.signals) {
  if (sig.creationStack) {
    console.group(`信号: ${sig.label}`)
    console.log(sig.creationStack)
    console.groupEnd()
  }
}
```

## 导入路径

DevTools 从 `@kupola/core/devtools` 导入，与核心 API 分离以支持 tree-shaking：

```js
// 从 devtools 入口导入
import {
  enableProfiler,
  disableProfiler,
  resetProfiler,
  isProfilerEnabled,
  getProfileReport,
  printProfileReport,
  clearProfilerData,
} from '@kupola/core/devtools'
```