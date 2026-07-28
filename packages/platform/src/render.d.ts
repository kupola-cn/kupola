import type { ComponentInstance, HtmlString, IconResolver, TemplateInstance, TemplateResult } from './platform.d.ts';

export { createApp, mount, render, TemplateInstance } from './platform.d.ts';
export type {
  AppInstance,
  AppPlugin,
  AppPluginFactory,
  AsyncEventHandler,
  EventHandler,
  MaybePromise,
  MaybeSignal,
  MountOptions,
  PageView,
  ReactiveValue,
  Renderable,
  RenderInstance,
  RenderOptions,
  TemplateChild,
  TemplatePrimitive,
  View,
  ViewChild,
} from './platform.d.ts';

export declare function escapeHtml(value: unknown): string;
export declare function isSignalLike(value: unknown): boolean;
export declare function isTemplateResultLike(value: unknown): value is TemplateResult;
export declare function isComponentInstanceLike(value: unknown): value is ComponentInstance;
export declare function isHtmlString(value: unknown): value is HtmlString;
export declare function setIconResolver(resolver: IconResolver | null): void;

export declare class TextPart {
  constructor(container: Node, rawValue: unknown);
  readonly container: Node;
  readonly rawValue: unknown;
  node: Text | null;
  mount(): void;
  destroy(): void;
}

export declare class AttrPart {
  constructor(element: Element, attrName: string, rawValue: unknown);
  readonly element: Element;
  readonly attrName: string;
  readonly rawValue: unknown;
  mount(): void;
  destroy(): void;
}

export declare class EventPart {
  constructor(element: Element, attrName: string, handler: EventListener);
  readonly element: Element;
  readonly eventName: string;
  readonly handler: EventListener;
  mount(): void;
  destroy(): void;
}

export declare class IconPart {
  constructor(element: Element, nameValue: unknown, sizeValue: unknown);
  readonly element: Element;
  mount(): void;
  destroy(): void;
}
