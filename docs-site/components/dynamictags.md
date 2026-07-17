# DynamicTags 动态标签

用于增删标签列表。

```js
import { DynamicTags } from '@kupola/kupola/components/dynamictags'

const tags = DynamicTags({
  value: ['急诊', '重点'],
  onChange: (value) => console.log(value),
})

document.body.appendChild(tags.element)
```

## 常用选项

| 选项 | 说明 |
| --- | --- |
| value | 标签数组 |
| placeholder | 输入占位文本 |
| max | 最大标签数 |
| onChange | 变化回调 |

## 方法

- `add(tag)`
- `remove(tag)`
- `getValue()`
- `destroy()`
