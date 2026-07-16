---
name: kupola-dev
description: Kupola UI framework development standards and best practices. Enforces proper use of Signal reactivity, template literals, directives, and component factory patterns. Use when developing with @kupola/kupola, creating components, or when the user mentions Kupola, k-* directives, or kupola components.
---

# Kupola Development Standards

## Core Architecture

Kupola 2.0 is a zero-dependency UI framework with:
- **Signal-based reactivity**: `signal`, `computed`, `effect`
- **Template literals**: `html` tagged template + `render()`
- **Declarative directives**: `k-data`, `k-show`, `k-bind`, `k-on`, `k-model`, `k-for`
- **SSR support**: `renderToString` + `hydrate`

## Component Pattern

All components follow the **factory function pattern**:

```javascript
export function ComponentName(options = {}) {
  const { /* destructured options */ } = options;
  
  // Create DOM structure
  const element = document.createElement('div');
  element.className = 'kupola-componentname';
  
  // Reactive state
  const state = signal(initialValue);
  
  // Render
  const update = () => {
    element.innerHTML = ''; // build UI
  };
  effect(update);
  
  // Public API
  return {
    element,
    destroy() { /* cleanup */ },
    // ... other methods
  };
}
```

## CSS Class Naming

All CSS classes use `kupola-` prefix:

```css
/* ✅ Correct */
.kupola-modal { }
.kupola-modal-overlay { }
.kupola-modal-header { }

/* ❌ Wrong */
.modal { }
.ds-modal { }
.kupolaModal { }
```

## Reactivity Rules

### Signal Usage

```javascript
// ✅ Correct - read with .value
const count = signal(0);
console.log(count.value);

// ❌ Wrong - calling signal as function
console.log(count());

// ✅ Correct - write with .value
count.value = 5;
count.value++;
```

### Computed & Effect

```javascript
// Computed - derived value, auto-tracks dependencies
const doubled = computed(() => count.value * 2);

// Effect - side effect, auto re-runs when dependencies change
effect(() => {
  console.log(`Count: ${count.value}, Doubled: ${doubled.value}`);
});
```

### Batch Updates

```javascript
// Merge multiple updates into one flush
batch(() => {
  count.value++;
  name.value = 'new';
});
```

## Template & Render

```javascript
import { signal, html, render } from '@kupola/kupola';

const count = signal(0);

const view = () => html`
  <div class="kupola-counter">
    <p>Count: ${count}</p>
    <button @click=${() => count.value++}>+1</button>
  </div>
`;

render(view(), document.getElementById('app'));
```

## Directive System (Declarative HTML)

```html
<div k-data="{ count: 0, name: '' }">
  <input k-model="name" placeholder="Name">
  <p k-show="name">Hello, {{ name }}!</p>
  <button k-on:click="count++">Clicked {{ count }}</button>
  <span k-bind:class="count > 10 ? 'highlight' : ''">Status</span>
  <ul>
    <li k-for="item in items" k-text="item.name"></li>
  </ul>
</div>
```

| Directive | Shorthand | Purpose |
|-----------|-----------|---------|
| `k-data` | — | Create reactive scope |
| `k-show` | — | Conditional display |
| `k-text` | — | Reactive textContent |
| `k-html` | — | Reactive innerHTML |
| `k-bind` | `:` | Dynamic attribute |
| `k-on` | `@` | Event listener |
| `k-model` | — | Two-way binding |
| `k-for` | — | List rendering |

## Import Paths

```javascript
// Core engine
import { signal, html, render } from '@kupola/kupola';

// Components - each independently bundled
import { Modal } from '@kupola/kupola/components/modal';
import { Table } from '@kupola/kupola/components/table';
import { Dropdown } from '@kupola/kupola/components/dropdown';

// SSR
import { renderToString, hydrate } from '@kupola/kupola/server';

// Directives
import { walk } from '@kupola/kupola/directives';

// Theme (anti-FOUC)
import { themePreload, setTheme, toggleTheme, getPreferredTheme, onThemeChange, getThemeInlineScript } from '@kupola/kupola';

// Lazy loading
import { lazyComponent, preloadComponent } from '@kupola/kupola';

// DevTools
import { enableProfiler, getProfileReport } from '@kupola/kupola';

// i18n
import { setLocale, getLocale, t, addMessages } from '@kupola/kupola';

// CSS
import '@kupola/kupola/css';              // full bundle
import '@kupola/kupola/css/tokens';        // tokens only
import '@kupola/kupola/css/components';    // components only
import '@kupola/kupola/css/responsive';     // responsive utilities
```

