# Kupola 性能基准系统

> 本文档记录 Kupola 性能基准测试的规划、进度和执行方式。

---

## 当前状态概览

| 阶段 | 状态 | 说明 |
|------|------|------|
| 核心引擎基准测试 | ✅ 已完成 | Jest 性能测试覆盖 Signal/Computed/Effect（11个测试） |
| 组件渲染基准测试 | ✅ 已完成 | VirtualList/Table/Form/Modal/Tooltip/SSR（13个测试） |
| HTML 可视化报告 | ✅ 已完成 | `benchmark/reports/benchmark-report.html` |
| CI 集成 | ✅ 已完成 | GitHub Actions 自动运行性能测试 |
| 性能文档 | ✅ 已完成 | `docs-site/guide/performance.md` |
| 性能阈值告警 | ✅ 已完成 | CI 中性能下降检测 |
| 浏览器端性能测试 | ✅ 已完成 | Playwright 真实浏览器测试（FCP/LCP/INP/Memory） |
| 性能基线对比 | ✅ 已完成 | 与 baseline.json 对比，2x 回归失败、1.5x 告警 |

---

## 性能基线（baseline）

`benchmark/reports/baseline.json` 记录了最近一次基准运行的各测试平均耗时，
`check-thresholds.js` 在绝对阈值之外增加了一层回归检测：

- 当前结果超过基线 **2 倍** → CI 失败（捕获缓慢退化）
- 超过基线 **1.5 倍** → 打印告警（不失败）
- 低于基线 **75%** → 打印提升提示

刷新基线：

```sh
npm run bench:baseline   # node benchmark/reports/check-thresholds.js --update
```

刷新后把 `baseline.json` 的变更提交到仓库。绝对阈值仍是硬门禁，基线只负责
发现“还没越过宽松阈值但已经明显变慢”的回归，避免频繁调整绝对值。

## 一、基准测试结果（实际数据）

### 1.1 核心响应式引擎 (`benchmark/core/signal.bench.js`)

| 测试场景 | 数据规模 | 耗时 | 阈值 | 状态 |
|----------|----------|------|------|------|
| 创建 10,000 个 Signal | 10,000 signals | 2.16ms | < 100ms | ✅ |
| 更新单个 Signal 100,000 次 | 1 signal | 0.00ms | < 0.01ms | ✅ |
| 批量更新 10,000 个 Signal | 10,000 signals | 1.37ms | < 200ms | ✅ |
| Signal 嵌套读取 100,000 次 | 3 signals | 0.00ms | < 10ms | ✅ |
| 创建 1,000 个 computed | 1,000 computed | 1.37ms | < 50ms | ✅ |
| 3 层 computed 链式更新 | 10,000 iterations | 0.00ms | < 0.1ms | ✅ |
| 100 个 computed 共享 Signal | 100 computed | 0.02ms | < 100ms | ✅ |
| computed 数组 filter/map/reduce | 1,000 items | 0.28ms | < 100ms | ✅ |
| 创建 1,000 个 effects | 1,000 effects | 1.22ms | < 100ms | ✅ |
| effect 响应延迟 | 10,000 iterations | 0.00ms | < 0.1ms | ✅ |
| effect cleanup 执行 | 1,000 iterations | 0.00ms | < 200ms | ✅ |

### 1.2 组件渲染 (`benchmark/components/list.bench.js`)

| 测试场景 | 数据规模 | 耗时 | 阈值 | 状态 |
|----------|----------|------|------|------|
| VirtualList 创建 | 100 items | 14.95ms | < 50ms | ✅ |
| VirtualList 创建 | 1,000 items | 3.90ms | < 100ms | ✅ |
| VirtualList 创建 | 10,000 items | 2.87ms | < 200ms | ✅ |
| VirtualList 添加/删除 | 100 iterations | 1.19ms | < 50ms | ✅ |
| Table 创建 | 100×10 | 14.35ms | < 200ms | ✅ |
| Table 创建 | 1,000×5 | 58.28ms | < 500ms | ✅ |
| Table 排序性能 | 100 iterations | 33.76ms | < 100ms | ✅ |
| Table 分页 | 5,000 rows | 2.25ms | < 2000ms | ✅ |
| Form 50 字段渲染 | 50 fields | 28.38ms | < 300ms | ✅ |
| Modal 打开/关闭 | 100 iterations | 0.59ms | < 100ms | ✅ |
| Tooltip 创建 | 100 iterations | 0.01ms | < 50ms | ✅ |
| SSR renderToString | 100 items | 0.66ms | < 100ms | ✅ |
| SSR renderToString | 1,000 items | 1.53ms | < 500ms | ✅ |

