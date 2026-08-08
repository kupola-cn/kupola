# Vite 应用

Kupola 支持两种互补的使用方式：服务端 HTML 使用指令运行时，前端应用使用
Vite + ESM + JavaScript API。kupola-app 属于后者：页面由 JavaScript 组件和模板
组织，Vite 负责模块解析、代码分割和 CSS 构建。

## 安装

```bash
npm install @kupola/core @kupola/platform @kupola/components
```

如果应用还需要路由和权限插件：

```bash
npm install @kupola/router @kupola/auth
```

## 最小应用

`index.html` 只需要提供挂载节点和模块入口：

```html
<div id="app"></div>
<script type="module" src="/src/main.js"></script>
```

`src/main.js`：

```js
import { createApp, defineComponent, html, signal } from '@kupola/platform'
import '@kupola/platform/css'
import { Panel } from '@kupola/components/panel'

const count = signal(0)

const AppRoot = defineComponent({
  setup() {
    return html`
      ${Panel({
        title: 'Vite 应用',
        subtitle: 'JavaScript 主导的页面视图',
        actions: html`
          <button type="button" onclick="${() => count.value++}">增加</button>
        `,
      }, html`
        <p>当前数量：<strong>${() => count.value}</strong></p>
      `)}
    `
  },
})

await createApp(AppRoot).mountAsync('#app')
```

`createApp` 会创建应用上下文、挂载根视图并管理销毁。组件工厂返回的实例可以
作为模板子内容插入；组件的通用实例 API 见[组件 API](/components/api)。

## Vite 配置

Kupola 不要求 Vite 插件。标准 Vite 配置即可运行：

```js
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    target: 'es2022',
  },
})
```

Vite 会处理 `@kupola/*` 的 ESM 入口和 CSS 依赖。推荐在应用入口显式引入样式：

```js
import '@kupola/platform/css'             // tokens + components + responsive
// import '@kupola/platform/css/tokens'  // 只需要 tokens 时
// import '@kupola/platform/css/components'
// import '@kupola/platform/css/responsive'
```

当前发布的 `@kupola/platform` 没有 `@kupola/platform/vite` 或
`@kupola/platform/plugins/vite` 导出入口，不需要也不应在应用中配置这类插件。

## 按需组件

大型应用推荐从子路径导入组件，保留更明确的代码边界并帮助构建工具进行代码分割：

```js
import { Table } from '@kupola/components/table'
import { SchemaForm } from '@kupola/components/schemaform'
import { Panel } from '@kupola/components/panel'
```

也可以从主入口导入多个组件：

```js
import { Panel, Table, Tree } from '@kupola/components'
```

组件的默认形态是 `Component(options, children)`。页面业务层负责请求、状态和布局，
组件负责自身的 DOM、交互和生命周期。复杂业务页面推荐采用
[业务页面分层](/guide/page-architecture) 的 `pages/*.js + view.js + state.js` 结构。

## 路由、权限和浮层

插件必须在挂载前注册。只包含同步生命周期时可以使用 `mount()`；路由、权限和浮层
初始化通常可能包含异步工作，推荐统一使用 `mountAsync()`：

```js
import { createApp } from '@kupola/platform'
import { createAuthPlugin } from '@kupola/auth'
import { createRouter, createRouterPlugin } from '@kupola/router'
import { createOverlayPlugin } from '@kupola/components/overlay'

const router = createRouter({ mode: 'history', routes })

const app = createApp(AppRoot)
  .use(createAuthPlugin(authProvider))
  .use(createRouterPlugin(router, {
    auth: authProvider,
    loginPath: '/login',
    forbiddenPath: '/403',
  }))
  .use(createOverlayPlugin())

await app.mountAsync('#app')
```

应用退出或替换根节点时调用 `app.destroyAsync()`。页面临时创建的组件实例则应在
不再使用时调用自身的 `destroy()`。

## 指令运行时与 Vite API 的选择

| 场景 | 推荐方式 |
| --- | --- |
| 服务端已经输出 HTML，只需要局部交互 | `k-data`、`k-model`、`walkOnce()` |
| 页面状态由 JavaScript 管理 | `signal`、`html`、`defineComponent`、`createApp` |
| 复用表格、表单、Panel 等业务 UI | `@kupola/components` 工厂组件 |
| 需要路由、权限和应用级插件 | `createApp(...).use(...).mountAsync()` |

两种方式可以在同一个项目中共存，但同一个 DOM 子树应由一种运行时负责，避免重复
初始化事件和状态。
