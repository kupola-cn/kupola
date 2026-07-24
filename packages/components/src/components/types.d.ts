/**
 * @kupola/components — TypeScript type definitions.
 * @module @kupola/components
 */

// ============================================================
// Common Types
// ============================================================

export type Destroyable = {
  element: HTMLElement;
  destroy(): void;
};

export type KupolaTheme = 'light' | 'dark';
export interface BrandColor {
  id: string;
  label: string;
  color: string;
}
export interface BrandColorPickerInstance {
  open(): void;
  close(): void;
  toggle(): void;
  destroy(): void;
}
export const DEFAULT_BRAND_COLORS: BrandColor[];
export function themePreload(): void;
export function getPreferredTheme(): KupolaTheme;
export function setTheme(theme: KupolaTheme): void;
export function toggleTheme(): KupolaTheme;
export function onThemeChange(callback: (theme: KupolaTheme) => void): () => void;
export function getBrandColors(): BrandColor[];
export function resolveBrandColor(value: string | Partial<BrandColor> & { color: string }): BrandColor;
export function getPreferredBrandColor(): BrandColor;
export function setBrandColor(value: string | Partial<BrandColor> & { color: string }, options?: { persist?: boolean; target?: HTMLElement }): BrandColor;
export function resetBrandColor(): BrandColor;
export function onBrandColorChange(callback: (brand: BrandColor) => void): () => void;
export function attachBrandColorPicker(trigger: HTMLElement, options?: { colors?: BrandColor[]; title?: string; custom?: boolean }): BrandColorPickerInstance;
export function getThemeInlineScript(): string;

// ============================================================
// Overlay Components
// ============================================================

// Modal
export interface ModalOptions {
  title?: string;
  content?: string | HTMLElement;
  width?: string | number;
  closable?: boolean;
  maskClosable?: boolean;
  escClose?: boolean;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
  onClose?: () => void;
}
export interface ModalInstance extends Destroyable {
  open(): void;
  close(): void;
  toggle(): void;
  isVisible(): boolean;
}
export function Modal(options?: ModalOptions): ModalInstance;

// Dropdown
export interface DropdownItem {
  label: string;
  value?: string;
  disabled?: boolean;
  divider?: boolean;
  icon?: string;
  onClick?: () => void;
}
export interface DropdownOptions {
  trigger?: HTMLElement;
  items?: DropdownItem[];
  placement?: string;
  closeOnClick?: boolean;
  onSelect?: (item: DropdownItem) => void;
}
export interface DropdownInstance extends Destroyable {
  open(): void;
  close(): void;
  toggle(): void;
  isOpen(): boolean;
}
export function Dropdown(options?: DropdownOptions): DropdownInstance;

// Drawer
export interface DrawerOptions {
  placement?: 'left' | 'right' | 'top' | 'bottom';
  width?: string | number;
  height?: string | number;
  title?: string;
  closable?: boolean;
  maskClosable?: boolean;
  escClose?: boolean;
  onClose?: () => void;
}
export interface DrawerInstance extends Destroyable {
  open(): void;
  close(): void;
  toggle(): void;
  isOpen(): boolean;
}
export function Drawer(options?: DrawerOptions): DrawerInstance;

// Dialog
export interface DialogOptions {
  title?: string;
  content?: string | HTMLElement;
  type?: 'info' | 'success' | 'warning' | 'error' | 'confirm';
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
}
export interface DialogInstance extends Destroyable {
  open(): void;
  close(): void;
}
export function Dialog(options?: DialogOptions): DialogInstance;

// Notification
export interface NotificationOptions {
  title?: string;
  message: string;
  type?: 'normal' | 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  closable?: boolean;
  position?: string;
  onClick?: () => void;
  onClose?: () => void;
}
export interface NotificationItem {
  element: HTMLElement;
  close(): void;
}
export interface NotificationInstance extends Destroyable {
  normal(message: string, options?: Partial<NotificationOptions>): NotificationItem;
  success(message: string, options?: Partial<NotificationOptions>): NotificationItem;
  error(message: string, options?: Partial<NotificationOptions>): NotificationItem;
  warning(message: string, options?: Partial<NotificationOptions>): NotificationItem;
  info(message: string, options?: Partial<NotificationOptions>): NotificationItem;
  show(options: NotificationOptions): NotificationItem;
}
export function Notification(): NotificationInstance;

