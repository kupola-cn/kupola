# useForm — 响应式表单状态管理

`useForm()` 是 Kupola 的响应式表单状态管理 Hook，基于 Signal 实现。它提供字段值、校验错误、脏状态追踪、提交处理等完整表单能力，所有状态变化自动驱动模板更新。

## 快速开始

```js
import { useForm } from '@kupola/platform'

const form = useForm(
  { name: '', age: 0 },
  (values) => {
    const errors = {}
    if (!values.name) errors.name = '姓名不能为空'
    if (values.age < 0) errors.age = '年龄不能为负数'
    return errors
  },
)

// 在模板中绑定
html`<input value="${form.values.value.name}"
           oninput="${(e) => form.setField('name', e.target.value)}" />
     <span>${form.errors.value.name || ''}</span>`

// 提交
const onSubmit = form.handleSubmit(async (values) => {
  await api.save(values)
})
// <form onsubmit="${onSubmit}">...</form>
```

## API 参考

### useForm(initialValues, validate?, options?)

创建响应式表单状态管理器。

```js
useForm(initialValues, validate?, options?)
```

| 参数 | 类型 | 说明 |
|------|------|------|
| `initialValues` | `Record<string, any>` | 表单初始值，必须是普通对象。 |
| `validate` | `(values) => Record<string, string> \| Promise<Record<string, string>>` | 校验函数，返回错误对象。空对象表示校验通过。 |
| `options.validateMode` | `'onChange' \| 'onBlur' \| 'onSubmit'` | 校验触发时机，默认 `'onChange'`。 |
| `options.resetOnSubmit` | `boolean` | 提交成功后是否重置表单，默认 `false`。 |

**返回值**：`FormState` 对象。

## FormState 属性

### values

`Signal<Record<string, any>>` — 当前表单值。

```js
console.log(form.values.value.name) // 'Alice'
```

### errors

`Signal<Record<string, string>>` — 当前校验错误。

```js
console.log(form.errors.value.name) // '姓名不能为空' 或 undefined
```

### touched

`Signal<Record<string, boolean>>` — 字段被触碰过的标记。

```js
console.log(form.touched.value.name) // true
```

### isDirty

`ReadonlySignal<boolean>` — 是否有字段被修改过（与初始值不同）。

```js
if (form.isDirty.value) {
  // 有未保存的更改
}
```

### isValid

`ReadonlySignal<boolean>` — 当前是否无校验错误。

```js
if (form.isValid.value) {
  // 可以提交
}
```

### isSubmitting

`Signal<boolean>` — 是否正在提交中。

```js
html`<button disabled="${form.isSubmitting.value}">提交</button>`
```

### submitCount

`Signal<number>` — 提交次数计数。

```js
console.log(form.submitCount.value) // 3
```

## FormState 方法

### setField(name, value)

设置单个字段值。如果 `validateMode` 为 `'onChange'`，会自动触发校验。

```js
form.setField('name', 'Alice')
form.setField('age', 25)
```

### setFields(patch)

批量设置多个字段值。

```js
form.setFields({ name: 'Bob', age: 30 })
```

如果 `validateMode` 为 `'onChange'` 或 `'onBlur'`，会自动触发校验。

### setTouched(name)

标记字段为已触碰。当 `validateMode` 为 `'onBlur'` 或 `'onChange'` 时触发校验。

```js
// 在 blur 事件中调用
form.setTouched('name')
```

### validate()

手动触发校验。

```js
const valid = await form.validate()
if (!valid) {
  console.log('表单有错误:', form.errors.value)
}
```

**返回值**：`boolean | Promise<boolean>`，校验是否通过。同步校验返回 `boolean`，异步校验返回 `Promise<boolean>`。

### reset(nextInitial?)

重置表单到初始值（或提供新的初始值）。

```js
// 重置到原始初始值
form.reset()

// 重置到新值，并更新快照
form.reset({ name: '', age: 0, role: 'member' })
```

重置会清除 `errors`、`touched`、`dirtyFields` 和 `isSubmitting`。

### handleSubmit(handler)

创建表单提交处理器。自动阻止默认行为、校验、设置 `isSubmitting` 状态。

```js
const onSubmit = form.handleSubmit(async (values) => {
  await api.save(values)
  // 如果 resetOnSubmit: true，提交成功后自动重置
})

// 绑定到表单
html`<form onsubmit="${onSubmit}">...</form>`
```

**参数**：
- `handler` — `(values) => void | Promise<void>`，接收当前表单值。

**返回值**：`(event?: Event) => Promise<boolean>`，提交成功返回 `true`。

## 校验模式

### onChange（默认）

每次 `setField()` 或 `setFields()` 后自动校验。

```js
const form = useForm(
  { email: '' },
  (values) => {
    const errors = {}
    if (!/^[^\s@]+@[^\s@]+$/.test(values.email)) {
      errors.email = '请输入有效的邮箱地址'
    }
    return errors
  },
  { validateMode: 'onChange' },
)

// 每次输入都会实时校验
form.setField('email', 'a')        // errors.email = '请输入有效的邮箱地址'
form.setField('email', 'a@b.com')  // errors.email 被清除
```

