# Kupola

> Lightweight UI toolkit for any web project. No heavy frontend frameworks required. Works seamlessly with Flask, Django, Gin, Spring Boot, ASP.NET Core, Express, and any backend framework that outputs HTML.

## Library Layout

> The library root directory is `kupola/`. All paths are relative to this root.

```
kupola/
├── css/                     # CSS stylesheets
│   ├── kupola.css           # Main CSS bundle
│   ├── colors_and_type.css  # Token definitions
│   ├── components.css       # Component styles
│   ├── components-ext.css   # Extended component styles
│   ├── scaffold.css         # Reset and utilities
│   ├── brand-themes.css     # 11 brand color themes
│   ├── theme-dark.css       # Dark theme tokens (default)
│   ├── theme-light.css      # Light theme tokens
│   ├── states.css           # Component states
│   ├── utilities.css        # Utility classes
│   ├── responsive.css       # Responsive design (PC/Pad/Phone)
│   ├── accessibility.css    # a11y support
│   └── animations.css       # Transitions and animations
├── js/                      # JavaScript utilities
│   ├── kupola-core.js       # Core framework (KupolaHttp, KupolaComponent)
│   ├── component.js         # Base component class
│   ├── kupola-lifecycle.js  # Lifecycle management
│   ├── composition-api.js   # Composition API (reactive, computed, watch)
│   ├── initializer.js       # Auto initialization manager
│   ├── registry.js          # Component registry
│   ├── global-events.js     # Global event manager
│   ├── router.js            # Client-side router
│   ├── http.js              # HTTP client (fetch-based)
│   ├── data-bind.js         # Data binding and event bus
│   ├── validation.js        # Form validation
│   ├── theme.js             # Theme/brand switching
│   ├── icons.js             # Icon renderer
│   ├── tooltip.js           # Tooltip system
│   ├── datepicker.js        # Datepicker component
│   ├── timepicker.js        # Timepicker component
│   ├── numberinput.js       # Number input component
│   ├── fileupload.js        # File upload component
│   ├── select.js            # Select component
│   ├── slider.js            # Slider component
│   ├── modal.js             # Modal component
│   ├── dialog.js            # Dialog component
│   ├── drawer.js            # Drawer component
│   ├── dropdown.js          # Dropdown component
│   ├── slide-captcha.js     # Slide captcha component
│   ├── heatmap.js           # Heatmap component
│   ├── virtual-list.js      # Virtual list component
│   ├── statcard.js          # Statistic card component
│   ├── image-preview.js     # Image preview component
│   ├── carousel.js          # Carousel component
│   ├── countdown.js         # Countdown component
│   ├── calendar.js          # Calendar component
│   ├── collapse.js          # Collapse component
│   ├── tag.js               # Tag component
│   ├── dynamic-tags.js      # Dynamic tags component
│   ├── color-picker.js      # Color picker component
│   ├── notification.js      # Notification component
│   ├── message.js           # Message component
│   ├── form.js              # Form utilities
│   ├── security.js          # Security utilities (XSS/CSRF)
│   ├── utils.js             # General utilities
│   ├── error-handler.js     # Global error handler
│   ├── performance.js       # Performance monitoring
│   ├── i18n.js              # Internationalization
│   ├── kupola-devtools.js   # DevTools panel
│   └── test-utils.js        # Testing utilities
├── icons/                   # 121 SVG icons (+ sprite)
│   ├── *.svg                # Individual icons
│   └── icons.svg            # SVG sprite
├── dist/                    # Build output
│   ├── kupola.esm.js        # ES Module format
│   ├── kupola.cjs.js        # CommonJS format
│   ├── kupola.umd.js        # UMD format
│   └── types/kupola.d.ts    # TypeScript types
├── src/                     # Build entry points
├── dashboard/               # Dashboard layout framework
│   ├── dashboard.css        # Layout styles
│   ├── dashboard.html       # Complete demo
│   └── dashboard.js         # Interactivity
├── templates/               # Flask/Gin templates
│   ├── base.html            # Base template
│   └── base_dashboard.html  # Dashboard base template
├── utils/                   # Multi-language utility functions
│   ├── kupola.py            # Python component generation functions
│   ├── kupola.go            # Go component generation functions
│   ├── Kupola.java          # Java component generation functions
│   ├── Kupola.cs            # C# component generation functions
│   ├── kupola.js            # Node.js component generation functions
│   └── kupola.rb            # Ruby component generation functions
├── docs/                    # Documentation
│   ├── api.md               # API documentation
│   └── kupola-vs-vue-react.md # Framework comparison
├── examples/                # Example projects
│   ├── basic_example.html   # HTML demo
│   └── flask_example/       # Flask complete example
├── snippets/                # IDE code snippets
│   └── kupola.code-snippets # VS Code snippets
├── version.json             # Version information
├── CHANGELOG.md             # Changelog
├── INTEGRATION.md           # Integration guide
├── PROJECT_SUMMARY.md       # Project summary
└── README.md                # Usage guide
```

