# Kupola Design System - 项目总结

## 一、项目概述

Kupola 是一个轻量级设计系统，专为 Python Web 项目（Flask/Django）设计，无需 React/Vue 等重型框架。

### 项目历史

| 阶段 | 时间 | 事件 |
|------|------|------|
| Nimbus | 初始版本 | 项目创建，命名为 Nimbus Design System |
| 重构 | 2026-07 | 代码重构，修复响应式、HTTP、内存泄漏等问题 |
| 重命名 | 2026-07-09 | 项目从 Nimbus 重命名为 Kupola |
| 清理 | 2026-07-09 | 清理无用文件，优化项目结构 |
| GitHub | 2026-07-09 | 推送到 GitHub 仓库 `github.com/kupola-cn/kupola` |

### 核心特性

- **50+ 组件**：按钮、输入框、卡片、弹窗、日期选择器、时间选择器、热力图、虚拟列表等
- **双主题**：深色优先设计，支持浅色主题
- **11 个品牌色**：可切换的品牌色彩系统
- **响应式设计**：适配 PC、平板、手机
- **无障碍**：符合 WCAG AA 标准
- **表单验证**：内置验证规则，支持自定义规则
- **数据绑定**：基于 Proxy 的双向数据绑定系统
- **无依赖**：纯 HTML/CSS/JavaScript

---

## 二、架构设计

### 架构原则

```
┌──────────────────────────────────────────────────────┐
│                   HTML 层（后端渲染）                │
│   Jinja2/Django 模板输出语义化 HTML                 │
│   data-bind / data-component / data-validate 属性   │
├──────────────────────────────────────────────────────┤
│                   CSS 层（视觉增强）                │
│   CSS 变量 + BEM 命名 + 双主题支持                  │
│   即使 JS 未加载，页面依然可用                      │
├──────────────────────────────────────────────────────┤
│                   JS 层（交互增强）                │
│   IIFE + window 全局挂载，无需打包器                │
│   MutationObserver 自动检测并初始化组件            │
│   响应式系统（Proxy）+ 组合式 API                  │
└──────────────────────────────────────────────────────┘
```

### 组件生命周期

```
创建 → init() → 挂载 → 更新 → 销毁 → destroy()
```

通过 `KupolaLifecycle` 和 `GlobalEventManager` 统一管理组件生命周期。

### 响应式系统

基于 Proxy 实现，支持：
- `ref()` - 基础响应式引用
- `reactive()` - 响应式对象
- `computed()` - 计算属性（自动依赖追踪）

---

## 三、项目结构

```
kupola/
├── css/                    # CSS 样式表（13个文件）
│   ├── kupola.css          # 主样式入口
│   ├── components.css      # 组件样式
│   ├── theme-dark.css      # 深色主题
│   ├── theme-light.css     # 浅色主题
│   └── ...                 # 其他样式
├── js/                     # JavaScript 模块（40+个）
│   ├── kupola-core.js      # 核心框架
│   ├── kupola-lifecycle.js # 生命周期管理
│   ├── component.js        # 组件基类
│   ├── data-bind.js        # 数据绑定
│   ├── composition-api.js  # 组合式 API
│   ├── http.js             # HTTP 客户端
│   ├── router.js           # 路由系统
│   ├── theme.js            # 主题切换
│   └── ...                 # UI 组件
├── icons/                  # SVG 图标（133个）
├── dist/                   # 构建产物
│   ├── kupola.esm.js       # ES Module 格式
│   ├── kupola.cjs.js       # CommonJS 格式
│   ├── kupola.umd.js       # UMD 格式
│   └── types/kupola.d.ts   # TypeScript 类型定义
├── src/                    # 构建入口
├── utils/                  # Python 工具函数
├── dashboard/              # 仪表盘模板
├── casepages/              # 组件展示页面
├── examples/               # 使用示例
├── test/                   # 测试文件
├── docs/                   # 文档
└── package.json            # 构建脚本
```

---

## 四、核心功能

### 1. 组件系统

| 类别 | 组件 |
|------|------|
| **基础** | Button, Input, Textarea, Select, Checkbox, Radio, Switch |
| **数据** | Table, Pagination, VirtualList, DynamicTags |
| **反馈** | Modal, Dialog, Message, Notification, Tooltip |
| **导航** | Tabs, Dropdown, Breadcrumb |
| **表单** | Form, DatePicker, TimePicker, ColorPicker |
| **数据可视化** | Heatmap, StatCard |
| **其他** | Carousel, Drawer, Collapse, Upload |

### 2. 数据绑定

