# Kbd 键盘按键

用于展示快捷键或键盘输入。

```js
import { Kbd } from '@kupola/components/kbd'

const key = Kbd({ text: 'Ctrl + S' })
document.body.appendChild(key.element)
```

## 常用选项

| 选项 | 说明 |
| --- | --- |
| text | 显示文本 |
| size | 尺寸 |

## 方法

- `destroy()`
