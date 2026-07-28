# 表单组件

这一组组件覆盖输入、选择、校验和表单状态管理。

```js
import { Form } from '@kupola/components/form'
```

## 组件清单

| 组件 | 导入 | 说明 |
| --- | --- | --- |
| Form | `@kupola/components/form` | 表单收集、校验和提交处理 |
| SchemaForm | `@kupola/components/schemaform` | schema 定义与 HTML 自由布局绑定 |
| Input | `@kupola/components/input` | 文本输入框 |
| Select | `@kupola/components/select` | 下拉选择器 |
| Checkbox | `@kupola/components/checkbox` | 复选框 |
| Radio | `@kupola/components/radio` | 单选框 |
| Switch | `@kupola/components/switch` | 开关 |
| Slider | `@kupola/components/slider` | 滑块 |
| NumberInput | `@kupola/components/numberinput` | 数字输入 |
| Textarea | `@kupola/components/textarea` | 多行文本 |
| Timepicker | `@kupola/components/timepicker` | 时间选择器 |
| Validation | `@kupola/components/validation` | 校验引擎 |

## 重点

- `Form` 负责把原生表单读写和校验统一起来。
- `SchemaForm` 适合需要字段规则、typed data 或自定义 HTML 布局的业务表单，详见 [SchemaForm](/components/schemaform)。
- `Validation` 是独立校验引擎，可单独接入非表单场景。
