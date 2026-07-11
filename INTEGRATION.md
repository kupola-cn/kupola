# Kupola UI Toolkit - Integration Guide

## Table of Contents

1. [Flask Integration](#flask-integration)
2. [Django Integration](#django-integration)
3. [Static Site Integration](#static-site-integration)
4. [Python Helper Functions](#python-helper-functions)
5. [Production Deployment](#production-deployment)

---

## Flask Integration

### Step 1: Copy Files

Copy the `kupola` directory to your Flask project's `static` folder:

```
your-flask-app/
├── static/
│   └── kupola/
│       ├── css/
│       ├── js/
│       ├── icons/
├── templates/
└── app.py
```

### Step 2: Create Base Template

Create `templates/base.html`:

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{% block title %}Kupola{% endblock %}</title>
    
    <!-- Kupola CSS -->
    <link rel="stylesheet" href="{{ url_for('static', filename='kupola/css/kupola.css') }}">
</head>
<body data-theme="dark">
    {% block content %}{% endblock %}
    
    <!-- Kupola JS -->
    <script src="{{ url_for('static', filename='kupola/dist/kupola.umd.js') }}"></script>
    <script>
        kupolaBootstrap();
    </script>
    {% block scripts %}{% endblock %}
</body>
</html>
```

### Step 3: Use Components in Templates

Create `templates/index.html`:

```html
{% extends 'base.html' %}

{% block title %}Dashboard{% endblock %}

{% block content %}
<div class="ds-page-header">
    <div class="ds-page-header__left">
        <h1 class="ds-page-header__title">Welcome</h1>
        <p class="ds-page-header__subtitle">This is your dashboard</p>
    </div>
    <div class="ds-page-header__right">
        <button class="ds-btn ds-btn--brand">Get Started</button>
    </div>
</div>

<div class="ds-card">
    <div class="ds-card__body">
        <form class="ds-form" style="display: flex; flex-direction: column; gap: 16px; width: 300px;">
            <input type="text" class="ds-input" data-validate="required,email" placeholder="Email">
            <input type="password" class="ds-input" data-validate="required,min:6" placeholder="Password">
            <button type="submit" class="ds-btn ds-btn--brand">Login</button>
        </form>
    </div>
</div>
{% endblock %}
```

---

## Django Integration

### Step 1: Copy Files

Copy the `kupola` directory to your Django project's `static` folder:

```
your-django-app/
├── your_app/
│   ├── static/
│   │   └── kupola/
│   │       ├── css/
│   │       ├── js/
│   │       ├── icons/
│   └── templates/
└── settings.py
```

### Step 2: Configure Static Files

In `settings.py`:

```python
STATIC_URL = '/static/'
STATICFILES_DIRS = [
    os.path.join(BASE_DIR, 'your_app/static'),
]
```

### Step 3: Create Base Template

Create `templates/base.html`:

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{% block title %}Kupola{% endblock %}</title>
    
    <!-- Kupola CSS -->
    <link rel="stylesheet" href="{% static 'kupola/css/kupola.css' %}">
</head>
<body data-theme="dark">
    {% block content %}{% endblock %}
    
    <!-- Kupola JS -->
    <script src="{% static 'kupola/dist/kupola.umd.js' %}"></script>
    <script>
        kupolaBootstrap();
    </script>
    {% block scripts %}{% endblock %}
</body>
</html>
```

### Step 4: Use Components in Templates

Create `templates/index.html`:

```html
{% extends 'base.html' %}

{% block title %}Dashboard{% endblock %}

{% block content %}
<div class="ds-page-header">
    <div class="ds-page-header__left">
        <h1 class="ds-page-header__title">Welcome</h1>
        <p class="ds-page-header__subtitle">This is your dashboard</p>
    </div>
</div>
{% endblock %}
```

### Step 5: Register Custom Components (Optional)

You can register custom components using `defineComponent`:

```js
import { defineComponent } from '@kupola/kupola';

defineComponent('my-widget', {
  init(el) {
    // Your initialization logic
    el.addEventListener('click', () => console.log('clicked'));
  },
  cleanup(el) {
    // Cleanup when removed
  },
  dataAttribute: 'data-my-widget',
  cssClass: 'ds-my-widget'
});
```

Then use it in your template:

```html
<div data-my-widget>Click me</div>
```

Kupola's MutationObserver will automatically discover and initialize new elements.

---

## Static Site Integration

### Step 1: Copy Files

Copy the `kupola` directory to your static site:

```
your-static-site/
├── kupola/
│   ├── css/
│   ├── js/
│   └── icons/
└── index.html
```

### Step 2: Create HTML Page

Create `index.html`:

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kupola Dashboard</title>
    
    <!-- Kupola CSS -->
    <link rel="stylesheet" href="kupola/css/kupola.css">
</head>
<body data-theme="dark">
    <div class="ds-page-header">
        <div class="ds-page-header__left">
            <h1 class="ds-page-header__title">Welcome</h1>
        </div>
    </div>
    
    <!-- Kupola JS -->
    <script src="kupola/dist/kupola.umd.js"></script>
    <script>
        kupolaBootstrap();
    </script>
</body>
</html>
```

---

## Production Deployment

### Step 1: Build Files

Run the build script to generate compressed files:

```bash
cd kupola
npm run build
```

### Step 2: Use Compressed Files

In production, use the minified files from the `dist/` directory:

```html
<!-- CSS -->
<link rel="stylesheet" href="kupola/dist/css/kupola.css">

<!-- JS -->
<script src="kupola/dist/kupola.umd.js"></script>
```

### Step 3: CDN Deployment (Optional)

Upload the `dist/` directory to a CDN and reference it:

```html
<link rel="stylesheet" href="https://cdn.example.com/kupola/dist/css/kupola.css">
<script src="https://cdn.example.com/kupola/dist/kupola.umd.js"></script>
```

### Step 4: Browser Caching

Set appropriate caching headers for static assets:

- CSS/JS files: `Cache-Control: public, max-age=31536000`
- Icon files: `Cache-Control: public, max-age=31536000`

---

## Dashboard Integration

### Basic Dashboard Layout

```html
<div class="ds-dashboard">
    <header class="ds-dashboard__header">
        <!-- Header content -->
    </header>
    <div class="ds-dashboard__body">
        <aside class="ds-dashboard__sidebar">
            <!-- Sidebar content -->
        </aside>
        <main class="ds-dashboard__content">
            <!-- Main content -->
        </main>
    </div>
    <footer class="ds-dashboard__footer">
        <!-- Footer content -->
    </footer>
</div>
```

### Complete Dashboard Example

See `kupola/dashboard/dashboard.html` for a complete example.

---

## Tips

1. **Theme Switching**: Use `setTheme('light')` or `setTheme('dark')` to switch themes
2. **Brand Color**: Use `setBrand('zengqing')` to switch brand colors (default: 曾青 #535164)
3. **Validation**: Add `data-validate` attributes to form fields
4. **Tooltip**: Add `data-title` attributes to elements for tooltips
5. **Responsive**: The design system automatically adapts to different screen sizes

---

## Troubleshooting

### Icons Not Displaying

Ensure the icons path is correct. The icons should be in `kupola/icons/` directory.

### Theme Not Applying

Make sure the `data-theme` attribute is set on the `<body>` element.

### JavaScript Not Working

Kupola auto-bootstraps on DOMContentLoaded. If components don't initialize:

1. Ensure `kupola/dist/kupola.umd.js` is loaded
2. Call `kupolaBootstrap()` manually if loading dynamically
3. For dynamically added content, the MutationObserver handles auto-discovery
4. You can also call `bootstrapComponents(rootElement)` for a specific subtree

### CSS Not Loading

Verify the CSS path is correct and the file exists.

---

## Support

For issues or feature requests, please refer to the project documentation or create an issue.