## Brand Essentials

- **Surface**: dark canvas `--bg-base-default #1A1B1D`
- **Primary text**: `--text-default #D1D3DB`
- **Brand accent**: `--bg-brand #535164` (曾青, default) with 10 alternative colors
- **Status palette**: primary / success / alert / warning / error
- **Typography**: SF Pro / SF Pro Text / JetBrains Mono
- **Radii**: `2 / 4 / 6 / 8 / 10 / full`
- **Spacers**: `0 / 4 / 6 / 8 / 12 / 16 / 24 / 32 / 40`

## Brand Colors

| ID | Name | Color | Text Color |
|----|------|-------|------------|
| zengqing | 曾青 | #535164 | white (default) |
| green | 翠绿 | #32F08C | dark |
| xionghuang | 雄黄 | #FF9900 | dark |
| jianghuang | 姜黄 | #E2C027 | dark |
| lanlv | 蓝绿 | #12A182 | white |
| kongquelan | 孔雀蓝 | #0EB0C9 | dark |
| meiguizi | 玫瑰紫 | #BA2F7B | white |
| shihong | 柿红 | #F2481B | white |
| shanchahong | 山茶红 | #F05A46 | white |
| quhong | 紫云 | #B1A6CC | dark |
| roulan | 柔蓝 | #106898 | white |

## Components (48+)

| Slug | Type | Notes |
|------|------|-------|
| activity-rail | IDE rail | vertical activity bar with active state + divider |
| alert | Notification | 4 tones × simple/complex |
| avatar | User chip | sm/md/lg, square/accent |
| badge | Status tag | default / success / warning / danger / brand |
| button | Button | 8 variants × 3 sizes × 4 states |
| card | Surface card | header / actions |
| chat-composer | AI input | tool row + model chip + mic + send |
| checkbox | Form control | checked / unchecked / disabled |
| collapse | Accordion | collapsible sections |
| color-picker | Color selector | preset colors + custom input |
| date-picker | Date input | calendar popup, month navigation |
| dialog | Modal | overlay + footer |
| divider | Separator | horizontal rule |
| drawer | Side panel | slide-in panel from left/right |
| dynamic-tags | Tag input | add/remove tags dynamically |
| editor-tabs | IDE tabs | layered tab strip + close affordance + actions |
| empty | Empty state | placeholder for empty content |
| file-tree | File explorer | multi-depth, chevron |
| file-upload | File input | drag & drop, preview, delete |
| form | Form controls | input / textarea / select / checkbox / radio / switch |
| Heatmap | Data visualization | calendar-based heatmap with color levels |
| image | Media | image with placeholder, fallback, and error states |
| image-list | Media | image grid with selection support |
| image-preview | Image viewer | full-size image preview |
| stat-card | Data visualization | KPI card with number animation and trend indicators |
| kbd | Shortcut hint | keyboard key caps |
| menu | Dropdown | section labels, shortcut |
| message | Toast | floating message notifications |
| nav-list | Sidebar nav | grouped items with active state |
| notification | Notification | popup notifications |
| number-input | Numeric input | +/- buttons, min/max constraints |
| page-header | Page head | title + actions region |
| pagination | Page navigator | numeric with ellipsis |
| progress | Progress bar | determinate / indeterminate |
| progress-circle | Circular progress | SVG-based circular indicator |
| radio | Form control | single selection among options |
| select | Dropdown select | options dropdown |
| setting-row | Preference row | title + description + control |
| slide-captcha | Security | circle / slider mode, error refresh |
| slider | Range input | horizontal slider with value display |
| spin | Loading | spinner indicator |
| stat-card | KPI card | tabular numerals + delta |
| status-bar | IDE status bar | status items + dot indicators |
| switch | Toggle | on/off switch with thumb |
| table | Data table | avatar + tag cells |
| table-panel | Table container | bordered table with toolbar + footer pagination |
| tabs | Tabs | underline / filled / closable |
| tag | Status tag | default / success / warning / danger / brand |
| time-picker | Time input | time selection popup |
| timeline | Timeline | chronological event list |
| tooltip | Hint | custom tooltip with data-title |
| virtual-list | List | virtualized scrolling for large datasets |
| workbench-titlebar | IDE top bar | traffic lights + project selector + icon actions |