```html
<input type="text" data-bind="user.name:value">
<span data-bind="user.name:text"></span>
<input type="checkbox" data-bind="user.active:checked">
```

```javascript
kupolaData.data.user = { name: 'John', active: true };
kupolaData.data.user.name = 'Jane';
```

### 3. 组合式 API

```javascript
setup(() => {
    const count = ref(0);
    const doubled = computed(() => count.value * 2);
    
    onMounted(() => {
        console.log('组件挂载');
    });
    
    return { count, doubled };
});
```

### 4. 主题系统

```javascript
setTheme('dark');        // 切换到深色主题
setTheme('light');       // 切换到浅色主题
setBrand('zengqing');    // 设置品牌色
```

### 5. HTTP 客户端

```javascript
const http = createHttp({ baseURL: '/api' });
http.get('/users');
http.post('/login', { username, password });
http.cancelRequest('/users');
http.cancelAllRequests();
```

---

## 五、使用方法

### 快速开始

```html
<!-- 引入 CSS -->
<link rel="stylesheet" href="kupola/css/kupola.css">

<!-- 引入 JavaScript -->
<script src="kupola/js/kupola-core.js"></script>

<!-- 使用组件 -->
<button class="ds-btn ds-btn--brand">提交</button>
<input type="text" class="ds-input" placeholder="输入内容">
```

### ES Module 方式

```javascript
import { KupolaComponent, ref, reactive, createHttp } from 'kupola';
```

### 构建命令

```bash
npm install          # 安装依赖
npm run build        # 生产构建（Vite）
npm run build:rollup # 备选构建（Rollup）
npm run dev          # 开发服务器
npm run test         # 运行测试
npm run lint         # 代码检查
```

---

## 六、构建系统

### 构建工具

- **Vite ^5.4.1**：主要构建工具，生成 ESM/CJS/UMD 格式
- **Rollup**：备选构建工具，兼容更多场景

### 构建产物

| 文件 | 大小 | 说明 |
|------|------|------|
| `dist/kupola.esm.js` | ~332 kB | ES Module 格式 |
| `dist/kupola.cjs.js` | ~254 kB | CommonJS 格式 |
| `dist/kupola.umd.js` | ~254 kB | UMD 格式 |

---

## 七、分支管理

### 分支策略

```
main                    # 生产分支（稳定版本）
└── develop             # 开发分支（日常开发）
    ├── feature/xxx     # 功能分支
    ├── fix/xxx         # 修复分支
    └── release/xxx     # 发布分支
```

### 工作流程

```bash
# 切换到开发分支
git checkout develop

# 创建功能分支
git checkout -b feature/new-component

# 开发完成后推送
git push github feature/new-component

# 创建 PR 到 develop
# 合并后删除分支
```

---

## 八、贡献指南

### 代码规范

- **JavaScript**：使用 ESLint 检查，遵循 Airbnb 规范
- **CSS**：使用 BEM 命名规范
- **提交信息**：使用 Conventional Commits 格式

### 开发流程

1. Fork 仓库
2. 创建功能分支 `feature/xxx`
3. 开发并测试
4. 创建 PR 到 `develop` 分支
5. 等待审核和合并

---

## 九、迁移指南（从 Nimbus）

### 名称变更

| 旧名称 | 新名称 |
|--------|--------|
| `NimbusComponent` | `KupolaComponent` |
| `NimbusHttp` | `KupolaHttp` |
| `window.nimbusData` | `window.kupolaData` |
| `nimbus-core.js` | `kupola-core.js` |
| `nimbus.css` | `kupola.css` |

### 引用路径变更

| 旧路径 | 新路径 |
|--------|--------|
| `/nimbus-js/` | `/kupola-js/` |
| `/nimbus-css/` | `/kupola-css/` |
| `/nimbus-dist/` | `/kupola-dist/` |

---

## 十、版本历史

| 版本 | 日期 | 变更 |
|------|------|------|
| 1.2.0 | 2026-07-09 | 项目重命名为 Kupola，清理无用文件 |
| 1.1.0 | 2026-07 | 修复响应式系统、HTTP 取消、内存泄漏 |
| 1.0.0 | 初始 | Nimbus Design System 发布 |

---

## 十一、相关链接

- **GitHub**：https://github.com/kupola-cn/kupola
- **Gitee**：https://gitee.com/coln/nimbus
- **文档**：docs/api.md, docs/kupola-vs-vue-react.md
- **集成指南**：INTEGRATION.md
- **组件展示**：dashboard/showcase.html

---

## 十二、许可证

MIT License