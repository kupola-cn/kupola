# AI Agent 技能（SKILL.md）

Kupola 提供标准化的 `SKILL.md` 文件，让 AI 编程助手（如 Qoder、Cursor）在开发 Kupola 项目时自动遵循框架规范和最佳实践。

## 什么是 SKILL.md

SKILL.md 是一份结构化的开发规范文档，AI Agent 在处理 Kupola 相关任务时会自动加载，内容包括：

- **核心架构**：Signal 响应式、模板字面量、指令系统
- **组件模式**：工厂函数模式标准写法
- **CSS 规范**：`kupola-` 前缀命名约定
- **响应式 API**：Signal/Computed/Effect/Batch 正确用法
- **Theme API**：防 FOUC 主题系统 6 个 API
- **指令系统**：`k-*` 指令完整参考
- **反模式警告**：常见错误及正确替代方案
- **文件结构**：快速定位源码/测试/构建配置

## 使用方式

### Qoder

在项目的 `skills/` 目录下放置 SKILL.md，Qoder 会自动识别并注册为技能插件：

```
your-project/
└── skills/
    └── kupola-dev/
        └── SKILL.md
```

加载后，每次与 Kupola 代码交互时，AI 会自动遵循规范。

### 其他 AI 工具

将 SKILL.md 内容粘贴到 AI 工具的上下文或系统提示中即可。

## 规范摘要

### Signal 读写

```javascript
// ✅ 正确
const count = signal(0);
count.value;       // 读
count.value = 5;   // 写

// ❌ 错误
count();   // 不要当函数调用
count = 5; // 不要直接赋值
```

### 组件工厂模式

```javascript
export function MyComponent(options = {}) {
  const element = document.createElement('div');
  const state = signal(initialValue);
  effect(() => { /* render */ });
  return { element, destroy() {} };
}
```

### CSS 类名

```css
/* ✅ */ .kupola-modal { }
/* ❌ */ .modal { }  .ds-modal { }
```

### 防 FOUC 主题初始化

```html
<head>
  <script type="module">
    import { themePreload } from '@kupola/kupola';
    themePreload(); // 在首次绘制前设置 data-theme
  </script>
</head>
```

## 完整内容

见仓库根目录 [`SKILL.md`](https://github.com/kupola-cn/kupola/blob/main/SKILL.md)。
