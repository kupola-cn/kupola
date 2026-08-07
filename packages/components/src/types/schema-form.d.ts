export type SchemaRuleValue = boolean | string | number | RegExp | {
  value?: boolean | string | number | RegExp;
  message?: string;
};
export type SchemaOption =
  | string
  | number
  | [string, unknown]
  | { label?: string; text?: string; name?: string; value?: unknown; id?: unknown; disabled?: boolean };
export type SchemaOptionSource = SchemaOption[] | Record<string, unknown> | Map<string, unknown>;
export interface SchemaFieldDefinition {
  name?: string;
  label?: string;
  type?: string;
  placeholder?: string;
  autocomplete?: string;
  disabled?: boolean;
  readonly?: boolean;
  multiple?: boolean;
  className?: string;
  controlClassName?: string;
  labelClassName?: string;
  attrs?: Record<string, unknown>;
  props?: Record<string, unknown>;
  rules?: Record<string, SchemaRuleValue>;
  messages?: Record<string, string>;
  required?: boolean;
  validateEmail?: boolean;
  value?: unknown;
  options?: SchemaOptionSource;
}
export interface SchemaFieldBuilder {
  name(value: string): this;
  placeholder(value: string): this;
  autocomplete(value: string): this;
  className(value: string): this;
  controlClassName(value: string): this;
  labelClassName(value: string): this;
  attr(name: string, value?: unknown): this;
  prop(name: string, value: unknown): this;
  props(value: Record<string, unknown>): this;
  disabled(value?: boolean): this;
  readonly(value?: boolean): this;
  multiple(value?: boolean): this;
  rule(name: string, value?: unknown, message?: string): this;
  required(message?: string): this;
  email(message?: string): this;
  minlength(value: number, message?: string): this;
  maxlength(value: number, message?: string): this;
  min(value: number, message?: string): this;
  max(value: number, message?: string): this;
  pattern(value: string | RegExp, message?: string): this;
  value(value: unknown): this;
  options(value: SchemaOptionSource): this;
  activate(value: unknown): this;
  activateValue(value: unknown): this;
  activateIndex(index: number): this;
  build(name?: string): SchemaFieldDefinition;
}
export interface SchemaFormSchema<TData extends object = Record<string, unknown>> {
  readonly fields: readonly SchemaFieldDefinition[];
  bind(target: HTMLFormElement | Element | string, options?: SchemaFormScopeOptions<TData>): SchemaFormScope<TData>;
  submit(onSubmit?: SchemaSubmit<TData>, options?: SchemaFormScopeOptions<TData>): SchemaSubmitHandler;
  validate(data?: Partial<TData> | Record<string, unknown>, options?: Record<string, unknown>): SchemaValidationResult<TData>;
}
export interface SchemaFormApi<TData extends object = Record<string, unknown>> {
  readonly element: HTMLFormElement | null;
  validate(): boolean;
  getData(): TData;
  getRawData(): Record<string, unknown>;
  setData(data: Partial<TData> | Record<string, unknown>): void;
  reset(): void;
  getField(name: string): Element | RadioNodeList | null;
}
export interface SchemaValidationError<TData extends object = Record<string, unknown>> {
  name: Extract<keyof TData, string> | string;
  rule: string;
  message: string;
  field: SchemaFieldDefinition;
  value: unknown;
}
export interface SchemaValidationResult<TData extends object = Record<string, unknown>> {
  valid: boolean;
  errors: SchemaValidationError<TData>[];
  firstError: SchemaValidationError<TData> | null;
}
export type SchemaSubmit<TData extends object = Record<string, unknown>> = (
  data: TData,
  form: SchemaFormApi<TData>,
  event: SubmitEvent
) => void | Promise<void>;
export type SchemaSubmitCallback<TData extends object = Record<string, unknown>> = SchemaSubmit<TData>;
export interface SchemaSubmitHandler {
  (event?: SubmitEvent): void;
}
export type SchemaFormVariant = 'default' | 'dialog' | 'drawer' | 'inline' | 'dense';
export type SchemaFormDensity = 'default' | 'comfortable' | 'dense';
export const FormVariant: Readonly<{
  Default: 'default';
  Dialog: 'dialog';
  Drawer: 'drawer';
  Inline: 'inline';
  Dense: 'dense';
}>;
export const FormDensity: Readonly<{
  Default: 'default';
  Comfortable: 'comfortable';
  Dense: 'dense';
}>;
export interface SchemaFormClasses {
  root?: string;
  fields?: string;
  field?: string;
  label?: string;
  control?: string;
  actions?: string;
  cancel?: string;
  submit?: string;
}
export interface SchemaFieldRenderContext {
  schema: SchemaFormSchema;
  classes: SchemaFormClasses;
  fieldClassName: string;
  labelClassName: string;
  controlClassName: string;
  rootAttrs: unknown;
  attrs(field: SchemaFieldDefinition, options?: { rules?: boolean; state?: boolean }): unknown;
}
export interface SchemaFieldMountContext {
  field: SchemaFieldDefinition;
  root: Element;
  form: HTMLFormElement;
  api: SchemaFormApi;
}
export interface SchemaFieldController {
  getValue?(): unknown;
  setValue?(value: unknown): void;
  validate?(value: unknown, field: SchemaFieldDefinition, api: SchemaFormApi): boolean | string | { valid?: boolean; message?: string };
  destroy?(): void;
}
export type SchemaFieldRenderer =
  | ((field: SchemaFieldDefinition, context: SchemaFieldRenderContext) => unknown)
  | {
      render(field: SchemaFieldDefinition, context: SchemaFieldRenderContext): unknown;
      mount?(context: SchemaFieldMountContext): SchemaFieldController | void;
    };
