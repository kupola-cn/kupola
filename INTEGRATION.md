# 集成指南

本文档帮助你在不同技术栈中集成 Kupola。根据你的场景选择对应章节。

---

## 1. 无构建项目（CDN）

适合传统服务端渲染页面，无需任何构建工具：

```html
<!-- 核心引擎 -->
<script src="https://cdn.jsdelivr.net/npm/@kupola/kupola/dist/kupola-core.umd.js"></script>
<!-- 指令系统（可选，用于 HTML 声明式写法） -->
<script src="https://cdn.jsdelivr.net/npm/@kupola/kupola/dist/kupola-core-directives.umd.js"></script>

<div k-data="{ count: 0 }">
  <button k-on:click="count++">点击 ${count} 次</button>
</div>

<script>
  Kupola.walk(document.body);
</script>
```

**编程式写法**（不引入指令系统）：

```html
<div id="app"></div>
<script type="module">
  import { signal, html, render } from 'https://cdn.jsdelivr.net/npm/@kupola/kupola/dist/kupola-core.esm.js';

  const count = signal(0);
  render(
    html`<button @click=${() => count.value++}>点击 ${count} 次</button>`,
    document.getElementById('app')
  );
</script>
```

---

## 2. Node.js / 服务端渲染（SSR）

核心引擎的 `renderToString` 不依赖任何浏览器 API，可直接在 Node.js 中运行：

```javascript
import { signal, html } from '@kupola/kupola';
import { renderToString } from '@kupola/kupola/server';

const title = signal('Hello World');
const items = signal(['Apple', 'Banana', 'Cherry']);

const pageHtml = renderToString(html`
  <h1>${title}</h1>
  <ul>
    ${items.value.map(item => html`<li>${item}</li>`)}
  </ul>
`);

res.send(`<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${title.value}</title></head>
<body>${pageHtml}</body>
</html>`);
```

客户端水合（hydration）— 不重建 DOM，仅绑定响应式：

```javascript
import { signal, html } from '@kupola/kupola';
import { hydrate } from '@kupola/kupola/server';

const title = signal('Hello World');
hydrate(html`<h1>${title}</h1>`, document.querySelector('h1').parentElement);
// 后续修改 title.value 会自动更新 DOM
```

---

## 3. Vite / Webpack 工程化项目

```bash
npm install @kupola/kupola
```

```javascript
// 引入核心引擎
import { signal, computed, html, render } from '@kupola/kupola';

// 按需引入组件（tree-shaking 友好）
import { Modal } from '@kupola/kupola/components/modal';
import { Table } from '@kupola/kupola/components/table';
import { Dropdown } from '@kupola/kupola/components/dropdown';

const modal = Modal({
  title: '提示',
  content: '操作成功！',
});
modal.open();
```

---

## 4. 与 React 混用

Kupola 组件可以在 React 中通过 `useEffect` 管理生命周期：

```jsx
import { useEffect, useRef } from 'react';
import { Modal } from '@kupola/kupola/components/modal';
import { Table } from '@kupola/kupola/components/table';

function UserTable({ data }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const table = Table({
      columns: [
        { key: 'name', label: '姓名', sortable: true },
        { key: 'email', label: '邮箱' },
      ],
      data,
      pagination: true,
    });
    containerRef.current.appendChild(table.element);
    return () => table.destroy();
  }, [data]);

  return <div ref={containerRef} />;
}
```

---

## 5. 与 Vue 混用

```vue
<template>
  <div ref="container"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { Modal } from '@kupola/kupola/components/modal';

const container = ref(null);
let modal;

onMounted(() => {
  modal = Modal({
    title: 'Vue + Kupola',
    content: '两个框架可以共存！',
  });
  modal.open();
});

onUnmounted(() => {
  modal?.destroy();
});
</script>
```

---

## 6. 常见集成问题

**Q：我的项目用了 Tailwind / Bootstrap，CSS 会冲突吗？**

A：不会。Kupola 所有组件样式都限制在 `.kupola-*` 前缀命名空间内，且主要使用 CSS 变量驱动主题，不依赖全局样式重置。

**Q：服务端渲染时 `window is not defined` 报错怎么办？**

A：核心引擎的 `renderToString` 不依赖任何浏览器 API，可直接在 Node.js 中运行。组件（如 Modal、Dropdown）是纯客户端的，不要在服务端导入。

**Q：我只需要 Table 组件，不想引入整个库？**

A：`import { Table } from '@kupola/kupola/components/table'` 即可。每个组件独立打包，不会引入其他组件代码。

**Q：Kupola 和 Vue / React 的响应式系统会冲突吗？**

A：不会。Kupola 的 Signal 系统完全独立，不修改全局状态。在 Vue / React 中使用时，各自管理各自的响应式，互不干扰。

**Q：支持 IE 11 吗？**

A：不支持。Kupola 2.0 使用 Proxy、模板字面量等现代 API，最低要求 Chrome 88 / Firefox 78 / Safari 14。
