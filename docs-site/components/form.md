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