## Dashboard Framework

Complete 4-section layout:
- **Header** (48px): Logo + center menu + right icons (theme/brand/user)
- **Sidebar** (48px): Icon-only navigation with tooltips
- **Content**: Scrollable main area
- **Footer** (24px): Status indicators

## Templates

| Template | Description |
|----------|-------------|
| base.html | Minimal base template with CSS/JS includes |
| base_dashboard.html | Full dashboard layout with all features |

## Language-Specific Utilities

Kupola provides helper functions for popular backend languages:

### Python Utilities

`utils/kupola.py` provides component generation functions for Flask/Django:

| Function | Description |
|----------|-------------|
| kupola_button() | Generate button HTML |
| kupola_input() | Generate input field |
| kupola_card() | Generate card |
| kupola_table() | Generate table |
| kupola_dashboard_layout() | Generate dashboard layout |
| kupola_stat_card() | Generate stat card |
| kupola_html_tag() | Generate HTML tag with theme/brand |
| kupola_theme_script() | Generate theme script tag |
| kupola_brand_toggle() | Generate brand toggle button |

## Go Utilities

`utils/kupola.go` provides component generation functions for Gin/Echo/Beego:

| Function | Description |
|----------|-------------|
| Button(label, variant, size) | Generate button HTML |
| Input(label, name, placeholder, validate) | Generate input field |
| Card(title, body, footer) | Generate card |
| StatCard(title, value, trend, trendType) | Generate stat card |
| Badge(text, variant) | Generate badge |
| Avatar(initials, size, variant) | Generate avatar |
| ThemeScript(theme, brand) | Generate theme initialization script |
| DataBind(key, bindType) | Generate data-bind attribute |
| DataComponent(name) | Generate data-component attribute |
| DataValidate(rules) | Generate data-validate attribute |

### Java Utilities

`utils/Kupola.java` provides component generation functions for Spring Boot/Quarkus:

| Function | Description |
|----------|-------------|
| button(label, variant, size) | Generate button HTML |
| input(label, name, placeholder, validate) | Generate input field |
| card(title, body, footer) | Generate card |
| statCard(title, value, trend, trendType) | Generate stat card |
| badge(text, variant) | Generate badge |
| avatar(initials, size, variant) | Generate avatar |
| themeScript(theme, brand) | Generate theme initialization script |
| dataBind(key, bindType) | Generate data-bind attribute |
| dataComponent(name) | Generate data-component attribute |
| dataValidate(rules) | Generate data-validate attribute |

### C# Utilities

`utils/Kupola.cs` provides component generation functions for ASP.NET Core:

| Function | Description |
|----------|-------------|
| Button(label, variant, size) | Generate button HTML |
| Input(label, name, placeholder, validate) | Generate input field |
| Card(title, body, footer) | Generate card |
| StatCard(title, value, trend, trendType) | Generate stat card |
| Badge(text, variant) | Generate badge |
| Avatar(initials, size, variant) | Generate avatar |
| ThemeScript(theme, brand) | Generate theme initialization script |
| DataBind(key, bindType) | Generate data-bind attribute |
| DataComponent(name) | Generate data-component attribute |
| DataValidate(rules) | Generate data-validate attribute |

