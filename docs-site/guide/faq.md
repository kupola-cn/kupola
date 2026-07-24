# Kupola 2.0 FAQ

## 安装与使用

### Q: 如何安装 Kupola？

```bash
npm install @kupola/core @kupola/platform @kupola/components
```

> 正式版已发布，可直接 `npm install @kupola/core @kupola/platform @kupola/components`。

### Q: Kupola 依赖 React 或 Vue 吗？

不依赖。Kupola 是**零框架依赖**的 UI 系统，可以独立运行在任何 Web 项目中。核心引擎 < 5KB gzip。

### Q: 如何在新项目中快速开始？

```bash
npx @kupola/create-kupola my-project
cd my-project
npm install
```

支持 4 种模板：`static`（纯前端）、`flask`、`fastapi`、`gin`。

### Q: 可以在已有项目中使用吗？

可以。Kupola 组件是独立的 JS 模块，通过 `<script type="module">` 引入即可，不会与现有代码冲突。

```html
<script type="module">
  import { Modal } from '@kupola/components';
  Modal({ title: 'Hello', content: 'World' }).open();
</script>
```

---

## 指令系统

### Q: k-show 和 k-if 有什么区别？

| 指令 | 行为 | 适用场景 |
|------|------|----------|
| `k-show` | 切换 `display:none`，元素保留在 DOM | 频繁切换（如 Tab 面板） |
| `k-if` | 从 DOM 中添加/移除元素 | 条件渲染（如权限控制） |

### Q: k-model 支持哪些表单元素？

支持 `<input>`、`<select>`、`<textarea>`、`<input type="checkbox">`、`<input type="radio">`。

```html
<input k-model="username" />
<select k-model="role">...</select>
<input type="checkbox" k-model="agree" />
<textarea k-model="bio"></textarea>
```

常用修饰符包括 `.trim`、`.number`、`.lazy` 和 `.debounce.300`：

```html
<input k-model.trim="name" />
<input k-model.number="age" />
<input k-model.debounce.300="keyword" />
```

### Q: 表单提交推荐怎么写？

优先把提交逻辑放在 `<form>` 上，用 `@submit.prevent` 调用命名方法：

```html
<form k-data="profileForm" @submit.prevent="save()">
  <input k-model.trim="name" />
  <button :disabled="saving">保存</button>
</form>
```

这样点击按钮和按 Enter 都会进入同一条提交路径。

### Q: k-for 如何获取索引？

```html
<template k-for="(item, index) in items" :key="item.id">
  <span k-text="index + ': ' + item.name"></span>
</template>
```

带 `:key` 时会复用并移动已有 DOM；没有 key 时会重新渲染列表片段。更新数组时优先重新赋值，例如 `items = [...items, nextItem]`；大列表优先使用 `VirtualList`。

### Q: k-bind 可以绑定任意 HTML 属性吗？

是的。`k-bind:属性名="表达式"` 可以绑定任何 HTML 属性：

```html
<button k-bind:disabled="isLoading">Submit</button>
<img k-bind:src="imageUrl" />
<div k-bind:data-state="active ? 'active' : 'idle'"></div>
```

也可以用对象批量绑定：

```html
<button k-bind="{ disabled: isLoading, title: label }">Submit</button>
```

条件 class 推荐使用 `k-class`：

```html
<div k-class="{ active: active }"></div>
```

### Q: k-on 支持哪些事件？

支持所有标准 DOM 事件：`click`、`submit`、`keydown`、`input`、`change`、`focus`、`blur`、`mouseenter`、`mouseleave` 等。

常用修饰符包括 `.stop`、`.prevent`、`.once`、`.self`、`.outside`、`.enter`、`.escape` 和 `.debounce.300`。

### Q: k-transition 会内置动画 CSS 吗？

不会。`k-transition` 只负责给 `k-show` / `k-if` 添加进入和离开的 class 生命周期，动画效果由项目 CSS 决定。

