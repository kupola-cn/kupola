# Tag 标签

用于标记状态、分类或属性。

```js
import { Tag } from '@kupola/components/tag'

const tag = Tag({
  text: '启用',
  type: 'brand',
  closable: true,
})

document.body.appendChild(tag.element)
```

## 常用选项

| 选项 | 说明 |
| --- | --- |
| text | 文案 |
| type | 类型 |
| closable | 是否可关闭 |
| onClose | 关闭回调 |

## 方法

- `close()`
- `destroy()`
