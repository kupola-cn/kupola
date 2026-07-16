---
layout: home
hero:
  name: Kupola
  text: 现代模块化 UI 组件库
  tagline: 零框架依赖 · 48+ 组件 · Tree-shakeable
  actions:
    - theme: brand
      text: 快速开始
      link: /guide/getting-started
    - theme: alt
      text: GitHub
      link: https://github.com/kupola-cn/kupola

features:
  - icon: ⚡
    title: 零依赖
    details: 不依赖 React/Vue/Angular，纯 JS 实现
  - icon: 🔄
    title: 响应式
    details: 基于 Signal 的细粒度响应式系统
  - icon: 📦
    title: 按需引入
    details: Tree-shakeable，只打包你用的组件
---

# AI Adapter — 自然语言驱动你的应用

`@kupola/ai-adapter` 将用户的自然语言输入转化为结构化操作，无缝联动 Kupola UI 组件。

<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; margin: 32px 0;">

<div style="padding: 24px; border: 1px solid var(--vp-c-divider); border-radius: 12px;">

### 🔍 查询引擎

处理只读数据查询，支持缓存、分页、聚合和上下文追问。

```js
adapter.query.register('employee', handler);
await adapter.process('查询张三');
```

[了解详情 →](/ai-adapter/engines#查询引擎-queryengine)

</div>

<div style="padding: 24px; border: 1px solid var(--vp-c-divider); border-radius: 12px;">

### ⚙️ 执行引擎

处理增删改操作，支持确认、撤销、审计和权限钩子。

```js
adapter.action.register('delete', {
  handler, confirm: true, undo,
});
```

[了解详情 →](/ai-adapter/engines#执行引擎-actionengine)

</div>

<div style="padding: 24px; border: 1px solid var(--vp-c-divider); border-radius: 12px;">

### 🔄 流程引擎

多步骤可重复流程，支持条件分支、并行、嵌套和断点恢复。

```js
adapter.flow.define('月末统计', {
  steps: [...]
});
```

[了解详情 →](/ai-adapter/engines#流程引擎-flowengine)

</div>

<div style="padding: 24px; border: 1px solid var(--vp-c-divider); border-radius: 12px;">

### 🧠 意图解析

AI 后端 + 规则引擎双模式，中英文双语，模糊匹配，置信度评分。

```js
new AIAdapter({
  ai: async (input, ctx) => ...
});
```

[了解详情 →](/ai-adapter/intent-parser)

</div>

<div style="padding: 24px; border: 1px solid var(--vp-c-divider); border-radius: 12px;">

### 🔌 中间件

Koa 风格的处理管道，插入日志、权限、缓存等自定义逻辑。

```js
adapter.use(async (ctx, next) => {
  await next();
});
```

[了解详情 →](/ai-adapter/middleware)

</div>

<div style="padding: 24px; border: 1px solid var(--vp-c-divider); border-radius: 12px;">

### 🎨 Kupola 集成

事件驱动 UI 联动，查询结果 → Table，操作确认 → Modal。

```js
adapter.on('result', ({ result }) => {
  Table.create('#area', result.table);
});
```

[了解详情 →](/ai-adapter/kupola-integration)

</div>

</div>

<div style="text-align: center; margin: 40px 0;">

[查看完整文档 →](/ai-adapter/introduction) &nbsp;&nbsp; [API 参考 →](/ai-adapter/api)

</div>

---

## 组件

48+ 开箱即用的 UI 组件，零框架依赖。

<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin: 24px 0;">
<div><strong>Modal</strong> — 模态弹窗</div>
<div><strong>Table</strong> — 数据表格</div>
<div><strong>Form</strong> — 表单系统</div>
<div><strong>Dropdown</strong> — 下拉菜单</div>
<div><strong>Notification</strong> — 通知提示</div>
<div><strong>Dialog</strong> — 确认对话框</div>
</div>

[查看全部组件 →](/components/overview)
---
layout: home
hero:
  name: Kupola
  text: 现代模块化 UI 组件库
  tagline: 零框架依赖 · 48+ 组件 · Tree-shakeable
  actions:
    - theme: brand
      text: 快速开始
      link: /guide/getting-started
    - theme: alt
      text: GitHub
      link: https://github.com/kupola-cn/kupola

features:
  - title: 零依赖
    details: 不依赖 React/Vue/Angular，纯 JS 实现
  - title: 响应式
    details: 基于 Signal 的细粒度响应式系统
  - title: 按需引入
    details: Tree-shakeable，只打包你用的组件
---
