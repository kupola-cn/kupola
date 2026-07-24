# create-kupola

Scaffold a new [Kupola](https://github.com/kupola-cn/kupola) project with one command.

## Usage

> **Current version**: `2.0.0` (stable):

```bash
# Interactive mode
npm create @kupola/kupola
# or
npx @kupola/create-kupola

# Non-interactive mode
npx @kupola/create-kupola my-app --template=flask
```

### CLI Options

| Option | Description |
|--------|-------------|
| `--template=<name>` | Skip interactive prompts. Values: `static`, `static-ts`, `nextjs`, `nuxt`, `flask`, `fastapi`, `gin` |

When using `--template`, the first positional argument is the project name, and default features (dark theme) are enabled.

You'll be guided through an interactive setup:

```
⚡ create-kupola — Scaffold a Kupola project

? Project name: › my-kupola-app
? Backend framework: ›
  ❯ Static (HTML only) — No backend, pure static HTML + Kupola
    Static + TypeScript — TypeScript + Vite, type-safe Kupola project
    Next.js (SSR) — Next.js App Router + Kupola client hydration
    Nuxt (Hybrid) — Nuxt 3 + Kupola directives via ClientOnly
    Flask — Python Flask with Jinja2 templates
    FastAPI — Python FastAPI with Jinja2 templates
    Gin — Go Gin with html/template
? Optional features (space to toggle): ›
  ◼ Dark theme enabled
  ◻ Example pages
```

## Templates

| Template | Backend | Stack | Start command |
|----------|---------|-------|---------------|
| `static` | — | HTML + Vite | `npx vite` |
| `static-ts` | — | TypeScript + Vite | `npx vite` |
| `nextjs` | Next.js | React + App Router + Kupola | `npx next dev` |
| `nuxt` | Nuxt 3 | Vue + Kupola ClientOnly | `npx nuxt dev` |
| `flask` | Python Flask | Jinja2 + Kupola | `python app.py` |
| `fastapi` | Python FastAPI | Jinja2 + Kupola | `uvicorn main:app --reload` |
| `gin` | Go Gin | html/template + Kupola | `go run main.go` |

All templates include:
- Kupola 2.0 with 48+ tree-shakeable components
- Declarative directives (`k-data`, `k-on`, `k-show`, `k-bind`, `k-model`, `k-for`)
- Dark/light theme with anti-FOUC preload script
- Responsive breakpoints (sm/md/lg/xl)
- Interactive examples: Counter, Todo List, Form Binding, Reactive Computed
- localStorage theme persistence

## What gets created

```
my-kupola-app/
├── src/             # Source code (static-ts / nextjs)
│   ├── app/         # Next.js App Router (nextjs)
│   └── components/  # Kupola client components
├── pages/           # Vue pages (nuxt)
├── components/      # Vue + Kupola components (nuxt)
├── static/          # Kupola dist assets (Flask/FastAPI/Gin)
├── templates/       # HTML templates (Flask/FastAPI/Gin)
├── index.html       # Entry HTML (static)
├── package.json     # @kupola/core, @kupola/platform dependency
├── nuxt.config.ts   # Nuxt config (nuxt)
├── next.config.mjs  # Next.js config (nextjs)
├── app.py           # Flask entry (flask template)
├── main.py          # FastAPI entry (fastapi template)
├── main.go          # Gin entry (gin template)
└── vite.config.js   # Vite config (static/static-ts)
```

## Manual setup

If you prefer not to use the CLI, you can install Kupola directly:

```bash
npm install @kupola/core @kupola/platform
```

Then import in your code:

```js
// Core engine (Signal + template + SSR)
import { signal } from '@kupola/core';
import { html, render } from '@kupola/platform';

// Directive system (optional, for declarative HTML)
import { walk } from '@kupola/platform/directives';
walk(document.body);
```

## Requirements

- **Node.js** >= 18.x
- **Python** >= 3.8 (for Flask / FastAPI templates)
- **Go** >= 1.18 (for Gin template)

## License

MIT
