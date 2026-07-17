# ColorPicker 颜色选择器

用于选择预设色或自定义颜色。

```js
import { ColorPicker } from '@kupola/kupola/components/colorpicker'

const picker = ColorPicker({
  value: '#22C55E',
  onChange: (color) => console.log(color),
})

document.body.appendChild(picker.element)
```

## 常用选项

| 选项 | 说明 |
| --- | --- |
| value | 当前颜色 |
| colors | 预设颜色 |
| showInput | 是否显示自定义输入 |
| onChange | 变化回调 |

## 方法

- `setValue(color)`
- `getValue()`
- `destroy()`
