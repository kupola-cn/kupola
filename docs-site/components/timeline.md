# Timeline 时间线

用于按时间顺序展示事件。

```js
import { Timeline } from '@kupola/components/timeline'

const timeline = Timeline({
  items: [
    { title: '创建订单', time: '09:00' },
    { title: '提交审批', time: '09:30' },
  ],
})

document.body.appendChild(timeline.element)
```

## 常用选项

| 选项 | 说明 |
| --- | --- |
| items | 时间线项目 |
| pending | 是否显示进行中状态 |

## 方法

- `destroy()`
