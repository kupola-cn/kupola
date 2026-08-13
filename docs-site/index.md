---
layout: home
hero:
  name: Kupola 3.0
  text: 轻量级响应式应用平台
  tagline: Signals · Templates · Components · Directives — 不依赖任何主流框架
  actions:
    - theme: brand
      text: 快速开始
      link: /guide/getting-started
    - theme: alt
      text: 核心概念
      link: /guide/core-concepts
    - theme: alt
      text: GitHub
      link: https://github.com/kupola-cn/kupola

features:
  - icon: ⚡
    title: 响应式核心
    details: Signal、Computed、Effect、Watch、Reactive、Batch — 细粒度响应式系统，独立可用（约 5.5KB gzip）
  - icon: �
    title: 模板引擎
    details: html 标签模板字面量 + render / mount / createApp，支持 SSR（renderToString + hydrate）
  - icon: 🧩
    title: 50+ 组件
    details: Table、Form、Modal、Tree、SchemaForm、Select 等开箱即用的原生 UI 组件，按需引入
  - icon: 🎯
    title: 指令系统
    details: k-data、k-model、k-for、k-if、k-show 等 14 个内置指令，服务端 HTML 直接嵌入响应式交互
  - icon: 🛡️
    title: 路由与权限
    details: Hash / History / Memory 三种模式，路由守卫、RBAC+ABAC 权限管理、k-permission 指令
  - icon: 🎨
    title: 主题与国际化
    details: 防闪烁亮/暗模式、品牌色定制、18 个主题 API、内置中英文 i18n、日期/数字/货币格式化
---

## 两种方式，一样简单

::: code-group

```html [指令岛模式]
<div id="counter" k-data="{ count: 0 }">
  <button @click="count++" k-text="count"></button>
</div>
<script type="module">
  import { walkOnce } from '@kupola/platform/directives';
  walkOnce(document.getElementById('counter'));
</script>
```

```js [Vite 应用]
import { createApp, defineComponent, html, signal } from '@kupola/platform';
import '@kupola/platform/css';

const App = defineComponent({
  setup() {
    const count = signal(0);
    return html`
      <button onclick=${() => count.value++}>
        Count: ${count}
      </button>
    `;
  },
});

await createApp(App).mountAsync('#app');
```

:::

## 完整能力矩阵

<div style="display: flex; flex-wrap: wrap; gap: 8px; margin: 16px 0;">

<span style="background: var(--vp-c-brand-soft); color: var(--vp-c-brand); padding: 4px 12px; border-radius: 6px; font-size: 13px; font-weight: 500;">Signal</span>
<span style="background: var(--vp-c-brand-soft); color: var(--vp-c-brand); padding: 4px 12px; border-radius: 6px; font-size: 13px; font-weight: 500;">Computed</span>
<span style="background: var(--vp-c-brand-soft); color: var(--vp-c-brand); padding: 4px 12px; border-radius: 6px; font-size: 13px; font-weight: 500;">Effect</span>
<span style="background: var(--vp-c-brand-soft); color: var(--vp-c-brand); padding: 4px 12px; border-radius: 6px; font-size: 13px; font-weight: 500;">Watch</span>
<span style="background: var(--vp-c-brand-soft); color: var(--vp-c-brand); padding: 4px 12px; border-radius: 6px; font-size: 13px; font-weight: 500;">Reactive</span>
<span style="background: var(--vp-c-brand-soft); color: var(--vp-c-brand); padding: 4px 12px; border-radius: 6px; font-size: 13px; font-weight: 500;">Batch</span>
<span style="background: var(--vp-c-purple-soft); color: var(--vp-c-purple-1); padding: 4px 12px; border-radius: 6px; font-size: 13px; font-weight: 500;">html</span>
<span style="background: var(--vp-c-purple-soft); color: var(--vp-c-purple-1); padding: 4px 12px; border-radius: 6px; font-size: 13px; font-weight: 500;">renderToString</span>
<span style="background: var(--vp-c-purple-soft); color: var(--vp-c-purple-1); padding: 4px 12px; border-radius: 6px; font-size: 13px; font-weight: 500;">hydrate</span>
<span style="background: var(--vp-c-green-soft); color: var(--vp-c-green-1); padding: 4px 12px; border-radius: 6px; font-size: 13px; font-weight: 500;">useQuery</span>
<span style="background: var(--vp-c-green-soft); color: var(--vp-c-green-1); padding: 4px 12px; border-radius: 6px; font-size: 13px; font-weight: 500;">useForm</span>
<span style="background: var(--vp-c-green-soft); color: var(--vp-c-green-1); padding: 4px 12px; border-radius: 6px; font-size: 13px; font-weight: 500;">css</span>
<span style="background: var(--vp-c-green-soft); color: var(--vp-c-green-1); padding: 4px 12px; border-radius: 6px; font-size: 13px; font-weight: 500;">Theme</span>
<span style="background: var(--vp-c-green-soft); color: var(--vp-c-green-1); padding: 4px 12px; border-radius: 6px; font-size: 13px; font-weight: 500;">i18n</span>
<span style="background: var(--vp-c-green-soft); color: var(--vp-c-green-1); padding: 4px 12px; border-radius: 6px; font-size: 13px; font-weight: 500;">SSR</span>
<span style="background: var(--vp-c-green-soft); color: var(--vp-c-green-1); padding: 4px 12px; border-radius: 6px; font-size: 13px; font-weight: 500;">Router</span>
<span style="background: var(--vp-c-green-soft); color: var(--vp-c-green-1); padding: 4px 12px; border-radius: 6px; font-size: 13px; font-weight: 500;">Auth</span>
<span style="background: var(--vp-c-green-soft); color: var(--vp-c-green-1); padding: 4px 12px; border-radius: 6px; font-size: 13px; font-weight: 500;">DevTools</span>

