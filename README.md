[中文文档](./README.zh-CN.md)

![npm](https://img.shields.io/npm/v/@kupola/kupola)
![bundlephobia](https://img.shields.io/bundlephobia/minzip/@kupola/kupola)
![Build Status](https://img.shields.io/github/actions/workflow/status/kupola-cn/kupola/ci.yml)
![License](https://img.shields.io/github/license/kupola-cn/kupola)

# Kupola

**A zero-framework-dependency declarative UI engine + component library for any server-rendered web application.**

---

## Features

- ⚛️ **Signal-based Reactivity**: Fine-grained tracking via `signal` / `computed` / `effect` with automatic batched updates
- 📝 **Template Literals**: `html` tagged template + `render` for instant DOM binding — no compilation step
- 🖥️ **SSR Ready**: `renderToString` + `hydrate` for pristine hydration with zero client-side flicker
- 🧩 **48+ Components, Tree-shakeable**: Modal, Table, Dropdown, Form… each component is independently bundled
- 🪶 **Ultra-lightweight**: Core engine < 5KB gzip, zero third-party dependencies

---

## Quick Start

```html
<script src="https://cdn.jsdelivr.net/npm/@kupola/kupola/dist/kupola-core.umd.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@kupola/kupola/dist/kupola-core-directives.umd.js"></script>
<div k-data="{ count: 0 }">
  <button k-on:click="count++">Clicked {{ count }} times</button>
</div>
<script>
  Kupola.walk(document.body);
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

> **Current version**: `2.0.0-alpha.1` (pre-release). Use `@next` tag to install:

```bash
npm install @kupola/kupola@next              # Full package
# Or core engine only
npm install @kupola/kupola/core@next          # signal + template + render + SSR
```

```bash
# CDN
https://cdn.jsdelivr.net/npm/@kupola/kupola@next/dist/kupola-core.esm.js
https://cdn.jsdelivr.net/npm/@kupola/kupola@next/dist/kupola-core.cjs.js
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

## Ecosystem

| Project | Description |
|---------|-------------|
| `@kupola/kupola` | Core engine + 48 UI components |
| `create-kupola` | Project scaffolding CLI |
| `his-sys` | HIS medical system built on Kupola |

---

<p align="center">
  <strong>Kupola</strong> — Zero framework dependencies. Declarative UI. Import only what you need.
</p>