```html
<div k-show="open" k-transition>...</div>
```

```css
.kp-enter-active,
.kp-leave-active {
  transition: opacity 150ms ease;
}

.kp-enter-from,
.kp-leave-to {
  opacity: 0;
}
```

写 `k-transition="fade"` 时，class 前缀会变成 `.fade-enter-from`、`.fade-leave-to` 等。

### Q: k-data 的作用域是怎样的？

`k-data` 创建的作用域对其所有非嵌套作用域的子元素可见。嵌套的 `k-data` 会创建独立作用域，不会自动继承父作用域：

```html
<div k-data="{ count: 0, name: 'parent' }">
  <div k-data="{ count: 10 }">
    <!-- count = 10；name 不来自父作用域 -->
  </div>
</div>
```

### Q: 什么时候使用 watch()？

模板负责声明 UI 绑定，`watch()` 负责响应状态变化后的 JS 副作用，例如请求接口、本地存储、同步第三方组件。

```js
defineScope('usersPage', () => ({
  keyword: '',
  mounted({ watch }) {
    watch(() => this.keyword, () => this.search())
  },
}))
```

`watch()` 会随当前 `walk()` 实例销毁而自动清理。

动态片段里如果不方便保存实例引用，可以用 `getWalk()`、`hasWalk()`、`destroyWalk()` 管理当前 root 的实例；初始化入口可能重复触发时用 `walkOnce()`。

---

## 组件

### Q: 如何使用 Modal / Dialog / Drawer？

```js
import { Modal, Dialog, Drawer } from '@kupola/components';

// 模态框
Modal({ title: 'Title', content: 'Content' }).open();

// 确认对话框
Dialog({ title: 'Confirm?', content: 'Are you sure?', onConfirm: () => {} });

// 抽屉
Drawer({ title: 'Settings', content: '...' }).open();
```

### Q: Table 如何支持排序和分页？

```js
import { Table } from '@kupola/components';

Table({
  columns: [
    { key: 'name', title: 'Name', sortable: true },
    { key: 'email', title: 'Email' },
  ],
  data: [...],
  pagination: { pageSize: 20 },
});
```

### Q: 如何使用 Notification？

```js
import { Notification } from '@kupola/components';

Notification({
  title: 'Success',
  message: 'File uploaded!',
  type: 'success', // success | error | warning | info
  duration: 3000,  // ms, 0 = permanent
});
```

### Q: 如何使用 DatePicker / TimePicker？

```js
import { DatePicker, TimePicker } from '@kupola/components';

const dp = DatePicker({ container: '#date', onChange: (date) => console.log(date) });
const tp = TimePicker({ container: '#time', onChange: (time) => console.log(time) });
```

---

## 主题与样式

### Q: 如何切换明暗主题？

```html
<html data-theme="dark">
```

或通过 JS：

```js
document.documentElement.dataset.theme = 'dark'; // 或 'light'
```

### Q: 如何自定义主题颜色？

Kupola 使用 CSS 设计令牌（design tokens），覆盖 CSS 变量即可：

```css
:root {
  --ds-primary: #32F08C;
  --ds-bg: #ffffff;
  --ds-text: #1a1a1a;
}
```

### Q: CSS 文件在哪里？

```js
// 完整 CSS（tokens + 组件 + 主题）
import '@kupola/platform/css/kupola.css';

// 或按需引入
import '@kupola/platform/css/tokens.css';
import '@kupola/platform/css/components.css';
import '@kupola/platform/css/theme.css';
```

Vite/Webpack 用户可使用自动注入插件，无需手动导入 CSS。

---

## 国际化 (i18n)

### Q: 如何使用？

当前内置 `en-US` 和 `zh-CN`。

```js
import { setLocale } from '@kupola/platform/i18n';
setLocale('zh-CN');
```

### Q: 如何自定义翻译文本？

