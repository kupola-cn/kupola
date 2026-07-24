# @kupola/components

> 48+ accessible, responsive UI components for building modern web interfaces.

## Install

```bash
npm install @kupola/components
```

**Peer dependency**: `@kupola/core ^3.0.0`

## Quick Start

```js
import { Modal, Button, Alert } from '@kupola/components';

// Create a modal
const modal = Modal({
  title: 'Hello',
  closable: true,
}, html`<p>Modal content</p>`);

// Open modal
modal.open();

// Show alert
Alert.success('Operation successful');
```

## Components

### Layout
- [Grid](https://kupola-cn.github.io/kupola/components/display.html) - Responsive grid system
- [Divider](https://kupola-cn.github.io/kupola/components/display.html) - Visual separator
- [StatCard](https://kupola-cn.github.io/kupola/components/display.html) - Statistics card
- [Badge](https://kupola-cn.github.io/kupola/components/display.html) - Count badge

### Navigation
- [Breadcrumb](https://kupola-cn.github.io/kupola/components/navigation.html) - Page navigation
- [Menu](https://kupola-cn.github.io/kupola/components/navigation.html) - Navigation menu
- [Tabs](https://kupola-cn.github.io/kupola/components/navigation.html) - Tab switching
- [Pagination](https://kupola-cn.github.io/kupola/components/navigation.html) - Page pagination
- [Tree](https://kupola-cn.github.io/kupola/components/navigation.html) - Tree structure

### Forms
- [Input](https://kupola-cn.github.io/kupola/components/forms.html) - Text input
- [Textarea](https://kupola-cn.github.io/kupola/components/forms.html) - Multi-line input
- [Select](https://kupola-cn.github.io/kupola/components/forms.html) - Dropdown selection
- [Checkbox](https://kupola-cn.github.io/kupola/components/forms.html) - Checkbox group
- [Radio](https://kupola-cn.github.io/kupola/components/forms.html) - Radio group
- [Switch](https://kupola-cn.github.io/kupola/components/forms.html) - Toggle switch
- [Slider](https://kupola-cn.github.io/kupola/components/forms.html) - Range slider
- [NumberInput](https://kupola-cn.github.io/kupola/components/forms.html) - Number input
- [DatePicker](https://kupola-cn.github.io/kupola/components/forms.html) - Date picker
- [TimePicker](https://kupola-cn.github.io/kupola/components/forms.html) - Time picker
- [ColorPicker](https://kupola-cn.github.io/kupola/components/forms.html) - Color picker
- [FileUpload](https://kupola-cn.github.io/kupola/components/forms.html) - File upload
- [DynamicTags](https://kupola-cn.github.io/kupola/components/forms.html) - Editable tags

### Feedback
- [Alert](https://kupola-cn.github.io/kupola/components/feedback.html) - Alert message
- [Message](https://kupola-cn.github.io/kupola/components/feedback.html) - Toast notification
- [Notification](https://kupola-cn.github.io/kupola/components/feedback.html) - Notification box
- [Spin](https://kupola-cn.github.io/kupola/components/feedback.html) - Loading spinner
- [Skeleton](https://kupola-cn.github.io/kupola/components/feedback.html) - Placeholder

### Overlay
- [Modal](https://kupola-cn.github.io/kupola/components/overlay.html) - Modal dialog
- [Drawer](https://kupola-cn.github.io/kupola/components/overlay.html) - Slide panel
- [Dialog](https://kupola-cn.github.io/kupola/components/overlay.html) - Confirm dialog
- [Tooltip](https://kupola-cn.github.io/kupola/components/overlay.html) - Hint bubble
- [Dropdown](https://kupola-cn.github.io/kupola/components/overlay.html) - Dropdown menu
- [Collapse](https://kupola-cn.github.io/kupola/components/overlay.html) - Accordion

### Data
- [Table](https://kupola-cn.github.io/kupola/components/data.html) - Data table
- [Form](https://kupola-cn.github.io/kupola/components/data.html) - Form validation
- [Validation](https://kupola-cn.github.io/kupola/components/data.html) - Form validation utilities
- [Timeline](https://kupola-cn.github.io/kupola/components/data.html) - Timeline display
- [Heatmap](https://kupola-cn.github.io/kupola/components/data.html) - Heatmap chart
- [Empty](https://kupola-cn.github.io/kupola/components/data.html) - Empty state

### Media
- [Avatar](https://kupola-cn.github.io/kupola/components/media.html) - User avatar
- [Carousel](https://kupola-cn.github.io/kupola/components/media.html) - Image carousel
- [ImagePreview](https://kupola-cn.github.io/kupola/components/media.html) - Image lightbox
- [Progress](https://kupola-cn.github.io/kupola/components/media.html) - Progress bar
- [Tag](https://kupola-cn.github.io/kupola/components/media.html) - Tag label

### Tools
- [Calendar](https://kupola-cn.github.io/kupola/components/tools.html) - Calendar widget
- [Countdown](https://kupola-cn.github.io/kupola/components/tools.html) - Countdown timer
- [Kbd](https://kupola-cn.github.io/kupola/components/tools.html) - Keyboard key
- [VirtualList](https://kupola-cn.github.io/kupola/components/tools.html) - Virtual scrolling

### Icons

```js
import { Icons } from '@kupola/components/icons';

// Get SVG string
const svg = Icons.svg('user');

// Render all icons
Icons.render(document.body);

// Register custom icons
Icons.registerIcons({
  custom: '<path d="..."/>'
});
```

### Custom Icon Replacement

Kupola components use built-in icons, but you can replace them globally using `registerIcons`:

```js
import { registerIcons } from '@kupola/components/icon-config';

registerIcons({
  'x': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
  'chevron-down': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>',
  'check-circle': '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>',
});
```

Available icon names for replacement:
- `x` - Close icon (Modal, Drawer)
- `chevron-left` - Left arrow (Carousel, Datepicker, Pagination, ImagePreview)
- `chevron-right` - Right arrow (Carousel, Datepicker, Pagination, ImagePreview)
- `chevron-down` - Down arrow (Dropdown, Select, Collapse)
- `check-circle` - Success icon (Dialog, Message, Notification)
- `alert-triangle` - Warning icon (Dialog, Message, Notification)
- `x-circle` - Error icon (Dialog, Message, Notification)
- `info-circle` - Info icon (Dialog, Message, Notification)
- `calendar` - Calendar icon (Datepicker)
- `clock` - Clock icon (Timepicker)
- `plus` - Plus icon (DynamicTags)
- `upload` - Upload icon (FileUpload)
- `table` - Table icon (Empty)

### Third-Party Icon Integration

Kupola supports integration with any third-party icon library. Here are examples:

**Lucide Icons:**

```js
import { registerIcons } from '@kupola/components/icon-config';
import { X, ChevronDown, CheckCircle } from 'lucide-static';

registerIcons({
  'x': X,
  'chevron-down': ChevronDown,
  'check-circle': CheckCircle,
});
```

**Heroicons:**

```js
import { registerIcons } from '@kupola/components/icon-config';
import { X, ChevronDown, CheckCircle } from '@heroicons/24-solid';

registerIcons({
  'x': X,
  'chevron-down': ChevronDown,
  'check-circle': CheckCircle,
});
```

**Phosphor Icons:**

```js
import { registerIcons } from '@kupola/components/icon-config';
import { X, ChevronDown, CheckCircle } from 'phosphor-react';

registerIcons({
  'x': () => X({ size: 20, weight: 'bold' }).props.children,
  'chevron-down': () => ChevronDown({ size: 20, weight: 'bold' }).props.children,
});
```

**Iconify:**

```js
import { registerIcons } from '@kupola/components/icon-config';
import { icon } from '@iconify/iconify';

registerIcons({
  'x': () => icon.renderHTML({ icon: 'mdi:close' }),
  'chevron-down': () => icon.renderHTML({ icon: 'mdi:chevron-down' }),
});
```

**Font Awesome (SVG mode):**

```js
import { registerIcons } from '@kupola/components/icon-config';
import { X, ChevronDown, CheckCircle } from '@fortawesome/free-solid-svg-icons';
import { dom, svg } from '@fortawesome/fontawesome-svg-core';
dom.i2svg();

registerIcons({
  'x': () => svg(X).html[0],
  'chevron-down': () => svg(ChevronDown).html[0],
  'check-circle': () => svg(CheckCircle).html[0],
});
```

**Font Awesome (Font mode):**

```js
import { registerIcons } from '@kupola/components/icon-config';
import { library } from '@fortawesome/fontawesome-svg-core';
import { X, ChevronDown, CheckCircle } from '@fortawesome/free-solid-svg-icons';
library.add(X, ChevronDown, CheckCircle);

registerIcons({
  'x': '<i class="fa-solid fa-xmark"></i>',
  'chevron-down': '<i class="fa-solid fa-chevron-down"></i>',
  'check-circle': '<i class="fa-solid fa-circle-check"></i>',
});
```

**Material Symbols (Font mode):**

```html
<!-- Add CSS in HTML head -->
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght@400&display=swap">
```

```js
import { registerIcons } from '@kupola/components/icon-config';

registerIcons({
  'x': { type: 'font', class: 'material-symbols-outlined' },
  'chevron-down': { type: 'font', class: 'material-symbols-outlined' },
  'check-circle': { type: 'font', class: 'material-symbols-outlined' },
});
```

**Custom SVG Strings:**

```js
import { registerIcons } from '@kupola/components/icon-config';

registerIcons({
  'x': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><line x1="18" y1="6" x2="6" y2="18"/></svg>',
});
```

## CSS

Include the CSS file:

```html
<link rel="stylesheet" href="node_modules/@kupola/components/dist/css/index.css">
```

Or import in JavaScript:

```js
import '@kupola/components/css';
```

## TypeScript

```ts
import type { ModalOptions, ButtonProps, SelectOptions } from '@kupola/components';
```

## API Reference

See the [documentation site](https://kupola-cn.github.io/kupola/) for detailed API references.

## License

MIT