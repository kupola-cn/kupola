# create-kupola

Scaffold a new [Kupola](https://github.com/kupola-cn/kupola) project with one command.

## Usage

> **Current version**: `2.0.0-alpha.1` (pre-release). Use `@next` tag:

```bash
# Interactive mode
npm create @kupola/kupola@next
# or
npx @kupola/create-kupola@next

# Non-interactive mode
npx @kupola/create-kupola@next my-app --template=flask
```

### CLI Options

| Option | Description |
|--------|-------------|
| `--template=<name>` | Skip interactive prompts. Values: `static`, `flask`, `fastapi`, `gin` |

When using `--template`, the first positional argument is the project name, and default features (dark theme) are enabled.

You'll be guided through an interactive setup:

```
⚡ create-kupola — Scaffold a Kupola project

? Project name: › my-kupola-app
? Backend framework: ›
  ❯ Static (HTML only) — No backend, pure static HTML + Kupola
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
| `flask` | Python Flask | Jinja2 + Kupola | `python app.py` |
| `fastapi` | Python FastAPI | Jinja2 + Kupola | `uvicorn main:app --reload` |
| `gin` | Go Gin | html/template + Kupola | `go run main.go` |

All templates include:
- Kupola 2.0 with 48+ tree-shakeable components
- Declarative directives (`k-data`, `k-on`, `k-show`, `k-bind`, `k-model`, `k-for`)
- Dark theme toggle (enabled by default)
- Example pages with buttons, alerts, stat cards, and a dashboard (optional)

## What gets created

```
my-kupola-app/
├── static/          # Kupola dist assets (Flask/FastAPI/Gin)
├── templates/       # HTML templates
├── package.json     # @kupola/kupola dependency
├── app.py           # Flask entry (flask template)
├── main.py          # FastAPI entry (fastapi template)
├── main.go          # Gin entry (gin template)
└── vite.config.js   # Vite config (static template)
```

## Manual setup

If you prefer not to use the CLI, you can install Kupola directly:

```bash
npm install @kupola/kupola@next
```

Then import in your code:

```js
// Core engine (Signal + template + SSR)
import { signal, html, render } from '@kupola/kupola';

// Directive system (optional, for declarative HTML)
import { walk } from '@kupola/kupola/directives';
walk(document.body);
```

## Requirements

- **Node.js** >= 16.x
- **Python** >= 3.8 (for Flask / FastAPI templates)
- **Go** >= 1.18 (for Gin template)

## License

MIT
