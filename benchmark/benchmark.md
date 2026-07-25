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
| 浏览器端性能测试 | ⏳ 待实现 | Playwright 真实浏览器测试 |
| 性能阈值告警 | ⏳ 待实现 | CI 中性能下降检测 |

---

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
| VirtualList 创建 | 100 items | **14.95ms** | < 50ms | ✅ |
| VirtualList 创建 | 1,000 items | 3.90ms | < 100ms | ✅ |
| VirtualList 创建 | 10,000 items | **2.87ms** | < 200ms | ✅ |
| VirtualList 添加/删除 | 100 iterations | 1.19ms | < 50ms | ✅ |
| Table 创建 | 100×10 | 14.35ms | < 200ms | ✅ |
| Table 创建 | 1,000×5 | 58.28ms | < 500ms | ✅ |
| Table 排序性能 | 100 iterations | **33.76ms** | < 100ms | ⚠️ |
| Table 分页 | 5,000 rows | 2.25ms | < 2000ms | ✅ |
| Form 50 字段渲染 | 50 fields | **28.38ms** | < 300ms | ✅ |
| Modal 打开/关闭 | 100 iterations | 0.59ms | < 100ms | ✅ |
| Tooltip 创建 | 100 iterations | 0.01ms | < 50ms | ✅ |
| SSR renderToString | 100 items | 0.66ms | < 100ms | ✅ |
| SSR renderToString | 1,000 items | 1.53ms | < 500ms | ✅ |

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

---

## 三、优化任务清单

### 阶段 A：立即可做的优化（1-2 天）

**任务 A1：Table 排序性能优化**

- [ ] 分析排序逻辑，检查是否有重复计算
- [ ] 考虑增加虚拟滚动来应对大数据量排序
- [ ] 实现排序结果缓存，同一排序规则二次点击无需重新计算
- [ ] **目标**：将排序单次耗时从 33.76ms 降到 <10ms

**任务 A2：Form 字段渲染优化**

- [ ] 检查 50 个字段的渲染是否有重复 DOM 操作
- [ ] 使用批量更新替代逐个更新
- [ ] 考虑对非活跃字段进行懒渲染
- [ ] **目标**：将 Form 50 字段从 28.38ms 降到 <15ms

**任务 A3：VirtualList 小数据量异常**

- [ ] 分析为什么 100 条（14.95ms）比 10,000 条（2.87ms）还慢
- [ ] 检查是否有初始化阶段的开销被计入
- [ ] **目标**：确保所有数据量级下的性能线性可预期

---

### 阶段 B：建立性能基准的下一步（2-3 天）

**任务 B1：对比基准（与竞品对比）**

- [ ] 搭建 React/Vue/Svelte 的相同测试环境
- [ ] 运行相同场景的性能对比测试
- [ ] 生成对比报告，作为 Kupola 的技术亮点宣传材料

**任务 B2：浏览器真实场景测试**

- [ ] 使用 Playwright 在真实浏览器中测试 FCP/LCP
- [ ] 测试低端设备（CPU 降速 4x）下的性能
- [ ] 建立用户感知指标（INP）的基准线

**任务 B3：性能报告自动化**

- [ ] 将当前 HTML 报告模板集成到 CI 流程
- [ ] 每次 PR 自动生成并评论性能报告
- [ ] 设置性能阈值告警（如超过 5% 则 CI 失败）

---

### 阶段 C：长期规划（持续：暂不执行）

**任务 C1：建立性能测试集**

- [ ] 将 24 个测试作为回归测试永久保留
- [ ] 每次新功能 PR 必须附带相应性能测试
- [ ] 定期（每月）运行全量测试，生成趋势报告

**任务 C2：性能宣传材料**

- [ ] 将性能数据制作成对比图表发布到社交媒体
- [ ] 在 README 中添加性能徽章和 benchmark 链接
- [ ] 撰写一篇《Kupola 3.x 性能优化之路》技术博客


---

## 四、目录结构

```
kupola-u/
├── benchmark/
│   ├── core/
│   │   └── signal.bench.js           # 核心引擎基准测试（11个测试）
│   ├── components/
│   │   └── list.bench.js             # 组件渲染基准测试（13个测试）
│   ├── reports/
│   │   ├── generate-report.js        # HTML 报告生成脚本
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
        └── ci.yml                    # CI 流程
```

---

## 五、性能最佳实践

> 摘自 `docs-site/guide/performance.md`

1. **响应式更新**：scope 只追踪顶层属性，修改深层字段后需重新赋值顶层值
2. **列表渲染**：`k-for` 使用稳定 key 可复用行 DOM；大数据集合使用 `VirtualList` 或服务端分页
3. **生命周期**：片段替换前调用 `destroyWalk()`，长寿命 root 只调用一次 `walkOnce()`
4. **性能选择顺序**：静态内容使用原生 HTML/CSS → 局部交互使用 Kupola 指令 → 复杂交互使用组件库 → 大数据集合使用虚拟列表或服务端分页

---

## 六、下一步行动

| 优先级 | 任务 | 预估时间 |
|--------|------|----------|
| P0 | Table 排序性能优化 | 1 天 |
| P0 | VirtualList 小数据量异常 | 0.5 天 |
| P1 | Form 字段渲染优化 | 1 天 |
| P2 | Playwright 浏览器性能测试 | 2-3 天 |
| P3 | CI 性能阈值告警 | 1-2 天 |
| P4 | README 性能徽章 | 0.5 天 |