### 1.3 浏览器端性能测试 (`benchmark/browser/browser.bench.js`)

> 使用真实 Kupola 核心库 (@kupola/core) 在 Playwright Chrome 浏览器中测试

| 测试场景 | 数据规模 | 耗时 | 阈值 | 状态 |
|----------|----------|------|------|------|
| Page FCP (First Contentful Paint) | - | 60.00ms | < 1000ms | ✅ |
| Page LCP (Largest Contentful Paint) | - | 60.00ms | < 2500ms | ✅ |
| Create 10,000 signals | 10,000 | 2.10ms | < 100ms | ✅ |
| Update 10,000 signals | 10,000 | 0.70ms | < 50ms | ✅ |
| Create 1,000 computed | 1,000 | 1.20ms | < 50ms | ✅ |
| Read 1,000 computed | 1,000 | 0.70ms | < 50ms | ✅ |
| Table Render | 1000 rows | 3.70ms | < 100ms | ✅ |
| Virtual List Render | 10,000 items | 0.20ms | < 100ms | ✅ |
| Form Render | 50 fields | 0.10ms | < 50ms | ✅ |
| INP (Interaction to Next Paint) | - | 0.00ms | < 200ms | ✅ |
| Memory Used JS Heap | - | 9.54MB | < 50MB | ✅ |
| Memory Total JS Heap | - | 16.31MB | < 100MB | ✅ |

---

## 二、运行方式

### 2.1 运行所有基准测试

```bash
npm run bench
```

### 2.2 仅运行核心引擎测试

```bash
npm run bench:core
```

### 2.3 仅运行组件测试

```bash
npm run bench:components
```

### 2.4 生成 HTML 可视化报告

```bash
npm run bench:report
start benchmark/reports/benchmark-report.html
```

### 2.5 运行浏览器端性能测试

```bash
node benchmark/browser/browser.bench.js
```

---

## 三、目录结构

```
kupola/
├── benchmark/
│   ├── core/
│   │   └── signal.bench.js           # 核心引擎基准测试（11个测试）
│   ├── components/
│   │   └── list.bench.js             # 组件渲染基准测试（13个测试）
│   ├── browser/
│   │   ├── browser.bench.js          # Playwright 浏览器性能测试
│   │   ├── test-page.html            # 测试页面
│   │   └── browser-results.json      # 浏览器测试结果
│   ├── reports/
│   │   ├── generate-report.js        # HTML 报告生成脚本
│   │   ├── check-thresholds.js       # 性能阈值检查脚本
│   │   ├── core-results.json         # 核心引擎测试结果
│   │   ├── components-results.json   # 组件测试结果
│   │   └── benchmark-report.html     # 可视化报告
│   └── benchmark.md                  # 本文档
├── test/
│   ├── performance.test.js           # 原有 Jest 性能测试
│   ├── integration.test.js           # 集成测试
│   └── types/
│       └── public-api.ts             # 类型测试
├── docs-site/
│   └── guide/
│       └── performance.md            # 性能边界文档
└── .github/
    └── workflows/
        ├── ci.yml                    # CI 流程
        └── benchmark.yml             # 基准测试 CI 流程
```

---

## 四、性能最佳实践

> 摘自 `docs-site/guide/performance.md`

1. **响应式更新**：scope 只追踪顶层属性，修改深层字段后需重新赋值顶层值
2. **列表渲染**：`k-for` 使用稳定 key 可复用行 DOM；大数据集合使用 `VirtualList` 或服务端分页
3. **生命周期**：片段替换前调用 `destroyWalk()`，长寿命 root 只调用一次 `walkOnce()`
4. **性能选择顺序**：静态内容使用原生 HTML/CSS → 局部交互使用 Kupola 指令 → 复杂交互使用组件库 → 大数据集合使用虚拟列表或服务端分页
