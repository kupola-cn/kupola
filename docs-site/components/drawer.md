# Drawer 抽屉

用于从屏幕边缘滑出的面板，适合详情、设置和辅助操作区。

```js
import { html } from '@kupola/kupola'
import { Drawer } from '@kupola/kupola/components/drawer'

const drawer = Drawer({ title: '详情', placement: 'right' }, html`<p>内容</p>`)
document.body.appendChild(drawer.element)
drawer.open()
```

## 常用选项

| 选项 | 说明 |
| --- | --- |
| title | 抽屉标题 |
| placement | 弹出方向 |
| width | 宽度 |
| closableOnMask | 是否允许点击遮罩关闭 |

## 方法

- `open()`
- `close()`
- `toggle()`
- `destroy()`
