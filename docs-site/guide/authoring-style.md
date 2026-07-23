# 书写风格

Kupola 的推荐写法是：HTML 负责结构和声明式绑定，JavaScript 负责复杂逻辑和数据协作。模板应该容易扫读，业务逻辑应该容易测试和复用。

## 页面拆分

小页面可以只有一个 `k-data`。业务页面推荐拆成多个交互岛，每个区域管理自己的状态。

```html
<main>
  <section k-data="{ keyword: '', loading: false }">
    <input k-model="keyword" placeholder="搜索用户" />
    <button @click="loading = true">搜索</button>
  </section>

  <section k-data="{ open: false }">
    <button @click="open = true">新建</button>
    <div k-show="open">...</div>
  </section>
</main>
```

这样可以避免整页状态互相影响，也方便在后端模板中按模块复用。

## 表达式复杂度

指令表达式应该保持短小。复杂逻辑放到命名方法里。

不推荐：

```html
<button @click="items = items.filter(x => x.id !== selectedId); selectedId = null; toast('done')">
  删除
</button>
```

推荐：

```html
<div k-data="usersPage">
  <button @click="removeSelected()">删除</button>
</div>
```

```js
import { defineScope } from '@kupola/kupola'

defineScope('usersPage', () => ({
  selectedId: null,
  items: [],
  removeSelected() {
    this.items = this.items.filter(item => item.id !== this.selectedId)
    this.selectedId = null
    toast('done')
  },
}))
```

## 推荐规则

- `k-text`、`k-show`、`:disabled` 等属性绑定可以写简单表达式。
- `@click`、`@submit` 等事件中优先调用命名方法。
- 一条指令不要同时做数据请求、数组变换、状态重置和 UI 提示。
- 需要复用的状态和方法放到页面 controller 中。
- 用户内容使用 `k-text`，可信 HTML 才使用 `k-html`。

## 表单

表单提交优先放在 `<form>` 上，用 `@submit.prevent` 阻止浏览器默认刷新，并调用命名方法：

```html
<form k-data="profileForm" @submit.prevent="save()">
  <input name="name" k-model.trim="name" />
  <input name="email" k-model.trim="email" />
  <button :disabled="saving">保存</button>
</form>
```

```js
defineScope('profileForm', () => ({
  name: '',
  email: '',
  saving: false,
  async save() {
    this.saving = true
    try {
      await api.save({ name: this.name, email: this.email })
    } finally {
      this.saving = false
    }
  },
}))
```

输入即时过滤可以用 `k-model.debounce`，避免在模板里手写 `setTimeout`：

```html
<section k-data="usersSearch">
  <input k-model.trim.debounce.300="keyword" placeholder="搜索用户" />
  <p k-show="loading">搜索中...</p>
</section>
```

```js
defineScope('usersSearch', () => ({
  keyword: '',
  users: [],
  loading: false,
  mounted({ watch }) {
    watch(() => this.keyword, () => this.search())
  },
  async search() {
    this.loading = true
    try {
      this.users = await api.search(this.keyword)
    } finally {
      this.loading = false
    }
  },
}))
```

`k-model.debounce` 负责降低写入频率，`watch()` 负责组织写入后的 JS 副作用。这样模板仍然只描述数据绑定。

## 条件与样式

模板里先区分“是否存在”和“是否可见”：

```html
<section k-data="{ open: false, canEdit: false }">
  <button @click="open = !open">展开</button>

  <div k-show="open">
    频繁切换且需要保留 DOM 状态
  </div>

  <form k-if="canEdit">
    只在允许编辑时创建
  </form>
</section>
```

条件样式优先使用 `k-class`，保留静态 class 的稳定结构：

```html
<button
  class="btn"
  k-class="{ 'is-active': active, 'is-loading': loading }"
  :disabled="loading"
>
  保存
</button>
```

`:class` 更适合完整替换 class 属性；普通状态切换不要用它覆盖基础样式。

## 列表

列表优先使用 `<template k-for>`，让重复结构和列表容器保持清晰：

```html
<ul k-data="{ users: [] }">
  <template k-for="(user, index) in users" :key="user.id">
    <li>
      <span k-text="index + 1"></span>
      <span k-text="user.name"></span>
    </li>
  </template>
</ul>
```

只要列表项有稳定 id，就写 `:key`。这样排序、过滤、插入和删除时可以复用行 DOM，保留输入值、焦点和行内临时状态。

更新数组时优先重新赋值，这样依赖能被明确触发：

```html
<button @click="users = users.filter(user => user.id !== selectedId)">
  删除
</button>
```

对象字段也推荐重新赋值到顶层属性：

```js
defineScope('profilePage', () => ({
  users: [],
  user: { name: 'Alice', role: 'admin' },
  rename(name) {
    this.user = { ...this.user, name }
  },
  addUser(user) {
    this.users = [ ...this.users, user ]
  },
}))
```

