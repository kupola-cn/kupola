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
│       └── utils/
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
    <link rel="stylesheet" href="{{ url_for('static', filename='kupola/css/kupola.min.css') }}">
</head>
<body data-theme="dark">
    {% block content %}{% endblock %}
    
    <!-- Kupola JS -->
    <script src="{{ url_for('static', filename='kupola/js/kupola.min.js') }}"></script>
    <script>
        initTheme();
        initTooltip();
        initDatepickers();
        initFileUploads();
        initValidation();
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

### Step 4: Use Python Helper Functions

Import the helper functions in your Flask app:

```python
from utils.kupola import *

@app.route('/')
def index():
    return render_template('index.html', 
                           btn=btn,
                           card=card,
                           input_field=input_field)
```

In your template:

```html
{{ btn('Primary Button', variant='primary') }}
{{ card(title='Card Title', body='Card content') }}
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
│   │       └── utils/
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
    <link rel="stylesheet" href="{% static 'kupola/css/kupola.min.css' %}">
</head>
<body data-theme="dark">
    {% block content %}{% endblock %}
    
    <!-- Kupola JS -->
    <script src="{% static 'kupola/js/kupola.min.js' %}"></script>
    <script>
        initTheme();
        initTooltip();
        initDatepickers();
        initFileUploads();
        initValidation();
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

### Step 5: Use Python Helper Functions

Create a custom template tag in `your_app/templatetags/kupola_tags.py`:

```python
from django import template
from your_app.static.kupola.utils.kupola import *

register = template.Library()

@register.simple_tag
def ds_btn(text, variant='brand'):
    return btn(text, variant)

@register.simple_tag
def ds_card(title, body):
    return card(title, body)

@register.simple_tag
def ds_input(placeholder, validate=''):
    return input_field(placeholder, validate)
```

In your template:

```html
{% load kupola_tags %}

{% ds_btn 'Primary Button' 'primary' %}
{% ds_card 'Card Title' 'Card content' %}
{% ds_input 'Email' 'required,email' %}
```

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
    <link rel="stylesheet" href="kupola/css/kupola.min.css">
</head>
<body data-theme="dark">
    <div class="ds-page-header">
        <div class="ds-page-header__left">
            <h1 class="ds-page-header__title">Welcome</h1>
        </div>
    </div>
    
    <!-- Kupola JS -->
    <script src="kupola/js/kupola.min.js"></script>
    <script>
        initTheme();
        initTooltip();
        initDatepickers();
        initFileUploads();
        initValidation();
    </script>
</body>
</html>
```

---

## Python Helper Functions

### Available Functions

The `kupola.py` file provides helper functions for generating component HTML:

| Function | Description |
|----------|-------------|
| `btn(text, variant='brand', size='md', icon='')` | Button component |
| `card(title, body, footer='')` | Card component |
| `input_field(placeholder, validate='')` | Input component |
| `textarea(placeholder)` | Textarea component |
| `select(options, selected='')` | Select component |
| `checkbox(label, checked=False)` | Checkbox component |
| `radio(name, label, checked=False)` | Radio component |
| `switch(checked=False)` | Switch component |
| `badge(text, variant='default')` | Badge component |
| `alert(text, variant='info')` | Alert component |
| `tabs(tabs)` | Tabs component |
| `progress_bar(percent, indeterminate=False)` | Progress bar |
| `progress_circle(value, label='')` | Progress circle |
| `slider(label, value=50)` | Slider component |
| `datepicker(placeholder='Select date')` | Datepicker component |
| `fileupload(accept='')` | File upload component |
| `timeline(items)` | Timeline component |
| `avatar(image='', initials='')` | Avatar component |
| `breadcrumb(items)` | Breadcrumb component |

### Usage Example

```python
from utils.kupola import *

# Generate HTML
html = btn('Submit', variant='primary') + \
       card('User Profile', 'User information')

# In Flask template
return render_template('page.html', html=html)
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
<link rel="stylesheet" href="kupola/dist/css/kupola.min.css">

<!-- JS -->
<script src="kupola/dist/js/kupola.min.js"></script>
```

### Step 3: CDN Deployment (Optional)

Upload the `dist/` directory to a CDN and reference it:

```html
<link rel="stylesheet" href="https://cdn.example.com/kupola/css/kupola.min.css">
<script src="https://cdn.example.com/kupola/js/kupola.min.js"></script>
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

Check that all JS files are loaded in the correct order:

1. `icons.js`
2. `theme.js`
3. `tooltip.js`
4. `datepicker.js`
5. `fileupload.js`
6. `validation.js`
7. `data-bind.js`

### CSS Not Loading

Verify the CSS path is correct and the file exists.

---

## Support

For issues or feature requests, please refer to the project documentation or create an issue.