```js
import { setMessages, t } from '@kupola/platform/i18n';

setMessages('zh-CN', {
  'table.empty': '暂无数据',
  'dialog.ok': '确定',
  'dialog.cancel': '取消',
});
```

---

## SSR (服务端渲染)

### Q: 如何进行服务端渲染？

```js
import { renderToString } from '@kupola/platform/server';

const html = renderToString(template);
// 发送到客户端后水合：
import { hydrate } from '@kupola/platform/render';
hydrate(template, container);
```

---

## 性能

### Q: Kupola 的性能如何？

核心引擎 < 5KB gzip，零依赖。性能基准测试结果：

| 场景 | 耗时 | 限制 |
|------|------|------|
| 1000 Signal + Effect | ~4ms | < 500ms |
| VirtualList 10K items | ~21ms | < 200ms |
| VirtualList 100K items | ~11ms | < 500ms |
| Table 5K rows | ~4ms | < 2000ms |
| SSR 100 items | ~1ms | < 100ms |

### Q: 如何优化大列表渲染？

使用 `VirtualList` 组件，仅渲染可视区域内的元素：

```js
import { VirtualList } from '@kupola/platform';

VirtualList({
  items: largeArray,      // 支持 100K+ 数据
  itemHeight: 40,
  renderItem: (item) => html`<div>${item.name}</div>`,
});
```

---

## 安全

### Q: Kupola 如何处理 XSS？

- `k-text` 自动转义 HTML
- `k-html` 仅用于受信内容（会直接设置 innerHTML）
- Notification 组件的 title/message 已内置 HTML 转义
- 指令表达式会编译执行，因此模板必须来自可信源码；严格禁用 `unsafe-eval` 的 CSP 环境需要使用 JS API 或专门的 CSP 方案

### Q: 如何防止组件异常导致页面崩溃？

使用 `ErrorBoundary` 包裹组件：

```js
import { ErrorBoundary } from '@kupola/platform';

ErrorBoundary(() => MyComponent(), {
  fallback: '组件加载失败',
  onError: (err) => console.error(err),
});
```

---

## 构建与部署

### Q: 支持 Tree-shaking 吗？

支持。按需导入只打包使用到的组件：

```js
import { Modal } from '@kupola/components'; // 只包含 Modal 相关代码
```

### Q: 如何在 Vite/Webpack 中使用？

安装自动 CSS 注入插件：

```js
// vite.config.js
import { kupolaPlugin } from '@kupola/platform/plugins/vite';
export default { plugins: [kupolaPlugin()] };
```

```js
// webpack.config.js
const { KupolaPlugin } = require('@kupola/platform/plugins/webpack');
module.exports = { plugins: [new KupolaPlugin()] };
```

### Q: CDN link？

```html
<script type="module">
  import { signal, html, render } from 'https://unpkg.com/@kupola/core/dist/kupola-core.esm.js';
</script>
<link rel="stylesheet" href="https://unpkg.com/@kupola/platform/dist/css/index.css" />
```

---

## 版本与迁移

### Q: 2.0 和 1.x 的主要区别？

| 特性 | 1.x | 2.0 |
|------|-----|-----|
| 响应式 | DOM 轮询 | Signal-based |
| 组件数 | 48 | 48（完全重写） |
| 依赖 | jQuery-like | 零依赖 |
| 大小 | ~80KB | < 5KB 核心 |
| SSR | 简洁 | renderToString + hydrate |
| i18n | 无 | en-US / zh-CN |
| TypeScript | 部分 | 完整类型定义 |

### Q: 如何从 1.x 升级到 2.0？

1. 安装：`npm install @kupola/core @kupola/platform`
2. 指令语法基本兼容（`k-data`、`k-show`、`k-bind` 等）
3. 组件 API 有变化，参考组件文档更新调用方式
4. 移除旧的 CSS 引用，使用新的 CSS 设计令牌系统
