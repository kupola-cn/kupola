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
  content?: unknown;
  width?: string | number;
  closable?: boolean;
  closableOnMask?: boolean;
  maskClosable?: boolean;
  escClose?: boolean;
  onClose?: () => void;
}
export interface ModalInstance {
  element: DocumentFragment;
  open(): void;
  close(): void;
  toggle(): void;
  isVisible(): boolean;
  destroy(): void;
}
export function Modal(options?: ModalOptions, children?: unknown): ModalInstance;

// Dropdown
export interface DropdownItem {
  label?: string;
  text?: string;
  value?: string;
  disabled?: boolean;
  divider?: boolean;
  icon?: string;
  onClick?: (item: DropdownItem) => void;
}
export interface DropdownSelection {
  value?: string;
  text: string;
  item: DropdownItem;
}
export interface DropdownOptions {
  trigger?: 'click' | 'hover';
  items?: DropdownItem[];
  placeholder?: string;
  closeOnClick?: boolean;
  onSelect?: (selection: DropdownSelection) => void;
}
export interface DropdownInstance {
  element: DocumentFragment;
  open(): void;
  close(): void;
  toggle(): void;
  isOpen(): boolean;
  destroy(): void;
}
export function Dropdown(options?: DropdownOptions): DropdownInstance;

// Drawer
export interface DrawerOptions {
  placement?: 'left' | 'right';
  width?: string | number;
  title?: string;
  content?: unknown;
  closable?: boolean;
  closableOnMask?: boolean;
  maskClosable?: boolean;
  escClose?: boolean;
  onClose?: () => void;
}
export interface DrawerInstance {
  element: DocumentFragment;
  open(): void;
  close(): void;
  toggle(): void;
  isOpen(): boolean;
  destroy(): void;
}
export function Drawer(options?: DrawerOptions, children?: unknown): DrawerInstance;

// Dialog
export interface DialogOptions {
  title?: string;
  content?: string;
  type?: 'normal' | 'info' | 'success' | 'warning' | 'error';
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
}
export interface DialogService {
  confirm(options?: DialogOptions): Promise<boolean>;
  alert(options?: DialogOptions): Promise<void>;
}
export const Dialog: DialogService;

// Notification
export interface NotificationOptions {
  title?: string;
  message?: string;
  type?: 'normal' | 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  closable?: boolean;
}
export interface NotificationItem {
  element: HTMLElement;
  close(): void;
}
export interface NotificationService {
  open(options?: NotificationOptions): NotificationItem;
  success(options?: NotificationOptions): NotificationItem;
  error(options?: NotificationOptions): NotificationItem;
  warning(options?: NotificationOptions): NotificationItem;
  info(options?: NotificationOptions): NotificationItem;
  setPosition(position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'bottom'): void;
  destroy(): void;
}
export const Notification: NotificationService;

// Tooltip
export interface TooltipOptions {
  target: HTMLElement;
  content?: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  trigger?: 'hover' | 'click' | 'focus';
  delay?: number;
}
export interface TooltipInstance {
  show(): void;
  hide(): void;
  destroy(): void;
}
export function Tooltip(options: TooltipOptions): TooltipInstance;

// ============================================================
// Navigation Components
// ============================================================

