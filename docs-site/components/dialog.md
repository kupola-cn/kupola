# Dialog 确认对话框

用于一次性确认、提示和警告，返回 Promise。

```js
import { Dialog } from '@kupola/kupola/components/dialog'

const ok = await Dialog.confirm({
  title: '确认删除',
  content: '此操作不可恢复。',
  type: 'warning',
})

if (ok) {
  await removeItem()
}
```

## 方法

- `Dialog.confirm(options)` - 显示确认框，返回 `Promise<boolean>`
- `Dialog.alert(options)` - 显示提示框，无取消按钮

## 常用选项

| 选项 | 说明 |
| --- | --- |
| title | 标题 |
| content | 内容 |
| type | `normal` / `success` / `warning` / `error` / `info` |
| confirmText | 确认按钮文案 |
| cancelText | 取消按钮文案 |
| showCancel | 是否显示取消按钮 |
