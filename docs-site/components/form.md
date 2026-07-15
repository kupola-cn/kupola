# Form 表单

## 基础用法

```js
import { Form } from '@kupola/kupola/components/form'

const form = new Form({
  el: '#app',
  fields: [
    { name: 'username', label: '用户名', type: 'text', required: true },
    { name: 'email', label: '邮箱', type: 'email', required: true },
    { name: 'password', label: '密码', type: 'password', required: true },
  ],
  onSubmit: (data) => console.log(data),
})
```

## 配置项

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| el | string \| Element | - | 挂载元素 |
| fields | array | - | 字段配置 |
| onSubmit | function | - | 提交回调 |
| validateOnBlur | boolean | true | 失焦时验证 |
| validateOnChange | boolean | false | 变化时验证 |

## 字段配置

```js
{
  name: 'username',        // 字段名
  label: '用户名',         // 标签
  type: 'text',            // 类型: text/email/password/number/textarea/select/checkbox/radio
  required: true,          // 必填
  placeholder: '请输入',   // 占位符
  rules: [                 // 验证规则
    { type: 'minLength', value: 3, message: '至少3个字符' },
    { type: 'pattern', value: /^[a-z]+$/, message: '只能包含小写字母' },
  ],
}
```

## 方法

- `form.validate()` - 验证表单，返回 Promise
- `form.getValues()` - 获取表单数据
- `form.setValues(data)` - 设置表单数据
- `form.reset()` - 重置表单
- `form.clearValidation()` - 清除验证状态

## 示例

### 带验证的表单

```js
const form = new Form({
  el: '#app',
  fields: [
    {
      name: 'email',
      label: '邮箱',
      type: 'email',
      required: true,
      rules: [
        { type: 'email', message: '请输入有效的邮箱地址' },
      ],
    },
    {
      name: 'password',
      label: '密码',
      type: 'password',
      required: true,
      rules: [
        { type: 'minLength', value: 8, message: '密码至少8位' },
      ],
    },
  ],
  onSubmit: async (data) => {
    await submitForm(data)
  },
})
```

### 手动验证

```js
try {
  const data = await form.validate()
  console.log('验证通过', data)
} catch (errors) {
  console.log('验证失败', errors)
}
```