// Tabs
export interface TabItem {
  key: string;
  title?: string;
  label?: string;
  content?: unknown;
  disabled?: boolean;
  closable?: boolean;
}
export interface TabsOptions {
  tabs?: TabItem[];
  panels?: Record<string, unknown>;
  activeKey?: string;
  type?: 'line' | 'card' | 'bordered';
  variant?: 'line' | 'filled' | 'bordered';
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
export interface PaginationInstance {
  element: DocumentFragment;
  setCurrent(page: number): boolean;
  getCurrent(): number;
  getTotal(): number;
  getPageSize(): number;
  setTotal(total: number): boolean;
  setPageSize(size: number): boolean;
  destroy(): void;
}
export function Pagination(options?: PaginationOptions): PaginationInstance;

// Datepicker
export interface DatepickerOptions {
  value?: Date | string;
  format?: 'YYYY-MM-DD' | 'MM/DD/YYYY' | 'DD/MM/YYYY';
  placeholder?: string;
  minDate?: Date | string;
  maxDate?: Date | string;
  weekStart?: 0 | 1;
  disabled?: boolean;
  disabledDates?: (date: Date) => boolean;
  onChange?: (dateString: string, date: Date) => void;
}
export interface DatepickerInstance {
  element: DocumentFragment;
  open(): void;
  close(): void;
  toggle(): void;
  setValue(date: Date | string): void;
  getValue(): string;
  clear(): void;
  isOpen(): boolean;
  destroy(): void;
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
  key?: string | number;
  label?: string;
  type?: 'item' | 'divider';
  icon?: string;
  disabled?: boolean;
  divider?: boolean;
  danger?: boolean;
  shortcut?: string;
  onClick?: () => void;
  children?: MenuItem[];
}
export interface MenuOptions {
  items?: MenuItem[];
  mode?: 'vertical' | 'horizontal';
  onSelect?: (item: MenuItem) => void;
}
export interface MenuInstance {
  element: DocumentFragment;
  destroy(): void;
}
export function Menu(options?: MenuOptions): MenuInstance;

// Calendar
export interface CalendarEvent {
  id?: string | number;
  title: string;
  date: string | Date;
  end?: string | Date;
  endDate?: string | Date;
  color?: string;
  allDay?: boolean;
}
export interface CalendarOptions {
  currentDate?: Date | string;
  date?: Date | string;
  selectedDate?: Date | string;
  rangeStart?: Date | string;
  rangeEnd?: Date | string;
  rangeMode?: boolean;
  viewMode?: 'month' | 'week';
  events?: CalendarEvent[];
  selectionMode?: 'none' | 'single' | 'range';
  i18n?: Partial<{ months: string[]; shortMonths: string[]; weekdays: string[]; shortWeekdays: string[]; today: string }>;
  onChange?: (state: CalendarChange) => void;
  onSelect?: (selection: { date: Date; dateStr: string }) => void;
  onRangeSelect?: (range: { start: Date; end: Date }) => void;
  onEventClick?: (event: CalendarEvent, date: Date) => void;
}
export interface CalendarChange {
  date: Date;
  selectedDate: Date | null;
  rangeStart: Date | null;
  rangeEnd: Date | null;
  viewMode: 'month' | 'week';
}
export interface CalendarInstance extends Destroyable {
  setDate(date: Date | string): void;
  getDate(): Date;
  setSelectedDate(date: Date | string | null): void;
  getSelectedDate(): Date | null;
  setRange(start: Date | string | null, end: Date | string | null): void;
  getRange(): { start: Date | null; end: Date | null };
  setEvents(events: CalendarEvent[]): void;
  addEvent(event: CalendarEvent): void;
  removeEvent(id: string | number): void;
  setViewMode(mode: 'month' | 'week'): void;
  getViewMode(): 'month' | 'week';
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
  label?: string;
  text?: string;
  value: string | number;
  disabled?: boolean;
}
export interface SelectChangeEvent {
  value: string | number | '';
  text: string;
  values: (string | number)[];
}
export interface SelectOptions {
  items?: SelectOption[];
  options?: SelectOption[];
  value?: string | number | (string | number)[];
  values?: (string | number)[];
  multiple?: boolean;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  searchable?: boolean;
  clearable?: boolean;
  onChange?: (event: SelectChangeEvent) => void;
}
export interface SelectInstance extends Destroyable {
  setValue(value: string | number | (string | number)[]): void;
  getValue(): string | number | (string | number)[];
  open(): void;
  close(): void;
  toggle(): void;
  isOpen(): boolean;
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
  status?: 'error' | 'success' | 'warning';
  onInput?: (value: string) => void;
  onChange?: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
}
export interface InputInstance {
  element: DocumentFragment;
  setValue(value: string): void;
  getValue(): string;
  focus(): void;
  blur(): void;
  clear(): void;
  destroy(): void;
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
  resize?: 'vertical' | 'horizontal' | 'both' | 'none';
  onInput?: (value: string) => void;
  onChange?: (value: string) => void;
}
export interface TextareaInstance {
  element: DocumentFragment;
  setValue(value: string): void;
  getValue(): string;
  focus(): void;
  blur(): void;
  destroy(): void;
}
export function Textarea(options?: TextareaOptions): TextareaInstance;

// Timepicker
export interface TimepickerOptions {
  value?: string;
  format?: '12h' | '24h';
  step?: number;
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
  clear(): boolean;
  destroy(): void;
  open(): void;
  close(): void;
  isOpen(): boolean;
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
  target?: Date | number | string;
  onTick?: (remaining: number) => void;
  onFinish?: () => void;
  onComplete?: () => void;
}
export interface CountdownInstance {
  element: DocumentFragment;
  start(target?: Date | number | string): void;
  stop(): void;
  destroy(): void;
}
export function Countdown(options?: CountdownOptions): CountdownInstance;

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
  key?: string | number;
  title?: string;
  label?: string;
  children?: TreeNode[];
  disabled?: boolean;
  isLeaf?: boolean;
  icon?: string;
  badge?: string | number;
}
export interface TreeOptions {
  data?: TreeNode[];
  checkable?: boolean;
  lined?: boolean;
  compact?: boolean;
  expandAll?: boolean;
  defaultExpandAll?: boolean;
  defaultExpandKeys?: (string | number)[];
  defaultCheckedKeys?: (string | number)[];
  defaultSelectedKeys?: (string | number)[];
  selectedKey?: string | number;
  onSelect?: (keys: (string | number)[], nodes: TreeNode[]) => void;
  onCheck?: (keys: (string | number)[], nodes: TreeNode[]) => void;
  onExpand?: (keys: (string | number)[]) => void;
  onToggle?: (node: TreeNode, expanded: boolean) => void;
}
export interface TreeInstance {
  element: DocumentFragment;
  getSelected(): TreeNode | null;
  getSelectedKeys(): (string | number)[];
  getCheckedKeys(): (string | number)[];
  getExpandedKeys(): (string | number)[];
  expandAll(): void;
  collapseAll(): void;
  selectKey(key: string | number): void;
  select(key: string | number): void;
  checkKey(key: string | number): void;
  uncheckKey(key: string | number): void;
  toggleCheck(key: string | number): void;
  expand(key: string | number): void;
  collapse(key: string | number): void;
  destroy(): void;
}
export function Tree(options?: TreeOptions): TreeInstance;

