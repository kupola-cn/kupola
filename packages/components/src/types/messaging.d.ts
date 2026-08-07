import type { Destroyable } from './common.js';

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

