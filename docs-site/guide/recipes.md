# 场景 Recipes

这些示例用于固定 Kupola 的推荐使用方式：HTML 描述结构和绑定，JavaScript controller 负责复杂逻辑、副作用和清理。

## 搜索输入

输入框用 `k-model.debounce` 降低状态写入频率，副作用放到 `watch()`：

```html
<section k-data="usersSearch">
  <input k-model.trim.debounce.300="keyword" placeholder="搜索用户" />
  <p k-show="loading">搜索中...</p>

  <ul>
    <template k-for="user in users" :key="user.id">
      <li k-text="user.name"></li>
    </template>
  </ul>
</section>
```

```js
import { defineScope } from '@kupola/platform/directives'

defineScope('usersSearch', () => ({
  keyword: '',
  users: [],
  loading: false,
  mounted({ watch }) {
    watch(() => this.keyword, () => this.search())
  },
  async search() {
    if (!this.keyword) {
      this.users = []
      return
    }

    this.loading = true
    try {
      this.users = await api.searchUsers(this.keyword)
    } finally {
      this.loading = false
    }
  },
}))
```

## 表单提交

提交事件放在 `<form>`，用 `@submit.prevent` 保证点击按钮和按 Enter 走同一条路径：

```html
<form k-data="profileForm" @submit.prevent="save()">
  <input k-model.trim="name" name="name" />
  <input k-model.trim="email" name="email" />
  <button :disabled="saving || !name || !email">保存</button>
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
      await api.saveProfile({ name: this.name, email: this.email })
    } finally {
      this.saving = false
    }
  },
}))
```

## 列表更新

列表项有稳定 id 时始终写 `:key`。数组更新优先重新赋值，不依赖深层对象原地修改：

```html
<section k-data="todosPage">
  <input k-model.trim="newTodo" @keydown.enter="addTodo()" />
  <button @click="addTodo()">新增</button>

  <template k-for="todo in todos" :key="todo.id">
    <label k-class="{ done: todo.done }">
      <input
        type="checkbox"
        :checked="todo.done"
        @change="toggleTodo(todo.id, event.target.checked)"
      />
      <span k-text="todo.text"></span>
    </label>
  </template>
</section>
```

```js
defineScope('todosPage', () => ({
  todos: [],
  newTodo: '',
  addTodo() {
    if (!this.newTodo) { return }
    this.todos = [
      ...this.todos,
      { id: Date.now(), text: this.newTodo, done: false },
    ]
    this.newTodo = ''
  },
  toggleTodo(id, done) {
    this.todos = this.todos.map(todo => (
      todo.id === id ? { ...todo, done } : todo
    ))
  },
}))
```

## 动态片段

局部刷新、弹窗内容、后端片段替换时，先销毁旧实例，再替换 HTML，最后 `walk()` 新片段：

```js
import { walk } from '@kupola/platform/directives'

let panel

async function reloadPanel() {
  panel?.destroy()

  const root = document.querySelector('#users-panel')
  root.innerHTML = await fetch('/users/fragment').then(r => r.text())
  panel = walk(root)
}

function removePanel() {
  panel?.destroy()
  panel = null
  document.querySelector('#users-panel')?.replaceChildren()
}
```

同一段 DOM 不要重复 `walk()`。重复初始化会让事件、effects、`watch()` 和 refs 叠加。

如果初始化入口可能被重复调用，或者不方便保存实例引用，可以使用生命周期工具组：

```js
import { destroyWalk, walkOnce } from '@kupola/platform/directives'

async function reloadPanel() {
  const root = document.querySelector('#users-panel')
  destroyWalk(root)
  root.innerHTML = await fetch('/users/fragment').then(r => r.text())
  walkOnce(root)
}
```

后端模板项目可以参考 [后端模板集成](/guide/backend-template)，把整页增强、交互岛和动态片段分开管理。

## 条件与过渡

频繁切换且要保留 DOM 状态，用 `k-show`。只在条件满足时存在的 DOM，用 `k-if`。

```html
<section k-data="{ open: false }">
  <button @click="open = !open">切换</button>
  <div k-show="open" k-transition>
    面板内容
  </div>
</section>
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

`k-transition` 只提供 class 生命周期，不内置动画 CSS。它需要配合 `k-show` 或 `k-if` 使用。

## DOM 引用

稳定关键节点用 `k-ref`，临时查询用 `$` / `$$`：

```html
<section k-data="dialogForm">
  <input k-ref="firstInput" k-model.trim="name" />
  <button @click="submit()">提交</button>
</section>
```

```js
defineScope('dialogForm', () => ({
  name: '',
  mounted({ refs, $, on }) {
    refs.firstInput.focus()
    on('click', '[data-close]', () => this.close())
    this.submitButton = $('[type=submit]')
  },
  submit() {
    // ...
  },
}))
```

`ctx.on()` 返回清理函数，也会随当前 `walk()` 实例销毁。只有需要提前解绑时，才手动调用它。
