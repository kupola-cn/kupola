# Carousel 轮播

用于图片或内容轮播。

```js
import { Carousel } from '@kupola/kupola/components/carousel'

const carousel = Carousel({
  items: [
    { content: '第一屏' },
    { content: '第二屏' },
  ],
  autoplay: true,
})

document.body.appendChild(carousel.element)
```

## 常用选项

| 选项 | 说明 |
| --- | --- |
| items | 轮播项 |
| autoplay | 是否自动播放 |
| interval | 播放间隔 |
| loop | 是否循环 |

## 方法

- `next()`
- `prev()`
- `goTo(index)`
- `destroy()`
