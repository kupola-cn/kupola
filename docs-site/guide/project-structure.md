# 项目结构

Kupola 面向服务端渲染和 HTML 优先项目。推荐把页面模板、页面 controller、共享初始化逻辑分开维护。

完整的后端模板集成模式见 [后端模板集成](/guide/backend-template)。

## 后端模板项目

适用于 Go、Java、PHP、Python、Ruby 等后端渲染页面。

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
  css/
    app.css
```

`kupola-init.js` 负责统一初始化：

```js
import { walk } from '@kupola/platform/directives'

const app = document.querySelector('[data-kupola-app]')
const instance = walk(app || document.body)

window.addEventListener('beforeunload', () => {
  instance.destroy()
})
```

页面脚本负责暴露当前页面 controller：

```js
import { defineScope } from '@kupola/platform/directives'

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
```

模板只声明结构和绑定：

```html
<section data-kupola-app k-data="usersPage">
  <input k-model="keyword" />
  <button @click="search()" :disabled="loading">搜索</button>
  <p k-show="loading">加载中...</p>
</section>
```

## 静态页面项目

适用于 Vite、静态 HTML、传统多页应用。

```txt
src/
  pages/
    users.html
    orders.html
  kupola/
    init.js
    pages/
      users.js
      orders.js
  styles/
    app.css
```

每个页面只加载自己的 controller，避免全站共享一个大对象。

```html
<script type="module" src="/kupola/pages/users.js"></script>
```

## 大页面组织

复杂页面推荐按业务区域拆分交互岛：

```html
<main>
  <section id="filters" k-data="userFilters">...</section>
  <section id="table" k-data="userTable">...</section>
  <section id="drawer" k-data="userDrawer">...</section>
</main>
```

需要共享数据时，使用一个显式的共享 store，而不是依赖隐式父级作用域。

```js
export const userStore = {
  selectedId: null,
  permissions: [],
}
```

```html
<script type="module">
  import { userStore } from '/static/js/stores/user-store.js'
  window.userStore = userStore
</script>

<section k-data="{ store: userStore }">
  <p k-text="store.selectedId"></p>
</section>
```

## 初始化范围

小页面可以：

```js
walk(document.body)
```

大页面推荐：

```js
document.querySelectorAll('[data-kupola-app]').forEach(root => {
  walk(root)
})
```

这样能避免扫描无关 DOM，也方便在局部刷新或页面片段销毁时管理生命周期。
