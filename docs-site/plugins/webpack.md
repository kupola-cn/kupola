# Webpack 集成

Kupola 没有发布 `@kupola/platform/plugins/webpack` 插件入口。Webpack 应用应按
普通 CSS 依赖接入 Kupola：

```js
// 入口文件
import '@kupola/platform/css'
```

Webpack 负责打包 ESM 和 CSS，应用仍然通过 `createApp` 或指令运行时初始化。Vite
应用则优先参考 [Vite 集成](/plugins/vite)。
