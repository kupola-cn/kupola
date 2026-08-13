# SchemaForm 表单

`SchemaForm` 是 Kupola 的声明式表单解决方案，通过 JSON Schema 定义表单结构，自动生成表单 UI，支持字段注册、自定义渲染器、校验和提交。

## 基础用法

```js
import { createFormScope, bindSchemaForm } from '@kupola/components/schema-form'

// 1. 创建表单作用域
const scope = createFormScope()

// 2. 定义 Schema
const schema = {
  fields: [
    { name: 'username', type: 'text', label: '用户名', required: true },
    { name: 'email', type: 'email', label: '邮箱', required: true },
    { name: 'age', type: 'number', label: '年龄' },
  ],
}

// 3. 绑定 Schema 到表单
const form = bindSchemaForm(scope, schema)

// 4. 挂载到页面
document.getElementById('formRoot').appendChild(form.element)
```

---

## 字段类型

SchemaForm 支持以下内置字段类型，每种类型都有对应的默认渲染器和校验规则。

### text — 文本输入

```js
const schema = {
  fields: [
    { name: 'username', type: 'text', label: '用户名', required: true, placeholder: '请输入用户名' },
    { name: 'nickname', type: 'text', label: '昵称', maxlength: 20 },
  ],
}
```

### number — 数字输入

```js
const schema = {
  fields: [
    {
      name: 'age',
      type: 'number',
      label: '年龄',
      min: 0,
      max: 150,
      step: 1,
      placeholder: '请输入年龄',
    },
    {
      name: 'score',
      type: 'number',
      label: '分数',
      min: 0,
      max: 100,
      step: 0.5,
    },
  ],
}
```

### email — 邮箱输入

```js
const schema = {
  fields: [
    { name: 'email', type: 'email', label: '邮箱', required: true, placeholder: '请输入邮箱地址' },
  ],
}
```

### password — 密码输入

```js
const schema = {
  fields: [
    {
      name: 'password',
      type: 'password',
      label: '密码',
      required: true,
      minlength: 8,
      placeholder: '请输入密码',
    },
    {
      name: 'confirmPassword',
      type: 'password',
      label: '确认密码',
      required: true,
      // 自定义校验
      validate: (value, formData) => {
        if (value !== formData.password) return '两次密码输入不一致'
        return null
      },
    },
  ],
}
```

### textarea — 多行文本

```js
const schema = {
  fields: [
    {
      name: 'description',
      type: 'textarea',
      label: '描述',
      rows: 4,
      maxlength: 500,
      placeholder: '请输入描述信息',
    },
    {
      name: 'bio',
      type: 'textarea',
      label: '个人简介',
      rows: 3,
      showCount: true,
      maxlength: 200,
    },
  ],
}
```

### date — 日期选择

```js
const schema = {
  fields: [
    {
      name: 'birthday',
      type: 'date',
      label: '出生日期',
      min: '1900-01-01',
      max: new Date().toISOString().split('T')[0],
    },
    { name: 'startDate', type: 'date', label: '开始日期' },
    { name: 'endDate', type: 'date', label: '结束日期' },
  ],
}
```

### time — 时间选择

```js
const schema = {
  fields: [
    { name: 'startTime', type: 'time', label: '开始时间' },
    { name: 'endTime', type: 'time', label: '结束时间' },
    {
      name: 'reminderTime',
      type: 'time',
      label: '提醒时间',
      defaultValue: '09:00',
    },
  ],
}
```

### select — 下拉选择

```js
const schema = {
  fields: [
    {
      name: 'department',
      type: 'select',
      label: '部门',
      options: [
        { label: '技术部', value: 'tech' },
        { label: '市场部', value: 'marketing' },
        { label: '人事部', value: 'hr' },
        { label: '财务部', value: 'finance' },
      ],
      placeholder: '请选择部门',
    },
    {
      name: 'city',
      type: 'select',
      label: '城市',
      multiple: true,
      searchable: true,
      options: [
        { label: '北京', value: 'beijing' },
        { label: '上海', value: 'shanghai' },
        { label: '广州', value: 'guangzhou' },
        { label: '深圳', value: 'shenzhen' },
      ],
    },
  ],
}
```

### checkbox — 复选框

