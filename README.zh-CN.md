[English](./README.md) | [文档站](https://kupola-cn.github.io/kupola/)

# Kupola

[![CI](https://github.com/kupola-cn/kupola/actions/workflows/ci.yml/badge.svg)](https://github.com/kupola-cn/kupola/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@kupola/platform)](https://www.npmjs.com/package/@kupola/platform)
[![License](https://img.shields.io/npm/l/@kupola/platform)](https://github.com/kupola-cn/kupola/blob/main/LICENSE)

**示例应用：** [Kupola App](https://github.com/kupola-cn/kupola-app) 展示了如何基于 Kupola 构建完整的管理后台。

Kupola 是面向服务端渲染 HTML 的零框架交互层。小型局部交互使用指令运行时，
JavaScript 主导的视图使用 signal/template API，需要复用的复杂交互再选择可选
组件库。`@kupola/router` 与 `@kupola/auth` 提供专为 SSR 应用设计的客户端
路由与权限管理。

## 特性

- `k-*` 指令——在服务端 HTML 中嵌入响应式岛（`k-data`、`k-show`、`k-model`、`k-for` 等）
- Signal 与模板字符串——无框架的状态驱动视图
- 原生组件——表格、表单、树、菜单、下拉等
- 路由与鉴权——hash/history/memory 模式、路由守卫、权限
- SSR 友好——水合静态标记，交互岛无需构建步骤

## 安装

```bash
npm install @kupola/platform
```

```html
<div k-data="{ count: 0 }">
  <button @click="count++" k-text="count"></button>
</div>
<script type="module">
  import { walk } from '@kupola/platform/directives';
  walk(document.body);
</script>
```

> 指令表达式只适用于可信应用模板。它们基于 `new Function()`，不是沙箱。
> 用户内容使用 `k-text`；使用 `k-html` 前请接入应用 sanitizer。

## 包

| 包 | 用途 |
|---|---|
| `@kupola/platform` | 指令、signal、模板、渲染 |
| `@kupola/components` | 可选原生组件库 |
| `@kupola/router` | 客户端路由 |
| `@kupola/auth` | 权限管理 |
| `@kupola/ai-adapter` | AI/LLM 集成适配器 |
| `@kupola/create-kupola` | 项目脚手架 |

## 文档入口

- [快速开始](https://kupola-cn.github.io/kupola/guide/getting-started)
- [指令能力矩阵](https://kupola-cn.github.io/kupola/guide/directive-matrix)
- [表单状态策略](https://kupola-cn.github.io/kupola/guide/form-state)
- [动态片段协议](https://kupola-cn.github.io/kupola/guide/dynamic-fragments)
- [安全策略接入](https://kupola-cn.github.io/kupola/guide/security-policy)
- [性能边界](https://kupola-cn.github.io/kupola/guide/performance)

## 开发

运行 `npm run verify` 执行完整的 lint/类型/测试/构建/体积门禁。Kupola 支持
Node 20 及以上。其他信息见 [changelog](./CHANGELOG.md)、
[贡献指南](./CONTRIBUTING.md)、[安全政策](./SECURITY.md)、
[行为准则](./CODE_OF_CONDUCT.md) 和 [MIT 许可证](./LICENSE)。