### onBlur

字段被标记为 `touched` 后才校验。

```js
const form = useForm(
  { email: '' },
  validate,
  { validateMode: 'onBlur' },
)

// 输入时不校验
form.setField('email', 'a')

// blur 时标记 touched，触发校验
form.setTouched('email')
// errors.email = '请输入有效的邮箱地址'
```

### onSubmit

只在调用 `handleSubmit()` 时触发校验。

```js
const form = useForm(
  { email: '' },
  validate,
  { validateMode: 'onSubmit' },
)

// 输入过程中不校验
form.setField('email', 'a') // 无错误提示

// 点击提交时才校验
const submit = form.handleSubmit(async (values) => {
  await api.save(values)
})
```

## 异步校验

`validate` 函数可以返回 Promise，支持异步校验场景（如检查用户名是否已存在）。

```js
const form = useForm(
  { username: '' },
  async (values) => {
    const errors = {}
    if (!values.username) {
      errors.username = '用户名不能为空'
    } else {
      const exists = await api.checkUsername(values.username)
      if (exists) {
        errors.username = '用户名已存在'
      }
    }
    return errors
  },
)
```

### 竞态保护

异步校验内置竞态保护：每次校验调用会递增版本号，当异步校验结果返回时，只有版本号匹配的最新结果才会被应用。这避免了慢速请求覆盖快速请求的结果。

```js
// 快速输入时，只有最后一次校验结果会生效
form.setField('username', 'a')  // 发起校验 v1
form.setField('username', 'ab') // 发起校验 v2
form.setField('username', 'abc') // 发起校验 v3
// v1 和 v2 的结果到达时，版本号已过期，会被忽略
// 只有 v3 的结果会被应用
```

## 完整示例

### 登录表单

```js
import { useForm } from '@kupola/platform'
import { html, defineComponent } from '@kupola/platform'
import { signal } from '@kupola/core'

const LoginForm = defineComponent({
  setup() {
    const serverError = signal('')

    const form = useForm(
      { username: '', password: '' },
      (values) => {
        const errors = {}
        if (!values.username) errors.username = '请输入用户名'
        if (!values.password) errors.password = '请输入密码'
        else if (values.password.length < 6) errors.password = '密码至少 6 位'
        return errors
      },
      { validateMode: 'onBlur' },
    )

    const onSubmit = form.handleSubmit(async (values) => {
      serverError.value = ''
      try {
        await api.login(values.username, values.password)
        router.push('/dashboard')
      } catch (err) {
        serverError.value = err.message
      }
    })

    return () => html`
      <form class="login-form" onsubmit="${onSubmit}">
        <h2>登录</h2>

        ${serverError.value ? html`<div class="error-banner">${serverError}</div>` : null}

        <label>
          <span>用户名</span>
          <input
            type="text"
            value="${form.values.value.username}"
            oninput="${(e) => form.setField('username', e.target.value)}"
            onblur="${() => form.setTouched('username')}"
          />
          ${form.errors.value.username
            ? html`<span class="error">${form.errors.value.username}</span>`
            : null}
        </label>

        <label>
          <span>密码</span>
          <input
            type="password"
            value="${form.values.value.password}"
            oninput="${(e) => form.setField('password', e.target.value)}"
            onblur="${() => form.setTouched('password')}"
          />
          ${form.errors.value.password
            ? html`<span class="error">${form.errors.value.password}</span>`
            : null}
        </label>

        <button
          type="submit"
          disabled="${form.isSubmitting.value || !form.isValid.value}"
        >
          ${form.isSubmitting.value ? '登录中...' : '登录'}
        </button>

        <p class="meta">
          提交次数: ${form.submitCount}
          ${form.isDirty.value ? '（有未保存的修改）' : ''}
        </p>
      </form>
    `
  },
})
```

### 编辑表单（带重置）

```js
const form = useForm(
  { title: '', content: '' },
  (values) => {
    const errors = {}
    if (!values.title) errors.title = '标题不能为空'
    return errors
  },
  { resetOnSubmit: true },
)

// 编辑前加载数据
async function loadArticle(id) {
  const article = await api.getArticle(id)
  // 重置表单并更新快照
  form.reset({ title: article.title, content: article.content })
}

const onSubmit = form.handleSubmit(async (values) => {
  await api.saveArticle(values)
  // resetOnSubmit: true，提交成功后自动重置
})
```

## 与 k-model 的区别

`k-model` 是 DOM 指令层的双向绑定，适用于简单的表单控件同步。`useForm()` 是 JS 层的状态管理，提供完整的校验、脏追踪、提交处理等能力。

| 场景 | 推荐 |
|------|------|
| 简单搜索框、开关 | `k-model` |
| 有校验要求的表单 | `useForm()` |
| 多步骤表单 | `useForm()` |
| 需要提交状态管理 | `useForm()` |