// Tooltip
export interface TooltipOptions {
  content: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  trigger?: 'hover' | 'click' | 'focus';
  delay?: number;
}
export interface TooltipInstance extends Destroyable {
  show(): void;
  hide(): void;
}
export function Tooltip(options: TooltipOptions): TooltipInstance;

// ============================================================
// Navigation Components
// ============================================================

// Tabs
export interface TabItem {
  key: string;
  title: string;
  content?: string | HTMLElement;
  disabled?: boolean;
  closable?: boolean;
}
export interface TabsOptions {
  tabs?: TabItem[];
  activeKey?: string;
  type?: 'line' | 'card' | 'bordered';
  onChange?: (key: string) => void;
  onClose?: (key: string) => void;
}
export interface TabsInstance extends Destroyable {
  setActive(key: string): void;
  getActive(): string;
  addTab(tab: TabItem): void;
  removeTab(key: string): void;
}
export function Tabs(options?: TabsOptions): TabsInstance;

// Pagination
export interface PaginationOptions {
  total?: number;
  pageSize?: number;
  current?: number;
  pageSizeOptions?: number[];
  showTotal?: boolean;
  showSizeChanger?: boolean;
  maxPages?: number;
  onChange?: (page: number, pageSize: number) => void;
}
export interface PaginationInstance extends Destroyable {
  setCurrent(page: number): void;
  getCurrent(): number;
  setTotal(total: number): void;
  setPageSize(size: number): void;
}
export function Pagination(options?: PaginationOptions): PaginationInstance;

// Datepicker
export interface DatepickerOptions {
  value?: Date | string;
  format?: string;
  placeholder?: string;
  minDate?: Date | string;
  maxDate?: Date | string;
  disabled?: boolean;
  disabledDates?: (date: Date) => boolean;
  onChange?: (date: Date, dateString: string) => void;
}
export interface DatepickerInstance extends Destroyable {
  setValue(date: Date | string): void;
  getValue(): Date | null;
  clear(): void;
}
export function Datepicker(options?: DatepickerOptions): DatepickerInstance;

// Breadcrumb
export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: string;
}
export interface BreadcrumbOptions {
  items?: BreadcrumbItem[];
  separator?: string;
}
export interface BreadcrumbInstance extends Destroyable {
  setItems(items: BreadcrumbItem[]): void;
}
export function Breadcrumb(options?: BreadcrumbOptions): BreadcrumbInstance;

// Menu
export interface MenuItem {
  key?: string;
  label: string;
  icon?: string;
  disabled?: boolean;
  divider?: boolean;
  shortcut?: string;
  onClick?: () => void;
  children?: MenuItem[];
}
export interface MenuOptions {
  items?: MenuItem[];
  mode?: 'vertical' | 'horizontal';
  onSelect?: (item: MenuItem) => void;
}
export interface MenuInstance extends Destroyable {}
export function Menu(options?: MenuOptions): MenuInstance;

// Calendar
export interface CalendarEvent {
  id?: string | number;
  title: string;
  date: string | Date;
  endDate?: string | Date;
  color?: string;
  allDay?: boolean;
}
export interface CalendarOptions {
  date?: Date | string;
  viewMode?: 'month' | 'week';
  events?: CalendarEvent[];
  selectionMode?: 'none' | 'single' | 'range';
  onChange?: (date: Date) => void;
  onSelect?: (date: Date) => void;
  onRangeSelect?: (start: Date, end: Date) => void;
}
export interface CalendarInstance extends Destroyable {
  setDate(date: Date | string): void;
  getDate(): Date;
  setSelectedDate(date: Date): void;
  getSelectedDate(): Date | null;
  setRange(start: Date, end: Date): void;
  getRange(): { start: Date | null; end: Date | null };
  setEvents(events: CalendarEvent[]): void;
  addEvent(event: CalendarEvent): void;
  removeEvent(id: string | number): void;
  setViewMode(mode: 'month' | 'week'): void;
  getViewMode(): string;
  goToToday(): void;
  goToDate(date: Date): void;
  prevMonth(): void;
  nextMonth(): void;
  toggleRangeMode(): void;
}
export function Calendar(options?: CalendarOptions): CalendarInstance;

