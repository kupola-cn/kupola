# Heatmap 热力图

用于展示按日期或分组聚合的数据强度。

```js
import { Heatmap } from '@kupola/components/heatmap'

const heatmap = Heatmap({
  data: [
    { date: '2026-07-17', value: 8 },
  ],
  color: '#22c55e',
})

document.body.appendChild(heatmap.element)
```

## 常用选项

| 选项 | 说明 |
| --- | --- |
| data | 数据数组 |
| color | 基础颜色 |
| startDate | 开始日期 |
| endDate | 结束日期 |
| onClick | 点击回调 |

## 方法

- `setData(data)`
- `destroy()`
