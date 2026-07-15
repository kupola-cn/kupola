# Modal 对话框

## 基础用法

```js
import { Modal } from '@kupola/kupola/components/modal'

Modal.open({
  title: '提示',
  content: '这是一个对话框',
  onOk: () => console.log('确认'),
})
```

## 配置项

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| title | string | - | 标题 |
| content | string \| HTMLElement | - | 内容 |
| width | number | 520 | 宽度 (px) |
| maskClosable | boolean | true | 点击遮罩关闭 |
| closable | boolean | true | 显示关闭按钮 |
| onOk | function | - | 确认回调 |
| onCancel | function | - | 取消回调 |

## 方法

- `Modal.open(options)` - 打开对话框
- `Modal.close()` - 关闭当前对话框
- `Modal.confirm(options)` - 确认对话框
- `Modal.info(options)` - 信息对话框
- `Modal.success(options)` - 成功对话框
- `Modal.error(options)` - 错误对话框
- `Modal.warning(options)` - 警告对话框

## 示例

### 确认对话框

```js
Modal.confirm({
  title: '确认删除',
  content: '此操作不可恢复，确定继续？',
  onOk: () => deleteItem(),
})
```

### 自定义内容

```js
const content = document.createElement('div')
content.innerHTML = '<p>自定义 HTML 内容</p>'

Modal.open({
  title: '自定义',
  content,
})
```
