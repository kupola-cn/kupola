# Radio 单选框

用于从一组选项中选择一个值。

```js
import { Radio } from '@kupola/kupola/components/radio'

const radio = Radio({
  name: 'gender',
  options: [
    { value: 'male', label: '男' },
    { value: 'female', label: '女' },
  ],
  value: 'female',
  onChange: (value) => console.log(value),
})

document.body.appendChild(radio.element)
```

## 常用选项

| 选项 | 说明 |
| --- | --- |
| name | 单选组名称 |
| options | 选项数组 |
| value | 当前值 |
| disabled | 是否禁用 |
| onChange | 变化回调 |

## 方法

- `setValue(value)`
- `getValue()`
- `destroy()`
