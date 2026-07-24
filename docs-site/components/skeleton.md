# Skeleton 骨架屏

用于数据加载前的占位状态。

```js
import { Skeleton } from '@kupola/components/skeleton'

const skeleton = Skeleton({
  rows: 3,
  avatar: true,
})

document.body.appendChild(skeleton.element)
```

## 常用选项

| 选项 | 说明 |
| --- | --- |
| rows | 文本占位行数 |
| avatar | 是否显示头像占位 |
| active | 是否显示动画 |
| width | 自定义宽度 |
| height | 自定义高度 |

## 方法

- `destroy()`
