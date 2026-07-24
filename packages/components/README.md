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