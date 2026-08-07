import type { Destroyable } from './common.js';

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
  /** IANA time zone used for timestamp/event date keys. Date-only strings stay date-only. */
  timeZone?: string;
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

