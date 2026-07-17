# Modal 对话框

`Modal` 是一个可控的模态框工厂函数，返回实例后由调用方决定何时打开、关闭和销毁。

## 基础用法

```js
import { html } from '@kupola/kupola'
import { Modal } from '@kupola/kupola/components/modal'

const modal = Modal({ title: '提示', width: '480px' }, html`<p>内容</p>`)
document.body.appendChild(modal.element)
modal.open()
```

## 配置项

| 选项 | 类型 | 说明 |
| --- | --- | --- |
| title | `string` | 标题 |
| width | `string` | 最大宽度，例如 `480px` |
| closableOnMask | `boolean` | 是否允许点击遮罩关闭 |
| escClose | `boolean` | 是否允许 `Esc` 关闭 |

## 方法

- `open()` - 打开弹层
- `close()` - 关闭弹层
- `toggle()` - 切换开关状态
- `destroy()` - 解绑事件并销毁实例

## 说明

- 内置了遮罩点击、ESC 关闭和焦点管理。
- 子内容通过第二个参数传入，支持 `html` 模板或普通节点。