</div>

## 50+ 组件

<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; margin: 16px 0;">

<div style="padding: 12px; border: 1px solid var(--vp-c-divider); border-radius: 8px;">
  <strong style="font-size: 13px;">📐 布局</strong>
  <p style="font-size: 12px; color: var(--vp-c-text-2); margin: 4px 0 0;">Panel · Collapse · Divider</p>
</div>

<div style="padding: 12px; border: 1px solid var(--vp-c-divider); border-radius: 8px;">
  <strong style="font-size: 13px;">🧭 导航</strong>
  <p style="font-size: 12px; color: var(--vp-c-text-2); margin: 4px 0 0;">Menu · Tabs · Breadcrumb · Dropdown · Pagination</p>
</div>

<div style="padding: 12px; border: 1px solid var(--vp-c-divider); border-radius: 8px;">
  <strong style="font-size: 13px;">📝 表单</strong>
  <p style="font-size: 12px; color: var(--vp-c-text-2); margin: 4px 0 0;">Form · Input · Select · Checkbox · Radio · DatePicker · SchemaForm</p>
</div>

<div style="padding: 12px; border: 1px solid var(--vp-c-divider); border-radius: 8px;">
  <strong style="font-size: 13px;">💬 反馈</strong>
  <p style="font-size: 12px; color: var(--vp-c-text-2); margin: 4px 0 0;">Modal · Dialog · Notification · Message · Alert · Drawer</p>
</div>

<div style="padding: 12px; border: 1px solid var(--vp-c-divider); border-radius: 8px;">
  <strong style="font-size: 13px;">📊 数据</strong>
  <p style="font-size: 12px; color: var(--vp-c-text-2); margin: 4px 0 0;">Table · Tree · Calendar · Timeline · StatCard · Heatmap</p>
</div>

<div style="padding: 12px; border: 1px solid var(--vp-c-divider); border-radius: 8px;">
  <strong style="font-size: 13px;">🎨 展示</strong>
  <p style="font-size: 12px; color: var(--vp-c-text-2); margin: 4px 0 0;">Tag · Badge · Avatar · Skeleton · Empty · Spin · Progress</p>
</div>

<div style="padding: 12px; border: 1px solid var(--vp-c-divider); border-radius: 8px;">
  <strong style="font-size: 13px;">🖱️ 交互</strong>
  <p style="font-size: 12px; color: var(--vp-c-text-2); margin: 4px 0 0;">Tooltip · Slider · Switch · Carousel · ImagePreview</p>
</div>

<div style="padding: 12px; border: 1px solid var(--vp-c-divider); border-radius: 8px;">
  <strong style="font-size: 13px;">🔧 工具</strong>
  <p style="font-size: 12px; color: var(--vp-c-text-2); margin: 4px 0 0;">Icons · Kbd · Countdown · ColorPicker · FileUpload · VirtualList</p>
</div>

</div>

<div style="text-align: center; margin: 24px 0 8px;">
  <a href="/components/overview" style="display: inline-block; background: var(--vp-c-brand); color: #fff; padding: 8px 24px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 500;">查看全部组件 →</a>
</div>

---

## AI Adapter

<div style="background: var(--vp-c-bg-soft); border: 1px solid var(--vp-c-divider); border-radius: 12px; padding: 24px 32px; margin: 16px 0;">