避免只做深层原地修改，例如 `this.user.name = name` 或 `this.users.push(user)`。Kupola 的响应式边界是 scope 顶层属性，重新赋值能让模板依赖稳定更新，也让变更来源更容易追踪。

在 `mounted(ctx)` 或命名方法里，也可以用 `ctx.update()` 和 `ctx.patch()` 固定这种写法：

```js
defineScope('profilePage', ({ update, patch }) => ({
  users: [],
  user: { name: 'Alice', role: 'admin' },
  addUser(user) {
    return update('users', users => [ ...users, user ])
  },
  rename(name) {
    return patch('user', { name })
  },
}))
```

`update(name, updater)` 会读取顶层属性并写回 updater 返回值；`patch(name, partial)` 会浅合并已有对象并写回新对象。两者都只支持顶层 scope 属性，不支持 `user.name` 这样的路径字符串。

不要在模板表达式里堆叠复杂列表计算。过滤、排序、分页规则变长后，移到命名方法中。

## 避免竞争式绑定

同一个 DOM 状态最好只交给一个指令负责。下面这些组合会触发 warning，因为它们可能在同一轮更新中互相覆盖：

- `k-class` 和 `:class` / `k-bind:class`
- `k-style` 和 `:style` / `k-bind:style`
- `k-model` 和 `:value` / `k-bind:value`，但 checkbox/radio 的动态 value 除外
- `k-model` 和 `:checked` / `k-bind:checked`
- 同一元素同时写 `k-for` 和 `k-if`

推荐把职责拆开：

```html
<button
  class="btn"
  k-class="{ 'is-loading': loading }"
  :disabled="loading"
>
  保存
</button>
```

需要完整替换属性时才使用 `:class` 或 `:style`；需要增量切换状态时优先使用 `k-class`、`k-style`。

## 模板结构

动态模板推荐按“状态入口、分支、列表、动作”组织，让 HTML 可以从上到下读懂：

```html
<section k-data="ordersPage">
  <header>
    <input k-model.trim.debounce.300="keyword" />
    <button @click="reload()" :disabled="loading">刷新</button>
  </header>

  <p k-if="loading">加载中...</p>
  <p k-else-if="error" k-text="error"></p>

  <ul k-else>
    <template k-for="order in orders" :key="order.id">
      <li k-class="{ 'is-selected': order.id === selectedId }">
        <span k-text="order.title"></span>
        <button @click="select(order.id)">选择</button>
      </li>
    </template>
  </ul>
</section>
```

如果一个分支内部本身是独立功能区，再在分支内部放新的 `k-data`。不要让父级 scope 承担所有弹窗、列表、表单和局部刷新状态。

## Controller 写法

简单状态可以内联：

```html
<div k-data="{ open: false }">
  <button @click="open = !open">切换</button>
  <div k-show="open">内容</div>
</div>
```

复杂页面建议使用命名 controller：

```html
<section k-data="usersPage">
  <input k-model="keyword" />
  <button @click="search()">搜索</button>
  <p k-text="'共 ' + users.length + ' 条'"></p>
</section>
```

```js
import { defineScope } from '@kupola/kupola'

defineScope('usersPage', () => ({
  keyword: '',
  users: [],
  async search() {
    this.users = await api.searchUsers(this.keyword)
  },
}))
```

## DOM 查询

Kupola 提供轻量 `$`、`$$`，用于减少重复的 `document.querySelector`。它们只是原生 DOM 查询的薄封装，不返回 jQuery 风格包装对象。

```js
import { $, $$ } from '@kupola/kupola'

const form = $('#user-form')
const rows = $$('[data-row]', form)
```

在 scope 内更推荐使用局部版本，默认限定在当前 `k-data` 根元素：

```js
import { defineScope } from '@kupola/kupola'

defineScope('usersPage', ({ $, $$, refs }) => ({
  mounted() {
    refs.keyword.focus()
    const firstRow = $('[data-row]')
    const allRows = $$('[data-row]')
  },
}))
```

需要稳定访问关键节点时，优先使用 `k-ref`；临时查询或批量查询时使用 `$`、`$$`。

## 组件使用边界

组件库适合作为 JavaScript 工厂使用，HTML 负责触发组件行为。

```html
<button @click="openCreateUserModal()">新建用户</button>
```

```js
import { Modal } from '@kupola/kupola/components/modal'
import { defineScope } from '@kupola/kupola'

defineScope('usersPage', () => ({
  openCreateUserModal() {
    Modal({
      title: '新建用户',
      content: document.querySelector('#create-user-template').content.cloneNode(true),
    }).open()
  },
}))
```

Kupola 当前不要求用户写 `<kupola-table>` 这类自定义标签。除非项目明确引入 Web Components 层，否则推荐保持“HTML 指令 + JS 组件工厂”的组合。