### Node.js Utilities

`utils/kupola.js` provides component generation functions for Express/Koa:

| Function | Description |
|----------|-------------|
| button(label, variant, size) | Generate button HTML |
| input(label, name, placeholder, validate) | Generate input field |
| card(title, body, footer) | Generate card |
| statCard(title, value, trend, trendType) | Generate stat card |
| badge(text, variant) | Generate badge |
| avatar(initials, size, variant) | Generate avatar |
| themeScript(theme, brand) | Generate theme initialization script |
| dataBind(key, bindType) | Generate data-bind attribute |
| dataComponent(name) | Generate data-component attribute |
| dataValidate(rules) | Generate data-validate attribute |

### Ruby Utilities

`utils/kupola.rb` provides component generation functions for Ruby on Rails:

| Function | Description |
|----------|-------------|
| button(label, variant, size) | Generate button HTML |
| input(label, name, placeholder, validate) | Generate input field |
| card(title, body, footer) | Generate card |
| stat_card(title, value, trend, trend_type) | Generate stat card |
| badge(text, variant) | Generate badge |
| avatar(initials, size, variant) | Generate avatar |
| theme_script(theme, brand) | Generate theme initialization script |
| data_bind(key, bind_type) | Generate data-bind attribute |
| data_component(name) | Generate data-component attribute |
| data_validate(rules) | Generate data-validate attribute |

## Usage

### HTML Only

```html
<link rel="stylesheet" href="/kupola/css/kupola.css">
<script src="/kupola/js/kupola-core.js"></script>

<button class="ds-btn ds-btn--brand">Submit</button>
```

### Flask Integration

```python
from kupola.utils.kupola import kupola_button
```

```html
{% extends "base_dashboard.html" %}

{% block content %}
<h1>Dashboard</h1>
{% endblock %}
```

### Gin Integration

```go
package main

import (
    "github.com/gin-gonic/gin"
    "your-project/kupola"
)

func main() {
    r := gin.Default()
    r.Static("/kupola", "./assets/kupola")
    r.LoadHTMLGlob("templates/*")
    
    r.GET("/", func(c *gin.Context) {
        c.HTML(200, "dashboard.html", gin.H{
            "Button":    kupola.Button,
            "Card":      kupola.Card,
            "StatCard":  kupola.StatCard,
        })
    })
    
    r.Run(":8080")
}
```

```html
<!-- templates/dashboard.html -->
<!DOCTYPE html>
<html>
<head>
    <link rel="stylesheet" href="/kupola/css/kupola.css">
</head>
<body>
    {{.Card "Welcome" "Hello Kupola!" ""}}
    {{.Button "Click Me" "brand" "md"}}
    <script src="/kupola/js/kupola-core.js"></script>
</body>
</html>
```

### Spring Boot Integration

```java
@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/kupola/**")
                .addResourceLocations("classpath:/static/kupola/");
    }
}
```

```html
<!-- templates/dashboard.html -->
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org">
<head>
    <link rel="stylesheet" th:href="@{/kupola/css/kupola.css}">
</head>
<body>
    <div class="ds-card">
        <div class="ds-card__body">
            <button class="ds-btn ds-btn--brand">Submit</button>
        </div>
    </div>
    <script th:src="@{/kupola/js/kupola-core.js}"></script>
</body>
</html>
```

### ASP.NET Core Integration

```csharp
public void Configure(IApplicationBuilder app)
{
    app.UseStaticFiles();
    app.UseStaticFiles(new StaticFileOptions
    {
        FileProvider = new PhysicalFileProvider(
            Path.Combine(Directory.GetCurrentDirectory(), "assets", "kupola")),
        RequestPath = "/kupola"
    });
}
```

```html
<!-- Views/Home/Index.cshtml -->
<!DOCTYPE html>
<html>
<head>
    <link rel="stylesheet" href="/kupola/css/kupola.css">
</head>
<body>
    <div class="ds-card">
        <div class="ds-card__body">
            <button class="ds-btn ds-btn--brand">Submit</button>
        </div>
    </div>
    <script src="/kupola/js/kupola-core.js"></script>
</body>
</html>
```

