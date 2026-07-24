# 生命周期与动态片段

Kupola 的 `walk()` 会扫描 DOM 并绑定指令，返回的实例用于销毁这些绑定。只要页面会动态插入或移除 HTML，就应该显式管理生命周期。

## 基本初始化

```js
import { walk } from '@kupola/platform/directives'

const instance = walk(document.body)
```

`walk()` 返回的 `$`、`$$` 默认限定在当前根节点：

```js
const panel = walk('#users-panel')
const submit = panel.$('[type=submit]')
const rows = panel.$$('[data-row]')
```

当整页即将卸载或容器将被移除时：

```js
instance.destroy()
```

## 局部初始化

后端局部刷新、弹窗内容、Tab 内容、抽屉内容等场景，推荐只初始化新增片段。

```js
const container = document.querySelector('#users-panel')
container.innerHTML = await fetch('/users/fragment').then(r => r.text())

const usersPanel = walk(container)
```

移除片段前销毁：

```js
usersPanel.destroy()
container.remove()
```

## 自动销毁

如果片段会被外部工具移除，例如弹窗关闭、HTMX/Turbo 局部替换或后端模板片段刷新，可以使用 `walkAuto()`。它等价于 `walk(root, { autoDestroy: true })`，会在 root 从 DOM 中移除后自动调用 `destroy()`：

```js
import { walkAuto } from '@kupola/platform/directives'

const panel = walkAuto(document.querySelector('#dialog-panel'))
```

`walkAuto()` 只观察 root 是否被移除，不追踪每个内部节点。手动调用 `panel.destroy()` 仍然可用，并且会取消自动观察。

## 只初始化一次

如果初始化入口可能被外部回调重复触发，但你希望同一个 root 只绑定一次，可以使用 `walkOnce()`。它会在 root 未初始化时创建实例，已经初始化时直接返回已有实例：

```js
import { walkOnce } from '@kupola/platform/directives'

function mountPanel(root) {
  return walkOnce(root)
}
```

`walkOnce(root, { autoDestroy: true })` 也可用于局部片段。实例 `destroy()` 后，再次调用 `walkOnce(root)` 会创建新的实例。

## 查询与销毁实例

不方便保存实例引用时，可以按 root 查询或销毁当前实例：

```js
import { destroyWalk, getWalk, hasWalk } from '@kupola/platform/directives'

if (hasWalk('#users-panel')) {
  destroyWalk('#users-panel')
}

const instance = getWalk('#users-panel')
```

`getWalk(root)` 返回当前实例或 `null`，`hasWalk(root)` 返回布尔值，`destroyWalk(root)` 在找到实例并销毁时返回 `true`，没有实例时返回 `false`。

## 多实例管理

如果一个页面有多个独立区域，可以保存多个实例。

```js
const mounted = new Map()

document.querySelectorAll('[data-kupola-app]').forEach(root => {
  mounted.set(root, walk(root))
})

function unmount(root) {
  mounted.get(root)?.destroy()
  mounted.delete(root)
  root.remove()
}
```

## 初始化数据

页面初始数据推荐由服务端输出为 JSON，再由 controller 使用。

```html
<script type="application/json" id="users-data">
  [{"id":1,"name":"Alice"}]
</script>

<section k-data="usersPage">
  <p k-text="'共 ' + users.length + ' 条'"></p>
</section>
```

```js
const initialUsers = JSON.parse(document.querySelector('#users-data').textContent)

import { defineScope } from '@kupola/platform/directives'

defineScope('usersPage', () => ({
  users: initialUsers,
}))
```

## mounted()

如果页面需要首次加载数据，推荐在命名 scope 中定义 `mounted(ctx)`：

```js
import { defineScope } from '@kupola/platform/directives'

defineScope('usersPage', () => ({
  users: [],
  loading: false,
  mounted() {
    this.load()
  },
  async load() {
    this.loading = true
    try {
      this.users = await api.listUsers()
    } finally {
      this.loading = false
    }
  },
}))
```

