# Icons 图标

提供内置 SVG 图标和自定义注册能力，支持全局图标替换。

## 基础用法

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

### Icons 基础用法

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

---

## svg(name, options)

创建 SVG 图标元素，返回 SVG 字符串。

```js
import { svg } from '@kupola/components/icons'

// 基础用法：指定图标名称
const searchIcon = svg('search')

// 设置尺寸
const largeIcon = svg('user', { size: 32 })
const customSize = svg('settings', { width: 24, height: 24 })

// 设置颜色
const redIcon = svg('heart', { color: '#ff4d4f' })
const currentColor = svg('star', { color: 'currentColor' })

// 添加 CSS 类名
const styledIcon = svg('download', { class: 'icon-download' })

// 添加自定义属性
const iconWithAttrs = svg('share', {
  size: 20,
  color: '#1890ff',
  class: 'icon-share',
  attrs: { 'data-tooltip': '分享', 'aria-label': '分享' },
})

// 组合使用
const buttonIcon = svg('plus', {
  size: 14,
  color: '#fff',
  class: 'button-icon',
})

document.querySelector('.btn').innerHTML = buttonIcon + ' 添加'
```

### 选项参数

| 选项 | 类型 | 说明 |
| --- | --- | --- |
| `size` | `number` | 图标尺寸，同时设置 width 和 height |
| `width` | `number` | 图标宽度 |
| `height` | `number` | 图标高度 |
| `color` | `string` | 图标颜色 |
| `class` | `string` | CSS 类名 |
| `attrs` | `object` | 自定义属性对象 |

---

## render(name, options)

将图标渲染为 HTML 字符串，与 `svg()` 类似但更明确语义。

```js
import { render } from '@kupola/components/icons'

// 渲染单个图标
const iconHtml = render('search', { size: 16 })

// 渲染到 DOM
const container = document.getElementById('iconContainer')
container.innerHTML = render('user', { size: 24, color: '#333' })

// 批量渲染图标
const iconNames = ['home', 'user', 'settings', 'logout']
const iconsHtml = iconNames.map(name =>
  render(name, { size: 20, color: '#666' })
).join('')

document.getElementById('iconBar').innerHTML = iconsHtml
```

---

## PATHS — 内置图标路径

Kupola 内置了丰富的 SVG 图标路径，可通过 `PATHS` 访问所有内置图标的路径数据。

```js
import { PATHS } from '@kupola/components/icons'

// 查看所有内置图标名称
console.log(Object.keys(PATHS))
// ['x', 'chevron-left', 'chevron-right', 'chevron-down', 'chevron-up',
//  'check', 'check-circle', 'alert-triangle', 'x-circle', 'info-circle',
//  'search', 'user', 'home', 'settings', 'calendar', 'clock', 'plus',
//  'minus', 'edit', 'trash', 'download', 'upload', 'star', 'heart',
//  'share', 'table', 'filter', 'eye', 'eye-off', 'menu', ...]

// 查看单个图标的路径数据
console.log(PATHS['search'])
// '<path d="..." />'

// 基于内置路径创建自定义图标
const customSearchIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${PATHS['search']}</svg>`
```

---

## registerIcons(icons)

全局注册自定义图标，替换组件内置图标。

```js
import { registerIcons } from '@kupola/components/icons'

// 注册单个图标
registerIcons({
  customIcon: '<path d="M10 10 L20 20 M10 20 L20 10" stroke="currentColor" stroke-width="2"/>',
})

// 批量注册
registerIcons({
  'x': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
  'chevron-down': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="6 9 12 15 18 9"/></svg>',
  'check-circle': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
})

// 注册返回 SVG 的函数（支持动态配置）
registerIcons({
  dynamicIcon: (options) => {
    const { size = 24, color = 'currentColor' } = options || {}
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}"><circle cx="12" cy="12" r="10"/></svg>`
  },
})
```

### 全局图标替换

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

---

## registerGroup(name, icons)

注册图标分组，方便按模块管理图标。

```js
import { registerGroup } from '@kupola/components/icons'

// 注册导航图标组
registerGroup('navigation', {
  'home': '<path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>',
  'dashboard': '<path d="..."/>',
  'analytics': '<path d="..."/>',
})

// 注册操作图标组
registerGroup('actions', {
  'add': '<path d="M12 5v14M5 12h14"/>',
  'edit': '<path d="..."/>',
  'delete': '<path d="..."/>',
})

// 使用分组内的图标
import { svg } from '@kupola/components/icons'
const homeIcon = svg('navigation:home', { size: 24 })
const addIcon = svg('actions:add', { size: 20, color: '#1890ff' })
```

---

## registerAllGroups(groups)

一次性注册多个图标分组。

```js
import { registerAllGroups } from '@kupola/components/icons'