export interface SchemaFormOptions<TData extends object = Record<string, unknown>> {
  schema: SchemaFormSchema<TData> | Record<string, SchemaFieldDefinition | SchemaFieldBuilder>;
  variant?: SchemaFormVariant;
  density?: SchemaFormDensity;
  classes?: SchemaFormClasses;
  className?: string;
  fieldClassName?: string;
  actionsClassName?: string;
  submitClassName?: string;
  cancelClassName?: string;
  submitText?: string;
  cancelText?: string;
  values?: Partial<TData> | Record<string, unknown>;
  options?: Omit<FormOptions, 'element'>;
  feedback?: boolean | { message?: boolean };
  onReady?: (api: SchemaFormApi<TData>) => void;
  onSubmit?: SchemaSubmit<TData>;
  onInvalid?: (
    result: { errors: Array<{ name: string; message: string; element: Element | null }>; firstError: unknown },
    form: SchemaFormApi<TData>,
    event: SubmitEvent
  ) => void;
  onCancel?: (event: MouseEvent, form: SchemaFormApi<TData>) => void;
  onInput?: (event: InputEvent, form: SchemaFormApi<TData>) => void;
}
export type SchemaFormClassValue = string | false | null | undefined;
export interface SchemaFormFieldRenderOptions {
  className?: string;
  controlClassName?: string;
  labelClassName?: string;
  attrs?: Record<string, unknown>;
  props?: Record<string, unknown>;
}
export interface SchemaFormActionOptions {
  className?: string;
  cancelClassName?: string;
  submitClassName?: string;
  cancelText?: string;
  submitText?: string;
}
export type SchemaFormScopeOptions<TData extends object = Record<string, unknown>> = Omit<SchemaFormOptions<TData>, 'schema'>;
export interface SchemaFormScope<TData extends object = Record<string, unknown>> extends SchemaFormApi<TData> {
  readonly schema: SchemaFormSchema<TData>;
  mount(element: HTMLFormElement | Element | string): this;
  destroy(): void;
  rootClass(...classNames: SchemaFormClassValue[]): string;
  fieldsClass(...classNames: SchemaFormClassValue[]): string;
  actionsClass(...classNames: SchemaFormClassValue[]): string;
  cancelClass(...classNames: SchemaFormClassValue[]): string;
  submitClass(...classNames: SchemaFormClassValue[]): string;
  field(name: string, options?: string | SchemaFormFieldRenderOptions): unknown;
  actions(options?: SchemaFormActionOptions): unknown;
  submit(event?: SubmitEvent): void;
  cancel(event?: MouseEvent): void;
  input(event?: InputEvent): void;
  getSchemaField(name: string): SchemaFieldDefinition | null;
}
export function field(type: string, label?: string, options?: SchemaFieldDefinition): SchemaFieldBuilder;
export function text(label?: string, options?: SchemaFieldDefinition): SchemaFieldBuilder;
export function email(label?: string, options?: SchemaFieldDefinition): SchemaFieldBuilder;
export function password(label?: string, options?: SchemaFieldDefinition): SchemaFieldBuilder;
export function number(label?: string, options?: SchemaFieldDefinition): SchemaFieldBuilder;
export function date(label?: string, options?: SchemaFieldDefinition): SchemaFieldBuilder;
export function time(label?: string, options?: SchemaFieldDefinition): SchemaFieldBuilder;
export function textarea(label?: string, options?: SchemaFieldDefinition): SchemaFieldBuilder;
export function select(label?: string, options?: SchemaOptionSource, config?: SchemaFieldDefinition): SchemaFieldBuilder;
export function checkbox(label?: string, options?: SchemaOptionSource | SchemaFieldDefinition, config?: SchemaFieldDefinition): SchemaFieldBuilder;
export function radio(label?: string, options?: SchemaOptionSource, config?: SchemaFieldDefinition): SchemaFieldBuilder;
export function switchField(label?: string, options?: SchemaFieldDefinition): SchemaFieldBuilder;
export const switcher: typeof switchField;
export function schema<TData extends object = Record<string, unknown>>(
  definition?: Record<string, SchemaFieldDefinition | SchemaFieldBuilder> | SchemaFieldDefinition[]
): SchemaFormSchema<TData>;
export function registerFormField(type: string, renderer: SchemaFieldRenderer): () => void;
export function getFormFieldRenderer(type: string): { render(field: SchemaFieldDefinition, context: SchemaFieldRenderContext): unknown } | undefined;
export function bindSchemaForm<TData extends object = Record<string, unknown>>(
  target: HTMLFormElement | Element | string,
  schema: SchemaFormSchema<TData> | Record<string, SchemaFieldDefinition | SchemaFieldBuilder>,
  options?: SchemaFormScopeOptions<TData>
): SchemaFormScope<TData>;
export function createFormScope<TData extends object = Record<string, unknown>>(
  schema: SchemaFormSchema<TData> | Record<string, SchemaFieldDefinition | SchemaFieldBuilder>,
  options?: SchemaFormScopeOptions<TData>
): SchemaFormScope<TData>;
export function schemaSubmit<TData extends object = Record<string, unknown>>(
  schema: SchemaFormSchema<TData> | Record<string, SchemaFieldDefinition | SchemaFieldBuilder>,
  onSubmit?: SchemaSubmit<TData>,
  options?: SchemaFormScopeOptions<TData>
): SchemaSubmitHandler;
export function validateSchema<TData extends object = Record<string, unknown>>(
  schema: SchemaFormSchema<TData> | Record<string, SchemaFieldDefinition | SchemaFieldBuilder>,
  data?: Partial<TData> | Record<string, unknown>,
  options?: Record<string, unknown>
): SchemaValidationResult<TData>;
export function SchemaForm<TData extends object = Record<string, unknown>>(options: SchemaFormOptions<TData>): import('@kupola/platform').ComponentInstance;
