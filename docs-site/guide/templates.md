# create-kupola 模板

`create-kupola` 提供 7 种项目模板，覆盖纯前端、SSR 框架和后端集成场景。

## 快速开始

```bash
# 交互式选择模板
npm create @kupola/kupola

# 非交互式指定模板
npx @kupola/create-kupola my-app --template=nextjs
```

## 模板一览

| 模板 | 类型 | 技术栈 | 启动命令 |
|------|------|--------|---------|
| `static` | 纯前端 | HTML + Vite | `npx vite` |
| `static-ts` | 纯前端 | TypeScript + Vite | `npx vite` |
| `nextjs` | SSR | Next.js 15 + React 19 | `npx next dev` |
| `nuxt` | 混合渲染 | Nuxt 3 + Vue 3 | `npx nuxt dev` |
| `flask` | 后端集成 | Python Flask + Jinja2 | `python app.py` |
| `fastapi` | 后端集成 | Python FastAPI + Jinja2 | `uvicorn main:app --reload` |
| `gin` | 后端集成 | Go Gin + html/template | `go run main.go` |

## Static（纯静态）

最简单的起点。HTML 文件 + Vite 开发服务器，Kupola 指令直接在 HTML 中运行。

```html
<div k-data="{ count: 0 }">
  <p k-text="count"></p>
  <button k-on:click="count++">+1</button>
</div>

<script type="module">
  import { walk } from '@kupola/kupola/directives';
  walk(document.body);
</script>
```

**适合**：原型验证、简单页面、学习 Kupola。

## Static + TypeScript

在 Static 基础上添加 TypeScript 支持，通过 Vite 编译。入口文件 `src/main.ts` 初始化指令系统。

```typescript
import { walk } from '@kupola/kupola/directives';
walk(document.body);
```

**适合**：需要类型检查的中小型项目。

## Next.js（SSR）

使用 Next.js App Router，Kupola 指令通过 `'use client'` 组件在客户端水合后初始化。

### 架构

```
layout.tsx (Server)     → CSS 导入 + 防 FOUC 脚本
└── page.tsx (Server)   → 页面结构
    └── KupolaApp.tsx   → 'use client' + walk() 初始化
```

### 核心代码

```tsx
// src/components/KupolaApp.tsx
'use client';
import { useEffect } from 'react';
import { walk } from '@kupola/kupola/directives';

export default function KupolaApp() {
  useEffect(() => {
    walk(document.body);
  }, []);

  return (
    <div dangerouslySetInnerHTML={{ __html: `
      <div k-data="{ count: 0 }">
        <p k-text="count"></p>
        <button k-on:click="count++">+1</button>
      </div>
    `}} />
  );
}
```

### 防 FOUC

`layout.tsx` 中注入阻塞式主题脚本：

```tsx
<script dangerouslySetInnerHTML={{
  __html: `(function(){var t=localStorage.getItem('kupola-theme')||'dark';document.documentElement.dataset.theme=t;})()`,
}} />
```

**适合**：需要 SEO + Kupola 交互的项目。

## Nuxt（混合渲染）

Nuxt 3 + Vue 3，Kupola 指令通过 `<ClientOnly>` 组件确保仅在客户端执行。

### 架构

```
nuxt.config.ts          → CSS 导入 + 防 FOUC 脚本
app.vue                 → <NuxtPage />
└── pages/index.vue     → Vue 页面 + 主题切换
    └── KupolaCounter.vue → <ClientOnly> + walk()
```

### 核心代码

```vue
<!-- components/KupolaCounter.vue -->
<template>
  <ClientOnly>
    <section v-html="counterHTML" ref="sectionRef" />
  </ClientOnly>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { walk } from '@kupola/kupola/directives';

const sectionRef = ref(null);
const counterHTML = `<div k-data="{ count: 0 }">...</div>`;

onMounted(() => {
  if (sectionRef.value) walk(sectionRef.value);
});
</script>
```

**适合**：Vue 技术栈 + 需要 SSR/SSG 的项目。

## Flask / FastAPI / Gin（后端集成）

后端模板引擎渲染 HTML，Kupola 作为前端层处理交互。CSS/JS 通过 npm 安装后复制到 `static/` 目录。

**适合**：已有后端项目，需要添加响应式前端交互。

## 所有模板共有功能

- **防 FOUC**：阻塞式主题预加载脚本
- **主题持久化**：`localStorage('kupola-theme')` + 切换按钮
- **响应式**：4 个断点（sm/md/lg/xl）+ `ds-hide/show` 工具类
- **交互示例**：Counter、Todo List、Form Binding、Reactive Computed
- **Kupola 2.0**：48+ 可 tree-shake 组件 + 指令系统
