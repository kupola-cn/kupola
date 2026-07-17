# NumberInput 数字输入

用于数字输入和步进调整。

```js
import { NumberInput } from '@kupola/kupola/components/numberinput'

const input = NumberInput({
  min: 0,
  max: 100,
  value: 10,
  onChange: (value) => console.log(value),
})

document.body.appendChild(input.element)
```

## 常用选项

| 选项 | 说明 |
| --- | --- |
| min | 最小值 |
| max | 最大值 |
| step | 步长 |
| value | 当前值 |
| disabled | 是否禁用 |
| onChange | 变化回调 |

## 方法

- `setValue(value)`
- `getValue()`
- `increase()`
- `decrease()`
- `destroy()`
