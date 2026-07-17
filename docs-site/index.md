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

<div style="background: linear-gradient(135deg, var(--vp-c-brand-soft), var(--vp-c-bg-soft)); border: 1px solid var(--vp-c-divider); border-radius: 12px; padding: 32px 40px; margin: 32px 0;">

# AI Adapter — 自然语言驱动你的应用

`@kupola/ai-adapter` 将用户的自然语言输入转化为结构化操作，无缝联动 Kupola UI 组件。

</div>

<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; margin: 32px 0;">

<div style="padding: 24px; border: 1px solid var(--vp-c-divider); border-radius: 12px;">

### 🔍 查询引擎

<p style="font-size: 13px; color: var(--vp-c-text-2); margin: 0 0 12px;">处理只读数据查询，支持缓存、分页、聚合和上下文追问。</p>

```js
adapter.query.register('employee', handler);
await adapter.process('查询张三');
```

<a href="/ai-adapter/engines#查询引擎-queryengine" style="display: inline-block; color: #ccc; text-decoration: none; font-size: 12px; font-weight: 500;">more</a>

</div>

<div style="padding: 24px; border: 1px solid var(--vp-c-divider); border-radius: 12px;">

### ⚙️ 执行引擎

<p style="font-size: 13px; color: var(--vp-c-text-2); margin: 0 0 12px;">处理增删改操作，支持确认、撤销、审计和权限钩子。</p>

```js
adapter.action.register('delete', {
  handler, confirm: true, undo,
});
```

<a href="/ai-adapter/engines#执行引擎-actionengine" style="display: inline-block; color: #ccc; text-decoration: none; font-size: 12px; font-weight: 500;">more</a>

</div>

<div style="padding: 24px; border: 1px solid var(--vp-c-divider); border-radius: 12px;">

### 🔄 流程引擎

<p style="font-size: 13px; color: var(--vp-c-text-2); margin: 0 0 12px;">多步骤可重复流程，支持条件分支、并行、嵌套和断点恢复。</p>

```js
adapter.flow.define('月末统计', {
  steps: [...]
});
```

<a href="/ai-adapter/engines#流程引擎-flowengine" style="display: inline-block; color: #ccc; text-decoration: none; font-size: 12px; font-weight: 500;">more</a>

</div>

<div style="padding: 24px; border: 1px solid var(--vp-c-divider); border-radius: 12px;">

### 🧠 意图解析

<p style="font-size: 13px; color: var(--vp-c-text-2); margin: 0 0 12px;">AI 后端 + 规则引擎双模式，中英文双语，模糊匹配，置信度评分。</p>

```js
new AIAdapter({
  ai: async (input, ctx) => ...
});
```

<a href="/ai-adapter/intent-parser" style="display: inline-block; color: #ccc; text-decoration: none; font-size: 12px; font-weight: 500;">more</a>

</div>

<div style="padding: 24px; border: 1px solid var(--vp-c-divider); border-radius: 12px;">

### 🔌 中间件

<p style="font-size: 13px; color: var(--vp-c-text-2); margin: 0 0 12px;">Koa 风格的处理管道，插入日志、权限、缓存等自定义逻辑。</p>

```js
adapter.use(async (ctx, next) => {
  await next();
});
```

<a href="/ai-adapter/middleware" style="display: inline-block; color: #ccc; text-decoration: none; font-size: 12px; font-weight: 500;">more</a>

</div>

<div style="padding: 24px; border: 1px solid var(--vp-c-divider); border-radius: 12px;">

### 🎨 Kupola 集成

<p style="font-size: 13px; color: var(--vp-c-text-2); margin: 0 0 12px;">事件驱动 UI 联动，查询结果 → Table，操作确认 → Modal。</p>

```js
adapter.on('result', ({ result }) => {
  Table.create('#area', result.table);
});
```

<a href="/ai-adapter/kupola-integration" style="display: inline-block; color: #ccc; text-decoration: none; font-size: 12px; font-weight: 500;">more</a>

</div>

</div>

<div style="text-align: center; margin: 40px 0;">

<a href="/ai-adapter/introduction" style="display: inline-block; background: var(--vp-c-brand-soft); color: #fff; padding: 8px 20px; border-radius: 6px; text-decoration: none; font-size: 15px; font-weight: 500; margin: 0 8px;">查看完整文档</a> <a href="/ai-adapter/api" style="display: inline-block; background: var(--vp-c-brand-soft); color: var(--vp-c-brand-1); padding: 8px 20px; border-radius: 6px; text-decoration: none; font-size: 15px; font-weight: 500; margin: 0 8px;">API Info</a>

</div>

---

## 组件

48+ 开箱即用的 UI 组件，零框架依赖。

<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin: 24px 0;">
<div style="border: 1px solid #264d88ff;padding: 4px 0;text-align: center;border-radius: 10px;"><strong>Modal</strong> — 模态弹窗</div>
<div style="border: 1px solid #264d88ff;padding: 4px 0;text-align: center;border-radius: 10px;"><strong>Table</strong> — 数据表格</div>
<div style="border: 1px solid #264d88ff;padding: 4px 0;text-align: center;border-radius: 10px;"><strong>Form</strong> — 表单系统</div>
<div style="border: 1px solid #264d88ff;padding: 4px 0;text-align: center;border-radius: 10px;"><strong>Dropdown</strong> — 下拉菜单</div>
<div style="border: 1px solid #264d88ff;padding: 4px 0;text-align: center;border-radius: 10px;"><strong>Notification</strong> — 通知提示</div>
<div style="border: 1px solid #264d88ff;padding: 4px 0;text-align: center;border-radius: 10px;"><strong>Dialog</strong> — 确认对话框</div>
</div>

<a href="/components/overview" style="display: inline-block; background: var(--vp-c-brand-soft); color: #fff; padding: 8px 20px; border-radius: 6px; text-decoration: none; font-size: 15px; font-weight: 500;">查看全部组件</a>
