# Kupola

> A lightweight, dependency-free declarative UI component system for server-side rendered web applications.
>
> 零外部框架依赖的声明式 UI 组件系统，适用于任何服务端渲染 Web 应用。

[![License](https://img.shields.io/github/license/kupola-cn/kupola)](https://github.com/kupola-cn/kupola/blob/main/LICENSE)
[![npm](https://img.shields.io/npm/v/@kupola/kupola)](https://www.npmjs.com/package/@kupola/kupola)
[![bundle size (gzip)](https://img.shields.io/badge/gzip-104%20KB-blue)](https://bundlephobia.com/package/@kupola/kupola)
[![GitHub stars](https://img.shields.io/github/stars/kupola-cn/kupola)](https://github.com/kupola-cn/kupola/stargazers)

**HTMX** (data fetching) + **Alpine.js** (declarative interaction) + **Bootstrap** (component richness) — in one zero-dependency package.

---

## 🌐 Languages / 语言

- [English](#english)
- [中文](#中文)

---

<a id="english"></a>
## ✨ Features

- **50+ UI Components** — Buttons, inputs, cards, modals, datepickers, timepickers, heatmap, virtual list, stat cards, and more
- **Declarative Data Dependencies** — `useDeps()` with auto-caching, retry, refresh, and transform
- **HTTP Client Plugin System** — Plug in Axios, @navios/http, or any HTTP client; interceptors preserved
- **Reactive Data Binding** — Two-way binding with `ref()` / `store()` (Proxy-based)
- **Dual Themes** — Dark-first design with light theme support
- **11 Brand Colors** — Switchable brand themes inspired by Chinese traditional colors
- **Responsive** — PC, Pad, and Phone
- **Accessible** — WCAG AA compliant
- **Form Validation** — Built-in validation with custom rules
- **Zero Dependencies** — Pure HTML/CSS/JavaScript, ~104 KB gzipped
- **Backend Agnostic** — Works with Flask, Django, FastAPI, Gin, Spring Boot, ASP.NET, Express, Rails, Actix-web, and any backend that outputs HTML
- **TypeScript Ready** — Full type definitions included

---

## 🚀 Quick Start

### npm

```bash
npm install @kupola/kupola
```

```html
<link rel="stylesheet" href="node_modules/@kupola/kupola/dist/css/kupola.css">
<script src="node_modules/@kupola/kupola/dist/kupola.esm.js" type="module"></script>
```

### CDN

```html
<!-- ESM (modern browsers) -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@kupola/kupola/dist/css/kupola.css">
<script src="https://cdn.jsdelivr.net/npm/@kupola/kupola/dist/kupola.esm.js" type="module"></script>

<!-- UMD (legacy) -->
<script src="https://cdn.jsdelivr.net/npm/@kupola/kupola/dist/kupola.umd.js"></script>
```

---

## 📦 Usage

### Components (HTML-only, no JS needed)

```html
<button class="ds-btn ds-btn--brand">Primary</button>
<button class="ds-btn ds-btn--outline">Outline</button>

<div class="ds-card">
  <div class="ds-card__header">
    <h3 class="ds-card__title">Card Title</h3>
  </div>
  <div class="ds-card__body">Card content</div>
</div>
```

### Data Binding

```html
<input type="text" data-bind="user.name:value" placeholder="Name">
<span data-bind="user.name:text"></span>
```

```js
kupolaData.data.user = { name: 'John' };
kupolaData.data.user.name = 'Jane';  // Auto-updates all bound elements
```

### Declarative Data Dependencies

```html
<div data-deps="users:fetch:/api/users">
  <template data-each="users">
    <span data-bind="item.name:text"></span>
  </template>
</div>
```

```js
import { useDeps } from 'kupola';
useDeps({ users: { url: '/api/users', staleTime: 60000 } });
```

### HTTP Client Plugin (Axios Example)

```js
import { configureHttpClient } from 'kupola';
import { createAxiosAdapter } from 'kupola/adapters/axios';
import axios from 'axios';

const api = axios.create({ baseURL: '/api' });
api.interceptors.request.use(config => {
  config.headers.Authorization = `Bearer ${getToken()}`;
  return config;
});

// All useDeps() requests now go through Axios
configureHttpClient(createAxiosAdapter(api));
```

### HTTP Client Plugin (@navios/http Example)

```js
import { configureHttpClient } from 'kupola';
import { createNaviosAdapter } from 'kupola/adapters/navios-http';
import { create } from '@navios/http';

const client = create({ baseURL: '/api' });
client.interceptors.request.use(config => {
  config.headers['Authorization'] = `Bearer ${getToken()}`;
  return config;
});

configureHttpClient(createNaviosAdapter(client));
```

---

## 📖 Documentation

- [Usage Guide](docs/usage-guide.md) — Getting started and API reference
- [Integration Guide](INTEGRATION.md) — Framework integration examples
- [Kupola vs Vue/React](docs/kupola-vs-vue-react.md) — Architecture comparison
- [Contributing](CONTRIBUTING.md) — How to contribute

---

## 🛠️ Development

```bash
npm install          # Install dependencies
npm run dev          # Dev server (Vite, hot reload)
npm run build        # Production build
npm run lint         # Lint code
npm run test         # Run tests
```

---

## 🌐 Browser Support

Chrome, Firefox, Safari, Edge (latest)

---

<a id="中文"></a>
## ✨ 核心特性

- **50+ UI 组件** — 按钮、输入框、卡片、模态框、日期选择器、时间选择器、热力图、虚拟列表、统计卡片等
- **声明式数据依赖** — `useDeps()` 自动缓存、重试、刷新、数据转换
- **HTTP 客户端插件** — 无缝集成 Axios、@navios/http 或任意 HTTP 客户端，保留拦截器
- **响应式数据绑定** — 基于 Proxy 的双向绑定，`ref()` / `store()`
- **双主题** — 暗色优先设计，支持亮色主题切换
- **11 种品牌色** — 灵感源自中国传统色的可切换品牌主题
- **响应式** — 适配 PC、平板、手机
- **无障碍** — 符合 WCAG AA 标准
- **表单验证** — 内置验证系统，支持自定义规则
- **零依赖** — 纯 HTML/CSS/JavaScript，gzip 后约 104 KB
- **后端无关** — 支持 Flask、Django、FastAPI、Gin、Spring Boot、ASP.NET、Express、Rails、Actix-web 等任何输出 HTML 的后端
- **TypeScript 支持** — 完整类型定义

---

## 🚀 快速开始

### npm 安装

```bash
npm install @kupola/kupola
```

```html
<link rel="stylesheet" href="node_modules/@kupola/kupola/dist/css/kupola.css">
<script src="node_modules/@kupola/kupola/dist/kupola.esm.js" type="module"></script>
```

### CDN 引入

```html
<!-- ESM（现代浏览器） -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@kupola/kupola/dist/css/kupola.css">
<script src="https://cdn.jsdelivr.net/npm/@kupola/kupola/dist/kupola.esm.js" type="module"></script>

<!-- UMD（传统方式） -->
<script src="https://cdn.jsdelivr.net/npm/@kupola/kupola/dist/kupola.umd.js"></script>
```

---

## 📦 使用示例

### 组件（纯 HTML，无需 JS）

```html
<button class="ds-btn ds-btn--brand">主要按钮</button>
<button class="ds-btn ds-btn--outline">描边按钮</button>

<div class="ds-card">
  <div class="ds-card__header">
    <h3 class="ds-card__title">卡片标题</h3>
  </div>
  <div class="ds-card__body">卡片内容</div>
</div>
```

### 数据绑定

```html
<input type="text" data-bind="user.name:value" placeholder="姓名">
<span data-bind="user.name:text"></span>
```

```js
kupolaData.data.user = { name: '张三' };
kupolaData.data.user.name = '李四';  // 所有绑定元素自动更新
```

### 声明式数据依赖

```html
<div data-deps="users:fetch:/api/users">
  <template data-each="users">
    <span data-bind="item.name:text"></span>
  </template>
</div>
```

```js
import { useDeps } from 'kupola';
useDeps({ users: { url: '/api/users', staleTime: 60000 } });
```

### HTTP 客户端插件（Axios 示例）

```js
import { configureHttpClient } from 'kupola';
import { createAxiosAdapter } from 'kupola/adapters/axios';
import axios from 'axios';

const api = axios.create({ baseURL: '/api' });
api.interceptors.request.use(config => {
  config.headers.Authorization = `Bearer ${getToken()}`;
  return config;
});

// 之后所有 useDeps() 请求自动走 Axios + 拦截器
configureHttpClient(createAxiosAdapter(api));
```

---

## 📖 文档

- [使用指南](docs/usage-guide.md) — 入门与 API 参考
- [集成指南](INTEGRATION.md) — 后端框架集成示例
- [Kupola 与 Vue/React 对比](docs/kupola-vs-vue-react.md) — 架构对比
- [贡献指南](CONTRIBUTING.md) — 如何参与贡献

---

## 🛠️ 开发

```bash
npm install          # 安装依赖
npm run dev          # 开发服务器（Vite，热更新）
npm run build        # 生产构建
npm run lint         # 代码检查
npm run test         # 运行测试
```

---

## 🌐 浏览器支持

Chrome、Firefox、Safari、Edge（最新版本）

---

## 🤝 Contributing / 贡献

See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

---

## 🙏 Acknowledgments / 致谢

Kupola is built with the help of these excellent open-source tools:

**Build & Dev Tooling:**
- [Vite](https://vitejs.dev/) — Next generation frontend tooling
- [Rollup](https://rollupjs.org/) — ES module bundler
- [ESLint](https://eslint.org/) — JavaScript linter
- [Prettier](https://prettier.io/) — Code formatter
- [Jest](https://jestjs.io/) — JavaScript testing framework

**HTTP Client Adapters (optional, user-installed):**
- [Axios](https://axios-http.com/) — Promise based HTTP client
- [@navios/http](https://www.npmjs.com/package/@navios/http) — Lightweight fetch-based Axios replacement

---

## 📄 License

[MIT](LICENSE) © Kupola Team
