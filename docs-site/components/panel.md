# Panel 面板

通用的内容容器，适合承载列表、表格、表单、树和其他业务内容。Panel 只负责容器结构和布局，不处理业务数据、权限或请求。

```js
import { html } from '@kupola/platform'
import { Panel } from '@kupola/components/panel'

const panel = Panel({
  title: '角色配置',
  subtitle: '选择角色并管理权限',
  bodyScrollable: true,
  fill: true,
  actions: html`<button class="ds-btn ds-btn--primary">保存</button>`,
}, html`<div>Panel body</div>`)

document.body.appendChild(panel.element)
```

## 选项

| 选项 | 说明 |
| --- | --- |
| `title` | 标题内容，可以是文本或模板。 |
| `subtitle` | 标题下的辅助说明。 |
| `icon` | 标题左侧的图标或模板。 |
| `actions` | 标题右侧的操作区。 |
| `header` | 自定义整个 Header 内容，设置后覆盖默认标题区。 |
| `footer` | 面板底部操作区。 |
| `density` | `compact`、`default` 或 `comfortable`。 |
| `headerTone` | `plain` 或 `muted`。 |
| `bodyScrollable` | 是否让正文成为独立滚动区域。 |
| `bodyPadding` | `none`、`compact`、`default` 或 `comfortable`。 |
| `bodyClassName` | 添加到正文区域的自定义类。 |
| `fill` | 是否填满父容器高度。 |
| `className` | 添加到 Panel 根节点的自定义类。 |
| `role` | 可选的 ARIA role。 |
| `ariaLabel` | 可选的无障碍名称。 |

## 组合使用

Panel 是声明式组件，可以直接作为另一个模板的子内容，也可以嵌套其他 Kupola 组件：

```js
const panel = Panel({ title: '列表' }, html`
  <div class="list-scroll">
    ${rows}
  </div>
`)
```

Panel 不提供折叠和浮层行为。需要折叠时使用 [Collapse](/components/collapse)，需要侧边浮层时使用 [Drawer](/components/drawer)。

## 方法

- `update(props)`：更新组件属性。
- `destroy()`：销毁 Panel 及其子内容。
