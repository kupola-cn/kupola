// SPDX-License-Identifier: MIT
import type { ReadonlySignal, Signal } from '@kupola/core';
import type { DirectiveDefinition } from './directives.d.ts';
/**
 * @kupola/platform — Full-featured platform with reactivity + rendering +
 * components + directives.
 *
 * This package includes all Kupola features in a single import:
 * - Signal-based reactivity (from @kupola/core)
 * - HTML template rendering (html tag + render())
 * - Component system (defineComponent, register, provide/inject)
 * - Declarative directives (walk, k-data, k-show, etc.)
 * - Theme utilities (anti-FOUC, brand colors)
 * - Lazy loading (lazyComponent)
 *
 * @module @kupola/platform
 */

// ── Core Reactivity (re-exported from @kupola/core) ──────────────────────────
export {
  batch,
  computed,
  createScheduler,
  effect,
  effectScope,
  flushJobs,
  getCurrentScheduler,
  isReactive,
  nextTick,
  onScopeDispose,
  reactive,
  runWithScheduler,
  signal,
  Signal,
  toRaw,
  watch,
  withoutTracking,
} from '@kupola/core';
export type {
  Dispose,
  EffectScope,
  ReadonlySignal,
  Scheduler,
  SchedulerOptions,
  WatchOptions,
} from '@kupola/core';

// ── Template & Render ──────────────────────────────────────────────────────────

/** Lightweight template result — holds the raw strings and values from a tagged template literal. */
export declare class TemplateResult {
  constructor(strings: TemplateStringsArray, values: any[]);
  readonly strings: TemplateStringsArray;
  readonly values: any[];
}

/** Tagged template literal for HTML templates. */
export declare function html(
  strings: TemplateStringsArray,
  ...values: any[]
): TemplateResult;

/** Wrapper for raw HTML strings that should NOT be escaped during template rendering. */
export declare class HtmlString {
  constructor(content: string | object);
  readonly content: string | object;
  toString(): string;
}

/** Create a raw HTML string that will not be escaped during template rendering. */
export declare function htmlString(html: string | object): HtmlString;

/** Primitive values that Kupola template text/attribute parts can render. */
export type TemplatePrimitive = string | number | boolean | bigint | symbol | null | undefined;

/** A non-reactive value that can be interpolated inside `html`` templates. */
export type TemplateChild =
  | TemplateResult
  | ComponentInstance
  | HtmlString
  | readonly (TemplateResult | ComponentInstance)[]
  | TemplatePrimitive;

/** A value accepted by `html`` interpolations, including signal/function bindings. */
export type ViewChild =
  | TemplateChild
  | Signal<TemplateChild>
  | ReadonlySignal<TemplateChild>
  | (() => TemplateChild);

/** Accept either a plain value or a Kupola signal/computed signal. */
export type MaybeSignal<T> = T | Signal<T> | ReadonlySignal<T>;

/** Accept either a plain value, signal/computed signal, or function binding. */
export type ReactiveValue<T> = MaybeSignal<T> | (() => T);

/** Accept either a direct value or a promise. */
export type MaybePromise<T> = T | Promise<T>;

/** A Kupola view function that returns an `html`` template. */
export type View<Props = Record<string, unknown>> = (props: Props) => TemplateResult;

/** Semantic alias for route/page-level views. */
export type PageView<Props = Record<string, unknown>> = View<Props>;

/** Event callback type for `on*="${handler}"` template bindings. */
export type EventHandler<E extends Event = Event> = (event: E) => void;

/** Event callback type when a handler may perform async work. */
export type AsyncEventHandler<E extends Event = Event> = (event: E) => MaybePromise<void>;

/** Manages all Parts created from a single template render. */
export declare class TemplateInstance {
  parts: any[];
  fragment: DocumentFragment | null;
  /** Remove all reactive effects and event listeners. */
  destroy(): void;
}

