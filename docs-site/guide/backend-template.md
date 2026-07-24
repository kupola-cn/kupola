# 后端模板集成

后端模板集成模式适用于 Go、Java、PHP、Python、Ruby、.NET 等服务端渲染项目。后端继续负责页面结构、初始数据和权限判断，Kupola 只在浏览器端增强局部交互。

核心原则：

- 后端输出可直接访问的 HTML。
- HTML 使用 `k-data`、`k-model`、`@click`、`k-if`、`k-for` 等指令声明交互。
- JavaScript controller 使用 `defineScope()` 管理状态、副作用和异步请求。
- 动态插入或替换的片段用 `walkOnce()`、`walkAuto()`、`destroyWalk()` 管理生命周期。

## 整页增强

如果页面由后端模板完整渲染，前端只需要在入口初始化一次：

```html
<body>
  <main data-kupola-app>
    <section k-data="usersPage">
      <input k-model.trim="keyword" placeholder="搜索用户" />
      <button @click="search()" :disabled="loading">搜索</button>
      <p k-show="loading">加载中...</p>

      <template k-for="user in users" :key="user.id">
        <article>
          <h3 k-text="user.name"></h3>
          <p k-text="user.email"></p>
        </article>
      </template>
    </section>
  </main>
</body>
```

```js
import { defineScope, walkOnce } from '@kupola/platform/directives'

defineScope('usersPage', () => ({
  keyword: '',
  users: [],
  loading: false,

  async search() {
    this.loading = true
    try {
      this.users = await api.searchUsers(this.keyword)
    } finally {
      this.loading = false
    }
  },
}))

walkOnce(document.querySelector('[data-kupola-app]'))
```

`walkOnce()` 适合作为统一入口。即使初始化脚本被重复执行，也会直接返回已有实例，不会重复绑定事件和 effects。

## 交互岛

复杂页面推荐按业务区域拆分为多个交互岛，而不是把整页状态塞进一个大 scope：

```html
<main data-kupola-app>
  <section k-data="userFilters">...</section>
  <section k-data="usersTable">...</section>
  <aside k-data="userDrawer">...</aside>
</main>
```

每个交互岛都有自己的 `defineScope()`。需要共享状态时，显式引入共享 store：

```js
export const userStore = {
  selectedId: null,
  permissions: [],
}
```

```js
import { userStore } from './stores/user-store.js'

defineScope('usersTable', () => ({
  store: userStore,
  select(id) {
    this.store.selectedId = id
  },
}))
```

这种结构更适合后端模板项目：模板仍然按页面和局部片段组织，前端状态按交互区域组织。

## 初始数据

后端数据不要拼进表达式字符串里。推荐使用 JSON script 输出，再由 controller 读取：

```html
<script type="application/json" id="users-data">
  [{"id":1,"name":"Alice","email":"alice@example.com"}]
</script>

<section k-data="usersPage">
  <p k-text="'共 ' + users.length + ' 条'"></p>
</section>
```

```js
const initialUsers = JSON.parse(
  document.querySelector('#users-data').textContent,
)

defineScope('usersPage', () => ({
  users: initialUsers,
}))
```

服务端必须保证 JSON 内容已经正确序列化和转义。普通用户输入、URL 参数、评论内容等输出到页面时，优先配合 `k-text`，不要直接交给 `k-html`。

## 动态片段

如果后端返回局部 HTML，例如弹窗内容、表格片段、Tab 内容或筛选结果，推荐在替换前销毁旧实例，替换后初始化新片段：

```js
import { destroyWalk, walkOnce } from '@kupola/platform/directives'

async function reloadUsersPanel() {
  const root = document.querySelector('#users-panel')

  destroyWalk(root)
  root.innerHTML = await fetch('/users/fragment').then(r => r.text())
  walkOnce(root)
}
```

如果片段会被外部工具移除，例如弹窗库、HTMX、Turbo 或页面局部替换，可以用 `walkAuto()`：

```js
import { walkAuto } from '@kupola/platform/directives'

document.addEventListener('fragment:mounted', event => {
  walkAuto(event.detail.root)
})
```

`walkAuto()` 只观察 root 是否离开 DOM。它适合“外部系统负责移除 DOM，Kupola 负责清理绑定”的场景。

## HTMX / Turbo

和 HTMX、Turbo 这类工具集成时，推荐只在新增片段 root 上初始化：

```js
import { walkOnce } from '@kupola/platform/directives'

document.body.addEventListener('htmx:afterSwap', event => {
  walkOnce(event.detail.elt, { autoDestroy: true })
})
```

```js
import { walkOnce } from '@kupola/platform/directives'

document.addEventListener('turbo:frame-load', event => {
  walkOnce(event.target, { autoDestroy: true })
})
```

不要在每次局部刷新后重新 `walk(document.body)`。这会扩大扫描范围，也容易让旧片段和新片段的生命周期混在一起。

## 目录建议

后端模板项目可以把模板、页面 controller 和共享初始化脚本分开：

```txt
templates/
  layout.html
  users.html
  orders.html
static/
  js/
    kupola-init.js
    pages/
      users.js
      orders.js
    stores/
      user-store.js
  css/
    app.css
```

`kupola-init.js` 只负责通用初始化：

```js
import { walkOnce } from '@kupola/platform/directives'

const root = document.querySelector('[data-kupola-app]') || document.body
walkOnce(root)
```

页面脚本只注册当前页面需要的 scope：

```js
import { defineScope } from '@kupola/platform/directives'

defineScope('ordersPage', () => ({
  orders: [],
  loading: false,
}))
```

## 边界

后端模板集成模式不要求把所有逻辑写进 HTML。推荐把 HTML 当成结构和绑定声明，把复杂逻辑放回 JavaScript：

```html
<!-- 推荐 -->
<button @click="submit()" :disabled="!canSubmit">提交</button>
```

```js
defineScope('profileForm', () => ({
  name: '',
  email: '',
  get canSubmit() {
    return this.name.trim() && this.email.includes('@')
  },
  submit() {
    // validate and save
  },
}))
```

避免在模板表达式里写过长的业务规则、拼接未转义 HTML、重复初始化同一个 root，或把服务端权限判断替换成前端判断。前端交互只能改善体验，最终鉴权仍然必须由后端 API 和模板权限控制完成。
