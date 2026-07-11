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

```js
// Declarative data dependencies
import { useDeps } from 'kupola';
useDeps({ users: { url: '/api/users', staleTime: 60000 } });

// HTTP client plugin
import { configureHttpClient } from 'kupola';
import { createAxiosAdapter } from 'kupola/adapters/axios';
configureHttpClient(createAxiosAdapter(axiosInstance));

// Reactive state
import { ref, store } from 'kupola';
const count = ref(0);

// Theme & brand
import { initTheme, setTheme, setBrand } from 'kupola';
```

## Coding Standards

- ES Modules only, no external dependencies in core
- JSDoc on all public APIs
- camelCase for JS, kebab-case for CSS/HTML
- Components register with `window.kupolaInitializer`
- Progressive enhancement (work without JS for basic display)
- Update `types/kupola.d.ts` when changing public APIs
