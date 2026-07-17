# 覆盖层组件

这一组组件负责弹层、浮层、提示和遮罩交互。

```js
import { Modal } from '@kupola/kupola/components/modal'
```

## 组件清单

| 组件 | 导入 | 说明 |
| --- | --- | --- |
| Modal | `@kupola/kupola/components/modal` | 可控模态框，支持遮罩、ESC、聚焦管理 |
| Dropdown | `@kupola/kupola/components/dropdown` | 下拉菜单，支持键盘导航和选中态 |
| Drawer | `@kupola/kupola/components/drawer` | 侧边抽屉面板 |
| Dialog | `@kupola/kupola/components/dialog` | 命令式确认/提示对话框 |
| Notification | `@kupola/kupola/components/notification` | 全局通知消息 |
| Tooltip | `@kupola/kupola/components/tooltip` | 悬浮提示 |

## 重点

- `Modal` 适合有明确输入或确认流程的场景。
- `Dialog` 更适合一次性确认和警告。
- `Dropdown` 适合表单内联选择。
