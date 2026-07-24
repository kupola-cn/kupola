# Select 选择器

用于从选项列表中选择值。

```js
import { Select } from '@kupola/components/select'

const select = Select({
  options: [
    { value: 'group', label: '集团' },
    { value: 'branch', label: '分机构' },
  ],
  onChange: (value) => console.log(value),
})

document.body.appendChild(select.element)
```

## 常用选项

| 选项 | 说明 |
| --- | --- |
| options | 选项数组 |
| value | 当前值 |
| placeholder | 占位文本 |
| disabled | 是否禁用 |
| searchable | 是否支持搜索 |
| onChange | 变化回调 |

## 方法

- `setValue(value)`
- `getValue()`
- `destroy()`
