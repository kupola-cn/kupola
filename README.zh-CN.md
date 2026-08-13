[English](./README.md) | [文档站](https://kupola-cn.github.io/kupola/)

# Kupola

[![CI](https://github.com/kupola-cn/kupola/actions/workflows/ci.yml/badge.svg)](https://github.com/kupola-cn/kupola/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@kupola/platform)](https://www.npmjs.com/package/@kupola/platform)
[![License](https://img.shields.io/npm/l/@kupola/platform)](https://github.com/kupola-cn/kupola/blob/main/LICENSE)

**示例应用：** [Kupola App](https://github.com/kupola-cn/kupola-app) — 基于 Kupola 构建的完整管理后台。

Kupola 是一个轻量级响应式应用平台，用于构建现代 Web 应用。它提供了一整套工具——
信号、模板、组件、指令、路由、权限、主题、国际化、SSR 等——不依赖任何主流框架。
你可以使用指令运行时在服务端渲染的 HTML 中嵌入交互岛，或使用 `createApp` 构建完
整的 JavaScript 单页应用。

## 特性

- **响应式** — signal、computed、effect、watch、reactive、batch、scheduler
- **模板引擎** — `html` 标签模板字面量、`render`、`mount`、`createApp`
- **组件系统** — `defineComponent`、`defineView`、`provide`/`inject`、组件注册、懒加载
- **指令** — `k-data`、`k-show`、`k-model`、`k-for`、`k-if`、`k-transition` 等 12+ 个内置指令
- **主题系统** — 防闪烁、亮/暗模式、品牌色、18 个主题 API
- **CSS Modules** — `css` 标签模板实现作用域样式，支持 `:global()`
- **表单状态** — `useForm` 响应式表单校验、脏/触碰状态追踪、异步提交
- **查询缓存** — `useQuery` 请求去重、缓存、失效
- **国际化** — 内置中英文消息、日期/数字/货币格式化
- **SSR** — `renderToString` + `hydrate` 带水合标记
- **错误边界** — `ErrorBoundary` 优雅处理组件错误
- **DevTools** — signal 性能分析器、`window.__KUPOLA_SIGNALS__` 调试注册表

## 安装

### 指令岛模式（服务端渲染 HTML）

```bash
npm install @kupola/platform
```

### Vite 单页应用

```bash
npm install @kupola/core @kupola/platform @kupola/components
```

### 需要路由和权限

```bash
npm install @kupola/router @kupola/auth
```

## 快速开始

### 指令岛

```html
<div id="counter" k-data="{ count: 0 }">
  <button @click="count++" k-text="count"></button>
</div>
<script type="module">
  import { walkOnce } from '@kupola/platform/directives';
  walkOnce(document.getElementById('counter'));
</script>
```

对交互岛根节点使用 `walkOnce`：重复初始化会直接返回已有实例，不会重复绑定。
当外部代码会移除该节点时（如 HTMX、Turbo、弹窗库），改用 `walkAuto` 自动清理。

> 指令表达式只适用于可信应用模板。它们基于 `new Function()`，不是沙箱。
> 用户内容使用 `k-text`；使用 `k-html` 前请接入应用 sanitizer。

### Vite 应用

```js
import { createApp, defineComponent, html, signal } from '@kupola/platform';
import '@kupola/platform/css';
import { Panel } from '@kupola/components/panel';

const AppRoot = defineComponent({
  setup() {
    const count = signal(0);
    return html`
      ${Panel({ title: '计数器' }, html`
        <button onclick=${() => count.value++}>
          计数: ${count}
        </button>
      `)}
    `;
  },
});

await createApp(AppRoot).mountAsync('#app');
```

### SSR

```js
import { renderToString } from '@kupola/platform/server';

const html = await renderToString(AppRoot);
// 客户端: hydrate(AppRoot, document.getElementById('app'))
```

## 包

| 包 | 用途 | 独立可用 | README |
|---------|---------|:----------:|:------:|
| `@kupola/core` | 响应式核心（signal、computed、effect、watch、batch、scheduler） | 是 | [📖](packages/core/README.md) |
| `@kupola/platform` | 全功能平台（模板、组件、指令、主题、国际化、SSR） | 是 | [📖](packages/platform/README.md) |
| `@kupola/components` | 50+ 原生 UI 组件（Table、Form、Modal、Tree、SchemaForm 等） | — | [📖](packages/components/README.md) |
| `@kupola/router` | SPA 路由（Hash/History/Memory、守卫、滚动、过渡） | — | [📖](packages/router/README.md) |
| `@kupola/auth` | RBAC + ABAC 权限管理（指令、HTTP 守卫、Store） | — | [📖](packages/auth/README.md) |
| `@kupola/ai-adapter` | AI/LLM 集成适配器（引擎、中间件、意图解析） | — | [📖](packages/ai-adapter/README.md) |
| `@kupola/create-kupola` | 项目脚手架（7 种模板：static、Vite、Next.js、Nuxt、Flask、FastAPI、Gin） | — | [📖](packages/create-kupola/README.md) |

## 子路径导出

所有包支持 tree-shakeable 子路径导入，优化打包体积：

| 导入路径 | 内容 |
|--------|---------|
| `@kupola/platform/template` | `html`、`TemplateResult` |
| `@kupola/platform/render` | `render`、`mount`、`createApp` |
| `@kupola/platform/component` | `defineComponent`、`defineView`、`provide`、`inject` |
| `@kupola/platform/directives` | `walk`、`walkOnce`、`walkAuto`、`defineScope` |
| `@kupola/platform/theme` | `setTheme`、`toggleTheme`、`getBrandColors`、`setBrandColor` |
| `@kupola/platform/lazy` | `lazyComponent`、`preloadComponent` |
| `@kupola/platform/server` | `renderToString`、`hydrate` |
| `@kupola/platform/i18n` | `setLocale`、`t`、`formatDate`、`formatNumber` |
| `@kupola/platform/errors` | `ErrorBoundary` |
| `@kupola/platform/css` | 设计令牌、组件、响应式 CSS |
| `@kupola/core/devtools` | `enableProfiler`、`getProfileReport`、`resetProfiler` |
| `@kupola/components/icon-config` | 图标注册辅助 |

## 文档入口

- [快速开始](https://kupola-cn.github.io/kupola/guide/getting-started)
- [Vite 应用](https://kupola-cn.github.io/kupola/guide/vite-app)
- [核心概念](https://kupola-cn.github.io/kupola/guide/core-concepts)
- [业务页面分层](https://kupola-cn.github.io/kupola/guide/page-architecture)
- [组件 API](https://kupola-cn.github.io/kupola/components/api)
- [指令能力矩阵](https://kupola-cn.github.io/kupola/guide/directive-matrix)
- [表单状态](https://kupola-cn.github.io/kupola/guide/form-state)
- [主题系统](https://kupola-cn.github.io/kupola/guide/theme-system)
- [国际化](https://kupola-cn.github.io/kupola/guide/i18n)
- [SSR](https://kupola-cn.github.io/kupola/guide/ssr)
- [安全策略](https://kupola-cn.github.io/kupola/guide/security-policy)
- [性能边界](https://kupola-cn.github.io/kupola/guide/performance)

## 开发

运行 `npm run verify` 执行完整的 lint/类型/测试/构建/体积门禁。Kupola 支持
Node 20 及以上。其他信息见 [changelog](./CHANGELOG.md)、
[贡献指南](./CONTRIBUTING.md)、[安全政策](./SECURITY.md)、
[行为准则](./CODE_OF_CONDUCT.md) 和 [MIT 许可证](./LICENSE)。