## update() / patch()

`mounted(ctx)` 中可以使用 `ctx.update()` 和 `ctx.patch()` 统一顶层状态更新。它们适合数组追加、列表替换、对象浅合并等常见写法：

```js
defineScope('usersPage', ({ update, patch }) => ({
  users: [],
  filters: { keyword: '', role: 'all' },
  addUser(user) {
    return update('users', users => [ ...users, user ])
  },
  setKeyword(keyword) {
    return patch('filters', { keyword })
  },
}))
```

`update(name, updater)` 会把当前值传给 updater，并把返回值写回同名顶层属性。`patch(name, partial)` 要求当前值是对象，会浅合并并写回新对象。它们不做深层响应式代理，也不支持路径字符串。

## watch()

`mounted(ctx)` 里可以使用 `ctx.watch()` 监听当前响应式状态，并在状态变化时执行 JS 副作用。它适合搜索请求、持久化、联动第三方库等不应该塞进模板表达式的逻辑。

```js
import { defineScope } from '@kupola/platform/directives'

defineScope('usersPage', () => ({
  keyword: '',
  users: [],
  mounted({ watch }) {
    watch(
      () => this.keyword,
      keyword => {
        if (keyword.length >= 2) {
          this.search()
        }
      },
    )
  },
  async search() {
    this.users = await api.searchUsers(this.keyword)
  },
}))
```

需要首次立即执行时传入 `immediate`：

```js
mounted({ watch }) {
  watch(() => this.keyword, () => this.search(), { immediate: true })
}
```

`watch()` 返回清理函数，并且会自动加入当前 `walk()` 实例的 `destroy()` 清理队列。只有当你想提前停止监听时，才需要手动调用返回值。

callback 可以返回 cleanup 函数。Kupola 会在下一次 callback 运行前执行上一次 cleanup，并在 `destroy()` 或手动停止监听时执行最后一次 cleanup，适合取消请求、清理定时器或解绑第三方订阅：

```js
mounted({ watch }) {
  watch(
    () => this.keyword,
    keyword => {
      const controller = new AbortController()
      this.search(keyword, { signal: controller.signal })
      return () => controller.abort()
    },
  )
}
```

`watch()` 只跟踪 getter 中读取的响应式状态。callback 里读取其他状态不会把它们变成监听依赖，适合在 callback 中组装请求参数、读取临时状态或调用业务方法。

## k-init

简单页面也可以直接在 HTML 中使用 `k-init`：

```html
<section k-data="usersPage" k-init="load()">
  ...
</section>
```

`k-init` 只负责初始化，不应承担重复渲染、轮询或复杂生命周期编排。需要长期订阅时，仍应在 JavaScript 中保存清理函数，并在 `destroy()` 前后由业务代码管理。

## 动态片段

如果一个片段是通过 AJAX、HTMX、Turbo、后端模板局部刷新或弹窗懒加载插入的，推荐把“插入、初始化、移除”封装成一对函数：

```js
let usersPanel

async function replaceUsersPanel() {
  usersPanel?.destroy()

  const container = document.querySelector('#users-panel')
  container.innerHTML = await fetch('/users/fragment').then(r => r.text())
  usersPanel = walk(container)
}

function removeUsersPanel() {
  usersPanel?.destroy()
  usersPanel = null
  document.querySelector('#users-panel')?.replaceChildren()
}
```

不要对同一段 DOM 重复 `walk()`。每次替换 HTML 前先销毁旧实例，每次移除 HTML 前也先销毁实例，这样旧事件、`watch()`、`k-ref` 和动态列表里的 effects 都会被清理。

## 常见错误

不要对同一个容器重复 `walk()` 而不销毁旧实例。Kupola 会在同一个 root 被重复初始化时输出 warning，因为事件、effects、`watch()` 和 refs 可能会叠加：

```js
// 不推荐
walk(container)
walk(container)
```

推荐：

```js
currentInstance?.destroy()
currentInstance = walk(container)
```
