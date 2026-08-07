import type { Destroyable } from './common.js';

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
