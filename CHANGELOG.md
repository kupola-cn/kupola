# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.1] - 2026-07-09

### Added

- **State Management**: Added `KupolaStore` state sharing with state, getters, mutations, actions
- **State Management**: Added state snapshot and rollback functionality (`snapshot()`, `rollback()`)
- **State Management**: Added async state management support for Promise/async-await
- **State Management**: Added deep state watching with `observe()` method
- **Routing**: Added nested route support with `children` configuration
- **Routing**: Added page transition animations (fadeIn/fadeOut)
- **HTTP**: Added request caching with `cacheTTL` configuration
- **HTTP**: Added automatic request retry with exponential backoff (`maxRetries`, `retryDelay`)
- **HTTP**: Added request cancellation with `cancelRequest()` method
- **Forms**: Added form serialization (`serializeForm()`) and form filling (`fillForm()`)
- **Utility Library**: Created `utils.js` with string/array/object/date utilities, debounce/throttle, validators, crypto tools
- **Virtual List**: Enhanced with dynamic height support, scroll events, scroll-to methods
- **TypeScript**: Updated type definitions for new features

### Fixed

- **Nested Routing**: Fixed path matching issue for nested routes
- **Virtual List**: Fixed infinite recursion loop in dynamic height calculation
- **Virtual List**: Fixed CSS overflow settings for proper scrolling

## [1.2.0] - 2026-07-09

### Added

- **Architecture**: Added `package.json` exports field for ES Module support
- **Architecture**: Added `vite.config.js` for modern Vite/Rolldown build support
- **Architecture**: Added `.eslintrc.cjs` with comprehensive linting rules
- **Architecture**: Added `.prettierrc` for consistent code formatting
- **Architecture**: Added `jest.config.cjs` and test setup for unit testing
- **Architecture**: Added comprehensive test scripts (`test`, `test:watch`, `test:coverage`)
- **Architecture**: Added lint scripts (`lint`, `lint:fix`) and format script
- **Security**: Added XSS protection utility (`escapeHtml`, `sanitize`)
- **Security**: Added CSRF protection mechanism
- **Error Handling**: Added unified error boundary and global error handler
- **Performance**: Added performance monitoring utility (`KupolaPerformance`)
- **Components**: Converted 7 functional components to class-based (Dropdown, Select, ColorPicker, Datepicker, Timepicker, Tooltip, SlideCaptcha)
- **HTTP**: Added `cancelAllRequests()` method for batch request cancellation
- **HTTP**: Fixed `cancelRequest()` to support all HTTP methods

### Changed

- **package.json**: Added `type: module` for ES Module compatibility
- **package.json**: Updated build scripts to support both Rollup and Vite
- **package.json**: Added dev dependencies (vite, eslint, prettier, jest)
- **KupolaHttp**: Fixed `response.ok` check for proper error handling
- **KupolaComponent**: Fixed `setState/setProps` to await lifecycle updates
- **KupolaLifecycle**: Fixed `onError` property/method name conflict
- **Data Bind**: Unified `createReactive()` and `wrapReactive()` implementations
- **Composition API**: Fixed computed() circular reference issue
- **Dialog**: Fixed incomplete event listener cleanup

### Fixed

- **Memory Leaks**: Fixed global event listeners in all components using GlobalEventManager
- **Memory Leaks**: Fixed Modal, ImagePreview, Heatmap, Datepicker listener cleanup
- **Memory Leaks**: Fixed SlideCaptcha touch/mouse event cleanup
- **Performance**: Fixed wrapReactive() duplicate Proxy creation using WeakMap cache
- **Initialization**: Added `__kupolaInitialized` flags to prevent duplicate initialization

## [1.1.1] - 2026-07-07

### Added

- **Components**: Added Statistic Card (`ds-statcard`) with number animation, trend indicators, and progress bar
- **Components**: Added Image (`ds-image`) with placeholder, fallback, and error states
- **Components**: Added Image List (`ds-image-list`) with grid layout and selection
- **Components**: Added Image Preview (`ds-image-preview`) with full-screen viewer
- **Components**: Added Tag (`ds-tag`) with closable functionality
- **File Upload**: Added file size limit (`data-max-size`), multi-file limit (`data-max-count`), error handling, image preview, and upload progress
- **Form Validation**: Enhanced validation to support DatePicker, Dropdown, and FileUpload components; added success state icons; added duplicate submission prevention

### Changed

- **Heatmap**: Changed from vertical to horizontal column layout for better visual alignment
- **Virtual List**: Fixed mouse wheel scrolling support for both vertical and horizontal modes
- **File Upload**: Enhanced disabled state with distinct visual styling

### Fixed

- **File Upload**: Fixed duplicate file selector popup caused by event bubbling
- **Heatmap**: Fixed "0 contributions" display by including all dates in mock data
- **Sidebar**: Fixed missing icons for Data and Data Viz navigation items
- **Heatmap**: Fixed color visibility in dark theme with improved green gradient colors

## [1.1.0] - 2026-07-07

### Added

- **Components**: Added 26+ new components including Heatmap, Virtual List, Slide Captcha, Countdown, Carousel, Drawer, Color Picker, Image Preview, Notification, Message, Collapse, Dynamic Tags, Timepicker, Number Input, Progress Circle, Slider, Checkbox, Radio, Switch, Badge, Timeline, Divider, Empty, Spin, etc.
- **Heatmap Color Customization**: Added `data-color` attribute support for custom heatmap colors
- **Brand Picker Auto-create**: Added automatic brand picker popup creation in theme.js
- **Form Validation**: Added comprehensive form validation system with multiple rules (required, email, phone, url, min, max, pattern)
- **Tooltip System**: Added custom tooltip system with `data-title` attribute and mouse-follow positioning
- **Data Binding**: Added two-way data binding system with event bus

### Changed

- **Default Brand Color**: Changed default brand color from 翠绿 (#32F08C) to 曾青 (#535164)
- **Brand Color API**: Renamed `setBrandColor()` to `setBrand()` for consistency
- **Dashboard Layout**: Fixed header display issues, improved scroll container handling

### Fixed

- **Event Listener Duplication**: Added execution flags to prevent duplicate event binding
- **Form Validation**: Fixed `.ds-dropdown` class name error in getValue(), changed to `.ds-select`
- **Brand Picker**: Fixed popup not showing on page load by checking `document.readyState`
- **Accessibility**: Improved icon visibility in both dark and light themes using CSS filter

## [1.0.0] - 2026-07-03

### Added

- **Components**: Added 14 components (buttons, cards, forms, tables, dialogs, pagination, stat cards, nav lists, file trees, alerts, tags, tabs, modals, avatars)
- **Themes**: Added dark and light themes with CSS variables
- **Brand Colors**: Added 11 brand colors (曾青, 翠绿, 雄黄, 姜黄, 蓝绿, 孔雀蓝, 玫瑰紫, 柿红, 山茶红, 紫云, 柔蓝)
- **Dashboard**: Added complete dashboard layout framework
- **Templates**: Added Flask base templates (base.html, base_dashboard.html)
- **Python Utilities**: Added kupola.py with component generation functions
- **SVG Sprite**: Added icons.svg sprite file for optimized icon loading
- **Documentation**: Added comprehensive README with usage examples

### Changed

- **Icons**: Updated icon colors to match Kupola design system
- **CSS**: Refactored CSS into modular files (kupola.css, brand-themes.css, states.css, utilities.css)