// ============================================================
// Form Components
// ============================================================

// Switch
export interface SwitchOptions {
  checked?: boolean;
  disabled?: boolean;
  label?: string;
  name?: string;
  value?: string;
  onChange?: (checked: boolean) => void;
}
export interface SwitchInstance extends Destroyable {
  setChecked(checked: boolean): void;
  getChecked(): boolean;
  toggle(): void;
}
export function Switch(options?: SwitchOptions): SwitchInstance;

// Select
export interface SelectOption {
  label: string;
  value: string | number;
  disabled?: boolean;
}
export interface SelectOptions {
  options?: SelectOption[];
  value?: string | number | (string | number)[];
  multiple?: boolean;
  placeholder?: string;
  disabled?: boolean;
  searchable?: boolean;
  name?: string;
  onChange?: (value: string | number | (string | number)[]) => void;
}
export interface SelectInstance extends Destroyable {
  setValue(value: string | number | (string | number)[]): void;
  getValue(): string | number | (string | number)[];
  open(): void;
  close(): void;
}
export function Select(options?: SelectOptions): SelectInstance;

// Checkbox
export interface CheckboxOptions {
  checked?: boolean;
  disabled?: boolean;
  label?: string;
  name?: string;
  value?: string;
  indeterminate?: boolean;
  onChange?: (checked: boolean) => void;
}
export interface CheckboxInstance extends Destroyable {
  setChecked(checked: boolean): void;
  getChecked(): boolean;
  toggle(): void;
}
export function Checkbox(options?: CheckboxOptions): CheckboxInstance;

// Radio
export interface RadioOption {
  label: string;
  value: string | number;
  disabled?: boolean;
}
export interface RadioOptions {
  options?: RadioOption[];
  value?: string | number;
  name?: string;
  disabled?: boolean;
  direction?: 'horizontal' | 'vertical';
  onChange?: (value: string | number) => void;
}
export interface RadioInstance extends Destroyable {
  setValue(value: string | number): void;
  getValue(): string | number | null;
}
export function Radio(options?: RadioOptions): RadioInstance;

// Input
export interface InputOptions {
  type?: 'text' | 'password' | 'email' | 'number' | 'tel' | 'url' | 'search';
  value?: string;
  placeholder?: string;
  disabled?: boolean;
  readonly?: boolean;
  clearable?: boolean;
  prefix?: string;
  suffix?: string;
  maxlength?: number;
  name?: string;
  onInput?: (value: string) => void;
  onChange?: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
}
export interface InputInstance extends Destroyable {
  setValue(value: string): void;
  getValue(): string;
  focus(): void;
  blur(): void;
  clear(): void;
}
export function Input(options?: InputOptions): InputInstance;

// Slider
export interface SliderOptions {
  min?: number;
  max?: number;
  step?: number;
  value?: number;
  disabled?: boolean;
  showTooltip?: boolean;
  onChange?: (value: number) => void;
}
export interface SliderInstance extends Destroyable {
  setValue(value: number): void;
  getValue(): number;
}
export function Slider(options?: SliderOptions): SliderInstance;

// NumberInput
export interface NumberInputOptions {
  min?: number;
  max?: number;
  step?: number;
  precision?: number;
  value?: number;
  disabled?: boolean;
  name?: string;
  onChange?: (value: number) => void;
}
export interface NumberInputInstance extends Destroyable {
  setValue(value: number): void;
  getValue(): number;
  increase(): void;
  decrease(): void;
}
export function NumberInput(options?: NumberInputOptions): NumberInputInstance;

