# Empty 空状态

用于列表、表格、搜索结果为空时的占位展示。

```js
import { Empty } from '@kupola/kupola/components/empty'

const empty = Empty({
  title: '暂无数据',
  description: '请调整筛选条件后重试。',
})

document.body.appendChild(empty.element)
```

## 常用选项

| 选项 | 说明 |
| --- | --- |
| title | 标题 |
| description | 描述 |
| icon | 自定义图标 HTML |

## 方法

- `destroy()`
