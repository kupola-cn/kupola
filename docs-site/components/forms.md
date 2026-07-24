# 表单组件

这一组组件覆盖输入、选择、校验和表单状态管理。

```js
import { Form } from '@kupola/components/form'
```

## 组件清单

| 组件 | 导入 | 说明 |
| --- | --- | --- |
| Form | `@kupola/components/form` | 表单收集、校验和提交处理 |
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
- `Validation` 是独立校验引擎，可单独接入非表单场景。
