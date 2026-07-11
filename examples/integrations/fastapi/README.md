# Kupola FastAPI Example

A sample FastAPI application demonstrating how to use the Kupola design system with Python async backends.

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
   python main.py
   ```

4. Open your browser and navigate to `http://localhost:8000`

## Project Structure

```
fastapi/
├── main.py             # FastAPI application
├── requirements.txt    # Dependencies
├── README.md           # This file
├── static/             # Static files (symlink to kupola)
└── templates/          # Jinja2 templates
    ├── dashboard.html  # Dashboard page
    └── settings.html   # Settings page
```

## Features

- FastAPI async endpoints
- Jinja2 template inheritance
- Dark/Light theme toggle
- Brand color selection
- Responsive dashboard layout
- Settings page with forms