`@kupola/ai-adapter` 将自然语言转化为结构化操作，提供查询引擎、执行引擎、流程引擎和意图解析，支持 AI 后端 + 规则引擎双模式。

<a href="/ai-adapter/introduction" style="display: inline-block; margin-top: 12px; color: var(--vp-c-brand); font-weight: 500; font-size: 14px;">了解 AI Adapter →</a>

</div>

<div style="text-align: center; margin: 32px 0 16px; color: var(--vp-c-text-2); font-size: 13px;">
  MIT Licensed · <a href="https://github.com/kupola-cn/kupola" style="color: var(--vp-c-brand);">GitHub</a> · <a href="https://www.npmjs.com/package/@kupola/platform" style="color: var(--vp-c-brand);">npm</a>
</div>

---

<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 32px; padding: 32px 0 16px;">

<div>
  <h4 style="font-size: 14px; margin: 0 0 12px; color: var(--vp-c-text-1);">文档</h4>
  <p style="margin: 0 0 8px; font-size: 13px;"><a href="/guide/getting-started" style="color: var(--vp-c-text-2); text-decoration: none;">快速开始</a></p>
  <p style="margin: 0 0 8px; font-size: 13px;"><a href="/guide/core-concepts" style="color: var(--vp-c-text-2); text-decoration: none;">核心概念</a></p>
  <p style="margin: 0 0 8px; font-size: 13px;"><a href="/components/overview" style="color: var(--vp-c-text-2); text-decoration: none;">组件总览</a></p>
  <p style="margin: 0 0 8px; font-size: 13px;"><a href="/guide/directives" style="color: var(--vp-c-text-2); text-decoration: none;">指令系统</a></p>
  <p style="margin: 0; font-size: 13px;"><a href="/guide/faq" style="color: var(--vp-c-text-2); text-decoration: none;">常见问题</a></p>
</div>

<div>
  <h4 style="font-size: 14px; margin: 0 0 12px; color: var(--vp-c-text-1);">资源</h4>
  <p style="margin: 0 0 8px; font-size: 13px;"><a href="https://github.com/kupola-cn/kupola" style="color: var(--vp-c-text-2); text-decoration: none;">GitHub</a></p>
  <p style="margin: 0 0 8px; font-size: 13px;"><a href="https://www.npmjs.com/package/@kupola/platform" style="color: var(--vp-c-text-2); text-decoration: none;">npm</a></p>
  <p style="margin: 0 0 8px; font-size: 13px;"><a href="https://github.com/kupola-cn/kupola-app" style="color: var(--vp-c-text-2); text-decoration: none;">示例应用</a></p>
  <p style="margin: 0 0 8px; font-size: 13px;"><a href="https://github.com/kupola-cn/kupola/releases" style="color: var(--vp-c-text-2); text-decoration: none;">更新日志</a></p>
  <p style="margin: 0; font-size: 13px;"><a href="https://github.com/kupola-cn/kupola/issues" style="color: var(--vp-c-text-2); text-decoration: none;">反馈问题</a></p>
</div>

<div>
  <h4 style="font-size: 14px; margin: 0 0 12px; color: var(--vp-c-text-1);">社区</h4>
  <p style="margin: 0 0 8px; font-size: 13px;"><a href="https://github.com/kupola-cn" style="color: var(--vp-c-text-2); text-decoration: none;">Kupola 组织</a></p>
  <p style="margin: 0 0 8px; font-size: 13px;"><a href="https://github.com/kupola-cn/kupola/blob/main/CONTRIBUTING.md" style="color: var(--vp-c-text-2); text-decoration: none;">贡献指南</a></p>
  <p style="margin: 0; font-size: 13px;"><a href="https://github.com/kupola-cn/kupola/blob/main/LICENSE" style="color: var(--vp-c-text-2); text-decoration: none;">MIT License</a></p>
</div>

<div>
  <h4 style="font-size: 14px; margin: 0 0 12px; color: var(--vp-c-text-1);">Kupola 3.0</h4>
  <p style="margin: 0; font-size: 13px; color: var(--vp-c-text-2); line-height: 1.6;">
    轻量级响应式应用平台<br>
    不依赖任何主流框架<br>
    Signals · Templates · Components<br>
    Directives · Theme · i18n · SSR
  </p>
</div>

</div>

<div style="border-top: 1px solid var(--vp-c-divider); margin-top: 24px; padding: 16px 0; text-align: center; font-size: 12px; color: var(--vp-c-text-3);">
  <p style="margin: 0;">Copyright &copy; 2024-present Kupola Team. Built with <a href="https://vitepress.dev" style="color: var(--vp-c-brand);">VitePress</a>.</p>
</div>