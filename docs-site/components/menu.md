# Menu 菜单

用于垂直或水平导航。

```js
import { Menu } from '@kupola/components/menu'

const menu = Menu({
  selectedKey: 'users',
  items: [
    { key: 'users', label: '用户管理' },
    { key: 'roles', label: '角色管理' },
  ],
  onSelect: (key) => console.log(key),
})

document.body.appendChild(menu.element)
```

## 常用选项

| 选项 | 说明 |
| --- | --- |
| items | 菜单项 |
| selectedKey | 当前选中项 |
| mode | 菜单模式 |
| onSelect | 选择回调 |

## 方法

- `select(key)`
- `destroy()`
