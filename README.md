# Kupola

> A lightweight, dependency-free UI toolkit for server-side rendered web applications

[![License](https://img.shields.io/github/license/kupola-cn/kupola)](https://github.com/kupola-cn/kupola/blob/main/LICENSE)
[![npm](https://img.shields.io/npm/v/@kupola/kupola)](https://www.npmjs.com/package/@kupola/kupola)
[![GitHub stars](https://img.shields.io/github/stars/kupola-cn/kupola)](https://github.com/kupola-cn/kupola/stargazers)
[![GitHub issues](https://img.shields.io/github/issues/kupola-cn/kupola)](https://github.com/kupola-cn/kupola/issues)

Kupola is a modern design system built for server-side rendered applications. It works seamlessly with Flask, Django, Gin, Spring Boot, ASP.NET Core, Express, Ruby on Rails, and any backend framework that outputs HTML.

---

## ✨ Features

- **50+ UI Components**: Buttons, inputs, cards, modals, datepickers, timepickers, heatmap, virtual list, stat cards, image components, and more
- **Dual Themes**: Dark-first design with light theme support
- **11 Brand Colors**: Switchable brand colors based on Chinese traditional colors (曾青, 翠绿, 雄黄, 姜黄, 蓝绿, 孔雀蓝, 玫瑰紫, 柿红, 山茶红, 紫云, 柔蓝)
- **Responsive Design**: Works on PC, Pad, and Phone
- **Accessibility**: WCAG AA compliant
- **Form Validation**: Built-in validation with custom rules
- **Data Binding**: Two-way data binding system (Proxy-based)
- **No Dependencies**: Pure HTML/CSS/JavaScript
- **Multi-language Support**: Helper functions for Python, Go, Java, C#, Node.js, Ruby

---

## 🚀 Quick Start

### Install via npm

```bash
npm install @kupola/kupola
```

### Import CSS and JavaScript

```html
<link rel="stylesheet" href="node_modules/@kupola/kupola/dist/css/kupola.css">
<script src="node_modules/@kupola/kupola/dist/kupola.esm.js" type="module"></script>
```

### Or Use CDN

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@kupola/kupola/dist/css/kupola.css">
<script src="https://cdn.jsdelivr.net/npm/@kupola/kupola/dist/kupola.esm.js" type="module"></script>
```

### Or Copy Files

Copy the `kupola` directory to your project:

```
your-project/
├── kupola/
│   ├── css/
│   ├── js/
│   └── icons/
└── index.html
```

```html
<link rel="stylesheet" href="kupola/css/kupola.css">
<script src="kupola/js/kupola-core.js"></script>
```

---

## 📦 Usage

### Basic Components

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

### Forms with Validation

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

---

## 🔧 Framework Integration

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

---

## 📁 Project Structure

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
├── dashboard/              # Dashboard template
├── casepages/              # Component showcase pages
├── test/                   # Test files
├── examples/               # Usage examples
├── docs/                   # Documentation
└── package.json            # Build scripts
```

---

## 🛠️ Build & Development

```bash
# Install dependencies
npm install

# Development server (Vite)
npm run dev

# Production build (Vite)
npm run build

# Alternative build (Rollup)
npm run build:rollup

# Lint code
npm run lint

# Format code
npm run format

# Run tests
npm run test

# Run tests with coverage
npm run test:coverage
```

---

## 📖 Documentation

- **API Documentation**: [docs/api.md](docs/api.md) - Complete API reference
- **Integration Guide**: [INTEGRATION.md](INTEGRATION.md) - Framework integration examples
- **Interactive Showcase**: [showcase.html](dashboard/showcase.html) - Component showcase
- **Architecture Comparison**: [docs/kupola-vs-vue-react.md](docs/kupola-vs-vue-react.md) - Kupola vs Vue vs React

---

## 🌐 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Make your changes
4. Run tests (`npm run test`)
5. Lint code (`npm run lint`)
6. Commit your changes (`git commit -m 'feat: add your feature'`)
7. Push to the branch (`git push origin feature/your-feature`)
8. Open a Pull Request

---

## 📝 Changelog

See [CHANGELOG.md](CHANGELOG.md) for the complete changelog.

---

## 📄 License

Kupola is released under the [MIT License](LICENSE).

---

**Built with ❤️ by the Kupola team**