/** Render a template into a DOM container with reactive bindings. */
export type Renderable = TemplateResult | ComponentInstance;
export type RenderInstance = TemplateInstance | ComponentInstance;

export declare function render(
  tpl: Renderable,
  container: Element,
  options?: RenderOptions
): RenderInstance;

export interface RenderOptions {
  scheduler?: Scheduler | null;
}

export interface MountOptions extends RenderOptions {
  sanitizer?: ((html: string, element: Element) => string) | null;
  customDirectives?: Map<string, DirectiveDefinition> | Record<string, DirectiveDefinition>;
}

/** Render a template and activate directives in one app-local scheduler context. */
export declare function mount(
  tpl: Renderable,
  container: Element | string,
  options?: MountOptions
): RenderInstance;

export interface AppPlugin {
  install: () => void | Promise<void>;
  init?: () => void | Promise<void>;
  destroy?: () => void | Promise<void>;
}

export type AppPluginFactory = () => void | Promise<void>;

export interface AppInstance {
  /** Register a plugin before mount. Plugins cannot be added after mounting. */
  use(plugin: AppPlugin | AppPluginFactory): this;
  /** Provide a value to all components created by this app. */
  provide(key: InjectionKey, value: any): this;
  /** Mount the app once with synchronous plugin hooks only. */
  mount(container: Element | string): TemplateInstance;
  /** Mount the app and await asynchronous plugin install/init hooks. */
  mountAsync(container: Element | string): Promise<TemplateInstance>;
  /** Dispose the mounted view and await asynchronous plugin destroy hooks. */
  destroyAsync(): Promise<void>;
  /** Dispose the mounted view with synchronous plugin destroy hooks only. */
  destroy(): void;
}

export declare function createApp(
  tpl: Renderable | ComponentFactory,
  options?: MountOptions
): AppInstance;

export type IconResolver = (
  name: string,
  size?: unknown
) => string | null | undefined | Promise<string | null | undefined>;

/** Configure the resolver used by <icon> template parts. */
export declare function setIconResolver(resolver: IconResolver | null): void;

// ── Component System ──────────────────────────────────────────────────────────

export interface ComponentDefinition {
  props?: readonly string[];
  setup: (context: ComponentSetupContext) => (() => TemplateResult) | TemplateResult;
  created?: (context: ComponentLifecycleContext) => void | Promise<void>;
  mounted?: (context: ComponentLifecycleContext) => void | Promise<void>;
  destroyed?: (context: ComponentLifecycleContext) => void | Promise<void>;
}

export interface ComponentSetupContext {
  readonly props: Record<string, Signal>;
  readonly children: ViewChild;
  readonly emit: (event: string, ...args: any[]) => void;
  readonly lifecycle: ComponentLifecycleContext;
}

export interface ComponentLifecycleContext {
  readonly props: Record<string, Signal>;
  readonly element: Node | null;
  readonly elements: Node[];
  readonly signal?: AbortSignal;
  onMounted(callback: (context: ComponentLifecycleContext) => void): () => void;
  onCleanup(callback: () => void): () => void;
}

export interface ComponentInstance {
  readonly element: DocumentFragment;
  readonly _instance: TemplateInstance;
  destroy: () => void;
  update: (props: Record<string, any>) => void;
  on: (event: string, handler: (...args: any[]) => void) => () => void;
}

/** A component factory with typed props and Kupola-compatible children. */
export type Component<Props extends Record<string, any> = Record<string, any>> = (
  initialProps?: Props,
  children?: ViewChild
) => ComponentInstance;

export interface ComponentFactory {
  (initialProps?: Record<string, any>, children?: ViewChild): ComponentInstance;
}

/** Define a reusable component. Returns a factory: (initialProps?, children?) => ComponentInstance. */
export declare function defineComponent(
  definition: ComponentDefinition
): ComponentFactory;

/** Register a component factory in the global registry. */
export declare function register(name: string, factory: Function): void;

/** Get a registered component factory by name. */
export declare function getComponent(name: string): any;

