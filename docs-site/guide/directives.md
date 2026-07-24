# 指令系统

Kupola 提供声明式指令操作 DOM。

## k-data

定义响应式数据作用域：

```html
<div k-data="{ count: 0, name: 'Alice' }">
  <!-- 子元素可访问 count 和 name -->
</div>
```

## k-text

绑定文本内容：

```html
<p k-text="'Hello, ' + name"></p>
```

## k-html

绑定 HTML 内容。`k-html` 会直接写入 `innerHTML`，只应使用受信任或已消毒的内容：

```html
<div k-html="rawHtml"></div>
```

普通用户输入、评论、URL 参数或未经审查的接口返回值应使用 `k-text`。更完整的规则见 [安全边界](/guide/security)。

## k-bind

绑定属性：

```html
<input :value="name" :disabled="isLoading" />
<img :src="imageUrl" />
<button k-bind="{ disabled: isLoading, title: label }">保存</button>
```

`k-bind` 不带参数时接收对象，会按键名批量绑定属性。

## k-on

绑定事件：

```html
<button @click="handleClick">Click</button>
<form @submit.prevent="save()">...</form>
<input @keydown.enter="submit()" />
<button @click.outside="close()">...</button>
<input @input.debounce.300="search()" />
```

事件表达式可以直接使用 `event` 或 `$event`。常用修饰符：

- 流程：`.stop` `.prevent` `.once` `.self`
- 键盘：`.enter` `.escape` `.esc` `.space` `.tab` `.up` `.down` `.left` `.right`，以及 `.k` `.s` 这样的单字母按键
- 组合键：`.ctrl` `.shift` `.alt` `.meta`
- 监听选项：`.capture` `.passive`
- 行为：`.outside` `.debounce`，可写成 `.debounce.300`

`.once` 会在其他过滤条件通过后才生效，例如 `@keydown.enter.once` 不会被 Escape 按键消耗，`@click.outside.once` 不会被元素内部点击消耗。

```html
<input @keydown.ctrl.k="openSearch()" />
<section @click.capture="trackClick()">...</section>
```

`.passive` 表示处理器不会取消默认行为，因此与 `.prevent` 同时使用时 `.prevent` 不生效。
未知修饰符、非键盘事件上的按键修饰符，以及 `.passive.prevent` 会输出稳定 code 的诊断警告，但不会中断页面初始化。

## k-init

当前作用域创建后执行一次初始化语句。简单页面可以用 `k-init`，复杂页面优先使用 `defineScope()` 的 `mounted(ctx)`。

```html
<section k-data="{ users: [], load() { this.users = ['Alice'] } }" k-init="load()">
  <p k-text="'共 ' + users.length + ' 条'"></p>
</section>
```

## k-cloak

防止初始化前闪烁。配合一条全局 CSS 使用，`walk()` 处理到元素后会移除 `k-cloak`。

```css
[k-cloak] {
  display: none !important;
}
```

```html
<section k-data="usersPage" k-cloak>
  ...
</section>
```

## k-model

双向绑定：

```html
<input k-model="username" />
<select k-model="selected">
  <option value="a">A</option>
  <option value="b">B</option>
</select>
<input type="checkbox" k-model="agree" />
<input type="radio" value="admin" k-model="role" />
<select multiple k-model="tags">...</select>
```

支持修饰符：

```html
<input k-model.trim="name" />
<input k-model.number="age" />
<input k-model.lazy="keyword" />
<input k-model.debounce.300="keyword" />
<select k-model.boolean="enabled">
  <option value="true">是</option>
  <option value="false">否</option>
</select>
```

`.boolean` 会把表单值 `"true"` / `"false"` 转换为布尔值，适用于 radio 和 select。文本输入会在中文等 IME 组合输入结束后再写入状态，不会把未确认的拼写中间值提前暴露给 effect。
`.boolean` 只转换明确的 `"true"` 和 `"false"`；`"0"`、`"no"` 等其他值保持原样，避免静默转换成错误的布尔值。`.number.boolean` 属于冲突组合，会输出诊断警告。

`k-model` 只接受安全的顶层 scope 属性名，例如 `k-model="username"`；不支持 `user.name`、数组下标、`__proto__`、`constructor` 或 `prototype`。`<input type="file">` 和 `contenteditable` 也不支持 `k-model`。文件选择由浏览器拥有，业务代码应通过 `change` 事件读取 `event.target.files`；富文本需要专门的编辑器和清洗策略。表单 reset、异步提交、可访问性与输入法边界见 [表单状态策略](/guide/form-state)。

## k-key

给 `k-for` 提供稳定的行标识，让排序、插入和删除时可以复用正确的 DOM 和事件绑定。也支持 `:key`。

```html
<li k-for="user in users" k-key="user.id" k-text="user.name"></li>
```

`k-key` 只能用在带 `k-for` 的同一元素上。优先使用业务稳定 id，不要使用会随排序变化的下标。`k-key`、`:key`、`k-bind:key` 同时出现会触发 `W021`；优先级固定为 `k-key > :key > k-bind:key`，应只保留一个写法。

## k-ref

收集当前作用域内的元素引用。引用可以在 `defineScope()` 的 `mounted(ctx)` 中通过 `ctx.refs` 访问，也会出现在 `walk()` 返回值的 `refs` 上。

```html
<section k-data="usersPage">
  <input k-ref="keyword" k-model="keyword" />
</section>
```

