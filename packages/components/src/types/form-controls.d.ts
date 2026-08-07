import type { Destroyable } from './common.js';

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
  setValue(value: string | number | (string | number)[], options?: { silent?: boolean }): void;
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

