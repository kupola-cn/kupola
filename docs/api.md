# Kupola API Documentation

## CSS Classes

### Base Classes

| Class | Description |
|-------|-------------|
| `.ds-btn` | Button component |
| `.ds-btn--brand` | Brand-colored button |
| `.ds-btn--primary` | Primary button |
| `.ds-btn--secondary` | Secondary button |
| `.ds-btn--tertiary` | Ghost button |
| `.ds-btn--sm` | Small button |
| `.ds-btn--md` | Medium button (default) |
| `.ds-btn--lg` | Large button |
| `.ds-card` | Card component |
| `.ds-input` | Input field |
| `.ds-input--error` | Error state input |
| `.ds-input--success` | Success state input |
| `.ds-input--warning` | Warning state input |
| `.ds-table` | Table component |
| `.ds-table--striped` | Striped table rows |
| `.ds-tag` | Tag component |
| `.ds-tag--primary` | Primary tag |
| `.ds-tag--success` | Success tag |
| `.ds-tag--warning` | Warning tag |
| `.ds-tag--error` | Error tag |
| `.ds-alert` | Alert component |
| `.ds-alert--primary` | Primary alert |
| `.ds-alert--success` | Success alert |
| `.ds-alert--warning` | Warning alert |
| `.ds-alert--error` | Error alert |
| `.ds-modal` | Modal dialog |
| `.ds-avatar` | User avatar |
| `.ds-tabs` | Tab component |
| `.ds-navlist` | Navigation list |
| `.ds-heatmap` | Heatmap component |
| `.ds-heatmap--compact` | Compact heatmap |
| `.ds-heatmap--large` | Large heatmap |
| `.ds-virtual-list` | Virtual list component |
| `.ds-slide-captcha` | Slide captcha component |
| `.ds-slide-captcha--circle` | Circle mode captcha |
| `.ds-slide-captcha--slider` | Slider mode captcha |
| `.ds-countdown` | Countdown component |
| `.ds-carousel` | Carousel component |
| `.ds-drawer` | Drawer component |
| `.ds-color-picker` | Color picker component |
| `.ds-image-preview` | Image preview component |
| `.ds-notification` | Notification component |
| `.ds-message` | Message/toast component |
| `.ds-collapse` | Collapse/accordion component |
| `.ds-dynamic-tags` | Dynamic tags component |
| `.ds-timepicker` | Timepicker component |
| `.ds-numberinput` | Number input component |
| `.ds-progress-circle` | Progress circle component |
| `.ds-slider` | Slider component |
| `.ds-checkbox` | Checkbox component |
| `.ds-radio` | Radio component |
| `.ds-switch` | Switch component |
| `.ds-badge` | Badge component |
| `.ds-timeline` | Timeline component |
| `.ds-divider` | Divider component |
| `.ds-empty` | Empty state component |
| `.ds-spin` | Spin/loading component |
| `.ds-dialog` | Dialog component |
| `.ds-select` | Select component |
| `.ds-fileupload` | File upload component |
| `.ds-datepicker` | Datepicker component |

### Utility Classes

| Class | Description |
|-------|-------------|
| `.flex` | Flex container |
| `.flex-col` | Flex column |
| `.flex-row` | Flex row |
| `.items-center` | Align items center |
| `.justify-center` | Justify content center |
| `.justify-between` | Justify content between |
| `.gap-4` | Gap 4px |
| `.gap-8` | Gap 8px |
| `.gap-12` | Gap 12px |
| `.gap-16` | Gap 16px |
| `.mb-4` | Margin bottom 4px |
| `.mb-8` | Margin bottom 8px |
| `.mb-12` | Margin bottom 12px |
| `.mb-16` | Margin bottom 16px |
| `.mb-32` | Margin bottom 32px |
| `.text-sm` | Small text |
| `.text-secondary` | Secondary text color |
| `.text-tertiary` | Tertiary text color |
| `.font-medium` | Medium font weight |
| `.rounded-full` | Full rounded corners |

## CSS Variables

### Brand Colors

