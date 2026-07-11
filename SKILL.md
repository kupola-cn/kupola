# Kupola — Project Skill for AI IDE

You are working with **Kupola**, a lightweight, dependency-free declarative UI component system for server-side rendered web applications.

## Project Identity

- **npm**: `@kupola/kupola`
- **License**: MIT
- **Build**: Vite (primary) / Rollup (alternative)
- **Size**: ~418 KB ESM, ~88 KB gzipped
- **Zero runtime dependencies**

## Architecture Overview

```
kupola/
├── js/           # Core JavaScript modules (ES modules)
│   ├── depends.js        # useDeps/useQuery - declarative data dependencies + HTTP client plugin
│   ├── initializer.js    # MutationObserver-based component auto-discovery
│   ├── kupola-core.js    # Component base class + registration
│   ├── kupola-lifecycle.js # Lifecycle hooks
│   ├── data-bind.js      # Proxy-based reactive data binding
│   ├── registry.js       # Global component registry
│   ├── theme.js          # Dark/light theme + brand colors
│   ├── icons.js          # SVG icon system
│   ├── validation.js     # Form validation engine
│   └── [component].js    # Individual components (dropdown, modal, datepicker, etc.)
├── css/          # Stylesheets (compiled to dist/css/kupola.css)
├── adapters/     # HTTP client adapters (axios, navios-http)
├── src/          # Entry points (index.js, esm-index.js, index.css)
├── dist/         # Build output (gitignored, built by CI)
├── types/        # TypeScript declarations (kupola.d.ts)
├── plugins/      # Vite plugin
├── icons/        # SVG icon source files
├── examples/     # Usage examples (Flask, HTMX, case pages)
└── docs/         # Documentation
```

## Key Patterns

### Component Structure
```js
export class MyComponent {
    constructor(element) {
        this.el = element;
        this.option = element.dataset.myOption || 'default';
    }
    init() { /* Bind events, setup */ }
    destroy() { /* Cleanup */ }
}
window.kupolaInitializer?.register('data-my-component', MyComponent);
```

### CSS Convention
- All classes prefixed with `ds-` (e.g., `ds-card`, `ds-btn`)
- BEM-like naming: `ds-card__title`, `ds-btn--brand`
- Dark theme default; light theme via `[data-theme="light"]`

### Data Attributes
- `data-*` for component init (e.g., `data-dropdown`)
- `data-bind` for reactive binding (e.g., `data-bind="user.name:value"`)
- `data-deps` for declarative data fetching

## Core APIs

### Modal 弹窗

```js
import { Modal, initModals, cleanupModal, createModal, confirmModal, alertModal } from 'kupola';

// 自动初始化页面中的所有 modal
initModals();

// 使用已初始化的 modal 实例（initModals 会将实例存到 element.__kupolaInstance）
const modalEl = document.getElementById('myModal');
modalEl.__kupolaInstance.open();
modalEl.__kupolaInstance.close();

// 编程式创建弹窗（无需 HTML）
createModal({ title: '提示', content: '操作成功', width: '400px', onConfirm: () => {} });
confirmModal({ title: '确认', content: '确定删除？', onConfirm: async () => { await doDelete(); } });
alertModal({ title: '警告', content: '请先选择' });

// 清理
cleanupModal(modalEl);
```

### Dropdown 下拉框

```js
import { Dropdown, initDropdowns, cleanupDropdown } from 'kupola';

// 初始化
initDropdowns(rootElement);

// 使用实例
const dd = element._kupolaDropdown;
dd.setItems([{ text: '选项A', value: 'a' }, { text: '选项B', value: 'b' }]);
dd.onSelect = ({ item, value, text }) => { ... };
dd.showMenu();
dd.hideMenu();
dd.enable();
dd.disable();

// 读取当前值
element.getAttribute('data-value');

// 清理
cleanupDropdown(element);
```

### Form 表单

```js
import { KupolaForm, initFormValidation, getFormInstance } from 'kupola';

const form = new KupolaForm(formElement);
form.getData();     // { username: '...', phone: '...' } 按 name 属性
form.setData(data); // 填充表单
form.validate();    // 验证所有字段
form.reset();       // 重置
```

