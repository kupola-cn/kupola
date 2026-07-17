# Checkbox 复选框

用于布尔选择或多选项。

```js
import { Checkbox } from '@kupola/kupola/components/checkbox'

const checkbox = Checkbox({
  label: '启用',
  checked: true,
  onChange: (checked) => console.log(checked),
})

document.body.appendChild(checkbox.element)
```

## 常用选项

| 选项 | 说明 |
| --- | --- |
| label | 文案 |
| checked | 是否选中 |
| disabled | 是否禁用 |
| onChange | 变化回调 |

## 方法

- `setChecked(checked)`
- `getChecked()`
- `destroy()`
