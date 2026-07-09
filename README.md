# Kupola

A lightweight UI toolkit for any web project. No heavy frontend frameworks required. Works seamlessly with Flask, Django, Gin, Spring Boot, ASP.NET Core, Express, Ruby on Rails, and any backend framework that outputs HTML.

## Features

- **50+ Components**: Buttons, inputs, cards, modals, datepickers, timepickers, heatmap, virtual list, stat cards, image components, and more
- **Dual Themes**: Dark-first design with light theme support
- **11 Brand Colors**: Switchable brand colors
- **Responsive Design**: Works on PC, Pad, and Phone
- **Accessibility**: WCAG AA compliant
- **Form Validation**: Built-in validation with custom rules
- **Data Binding**: Two-way data binding system (Proxy-based)
- **No Dependencies**: Pure HTML/CSS/JavaScript
- **Multi-language Support**: Helper functions for Python, Go, Java, C#, Node.js, Ruby

## Quick Start

### 1. Install via npm

```bash
npm install @kupola/kupola
```

### 2. Import CSS and JavaScript

```html
<link rel="stylesheet" href="node_modules/@kupola/kupola/dist/css/kupola.css">
<script src="node_modules/@kupola/kupola/dist/kupola.esm.js" type="module"></script>
```

### 3. Or Copy Files

Copy the `kupola` directory to your project:

```
your-project/
├── kupola/
│   ├── css/
│   ├── js/
│   └── icons/
└── index.html
```

### 2. Include CSS

```html
<link rel="stylesheet" href="kupola/css/kupola.css">
```

### 3. Include JavaScript

```html
<script src="kupola/js/kupola-core.js"></script>
```

### 4. Start Using Components

```html
<button class="ds-btn ds-btn--brand">Click Me</button>
<input type="text" class="ds-input" placeholder="Enter text">
<div class="ds-card">
    <div class="ds-card__header">
        <h3 class="ds-card__title">Card Title</h3>
    </div>
    <div class="ds-card__body">Card content</div>
</div>
```

## Framework Integration

### Python (Flask/Django)

```python
from kupola import button, card

html = card("Welcome", "Hello Kupola!", "") + button("Submit", "brand", "md")
```

### Go (Gin/Echo)

```go
import "kupola"

html := kupola.Card("Welcome", "Hello Kupola!", "") + kupola.Button("Submit", "brand", "md")
```

### Java (Spring Boot)

```java
import com.kupola.Kupola;

String html = Kupola.card("Welcome", "Hello Kupola!", "") + Kupola.button("Submit", "brand", "md");
```

### C# (ASP.NET Core)

```csharp
using Kupola;

string html = Components.Card("Welcome", "Hello Kupola!", "") + Components.Button("Submit", "brand", "md");
```

### Node.js (Express/Koa)

```javascript
import { button, card } from './kupola/utils/kupola.js';

const html = card('Welcome', 'Hello Kupola!', '') + button('Submit', 'brand', 'md');
```

### Ruby (Ruby on Rails)

```ruby
require './utils/kupola.rb'

html = Kupola.card('Welcome', 'Hello Kupola!', '') + Kupola.button('Submit', 'brand', 'md')
```

## Basic Usage Examples

### Buttons

```html
<button class="ds-btn ds-btn--brand">Primary</button>
<button class="ds-btn ds-btn--secondary">Secondary</button>
<button class="ds-btn ds-btn--outline">Outline</button>
<button class="ds-btn ds-btn--ghost">Ghost</button>
<button class="ds-btn ds-btn--danger">Danger</button>
```

### Inputs

```html
<input type="text" class="ds-input" placeholder="Text input">
<input type="password" class="ds-input" placeholder="Password">
<input type="email" class="ds-input" placeholder="Email">
<textarea class="ds-textarea" placeholder="Textarea"></textarea>
```

### Cards

```html
<div class="ds-card">
    <div class="ds-card__header">
        <h3 class="ds-card__title">Card Title</h3>
        <p class="ds-card__subtitle">Subtitle</p>
    </div>
    <div class="ds-card__body">Card content goes here</div>
    <div class="ds-card__footer">Footer actions</div>
</div>
```

### Forms

```html
<form class="ds-form">
    <div class="ds-form-item">
        <label class="ds-form-item__label">Name</label>
        <input type="text" class="ds-input" placeholder="Enter name">
    </div>
    <div class="ds-form-item">
        <label class="ds-form-item__label">Email</label>
        <input type="email" class="ds-input" data-validate="email" placeholder="Enter email">
    </div>
    <button type="submit" class="ds-btn ds-btn--brand">Submit</button>
</form>
```

