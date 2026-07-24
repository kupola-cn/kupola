# Divider 分割线

用于分隔内容区块。

```js
import { Divider } from '@kupola/components/divider'

const divider = Divider({
  text: '基础信息',
  orientation: 'left',
})

document.body.appendChild(divider.element)
```

## 常用选项

| 选项 | 说明 |
| --- | --- |
| text | 分割线文字 |
| orientation | 文字位置 |
| dashed | 是否虚线 |

## 方法

- `destroy()`
