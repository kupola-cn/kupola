# Switch 开关

用于开启/关闭状态。

```js
import { Switch } from '@kupola/kupola/components/switch'

const sw = Switch({
  checked: true,
  onChange: (checked) => console.log(checked),
})

document.body.appendChild(sw.element)
```

## 常用选项

| 选项 | 说明 |
| --- | --- |
| checked | 是否开启 |
| disabled | 是否禁用 |
| checkedText | 开启文案 |
| uncheckedText | 关闭文案 |
| onChange | 变化回调 |

## 方法

- `setChecked(checked)`
- `getChecked()`
- `toggle()`
- `destroy()`