```js
const schema = {
  fields: [
    {
      name: 'hobbies',
      type: 'checkbox',
      label: '兴趣爱好',
      options: [
        { label: '阅读', value: 'reading' },
        { label: '运动', value: 'sports' },
        { label: '音乐', value: 'music' },
        { label: '旅行', value: 'travel' },
      ],
    },
    {
      name: 'agreeTerms',
      type: 'checkbox',
      label: '我已阅读并同意服务条款',
      // 单选框模式
      single: true,
      required: true,
    },
  ],
}
```

### radio — 单选框

```js
const schema = {
  fields: [
    {
      name: 'gender',
      type: 'radio',
      label: '性别',
      required: true,
      options: [
        { label: '男', value: 'male' },
        { label: '女', value: 'female' },
      ],
    },
    {
      name: 'paymentMethod',
      type: 'radio',
      label: '支付方式',
      defaultValue: 'wechat',
      options: [
        { label: '微信支付', value: 'wechat' },
        { label: '支付宝', value: 'alipay' },
        { label: '银行卡', value: 'bank' },
      ],
    },
  ],
}
```

### switchField — 开关

```js
const schema = {
  fields: [
    {
      name: 'enableNotification',
      type: 'switchField',
      label: '启用通知',
      defaultValue: true,
    },
    {
      name: 'darkMode',
      type: 'switchField',
      label: '深色模式',
      checkedText: '开',
      uncheckedText: '关',
    },
  ],
}
```

### switcher — 切换器

```js
const schema = {
  fields: [
    {
      name: 'role',
      type: 'switcher',
      label: '角色',
      defaultValue: 'user',
      options: [
        { label: '管理员', value: 'admin' },
        { label: '普通用户', value: 'user' },
        { label: '访客', value: 'guest' },
      ],
    },
  ],
}
```

---

## createFormScope()

创建表单作用域，用于注册字段渲染器和提供表单上下文。

```js
import { createFormScope } from '@kupola/components/schema-form'

const scope = createFormScope({
  // 全局表单配置
  density: 'default',       // 'compact' | 'default' | 'spacious'
  variant: 'outlined',      // 'outlined' | 'filled' | 'underlined'
  // 全局校验消息
  messages: {
    required: '此项为必填项',
    email: '请输入有效的邮箱地址',
    minlength: '最少输入 {min} 个字符',
    maxlength: '最多输入 {max} 个字符',
  },
})
```

---

## bindSchemaForm(scope, schema)

将 Schema 绑定到表单作用域，返回表单实例。

```js
import { createFormScope, bindSchemaForm } from '@kupola/components/schema-form'

const scope = createFormScope()
const schema = {
  fields: [
    { name: 'name', type: 'text', label: '姓名' },
    { name: 'email', type: 'email', label: '邮箱' },
  ],
}

const form = bindSchemaForm(scope, schema, {
  // 初始值
  initialValues: {
    name: '张三',
    email: '',
  },
  // 布局配置
  layout: 'vertical',     // 'vertical' | 'horizontal' | 'inline'
  labelWidth: '120px',    // 标签宽度（horizontal 布局下生效）
  // 提交处理
  onSubmit: (values) => {
    console.log('提交数据:', values)
  },
  // 值变化回调
  onChange: (values, changedField) => {
    console.log('字段变化:', changedField, values)
  },
})
```

---

## registerFormField(name, renderer)

注册自定义字段渲染器，扩展 SchemaForm 支持的字段类型。

```js
import { registerFormField } from '@kupola/components/schema-form'
import { html } from '@kupola/platform'

// 注册自定义颜色选择器
registerFormField('colorPicker', (fieldConfig, context) => {
  const { name, label, defaultValue } = fieldConfig
  const { value, onChange, error } = context

  const input = html`
    <div class="schema-form-field">
      <label for="${name}">${label}</label>
      <div style="display: flex; align-items: center; gap: 8px;">
        <input
          type="color"
          id="${name}"
          value="${value() || defaultValue || '#000000'}"
          onchange="this.nextElementSibling.value = this.value"
        />
        <input
          type="text"
          value="${value() || defaultValue || '#000000'}"
          onchange="this.previousElementSibling.value = this.value"
          style="width: 80px;"
        />
      </div>
      ${error() ? html`<span class="error-message">${error()}</span>` : ''}
    </div>
  `

  return input
})

// 使用自定义字段类型
const schema = {
  fields: [
    { name: 'themeColor', type: 'colorPicker', label: '主题色', defaultValue: '#1890ff' },
    { name: 'fontColor', type: 'colorPicker', label: '字体颜色', defaultValue: '#333333' },
  ],
}
```

---

## getFormFieldRenderer(name)

