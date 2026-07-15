# 组件概览

Kupola 提供 48+ 个 UI 组件，按需引入。

## 安装

```bash
npm install @kupola/kupola@next
```

## 引入方式

```js
// 完整引入
import { Modal, Table, Form } from '@kupola/kupola'

// 按需引入（推荐）
import { Modal } from '@kupola/kupola/components/modal'
import { Table } from '@kupola/kupola/components/table'
```

## 组件分类

### 覆盖层 (6)
Modal, Dropdown, Drawer, Dialog, Notification, Tooltip

### 导航 (6)
Tabs, Pagination, Datepicker, Breadcrumb, Menu, Calendar

### 表单 (11)
Switch, Select, Checkbox, Radio, Input, Slider, NumberInput, Textarea, Validation, Form, Timepicker

### 反馈 (6)
Alert, Progress, Skeleton, Spin, Empty, Countdown

### 展示 (9)
Tag, Badge, Divider, Timeline, Kbd, Avatar, Statcard, Tree, Carousel

### 交互 (5)
FileUpload, DynamicTags, ImagePreview, ColorPicker, VirtualList

### 工具 (5)
Icons, Message, Heatmap, Table, SlideCaptcha

## 通用 API

所有组件支持以下通用选项：

```js
Modal.open({
  title: '标题',
  content: '内容',
  onOk: () => {},
  onCancel: () => {},
})
```

详细 API 见各组件文档。