## Theme System (Anti-FOUC)

```javascript
// Blocking preload — call in <head> before first paint
themePreload(); // reads localStorage('kupola-theme') + prefers-color-scheme, sets data-theme, removes [k-cloak]

// Programmatic control
setTheme('dark');        // set + persist to localStorage
toggleTheme();           // toggle dark ↔ light
getPreferredTheme();     // returns 'light' | 'dark'
onThemeChange(theme => { /* callback */ });
getThemeInlineScript();  // returns <script> string for SSR injection
```

CSS: `[k-cloak] { display: none !important; }` — hides elements until JS removes the attribute.

## Responsive Breakpoints

| Breakpoint | Value | Device |
|------------|-------|--------|
| `sm` | 576px | Phone landscape |
| `md` | 768px | Tablet |
| `lg` | 1024px | Laptop |
| `xl` | 1280px | Desktop |

```html
<!-- Display utilities -->
<div class="ds-hide-sm">Hidden on phones</div>
<div class="ds-show-md">Only visible on tablets+</div>

<!-- Component auto-adaptations (< 576px) -->
<!-- Modal → fullscreen, Drawer → full-width, Table → horizontal scroll, Select → bottom sheet -->
```

## Anti-Patterns

| ❌ Don't | ✅ Do Instead |
|----------|---------------|
| `element.style.display = 'none'` | Use `k-show` or toggle class |
| `document.querySelector('.my-class')` | Use `component.element.querySelector()` |
| `count()` to read signal | `count.value` |
| `count = 5` to write signal | `count.value = 5` |
| Raw `innerHTML = ...` | Use `html` template + `render()` |
| Direct DOM manipulation in effects | Let template handle DOM updates |
| Hardcode `data-theme` without preload | Use `themePreload()` or inline script in `<head>` |

## Adding a New Component

When creating a new component, update these files:

1. **Source**: `packages/core/src/components/{name}.js`
2. **Test**: `packages/core/__tests__/components/{name}.test.js`
3. **Build entry**: `rollup.config.cjs` — add input entry
4. **Exports**: `packages/core/package.json` — add to `exports`
5. **Size limit**: `.size-limit.json` — add limit entry
6. **Types**: `packages/core/src/components/types.d.ts` — add interfaces

## File Structure

```
packages/core/
├── src/
│   ├── components/     # UI components (one file each)
│   │   ├── modal.js
│   │   ├── table.js
│   │   └── types.d.ts  # TypeScript definitions
│   ├── signal.js       # Signal primitive
│   ├── computed.js     # Computed values
│   ├── effect.js       # Effect system
│   ├── template.js     # html`` template
│   ├── render.js       # DOM renderer
│   ├── server.js       # SSR (renderToString + hydrate)
│   ├── directives.js   # k-* directive system
│   ├── theme.js        # Theme utilities (anti-FOUC)
│   ├── lazy.js         # Lazy component loading
│   ├── devtools.js     # Signal profiler
│   ├── i18n.js         # Internationalization
│   ├── errors.js       # ErrorBoundary
│   └── index.js        # Public API entry
└── __tests__/
    └── components/     # Component tests
```

## Testing

```bash
npm run test          # Run all 922 tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

Tests use Jest with jsdom. Test file pattern: `{component}.test.js`

---

## Token Efficiency

Avoid wasting tokens/credits:

### ✅ Do
- **Search first**: Use `grep`/`search` to locate relevant code before reading files
- **Read specific ranges**: `Read(file, start_line, end_line)` instead of entire files
- **One component at a time**: Only load the component being worked on
- **Skip verification if confident**: Don't re-run tests if change is trivial (typo fix, comment)
- **Batch related changes**: Group multiple edits to same file in one operation

### ❌ Avoid
- Reading all 48 component files "to understand the codebase"
- Re-reading files already in context
- Running full test suite after every single-line change
- Generating verbose explanations when user just wants code
- Loading README/CONTRIBUTING/INTEGRATION unless explicitly asked

### Quick Reference Paths

| Need | Read |
|------|------|
| Component source | `packages/core/src/components/{name}.js` |
| Component test | `packages/core/__tests__/components/{name}.test.js` |
| Build config | `rollup.config.cjs` (line ~1600-1800 for component entries) |
| Type definitions | `packages/core/src/components/types.d.ts` |
| Core API | `packages/core/src/index.js` (55 lines) |
| Theme API | `packages/core/src/theme.js` |
| Responsive CSS | `packages/css/responsive.css` |
| CSS build | `scripts/build-css.cjs` |