```js
import { defineScope, walk } from '@kupola/kupola'

defineScope('usersPage', () => ({
  keyword: '',
  mounted({ refs }) {
    refs.keyword.focus()
  },
}))

walk(document.body)
```

同名 `k-ref` 出现多次时，引用值会变成数组。

## k-show

条件显示：

```html
<div k-show="isVisible" k-transition>可见内容</div>
```

配合 `k-transition` 时，隐藏会等离场 class 生命周期结束后再设置 `display:none`。

## k-if

条件挂载。条件为假时元素会从 DOM 中移除；条件重新为真时会重新创建并绑定指令。

```html
<section k-data="{ canEdit: false }">
  <button @click="canEdit = !canEdit">切换</button>
  <form k-if="canEdit">
    ...
  </form>
</section>
```

`k-if` 适合权限区块、昂贵 DOM、只在特定状态下存在的表单。频繁显示/隐藏但需要保留 DOM 状态时，优先使用 `k-show`。

配合 `k-transition` 时，条件为假后会先清理该分支的事件和 effects，再等待离场动画结束后移除 DOM。

支持紧邻的 `k-else-if` 和 `k-else`：

```html
<p k-if="status === 'loading'">加载中</p>
<p k-else-if="status === 'error'">加载失败</p>
<p k-else>加载完成</p>
```

如果条件块里还要创建独立作用域，推荐把 `k-if` 放在外层，把 `k-data` 放在内层，结构更清晰：

```html
<div k-if="open">
  <section k-data="dialogPage">
    ...
  </section>
</div>
```

## k-class

动态 class 绑定，支持字符串、数组和对象。

```html
<button
  class="btn"
  k-class="{ 'is-active': active, 'is-disabled': disabled }"
>
  保存
</button>
```

```html
<div k-class="['panel', { 'is-open': open }, statusClass]"></div>
```

对象键可以包含多个 class，Kupola 会按空白拆分：

```html
<div k-class="{ 'is-active is-highlighted': active }"></div>
```

需要“追加/移除条件 class”时优先使用 `k-class`；需要完整替换 `class` 属性时再使用 `:class`。

## k-transition

给 `k-show` 和 `k-if` 添加 CSS class 生命周期。默认前缀是 `kp`：

```html
<div k-show="open" k-transition>...</div>
<div k-if="open" k-transition="fade">...</div>
```

默认 class：

```css
.kp-enter-active,
.kp-leave-active {
  transition: opacity 150ms ease;
}

.kp-enter-from,
.kp-leave-to {
  opacity: 0;
}

.kp-enter-to,
.kp-leave-from {
  opacity: 1;
}
```

如果写 `k-transition="fade"`，class 前缀会变成 `.fade-enter-from`、`.fade-leave-to` 等。

## k-style

动态 style 绑定，支持对象和字符串。常规场景推荐对象写法：

```html
<div k-style="{ color: active ? 'red' : null, backgroundColor: bg }"></div>
```

对象键支持 camelCase，也会转换为 CSS 属性名。值为 `null`、`undefined` 或 `false` 时会移除对应样式。

## k-for

列表渲染。推荐放在 `<template>` 上，模板内可以访问当前项和索引：

```html
<ul k-data="{ users: [{ id: 1, name: 'Alice' }] }">
  <template k-for="(user, index) in users" :key="user.id">
    <li>
      <span k-text="index + 1"></span>
      <span k-text="user.name"></span>
    </li>
  </template>
</ul>
```

带 `:key` 时，Kupola 会按 key 复用并移动已有 DOM，保留行内输入状态，同时更新行内绑定。没有 key 时会在依赖变化后重新渲染列表片段，并清理旧片段中的事件、effects 和 `k-ref`。

`:key` 必须在同一次渲染中唯一。重复 key 会触发 warning，因为它可能让列表行复用到错误的 DOM 状态。出现 warning 时，应改用数据库 id、稳定业务 id，或由业务层生成稳定唯一 key。

更新数组时优先重新赋值：

```html
<button @click="users = [...users, { id: Date.now(), name: 'New' }]">新增</button>
```

大列表优先使用 `VirtualList` 或业务层分页。普通业务列表如果需要保留行内输入、焦点或临时 DOM 状态，应提供稳定 `:key`。

列表行只能依赖同次渲染内唯一且稳定的 key。对象引用和 `Symbol` 可以作为内存中的 key，但不能跨服务端渲染、序列化或重新创建的对象保持身份；对象枚举时第二个变量是对象属性名。完整规则见 [指令能力矩阵](/guide/directive-matrix)。

## 表达式报错

模板表达式执行失败时，Kupola 会在错误中附带指令名、元素描述、表达式和原始错误。比如 `k-text="user.name"` 中 `user` 为 `null`，报错会指向对应的 `k-text` 元素，便于定位模板问题。

需要表达式的指令如果写成空值，会输出 warning 并跳过该指令：

```html
<button @click="">保存</button>
<p k-text=""></p>
<input k-model="" />
<div :title=""></div>
```

`k-cloak` 和 `k-transition` 这类不要求表达式的指令不会因为空值报警。`k-on` 必须提供事件名，例如使用 `@click="save()"` 或 `k-on:click="save()"`。

所有运行时 warning / error 都带稳定 code，完整列表见 [诊断信息](/guide/diagnostics)。

## 初始化

```js
import { walk } from '@kupola/kupola'
walk(document.body) // 扫描并初始化所有 k-data
```