/** Check whether a component is registered. */
export declare function hasComponent(name: string): boolean;

/** Clear the global component registry. */
export declare function clearRegistry(): void;

/** Provide a value to descendant components via inject(). */
export type InjectionKey = string | symbol;

export declare function provide(key: InjectionKey, value: any): void;

/** Inject a value provided by an ancestor component. */
export declare function inject(key: InjectionKey, defaultValue?: any): any;

/** Return whether code is currently running inside an active app/component context. */
export declare function hasProvideContext(): boolean;

// ── Directives ────────────────────────────────────────────────────────────────
export {
  $,
  $$,
  walk,
  walkAuto,
  walkOnce,
  getWalk,
  hasWalk,
  destroyWalk,
  defineScope,
  setHtmlSanitizer,
  registerDirective,
} from './directives.d.ts';
export type {
  DirectiveBinding,
  DirectiveDefinition,
  DirectiveInstance,
  KupolaRefValue,
  ScopeContext,
  ScopeDefinition,
  WalkOptions,
  WalkResult,
} from './directives.d.ts';

// ── Theme (anti-FOUC) ────────────────────────────────────────────────────────

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

export declare const DEFAULT_BRAND_COLORS: BrandColor[];

export declare function registerBrandColors(colors: BrandColor[]): void;

/** Blocking call, reads localStorage + system preference, sets data-theme and brand color before first paint. */
export declare function themePreload(): void;

/** Stop automatic system-theme synchronization installed by themePreload(). */
export declare function stopThemePreload(): void;

export declare function getPreferredTheme(): KupolaTheme;

export declare function setTheme(theme: KupolaTheme): void;

export declare function toggleTheme(): KupolaTheme;

export declare function onThemeChange(
  callback: (theme: KupolaTheme) => void
): () => void;

export declare function getBrandColors(): BrandColor[];

export declare function resolveBrandColor(
  value: string | (Partial<BrandColor> & { color: string })
): BrandColor;

export declare function getPreferredBrandColor(): BrandColor;

export declare function setBrandColor(
  value: string | (Partial<BrandColor> & { color: string }),
  options?: { persist?: boolean; target?: HTMLElement }
): BrandColor;

export declare function resetBrandColor(): BrandColor;

export declare function onBrandColorChange(
  callback: (brand: BrandColor) => void
): () => void;

export declare function attachBrandColorPicker(
  trigger: HTMLElement,
  options?: { colors?: BrandColor[]; title?: string; custom?: boolean }
): BrandColorPickerInstance;

/** Returns the inline `<script>` string for SSR/static pages (zero-dependency theme preload). */
export declare function getThemeInlineScript(): string;

// ── Lazy Load ────────────────────────────────────────────────────────────────

/**
 * Create a lazy-loaded component wrapper.
 *
 * @param loader Dynamic import function returning the component module.
 * @param exportName Named export to use (default: 'default' or first exported function).
 * @returns An async factory: `async (...args) => ComponentResult`.
 */
export declare function lazyComponent(
  loader: (signal?: AbortSignal) =>
    Promise<{ default?: Function } & Record<string, any>> | { default?: Function } & Record<string, any>,
  exportName?: string,
  options?: LazyComponentOptions
): LazyComponentFactory;

export interface LazyComponentOptions {
  /** Reject the load when this many milliseconds elapse. */
  timeout?: number;
  /** Abort the current and future load attempts when aborted. */
  signal?: AbortSignal;
}

export interface LazyComponentFactory {
  (...args: any[]): Promise<any>;
  /** True after the component factory has been resolved successfully. */
  _isResolved(): boolean;
  /** Start loading the component module, sharing the current request. */
  _preload(): Promise<Function> | Function;
  /** Cancel the current load. Safe to call when no load is pending. */
  cancel(reason?: unknown): void;
}

/** Preload a lazy component in the background. Resolves when the module is loaded. */
export declare function preloadComponent(lazyFactory: any): Promise<void>;