// Textarea
export interface TextareaOptions {
  value?: string;
  placeholder?: string;
  disabled?: boolean;
  readonly?: boolean;
  maxlength?: number;
  rows?: number;
  autosize?: boolean;
  showCount?: boolean;
  name?: string;
  onInput?: (value: string) => void;
}
export interface TextareaInstance extends Destroyable {
  setValue(value: string): void;
  getValue(): string;
  focus(): void;
  blur(): void;
}
export function Textarea(options?: TextareaOptions): TextareaInstance;

// Timepicker
export interface TimepickerOptions {
  value?: string;
  format?: '12h' | '24h';
  minTime?: string;
  maxTime?: string;
  disabled?: boolean;
  placeholder?: string;
  name?: string;
  onChange?: (value: string) => void;
}
export interface TimepickerInstance extends Destroyable {
  setValue(value: string): void;
  getValue(): string;
  clear(): void;
}
export function Timepicker(options?: TimepickerOptions): TimepickerInstance;

// ============================================================
// Feedback Components
// ============================================================

// Alert
export interface AlertOptions {
  title?: string;
  content?: string;
  type?: 'normal' | 'success' | 'error' | 'warning' | 'info';
  closable?: boolean;
  onClose?: () => void;
}
export interface AlertInstance extends Destroyable {
  dismiss(): void;
}
export function Alert(options?: AlertOptions): AlertInstance;

// Progress
export interface ProgressOptions {
  percent?: number;
  type?: 'line' | 'circle';
  status?: 'normal' | 'success' | 'error';
  showInfo?: boolean;
  strokeWidth?: number;
  width?: number;
}
export interface ProgressInstance extends Destroyable {
  setPercent(percent: number): void;
  getPercent(): number;
}
export function Progress(options?: ProgressOptions): ProgressInstance;

// Skeleton
export interface SkeletonOptions {
  variant?: 'text' | 'heading' | 'avatar' | 'block';
  count?: number;
  width?: string | number;
  height?: string | number;
  animated?: boolean;
}
export interface SkeletonInstance extends Destroyable {}
export function Skeleton(options?: SkeletonOptions): SkeletonInstance;

// Spin
export interface SpinOptions {
  size?: 'sm' | 'md' | 'lg';
  tip?: string;
  fullscreen?: boolean;
}
export interface SpinInstance extends Destroyable {
  show(): void;
  hide(): void;
}
export function Spin(options?: SpinOptions): SpinInstance;

// Empty
export interface EmptyOptions {
  description?: string;
  image?: string;
}
export interface EmptyInstance extends Destroyable {}
export function Empty(options?: EmptyOptions): EmptyInstance;

// Countdown
export interface CountdownOptions {
  target: Date | number | string;
  format?: string;
  onTick?: (remaining: number) => void;
  onFinish?: () => void;
}
export interface CountdownInstance extends Destroyable {
  start(): void;
  pause(): void;
  resume(): void;
  reset(): void;
}
export function Countdown(options: CountdownOptions): CountdownInstance;

// ============================================================
// Display Components
// ============================================================

// Tag
export interface TagOptions {
  label?: string;
  color?: string;
  closable?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onClose?: () => void;
}
export interface TagInstance extends Destroyable {
  setLabel(label: string): void;
}
export function Tag(options?: TagOptions): TagInstance;

// Badge
export interface BadgeOptions {
  count?: number;
  dot?: boolean;
  overflowCount?: number;
  color?: string;
  showZero?: boolean;
}
export interface BadgeInstance extends Destroyable {
  setCount(count: number): void;
}
export function Badge(options?: BadgeOptions): BadgeInstance;

// Divider
export interface DividerOptions {
  type?: 'horizontal' | 'vertical';
  text?: string;
  textAlign?: 'left' | 'center' | 'right';
  dashed?: boolean;
}
export interface DividerInstance extends Destroyable {}
export function Divider(options?: DividerOptions): DividerInstance;