| Variable | Description |
|----------|-------------|
| `--bg-brand` | Brand background color |
| `--bg-brand-hover` | Brand hover color |
| `--bg-brand-disabled` | Brand disabled color |
| `--bg-brand-popup` | Brand popup color |
| `--text-brand` | Brand text color |
| `--icon-brand` | Brand icon color |
| `--border-brand` | Brand border color |
| `--text-onbrand` | Text color on brand background |

### Base Colors

| Variable | Description |
|----------|-------------|
| `--bg-base-default` | Base background |
| `--bg-base-secondary` | Secondary background |
| `--bg-overlay-l1` | Overlay level 1 |
| `--bg-overlay-l2` | Overlay level 2 |
| `--bg-overlay-l3` | Overlay level 3 |
| `--bg-overlay-l4` | Overlay level 4 |
| `--text-default` | Default text |
| `--text-secondary` | Secondary text |
| `--text-tertiary` | Tertiary text |
| `--icon-default` | Default icon |
| `--icon-secondary` | Secondary icon |
| `--icon-tertiary` | Tertiary icon |
| `--border-neutral-l1` | Neutral border level 1 |
| `--border-neutral-l2` | Neutral border level 2 |
| `--border-neutral-l3` | Neutral border level 3 |

### Status Colors

| Variable | Description |
|----------|-------------|
| `--status-primary-default` | Primary status |
| `--status-success-default` | Success status |
| `--status-warning-default` | Warning status |
| `--status-error-default` | Error status |
| `--status-alert-default` | Alert status |

## Python Functions

### kupola_button()

Generate a button.

```python
kupola_button(
    text='Submit',
    variant='brand',
    size='md',
    icon=None,
    badge=None,
    disabled=False,
    loading=False,
    type='button'
)
```

**Parameters:**
- `text` (str): Button text
- `variant` (str): 'brand', 'primary', 'secondary', 'tertiary', 'danger-strong', 'danger-subtle', 'warning', 'link'
- `size` (str): 'sm', 'md', 'lg'
- `icon` (str): Icon path
- `badge` (str): Badge content
- `disabled` (bool): Disabled state
- `loading` (bool): Loading state
- `type` (str): Button type

### kupola_input()

Generate an input field.

```python
kupola_input(
    label='Email',
    name='email',
    type='text',
    placeholder='Enter email',
    value='',
    disabled=False,
    error=False,
    success=False,
    warning=False
)
```

**Parameters:**
- `label` (str): Input label
- `name` (str): Input name
- `type` (str): Input type
- `placeholder` (str): Placeholder text
- `value` (str): Input value
- `disabled` (bool): Disabled state
- `error` (bool): Error state
- `success` (bool): Success state
- `warning` (bool): Warning state

### kupola_card()

Generate a card.

```python
kupola_card(
    title='Card Title',
    content='Card content',
    footer=None
)
```

**Parameters:**
- `title` (str): Card title
- `content` (str): Card content
- `footer` (str): Card footer

### kupola_table()

Generate a table.

```python
kupola_table(
    headers=['Name', 'Email', 'Role'],
    rows=[
        ['John Doe', 'john@example.com', 'Admin'],
        ['Jane Smith', 'jane@example.com', 'User']
    ],
    striped=False
)
```

**Parameters:**
- `headers` (list): Column headers
- `rows` (list): Table rows
- `striped` (bool): Striped rows

### kupola_dashboard_layout()

Generate dashboard layout.

```python
kupola_dashboard_layout(
    logo_text='Kupola',
    header_center=None,
    header_right=None,
    sidebar_items=None,
    footer_left=None,
    footer_right=None
)
```

**Parameters:**
- `logo_text` (str): Logo text
- `header_center` (list): Center menu items
- `header_right` (list): Right icon buttons
- `sidebar_items` (list): Sidebar navigation items
- `footer_left` (list): Left status items
- `footer_right` (list): Right status items

### kupola_stat_card()

Generate a stat card.

```python
kupola_stat_card(
    label='Total Projects',
    value='24',
    delta='+12%',
    delta_type='up'
)
```

**Parameters:**
- `label` (str): Stat label
- `value` (str): Stat value
- `delta` (str): Delta value
- `delta_type` (str): 'up' or 'down'

### kupola_html_tag()

Generate HTML tag with theme and brand attributes.