### Express.js Integration

```javascript
// app.js
const express = require('express');
const { button, card } = require('./utils/kupola.js');

const app = express();
app.use('/kupola', express.static('public/kupola'));

app.get('/', (req, res) => {
    const html = `<!DOCTYPE html>
<html>
<head>
    <link rel="stylesheet" href="/kupola/css/kupola.css">
</head>
<body>
    ${card('Welcome', 'Hello Kupola!', '')}
    ${button('Click Me', 'brand', 'md')}
    <script src="/kupola/js/kupola-core.js"></script>
</body>
</html>`;
    res.send(html);
});
```

### Ruby on Rails Integration

```ruby
# app/helpers/kupola_helper.rb
module KupolaHelper
  def button(label, variant = 'brand', size = 'md')
    "<button class=\"ds-btn ds-btn--#{variant} ds-btn--#{size}\">#{label}</button>".html_safe
  end

  def card(title, body, footer = '')
    footer_html = footer.empty? ? '' : "<div class=\"ds-card__footer\">#{footer}</div>"
    "<div class=\"ds-card\"><div class=\"ds-card__header\"><h3 class=\"ds-card__title\">#{title}</h3></div><div class=\"ds-card__body\">#{body}</div>#{footer_html}</div>".html_safe
  end
end
```

```erb
<!-- app/views/home/index.html.erb -->
<!DOCTYPE html>
<html>
<head>
    <%= stylesheet_link_tag '/kupola/css/kupola.css' %>
</head>
<body>
    <%= card 'Welcome', 'Hello Kupola!', '' %>
    <%= button 'Click Me', 'brand', 'md' %>
    <%= javascript_include_tag '/kupola/js/kupola-core.js' %>
</body>
</html>
```

## Responsive Design

Three breakpoints supported:
- **Phone**: < 768px - Sidebar moves to bottom, single column layout
- **Pad**: 768px - 1024px - 2-column grid, adjusted spacing
- **PC**: > 1024px - Full 4-column grid, standard layout

## Accessibility (a11y)

- ARIA labels for all interactive components
- Keyboard navigation support
- Focus-visible styles
- Skip link for screen readers
- High contrast mode support
- Reduced motion preference support

## Form Validation

Built-in validation via `data-validate` attribute:
- `required` - Field is required
- `email` - Valid email format
- `url` - Valid URL format
- `minLength:N` - Minimum length
- `maxLength:N` - Maximum length
- `pattern:regex` - Custom pattern
- `min:N` - Minimum value
- `max:N` - Maximum value
- `equalTo:id` - Match another field

## Data Binding

Two-way data binding via `data-bind` attribute:
- `data-bind="key:text"` - Bind text content
- `data-bind="key:value"` - Bind input value
- `data-bind="key:checked"` - Bind checkbox state
- `data-bind="key:disabled"` - Bind disabled state
- `data-bind="key:class:className"` - Conditional class

## Event Bus

Publish/subscribe event system:
```javascript
kupolaEvents.on('eventName', callback);
kupolaEvents.emit('eventName', data);
kupolaEvents.off('eventName', callback);
kupolaEvents.once('eventName', callback);
```

## Authoring Rules

1. **Never hardcode hex values.** Always reference `var(--token)`.
2. **Use utility classes.** Prefer `.flex`, `.grid`, `.gap-*` over custom CSS.
3. **Components are fluid.** All `.ds-*` components are fluid (`min-width: 0` + `1fr`).
4. **Icons use currentColor.** SVG icons inherit text color via `stroke="currentColor"`.
5. **Add ARIA labels.** All interactive components should have proper ARIA attributes.

## Workflow Commands

- **Add component**: `add-component` - Add a new component template
- **Add brand color**: `add-brand-color` - Add a new brand color theme
- **Generate template**: `generate-template` - Generate a new Flask template
- **Update documentation**: `update-docs` - Update API documentation
- **Update examples**: `update-examples` - Update example projects

## Version

Current version: `1.2.0` (see `version.json`)

## License

MIT