获取已注册的字段渲染器。

```js
import { getFormFieldRenderer, registerFormField } from '@kupola/components/schema-form'

registerFormField('myCustomField', myRenderer)

const renderer = getFormFieldRenderer('myCustomField')
if (renderer) {
  console.log('自定义字段渲染器已注册')
}

// 获取内置渲染器
const textRenderer = getFormFieldRenderer('text')
const selectRenderer = getFormFieldRenderer('select')
```

---

## validateSchema(schema, values)

独立于表单 UI 的 Schema 校验函数，不依赖 DOM。

```js
import { validateSchema } from '@kupola/components/schema-form'

const schema = {
  fields: [
    { name: 'username', type: 'text', label: '用户名', required: true, minlength: 3 },
    { name: 'email', type: 'email', label: '邮箱', required: true },
    { name: 'age', type: 'number', label: '年龄', min: 0, max: 150 },
  ],
}

const values = {
  username: 'ab',
  email: 'invalid-email',
  age: 200,
}

const errors = validateSchema(schema, values)
// {
//   username: '最少输入 3 个字符',
//   email: '请输入有效的邮箱地址',
//   age: '不能大于 150',
// }

if (Object.keys(errors).length === 0) {
  console.log('校验通过，可以提交')
} else {
  console.log('校验失败:', errors)
}
```

---

## schemaSubmit(form, schema, onSubmit)

处理表单提交，自动校验并调用回调。

```js
import { schemaSubmit } from '@kupola/components/schema-form'

const form = bindSchemaForm(scope, schema)

// 方式一：在 bindSchemaForm 中直接配置 onSubmit
const form = bindSchemaForm(scope, schema, {
  onSubmit: async (values) => {
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })
    return response.json()
  },
})

// 方式二：使用 schemaSubmit 独立处理
document.getElementById('submitBtn').addEventListener('click', async () => {
  const result = await schemaSubmit(form, schema, async (values) => {
    console.log('表单数据:', values)
    // 提交到后端
    const res = await fetch('/api/submit', {
      method: 'POST',
      body: JSON.stringify(values),
    })
    return res.ok
  })

  if (result.success) {
    console.log('提交成功')
  } else {
    console.log('提交失败:', result.errors)
  }
})
```

---

## FormDensity — 表单密度

控制表单字段之间的间距和整体密度。

```js
import { createFormScope, bindSchemaForm } from '@kupola/components/schema-form'

// 紧凑模式
const compactScope = createFormScope({ density: 'compact' })

// 默认模式
const defaultScope = createFormScope({ density: 'default' })

// 宽松模式
const spaciousScope = createFormScope({ density: 'spacious' })

const schema = {
  fields: [
    { name: 'name', type: 'text', label: '姓名' },
    { name: 'email', type: 'email', label: '邮箱' },
    { name: 'phone', type: 'text', label: '电话' },
  ],
}

// 分别创建不同密度的表单
const compactForm = bindSchemaForm(compactScope, schema)
const defaultForm = bindSchemaForm(defaultScope, schema)
const spaciousForm = bindSchemaForm(spaciousScope, schema)

// 动态切换密度
scope.setDensity('compact')
```

| 密度值 | 说明 | 适用场景 |
| --- | --- | --- |
| `compact` | 紧凑布局，字段间距小 | 数据密集型表单、表格内表单 |
| `default` | 默认间距 | 常规表单 |
| `spacious` | 宽松布局，字段间距大 | 移动端表单、简单表单 |

---

## FormVariant — 表单样式变体

控制输入框的视觉样式。

```js
import { createFormScope } from '@kupola/components/schema-form'

// 轮廓样式 — 输入框带边框
const outlinedScope = createFormScope({ variant: 'outlined' })

// 填充样式 — 输入框带背景色
const filledScope = createFormScope({ variant: 'filled' })

// 下划线样式 — 仅底部边框
const underlinedScope = createFormScope({ variant: 'underlined' })

// 动态切换
scope.setVariant('filled')
```

| 变体值 | 说明 | 视觉效果 |
| --- | --- | --- |
| `outlined` | 轮廓样式 | 输入框四周有边框 |
| `filled` | 填充样式 | 输入框有灰色背景填充 |
| `underlined` | 下划线样式 | 仅底部有下划线 |

---

## 字段配置详解

