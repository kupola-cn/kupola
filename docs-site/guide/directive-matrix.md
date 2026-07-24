# 指令能力矩阵

本页给出指令的运行时边界。所有表达式指令仅适用于项目源码或其他可信模板；Kupola 使用 `new Function()`，不是表达式沙箱。

| 指令 | 元素 / 参数 | 关键限制 | 清理与冲突 |
| --- | --- | --- | --- |
| `k-data` | 作用域根 | 仅追踪顶层属性；深层变更需要重新赋值顶层值 | 嵌套 scope 独立 |
| `k-text` / `k-html` | 任意元素 | `k-html` 仅接受可信或已 sanitizer 的内容 | destroy 停止 effect |
| `k-bind` / `:attr` | 任意元素 | 敏感 URL 与执行上下文受策略限制 | 不与 `k-model` 竞争 `value` / `checked` |
| `k-on` / `@event` | 任意元素 / 事件名 | `.outside`、`.capture`、`.debounce` 可组合；未知修饰符诊断 | destroy 移除 listener 与 timer |
| `k-model` | `input`、`select`、`textarea` | 不支持 file、contenteditable；只更新顶层 scope key | 不与动态 `value` / `checked` 竞争 |
| `k-show` | 任意元素 | 保留 DOM；可配 `k-transition` | destroy 取消过渡 |
| `k-if` 链 | 相邻兄弟节点 | 每个元素只写一个分支；不能与 `k-for` 混写 | 分支切换清理 effect、event、ref |
| `k-for` | 行模板 | 无 key 时整表重建；object 的 index 是属性名 | 列表移除清理行资源 |
| `k-key` / `:key` | `k-for` 同一元素 | 单次渲染内唯一、稳定；优先级见下文 | 重复 key 为 `W004` |
| `k-ref` | 任意元素 | refs 是 scope / walk 的元素索引，不是跨 root 全局状态 | 移除节点时清理 |
| `k-class` / `k-style` | 任意元素 | `k-style` 不是 CSS sanitizer | 不与同属性的 `k-bind` 混用 |

## 结构指令

`k-if`、`k-else-if`、`k-else` 必须相邻，且同一元素只写一个分支指令。`k-for` 不能和 `k-else-if` / `k-else` 写在同一节点；`k-for + k-if` 虽可诊断但应拆成外层分支与内层列表，使生命周期可预测。

列表 key 的唯一优先级是：`k-key`、`:key`、`k-bind:key`。多个写法同时出现为 `W021`，空 key 为 `W001`。无 key 列表每次源值重新赋值都会销毁并重建全部行，输入焦点、selection 与临时 DOM 状态会丢失。

## 表达式与服务端模板

服务端可以输出固定的指令属性和表达式，但不得把 URL 参数、CMS 内容或用户字符串拼接为表达式。严格 CSP 不允许 `unsafe-eval` 时，使用 `signal()`、`effect()`、`render()` 和原生 DOM 事件，避免模板表达式指令。

诊断码与可搜索示例见 [诊断信息](/guide/diagnostics)。