registerAllGroups({
  // 导航图标组
  navigation: {
    'home': '<path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>',
    'dashboard': '<path d="..."/>',
    'analytics': '<path d="..."/>',
  },
  // 操作图标组
  actions: {
    'add': '<path d="M12 5v14M5 12h14"/>',
    'edit': '<path d="..."/>',
    'delete': '<path d="..."/>',
  },
  // 状态图标组
  status: {
    'success': '<path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>',
    'warning': '<path d="..."/>',
    'error': '<path d="..."/>',
  },
})
```

---

## iconGroups — 列出所有注册的分组

```js
import { iconGroups } from '@kupola/components/icons'

// 获取所有已注册的分组名称
const groups = iconGroups()
console.log(groups) // ['navigation', 'actions', 'status']

// 检查分组是否存在
if (iconGroups().includes('navigation')) {
  console.log('导航图标组已注册')
}
```

---

## registerIconProvider(provider)

注册自定义图标提供器，用于统一管理图标的查找和渲染逻辑。

```js
import { registerIconProvider } from '@kupola/components/icons'

const customProvider = {
  // 根据名称获取图标内容
  getIcon(name) {
    // 自定义图标查找逻辑，例如从远程 CDN 加载
    return fetch(`https://icons.example.com/${name}.svg`)
      .then(res => res.text())
  },

  // 渲染图标为 HTML
  renderIcon(name, options) {
    const svg = this.getIcon(name)
    // 应用尺寸和颜色
    return svg
  },
}

registerIconProvider(customProvider)
```

---

## createKupolaIconProvider()

创建 Kupola 默认的图标提供器实例。

```js
import { createKupolaIconProvider } from '@kupola/components/icons'

// 创建默认提供器
const provider = createKupolaIconProvider()

// 扩展默认提供器
const extendedProvider = createKupolaIconProvider({
  // 附加自定义图标
  icons: {
    'custom-logo': '<path d="..."/>',
  },
  // 默认选项
  defaults: {
    size: 24,
    color: 'currentColor',
  },
})
```

---

## createIconComponent(name, options)

创建可复用的图标组件，返回一个渲染函数。

```js
import { createIconComponent } from '@kupola/components/icons'

// 创建固定配置的图标组件
const SearchIcon = createIconComponent('search', { size: 20, color: '#666' })
const CloseIcon = createIconComponent('x', { size: 16 })

// 像使用普通组件一样使用
document.getElementById('searchBtn').appendChild(SearchIcon())

// 运行时覆盖选项
const bigSearchIcon = SearchIcon({ size: 32, color: '#1890ff' })
```

---

## setupIconResolver(provider)

设置全局图标解析器，所有组件的图标渲染都通过此解析器。

```js
import { setupIconResolver } from '@kupola/components/icons'

// 使用自定义提供器作为全局解析器
const provider = createKupolaIconProvider({
  icons: {
    'x': '<svg>...</svg>',
    'chevron-down': '<svg>...</svg>',
  },
})

setupIconResolver(provider)

// 现在所有组件都使用自定义图标
// Modal 的关闭按钮、Select 的下拉箭头等都会使用注册的自定义图标
```

---

## 第三方图标库集成

### 支持情况

| 图标库 | 输出格式 | 支持方式 | 状态 |
|--------|----------|----------|------|
| **Lucide** | SVG 字符串 | 直接使用 | ✅ 完全支持 |
| **Heroicons** | SVG 字符串 | 直接使用 | ✅ 完全支持 |
| **Phosphor Icons** | SVG 字符串 | 函数包装 | ✅ 完全支持 |
| **Iconify** | SVG 字符串 | renderHTML | ✅ 完全支持 |
| **Font Awesome** | SVG / 字体 | SVG 模式或字体模式 | ✅ 完全支持 |
| **Material Symbols** | 字体 | 字体模式 | ✅ 完全支持 |
| **Tabler Icons** | SVG 字符串 | 直接使用 | ✅ 完全支持 |

### 图标格式支持

Kupola 的图标系统支持三种格式：

| 格式 | 说明 | 示例 |
|------|------|------|
| **SVG 字符串** | 直接传入 SVG HTML 字符串 | `'<svg>...</svg>'` |
| **函数** | 返回 SVG 字符串的函数，支持动态配置 | `() => '<svg>...</svg>'` |
| **字体对象** | 用于字体图标 | `{ type: 'font', class: 'material-symbols-outlined' }` |

以下是常见图标库的集成示例：

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

---

## 完整示例：自定义图标集集成

以下是一个完整的自定义图标集集成示例，展示如何注册自定义图标、使用图标分组、创建图标组件并与 Kupola 组件集成。

```js
import {
  svg,
  render,
  PATHS,
  registerIcons,
  registerGroup,
  registerAllGroups,
  registerIconProvider,
  createKupolaIconProvider,
  createIconComponent,
  setupIconResolver,
  iconGroups,
} from '@kupola/components/icons'

