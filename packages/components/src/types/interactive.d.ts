import type { Destroyable } from './common.js';

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
  renderItem?: (item: T, index: number) => string | HTMLElement | import('@kupola/platform').TemplateResult;
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