```python
kupola_html_tag(theme='dark', brand='green')
```

**Parameters:**
- `theme` (str): 'dark' or 'light'
- `brand` (str): Brand color ID

### kupola_theme_script()

Generate theme script tag.

```python
kupola_theme_script()
```

### kupola_brand_toggle()

Generate brand color toggle button.

```python
kupola_brand_toggle(brand='green')
```

**Parameters:**
- `brand` (str): Current brand color

### kupola_brand_picker()

Generate brand color picker.

```python
kupola_brand_picker()
```

## JavaScript Functions

### initTheme()

Initialize theme based on localStorage or system preference.

```javascript
initTheme();
```

### getTheme()

Get current theme.

```javascript
const theme = getTheme();
```

### setTheme(theme)

Set theme.

```javascript
setTheme('dark');
setTheme('light');
```

**Parameters:**
- `theme` (str): 'dark' or 'light'

### getBrand()

Get current brand color.

```javascript
const brand = getBrand();
```

### setBrand(brand)

Set brand color.

```javascript
setBrand('zengqing');       // 曾青 #535164 (default)
setBrand('green');          // 翠绿 #32F08C
setBrand('xionghuang');     // 雄黄 #FF9900
setBrand('jianghuang');     // 姜黄 #E2C027
setBrand('lanlv');          // 蓝绿 #12A182
setBrand('kongquelan');     // 孔雀蓝 #0EB0C9
setBrand('meiguizi');       // 玫瑰紫 #BA2F7B
setBrand('shihong');        // 柿红 #F2481B
setBrand('shanchahong');    // 山茶红 #F05A46
setBrand('quhong');         // 紫云 #B1A6CC
setBrand('roulan');         // 柔蓝 #106898
```

**Parameters:**
- `brand` (str): Brand color ID

### initTooltip()

Initialize custom tooltip system.

```javascript
initTooltip();
```

### initDatepickers()

Initialize datepicker components.

```javascript
initDatepickers();
```

### initTimepickers()

Initialize timepicker components.

```javascript
initTimepickers();
```

### initFileUploads()

Initialize file upload components.

```javascript
initFileUploads();
```

### initValidation()

Initialize form validation system.

```javascript
initValidation();
```

### Heatmap Class

Create a heatmap component.

```javascript
const heatmap = new Heatmap(element, {
    data: [{date: '2024-01-01', value: 5}],
    color: '#535164',
    cellSize: 14,
    onCellClick: (info) => console.log(info)
});
```

**Options:**
- `data` (Array): Heatmap data
- `startDate` (Date): Start date
- `endDate` (Date): End date
- `cellSize` (Number): Cell size in pixels
- `color` (String): Base color (supports `data-color` attribute)
- `onCellClick` (Function): Cell click callback

### VirtualList Class

Create a virtual list component.

```javascript
const virtualList = new VirtualList(element, {
    data: [{id: 1, title: 'Item 1'}],
    itemHeight: 48,
    renderItem: (item) => `<div>${item.title}</div>`,
    onItemClick: (item) => console.log(item)
});
```

**Options:**
- `data` (Array): List data
- `itemHeight` (Number): Item height in pixels
- `bufferSize` (Number): Buffer items above/below viewport
- `renderItem` (Function): Custom item renderer
- `onItemClick` (Function): Item click callback
- `selectedKey` (String/Number): Currently selected item key
- `keyField` (String): Unique identifier field name

### Dialog Class

Create a dialog component.

```javascript
const dialog = new Dialog({
    title: 'Confirm',
    content: 'Are you sure?',
    onConfirm: () => console.log('Confirmed'),
    onCancel: () => console.log('Cancelled')
});
dialog.show();
```

**Options:**
- `title` (String): Dialog title
- `content` (String): Dialog content
- `onConfirm` (Function): Confirm callback
- `onCancel` (Function): Cancel callback

### notification API

Show notification messages.

```javascript
notification.success('Operation successful');
notification.error('Operation failed');
notification.warning('Please check');
notification.info('Information');
```

### message API

Show message/toast notifications.

```javascript
message.success('Saved');
message.error('Error');
message.warning('Warning');
message.info('Info');
message.loading('Loading...');
```