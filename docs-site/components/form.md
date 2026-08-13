# Form 表单

Kupola 的 `Form` 不是配置字段列表的表单生成器，而是对原生表单的轻量增强：读取数据、统一验证、提交拦截和错误管理。

## 基础用法

```js
import { Form } from '@kupola/components/form'

const form = Form({
  element: document.querySelector('#userForm'),
  onSubmit: (data) => console.log(data),
})

form.setData({ username: 'admin' })
```

## 配置项

| 选项 | 类型 | 说明 |
| --- | --- | --- |
| element | `HTMLFormElement` | 必填，表单元素 |
| onSubmit | `Function` | 验证通过后的提交回调 |
| onValidate | `Function` | 验证结果回调 |

## 方法

- `validate()` - 验证整个表单
- `validateField(field)` - 验证单个字段
- `getData()` - 读取表单数据
- `setData(data)` - 写入表单数据
- `reset()` - 重置表单并清除错误
- `addValidator(name, fn, message)` - 添加自定义校验
- `destroy()` - 解绑事件

## 验证方式

字段通过 `data-required`、`data-email`、`data-minlength` 等属性启用内置规则，也支持 `data-message-*` 覆盖错误文案。

---

## 内置验证属性

Kupola Form 通过 HTML `data-*` 属性声明验证规则，无需编写 JavaScript 验证逻辑。

### data-required — 必填

```html
<form id="loginForm">
  <input name="username" data-required />
  <input name="password" type="password" data-required />
</form>
```

```js
import { Form } from '@kupola/components/form'

const form = Form({
  element: document.querySelector('#loginForm'),
  onSubmit: (data) => console.log('登录:', data),
})

// 提交时自动校验，空字段会显示错误
```

### data-email — 邮箱格式

```html
<form id="registerForm">
  <input name="email" data-email />
  <input name="workEmail" data-email data-required />
</form>
```

### data-minlength / data-maxlength — 长度限制

```html
<form id="profileForm">
  <input name="username" data-required data-minlength="3" data-maxlength="20" />
  <textarea name="bio" data-maxlength="200"></textarea>
</form>
```

### data-pattern — 正则校验

```html
<form id="phoneForm">
  <input
    name="phone"
    data-required
    data-pattern="^1[3-9]\d{9}$"
    data-message-pattern="请输入有效的手机号码"
  />
  <input
    name="zipCode"
    data-pattern="^\d{6}$"
    data-message-pattern="请输入6位邮政编码"
  />
</form>
```

### data-min / data-max — 数值范围

```html
<form id="ageForm">
  <input name="age" type="number" data-min="0" data-max="150" data-message-min="年龄不能小于0" data-message-max="年龄不能大于150" />
  <input name="score" type="number" data-min="0" data-max="100" />
</form>
```

---

## 自定义错误消息

通过 `data-message-*` 属性覆盖内置规则的默认错误文案。

```html
<form id="customMessageForm">
  <!-- 必填 -->
  <input
    name="username"
    data-required
    data-message-required="请输入用户名"
  />

  <!-- 邮箱 -->
  <input
    name="email"
    data-email
    data-message-email="邮箱格式不正确"
  />

  <!-- 长度 -->
  <input
    name="password"
    data-required
    data-minlength="6"
    data-maxlength="20"
    data-message-required="请输入密码"
    data-message-minlength="密码至少需要6个字符"
    data-message-maxlength="密码不能超过20个字符"
  />

  <!-- 正则 -->
  <input
    name="code"
    data-pattern="^[A-Z0-9]{6}$"
    data-message-pattern="验证码为6位大写字母或数字"
  />
</form>
```

---

## 自定义验证 — data-validate

通过 `data-validate` 属性指定自定义验证函数名称，再通过 `addValidator()` 注册。

```html
<form id="customForm">
  <input name="username" data-required data-validate="checkUsername" />
  <input name="password" type="password" data-required data-validate="checkPassword" />
  <input name="confirmPassword" type="password" data-required data-validate="matchPassword" />
</form>
```

