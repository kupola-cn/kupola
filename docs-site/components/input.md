# Input 输入框

用于文本输入。

```js
import { Input } from '@kupola/kupola/components/input'

const input = Input({
  value: '',
  placeholder: '请输入名称',
  onInput: (value) => console.log(value),
})

document.body.appendChild(input.element)
```

## 常用选项

| 选项 | 说明 |
| --- | --- |
| value | 输入值 |
| placeholder | 占位文本 |
| disabled | 是否禁用 |
| clearable | 是否可清空 |
| onInput | 输入回调 |
| onChange | 变化回调 |

## 方法

- `setValue(value)`
- `getValue()`
- `focus()`
- `destroy()`