### Data Binding

```html
<input type="text" data-bind="user.name:value" placeholder="Name">
<span data-bind="user.name:text"></span>
<input type="checkbox" data-bind="user.active:checked">
```

```javascript
kupolaData.data.user = { name: 'John', active: true };
kupolaData.data.user.name = 'Jane';  // Auto updates all bound elements
```

### Theme Switching

```javascript
setTheme('light');   // Switch to light theme
setTheme('dark');    // Switch to dark theme
setBrand('zengqing'); // Set brand color to 曾青
```

## Project Structure

```
kupola/
├── css/                    # CSS stylesheets
│   ├── kupola.css          # Main CSS bundle
│   ├── components.css      # Component styles
│   ├── components-ext.css  # Extended component styles
│   ├── theme-dark.css      # Dark theme tokens
│   ├── theme-light.css     # Light theme tokens
│   └── ...                 # Other stylesheets
├── js/                     # JavaScript modules (40+)
│   ├── kupola-core.js      # Core framework
│   ├── kupola-lifecycle.js # Lifecycle management
│   ├── kupola-devtools.js  # Development tools
│   ├── component.js        # Base component class
│   ├── router.js           # Client-side router
│   ├── http.js             # HTTP client
│   ├── data-bind.js        # Data binding
│   ├── validation.js       # Form validation
│   ├── theme.js            # Theme/brand switching
│   └── ...                 # UI components
├── icons/                  # 120+ SVG icons
├── dist/                   # Build output
│   ├── kupola.esm.js       # ES Module format
│   ├── kupola.cjs.js       # CommonJS format
│   ├── kupola.umd.js       # UMD format
│   └── types/kupola.d.ts   # TypeScript types
├── src/                    # Build entry points
├── utils/                  # Multi-language utility functions
│   ├── kupola.py           # Python component generation
│   ├── kupola.go           # Go component generation
│   ├── Kupola.java         # Java component generation
│   ├── Kupola.cs           # C# component generation
│   ├── kupola.js           # Node.js component generation
│   └── kupola.rb           # Ruby component generation
├── templates/              # HTML templates
│   ├── base.html           # Base template
│   └── base_dashboard.html # Dashboard base template
├── dashboard/              # Dashboard template
├── casepages/              # Component showcase pages
├── test/                   # Test files
├── examples/               # Usage examples
├── docs/                   # Documentation
├── INTEGRATION.md          # Integration guide
└── package.json            # Build scripts
```

## Build

```bash
cd kupola
npm install
npm run build    # Production build (Vite)
npm run build:rollup  # Alternative build (Rollup)
npm run dev      # Development server
```

## Documentation

- [Integration Guide](INTEGRATION.md) - Framework integration examples
- [API Documentation](docs/api.md) - API reference
- [showcase.html](dashboard/showcase.html) - Interactive component showcase
- [Case Pages](casepages/) - Component usage examples

## Browser Support

Chrome, Firefox, Safari, Edge (latest versions)

## License

MIT License

## Migration Notice

This project was previously known as **Nimbus Design System**. It has been renamed to **Kupola** with the following changes:

### Name Changes

| Old Name | New Name |
|----------|----------|
| `NimbusComponent` | `KupolaComponent` |
| `NimbusHttp` | `KupolaHttp` |
| `NimbusRouter` | `KupolaRouter` |
| `NimbusLifecycle` | `KupolaLifecycle` |
| `window.nimbusData` | `window.kupolaData` |
| `window.nimbusRegistry` | `window.kupolaRegistry` |

### File Changes

| Old Path | New Path |
|----------|----------|
| `js/nimbus-core.js` | `js/kupola-core.js` |
| `js/nimbus-lifecycle.js` | `js/kupola-lifecycle.js` |
| `js/nimbus-devtools.js` | `js/kupola-devtools.js` |
| `css/nimbus.css` | `css/kupola.css` |
| `types/nimbus.d.ts` | `types/kupola.d.ts` |
| `dist/nimbus.esm.js` | `dist/kupola.esm.js` |
| `dist/nimbus.cjs.js` | `dist/kupola.cjs.js` |
| `dist/nimbus.umd.js` | `dist/kupola.umd.js` |

### Removed Files

- `build.js` / `watch.js` - Legacy build scripts (replaced by Vite)
- `dev-server.js` - Unused development server
- `DOCS.md` - Outdated documentation
- `components/` - Legacy HTML components
- `common/` - Empty directory
- Temporary scripts: `rename-project.cjs`, `fix-remaining.cjs`, etc.