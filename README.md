[中文文档](./README.zh-CN.md)  | [Pages](https://kupola-cn.github.io/kupola/)

![npm](https://img.shields.io/npm/v/@kupola/kupola)
![bundlephobia](https://img.shields.io/bundlephobia/minzip/@kupola/kupola)
![Build Status](https://img.shields.io/github/actions/workflow/status/kupola-cn/kupola/ci.yml)
![License](https://img.shields.io/github/license/kupola-cn/kupola)

# Kupola

**A zero-framework interaction layer for server-rendered web applications.**

Kupola adds reactive state and declarative behavior to plain HTML, so traditional SSR pages can gain modern interaction without adopting a SPA framework. The native component library is an optional extension for common business UI.

---

## Features

- 🧭 **Progressive enhancement for SSR pages**: Add behavior with `k-data`, `k-on`, `k-model`, `k-show`, and `k-for` directly in HTML
- ⚛️ **Signal-based reactivity**: Fine-grained tracking via `signal` / `computed` / `effect` with automatic batched updates
- 📝 **Template literals when you need JS views**: `html` tagged template + `render` for instant DOM binding, with no compilation step
- 🖥️ **SSR ready**: `renderToString` + `hydrate` for server-first rendering and client-side reactive binding
- 🧩 **Optional native components**: 48 independently bundled UI components for business pages
- 🪶 **Ultra-lightweight**: Core engine < 5KB gzip, zero third-party dependencies

## When to Use Kupola

Kupola fits projects where HTML is already rendered by a server or static template system, and you want local interaction without moving the whole page into React, Vue, or a SPA runtime.

- Backend-rendered dashboards, admin systems, CMS pages, and internal tools
- HTML-first apps that need small reactive islands
- Existing pages that need forms, modals, filters, tables, or stateful controls
- Teams that want framework-independent UI behavior with optional components

---

## Quick Start

```html
<div k-data="{ count: 0 }">
  <button k-on:click="count++">Clicked {{ count }} times</button>
</div>
<script type="module">
  import { walk } from 'https://cdn.jsdelivr.net/npm/@kupola/kupola/dist/kupola-core-directives.esm.js';
  walk(document.body);
</script>
```

Or use the programmatic API:

```html
<div id="app"></div>
<script type="module">
  import { signal, html, render } from 'https://cdn.jsdelivr.net/npm/@kupola/kupola/dist/kupola-core.esm.js';

  const count = signal(0);
  const view = () => html`<button @click=${() => count.value++}>Clicked ${count} times</button>`;
  render(view(), document.getElementById('app'));
</script>
```

---

## Installation

> **Current version**: `2.0.0` (stable):

```bash
npm install @kupola/kupola              # Full package
# Or core engine only
npm install @kupola/kupola/core          # signal + template + render + SSR
```

```bash
# CDN
https://cdn.jsdelivr.net/npm/@kupola/kupola/dist/kupola-core.esm.js
https://cdn.jsdelivr.net/npm/@kupola/kupola/dist/kupola-core.cjs
```

---

## Import Components on Demand

Each component is independently bundled — import only what you need:

```javascript
// Import Modal only
import { Modal } from '@kupola/kupola/components/modal';

const modal = Modal({ title: 'Confirm', content: 'This action cannot be undone.' });
modal.open();
```

```javascript
// Import Table only
import { Table } from '@kupola/kupola/components/table';

const table = Table({
  columns: [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'age', label: 'Age', sortable: true },
  ],
  data: [
    { name: 'Alice', age: 28 },
    { name: 'Bob', age: 34 },
  ],
  pageSize: 10,
});
document.body.appendChild(table.element);
```

---

## Core Engine API

```javascript
import { signal, computed, effect, batch, html, render } from '@kupola/kupola';

// Signal — reactive state
const count = signal(0);

// Computed — derived value (auto-tracks dependencies)
const doubled = computed(() => count.value * 2);

// Effect — side effect (auto re-runs)
effect(() => console.log(`count = ${count.value}, doubled = ${doubled.value}`));

// Batch — merge multiple updates into one flush
batch(() => {
  count.value++;
  count.value++;
});

// Template + Render — declarative DOM
const view = () => html`
  <div class="counter">
    <p>Count: ${count}</p>
    <button @click=${() => count.value++}>+1</button>
  </div>
`;
render(view(), document.getElementById('app'));
```

---

## Directive System (Declarative HTML)

Add interactivity directly in HTML — no build tools required:

```html
<div k-data="{ name: '', items: [], show: true }">
  <input k-model="name" placeholder="Enter search term">
  <p k-show="name">Hello, {{ name }}!</p>
  <ul>
    <li k-for="item in items" k-text="item"></li>
  </ul>
  <button k-on:click="show = !show" k-bind:disabled="!name">
    <span k-show="show">Hide</span>
    <span k-show="!show">Show</span>
  </button>
</div>
<script>
  import { walk } from '@kupola/kupola/directives';
  walk(document.body);
</script>
```

**Directives Overview**:

| Directive | Shorthand | Purpose |
|-----------|-----------|---------|
| `k-data` | — | Create a reactive scope |
| `k-show` | — | Conditional display (`display: none`) |
| `k-text` | — | Reactive textContent |
| `k-html` | — | Reactive innerHTML |
| `k-bind` | `:` | Dynamic attribute binding |
| `k-on` | `@` | Event listener |
| `k-model` | — | Two-way input binding |
| `k-for` | — | List rendering |

**Security note**: Kupola directives are intended for trusted application templates. Use `k-text` for user content. `k-html` writes to `innerHTML` and must only receive trusted or sanitized HTML. Do not compose directive expressions from user input.

---

## SSR (Server-Side Rendering)

```javascript
import { signal, html } from '@kupola/kupola';
import { renderToString } from '@kupola/kupola/server';

const title = signal('Hello Server');
const serverHtml = renderToString(html`<h1>${title}</h1>`);
// => '<h1>Hello Server<!----></h1>'
res.send(`<!DOCTYPE html><html><body>${serverHtml}</body></html>`);
```

Client-side hydration:

```javascript
import { signal, html } from '@kupola/kupola';
import { hydrate } from '@kupola/kupola/server';

const title = signal('Hello Server');
hydrate(html`<h1>${title}</h1>`, document.body);
// DOM is not rebuilt — only reactive bindings are attached
```

---

## Components

<details>
<summary><strong>Overlay & Navigation</strong> (6)</summary>

| Component | Import Path | Description |
|-----------|-------------|-------------|
| Modal | `@kupola/kupola/components/modal` | Modal dialog |
| Dropdown | `@kupola/kupola/components/dropdown` | Dropdown menu |
| Drawer | `@kupola/kupola/components/drawer` | Side drawer |
| Tabs | `@kupola/kupola/components/tabs` | Tab panel |
| Tooltip | `@kupola/kupola/components/tooltip` | Text tooltip |
| Menu | `@kupola/kupola/components/menu` | Navigation menu |

</details>

<details>
<summary><strong>Form</strong> (11)</summary>

| Component | Import Path | Description |
|-----------|-------------|-------------|
| Input | `@kupola/kupola/components/input` | Text input |
| Select | `@kupola/kupola/components/select` | Dropdown select |
| Checkbox | `@kupola/kupola/components/checkbox` | Checkbox |
| Radio | `@kupola/kupola/components/radio` | Radio button |
| Switch | `@kupola/kupola/components/switch` | Toggle switch |
| Slider | `@kupola/kupola/components/slider` | Range slider |
| NumberInput | `@kupola/kupola/components/numberinput` | Number input |
| Textarea | `@kupola/kupola/components/textarea` | Multi-line text |
| Datepicker | `@kupola/kupola/components/datepicker` | Date picker |
| Timepicker | `@kupola/kupola/components/timepicker` | Time picker |
| Form | `@kupola/kupola/components/form` | Form container + validation |

</details>

<details>
<summary><strong>Feedback</strong> (6)</summary>

| Component | Import Path | Description |
|-----------|-------------|-------------|
| Dialog | `@kupola/kupola/components/dialog` | Native confirm dialog |
| Notification | `@kupola/kupola/components/notification` | Notification toast |
| Message | `@kupola/kupola/components/message` | Lightweight global message |
| Alert | `@kupola/kupola/components/alert` | Alert banner |
| Spin | `@kupola/kupola/components/spin` | Loading spinner |
| Progress | `@kupola/kupola/components/progress` | Progress bar |

</details>

<details>
<summary><strong>Data Display</strong> (9)</summary>

| Component | Import Path | Description |
|-----------|-------------|-------------|
| Table | `@kupola/kupola/components/table` | Data table (sort/filter/paginate/select/edit) |
| Tree | `@kupola/kupola/components/tree` | Tree view |
| Calendar | `@kupola/kupola/components/calendar` | Calendar |
| Carousel | `@kupola/kupola/components/carousel` | Carousel / slider |
| Timeline | `@kupola/kupola/components/timeline` | Timeline |
| Collapse | `@kupola/kupola/components/collapse` | Collapse panel |
| Tag | `@kupola/kupola/components/tag` | Tag |
| Badge | `@kupola/kupola/components/badge` | Badge |
| Statcard | `@kupola/kupola/components/statcard` | Stat card |

</details>

<details>
<summary><strong>Interactive & Utility</strong> (16)</summary>

| Component | Import Path | Description |
|-----------|-------------|-------------|
| Pagination | `@kupola/kupola/components/pagination` | Pagination |
| Breadcrumb | `@kupola/kupola/components/breadcrumb` | Breadcrumb |
| FileUpload | `@kupola/kupola/components/fileupload` | File upload |
| DynamicTags | `@kupola/kupola/components/dynamictags` | Dynamic tags |
| ImagePreview | `@kupola/kupola/components/imagepreview` | Image preview |
| ColorPicker | `@kupola/kupola/components/colorpicker` | Color picker |
| VirtualList | `@kupola/kupola/components/virtuallist` | Virtual list |
| Heatmap | `@kupola/kupola/components/heatmap` | Heatmap |
| Countdown | `@kupola/kupola/components/countdown` | Countdown timer |
| Icons | `@kupola/kupola/components/icons` | SVG icon set |
| Validation | `@kupola/kupola/components/validation` | Validation engine |
| Avatar | `@kupola/kupola/components/avatar` | Avatar |
| Divider | `@kupola/kupola/components/divider` | Divider |
| Skeleton | `@kupola/kupola/components/skeleton` | Skeleton screen |
| Empty | `@kupola/kupola/components/empty` | Empty state |
| Kbd | `@kupola/kupola/components/kbd` | Keyboard key |

</details>

---

## TypeScript

Full type definitions included out of the box:

```typescript
import type { Modal, ModalOptions } from '@kupola/kupola/components/modal';
import type { Table, TableOptions, TableColumn } from '@kupola/kupola/components/table';

const options: ModalOptions = {
  title: 'Confirm',
  content: 'Are you sure you want to delete?',
  onConfirm: () => console.log('confirmed'),
};
```

---

## Browser Support

- Chrome / Edge >= 88
- Firefox >= 78
- Safari >= 14
- IE is not supported

---

## Documentation

- 📖 [Integration Guide](./INTEGRATION.md) — CDN / SSR / Vite / Webpack / React / Vue
- 🤝 [Contributing Guide](./CONTRIBUTING.md) — Dev setup & code standards
- 📋 [Changelog](./CHANGELOG.md)
- 📄 [MIT License](./LICENSE)

---

## AI Adapter

`@kupola/ai-adapter` is an AI operation engine that converts natural language into structured commands — bridging human intent with your application's data layer.

```bash
npm install @kupola/ai-adapter
```

### Three Engines, One Pipeline

| Engine | Purpose | Example |
|--------|---------|--------|
| **QueryEngine** | Read-only data retrieval | `"查询员工张三的考勤"` → `{ engine: 'query', type: 'attendance', params: { name: '张三' } }` |
| **ActionEngine** | Write operations with undo | `"给张三发工资条"` → `{ engine: 'action', type: '发工资条', params: { name: '张三' } }` |
| **FlowEngine** | Multi-step workflows | `"运行月底结算流程"` → executes 5 steps sequentially with retry & resume |

### Quick Start

```javascript
import { AIAdapter, AIPanel } from '@kupola/ai-adapter';

const adapter = new AIAdapter();

// Register query handlers
adapter.query.register('employee', async (params) => {
  return await api.getEmployees(params);
});

// Register action handlers with undo support
adapter.action.register('调整薪资', {
  handler: async (params) => await api.adjustSalary(params),
  undo: async (params) => await api.rollbackSalary(params),
  dependsOn: ['查询员工'],  // dependency enforcement
});

// Define multi-step flows
adapter.flow.define('月底结算', {
  steps: [
    { label: '汇总考勤', handler: async (data) => ({ ...data, attendance: 'ok' }) },
    { label: '计算薪资', handler: async (data) => ({ ...data, salary: 'ok' }) },
    { label: '生成报表', handler: async (data) => ({ ...data, report: 'done' }) },
  ],
});

// Process natural language — the adapter routes to the right engine
const result = await adapter.process('查询员工张三的信息');
// => { engine: 'query', type: 'employee', result: [...], message: '...' }
```

### Middleware System

Koa-style middleware for cross-cutting concerns:

```javascript
import { createRateLimiter, createAuthGuard } from '@kupola/ai-adapter';

adapter.use(createRateLimiter({ maxRequests: 30, windowMs: 60000 }));
adapter.use(createAuthGuard({
  roleField: 'role',
  permissionsField: 'permissions',
  rules: [
    { engine: 'query', type: 'roles', roles: ['admin'], permissions: ['role:read'] },
    { engine: 'action', types: ['删除'], roles: ['admin'] },
  ],
}));
adapter.use(async (ctx, next) => {
  console.log(`[${ctx.command.engine}] ${ctx.input}`);
  await next();
  console.log(`=> ${ctx.result.message}`);
});
```

### UI Components

| Component | Description |
|-----------|-------------|
| **AIPanel** | Conversation panel with message list, input, progress bar & flow timeline |
| **AIDashboard** | Data dashboard with stat cards, aggregate functions & auto-refresh |
| **VoiceController** | Web Speech API integration with wake word detection & command mapping |

```javascript
import { AIPanel, AIDashboard, VoiceController } from '@kupola/ai-adapter';

// Mount AI conversation panel
const panel = new AIPanel(adapter, { title: 'AI 助手' });
panel.mount(document.getElementById('ai-panel'));

// Create data dashboard
const dashboard = new AIDashboard(adapter);
dashboard.addCard('headcount', 'employee', { label: '员工总数', aggregate: 'count' });
dashboard.addCard('salary', 'salary', { label: '薪资总额', aggregate: 'sum:amount' });
dashboard.mount(document.getElementById('dashboard'));

// Enable voice control
const voice = new VoiceController(adapter, { wakeWord: '小库' });
voice.start();
```

AI Adapter permissions run in the front-end interaction layer and provide immediate denial messages. They are not a replacement for server-side authorization; APIs must still validate users, roles, menus and data scopes, returning `401` or `403` when access is denied.

### Event System

```javascript
adapter.on('result', (data) => console.log('Result:', data));
adapter.once('flow:complete', (data) => notify('流程完成', data));
adapter.wildcard('action:*', (event, data) => audit.log(event, data));
```

> 📖 Full documentation: [AI Adapter Docs](https://kupola-cn.github.io/kupola/ai-adapter/introduction)

---

## Ecosystem

| Project | Description |
|---------|-------------|
| `@kupola/kupola` | Core engine + 48 UI components |
| `@kupola/ai-adapter` | AI operation engine — natural language → structured commands |
| `create-kupola` | Project scaffolding CLI (7 templates) |
| `his-sys` | HIS medical system built on Kupola |

---

<p align="center">
  <strong>Kupola</strong> — Zero framework dependencies. Declarative UI. Import only what you need.
</p>
