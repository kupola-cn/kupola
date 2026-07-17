# Datepicker 日期选择器

用于选择日期，适合表单、筛选器和计划类界面。

```js
import { Datepicker } from '@kupola/kupola/components/datepicker'

const picker = Datepicker({
  value: '2026-07-17',
  onChange: (value) => console.log(value),
})

document.body.appendChild(picker.element)
```

## 常用选项

| 选项 | 说明 |
| --- | --- |
| value | 当前日期 |
| min | 最小日期 |
| max | 最大日期 |
| placeholder | 占位文案 |
| onChange | 变化回调 |

## 方法

- `setValue(value)`
- `getValue()`
- `destroy()`
