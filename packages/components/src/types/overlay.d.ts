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

export interface OverlayModalHandle {
  readonly element: HTMLElement | null;
  close(): void;
  destroy(): void;
}
export interface OverlayInstance {
  openModal(options?: ModalOptions, children?: unknown): OverlayModalHandle;
  destroy(): void;
}
export function createOverlay(): OverlayInstance;

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