// Carousel
export interface CarouselOptions {
  items?: Array<string | number>;
  autoPlay?: boolean;
  autoplay?: boolean;
  interval?: number;
  showIndicators?: boolean;
  showDots?: boolean;
  showArrows?: boolean;
  onChange?: (index: number) => void;
}
export interface CarouselInstance {
  element: DocumentFragment;
  next(): void;
  prev(): void;
  goTo(index: number): void;
  getCurrent(): number;
  destroy(): void;
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
  title?: string;
  subtitle?: string;
  disabled?: boolean;
  onChange?: (files: File[]) => void;
  onRemove?: (file: File) => void;
  onError?: (message: string) => void;
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
  maxTags?: number;
  placeholder?: string;
  disabled?: boolean;
  onChange?: (tags: string[]) => void;
}
export interface DynamicTagsInstance {
  element: DocumentFragment;
  getTags(): string[];
  setTags(tags: string[]): boolean;
  addTag(tag: string): boolean;
  removeTag(tag: string): boolean;
  destroy(): void;
}
export function DynamicTags(options?: DynamicTagsOptions): DynamicTagsInstance;

// ImagePreview
export interface ImagePreviewItem {
  src: string;
  alt?: string;
  title?: string;
  meta?: string;
}
export interface ImagePreviewOptions {
  images: Array<string | ImagePreviewItem>;
  index?: number;
  onClose?: () => void;
}
export interface ImagePreviewInstance extends Destroyable {
  open(index?: number): void;
  close(): void;
  show(index?: number): void;
  hide(): void;
  next(): void;
  prev(): void;
  isOpen(): boolean;
  getIndex(): number;
}
export function ImagePreview(options: ImagePreviewOptions): ImagePreviewInstance;

// ColorPicker
export interface ColorPickerOptions {
  value?: string;
  color?: string;
  colors?: string[];
  presets?: string[];
  showInput?: boolean;
  disabled?: boolean;
  onChange?: (color: string) => void;
}
export interface ColorPickerInstance extends Destroyable {
  setValue(color: string): void;
  getValue(): string;
  setColor(color: string): void;
  getColor(): string;
  open(): void;
  close(): void;
  toggle(): void;
  isOpen(): boolean;
}
export function ColorPicker(options?: ColorPickerOptions): ColorPickerInstance;

