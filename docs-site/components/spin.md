# Spin 加载

用于局部或全局加载状态。

```js
import { Spin } from '@kupola/kupola/components/spin'

const spin = Spin({
  text: '加载中...',
})

document.body.appendChild(spin.element)
```

## 常用选项

| 选项 | 说明 |
| --- | --- |
| text | 加载文案 |
| size | 尺寸 |
| spinning | 是否显示 |

## 方法

- `show()`
- `hide()`
- `destroy()`