// ==========================================
// 1. 注册自定义图标分组
// ==========================================
registerAllGroups({
  // 业务图标组
  business: {
    'invoice': '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>',
    'contract': '<path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/>',
    'report': '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="10" y1="13" x2="16" y2="13"/><line x1="10" y1="17" x2="13" y2="17"/>',
  },
  // 社交图标组
  social: {
    'wechat': '<path d="..."/>',
    'weibo': '<path d="..."/>',
    'github': '<path d="..."/>',
  },
})

// ==========================================
// 2. 替换 Kupola 组件内置图标
// ==========================================
registerIcons({
  'x': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
  'chevron-down': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>',
  'chevron-left': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>',
  'chevron-right': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="9 18 15 12 9 6"/></svg>',
  'check-circle': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
  'alert-triangle': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
})

// ==========================================
// 3. 创建可复用的图标组件
// ==========================================
const InvoiceIcon = createIconComponent('business:invoice', { size: 20 })
const ContractIcon = createIconComponent('business:contract', { size: 20 })
const ReportIcon = createIconComponent('business:report', { size: 20 })

// ==========================================
// 4. 创建自定义图标提供器
// ==========================================
const provider = createKupolaIconProvider({
  icons: {
    'logo': '<path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>',
  },
  defaults: {
    size: 24,
    color: 'currentColor',
    class: 'kupola-icon',
  },
})

// 设置全局解析器
setupIconResolver(provider)

// ==========================================
// 5. 使用图标
// ==========================================

// 使用 svg() 创建图标
const searchIcon = svg('search', { size: 16, color: '#999' })
document.getElementById('searchBox').insertAdjacentHTML('afterbegin', searchIcon)

// 使用 render() 渲染图标
const toolbar = document.getElementById('toolbar')
toolbar.innerHTML = `
  <button>${render('business:invoice', { size: 16 })} 发票</button>
  <button>${render('business:contract', { size: 16 })} 合同</button>
  <button>${render('business:report', { size: 16 })} 报表</button>
`

// 使用图标组件
const header = document.getElementById('header')
header.appendChild(InvoiceIcon({ size: 28, color: '#1890ff' }))

// 查看所有已注册的分组
console.log('已注册图标分组:', iconGroups())
// ['business', 'social']

// 查看内置图标
console.log('内置图标数量:', Object.keys(PATHS).length)
```

---

## API 参考

### `registerIcons(iconsMap)`

全局注册自定义图标，替换组件内置图标。

| 参数 | 类型 | 说明 |
|------|------|------|
| `iconsMap` | `Object` | 图标名称到 SVG 字符串或函数的映射 |

### `getIcon(name)`

获取已注册的图标。

### `clearIcons()`

清除所有自定义图标，恢复默认图标。

### `svg(name, options)`

创建 SVG 图标字符串。

| 参数 | 类型 | 说明 |
|------|------|------|
| `name` | `string` | 图标名称，支持分组前缀（如 `group:name`） |
| `options` | `object` | 可选配置（size, color, class, attrs） |

### `render(name, options)`

渲染图标为 HTML 字符串。

### `registerGroup(name, icons)`

注册图标分组。

### `registerAllGroups(groups)`

一次性注册多个分组。

### `iconGroups()`

返回所有已注册的分组名称列表。

### `registerIconProvider(provider)`

注册自定义图标提供器。

### `createKupolaIconProvider(options)`

创建默认图标提供器。

### `createIconComponent(name, defaults)`

创建可复用图标组件。

### `setupIconResolver(provider)`

设置全局图标解析器。

---

## 说明

- 图标名称支持 `group:name` 格式引用分组内的图标，如 `business:invoice`。
- `registerIcons` 注册的图标会覆盖同名的内置图标，用于全局替换组件图标。
- 图标提供器（provider）是更高层的抽象，适合需要统一管理图标加载策略的场景。
- `createIconComponent` 返回的是一个函数，调用时传入 `options` 可覆盖默认配置。
- 当图标内容为函数时，Kupola 会在渲染时调用该函数并传入 `options` 参数，实现动态图标生成。