// Collapse
export interface CollapseItem {
  key: string | number;
  title: string;
  content?: unknown;
  [key: string]: unknown;
}
export interface CollapseOptions {
  items?: CollapseItem[];
  accordion?: boolean;
  defaultOpen?: (string | number)[];
  onChange?: (activeKeys: (string | number)[]) => void;
  onSelect?: (item: CollapseItem) => void;
}
export interface CollapseInstance {
  element: DocumentFragment;
  toggle(key: string | number): void;
  open(key: string | number): void;
  close(key: string | number): void;
  getActiveKeys(): (string | number)[];
  destroy(): void;
}
export function Collapse(options?: CollapseOptions): CollapseInstance;

// Timeline
export interface TimelineItem {
  content: string;
  color?: string;
  icon?: string;
  label?: string;
}
export interface TimelineOptions {
  items?: TimelineItem[];
  mode?: 'left' | 'right' | 'alternate';
}
export interface TimelineInstance extends Destroyable {
  setItems(items: TimelineItem[]): void;
}
export function Timeline(options?: TimelineOptions): TimelineInstance;

// Kbd
export interface KbdOptions {
  key: string;
  size?: 'sm' | 'md';
}
export interface KbdInstance extends Destroyable {}
export function Kbd(options?: KbdOptions): KbdInstance;

// Avatar
export interface AvatarOptions {
  src?: string;
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  shape?: 'circle' | 'square';
  accent?: boolean;
}
export interface AvatarInstance extends Destroyable {}
export function Avatar(options?: AvatarOptions): AvatarInstance;

// Statcard
export interface StatcardOptions {
  title: string;
  value: string | number;
  prefix?: string;
  suffix?: string;
  description?: string;
  trend?: 'up' | 'down';
  trendValue?: string;
  icon?: string;
}
export interface StatcardInstance extends Destroyable {
  setValue(value: string | number): void;
}
export function Statcard(options?: StatcardOptions): StatcardInstance;

// Tree
export interface TreeNode {
  key: string | number;
  title: string;
  children?: TreeNode[];
  disabled?: boolean;
  isLeaf?: boolean;
  icon?: string;
}
export interface TreeOptions {
  data?: TreeNode[];
  checkable?: boolean;
  expandAll?: boolean;
  defaultExpandKeys?: (string | number)[];
  onSelect?: (keys: (string | number)[], nodes: TreeNode[]) => void;
  onCheck?: (keys: (string | number)[], nodes: TreeNode[]) => void;
  onExpand?: (keys: (string | number)[]) => void;
}
export interface TreeInstance extends Destroyable {
  getSelectedKeys(): (string | number)[];
  getCheckedKeys(): (string | number)[];
  expandAll(): void;
  collapseAll(): void;
  selectKey(key: string | number): void;
}
export function Tree(options?: TreeOptions): TreeInstance;

// Carousel
export interface CarouselOptions {
  autoplay?: boolean;
  interval?: number;
  loop?: boolean;
  showDots?: boolean;
  showArrows?: boolean;
  onChange?: (index: number) => void;
}
export interface CarouselInstance extends Destroyable {
  next(): void;
  prev(): void;
  goTo(index: number): void;
  getCurrent(): number;
}
export function Carousel(options?: CarouselOptions): CarouselInstance;

// ============================================================
// Interactive Components
// ============================================================

// FileUpload
export interface FileUploadOptions {
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
  maxCount?: number;
  disabled?: boolean;
  onChange?: (files: File[]) => void;
  onRemove?: (file: File) => void;
}
export interface FileUploadInstance extends Destroyable {
  getFiles(): File[];
  clear(): void;
}
export function FileUpload(options?: FileUploadOptions): FileUploadInstance;

