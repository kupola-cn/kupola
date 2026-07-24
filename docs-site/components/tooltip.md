# Tooltip 文字提示

用于在悬停或聚焦时显示短提示。

```js
import { Tooltip } from '@kupola/components/tooltip'

const tooltip = Tooltip({
  target: document.querySelector('#saveBtn'),
  content: '保存当前配置',
  placement: 'top',
})
```

## 常用选项

| 选项 | 说明 |
| --- | --- |
| target | 触发元素 |
| content | 提示内容 |
| placement | 显示位置 |
| trigger | 触发方式 |

## 方法

- `show()`
- `hide()`
- `destroy()`
