# SchemaForm

`SchemaForm` 负责字段定义、原生 HTML 布局、数据绑定和统一校验。推荐的业务写法是：schema 描述字段和规则，HTML 自由安排布局，`k-field` 把原生控件绑定到 schema 字段。

## HTML + schema

```js
import { html, render } from '@kupola/platform'
import {
  email,
  schema,
  schemaSubmit,
  text,
} from '@kupola/components/schemaform'

const userSchema = schema({
  name: text('姓名').required(),
  email: email('邮箱').required(),
})

const form = html`
  <form class="user-form" novalidate onsubmit="${schemaSubmit(userSchema, data => {
    console.log(data)
  })}">
    <div class="form-row">
      <label>
        <span>姓名</span>
        <input k-field="name" autocomplete="name" />
      </label>
      <label>
        <span>邮箱</span>
        <input k-field="email" autocomplete="email" />
      </label>
    </div>
    <button type="submit">保存</button>
  </form>
`

render(form, document.querySelector('#app'))
```

`k-field` 会把 schema 字段的名称、初始值、校验规则和表单数据读取接到原生控件上。布局、字段分组、按钮和额外 HTML 仍由业务模板控制。

## 初始值与 API

```js
const userForm = userSchema.bind('#user-form', {
  values: { name: '张三', email: 'zhangsan@example.com' },
})

userForm.validate()
userForm.getData()
userForm.setData({ name: '李四' })
userForm.reset()
userForm.destroy()
```

| API | 用途 |
| --- | --- |
| `schema(definition)` | 创建可复用 schema |
| `schema.bind(target, options)` | 把 schema 绑定到已有 HTML form |
| `bindSchemaForm(target, schema, options)` | 以独立函数绑定 HTML form |
| `schemaSubmit(schema, callback)` | 创建原生 `submit` 处理器 |
| `createFormScope(schema, options)` | 管理动态挂载的 HTML 表单 |
| `SchemaForm(options)` | 直接生成标准 SchemaForm 组件 |
| `validateSchema(schema, data)` | 在提交前单独校验数据 |

## 字段类型

```js
import {
  checkbox,
  number,
  radio,
  select,
  textarea,
  text,
} from '@kupola/components/schemaform'

const schemaDefinition = schema({
  title: text('标题').maxlength(80),
  count: number('数量').min(1),
  category: select('分类', { 产品: 'product', 服务: 'service' }),
  labels: checkbox('标签', [
    { label: '重点', value: 'important' },
    { label: '跟进', value: 'follow-up' },
  ]),
  priority: radio('优先级', { 高: 'high', 普通: 'normal' }),
  note: textarea('备注'),
})
```

需要自定义字段时，可以使用 `registerFormField(type, renderer)` 注册 renderer。renderer 可以提供 `render()` 生成 HTML，也可以提供 `mount()`、`getValue()`、`setValue()` 和 `validate()` 接入已有控件。

## 选择方式

- 使用 `k-field` 时，HTML 负责结构，schema runtime 负责绑定和校验。
- 使用 `schemaSubmit()` 时，提交事件会自动阻止默认提交，并在校验通过后把 typed data 传给回调。
- 使用 `SchemaForm()` 时，由组件负责生成标准字段布局；需要复杂布局时优先使用 HTML + `k-field`。
- 自定义字段应使用 `data-kupola-ignore` 排除在原生 `Form` 收集之外，再通过 custom renderer 的 controller 提供值和校验。
