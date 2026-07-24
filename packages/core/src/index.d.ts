export type Cleanup = () => void;

export class Signal<T = unknown> {
  constructor(initialValue: T);
  value: T;
  peek(): T;
  toString(): string;
  toJSON(): string;
}

export interface ReadonlySignal<T = unknown> {
  readonly value: T;
  peek(): T;
  toString(): string;
  toJSON(): string;
}

export function signal<T = unknown>(initialValue: T): Signal<T>;
export function computed<T = unknown>(fn: () => T): ReadonlySignal<T>;
export function effect(fn: () => void): Cleanup;
export function batch<T>(fn: () => T): T;

export class TemplateResult {
  strings: TemplateStringsArray;
  values: unknown[];
  constructor(strings: TemplateStringsArray, values: unknown[]);
}

export function html(strings: TemplateStringsArray, ...values: unknown[]): TemplateResult;

export class TemplateInstance {
  parts: unknown[];
  cleanups: Cleanup[];
  destroy(): void;
}

export function render(tpl: TemplateResult, container: Element | DocumentFragment): TemplateInstance;
export function hydrate(tpl: TemplateResult, container: Element): TemplateInstance;

export interface ComponentInstance {
  readonly element: DocumentFragment;
  destroy(): void;
  update(newProps: Record<string, unknown>): void;
}

export interface ComponentDefinition<Props extends Record<string, unknown> = Record<string, unknown>> {
  props?: (keyof Props & string)[];
  setup(props: Record<keyof Props, Signal<unknown>>, children?: TemplateResult | string | null): () => TemplateResult;
}

export type ComponentFactory<Props extends Record<string, unknown> = Record<string, unknown>> = {
  (initialProps?: Partial<Props>, children?: TemplateResult | string | null): ComponentInstance;
  _isKupolaComponent: true;
  _propNames: string[];
};

export function defineComponent<Props extends Record<string, unknown> = Record<string, unknown>>(
  definition: ComponentDefinition<Props>
): ComponentFactory<Props>;
export function register(name: string, componentFactory: Function): void;
export function getComponent(name: string): Function | undefined;
export function hasComponent(name: string): boolean;
export function clearRegistry(): void;

export interface WalkResult {
  root: Element;
  refs: Record<string, Element | Element[]>;
  $(selector: string, context?: ParentNode): Element | null;
  $$<T extends Element = Element>(selector: string, context?: ParentNode): T[];
  on(type: string, handler: (event: Event, root: Element) => void, options?: AddEventListenerOptions): () => void;
  on<T extends Element = Element>(
    type: string,
    selector: string,
    handler: (event: Event, target: T) => void,
    options?: AddEventListenerOptions
  ): () => void;
  watch<T>(
    getter: () => T,
    callback: (value: T, oldValue: T | undefined) => void | (() => void),
    options?: { immediate?: boolean }
  ): () => void;
  destroy(): void;
}

export interface WalkOptions {
  autoDestroy?: boolean;
  sanitizer?: ((html: string, element: Element) => string) | null;
}

export interface ScopeContext {
  root: Element;
  refs: Record<string, Element | Element[]>;
  $(selector: string, context?: ParentNode): Element | null;
  $$<T extends Element = Element>(selector: string, context?: ParentNode): T[];
  on(type: string, handler: (event: Event, root: Element) => void, options?: AddEventListenerOptions): () => void;
  on<T extends Element = Element>(
    type: string,
    selector: string,
    handler: (event: Event, target: T) => void,
    options?: AddEventListenerOptions
  ): () => void;
  watch<T>(
    getter: () => T,
    callback: (value: T, oldValue: T | undefined) => void | (() => void),
    options?: { immediate?: boolean }
  ): () => void;
  update<T>(name: string, updater: (value: T) => T): T;
  patch<T extends Record<string, unknown>>(name: string, partial: Partial<T>): T;
  scope?: Record<string, unknown>;
}

export type ScopeDefinition =
  | Record<string, unknown>
  | ((ctx: ScopeContext) => Record<string, unknown>);

export function walk(root: Element | string, options?: WalkOptions): WalkResult;
export function walkAuto(root: Element | string, options?: WalkOptions): WalkResult;
export function walkOnce(root: Element | string, options?: WalkOptions): WalkResult;
export function getWalk(root: Element | string): WalkResult | null;
export function hasWalk(root: Element | string): boolean;
export function destroyWalk(root: Element | string): boolean;
export function setHtmlSanitizer(
  sanitizer: ((html: string, element: Element) => string) | null
): void;
export function defineScope(name: string, definition: ScopeDefinition): void;
export function $(selector: string, context?: ParentNode): Element | null;
export function $(selector: Element | null, context?: ParentNode): Element | null;
export function $$<T extends Element = Element>(selector: string, context?: ParentNode): T[];

export function flushJobs(): void;
export function resetScheduler(): void;

export function setLocale(locale: string): void;
export function getLocale(): string;
export function t(key: string, params?: Record<string, string | number>): string;
export function addMessages(locale: string, messages: Record<string, string>): void;

export interface ErrorBoundaryOptions {
  fallback?: string | HTMLElement | ((error: unknown) => string | HTMLElement);
  onError?: (error: unknown) => void;
}

export function ErrorBoundary(factory: () => HTMLElement | TemplateResult, options?: ErrorBoundaryOptions): HTMLElement;

export function enableProfiler(options?: Record<string, unknown>): void;
export function disableProfiler(): void;
export function resetProfiler(): void;
export function getProfileReport(): Record<string, unknown>;
export function printProfileReport(): void;

export interface LazyComponentFactory<T = unknown> {
  (...args: unknown[]): Promise<T>;
  _lazyLoader: () => Promise<Record<string, unknown>>;
  _isResolved(): boolean;
  _preload(): Promise<Function>;
}

export function lazyComponent<T = unknown>(
  loader: () => Promise<Record<string, unknown>>,
  exportName?: string
): LazyComponentFactory<T>;
export function preloadComponent(lazyFactory: LazyComponentFactory): Promise<void>;

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
export function onThemeChange(callback: (theme: KupolaTheme) => void): Cleanup;
export function getBrandColors(): BrandColor[];
export function resolveBrandColor(value: string | (Partial<BrandColor> & { color: string })): BrandColor;
export function getPreferredBrandColor(): BrandColor;
export function setBrandColor(
  value: string | (Partial<BrandColor> & { color: string }),
  options?: { persist?: boolean; target?: HTMLElement }
): BrandColor;
export function resetBrandColor(): BrandColor;
export function onBrandColorChange(callback: (brand: BrandColor) => void): Cleanup;
export function attachBrandColorPicker(
  trigger: HTMLElement,
  options?: { colors?: BrandColor[]; title?: string; custom?: boolean }
): BrandColorPickerInstance;
export function getThemeInlineScript(): string;

export * from './components/types';
