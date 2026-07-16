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
