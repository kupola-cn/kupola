# Progress 进度条

用于展示任务完成进度。

```js
import { Progress } from '@kupola/kupola/components/progress'

const progress = Progress({
  percent: 60,
  status: 'active',
})

document.body.appendChild(progress.element)
```

## 常用选项

| 选项 | 说明 |
| --- | --- |
| percent | 进度百分比 |
| status | 状态 |
| showText | 是否显示文本 |
| strokeWidth | 线条高度 |

## 方法

- `setPercent(percent)`
- `destroy()`