```js
import { Form } from '@kupola/components/form'

const form = Form({
  element: document.querySelector('#customForm'),
  onSubmit: (data) => {
    console.log('注册成功:', data)
  },
})

// 注册自定义校验器
form.addValidator('checkUsername', (value) => {
  if (value.length < 3) return '用户名至少需要3个字符'
  if (!/^[a-zA-Z\u4e00-\u9fa5]/.test(value)) return '用户名必须以字母或中文开头'
  return null  // 返回 null 表示通过
}, '用户名格式不正确')

form.addValidator('checkPassword', (value) => {
  if (value.length < 8) return '密码至少需要8个字符'
  if (!/[A-Za-z]/.test(value)) return '密码必须包含字母'
  if (!/[0-9]/.test(value)) return '密码必须包含数字'
  return null
})

form.addValidator('matchPassword', (value, formData) => {
  if (value !== formData.password) return '两次密码输入不一致'
  return null
})
```

---

## 表单提交

表单提交时，Kupola 会拦截原生 `submit` 事件，先执行验证，验证通过后才调用 `onSubmit` 回调。

```js
import { Form } from '@kupola/components/form'

const form = Form({
  element: document.querySelector('#userForm'),
  onSubmit: async (data) => {
    // 显示加载状态
    const submitBtn = document.querySelector('#submitBtn')
    submitBtn.disabled = true
    submitBtn.textContent = '提交中...'

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('提交失败')
      }

      const result = await response.json()
      console.log('提交成功:', result)
      form.reset() // 提交成功后重置表单
    } catch (error) {
      console.error('提交出错:', error)
      alert('提交失败，请稍后重试')
    } finally {
      submitBtn.disabled = false
      submitBtn.textContent = '提交'
    }
  },
  onValidate: (errors) => {
    // 验证结果回调
    if (Object.keys(errors).length > 0) {
      console.log('验证失败:', errors)
    }
  },
})
```

### 编程式提交

```js
// 触发原生提交（会走验证流程）
document.querySelector('#userForm').requestSubmit()

// 或者直接调用 validate 后手动提交
const errors = form.validate()
if (Object.keys(errors).length === 0) {
  const data = form.getData()
  // 手动处理数据
  console.log('表单数据:', data)
}
```

---

## 表单重置

```js
const form = Form({
  element: document.querySelector('#userForm'),
  onSubmit: (data) => console.log(data),
})

// 设置初始数据
form.setData({ username: 'admin', email: 'admin@example.com' })

// 重置表单：清空所有字段值并清除错误提示
form.reset()

// HTML 中也可以通过 reset 按钮触发
// <button type="reset">重置</button>
```

---

## 表单数据读写

```js
const form = Form({
  element: document.querySelector('#userForm'),
})

// 读取表单数据（返回所有已命名字段的值）
const data = form.getData()
// { username: 'admin', email: 'admin@example.com', age: '25' }

// 写入表单数据（批量设置字段值）
form.setData({
  username: 'newAdmin',
  email: 'new@example.com',
  age: 30,
})

// 验证单个字段
const error = form.validateField('email')
if (error) {
  console.log('邮箱验证失败:', error)
}
```

---

## 表单布局

通过 HTML 结构和 CSS 控制表单布局，Kupola Form 不强制布局方式。

### 垂直布局（默认）

```html
<form id="verticalForm" style="max-width: 400px;">
  <div class="form-field">
    <label for="name">姓名</label>
    <input id="name" name="name" data-required style="width: 100%;" />
  </div>
  <div class="form-field">
    <label for="email">邮箱</label>
    <input id="email" name="email" type="email" data-required style="width: 100%;" />
  </div>
  <button type="submit">提交</button>
</form>
```

### 水平布局

```html
<form id="horizontalForm">
  <div class="form-field" style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
    <label for="name" style="width: 80px; text-align: right;">姓名</label>
    <input id="name" name="name" data-required style="flex: 1;" />
  </div>
  <div class="form-field" style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
    <label for="email" style="width: 80px; text-align: right;">邮箱</label>
    <input id="email" name="email" type="email" data-required style="flex: 1;" />
  </div>
  <div style="padding-left: 92px;">
    <button type="submit">提交</button>
  </div>
</form>
```

