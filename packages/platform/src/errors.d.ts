import type { TemplateResult } from './platform.d.ts';

export type ErrorFallback =
  | string
  | TemplateResult
  | ((error: Error) => string | TemplateResult);

export interface ErrorBoundaryOptions {
  fallback?: ErrorFallback | null;
  onError?: (error: Error) => void;
}

export interface ErrorBoundaryResult {
  readonly element: DocumentFragment | HTMLElement;
  readonly error: Error;
}

export declare function ErrorBoundary<T extends object>(
  factory: () => T,
  options?: ErrorBoundaryOptions
): T | ErrorBoundaryResult;
