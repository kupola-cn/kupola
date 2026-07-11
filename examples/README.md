# Kupola Examples

This directory contains examples demonstrating how to use Kupola in different scenarios.

## 📂 Directory Structure

```
examples/
├── casepages/          # UI component showcase (13 category pages)
├── quick-start/        # Standalone examples for quick learning
│   ├── basic.html      # Minimal HTML example with common components
│   └── typescript.ts   # TypeScript usage example
├── integrations/       # Backend & framework integration
│   ├── flask/          # Python Flask + Jinja2
│   ├── fastapi/        # Python FastAPI (async)
│   └── htmx.html       # HTMX dynamic loading
└── showcase.html       # Full component showcase (all-in-one)
```

## 🎨 UI Component Showcase

### `casepages/` — Component Category Pages

Browse individual component categories. Each page is a standalone HTML file you can open directly in a browser:

| File | Components |
|------|-----------|
| `buttons.html` | Buttons, button groups, icon buttons |
| `cards.html` | Cards, stat cards |
| `data.html` | Tables, data display |
| `dataviz.html` | Heatmap, charts |
| `feedback.html` | Alerts, notifications, messages |
| `fileupload.html` | File upload with drag & drop |
| `forms.html` | Inputs, selects, validation |
| `images.html` | Image preview, carousel |
| `inputs.html` | Text inputs, number inputs, date/time pickers |
| `navigation.html` | Nav lists, pagination, breadcrumbs |
| `other.html` | Collapse, tooltips, tags |
| `overlay.html` | Modals, dialogs, drawers, dropdowns |
| `progress.html` | Progress bars, spinners, countdowns |

### `showcase.html` — All-in-One Showcase

A comprehensive page showing all components in a single view with dashboard layout.

## 🚀 Quick Start

### `quick-start/basic.html`

Minimal example showing how to include Kupola via CSS and use common components. Just open in a browser — no build step needed.

### `quick-start/typescript.ts`

TypeScript usage example demonstrating type-safe imports from the Kupola package.

## 🔌 Backend Integrations

### `integrations/flask/` — Flask Example

Python Flask application with Jinja2 templates:

```bash
cd integrations/flask
pip install -r requirements.txt
python app.py
# Open http://localhost:5000
```

Features: Dashboard layout, stat cards, activity feed, settings page.

### `integrations/fastapi/` — FastAPI Example

Python FastAPI async application with Jinja2 templates:

```bash
cd integrations/fastapi
pip install -r requirements.txt
python main.py
# Open http://localhost:8000
```

Features: Async endpoints, dashboard, settings with theme toggle.

### `integrations/htmx.html` — HTMX Integration

Demonstrates how Kupola's `MutationObserver` auto-initializes components inside HTMX-loaded HTML fragments. No manual setup needed — just load HTML and Kupola handles the rest.

## 📝 Running Examples

**Static HTML examples** (`casepages/`, `quick-start/`): Open directly in a browser. No server required.

**Backend examples** (`integrations/flask/`, `integrations/fastapi/`): Require Python and the dependencies listed in their `requirements.txt`. Each example expects a symlink or copy of the Kupola source in its `static/` directory.