### 内联表单

```html
<form id="inlineForm" style="display: flex; align-items: flex-end; gap: 16px;">
  <div class="form-field">
    <label for="search">搜索</label>
    <input id="search" name="keyword" placeholder="请输入关键词" />
  </div>
  <div class="form-field">
    <label for="category">分类</label>
    <select id="category" name="category">
      <option value="">全部</option>
      <option value="tech">技术</option>
      <option value="design">设计</option>
    </select>
  </div>
  <button type="submit">搜索</button>
  <button type="reset">重置</button>
</form>
```

---

## 错误管理

Kupola Form 自动管理错误显示状态，验证失败时会在对应字段后插入错误消息。

```html
<form id="errorForm">
  <input name="username" data-required data-message-required="用户名不能为空" />
  <input name="email" data-email data-message-email="邮箱格式不正确" />
</form>
```

```js
import { Form } from '@kupola/components/form'

const form = Form({
  element: document.querySelector('#errorForm'),
  onValidate: (errors) => {
    // errors 格式: { fieldName: 'error message' }
    if (Object.keys(errors).length > 0) {
      console.log('验证失败, 错误详情:', errors)
      // 可以在这里做自定义错误处理，如 Toast 提示
    }
  },
})

// 手动清除某个字段的错误
form.clearError('username')

// 清除所有错误
form.clearErrors()
```

---

## 完整示例：登录表单

以下是一个集成了多种验证规则的登录表单完整示例：

```html
<!-- HTML 模板 -->
<form id="loginForm" style="max-width: 400px; margin: 0 auto;">
  <h2>用户登录</h2>

  <!-- 用户名 -->
  <div class="form-field" style="margin-bottom: 16px;">
    <label for="username">用户名</label>
    <input
      id="username"
      name="username"
      type="text"
      placeholder="请输入用户名或邮箱"
      style="width: 100%; padding: 8px; margin-top: 4px;"
      data-required
      data-minlength="3"
      data-maxlength="50"
      data-validate="checkUsername"
      data-message-required="请输入用户名"
      data-message-minlength="用户名至少需要3个字符"
    />
  </div>

  <!-- 密码 -->
  <div class="form-field" style="margin-bottom: 16px;">
    <label for="password">密码</label>
    <input
      id="password"
      name="password"
      type="password"
      placeholder="请输入密码"
      style="width: 100%; padding: 8px; margin-top: 4px;"
      data-required
      data-minlength="6"
      data-validate="checkPassword"
      data-message-required="请输入密码"
      data-message-minlength="密码至少需要6个字符"
    />
  </div>

  <!-- 验证码 -->
  <div class="form-field" style="margin-bottom: 16px;">
    <label for="captcha">验证码</label>
    <div style="display: flex; gap: 8px; margin-top: 4px;">
      <input
        id="captcha"
        name="captcha"
        type="text"
        placeholder="请输入验证码"
        style="flex: 1; padding: 8px;"
        data-required
        data-pattern="^[A-Za-z0-9]{4}$"
        data-message-required="请输入验证码"
        data-message-pattern="验证码为4位字母或数字"
      />
      <button type="button" id="captchaBtn" style="white-space: nowrap;">获取验证码</button>
    </div>
  </div>

  <!-- 记住我 -->
  <div class="form-field" style="margin-bottom: 16px;">
    <label style="display: flex; align-items: center; gap: 4px; cursor: pointer;">
      <input name="remember" type="checkbox" value="true" />
      记住我
    </label>
  </div>

  <!-- 提交按钮 -->
  <button
    type="submit"
    id="submitBtn"
    style="width: 100%; padding: 10px; background: #1890ff; color: white; border: none; border-radius: 4px; cursor: pointer;"
  >
    登录
  </button>

  <!-- 其他操作 -->
  <div style="margin-top: 16px; text-align: center;">
    <a href="/forgot-password">忘记密码？</a>
    <span style="margin: 0 8px;">|</span>
    <a href="/register">注册账号</a>
  </div>
</form>
```