| 属性 | 类型 | 说明 |
| --- | --- | --- |
| `name` | `string` | 字段名（必填） |
| `type` | `string` | 字段类型 |
| `label` | `string` | 标签文本 |
| `required` | `boolean` | 是否必填 |
| `placeholder` | `string` | 占位符文本 |
| `defaultValue` | `any` | 默认值 |
| `disabled` | `boolean` | 是否禁用 |
| `readonly` | `boolean` | 是否只读 |
| `hidden` | `boolean \| (values) => boolean` | 是否隐藏 |
| `options` | `Array<{ label, value }>` | 选项列表（select/checkbox/radio） |
| `min` | `number \| string` | 最小值 |
| `max` | `number \| string` | 最大值 |
| `minlength` | `number` | 最小长度 |
| `maxlength` | `number` | 最大长度 |
| `pattern` | `string \| RegExp` | 正则校验 |
| `validate` | `(value, formData) => string \| null` | 自定义校验函数 |
| `message` | `string \| object` | 自定义校验消息 |
| `multiple` | `boolean` | 是否多选（select） |
| `searchable` | `boolean` | 是否可搜索（select） |
| `rows` | `number` | 行数（textarea） |
| `showCount` | `boolean` | 显示字数统计（textarea） |
| `step` | `number` | 步长（number） |
| `single` | `boolean` | 单选框模式（checkbox） |
| `checkedText` | `string` | 开启文本（switchField） |
| `uncheckedText` | `string` | 关闭文本（switchField） |

---

## 完整示例：患者注册表单

以下是一个涵盖所有常用字段类型的患者注册表单完整示例：