// DynamicTags
export interface DynamicTagsOptions {
  tags?: string[];
  maxCount?: number;
  placeholder?: string;
  onChange?: (tags: string[]) => void;
}
export interface DynamicTagsInstance extends Destroyable {
  getTags(): string[];
  setTags(tags: string[]): void;
  addTag(tag: string): void;
  removeTag(tag: string): void;
}
export function DynamicTags(options?: DynamicTagsOptions): DynamicTagsInstance;

// ImagePreview
export interface ImagePreviewOptions {
  images: string[];
  index?: number;
  onClose?: () => void;
}
export interface ImagePreviewInstance extends Destroyable {
  show(index?: number): void;
  hide(): void;
  next(): void;
  prev(): void;
}
export function ImagePreview(options: ImagePreviewOptions): ImagePreviewInstance;

// ColorPicker
export interface ColorPickerOptions {
  color?: string;
  format?: 'hex' | 'rgb' | 'hsl';
  presets?: string[];
  onChange?: (color: string) => void;
}
export interface ColorPickerInstance extends Destroyable {
  setColor(color: string): void;
  getColor(): string;
}
export function ColorPicker(options?: ColorPickerOptions): ColorPickerInstance;

// VirtualList
export interface VirtualListOptions<T = unknown> {
  data?: T[];
  itemHeight?: number;
  overscan?: number;
  renderItem?: (item: T, index: number) => string | HTMLElement;
  onItemClick?: (item: T, index: number) => void;
}
export interface VirtualListInstance<T = unknown> extends Destroyable {
  setData(data: T[]): void;
  scrollTo(index: number): void;
  scrollToKey(key: string | number): void;
}
export function VirtualList<T = unknown>(options?: VirtualListOptions<T>): VirtualListInstance<T>;

// ============================================================
// Utility Modules
// ============================================================

// Icons
export interface IconGroup {
  [name: string]: string;
}
export const Icons: {
  svg(name: string, size?: number | string, viewBox?: string): string;
  render(root: HTMLElement): void;
};
export function svg(name: string, size?: number | string, viewBox?: string): string;
export function render(root: HTMLElement): void;
export function registerIcons(icons: Record<string, string>, group?: string): void;
export function registerGroup(name: string, icons: Record<string, string>): void;
export function registerAllGroups(groups: Record<string, Record<string, string>>): void;
export const PATHS: Record<string, string>;
export const iconGroups: Record<string, Record<string, string>>;

// Message
export interface MessageItem {
  element: HTMLElement;
  close(): void;
}
export interface MessageInstance extends Destroyable {
  normal(content: string, options?: { duration?: number; position?: string }): MessageItem;
  success(content: string, options?: { duration?: number; position?: string }): MessageItem;
  error(content: string, options?: { duration?: number; position?: string }): MessageItem;
  warning(content: string, options?: { duration?: number; position?: string }): MessageItem;
  info(content: string, options?: { duration?: number; position?: string }): MessageItem;
  show(options: { content: string; type?: string; duration?: number; position?: string }): MessageItem;
}
export function Message(): MessageInstance;

// Heatmap
export interface HeatmapDataItem {
  date: string;
  value: number;
}
export interface HeatmapOptions {
  data?: HeatmapDataItem[];
  startDate?: Date;
  endDate?: Date;
  cellSize?: number;
  color?: string;
  onCellClick?: (data: HeatmapDataItem, element: HTMLElement) => void;
}
export interface HeatmapInstance extends Destroyable {
  updateData(data: HeatmapDataItem[]): void;
}
export function Heatmap(options?: HeatmapOptions): HeatmapInstance;

// Validation
export interface ValidationRule {
  rule: string;
  message?: string;
  params?: unknown[];
}
export interface ValidationResult {
  valid: boolean;
  message: string;
}
export interface ValidationInstance {
  check(value: unknown, rules: string | ValidationRule[]): ValidationResult;
  validateInput(input: HTMLElement, rules: string): ValidationResult;
  validateForm(form: HTMLFormElement): { valid: boolean; errors: Record<string, string> };
  validateFormAsync(form: HTMLFormElement): Promise<{ valid: boolean; errors: Record<string, string> }>;
  addValidator(name: string, fn: (value: unknown, ...params: unknown[]) => boolean): void;
  addAsyncValidator(name: string, fn: (value: unknown, ...params: unknown[]) => Promise<boolean>): void;
  parseRules(rulesStr: string): ValidationRule[];
  resetForm(form: HTMLFormElement): void;
  destroy(): void;
}
export function Validation(): ValidationInstance;

