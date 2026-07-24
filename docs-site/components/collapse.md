# Collapse 折叠面板

用于展开或收起内容区块。

```js
import { Collapse } from '@kupola/components/collapse'

const collapse = Collapse({
  title: '高级设置',
  content: '这里放置可折叠内容。',
  open: false,
})

document.body.appendChild(collapse.element)
```

## 常用选项

| 选项 | 说明 |
| --- | --- |
| title | 面板标题 |
| content | 折叠内容 |
| open | 是否展开 |
| onToggle | 切换回调 |

## 方法

- `open()`
- `close()`
- `toggle()`
- `destroy()`