// VirtualList
export interface VirtualListOptions<T = unknown> {
  items?: T[];
  data?: T[];
  itemHeight?: number;
  height?: number;
  overscan?: number;
  virtualThreshold?: number;
  renderItem?: (item: T, index: number) => string | HTMLElement;
  onClick?: (item: T, index: number) => void;
  onItemClick?: (item: T, index: number) => void;
}
export interface VirtualListInstance<T = unknown> {
  element: DocumentFragment;
  setData(data: T[]): void;
  scrollTo(index: number): void;
  destroy(): void;
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
export type MessageType = 'normal' | 'success' | 'error' | 'warning' | 'info';
export type MessagePosition = 'top' | 'top-right' | 'top-left' | 'bottom' | 'bottom-right' | 'bottom-left';
export interface MessageShowOptions {
  duration?: number;
}
export interface MessageOptions extends MessageShowOptions {
  position?: MessagePosition;
  maxCount?: number;
}
export interface MessageItem {
  element: HTMLElement;
  close(): void;
}
export interface MessageInstance {
  normal(content: string, options?: MessageShowOptions): MessageItem | null;
  success(content: string, options?: MessageShowOptions): MessageItem | null;
  error(content: string, options?: MessageShowOptions): MessageItem | null;
  warning(content: string, options?: MessageShowOptions): MessageItem | null;
  info(content: string, options?: MessageShowOptions): MessageItem | null;
  show(content: string, type?: MessageType, options?: MessageShowOptions): MessageItem | null;
  destroy(): void;
}
export function Message(options?: MessageOptions): MessageInstance;

// Heatmap
export interface HeatmapDataItem {
  date: string;
  value: number;
}
export interface HeatmapOptions {
  data?: HeatmapDataItem[];
  startDate?: Date;
  endDate?: Date;
  color?: string;
  title?: string;
  subtitle?: string;
  onCellClick?: (data: HeatmapDataItem) => void;
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
export interface ValidationState {
  valid: boolean;
  errors: Record<string, string>;
  errorCount: number;
}
export type ValidationFunction = (
  value: unknown,
  params: string[],
  input: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null,
) => boolean;
export type AsyncValidationFunction = (
  value: unknown,
  params: string[],
  input: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
) => boolean | Promise<boolean>;
export interface ValidationOptions {
  validators?: Record<string, ValidationFunction>;
  asyncValidators?: Record<string, AsyncValidationFunction>;
}
export interface ValidationInstance {
  check(value: unknown, rules: string): boolean;
  validateInput(input: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement): boolean;
  validateForm(form: HTMLFormElement): boolean;
  validateFormAsync(form: HTMLFormElement, options?: { group?: string }): Promise<boolean>;
  validateGroup(form: HTMLFormElement, groupName: string): Promise<boolean>;
  addValidator(name: string, fn: ValidationFunction): void;
  addAsyncValidator(name: string, fn: AsyncValidationFunction): void;
  getFormState(form: HTMLFormElement): ValidationState;
  parseRules(rulesStr: string): Record<string, string[]>;
  resetForm(form: HTMLFormElement): void;
  destroy(): void;
}
export function Validation(options?: ValidationOptions): ValidationInstance;

// Form
export type FormField = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
export type FormValidator = (value: unknown, parameter: string, field: FormField) => boolean;
export interface FormOptions {
  element: HTMLFormElement | string;
  validators?: Record<string, FormValidator>;
  onSubmit?: (data: Record<string, unknown>) => void | Promise<void>;
  onValidate?: (valid: boolean) => void;
}
export interface FormInstance extends Destroyable {
  validate(): boolean;
  validateField(field: FormField): boolean;
  showError(field: FormField, message: string): void;
  clearError(field: FormField): void;
  clearAllErrors(): void;
  getData(): Record<string, unknown>;
  setData(data: Record<string, unknown>): void;
  reset(): void;
  addValidator(name: string, fn: FormValidator, message?: string): void;
}
export function Form(options: FormOptions): FormInstance;

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
  virtualScroll?: {
    rowHeight: number;
    overscan?: number;
    height?: number | string;
    viewportHeight?: number | string;
    visibleRows?: number;
  };
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
