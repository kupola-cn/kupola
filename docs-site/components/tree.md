# Tree 树

用于展示层级结构。

```js
import { Tree } from '@kupola/kupola/components/tree'

const tree = Tree({
  data: [
    { key: 'group', title: '集团', children: [{ key: 'branch', title: '分机构' }] },
  ],
  onSelect: (key) => console.log(key),
})

document.body.appendChild(tree.element)
```

## 常用选项

| 选项 | 说明 |
| --- | --- |
| data | 树数据 |
| selectedKey | 当前选中项 |
| defaultExpandAll | 默认全部展开 |
| onSelect | 选择回调 |

## 方法

- `select(key)`
- `expand(key)`
- `collapse(key)`
- `destroy()`
