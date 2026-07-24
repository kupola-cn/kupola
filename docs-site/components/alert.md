# Alert 警告提示

用于页面内展示重要状态或提示信息。

```js
import { Alert } from '@kupola/components/alert'

const alert = Alert({
  title: '注意',
  description: '该操作会影响当前配置。',
  type: 'warning',
  closable: true,
})

document.body.appendChild(alert.element)
```

## 常用选项

| 选项 | 说明 |
| --- | --- |
| title | 标题 |
| description | 描述 |
| type | `normal` / `success` / `warning` / `danger` / `info` |
| closable | 是否可关闭 |
| onClose | 关闭回调 |

## 方法

- `dismiss()`
- `destroy()`
