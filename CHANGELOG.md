# Changelog

## [1.3.1] - 2026-07-11

### Initial Release

**Kupola** — A lightweight, dependency-free declarative UI component system for server-side rendered web applications.

#### UI Components (50+)
- Buttons, inputs, cards, modals, dropdowns, tooltips, notifications
- Datepicker, timepicker, calendar, countdown
- Heatmap, virtual list, stat cards, image preview, carousel
- File upload, form validation, dynamic tags, pagination
- Drawer, dialog, collapse, slider, color picker, number input
- Select, tag, message, slide captcha

#### Core Systems
- **Declarative Initialization** — `data-*` attribute-based component discovery with `MutationObserver` for dynamic content
- **Reactive Data Binding** — Proxy-based two-way binding (`data-bind`), `ref()`, `store()`
- **Declarative Data Dependencies** — `useDeps()` / `useQuery()` with auto-caching, retry, stale-while-revalidate, transform
- **HTTP Client Plugin System** — `configureHttpClient()` to plug in Axios, @navios/http, or any HTTP client
- **Official Adapters** — `kupola/adapters/axios` and `kupola/adapters/navios-http`
- **Theme System** — Dark-first with light theme, `initTheme()` / `setTheme()` / `getTheme()`
- **Brand Colors** — 11 switchable brand themes, `setBrand()` / `getBrand()`
- **Icons** — 80+ SVG icons with `kupola-icons` helper
- **i18n** — Internationalization helper
- **Web Components** — Custom element wrappers for framework interop

#### Backend Integration
- Works with any backend that outputs HTML: Flask, Django, FastAPI, Gin, Spring Boot, ASP.NET, Express, Rails, Actix-web, etc.
- Three integration modes: Template rendering (SSR), RESTful API, Hybrid
- Data transform support for adapting backend JSON formats

#### Build & Tooling
- ESM (~418 KB, gzip ~88 KB), CJS, UMD builds
- Full TypeScript type definitions (`types/kupola.d.ts`)
- Vite plugin (`kupola/vite`)
- CSS with responsive design, accessibility (WCAG AA)

#### Package
- npm: `@kupola/kupola`
- License: MIT
- Zero runtime dependencies
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.1] - 2026-07-09

### Overview

This is the first public release of Kupola after one year of development. A modern, lightweight UI toolkit built for server-side rendered applications.

### Components

- **50+ UI Components**: Buttons, inputs, cards, modals, datepickers, timepickers, heatmap, virtual list, stat cards, image components, dropdown, select, color picker, message, notification, dialog, drawer, carousel, collapse, tags, progress, slider, switch, checkbox, radio, badge, timeline, divider, empty, spin, and more

### Core Features

- **Dual Themes**: Dark-first design with light theme support
- **11 Brand Colors**: Switchable brand colors based on Chinese traditional colors (曾青, 翠绿, 雄黄, 姜黄, 蓝绿, 孔雀蓝, 玫瑰紫, 柿红, 山茶红, 紫云, 柔蓝)
- **Responsive Design**: Works on PC, Pad, and Phone
- **Accessibility**: WCAG AA compliant
- **Form Validation**: Built-in validation with custom rules
- **Data Binding**: Two-way data binding system (Proxy-based)
- **State Management**: `KupolaStore` with state, getters, mutations, actions, snapshot, rollback
- **Routing**: Client-side router with nested routes and page transitions
- **HTTP Client**: Request caching, automatic retry, request cancellation
- **No Dependencies**: Pure HTML/CSS/JavaScript

### Architecture

- **ES Module Support**: Native ESM with `package.json` exports field
- **Modern Build**: Vite/Rolldown build system
- **Code Quality**: ESLint and Prettier for consistent code formatting
- **Unit Testing**: Jest with test coverage
- **TypeScript**: Comprehensive type definitions

### Multi-language Support

- Python (Flask/Django)
- Go (Gin/Echo)
- Java (Spring Boot)
- C# (ASP.NET Core)
- Node.js (Express/Koa)
- Ruby (Ruby on Rails)

### Browser Support

Chrome, Firefox, Safari, Edge (latest versions)