# VS Code 扩展

`vscode-kupola` 为 Kupola 模板提供 HTML 指令补全、悬浮文档和代码片段，要求 VS Code 1.80+。

## 安装

```bash
code --install-extension vscode-kupola-1.0.0.vsix
```

也可以在 VS Code 中通过 `Extensions: Install from VSIX...` 安装。

## 指令补全

输入 `k-`、`@` 或 `:` 时可以获得常用指令提示：

| 指令 | 说明 |
|------|------|
| `k-data` | 创建响应式作用域 |
| `k-init` | 作用域初始化后执行一次 |
| `k-cloak` | 初始化前隐藏，处理后移除 |
| `k-ref` | 收集当前作用域的元素引用 |
| `k-text` | 绑定 textContent |
| `k-html` | 绑定 innerHTML，仅用于可信内容 |
| `k-show` | 切换 `display:none`，保留 DOM |
| `k-if` / `k-else-if` / `k-else` | 条件挂载和分支 |
| `k-for` | 列表渲染 |
| `k-model` | 表单双向绑定 |
| `k-model.debounce.300` | 防抖表单写入 |
| `k-class` | 条件 class |
| `k-style` | 条件 style |
| `k-transition` | `k-show` / `k-if` 过渡 class 生命周期 |
| `k-bind:*` / `:*` | 动态属性 |
| `k-on:*` / `@*` | 事件监听 |

事件补全覆盖 `.stop`、`.prevent`、`.once`、`.self`、`.outside`、`.enter`、`.escape`、`.debounce.300` 等常用写法。

## 代码片段

| 触发词 | 展开内容 |
|--------|----------|
| `k-data` | 基础作用域 |
| `k-if` / `k-ifelse` | 条件分支 |
| `k-for` / `k-fori` | 列表渲染 |
| `k-model` | 输入绑定 |
| `k-model-debounce` | 防抖输入绑定 |
| `k-class` | 条件 class |
| `k-style` | 条件 style |
| `k-transition` | 过渡 class 和 CSS |
| `k-ref` | 元素引用 |
| `k-init` | 初始化语句 |
| `k-submit` | `@submit.prevent` 表单 |
| `kupola-counter` | 计数器示例 |
| `kupola-form` | 表单示例 |

## 技术实现

- `html-custom-data.json`：HTML 语言服务补全和悬浮文档。
- `snippets/kupola.json`：HTML 代码片段。
- `snippets/kupola-js.json`：JavaScript 代码片段。
