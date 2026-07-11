# @kupola/kupola 使用指南

本文档介绍如何在不同场景下使用 `@kupola/kupola` UI 库。

---

## 📦 安装

```bash
npm install @kupola/kupola
```

---

## 🎯 使用方式总览

| 方式 | 适用场景 | 是否需要构建工具 | 难度 |
|------|---------|----------------|------|
| [方式 1](#方式-1-umd--cdn-推荐新手) | 快速原型、简单项目 | ❌ 不需要 | ⭐ |
| [方式 2](#方式-2-umd--node_modules) | 传统项目、无构建工具 | ❌ 不需要 | ⭐⭐ |
| [方式 3](#方式-3-es6--vite-推荐生产) | 现代项目、大型应用 | ✅ 需要 Vite | ⭐⭐⭐ |
| [方式 4](#方式-4-es6--cdn-无需构建) | 中等项目、想使用 ES6 | ❌ 不需要 | ⭐⭐ |

---

## 方式 1: UMD + CDN（推荐新手）

**最简单的方式**，无需任何配置，直接在 HTML 中引入。

### 示例代码

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>Kupola Demo</title>
    <!-- 引入 CSS -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@kupola/kupola/dist/css/kupola.css">
</head>
<body>
    <!-- 使用 Kupola 组件 -->
    <div class="ds-dropdown" id="myDropdown">
        <button type="button" class="ds-dropdown__trigger ds-input">
            <span>请选择</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
        </button>
        <div class="ds-dropdown__menu">
            <div class="ds-dropdown__item is-selected" data-value="">请选择</div>
            <div class="ds-dropdown__item" data-value="1">选项 1</div>
            <div class="ds-dropdown__item" data-value="2">选项 2</div>
        </div>
    </div>

    <!-- 引入 UMD JS -->
    <script src="https://cdn.jsdelivr.net/npm/@kupola/kupola/dist/kupola.umd.js"></script>
    
    <script>
        // 通过全局变量 Kupola 使用
        document.addEventListener('DOMContentLoaded', function() {
            // 初始化 dropdown
            Kupola.initDropdowns();
            
            // 其他 API
            Kupola.setTheme('dark');
            Kupola.initModals();
        });
    </script>
</body>
</html>
```

### 优点
- ✅ 零配置，复制即用
- ✅ 无需安装 Node.js
- ✅ 适合快速原型开发

### 缺点
- ❌ 无法 Tree Shaking（包体积较大）
- ❌ 依赖 CDN 稳定性

---

## 方式 2: UMD + node_modules

适合传统项目，通过 npm 管理依赖，但不使用构建工具。

### 项目结构

```
my-project/
├── package.json
├── node_modules/
│   └── @kupola/kupola/
├── index.html
└── js/
    └── app.js
```

### 步骤

#### 1. 安装依赖

```bash
npm init -y
npm install @kupola/kupola
```

#### 2. 创建 HTML

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>Kupola Demo</title>
    <!-- 从 node_modules 引用 CSS -->
    <link rel="stylesheet" href="/node_modules/@kupola/kupola/dist/css/kupola.css">
</head>
<body>
    <button class="ds-btn ds-btn--primary" onclick="showMessage()">点击我</button>
    
    <!-- 从 node_modules 引用 UMD JS -->
    <script src="/node_modules/@kupola/kupola/dist/kupola.umd.js"></script>
    <script src="/js/app.js"></script>
</body>
</html>
```

#### 3. 编写业务逻辑

```javascript
// js/app.js
function showMessage() {
    Kupola.Message.success('Hello, Kupola!');
}
```

#### 4. 启动服务器

使用任意静态服务器：

```bash
# 使用 http-server
npx http-server -p 3000

# 或使用 Python
python -m http.server 3000
```

### 优点
- ✅ 通过 npm 管理版本
- ✅ 无需构建工具
- ✅ 本地文件，加载更快

### 缺点
- ❌ 需要配置服务器支持 `/node_modules/` 路径
- ❌ 无法 Tree Shaking

---

## 方式 3: ES6 + Vite（推荐生产）

**现代前端项目的标准做法**，支持热更新、Tree Shaking、代码分割等高级特性。

### 项目结构

```
my-project/
├── package.json
├── vite.config.js
├── index.html
├── main.js
└── components/
    └── MyComponent.js
```

### 步骤

#### 1. 初始化项目

```bash
mkdir my-project && cd my-project
npm init -y
npm install @kupola/kupola
npm install -D vite
```

#### 2. 创建 Vite 配置

```javascript
// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist'
  }
});
```

#### 3. 创建入口 HTML

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>Kupola + Vite Demo</title>
</head>
<body>
    <div id="app">
        <h1>Hello, Kupola!</h1>
        <button class="ds-btn ds-btn--primary" id="testBtn">测试按钮</button>
    </div>
    
    <!-- 使用 ES6 模块 -->
    <script type="module" src="/main.js"></script>
</body>
</html>
```

#### 4. 编写主入口

```javascript
// main.js
import { 
  initDropdowns, 
  Message, 
  setTheme,
  Modal 
} from '@kupola/kupola';

// 导入 CSS
import '@kupola/kupola/kupola.css';

// 设置主题
setTheme('light');

// 初始化组件
document.addEventListener('DOMContentLoaded', () => {
  initDropdowns();
  
  // 绑定事件
  document.getElementById('testBtn').addEventListener('click', () => {
    Message.success('Vite + Kupola 工作正常！');
  });
});

// 导出供其他模块使用
export { Message, Modal };
```

#### 5. 启动开发服务器

```bash
npm run dev
# 或
npx vite
```

浏览器会自动打开 http://localhost:3000

#### 6. 生产构建

```bash
npm run build
# 输出到 dist/ 目录
```

### 优点
- ✅ 支持热更新（HMR），开发体验极佳
- ✅ Tree Shaking，自动移除未使用的代码
- ✅ 代码分割，按需加载
- ✅ TypeScript 支持
- ✅ 插件生态系统丰富

### 缺点
- ⚠️ 需要学习 Vite 配置
- ⚠️ 首次启动需要预构建依赖

---

## 方式 4: ES6 + CDN（无需构建）

想使用 ES6 模块语法，但不想配置构建工具。

### 示例代码

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>Kupola ESM Demo</title>
</head>
<body>
    <div class="ds-dropdown" id="myDropdown">
        <button type="button" class="ds-dropdown__trigger ds-input">
            <span>请选择</span>
        </button>
        <div class="ds-dropdown__menu">
            <div class="ds-dropdown__item" data-value="1">选项 1</div>
        </div>
    </div>

    <script type="module">
        // 直接从 CDN 导入 ES6 模块
        import { initDropdowns, Message } from 'https://cdn.jsdelivr.net/npm/@kupola/kupola/dist/kupola.esm.js';
        
        // 注意：CSS 仍需通过 link 标签引入
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://cdn.jsdelivr.net/npm/@kupola/kupola/dist/css/kupola.css';
        document.head.appendChild(link);
        
        // 使用
        document.addEventListener('DOMContentLoaded', () => {
            initDropdowns();
            Message.info('ESM + CDN 模式');
        });
    </script>
</body>
</html>
```

### 优点
- ✅ 使用标准的 ES6 模块语法
- ✅ 无需构建工具
- ✅ 浏览器原生支持

### 缺点
- ⚠️ 某些旧浏览器不支持 ES6 模块
- ⚠️ 无法进行代码优化

---

## 🎨 常用组件示例

### Dropdown 下拉框

```html
<div class="ds-dropdown" id="statusDropdown">
    <button type="button" class="ds-dropdown__trigger ds-input">
        <span>全部状态</span>
    </button>
    <div class="ds-dropdown__menu">
        <div class="ds-dropdown__item is-selected" data-value="">全部状态</div>
        <div class="ds-dropdown__item" data-value="active">启用</div>
        <div class="ds-dropdown__item" data-value="inactive">禁用</div>
    </div>
</div>

<script>
    // 初始化
    Kupola.initDropdowns();
    
    // 获取选中值
    const dropdown = document.getElementById('statusDropdown');
    const value = dropdown.getAttribute('data-value');
    
    // 动态设置选项
    dropdown._kupolaDropdown.setItems([
        { text: '选项 A', value: 'a' },
        { text: '选项 B', value: 'b' }
    ]);
</script>
```

### Modal 对话框

```javascript
// 方式 1: 编程式创建
Kupola.Modal.confirm({
    title: '确认操作',
    content: '确定要删除吗？',
    onConfirm: () => {
        console.log('已确认');
    }
});

// 方式 2: HTML 声明式
<div class="ds-modal" id="myModal">
    <div class="ds-modal__overlay"></div>
    <div class="ds-modal__content">
        <div class="ds-modal__header">标题</div>
        <div class="ds-modal__body">内容</div>
        <div class="ds-modal__footer">
            <button class="ds-btn" onclick="Kupola.Modal.close('myModal')">关闭</button>
        </div>
    </div>
</div>

<script>
    Kupola.initModals();
    Kupola.Modal.open('myModal');
</script>
```

### Message 消息提示

```javascript
Kupola.Message.success('操作成功');
Kupola.Message.error('操作失败');
Kupola.Message.warning('请注意');
Kupola.Message.info('提示信息');
```

### Theme 主题切换

```javascript
// 设置主题
Kupola.setTheme('dark');  // 或 'light'

// 获取当前主题
const currentTheme = Kupola.getTheme();

// 创建主题切换按钮
Kupola.createThemeToggle('#themeToggleBtn');
```

---

## 🔧 高级用法

### 按需引入（减少包体积）

```javascript
// 只引入需要的组件
import { initDropdowns } from '@kupola/kupola/dropdown';
import { Message } from '@kupola/kupola/message';
import { Modal } from '@kupola/kupola/modal';
```

### 自定义主题

```css
/* 覆盖 CSS 变量 */
:root {
    --color-primary: #1890ff;
    --color-success: #52c41a;
    --radius-base: 4px;
}
```

### 与框架集成

#### React

```jsx
import { useEffect } from 'react';
import { initDropdowns } from '@kupola/kupola';
import '@kupola/kupola/kupola.css';

function MyComponent() {
    useEffect(() => {
        initDropdowns();
    }, []);
    
    return <div className="ds-dropdown">...</div>;
}
```

#### Vue

```vue
<script setup>
import { onMounted } from 'vue';
import { initDropdowns } from '@kupola/kupola';
import '@kupola/kupola/kupola.css';

onMounted(() => {
    initDropdowns();
});
</script>

<template>
    <div class="ds-dropdown">...</div>
</template>
```

---

## 📚 API 参考

### 核心 API

| API | 说明 | 示例 |
|-----|------|------|
| `initDropdowns(root)` | 初始化下拉框 | `Kupola.initDropdowns()` |
| `initModals(root)` | 初始化模态框 | `Kupola.initModals()` |
| `setTheme(theme)` | 设置主题 | `Kupola.setTheme('dark')` |
| `getTheme()` | 获取当前主题 | `Kupola.getTheme()` |

### 组件 API

详见各组件文档：
- [Dropdown](./docs/components/dropdown.md)
- [Modal](./docs/components/modal.md)
- [Message](./docs/components/message.md)
- [Table](./docs/components/table.md)

---

## ❓ 常见问题

### Q1: 为什么我的 dropdown 点击没反应？

**A:** 确保在 DOM 加载完成后调用 `initDropdowns()`：

```javascript
document.addEventListener('DOMContentLoaded', () => {
    Kupola.initDropdowns();
});
```

如果是动态添加的元素，需要在添加后重新初始化：

```javascript
// 动态插入 HTML 后
container.innerHTML = '<div class="ds-dropdown">...</div>';
Kupola.initDropdowns(container);
```

### Q2: 如何自定义样式？

**A:** 通过 CSS 变量覆盖：

```css
:root {
    --color-primary: your-color;
    --radius-base: your-radius;
}
```

### Q3: Vite 报错 "Failed to scan for dependencies"？

**A:** 检查 package.json 的 exports 字段格式，应使用直接映射：

```json
{
  "exports": {
    "./kupola.css": "./dist/css/kupola.css",
    "./kupola.umd.js": "./dist/kupola.umd.js"
  }
}
```

而不是条件映射格式。

---

## 🚀 快速开始模板

### 最简模板（UMD + CDN）

[查看完整代码](./examples/minimal-umd.html)

### Vite 模板

[查看完整代码](./examples/vite-starter/)

---

## 📝 更新日志

详见 [CHANGELOG.md](../CHANGELOG.md)

---

## 💬 获取帮助

- 📖 [完整文档](https://github.com/kupola-cn/kupola/docs)
- 🐛 [问题反馈](https://github.com/kupola-cn/kupola/issues)
- 💬 [社区讨论](https://github.com/kupola-cn/kupola/discussions)

---

**Happy Coding! 🎉**
