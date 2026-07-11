# Kupola Flask Example

This is a sample Flask application demonstrating how to use the Kupola design system.

## Getting Started

### Prerequisites

- Python 3.8+
- pip

### Installation

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Create a symlink to the kupola folder (or copy it):
   ```bash
   # Linux/Mac
   ln -s ../../../kupola static/kupola
   
   # Windows
   mklink /D static\kupola ..\..\..\kupola
   ```

3. Run the application:
   ```bash
   python app.py
   ```

4. Open your browser and navigate to `http://localhost:5000`

## Project Structure

```
flask_example/
├── app.py              # Flask application
├── requirements.txt    # Dependencies
├── README.md           # This file
└── templates/          # Jinja2 templates
    ├── dashboard.html  # Dashboard page
    └── settings.html   # Settings page
```

## Usage

### Template Inheritance

All pages extend from `base_dashboard.html`:

```html
{% extends "base_dashboard.html" %}

{% block title %}My Page{% endblock %}

{% block content %}
<!-- Your content here -->
{% endblock %}
```

### Available Blocks

| Block | Description |
|-------|-------------|
| `title` | Page title |
| `header_center` | Top header center menu |
| `header_right` | Top header right icons |
| `sidebar` | Left sidebar navigation |
| `content` | Main content area |
| `footer_left` | Bottom status bar left |
| `footer_right` | Bottom status bar right |

### Components

You can use any Kupola component in your templates:

```html
<button class="ds-btn ds-btn--brand">Submit</button>
<input type="text" class="ds-input" placeholder="Enter text">
<div class="ds-card">...</div>
```

## Features

- Dark/Light theme toggle
- Brand color selection
- Responsive layout
- Dashboard with statistics
- Settings page with forms