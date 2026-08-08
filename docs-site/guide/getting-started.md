# 快速开始

Kupola 优先用于增强已经存在的 HTML 页面。你可以先不引入构建工具，直接在服务端渲染或静态页面中添加声明式指令。

如果页面由 JavaScript/TypeScript 主导，使用 Vite + ESM + `createApp` 和组件工厂，
请先阅读 [Vite 应用](/guide/vite-app)。两种方式可以共存，但同一个 DOM 子树应由一种
运行时负责。

## CDN 使用

```html
<div
  id="app"
  k-data="{
    keyword: '',
    rows: ['Alice', 'Bob', 'Carol'],
  }"
>
  <input k-model="keyword" placeholder="Search" />

  <ul>
    <template k-for="row in rows.filter(item => item.toLowerCase().includes(keyword.toLowerCase()))" :key="row">
      <li k-text="row"></li>
    </template>
  </ul>
</div>

<script type="module">
  import { walkOnce } from 'https://cdn.jsdelivr.net/npm/@kupola/platform/dist/kupola-platform-directives.esm.js'
  walkOnce(document.getElementById('app'))
</script>
```

这类写法适合后端模板、传统管理后台、CMS 页面和只需要局部交互的业务系统。

## npm 安装

```bash
npm install @kupola/platform
```

## 指令系统

```html
<div id="app" k-data="{ name: 'World', open: true }">
  <input k-model="name" />
  <button @click="open = !open">Toggle</button>
  <h1 k-show="open" k-text="'Hello, ' + name"></h1>
</div>
```

```js
import { walkOnce } from '@kupola/platform/directives'

walkOnce(document.querySelector('#app'))
```

交互岛用 `walkOnce` 初始化：重复执行会返回已有实例，不会重复绑定；若节点会被
外部代码移除（HTMX、Turbo、弹窗库等），改用 `walkAuto` 自动清理。

## 命名 Scope

复杂页面推荐把状态和方法放进 `defineScope()`，模板只负责声明绑定。

```html
<section k-data="usersPage">
  <input k-ref="keywordInput" k-model="keyword" />
  <button @click="search()">搜索</button>
  <p k-text="'共 ' + users.length + ' 条'"></p>
</section>
```

```js
import { defineScope, walk } from '@kupola/platform/directives'

defineScope('usersPage', () => ({
  keyword: '',
  users: [],
  mounted({ refs }) {
    refs.keywordInput.focus()
  },
  async search() {
    this.users = await api.searchUsers(this.keyword)
  },
}))

walk(document.body)
```

也可以直接导入轻量 DOM 查询函数：

```js
import { $, $$ } from '@kupola/platform/directives'

const app = $('#users-page')
const buttons = $$('button', app)
```

## JS API

当你需要在 JavaScript 中声明视图时，可以使用 `signal`、`html` 和 `render`：

```js
import { signal, html, render } from '@kupola/platform'

const count = signal(0)

const template = html`
  <button @click=${() => count.value++}>
    Count: ${count}
  </button>
`

render(template, document.getElementById('app'))
```

或者按需导入：

```js
import { signal } from '@kupola/core'
import { html } from '@kupola/platform/template'
import { render } from '@kupola/platform/render'
```

## 按需组件

组件库是可选扩展。需要常见业务 UI 时再按需引入：

```js
import '@kupola/platform/css'
import { Modal } from '@kupola/components/modal'
import { Table } from '@kupola/components/table'
```

Vite 应用的完整入口、组件实例生命周期、路由和权限插件接入见：[Vite 应用](/guide/vite-app)。

## 下一步

- [书写风格](/guide/authoring-style)：如何组织 `k-data`、表达式和页面 controller。
- [后端模板集成](/guide/backend-template)：后端模板、交互岛和动态片段的推荐模式。
- [项目结构](/guide/project-structure)：后端模板、多页应用和静态项目的推荐目录。
- [生命周期](/guide/lifecycle)：如何初始化、销毁和管理动态插入的 HTML 片段。
