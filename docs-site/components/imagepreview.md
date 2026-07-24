# ImagePreview 图片预览

用于图片查看、切换和关闭。

```js
import { ImagePreview } from '@kupola/components/imagepreview'

const preview = ImagePreview({
  images: ['/a.png', '/b.png'],
  current: 0,
})

preview.open()
```

## 常用选项

| 选项 | 说明 |
| --- | --- |
| images | 图片地址数组 |
| current | 当前索引 |
| loop | 是否循环 |

## 方法

- `open(index)`
- `close()`
- `next()`
- `prev()`
- `destroy()`
