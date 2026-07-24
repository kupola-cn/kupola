# Webpack 插件

自动检测 HTML 中的 Kupola 引用并注入 CSS，兼容 Webpack 5+。

## 配置

```js
// webpack.config.js
const KupolaPlugin = require('@kupola/platform/plugins/webpack');

module.exports = {
  plugins: [
    new KupolaPlugin({
      css: true,    // 自动注入 CSS（默认 true）
      theme: 'dark' // 默认主题
    })
  ]
};
```

## 工作原理

1. 监听 `processAssets` 钩子（`PROCESS_ASSETS_STAGE_ADDITIONS` 阶段）
2. 扫描生成的 HTML 文件
3. 检测到 `@kupola/` 引用时自动在 `</head>` 前插入 CSS `<link>` 标签

## 选项

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `css` | `boolean` | `true` | 是否自动注入 CSS |
| `theme` | `string` | `'dark'` | 默认主题 |

## 注意事项

- 仅支持 Webpack 5（使用 `compiler.webpack` API）
- 对于 Webpack 4，请手动引入 CSS：

```js
// 入口文件
import '@kupola/platform/css';
```
