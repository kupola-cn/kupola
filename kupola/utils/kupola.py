import os

COMPONENTS_DIR = os.path.join(os.path.dirname(__file__), '..', 'components')

def render_component(name, **kwargs):
    """Render a Kupola component HTML template.
    
    Args:
        name: Component name (e.g., 'button', 'alert', 'card')
        **kwargs: Context variables to substitute in the template
    
    Returns:
        str: Rendered HTML string
    """
    template_path = os.path.join(COMPONENTS_DIR, f'{name}.html')
    if not os.path.exists(template_path):
        return f'<span class="ds-alert ds-alert--danger">Component "{name}" not found</span>'
    
    with open(template_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    for key, value in kwargs.items():
        content = content.replace(f'{{{{ {key} }}}}', str(value))
        content = content.replace(f'{{{{{key}}}}}', str(value))
    
    return content


def nimbus_css_link(path='/nimbus/css/nimbus.css'):
    """Generate CSS link tag for Kupola."""
    return f'<link rel="stylesheet" href="{path}" />'


def nimbus_icons_script(path='/nimbus/js/icons.js'):
    """Generate script tag for icons."""
    return f'<script src="{path}"></script>'


def nimbus_alert(title, description, type='info'):
    """Generate an alert component.
    
    Args:
        title: Alert title
        description: Alert description
        type: 'info', 'success', 'warning', 'danger'
    
    Returns:
        str: Alert HTML
    """
    icon_map = {
        'info': 'info',
        'success': 'check-circle',
        'warning': 'alert',
        'danger': 'x-circle'
    }
    icon = icon_map.get(type, 'info')
    
    return f'''<div class="ds-alert ds-alert--{type}">
  <span class="ds-alert__icon"><img src="/nimbus/icons/{icon}.svg" width="16" height="16" alt="{icon}" class="icon"></span>
  <div>
    <div class="ds-alert__title">{title}</div>
    <div class="ds-alert__desc">{description}</div>
  </div>
</div>'''


def nimbus_card(title, description, tags=None, actions=None):
    """Generate a card component.
    
    Args:
        title: Card title
        description: Card description
        tags: List of tags (e.g., ['New', 'Feature'])
        actions: List of action tuples (label, variant)
    
    Returns:
        str: Card HTML
    """
    tags_html = ''
    if tags:
        tags_html = '<div style="display: flex; align-items: center; gap: var(--spacer-8); margin-bottom: var(--spacer-12);">'
        for tag in tags:
            tags_html += f'<span class="ds-tag">{tag}</span>'
        tags_html += '</div>'
    
    actions_html = ''
    if actions:
        actions_html = '<div style="display: flex; gap: var(--spacer-8); margin-top: var(--spacer-16);">'
        for label, variant in actions:
            actions_html += f'<button class="ds-btn ds-btn--{variant} ds-btn--sm">{label}</button>'
        actions_html += '</div>'
    
    return f'''<div class="ds-card">
  {tags_html}
  <div class="ds-card__title">{title}</div>
  <p class="ds-card__desc">{description}</p>
  {actions_html}
</div>'''


def nimbus_tag(label, type='default'):
    """Generate a tag component.
    
    Args:
        label: Tag text
        type: 'default', 'success', 'warning', 'danger', 'primary'
    
    Returns:
        str: Tag HTML
    """
    type_class = f' ds-tag--{type}' if type != 'default' else ''
    return f'<span class="ds-tag{type_class}">{label}</span>'


def nimbus_button(label, variant='primary', size='md', icon=None, loading=False, disabled=False):
    """Generate a button component.
    
    Args:
        label: Button text
        variant: 'brand', 'primary', 'secondary', 'tertiary', 'danger-strong', 'danger-subtle', 'warning', 'link'
        size: 'sm', 'md', 'lg'
        icon: Icon name (e.g., 'check', 'download')
        loading: Whether to show loading state
        disabled: Whether button is disabled
    
    Returns:
        str: Button HTML
    """
    icon_html = ''
    if icon:
        icon_html = f'<img src="/nimbus/icons/{icon}.svg" width="14" height="14" alt="{icon}" class="icon">'
    
    loading_class = ' ds-btn--loading' if loading else ''
    disabled_attr = ' disabled' if disabled else ''
    
    return f'''<button class="ds-btn ds-btn--{variant} ds-btn--{size}{loading_class}"{disabled_attr}>
  {icon_html}
  <span>{label}</span>
</button>'''


def nimbus_input(placeholder='', type='text', icon=None, value='', error=False, disabled=False):
    """Generate an input component.
    
    Args:
        placeholder: Input placeholder
        type: Input type
        icon: Icon name
        value: Input value
        error: Whether to show error state
        disabled: Whether input is disabled
    
    Returns:
        str: Input HTML
    """
    icon_html = ''
    if icon:
        icon_html = f'<span class="ds-input__icon"><img src="/nimbus/icons/{icon}.svg" width="14" height="14" alt="{icon}" class="icon"></span>'
    
    error_class = ' ds-input--error' if error else ''
    disabled_attr = ' disabled' if disabled else ''
    
    return f'''<div class="ds-input{error_class}">
  {icon_html}
  <input type="{type}" placeholder="{placeholder}" value="{value}"{disabled_attr} />
</div>'''


def nimbus_dialog(title, body, confirm_text='Confirm', cancel_text='Cancel', variant='primary'):
    """Generate a dialog component.
    
    Args:
        title: Dialog title
        body: Dialog content
        confirm_text: Confirm button text
        cancel_text: Cancel button text
        variant: Confirm button variant
    
    Returns:
        str: Dialog HTML
    """
    return f'''<div class="ds-backdrop" style="border-radius: var(--radius-4);">
  <div class="ds-dialog">
    <div class="ds-dialog__head">
      <span class="ds-dialog__title">{title}</span>
      <button class="ds-dialog__close" aria-label="Close">
        <img src="/nimbus/icons/x.svg" width="14" height="14" alt="x" class="icon">
      </button>
    </div>
    <div class="ds-dialog__body">
      {body}
    </div>
    <div class="ds-dialog__foot">
      <button class="ds-btn ds-btn--ghost">{cancel_text}</button>
      <button class="ds-btn ds-btn--{variant}">{confirm_text}</button>
    </div>
  </div>
</div>'''


def nimbus_pagination(current_page, total_pages, page_size=None, total_items=None):
    """Generate a pagination component.
    
    Args:
        current_page: Current page number
        total_pages: Total number of pages
        page_size: Items per page (optional)
        total_items: Total number of items (optional)
    
    Returns:
        str: Pagination HTML
    """
    pages = []
    
    if current_page > 1:
        pages.append(f'<button class="ds-pagination__item" aria-label="Previous"><img src="/nimbus/icons/chevron-right.svg" width="12" height="12" alt="chevron-right" class="icon" style="transform: rotate(180deg);"></button>')
    
    for i in range(1, min(total_pages + 1, 7)):
        if i == 1 or i == total_pages or (i >= current_page - 1 and i <= current_page + 1):
            active_class = ' is-active' if i == current_page else ''
            pages.append(f'<button class="ds-pagination__item{active_class} num">{i}</button>')
        elif i == 2 and current_page > 3:
            pages.append('<button class="ds-pagination__item" disabled>…</button>')
        elif i == total_pages - 1 and current_page < total_pages - 2:
            pages.append('<button class="ds-pagination__item" disabled>…</button>')
    
    if current_page < total_pages:
        pages.append(f'<button class="ds-pagination__item" aria-label="Next"><img src="/nimbus/icons/chevron-right.svg" width="12" height="12" alt="chevron-right" class="icon"></button>')
    
    info_html = ''
    if page_size and total_items:
        start = (current_page - 1) * page_size + 1
        end = min(current_page * page_size, total_items)
        info_html = f'<span class="text-tertiary num" style="font-size: var(--body-sm-font-size);">{start}–{end} of {total_items}</span>'
    
    return f'''<div style="display: flex; align-items: center; gap: var(--spacer-16);">
  <div class="ds-pagination">
    {''.join(pages)}
  </div>
  {info_html}
</div>'''


def nimbus_stat_card(label, value, delta=None, delta_type='up'):
    """Generate a stat card component.
    
    Args:
        label: Stat label
        value: Stat value
        delta: Delta value (e.g., '+12.4%')
        delta_type: 'up' or 'down'
    
    Returns:
        str: Stat card HTML
    """
    delta_html = ''
    if delta:
        delta_icon = 'trending-up' if delta_type == 'up' else 'trending-down'
        delta_html = f'''<span class="ds-statcard__delta is-{delta_type}">
    <img src="/nimbus/icons/{delta_icon}.svg" width="16" height="16" alt="{delta_icon}" class="icon" />
    {delta}
  </span>'''
    
    return f'''<div class="ds-statcard">
  <span class="ds-statcard__label">{label}</span>
  <span class="ds-statcard__value">{value}</span>
  {delta_html}
</div>'''


def nimbus_nav_list(groups):
    """Generate a navigation list component.
    
    Args:
        groups: List of groups, each group is a dict with 'title' and 'items'
                items is a list of dicts with 'label', 'icon', 'badge' (optional), 'active' (optional)
    
    Returns:
        str: Navigation list HTML
    """
    groups_html = []
    
    for group in groups:
        items_html = []
        for item in group.get('items', []):
            active_class = ' is-active' if item.get('active') else ''
            badge_html = f'<span class="ds-navlist__badge">{item.get("badge")}</span>' if item.get('badge') else ''
            
            items_html.append(f'''<a class="ds-navlist__item{active_class}">
      <img src="/nimbus/icons/{item.get("icon", "circle")}.svg" width="18" height="18" alt="{item.get("icon")}" class="icon" />
      <span class="ds-navlist__label">{item.get("label")}</span>
      {badge_html}
    </a>''')
        
        groups_html.append(f'''<div class="ds-navlist__group">
    <div class="ds-navlist__group-title">{group.get("title")}</div>
    {''.join(items_html)}
  </div>''')
    
    return f'<nav class="ds-navlist">{''.join(groups_html)}</nav>'


def nimbus_file_tree(items, depth=0):
    """Generate a file tree component.
    
    Args:
        items: List of items, each item is a dict with 'label', 'icon', 'type' ('file' or 'folder'),
               'children' (optional for folders), 'active' (optional)
        depth: Current depth level
    
    Returns:
        str: File tree HTML
    """
    rows_html = []
    
    for item in items:
        active_class = ' is-active' if item.get('active') else ''
        is_folder = item.get('type') == 'folder'
        is_expanded = item.get('expanded', True)
        
        chevron_icon = 'chevron-down' if (is_folder and is_expanded) else 'chevron-right'
        chevron_class = ' ds-filetree__chevron--leaf' if not is_folder else ''
        
        icon_class = f' ds-filetree__icon--{item.get("icon")}' if item.get('icon') else ' ds-filetree__icon--folder'
        icon_name = 'folder' if is_folder else 'file-text'
        
        rows_html.append(f'''<div class="ds-filetree__row{active_class}" data-depth="{depth}">
    <img src="/nimbus/icons/{chevron_icon}.svg" width="14" height="14" alt="{chevron_icon}" class="icon ds-filetree__chevron{chevron_class}" />
    <img src="/nimbus/icons/{icon_name}.svg" width="16" height="16" alt="{icon_name}" class="icon{icon_class}" />
    <span class="ds-filetree__label">{item.get("label")}</span>
  </div>''')
        
        if is_folder and is_expanded and item.get('children'):
            rows_html.append(nimbus_file_tree(item.get('children'), depth + 1))
    
    return ''.join(rows_html)


def nimbus_theme_script(path='/nimbus/js/theme.js'):
    """Generate script tag for theme switching."""
    return f'<script src="{path}"></script>'


def nimbus_theme_toggle():
    """Generate theme toggle button."""
    return '''<button data-theme-toggle class="ds-btn ds-btn--ghost ds-btn--sm ds-btn--icon" style="position: fixed; top: 16px; right: 16px; z-index: 9999;">
  <img class="theme-icon" src="/nimbus/icons/sun.svg" width="14" height="14" alt="Toggle theme">
</button>'''


BRAND_OPTIONS = [
    {'id': 'green', 'name': '翠绿', 'color': '#32F08C'},
    {'id': 'xionghuang', 'name': '雄黄', 'color': '#FF9900'},
    {'id': 'jianghuang', 'name': '姜黄', 'color': '#E2C027'},
    {'id': 'lanlv', 'name': '蓝绿', 'color': '#12A182'},
    {'id': 'kongquelan', 'name': '孔雀蓝', 'color': '#0EB0C9'},
    {'id': 'meiguizi', 'name': '玫瑰紫', 'color': '#BA2F7B'},
    {'id': 'shihong', 'name': '柿红', 'color': '#F2481B'},
    {'id': 'quhong', 'name': '紫云', 'color': '#B1A6CC'},
    {'id': 'shanchahong', 'name': '山茶红', 'color': '#F05A46'},
    {'id': 'zengqing', 'name': '曾青', 'color': '#535164'},
    {'id': 'roulan', 'name': '柔蓝', 'color': '#106898'}
]


def nimbus_brand_toggle(brand='green'):
    """Generate brand color toggle button.
    
    Args:
        brand: Current brand color ID
    
    Returns:
        str: Brand toggle button HTML
    """
    brand_info = next((b for b in BRAND_OPTIONS if b['id'] == brand), BRAND_OPTIONS[0])
    return f'''<button data-brand-toggle class="ds-btn ds-btn--ghost ds-btn--sm" style="position: fixed; top: 16px; right: 56px; z-index: 9999; display: flex; align-items: center; gap: 6px;">
  <span class="brand-icon" style="width: 12px; height: 12px; border-radius: 50%; background-color: {brand_info['color']};"></span>
  <span class="brand-name" style="font-size: 11px;">{brand_info['name']}</span>
</button>'''


def nimbus_brand_picker():
    """Generate brand color picker dropdown.
    
    Returns:
        str: Brand picker HTML
    """
    buttons_html = []
    for brand in BRAND_OPTIONS:
        buttons_html.append(f'''<button class="ds-menu__item" data-brand-btn="{brand['id']}" style="display: flex; align-items: center; gap: 8px;">
    <span style="width: 12px; height: 12px; border-radius: 50%; background-color: {brand['color']};"></span>
    <span>{brand['name']}</span>
  </button>''')
    
    return f'''<div class="ds-menu" id="brand-picker" style="position: fixed; top: 56px; right: 16px; z-index: 9998; display: none;">
  {''.join(buttons_html)}
</div>


<script>
  const brandToggle = document.querySelector('[data-brand-toggle]');
  const brandPicker = document.getElementById('brand-picker');
  
  brandToggle.addEventListener('click', (e) => {{
    e.stopPropagation();
    brandPicker.style.display = brandPicker.style.display === 'none' ? 'block' : 'none';
  }});
  
  document.addEventListener('click', () => {{
    brandPicker.style.display = 'none';
  }});
  
  brandPicker.addEventListener('click', (e) => {{
    e.stopPropagation();
    brandPicker.style.display = 'none';
  }});
</script>'''


def nimbus_html_tag(theme='dark', brand='green'):
    """Generate HTML tag with theme and brand attributes.
    
    Args:
        theme: 'dark' or 'light'
        brand: Brand color ID
    
    Returns:
        str: HTML tag
    """
    return f'<html lang="zh-CN" data-theme="{theme}" data-brand="{brand}">'


def nimbus_checkbox(label, checked=False, disabled=False, name=None, value=None):
    """Generate a checkbox component.
    
    Args:
        label: Checkbox label text
        checked: Whether checkbox is checked
        disabled: Whether checkbox is disabled
        name: Input name attribute
        value: Input value attribute
    
    Returns:
        str: Checkbox HTML
    """
    checked_attr = ' checked' if checked else ''
    disabled_attr = ' disabled' if disabled else ''
    name_attr = f' name="{name}"' if name else ''
    value_attr = f' value="{value}"' if value else ''
    
    return f'''<label class="ds-checkbox">
  <input type="checkbox"{checked_attr}{disabled_attr}{name_attr}{value_attr}>
  <span class="ds-checkbox__box"></span>
  <span class="ds-checkbox__label">{label}</span>
</label>'''


def nimbus_radio(label, checked=False, disabled=False, name=None, value=None):
    """Generate a radio component.
    
    Args:
        label: Radio label text
        checked: Whether radio is checked
        disabled: Whether radio is disabled
        name: Input name attribute
        value: Input value attribute
    
    Returns:
        str: Radio HTML
    """
    checked_attr = ' checked' if checked else ''
    disabled_attr = ' disabled' if disabled else ''
    name_attr = f' name="{name}"' if name else ''
    value_attr = f' value="{value}"' if value else ''
    
    return f'''<label class="ds-radio">
  <input type="radio"{checked_attr}{disabled_attr}{name_attr}{value_attr}>
  <span class="ds-radio__dot"></span>
  <span class="ds-radio__label">{label}</span>
</label>'''


def nimbus_switch(checked=False, disabled=False, name=None):
    """Generate a switch component.
    
    Args:
        checked: Whether switch is checked
        disabled: Whether switch is disabled
        name: Input name attribute
    
    Returns:
        str: Switch HTML
    """
    checked_attr = ' checked' if checked else ''
    disabled_attr = ' disabled' if disabled else ''
    name_attr = f' name="{name}"' if name else ''
    
    return f'''<label class="ds-switch">
  <input type="checkbox"{checked_attr}{disabled_attr}{name_attr}>
  <span class="ds-switch__thumb"></span>
</label>'''


def nimbus_select(options, value=None, placeholder='Select option'):
    """Generate a select component.
    
    Args:
        options: List of options (dict with 'value' and 'label')
        value: Selected value
        placeholder: Placeholder text
    
    Returns:
        str: Select HTML
    """
    selected_label = placeholder
    items_html = []
    
    for opt in options:
        is_active = opt['value'] == value
        if is_active:
            selected_label = opt['label']
        
        items_html.append(f'<button class="ds-select__item{" is-active" if is_active else ""}" data-value="{opt["value"]}">{opt["label"]}</button>')
    
    return f'''<div class="ds-select">
  <button class="ds-select__trigger" data-select-trigger>
    <span>{selected_label}</span>
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="butt" stroke-linejoin="miter">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  </button>
  <div class="ds-select__menu">
    {''.join(items_html)}
  </div>
</div>'''


def nimbus_badge(text=None, type='default', dot=False):
    """Generate a badge component.
    
    Args:
        text: Badge text
        type: 'default', 'brand', 'success', 'warning', 'error'
        dot: Whether to show as a dot
    
    Returns:
        str: Badge HTML
    """
    type_class = f' ds-badge--{type}' if type != 'default' else ''
    dot_class = ' ds-badge--dot' if dot else ''
    
    return f'<span class="ds-badge{type_class}{dot_class}">{text or ""}</span>'


def nimbus_tooltip(text, position='top'):
    """Generate a tooltip component.
    
    Args:
        text: Tooltip text
        position: 'top', 'bottom', 'left', 'right'
    
    Returns:
        str: Tooltip HTML attribute
    """
    return f'data-tooltip="{text}" data-tooltip-position="{position}"'


def nimbus_spin(size='md', text=None):
    """Generate a spin/loading component.
    
    Args:
        size: 'sm', 'md', 'lg'
        text: Loading text
    
    Returns:
        str: Spin HTML
    """
    size_class = f' ds-spin--{size}' if size != 'md' else ''
    text_html = f'<span class="ds-spin__text">{text}</span>' if text else ''
    
    return f'''<div class="ds-spin{size_class}">
  <div class="ds-spin__loader"></div>
  {text_html}
</div>'''


def nimbus_progress(percent=0, status='default', size='md', indeterminate=False):
    """Generate a progress component.
    
    Args:
        percent: Progress percentage (0-100)
        status: 'default', 'error', 'warning'
        size: 'sm', 'md'
        indeterminate: Whether to show indeterminate animation
    
    Returns:
        str: Progress HTML
    """
    size_class = ' ds-progress--sm' if size == 'sm' else ''
    indeterminate_class = ' ds-progress--indeterminate' if indeterminate else ''
    status_class = f' is-{status}' if status != 'default' else ''
    width_style = f' style="width: {percent}%;"' if not indeterminate else ''
    
    return f'''<div class="ds-progress{size_class}{indeterminate_class}">
  <div class="ds-progress__bar{status_class}"{width_style}></div>
</div>'''


def nimbus_empty(title='No Data', description=None, icon='box'):
    """Generate an empty state component.
    
    Args:
        title: Empty state title
        description: Empty state description
        icon: Icon name
    
    Returns:
        str: Empty HTML
    """
    description_html = f'<div class="ds-empty__description">{description}</div>' if description else ''
    
    return f'''<div class="ds-empty">
  <div class="ds-empty__icon">
    <img src="/nimbus/icons/{icon}.svg" width="48" height="48" alt="{icon}" class="icon">
  </div>
  <div class="ds-empty__title">{title}</div>
  {description_html}
</div>'''


def nimbus_divider(text=None, vertical=False):
    """Generate a divider component.
    
    Args:
        text: Divider text
        vertical: Whether to show vertical divider
    
    Returns:
        str: Divider HTML
    """
    vertical_class = ' ds-divider--vertical' if vertical else ''
    text_html = f'<span class="ds-divider__text">{text}</span>' if text else ''
    
    return f'<div class="ds-divider{vertical_class}">{text_html}</div>'


def nimbus_tooltip_script(path='/nimbus/js/tooltip.js'):
    """Generate script tag for tooltip functionality."""
    return f'<script src="{path}"></script>'


def nimbus_select_script(path='/nimbus/js/select.js'):
    """Generate script tag for select functionality."""
    return f'<script src="{path}"></script>'


# ===== Dashboard Utilities =====

def nimbus_dashboard_header(logo_text='Kupola', center_items=None, right_items=None):
    """Generate dashboard header.
    
    Args:
        logo_text: Logo text
        center_items: List of center menu items (dict with 'text', 'variant')
        right_items: List of right icon buttons (dict with 'icon', 'badge', 'title')
    
    Returns:
        str: Header HTML
    """
    center_html = ''
    if center_items and isinstance(center_items, list):
        center_html = ''.join([
            f'<button class="ds-btn ds-btn--{item.get("variant", "ghost")} ds-btn--sm">{item.get("text")}</button>'
            for item in center_items
        ])
    
    right_html = ''
    if right_items and isinstance(right_items, list):
        right_html = ''.join([
            f'''<button class="ds-btn ds-btn--ghost ds-btn--sm ds-btn--icon" title="{item.get("title", "")}">
    <img src="/nimbus/icons/{item.get("icon")}.svg" width="16" height="16" alt="{item.get("icon")}" class="icon">
    {f'<span class="ds-btn__badge">{item.get("badge")}</span>' if item.get("badge") else ''}
  </button>'''
            for item in right_items
        ])
    
    return f'''<header class="ds-dashboard__header">
  <div class="ds-dashboard__header-left">
    <div class="ds-dashboard__logo">
      <div class="ds-dashboard__logo-icon"></div>
      <span>{logo_text}</span>
    </div>
  </div>
  <div class="ds-dashboard__header-center">
    {center_html}
  </div>
  <div class="ds-dashboard__header-right">
    {right_html}
    <div class="ds-avatar" title="User">
      <img src="/nimbus/icons/user.svg" width="14" height="14" alt="user" class="icon">
    </div>
  </div>
</header>'''


def nimbus_dashboard_sidebar(items=None):
    """Generate dashboard sidebar.
    
    Args:
        items: List of sidebar items (dict with 'title', 'icon', 'active', 'badge')
    
    Returns:
        str: Sidebar HTML
    """
    if not items or not isinstance(items, list):
        items = [
            {'title': 'Dashboard', 'icon': 'layout-grid', 'active': True},
            {'title': 'Projects', 'icon': 'layers'},
            {'title': 'Tasks', 'icon': 'check-square'},
            {'title': 'Files', 'icon': 'folder-open'},
            {'title': 'Calendar', 'icon': 'calendar'},
            {'title': 'Messages', 'icon': 'mail', 'badge': '5'},
        ]
    
    items_html = ''.join([
        f'''<div class="ds-dashboard__sidebar-item{item.get("active") and " is-active" or ""}" data-title="{item.get("title")}">
    <img src="/nimbus/icons/{item.get("icon")}.svg" width="18" height="18" alt="{item.get("title")}" class="icon">
    {f'<span class="ds-navlist__badge" style="position: absolute; top: -4px; right: -4px; font-size: 10px; padding: 1px 4px;">{item.get("badge")}</span>' if item.get("badge") else ''}
  </div>'''
        for item in items
    ])
    
    return f'''<aside class="ds-dashboard__sidebar">
  <nav class="ds-dashboard__sidebar-nav">
    {items_html}
  </nav>
</aside>'''


def nimbus_dashboard_footer(left_items=None, right_items=None):
    """Generate dashboard footer/status bar.
    
    Args:
        left_items: List of left status items (dict with 'text', 'type', 'status')
        right_items: List of right status items (dict with 'text')
    
    Returns:
        str: Footer HTML
    """
    if not left_items or not isinstance(left_items, list):
        left_items = [
            {'text': 'Connected', 'type': 'dot', 'status': 'success'},
            {'text': 'v1.0.0'},
        ]
    
    if not right_items or not isinstance(right_items, list):
        right_items = [
            {'text': 'Branch: main'},
            {'text': 'Last sync: 2 min ago'},
        ]
    
    left_html = ''.join([
        f'''<div class="ds-dashboard__status-item">
    {f'<span class="ds-dashboard__status-dot{item.get("status") and " is-" + item.get("status") or ""}"></span>' if item.get("type") == 'dot' else ''}
    <span>{item.get("text")}</span>
  </div>'''
        for item in left_items
    ])
    
    right_html = ''.join([
        f'''<div class="ds-dashboard__status-item">
    <span>{item.get("text")}</span>
  </div>'''
        for item in right_items
    ])
    
    return f'''<footer class="ds-dashboard__footer">
  <div class="ds-dashboard__footer-left">
    {left_html}
  </div>
  <div class="ds-dashboard__footer-right">
    {right_html}
  </div>
</footer>'''


def nimbus_dashboard_layout(logo_text='Kupola', header_center=None, header_right=None, sidebar_items=None, footer_left=None, footer_right=None):
    """Generate complete dashboard layout.
    
    Args:
        logo_text: Logo text
        header_center: Center menu items
        header_right: Right icon buttons
        sidebar_items: Sidebar navigation items
        footer_left: Left status items
        footer_right: Right status items
    
    Returns:
        str: Complete dashboard layout HTML
    """
    return f'''<div class="ds-dashboard">
  {nimbus_dashboard_header(logo_text, header_center, header_right)}
  <div class="ds-dashboard__main">
    {nimbus_dashboard_sidebar(sidebar_items)}
    <main class="ds-dashboard__content">
      {{% block content %}}{{% endblock %}}
    </main>
  </div>
  {nimbus_dashboard_footer(footer_left, footer_right)}
</div>'''


def nimbus_dashboard_script(path='/nimbus/dashboard/dashboard.js'):
    """Generate dashboard script tag."""
    return f'<script src="{path}"></script>'


def nimbus_dashboard_css(path='/nimbus/dashboard/dashboard.css'):
    """Generate dashboard CSS link tag."""
    return f'<link rel="stylesheet" href="{path}">'


def nimbus_dashboard_stat_card(label, value, delta=None, delta_type='up'):
    """Generate stat card for dashboard.
    
    Args:
        label: Stat label
        value: Stat value
        delta: Delta value
        delta_type: 'up' or 'down'
    
    Returns:
        str: Stat card HTML
    """
    delta_html = ''
    if delta:
        delta_icon = 'trending-up' if delta_type == 'up' else 'trending-down'
        delta_html = f'''<span class="ds-statcard__delta is-{delta_type}">
    <img src="/nimbus/icons/{delta_icon}.svg" width="16" height="16" alt="{delta_icon}" class="icon" />
    {delta}
  </span>'''
    
    return f'''<div class="ds-statcard">
  <span class="ds-statcard__label">{label}</span>
  <span class="ds-statcard__value">{value}</span>
  {delta_html}
</div>'''


def nimbus_dashboard_progress_bar(label, percentage, color='brand'):
    """Generate progress bar for dashboard.
    
    Args:
        label: Progress label
        percentage: Progress percentage (0-100)
        color: Color variant
    
    Returns:
        str: Progress bar HTML
    """
    return f'''<div>
  <div class="flex justify-between mb-4">
    <span class="text-sm">{label}</span>
    <span class="text-sm text-tertiary">{percentage}%</span>
  </div>
  <div class="h-2 bg-overlay-l2 rounded-full overflow-hidden">
    <div class="h-full bg-{color} rounded-full" style="width: {percentage}%;"></div>
  </div>
</div>'''


def nimbus_activity_rail(items=None):
    """Generate activity rail component.
    
    Args:
        items: List of rail items (dict with 'icon', 'active', 'label')
    
    Returns:
        str: Activity rail HTML
    """
    if not items or not isinstance(items, list):
        items = [
            {'icon': 'layout', 'active': True, 'label': 'Explorer'},
            {'icon': 'search', 'label': 'Search'},
            {'icon': 'git', 'label': 'Source Control'},
            {'icon': 'play', 'label': 'Run and Debug'},
            {'icon': 'extensions', 'label': 'Extensions'},
        ]
    
    items_html = ''.join([
        f'''<button class="ds-activityrail__item{item.get("active") and " is-active" or ""}" aria-label="{item.get("label")}" title="{item.get("label")}">
    <img src="/nimbus/icons/{item.get("icon")}.svg" width="16" height="16" alt="{item.get("label")}" class="icon">
  </button>'''
        for item in items
    ])
    
    return f'''<div class="ds-activityrail">
  <nav class="ds-activityrail__nav">
    {items_html}
  </nav>
  <div class="ds-activityrail__divider"></div>
  <div class="ds-activityrail__bottom">
    <button class="ds-activityrail__item" aria-label="Settings" title="Settings">
      <img src="/nimbus/icons/settings.svg" width="16" height="16" alt="settings" class="icon">
    </button>
  </div>
</div>'''


def nimbus_chat_composer(model='GPT-4'):
    """Generate chat composer component.
    
    Args:
        model: Model name display
    
    Returns:
        str: Chat composer HTML
    """
    return f'''<div class="ds-chatcomposer">
  <div class="ds-chatcomposer__toolbar">
    <button class="ds-btn ds-btn--ghost ds-btn--sm ds-btn--icon" aria-label="Insert code">
      <img src="/nimbus/icons/code.svg" width="14" height="14" alt="code" class="icon">
    </button>
    <button class="ds-btn ds-btn--ghost ds-btn--sm ds-btn--icon" aria-label="Insert image">
      <img src="/nimbus/icons/image.svg" width="14" height="14" alt="image" class="icon">
    </button>
    <button class="ds-btn ds-btn--ghost ds-btn--sm ds-btn--icon" aria-label="Insert link">
      <img src="/nimbus/icons/link.svg" width="14" height="14" alt="link" class="icon">
    </button>
    <button class="ds-btn ds-btn--ghost ds-btn--sm ds-btn--icon" aria-label="Insert file">
      <img src="/nimbus/icons/file.svg" width="14" height="14" alt="file" class="icon">
    </button>
  </div>
  <div class="ds-chatcomposer__input-area">
    <span class="ds-chatcomposer__model">{model}</span>
    <input type="text" class="ds-chatcomposer__input" placeholder="Ask a question..." aria-label="Chat input">
    <button class="ds-btn ds-btn--ghost ds-btn--sm ds-btn--icon" aria-label="Voice input">
      <img src="/nimbus/icons/mic.svg" width="14" height="14" alt="mic" class="icon">
    </button>
    <button class="ds-btn ds-btn--brand ds-btn--sm ds-btn--icon" aria-label="Send message">
      <img src="/nimbus/icons/send.svg" width="14" height="14" alt="send" class="icon">
    </button>
  </div>
</div>'''


def nimbus_editor_tabs(tabs=None):
    """Generate editor tabs component.
    
    Args:
        tabs: List of tabs (dict with 'name', 'active')
    
    Returns:
        str: Editor tabs HTML
    """
    if not tabs or not isinstance(tabs, list):
        tabs = [
            {'name': 'main.py', 'active': True},
            {'name': 'app.py'},
            {'name': 'config.yaml'},
        ]
    
    tabs_html = ''.join([
        f'''<div class="ds-editortabs__tab{item.get("active") and " is-active" or ""}">
    <img src="/nimbus/icons/file-text.svg" width="12" height="12" alt="file" class="icon">
    <span>{item.get("name")}</span>
    <button class="ds-editortabs__close" aria-label="Close tab">
      <img src="/nimbus/icons/x.svg" width="10" height="10" alt="close" class="icon">
    </button>
  </div>'''
        for item in tabs
    ])
    
    return f'''<div class="ds-editortabs">
  {tabs_html}
  <button class="ds-editortabs__new" aria-label="New tab">
    <img src="/nimbus/icons/plus.svg" width="12" height="12" alt="new" class="icon">
  </button>
</div>'''


def nimbus_kbd(key):
    """Generate keyboard key component.
    
    Args:
        key: Key name
    
    Returns:
        str: KBD HTML
    """
    return f'<span class="ds-kbd">{key}</span>'


def nimbus_kbd_shortcut(keys):
    """Generate keyboard shortcut combination.
    
    Args:
        keys: List of key names
    
    Returns:
        str: Shortcut HTML
    """
    return ' + '.join([f'<span class="ds-kbd">{key}</span>' for key in keys])


def nimbus_page_header(title, subtitle=None, actions=None):
    """Generate page header component.
    
    Args:
        title: Page title
        subtitle: Page subtitle
        actions: List of action tuples (label, variant)
    
    Returns:
        str: Page header HTML
    """
    subtitle_html = f'<p class="ds-pageheader__subtitle">{subtitle}</p>' if subtitle else ''
    
    actions_html = ''
    if actions:
        actions_html = '<div class="ds-pageheader__actions">' + ''.join([
            f'<button class="ds-btn ds-btn--{variant} ds-btn--sm">{label}</button>'
            for label, variant in actions
        ]) + '</div>'
    
    return f'''<div class="ds-pageheader">
  <div class="ds-pageheader__title">
    <h1>{title}</h1>
    {subtitle_html}
  </div>
  {actions_html}
</div>'''


def nimbus_setting_row(label, description, type='switch', value=True, options=None):
    """Generate setting row component.
    
    Args:
        label: Setting label
        description: Setting description
        type: 'switch', 'select', 'button', 'input'
        value: Current value
        options: List of options for select type
    
    Returns:
        str: Setting row HTML
    """
    control_html = ''
    
    if type == 'switch':
        control_html = f'''<label class="ds-toggle" role="switch" aria-checked="{str(value).lower()}">
    <input type="checkbox"{' checked' if value else ''}>
    <span class="ds-toggle__track"></span>
  </label>'''
    elif type == 'select' and options:
        options_html = ''.join([f'<option>{opt}</option>' for opt in options])
        control_html = f'<select class="ds-input" aria-label="{label}">{options_html}</select>'
    elif type == 'button':
        control_html = '<button class="ds-btn ds-btn--secondary ds-btn--sm">Configure</button>'
    else:
        control_html = f'<input type="text" class="ds-input" value="{value}" aria-label="{label}">'
    
    return f'''<div class="ds-settingrow">
  <div class="ds-settingrow__info">
    <span class="ds-settingrow__title">{label}</span>
    <span class="ds-settingrow__description">{description}</span>
  </div>
  {control_html}
</div>'''


def nimbus_setting_group(title, rows=None):
    """Generate setting group component.
    
    Args:
        title: Group title
        rows: List of setting rows (dict with label, description, type, value)
    
    Returns:
        str: Setting group HTML
    """
    if not rows or not isinstance(rows, list):
        rows = [
            {'label': 'Theme', 'description': 'Choose your preferred color scheme', 'type': 'select', 'options': ['Dark', 'Light', 'System']},
            {'label': 'Notifications', 'description': 'Receive email notifications', 'type': 'switch', 'value': True},
        ]
    
    rows_html = ''.join([
        nimbus_setting_row(
            label=row.get('label'),
            description=row.get('description'),
            type=row.get('type', 'switch'),
            value=row.get('value', True),
            options=row.get('options')
        )
        for row in rows
    ])
    
    return f'''<div class="ds-settingrow__group">
  <div class="ds-settingrow__grouplabel">{title}</div>
  {rows_html}
</div>'''


def nimbus_status_bar(left_items=None, right_items=None):
    """Generate status bar component.
    
    Args:
        left_items: List of left items (dict with 'icon', 'text', 'title')
        right_items: List of right items (dict with 'text', 'title')
    
    Returns:
        str: Status bar HTML
    """
    if not left_items or not isinstance(left_items, list):
        left_items = [
            {'icon': 'git', 'text': 'main', 'title': 'Branch main'},
            {'icon': 'check', 'text': 'Synced', 'title': 'Synchronized'},
        ]
    
    if not right_items or not isinstance(right_items, list):
        right_items = [
            {'text': 'Ln 42, Col 15', 'title': 'Line 42, Column 15'},
            {'text': 'UTF-8', 'title': 'UTF-8 encoding'},
            {'text': 'Python', 'title': 'Python language'},
        ]
    
    left_html = ''.join([
        f'''<button class="ds-statusbar__item" aria-label="{item.get("title")}">
    <img src="/nimbus/icons/{item.get("icon")}.svg" width="12" height="12" alt="{item.get("title")}" class="icon">
    <span>{item.get("text")}</span>
  </button>'''
        for item in left_items
    ])
    
    right_html = ''.join([
        f'''<button class="ds-statusbar__item" aria-label="{item.get("title")}">
    <span>{item.get("text")}</span>
  </button>'''
        for item in right_items
    ])
    
    return f'''<div class="ds-statusbar">
  <div class="ds-statusbar__left">
    {left_html}
  </div>
  <div class="ds-statusbar__right">
    {right_html}
  </div>
</div>'''


def nimbus_table_panel(headers=None, rows=None, title=None, actions=None):
    """Generate table panel component.
    
    Args:
        headers: List of column headers
        rows: List of rows (each row is a list of cell values)
        title: Panel title
        actions: List of action tuples (label, variant)
    
    Returns:
        str: Table panel HTML
    """
    if not headers:
        headers = ['Name', 'Type', 'Size', 'Modified']
    
    if not rows:
        rows = [
            ['main.py', 'Python', '4.2 KB', '2 hours ago'],
            ['app.py', 'Python', '2.1 KB', '1 day ago'],
        ]
    
    headers_html = ''.join([f'<th>{h}</th>' for h in headers])
    rows_html = ''.join([
        '<tr>' + ''.join([f'<td>{cell}</td>' for cell in row]) + '</tr>'
        for row in rows
    ])
    
    actions_html = ''
    if actions:
        actions_html = '<div class="ds-tablepanel__actions">' + ''.join([
            f'<button class="ds-btn ds-btn--{variant} ds-btn--sm">{label}</button>'
            for label, variant in actions
        ]) + '</div>'
    
    title_html = f'<div class="ds-card__title">{title}</div>' if title else ''
    
    return f'''<div class="ds-tablepanel">
  <div class="ds-tablepanel__toolbar">
    <div class="ds-tablepanel__filters">
      <button class="ds-btn ds-btn--ghost ds-btn--sm">
        <img src="/nimbus/icons/search.svg" width="12" height="12" alt="search" class="icon">
        <span>Search</span>
      </button>
      <button class="ds-btn ds-btn--ghost ds-btn--sm">
        <img src="/nimbus/icons/filter.svg" width="12" height="12" alt="filter" class="icon">
        <span>Filter</span>
      </button>
    </div>
    {actions_html}
  </div>
  {title_html}
  <table class="ds-table ds-tablepanel__table">
    <thead>
      <tr>{headers_html}</tr>
    </thead>
    <tbody>{rows_html}</tbody>
  </table>
  <div class="ds-tablepanel__footer">
    <span>1-{len(rows)} of {len(rows)} items</span>
    {nimbus_pagination(1, 1)}
  </div>
</div>'''


def nimbus_workbench_titlebar(project_name='My Project', actions=None):
    """Generate workbench titlebar component.
    
    Args:
        project_name: Project name
        actions: List of action icons
    
    Returns:
        str: Titlebar HTML
    """
    if not actions or not isinstance(actions, list):
        actions = ['save', 'undo', 'redo', 'search', 'settings']
    
    actions_html = ''.join([
        f'''<button class="ds-btn ds-btn--ghost ds-btn--sm ds-btn--icon" aria-label="{action.title()}">
    <img src="/nimbus/icons/{action}.svg" width="14" height="14" alt="{action}" class="icon">
  </button>'''
        for action in actions
    ])
    
    return f'''<div class="ds-titlebar">
  <div class="ds-titlebar__left">
    <div class="ds-titlebar__traffic">
      <button class="ds-titlebar__traffic-btn ds-titlebar__traffic-btn--close" aria-label="Close window"></button>
      <button class="ds-titlebar__traffic-btn ds-titlebar__traffic-btn--minimize" aria-label="Minimize window"></button>
      <button class="ds-titlebar__traffic-btn ds-titlebar__traffic-btn--maximize" aria-label="Maximize window"></button>
    </div>
    <button class="ds-titlebar__project" aria-label="Select project">
      <span>{project_name}</span>
      <img src="/nimbus/icons/chevron-down.svg" width="12" height="12" alt="chevron" class="icon">
    </button>
  </div>
  <div class="ds-titlebar__right">
    {actions_html}
  </div>
</div>'''


def nimbus_progress_circle(value, label=''):
    """Generate progress circle component.
    
    Args:
        value: Progress percentage (0-100)
        label: Label text
    
    Returns:
        str: Progress circle HTML
    """
    circumference = 2 * 3.14159 * 45
    offset = circumference - (value / 100) * circumference
    
    return f'''<div class="ds-progress-circle" role="progressbar" aria-valuenow="{value}" aria-valuemin="0" aria-valuemax="100">
  <svg class="ds-progress-circle__svg" viewBox="0 0 100 100">
    <circle class="ds-progress-circle__track" cx="50" cy="50" r="45" fill="none" stroke-width="8" />
    <circle class="ds-progress-circle__bar" cx="50" cy="50" r="45" fill="none" stroke-width="8" stroke-linecap="round" style="stroke-dasharray: {circumference}; stroke-dashoffset: {offset};" />
  </svg>
  <span class="ds-progress-circle__value">{value}%</span>
  <span class="ds-progress-circle__label">{label}</span>
</div>'''


def nimbus_slider(label, value=50, min=0, max=100):
    """Generate slider component.
    
    Args:
        label: Slider label
        value: Current value
        min: Minimum value
        max: Maximum value
    
    Returns:
        str: Slider HTML
    """
    percentage = ((value - min) / (max - min)) * 100
    
    return f'''<div class="ds-slider" role="slider" aria-valuenow="{value}" aria-valuemin="{min}" aria-valuemax="{max}">
  <span class="ds-slider__label">{label}</span>
  <div class="ds-slider__track">
    <div class="ds-slider__fill" style="width: {percentage}%;"></div>
    <input type="range" class="ds-slider__input" min="{min}" max="{max}" value="{value}" />
  </div>
  <span class="ds-slider__value">{value}</span>
</div>'''


def nimbus_date_picker():
    """Generate date picker component.
    
    Returns:
        str: Date picker HTML
    """
    return '''<div class="ds-datepicker" role="combobox" aria-haspopup="dialog" aria-expanded="false">
  <div class="ds-datepicker__input-wrap">
    <input type="text" class="ds-datepicker__input" placeholder="Select date" aria-label="Select date" readonly />
    <button class="ds-datepicker__icon" aria-label="Open calendar">
      <img src="/nimbus/icons/calendar.svg" width="16" height="16" alt="calendar" class="icon" />
    </button>
  </div>
  <div class="ds-datepicker__calendar" hidden>
    <div class="ds-datepicker__header">
      <button class="ds-datepicker__nav ds-datepicker__nav--prev" aria-label="Previous month">
        <img src="/nimbus/icons/chevron-left.svg" width="14" height="14" alt="previous" class="icon" />
      </button>
      <span class="ds-datepicker__title"></span>
      <button class="ds-datepicker__nav ds-datepicker__nav--next" aria-label="Next month">
        <img src="/nimbus/icons/chevron-right.svg" width="14" height="14" alt="next" class="icon" />
      </button>
    </div>
    <div class="ds-datepicker__weekdays">
      <span>日</span><span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span>
    </div>
    <div class="ds-datepicker__days"></div>
  </div>
</div>'''


def nimbus_file_upload():
    """Generate file upload component.
    
    Returns:
        str: File upload HTML
    """
    return '''<div class="ds-fileupload" role="region" aria-label="File upload">
  <div class="ds-fileupload__dropzone">
    <div class="ds-fileupload__icon">
      <img src="/nimbus/icons/upload.svg" width="32" height="32" alt="upload" class="icon" />
    </div>
    <div class="ds-fileupload__text">
      <span class="ds-fileupload__title">Drag and drop files here</span>
      <span class="ds-fileupload__subtitle">or click to browse</span>
    </div>
    <input type="file" class="ds-fileupload__input" multiple />
  </div>
  <div class="ds-fileupload__list" hidden></div>
</div>'''


def nimbus_timeline(items=None):
    """Generate timeline component.
    
    Args:
        items: List of timeline items (dict with time, title, description)
    
    Returns:
        str: Timeline HTML
    """
    if not items or not isinstance(items, list):
        items = [
            {'time': '2 hours ago', 'title': 'Task completed', 'description': 'Design Review was marked as complete'},
            {'time': '5 hours ago', 'title': 'Project created', 'description': 'New Website project was created'},
            {'time': '1 day ago', 'title': 'File updated', 'description': 'API Integration was updated'},
        ]
    
    items_html = ''.join([
        f'''<div class="ds-timeline__item" role="listitem">
    <div class="ds-timeline__marker"></div>
    <div class="ds-timeline__content">
      <span class="ds-timeline__time">{item.get("time")}</span>
      <span class="ds-timeline__title">{item.get("title")}</span>
      <span class="ds-timeline__description">{item.get("description")}</span>
    </div>
  </div>'''
        for item in items
    ])
    
    return f'<div class="ds-timeline" role="list">{items_html}</div>'


def nimbus_validation_script(path='/nimbus/js/validation.js'):
    """Generate validation script tag."""
    return f'<script src="{path}"></script>'


def nimbus_data_bind_script(path='/nimbus/js/data-bind.js'):
    """Generate data binding script tag."""
    return f'<script src="{path}"></script>'