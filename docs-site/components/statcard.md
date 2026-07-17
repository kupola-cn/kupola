# Statcard 统计卡片

用于展示核心指标。

```js
import { Statcard } from '@kupola/kupola/components/statcard'

const card = Statcard({
  title: '今日订单',
  value: 128,
  trend: '+12%',
})

document.body.appendChild(card.element)
```

## 常用选项

| 选项 | 说明 |
| --- | --- |
| title | 标题 |
| value | 指标值 |
| trend | 趋势文本 |
| icon | 图标 |
| iconType | 图标颜色类型 |

## 方法

- `destroy()`