```js
import { Form } from '@kupola/components/form'

const form = Form({
  element: document.querySelector('#loginForm'),
  onSubmit: async (data) => {
    const submitBtn = document.querySelector('#submitBtn')
    submitBtn.disabled = true
    submitBtn.textContent = '登录中...'

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: data.username,
          password: data.password,
          captcha: data.captcha,
          remember: data.remember === 'true',
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || '登录失败')
      }

      const result = await response.json()
      console.log('登录成功:', result)
      // 跳转到首页
      window.location.href = '/dashboard'
    } catch (error) {
      console.error('登录错误:', error)
      alert(error.message || '登录失败，请检查用户名和密码')
    } finally {
      submitBtn.disabled = false
      submitBtn.textContent = '登录'
    }
  },
  onValidate: (errors) => {
    const errorCount = Object.keys(errors).length
    if (errorCount > 0) {
      console.log(`验证失败，共 ${errorCount} 个错误:`, errors)
    }
  },
})

// 注册自定义校验器
form.addValidator('checkUsername', (value) => {
  // 可以是用户名或邮箱
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  const isUsername = /^[a-zA-Z0-9_]{3,50}$/.test(value)
  if (!isEmail && !isUsername) {
    return '请输入有效的用户名或邮箱地址'
  }
  return null
})

form.addValidator('checkPassword', (value) => {
  if (value.length < 6) return '密码至少需要6个字符'
  if (value.length > 20) return '密码不能超过20个字符'
  return null
})

// 验证码按钮逻辑
let captchaTimer = null
document.getElementById('captchaBtn').addEventListener('click', async () => {
  const btn = document.getElementById('captchaBtn')
  btn.disabled = true

  // 模拟发送验证码
  await fetch('/api/auth/captcha', { method: 'POST' })

  let countdown = 60
  btn.textContent = `${countdown}s 后重发`
  captchaTimer = setInterval(() => {
    countdown--
    if (countdown <= 0) {
      clearInterval(captchaTimer)
      btn.disabled = false
      btn.textContent = '获取验证码'
    } else {
      btn.textContent = `${countdown}s 后重发`
    }
  }, 1000)
})
```

---

## 验证属性速查表

| 属性 | 说明 | 适用字段 |
| --- | --- | --- |
| `data-required` | 必填校验 | 所有 |
| `data-email` | 邮箱格式校验 | `input[type="text"]` |
| `data-minlength="N"` | 最小长度 N | `input`, `textarea` |
| `data-maxlength="N"` | 最大长度 N | `input`, `textarea` |
| `data-pattern="regex"` | 正则校验 | `input[type="text"]` |
| `data-min="N"` | 最小值 N | `input[type="number"]` |
| `data-max="N"` | 最大值 N | `input[type="number"]` |
| `data-validate="name"` | 自定义校验函数名 | 所有 |

## 错误消息属性速查表

| 属性 | 对应规则 |
| --- | --- |
| `data-message-required` | `data-required` |
| `data-message-email` | `data-email` |
| `data-message-minlength` | `data-minlength` |
| `data-message-maxlength` | `data-maxlength` |
| `data-message-pattern` | `data-pattern` |
| `data-message-min` | `data-min` |
| `data-message-max` | `data-max` |

---

## 说明

- Kupola Form 不生成 HTML，而是增强已有的原生 `<form>` 元素，你拥有完全的 HTML 控制权。
- 验证规则通过 HTML 属性声明，保持关注点分离，逻辑与模板解耦。
- `addValidator()` 注册的校验函数接收 `(value, formData)` 两个参数，`formData` 为当前表单所有字段的值。
- `reset()` 会将表单恢复到初始状态（首次调用 `Form()` 时的数据），而非清空。
- 表单提交时，`disabled` 的字段不会被包含在 `getData()` 的结果中。
- 错误消息默认插入到对应字段的父元素末尾，可通过 CSS 自定义 `.form-error` 样式。