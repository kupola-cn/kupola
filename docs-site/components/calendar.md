# Calendar 日历

用于展示日期网格和日期事件。

```js
import { Calendar } from '@kupola/kupola/components/calendar'

const calendar = Calendar({
  value: new Date(),
  events: [
    { date: '2026-07-17', title: '盘点' },
  ],
  onSelect: (date) => console.log(date),
})

document.body.appendChild(calendar.element)
```

## 常用选项

| 选项 | 说明 |
| --- | --- |
| value | 当前日期 |
| events | 日期事件 |
| onSelect | 日期选择回调 |
| onMonthChange | 月份变化回调 |

## 方法

- `setValue(value)`
- `destroy()`
