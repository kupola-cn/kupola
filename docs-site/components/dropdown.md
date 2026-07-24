# Dropdown 下拉菜单

用于从一组菜单项中选择一个值，适合工具栏、筛选器和紧凑表单。

```js
import { Dropdown } from '@kupola/components/dropdown'

const dropdown = Dropdown({
  placeholder: '请选择',
  items: [
    { value: 'draft', text: '草稿' },
    { value: 'done', text: '完成' },
  ],
  onSelect: ({ value }) => console.log(value),
})

document.body.appendChild(dropdown.element)
```

## 常用选项

| 选项 | 说明 |
| --- | --- |
| items | 下拉项数组 |
| placeholder | 未选择时的触发器文本 |
| trigger | `click` 或 `hover` |
| closeOnClick | 选择后是否关闭 |
| onSelect | 选择回调 |

## 方法

- `open()`
- `close()`
- `toggle()`
- `destroy()`
