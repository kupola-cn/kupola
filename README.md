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

### Buttons

```html
<button class="ds-btn ds-btn--brand">Primary</button>
<button class="ds-btn ds-btn--secondary">Secondary</button>
<button class="ds-btn ds-btn--outline">Outline</button>
<button class="ds-btn ds-btn--ghost">Ghost</button>
<button class="ds-btn ds-btn--danger">Danger</button>
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

### Data Binding

```html
<input type="text" data-bind="user.name:value" placeholder="Name">
<span data-bind="user.name:text"></span>
```

```javascript
kupolaData.data.user = { name: 'John' };
kupolaData.data.user.name = 'Jane';  // Auto updates all bound elements
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