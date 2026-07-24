// SPDX-License-Identifier: MIT
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
  signal,
  Signal,
  reactive,
  isReactive,
  computed,
  effect,
  watch,
  batch,
  withoutTracking,
} from '@kupola/core';
export type { ReadonlySignal, Dispose, WatchOptions } from '@kupola/core';

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

/** Manages all Parts created from a single template render. */
export declare class TemplateInstance {
  parts: any[];
  fragment: DocumentFragment | null;
  /** Remove all reactive effects and event listeners. */
  destroy(): void;
}

/** Render a template into a DOM container with reactive bindings. */
export declare function render(
  tpl: TemplateResult,
  container: Element
): TemplateInstance;

// ── Component System ──────────────────────────────────────────────────────────

export interface ComponentDefinition {
  props?: string[];
  setup: (
    props: Record<string, any>,
    children?: TemplateResult | string
  ) => (() => TemplateResult) | TemplateResult;
  created?: () => void;
  mounted?: () => void;
  destroyed?: () => void;
}

export interface ComponentInstance {
  template: TemplateResult;
  destroy: () => void;
  update: (props: Record<string, any>) => void;
  on: (event: string, handler: (...args: any[]) => void) => void;
}

/** Define a reusable component. Returns a factory: (initialProps?, children?) => ComponentInstance. */
export declare function defineComponent(
  definition: ComponentDefinition
): (
  initialProps?: Record<string, any>,
  children?: TemplateResult | string
) => ComponentInstance;

/** Register a component factory in the global registry. */
export declare function register(name: string, factory: Function): void;

/** Get a registered component factory by name. */
export declare function getComponent(name: string): any;

/** Check whether a component is registered. */
export declare function hasComponent(name: string): boolean;

/** Clear the global component registry. */
export declare function clearRegistry(): void;

/** Provide a value to descendant components via inject(). */
export declare function provide(key: string, value: any): void;

/** Inject a value provided by an ancestor component. */
export declare function inject(key: string, defaultValue?: any): any;

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
} from './directives';
export type {
  KupolaRefValue,
  ScopeContext,
  ScopeDefinition,
  WalkOptions,
  WalkResult,
} from './directives';

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
  loader: () => Promise<{ default?: Function } & Record<string, any>>,
  exportName?: string
): any;

/** Preload a lazy component in the background. Resolves when the module is loaded. */
export declare function preloadComponent(lazyFactory: any): Promise<void>;
