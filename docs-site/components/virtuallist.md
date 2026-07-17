# VirtualList 虚拟列表

用于高性能渲染大量列表数据。

```js
import { VirtualList } from '@kupola/kupola/components/virtuallist'

const list = VirtualList({
  items: Array.from({ length: 10000 }, (_, i) => ({ name: `Item ${i}` })),
  itemHeight: 36,
  renderItem: (item) => `<div>${item.name}</div>`,
})

document.body.appendChild(list.element)
```

## 常用选项

| 选项 | 说明 |
| --- | --- |
| items | 数据列表 |
| itemHeight | 每项高度 |
| height | 容器高度 |
| renderItem | 项渲染函数 |

## 方法

- `scrollTo(index)`
- `setItems(items)`
- `destroy()`
