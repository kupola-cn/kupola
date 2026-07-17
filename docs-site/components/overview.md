# 组件概览

Kupola 的组件按能力分组维护，所有组件都支持主包引入和按需引入。公开库使用时推荐按需引入，配合 `@kupola/kupola/css` 或 `@kupola/kupola/css/components` 使用库内置样式。

## 安装

```bash
npm install @kupola/kupola
```

## 引入方式

```js
import '@kupola/kupola/css'

// 完整入口
import { Modal, Table, Form } from '@kupola/kupola'

// 按需入口
import { Modal } from '@kupola/kupola/components/modal'
import { Table } from '@kupola/kupola/components/table'
```

## 分类导航

| 分类 | 组件 | 说明 |
| --- | --- | --- |
| [覆盖层](/components/overlay) | Modal, Dropdown, Drawer, Dialog, Notification, Tooltip | 弹窗、抽屉、浮层、全局通知 |
| [导航](/components/navigation) | Tabs, Pagination, Datepicker, Breadcrumb, Menu, Calendar | 页面切换、分页、日期与路径导航 |
| [表单](/components/forms) | Form, Input, Select, Checkbox, Radio, Switch, Slider, NumberInput, Textarea, Timepicker, Validation | 输入、选择、校验和表单数据管理 |
| [反馈](/components/feedback) | Alert, Progress, Skeleton, Spin, Empty, Countdown | 状态反馈、加载、空态和倒计时 |
| [展示](/components/display) | Tag, Badge, Divider, Collapse, Timeline, Kbd, Avatar, Statcard, Tree, Carousel | 信息展示、数据层级、折叠面板和内容轮播 |
| [交互](/components/interaction) | FileUpload, DynamicTags, ImagePreview, ColorPicker, VirtualList | 文件、标签、图片、颜色和大数据列表 |
| [工具](/components/tools) | Icons, Message, Heatmap, Table | 图标、全局消息、热力图和数据表格 |

## 重点文档

- [Modal](/components/modal): 可控模态框，支持遮罩关闭、ESC 关闭和聚焦管理。
- [Form](/components/form): 表单字段收集、校验、数据读写和提交处理。
- [Table](/components/table): 数据表格，支持分页、排序、筛选、选择、树表和行编辑。
