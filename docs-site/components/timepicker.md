# Timepicker 时间选择器

用于选择时间。

```js
import { Timepicker } from '@kupola/kupola/components/timepicker'

const picker = Timepicker({
  value: '09:30',
  onChange: (value) => console.log(value),
})

document.body.appendChild(picker.element)
```

## 常用选项

| 选项 | 说明 |
| --- | --- |
| value | 当前时间 |
| format | 时间格式 |
| disabled | 是否禁用 |
| onChange | 变化回调 |

## 方法

- `setValue(value)`
- `getValue()`
- `destroy()`
