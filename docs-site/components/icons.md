# Icons 图标

提供内置 SVG 图标和自定义注册能力，支持全局图标替换。

```js
import { Icons, svg } from '@kupola/components/icons'

const icon = svg('search', { size: 16 })
document.body.innerHTML = icon
```

## 常用能力

- 使用内置图标
- 设置尺寸、颜色和 class
- 注册自定义图标
- 全局替换组件图标

## 适用场景

- 按钮图标
- 菜单图标
- 空态和提示图标
- 组件内置图标替换

## 基础用法

```js
import { Icons } from '@kupola/components/icons';

// 获取 SVG 字符串
const svg = Icons.svg('user');

// 渲染所有图标到页面
Icons.render(document.body);

// 注册自定义图标
Icons.registerIcons({
  custom: '<path d="..."/>'
});
```

## 全局图标替换

Kupola 组件使用内置图标，你可以通过 `registerIcons` 全局替换这些图标：

```js
import { registerIcons } from '@kupola/components/icon-config';

registerIcons({
  'x': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
  'chevron-down': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>',
  'check-circle': '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>',
});
```

### 可替换的图标名称

| 图标名称 | 使用场景 | 组件 |
|---------|---------|------|
| `x` | 关闭按钮 | Modal, Drawer |
| `chevron-left` | 左箭头 | Carousel, Datepicker, Pagination, ImagePreview |
| `chevron-right` | 右箭头 | Carousel, Datepicker, Pagination, ImagePreview |
| `chevron-down` | 下箭头 | Dropdown, Select, Collapse |
| `check-circle` | 成功状态 | Dialog, Message, Notification |
| `alert-triangle` | 警告状态 | Dialog, Message, Notification |
| `x-circle` | 错误状态 | Dialog, Message, Notification |
| `info-circle` | 信息状态 | Dialog, Message, Notification |
| `calendar` | 日历图标 | Datepicker |
| `clock` | 时钟图标 | Timepicker |
| `plus` | 添加按钮 | DynamicTags |
| `upload` | 上传图标 | FileUpload |
| `table` | 空态图标 | Empty |

## 第三方图标库集成

Kupola 支持与所有主流图标库集成。以下是常见图标库的集成示例：

### Lucide Icons

```js
import { registerIcons } from '@kupola/components/icon-config';
import { X, ChevronDown, CheckCircle } from 'lucide-static';

registerIcons({
  'x': X,
  'chevron-down': ChevronDown,
  'check-circle': CheckCircle,
});
```

### Heroicons

```js
import { registerIcons } from '@kupola/components/icon-config';
import { X, ChevronDown, CheckCircle } from '@heroicons/24-solid';

registerIcons({
  'x': X,
  'chevron-down': ChevronDown,
  'check-circle': CheckCircle,
});
```

### Phosphor Icons

```js
import { registerIcons } from '@kupola/components/icon-config';
import { X, ChevronDown, CheckCircle } from 'phosphor-react';

registerIcons({
  'x': () => X({ size: 20, weight: 'bold' }).props.children,
  'chevron-down': () => ChevronDown({ size: 20, weight: 'bold' }).props.children,
});
```

### Iconify

```js
import { registerIcons } from '@kupola/components/icon-config';
import { icon } from '@iconify/iconify';

registerIcons({
  'x': () => icon.renderHTML({ icon: 'mdi:close' }),
  'chevron-down': () => icon.renderHTML({ icon: 'mdi:chevron-down' }),
});
```

### Font Awesome (SVG mode)

```js
import { registerIcons } from '@kupola/components/icon-config';
import { X, ChevronDown, CheckCircle } from '@fortawesome/free-solid-svg-icons';
import { dom, svg } from '@fortawesome/fontawesome-svg-core';
dom.i2svg();

registerIcons({
  'x': () => svg(X).html[0],
  'chevron-down': () => svg(ChevronDown).html[0],
  'check-circle': () => svg(CheckCircle).html[0],
});
```

### Font Awesome (Font mode)

```js
import { registerIcons } from '@kupola/components/icon-config';
import { library } from '@fortawesome/fontawesome-svg-core';
import { X, ChevronDown, CheckCircle } from '@fortawesome/free-solid-svg-icons';
library.add(X, ChevronDown, CheckCircle);

registerIcons({
  'x': '<i class="fa-solid fa-xmark"></i>',
  'chevron-down': '<i class="fa-solid fa-chevron-down"></i>',
  'check-circle': '<i class="fa-solid fa-circle-check"></i>',
});
```

### Material Symbols (Font mode)

```html
<!-- 在 HTML head 中添加 CSS -->
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght@400&display=swap">
```

```js
import { registerIcons } from '@kupola/components/icon-config';

registerIcons({
  'x': { type: 'font', class: 'material-symbols-outlined' },
  'chevron-down': { type: 'font', class: 'material-symbols-outlined' },
  'check-circle': { type: 'font', class: 'material-symbols-outlined' },
});
```

### 自定义 SVG

```js
import { registerIcons } from '@kupola/components/icon-config';

registerIcons({
  'x': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><line x1="18" y1="6" x2="6" y2="18"/></svg>',
});
```

## API

### `registerIcons(iconsMap)`

全局注册自定义图标，替换组件内置图标。

| 参数 | 类型 | 说明 |
|------|------|------|
| `iconsMap` | `Object` | 图标名称到 SVG 字符串或函数的映射 |

### `getIcon(name)`

获取已注册的图标。

### `clearIcons()`

清除所有自定义图标，恢复默认图标。