```js
import {
  createFormScope,
  bindSchemaForm,
  registerFormField,
  schemaSubmit,
} from '@kupola/components/schema-form'
import { html } from '@kupola/platform'

// 注册自定义血型选择器
registerFormField('bloodType', (fieldConfig, context) => {
  const { name, label } = fieldConfig
  const { value, onChange, error } = context

  return html`
    <div class="schema-form-field">
      <label>${label}</label>
      <div style="display: flex; gap: 8px;">
        ${['A', 'B', 'AB', 'O'].map(type => html`
          <label style="cursor: pointer;">
            <input
              type="radio"
              name="${name}"
              value="${type}"
              ${value() === type ? 'checked' : ''}
              onchange="this.closest('.schema-form-field').__onChange('${type}')"
            />
            ${type} 型
          </label>
        `)}
      </div>
      ${error() ? html`<span style="color: red; font-size: 12px;">${error()}</span>` : ''}
    </div>
  `
})

// 创建表单作用域
const scope = createFormScope({
  density: 'default',
  variant: 'outlined',
  messages: {
    required: '此项为必填项',
    email: '请输入有效的邮箱地址',
    minlength: '最少输入 {min} 个字符',
    maxlength: '最多输入 {max} 个字符',
    min: '不能小于 {min}',
    max: '不能大于 {max}',
  },
})

// 定义患者注册 Schema
const patientSchema = {
  fields: [
    // 基本信息
    {
      name: 'name',
      type: 'text',
      label: '姓名',
      required: true,
      placeholder: '请输入患者姓名',
    },
    {
      name: 'gender',
      type: 'radio',
      label: '性别',
      required: true,
      defaultValue: 'male',
      options: [
        { label: '男', value: 'male' },
        { label: '女', value: 'female' },
      ],
    },
    {
      name: 'birthday',
      type: 'date',
      label: '出生日期',
      required: true,
      max: new Date().toISOString().split('T')[0],
    },
    {
      name: 'bloodType',
      type: 'bloodType',
      label: '血型',
      required: true,
    },

    // 联系方式
    {
      name: 'phone',
      type: 'text',
      label: '手机号码',
      required: true,
      placeholder: '请输入手机号码',
      pattern: /^1[3-9]\d{9}$/,
      message: '请输入有效的手机号码',
    },
    {
      name: 'email',
      type: 'email',
      label: '电子邮箱',
      placeholder: '请输入邮箱地址',
    },

    // 密码（用于在线账户）
    {
      name: 'password',
      type: 'password',
      label: '设置密码',
      placeholder: '8-20 位，包含字母和数字',
      minlength: 8,
      maxlength: 20,
      pattern: /^(?=.*[A-Za-z])(?=.*\d).+$/,
      message: '密码必须包含字母和数字',
    },
    {
      name: 'confirmPassword',
      type: 'password',
      label: '确认密码',
      placeholder: '请再次输入密码',
      validate: (value, formData) => {
        if (value !== formData.password) return '两次密码输入不一致'
        return null
      },
    },

    // 就诊信息
    {
      name: 'department',
      type: 'select',
      label: '就诊科室',
      required: true,
      placeholder: '请选择科室',
      options: [
        { label: '内科', value: 'internal' },
        { label: '外科', value: 'surgery' },
        { label: '儿科', value: 'pediatrics' },
        { label: '妇产科', value: 'obstetrics' },
        { label: '骨科', value: 'orthopedics' },
        { label: '眼科', value: 'ophthalmology' },
      ],
    },
    {
      name: 'appointmentDate',
      type: 'date',
      label: '预约日期',
      required: true,
      min: new Date().toISOString().split('T')[0],
    },
    {
      name: 'appointmentTime',
      type: 'time',
      label: '预约时间',
      required: true,
    },

    // 症状描述
    {
      name: 'symptoms',
      type: 'textarea',
      label: '症状描述',
      required: true,
      rows: 4,
      maxlength: 500,
      showCount: true,
      placeholder: '请详细描述您的症状...',
    },

    // 既往病史
    {
      name: 'medicalHistory',
      type: 'checkbox',
      label: '既往病史',
      options: [
        { label: '高血压', value: 'hypertension' },
        { label: '糖尿病', value: 'diabetes' },
        { label: '心脏病', value: 'heartDisease' },
        { label: '哮喘', value: 'asthma' },
        { label: '过敏史', value: 'allergy' },
        { label: '手术史', value: 'surgery' },
      ],
    },

    // 过敏信息
    {
      name: 'allergies',
      type: 'textarea',
      label: '过敏信息',
      rows: 2,
      maxlength: 200,
      placeholder: '如有过敏史，请详细说明过敏原',
    },

    // 紧急联系人
    {
      name: 'emergencyContact',
      type: 'text',
      label: '紧急联系人',
      placeholder: '请输入紧急联系人姓名',
    },
    {
      name: 'emergencyPhone',
      type: 'text',
      label: '紧急联系电话',
      placeholder: '请输入紧急联系电话',
      pattern: /^1[3-9]\d{9}$/,
      message: '请输入有效的手机号码',
    },

    // 设置项
    {
      name: 'enableSMS',
      type: 'switchField',
      label: '接收短信提醒',
      defaultValue: true,
    },
    {
      name: 'enableEmail',
      type: 'switchField',
      label: '接收邮件提醒',
      defaultValue: false,
    },

    // 同意条款
    {
      name: 'agreeTerms',
      type: 'checkbox',
      label: '我已阅读并同意《患者服务协议》和《隐私政策》',
      single: true,
      required: true,
      message: '请阅读并同意服务协议',
    },
  ],
}

// 绑定 Schema 到表单
const form = bindSchemaForm(scope, patientSchema, {
  layout: 'vertical',
  onSubmit: async (values) => {
    console.log('提交患者注册信息:', values)

    // 模拟 API 调用
    const response = await fetch('/api/patients/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...values,
        registeredAt: new Date().toISOString(),
      }),
    })

    if (!response.ok) {
      throw new Error('注册失败，请稍后重试')
    }

    return response.json()
  },
  onChange: (values, changedField) => {
    // 选填字段联动：如果选择了过敏史，则过敏信息变为必填
    if (changedField === 'medicalHistory') {
      const hasAllergy = values.medicalHistory?.includes('allergy')
      const allergyField = document.querySelector('[name="allergies"]')
      if (allergyField) {
        allergyField.required = hasAllergy
      }
    }
  },
})

// 挂载到页面
document.getElementById('formRoot').appendChild(form.element)

// 编程式提交
document.getElementById('submitBtn').addEventListener('click', async () => {
  const result = await schemaSubmit(form, patientSchema, async (values) => {
    console.log('提交数据:', values)
    return { success: true }
  })

  if (result.success) {
    alert('注册成功！')
  }
})
```

---

## 说明

- `createFormScope()` 创建的 scope 可在多个表单间共享，实现统一的样式和校验消息配置。
- `registerFormField()` 必须在使用 Schema 之前调用，否则自定义类型无法识别。
- `validateSchema()` 是纯函数，不依赖 DOM，可在任何环境（包括 Node.js）中使用。
- 表单布局 `horizontal` 需要配合 `labelWidth` 使用，`vertical` 和 `inline` 则不需要。
- 字段的 `hidden` 属性支持函数，可基于当前表单值动态控制显隐。