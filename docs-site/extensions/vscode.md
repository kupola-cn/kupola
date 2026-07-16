# VS Code 扩展

`vscode-kupola` 为 Kupola 框架提供指令智能提示、代码片段和悬浮文档，要求 VS Code 1.80+。

## 安装

```bash
# 从 VSIX 文件安装
code --install-extension vscode-kupola-1.0.0.vsix
```

或在 VS Code 中：`Ctrl+Shift+P` → `Extensions: Install from VSIX...`

## 功能

### 指令自动补全（HTML 文件）

输入 `k-` 时弹出所有 Kupola 指令，附带用法说明：

| 指令 | 说明 |
|------|------|
| `k-data` | 创建响应式作用域 |
| `k-text` | 绑定 textContent |
| `k-html` | 绑定 innerHTML（注意 XSS） |
| `k-show` | 条件显示（display:none 切换） |
| `k-if` / `k-else` | 条件渲染（DOM 增删） |
| `k-for` | 列表渲染（支持 index） |
| `k-model` | 双向绑定（input/select/checkbox） |
| `k-cloak` | 防 FOUC，初始化前隐藏 |
| `k-bind:*` | 动态属性绑定（class/style/disabled/value） |
| `k-on:*` | 事件监听（click/submit/keydown/change/input/focus/blur/mouseenter/mouseleave） |

### 悬浮文档

鼠标悬停在任意 `k-*` 指令上，显示详细说明和代码示例：

```html
<!-- 悬停 k-for -->
List rendering. Use on <template> for best performance.

<template k-for="item in items">
  <li k-text="item.name"></li>
</template>

With index:
<template k-for="(item, index) in items">...</template>
```

### 代码片段（Snippets）

#### HTML 片段

| 触发词 | 展开内容 |
|--------|---------|
| `kdata` | `<div k-data="{ ... }">...</div>` |
| `kfor` | `<template k-for="item in items">...</template>` |
| `kmodel` | `<input k-model="..." />` |
| `kbind` | `k-bind:class="..."` |
| `kon` | `k-on:click="..."` |
| `kmodal` | Modal 弹窗完整模板 |
| `ktable` | Table 组件配置模板 |
| `kform` | Form 表单验证模板 |

#### JavaScript 片段

| 触发词 | 展开内容 |
|--------|---------|
| `ksignal` | `const name = signal(value)` |
| `kcomputed` | `const name = computed(() => ...)` |
| `keffect` | `effect(() => { ... })` |
| `kcomponent` | 完整组件工厂模板（signal + html + render） |
| `krender` | `render(view(), container)` |
| `kwalk` | `walk(document.body)` 指令初始化 |

## 配置

无需额外配置，安装后自动激活（HTML 和 JavaScript 文件）。

## 技术实现

- `html-custom-data.json` — 指令补全 + 悬浮文档（VS Code HTML 语言服务）
- `snippets/kupola.json` — HTML 代码片段
- `snippets/kupola-js.json` — JavaScript 代码片段
# VS Code 扩展

`kupola-vscode` 提供 Kupola 指令的智能提示、代码片段和悬浮文档。

## 安装

在 VS Code 扩展商店搜索 `Kupola` 安装，或从 VSIX 文件手动安装。

## 功能

### 指令自动补全

输入 `k-` 时自动弹出指令列表：

```
k-data      创建响应式作用域
k-show      条件显示
k-bind      动态属性绑定
k-on        事件监听
k-model     双向绑定
k-for       列表渲染
k-text      响应式文本
k-html      响应式 HTML
```

### 悬浮文档

鼠标悬停在指令上时显示用法说明：

```html
<!-- 悬停 k-model -->
k-model: 双向数据绑定
支持: input, select, textarea
示例: <input k-model="name">
```

### 代码片段

输入触发词快速生成常用结构：

| 触发词 | 展开内容 |
|--------|---------|
| `kcomponent` | 完整组件模板（signal + html + render） |
| `kdirective` | 自定义指令注册模板 |
| `ktable` | Table 组件配置模板 |
| `kmodal` | Modal 弹窗模板 |
| `kform` | Form 表单验证模板 |

## 配置

无需额外配置，安装后自动生效。

支持的指令语法高亮：
- `k-*` 属性指令
- `{{ }}` 插值表达式
- `@kupola/kupola` 导入路径