// Form
export interface FormOptions {
  element?: HTMLFormElement | string;
  validators?: Record<string, string>;
  onSubmit?: (data: Record<string, unknown>) => void | Promise<void>;
  onValidate?: (valid: boolean) => void;
}
export interface FormInstance extends Destroyable {
  validate(): boolean;
  validateField(field: HTMLElement): boolean;
  showError(field: HTMLElement, message: string): void;
  clearError(field: HTMLElement): void;
  clearAllErrors(): void;
  getData(): Record<string, unknown>;
  setData(data: Record<string, unknown>): void;
  reset(): void;
  addValidator(field: string, rules: string): void;
}
export function Form(options?: FormOptions): FormInstance;

// ============================================================
// Table Component
// ============================================================

export interface TableColumn<T = Record<string, unknown>> {
  key: string;
  title?: string;
  width?: string | number;
  minWidth?: string | number;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  sorter?: (a: unknown, b: unknown, order: string) => number;
  render?: (value: unknown, row: T) => string | HTMLElement;
  fixed?: 'left' | 'right';
  editable?: boolean;
  filterFn?: (value: unknown, filterText: string) => boolean;
}

export interface TableOptions<T = Record<string, unknown>> {
  data?: T[];
  columns: TableColumn<T>[];
  rowKey?: string;
  striped?: boolean;
  compact?: boolean;
  hoverable?: boolean;
  bordered?: boolean;
  selection?: 'checkbox' | 'radio';
  expandable?: (row: T) => string | HTMLElement;
  editable?: boolean;
  resizable?: boolean;
  draggable?: boolean;
  tree?: { childrenKey?: string; defaultExpandAll?: boolean };
  virtualScroll?: { rowHeight: number; overscan?: number };
  mergeCells?: (data: T[]) => Array<{ row: number; col: number; rowSpan: number; colSpan: number }>;
  showFilter?: boolean;
  showToolbar?: boolean;
  showPagination?: boolean;
  pageSize?: number;
  pageSizeOptions?: number[];
  emptyText?: string;
  loadingText?: string;
  multiSort?: boolean;
  onSort?: (sorts: Array<{ key: string; order: string }>) => void;
  onPageChange?: (page: number) => void;
  onRowClick?: (row: T, key: unknown) => void;
  onFilter?: (text: string) => void;
  onSelect?: (keys: unknown[], rows: T[]) => void;
  onExpand?: (key: unknown, expanded: boolean) => void;
  onEditSave?: (row: T, colKey: string) => void;
  onEditCancel?: () => void;
  onRowDragEnd?: (fromKey: unknown, toKey: unknown) => void;
  onColumnResize?: (colKey: string, width: number) => void;
}

export interface TableInstance<T = Record<string, unknown>> extends Destroyable {
  setData(data: T[]): void;
  setLoading(loading: boolean): void;
  getData(): T[];
  getProcessedData(): T[];
  getSelectedRows(): T[];
  getSelectedKeys(): unknown[];
  selectRow(key: unknown): void;
  deselectRow(key: unknown): void;
  selectAll(): void;
  deselectAll(): void;
  toggleExpand(key: unknown): void;
  expandAll(): void;
  collapseAll(): void;
  setSort(key: string, order?: 'asc' | 'desc'): void;
  clearSort(): void;
  setPage(page: number): void;
  setPageSize(size: number): void;
  setFilterText(text: string): void;
  getFilterText(): string;
  exportCSV(): string;
  refresh(): void;
}
export function Table<T = Record<string, unknown>>(options?: TableOptions<T>): TableInstance<T>;
