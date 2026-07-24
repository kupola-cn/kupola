# Badge 徽标

用于展示计数、状态或短标签。

```js
import { Badge } from '@kupola/components/badge'

const badge = Badge({
  text: '12',
  type: 'brand',
})

document.body.appendChild(badge.element)
```

## 常用选项

| 选项 | 说明 |
| --- | --- |
| text | 文案 |
| type | `brand` / `success` / `warning` / `error` / `info` / `neutral` |
| dot | 是否为点状徽标 |

## 方法

- `destroy()`