### Data-bind 响应式数据绑定

```js
import { kupolaData, createStore, ref } from 'kupola';

// HTML: <input data-bind="value:username">  <span data-bind="text:username">
kupolaData.set('username', '张三');        // DOM 自动更新
kupolaData.get('username');                // 读取
kupolaData.load({ username: '...', phone: '...' }); // 批量加载
kupolaData.serializeForm(formElement);     // 从 data-bind 读取表单数据
kupolaData.fillForm(formElement, data);    // 按 data-bind 填充表单
kupolaData.observe('key', (newVal) => {}); // 监听变化
kupolaData.computed('full', ['first','last'], (f,l) => f+l); // 计算属性

// 轻量响应式
const count = ref(0);
count.value++;  // 自动触发订阅者
```

### Table 表格组件

```js
import { KupolaTable } from 'kupola';

const table = new KupolaTable(element, {
    columns: [{ key: 'name', title: '名称', sortable: true, render: (v,row) => `<b>${v}</b>` }],
    pagination: true, pageSize: 20, showFilter: true,
    selection: 'checkbox', tree: { childrenKey: 'children' },
    editable: true, resizable: true, draggable: true,
    virtualScroll: { rowHeight: 40 },
});
table.setData(dataArray);
table.setLoading(true);
table.refresh();
table.exportCSV('file.csv');
```

### Lifecycle 生命周期

```js
import { KupolaLifecycle, createLifecycle } from 'kupola';

const lc = createLifecycle('page:users');
lc.on('beforeMount', () => {});
lc.on('mount', () => {});
lc.on('afterMount', () => {});
lc.on('unmount', () => {});
lc.on('destroy', () => {});
await lc.bootstrap();
await lc.mount();
await lc.unmount();
await lc.destroy();
```

### Auto-Initializer 自动发现

```js
// 动态插入 HTML 后，重新初始化组件
await window.Kupola.refresh(scopeElement);

// 清理单个元素
window.Kupola.cleanup(element);
```

### Message & Notification

```js
import { message, notification } from 'kupola';
message.success('操作成功');
message.error('失败');
notification({ title: '通知', content: '...', type: 'info' });
```

### Component 基类

```js
import { KupolaComponent } from 'kupola';

class MyWidget extends KupolaComponent {
    setup() { /* 初始化逻辑 */ }
    render() { /* 渲染 DOM */ }
    beforeUnmount() { /* 清理 */ }
}
```

## Anti-Patterns (禁止事项)

| 反模式 | 正确做法 |
|--------|----------|
| `classList.add('is-visible')` 手动控制弹窗 | `modal.open()` / `modal.close()` |
| 逐个 `getElementById` + `.value=` 填表单 | `KupolaForm.setData()` 或 `kupolaData.fillForm()` |
| 手动遍历 dropdown DOM 设置选中 | `dropdown._kupolaDropdown.setItems()` |
| `onclick="func()"` 内联事件 | `data-action` 属性 + 事件委托 |
| `innerHTML = data.map(...)` 拼表格 | `KupolaTable` 组件 |
| `document.body.addEventListener` 全局委托且不清理 | 绑定在页面容器，返回清理函数 |
| 动态加载 HTML 后不调 refresh | 调用 `Kupola.refresh(scope)` |
| `ds-input` 类用在 `<div>` 包裹上 | 直接用在 `<input>` 元素上 |

## Coding Standards

- ES Modules only, no external dependencies in core
- JSDoc on all public APIs
- camelCase for JS, kebab-case for CSS/HTML
- Components register with `window.kupolaInitializer`
- Progressive enhancement (work without JS for basic display)
- Update `types/kupola.d.ts` when changing public APIs
- **ALWAYS use Kupola component APIs** instead of raw DOM manipulation
- **ALWAYS return cleanup functions** from page init modules
- **ALWAYS call `Kupola.refresh()`** after dynamic HTML insertion
