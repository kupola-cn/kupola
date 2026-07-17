# Avatar 头像

用于展示用户或实体头像。

```js
import { Avatar } from '@kupola/kupola/components/avatar'

const avatar = Avatar({
  name: '张三',
  src: '',
  size: 32,
})

document.body.appendChild(avatar.element)
```

## 常用选项

| 选项 | 说明 |
| --- | --- |
| name | 名称 |
| src | 图片地址 |
| size | 尺寸 |
| accent | 是否使用品牌色背景 |

## 方法

- `destroy()`
