# Vite 集成

Kupola 应用可以直接使用标准 Vite 配置，不需要额外插件。Vite 会处理 Kupola 的
ESM 入口、动态导入和 CSS 构建。

## 配置

```js
// vite.config.js
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    target: 'es2022',
  },
})
```

应用入口显式引入 CSS：

```js
import '@kupola/platform/css'             // 完整样式
// import '@kupola/platform/css/tokens'   // 仅 tokens
// import '@kupola/platform/css/components'
// import '@kupola/platform/css/responsive'
```

当前发布的 `@kupola/platform` 没有 `@kupola/platform/vite` 或
`@kupola/platform/plugins/vite` 导出入口。不要按旧文档配置这些路径。

完整的 `createApp`、组件工厂、路由和权限示例见[ Vite 应用指南](/guide/vite-app)。
