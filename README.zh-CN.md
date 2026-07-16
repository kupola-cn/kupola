[English](./README.md)

![npm](https://img.shields.io/npm/v/@kupola/kupola)
![bundlephobia](https://img.shields.io/bundlephobia/minzip/@kupola/kupola)
![Build Status](https://img.shields.io/github/actions/workflow/status/kupola-cn/kupola/ci.yml)
![License](https://img.shields.io/github/license/kupola-cn/kupola)

# Kupola

**一个零框架依赖的声明式 UI 引擎 + 组件库，适用于任何服务端渲染 Web 应用。**

---

## 核心特性

- ⚛️ **Signal 响应式**：基于 `signal` / `computed` / `effect` 的细粒度追踪，自动批量更新
- 📝 **模板字面量**：`html` 标签函数 + `render` 即时 DOM 绑定，无编译步骤
- 🖥️ **SSR 就绪**：`renderToString` + `hydrate` 纯净水合，零客户端闪烁
- 🧩 **48+ 组件按需引入**：Modal、Table、Dropdown、Form…每个组件独立打包，tree-shaking 友好
- 🪶 **极致轻量**：核心引擎 < 5KB gzip，无第三方依赖

---

## 最快上手

```html
<script src="https://cdn.jsdelivr.net/npm/@kupola/kupola/dist/kupola-core.umd.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@kupola/kupola/dist/kupola-core-directives.umd.js"></script>
<div k-data="{ count: 0 }">
  <button k-on:click="count++">点击了 {{ count }} 次</button>
</div>
<script>
  Kupola.walk(document.body);
</script>
```

或者使用编程式 API：

```html
<div id="app"></div>
<script type="module">
  import { signal, html, render } from 'https://cdn.jsdelivr.net/npm/@kupola/kupola/dist/kupola-core.esm.js';

  const count = signal(0);
  const view = () => html`<button @click=${() => count.value++}>点击了 ${count} 次</button>`;
  render(view(), document.getElementById('app'));
</script>
```

---

## 安装

> **当前版本**：`2.0.0`（正式版）：

```bash
npm install @kupola/kupola              # 完整包
# 或仅核心引擎
npm install @kupola/kupola/core          # signal + template + render + SSR
```

```bash
# CDN
https://cdn.jsdelivr.net/npm/@kupola/kupola/dist/kupola-core.esm.js
https://cdn.jsdelivr.net/npm/@kupola/kupola/dist/kupola-core.cjs
```

---

## 按需引入组件

每个组件独立打包，只引入你需要的：

```javascript
// 仅引入 Modal
import { Modal } from '@kupola/kupola/components/modal';

const modal = Modal({ title: '确认删除', content: '此操作不可撤销' });
modal.open();
```

```javascript
// 仅引入 Table
import { Table } from '@kupola/kupola/components/table';

const table = Table({
  columns: [
    { key: 'name', label: '姓名', sortable: true },
    { key: 'age', label: '年龄', sortable: true },
  ],
  data: [
    { name: '张三', age: 28 },
    { name: '李四', age: 34 },
  ],
  pageSize: 10,
});
document.body.appendChild(table.element);
```

---

## 核心引擎 API

```javascript
import { signal, computed, effect, batch, html, render } from '@kupola/kupola';

// Signal — 响应式状态
const count = signal(0);

// Computed — 派生值（自动追踪依赖）
const doubled = computed(() => count.value * 2);

// Effect — 副作用（自动重跑）
effect(() => console.log(`count = ${count.value}, doubled = ${doubled.value}`));

// Batch — 批量更新（合并多次变更为一次刷新）
batch(() => {
  count.value++;
  count.value++;
});

// Template + Render — 声明式 DOM
const view = () => html`
  <div class="counter">
    <p>Count: ${count}</p>
    <button @click=${() => count.value++}>+1</button>
  </div>
`;
render(view(), document.getElementById('app'));
```

---

## 指令系统（HTML 声明式）

无需构建工具，直接在 HTML 中声明交互逻辑：

```html
<div k-data="{ name: '', items: [], show: true }">
  <input k-model="name" placeholder="输入搜索关键词">
  <p k-show="name">你好，{{ name }}！</p>
  <ul>
    <li k-for="item in items" k-text="item"></li>
  </ul>
  <button k-on:click="show = !show" k-bind:disabled="!name">
    <span k-show="show">隐藏</span>
    <span k-show="!show">显示</span>
  </button>
</div>
<script>
  import { walk } from '@kupola/kupola/directives';
  walk(document.body);
</script>
```

**指令一览**：

| 指令 | 简写 | 作用 |
|------|------|------|
| `k-data` | — | 创建响应式作用域 |
| `k-show` | — | 条件显示（`display: none`） |
| `k-text` | — | 响应式文本内容 |
| `k-html` | — | 响应式 innerHTML |
| `k-bind` | `:` | 动态属性绑定 |
| `k-on` | `@` | 事件监听 |
| `k-model` | — | 双向输入绑定 |
| `k-for` | — | 列表渲染 |

---

## SSR（服务端渲染）

```javascript
import { signal, html } from '@kupola/kupola';
import { renderToString } from '@kupola/kupola/server';

const title = signal('Hello Server');
const serverHtml = renderToString(html`<h1>${title}</h1>`);
// => '<h1>Hello Server<!----></h1>'
res.send(`<!DOCTYPE html><html><body>${serverHtml}</body></html>`);
```

客户端水合：

```javascript
import { signal, html } from '@kupola/kupola';
import { hydrate } from '@kupola/kupola/server';

const title = signal('Hello Server');
hydrate(html`<h1>${title}</h1>`, document.body);
// DOM 不重建，仅绑定响应式
```

---

## 组件列表

<details>
<summary><strong>弹层 & 导航</strong>（6 个）</summary>

| 组件 | 导入路径 | 说明 |
|------|---------|------|
| Modal | `@kupola/kupola/components/modal` | 模态对话框 |
| Dropdown | `@kupola/kupola/components/dropdown` | 下拉菜单 |
| Drawer | `@kupola/kupola/components/drawer` | 侧边抽屉 |
| Tabs | `@kupola/kupola/components/tabs` | 选项卡 |
| Tooltip | `@kupola/kupola/components/tooltip` | 文字提示 |
| Menu | `@kupola/kupola/components/menu` | 导航菜单 |

</details>

<details>
<summary><strong>表单</strong>（11 个）</summary>

| 组件 | 导入路径 | 说明 |
|------|---------|------|
| Input | `@kupola/kupola/components/input` | 文本输入框 |
| Select | `@kupola/kupola/components/select` | 下拉选择器 |
| Checkbox | `@kupola/kupola/components/checkbox` | 复选框 |
| Radio | `@kupola/kupola/components/radio` | 单选框 |
| Switch | `@kupola/kupola/components/switch` | 开关 |
| Slider | `@kupola/kupola/components/slider` | 滑块 |
| NumberInput | `@kupola/kupola/components/numberinput` | 数字输入 |
| Textarea | `@kupola/kupola/components/textarea` | 多行文本 |
| Datepicker | `@kupola/kupola/components/datepicker` | 日期选择 |
| Timepicker | `@kupola/kupola/components/timepicker` | 时间选择 |
| Form | `@kupola/kupola/components/form` | 表单容器 + 校验 |

</details>

<details>
<summary><strong>反馈</strong>（6 个）</summary>

| 组件 | 导入路径 | 说明 |
|------|---------|------|
| Dialog | `@kupola/kupola/components/dialog` | 原生确认对话框 |
| Notification | `@kupola/kupola/components/notification` | 通知消息 |
| Message | `@kupola/kupola/components/message` | 轻量全局消息 |
| Alert | `@kupola/kupola/components/alert` | 警告提示 |
| Spin | `@kupola/kupola/components/spin` | 加载旋转 |
| Progress | `@kupola/kupola/components/progress` | 进度条 |

</details>

<details>
<summary><strong>数据展示</strong>（9 个）</summary>

| 组件 | 导入路径 | 说明 |
|------|---------|------|
| Table | `@kupola/kupola/components/table` | 数据表格（排序/筛选/分页/选择/编辑） |
| Tree | `@kupola/kupola/components/tree` | 树形控件 |
| Calendar | `@kupola/kupola/components/calendar` | 日历 |
| Carousel | `@kupola/kupola/components/carousel` | 走马灯 |
| Timeline | `@kupola/kupola/components/timeline` | 时间线 |
| Collapse | `@kupola/kupola/components/collapse` | 折叠面板 |
| Tag | `@kupola/kupola/components/tag` | 标签 |
| Badge | `@kupola/kupola/components/badge` | 徽标 |
| Statcard | `@kupola/kupola/components/statcard` | 统计卡片 |

</details>

<details>
<summary><strong>交互 & 工具</strong>（16 个）</summary>

| 组件 | 导入路径 | 说明 |
|------|---------|------|
| Pagination | `@kupola/kupola/components/pagination` | 分页 |
| Breadcrumb | `@kupola/kupola/components/breadcrumb` | 面包屑 |
| FileUpload | `@kupola/kupola/components/fileupload` | 文件上传 |
| DynamicTags | `@kupola/kupola/components/dynamictags` | 动态标签 |
| ImagePreview | `@kupola/kupola/components/imagepreview` | 图片预览 |
| ColorPicker | `@kupola/kupola/components/colorpicker` | 颜色选择器 |
| VirtualList | `@kupola/kupola/components/virtuallist` | 虚拟列表 |
| Heatmap | `@kupola/kupola/components/heatmap` | 热力图 |
| Countdown | `@kupola/kupola/components/countdown` | 倒计时 |
| Icons | `@kupola/kupola/components/icons` | SVG 图标集 |
| Validation | `@kupola/kupola/components/validation` | 校验引擎 |
| Avatar | `@kupola/kupola/components/avatar` | 头像 |
| Divider | `@kupola/kupola/components/divider` | 分割线 |
| Skeleton | `@kupola/kupola/components/skeleton` | 骨架屏 |
| Empty | `@kupola/kupola/components/empty` | 空状态 |
| Kbd | `@kupola/kupola/components/kbd` | 键盘按键 |

</details>

---

## TypeScript

完整类型定义开箱即用：

```typescript
import type { Modal, ModalOptions } from '@kupola/kupola/components/modal';
import type { Table, TableOptions, TableColumn } from '@kupola/kupola/components/table';

const options: ModalOptions = {
  title: '确认',
  content: '确定要删除吗？',
  onConfirm: () => console.log('confirmed'),
};
```

---

## 浏览器支持

- Chrome / Edge >= 88
- Firefox >= 78
- Safari >= 14
- 不支持 IE

---

## 文档

- 📖 [集成指南](./INTEGRATION.md) — CDN / SSR / Vite / Webpack / React / Vue
- 🤝 [贡献指南](./CONTRIBUTING.md) — 开发环境搭建 & 代码规范
- 📋 [变更日志](./CHANGELOG.md)
- 📄 [MIT License](./LICENSE)

---

## 生态

| 项目 | 说明 |
|------|------|
| `@kupola/kupola` | 核心引擎 + 48 个 UI 组件 |
| `create-kupola` | 项目脚手架 CLI |
| `his-sys` | 基于 Kupola 的 HIS 医疗系统 |

---

<p align="center">
  <strong>Kupola</strong> — 零框架依赖，声明式 UI，按需引入。
</p>
