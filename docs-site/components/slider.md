# Slider 滑块

用于在范围内选择数值。

```js
import { Slider } from '@kupola/components/slider'

const slider = Slider({
  min: 0,
  max: 100,
  value: 50,
  onChange: (value) => console.log(value),
})

document.body.appendChild(slider.element)
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
- `destroy()`
