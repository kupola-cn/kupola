# Textarea 多行文本

用于长文本输入。

```js
import { Textarea } from '@kupola/components/textarea'

const textarea = Textarea({
  value: '',
  placeholder: '请输入备注',
  rows: 4,
  onInput: (value) => console.log(value),
})

document.body.appendChild(textarea.element)
```

## 常用选项

| 选项 | 说明 |
| --- | --- |
| value | 文本值 |
| placeholder | 占位文本 |
| rows | 行数 |
| maxlength | 最大长度 |
| disabled | 是否禁用 |
| onInput | 输入回调 |

## 方法

- `setValue(value)`
- `getValue()`
- `focus()`
- `destroy()`
