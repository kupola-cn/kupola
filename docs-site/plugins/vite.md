# Vite 插件

自动检测 Kupola 组件导入并注入 CSS tokens，无需手动 `import '@kupola/kupola/css'`。

## 安装

插件已内置于 `@kupola/kupola`，无需额外安装。

## 配置

```js
// vite.config.js
import { defineConfig } from 'vite';
import kupola from '@kupola/kupola/plugins/vite';

export default defineConfig({
  plugins: [
    kupola({
      css: true,    // 自动注入 CSS（默认 true）
      theme: 'dark' // 默认主题（可选 'dark' | 'light'）
    })
  ]
});
```

## 工作原理

1. 扫描源码中 `from '@kupola/...'` 的导入语句
2. 自动在模块顶部注入 `import '@kupola/kupola/css'`
3. HMR 热更新时自动重置注入状态

## 选项

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `css` | `boolean` | `true` | 是否自动注入 CSS tokens |
| `theme` | `string` | `'dark'` | 默认主题（注入到 `document.documentElement.dataset.theme`）|

## 手动引入（不使用插件）

如果不想使用自动注入，可以手动引入 CSS：

```js
import '@kupola/kupola/css';           // 完整样式
import '@kupola/kupola/css/tokens';    // 仅 tokens
import '@kupola/kupola/css/components'; // 仅组件样式
import '@kupola/kupola/css/responsive'; // 响应式工具类
```
