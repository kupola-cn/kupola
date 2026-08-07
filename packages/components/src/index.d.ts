// SPDX-License-Identifier: MIT
/**
 * @kupola/components — TypeScript type definitions for the public API.
 *
 * Re-exports the component factory functions and option/instance interfaces
 * declared in `./components/types`. Runtime implementations live in
 * `./components/*.js` and are bundled per-component (see `package.json`).
 *
 * @module @kupola/components
 */

// Re-export all component types, options interfaces, and factory functions.
export * from './components/types.js';

// The runtime index.js renames a few component factories to follow common
// casing conventions (e.g. `Datepicker` → `DatePicker`). Mirror those renames
// here so consumers importing from the package entry get matching types.
export { Datepicker as DatePicker } from './components/types.js';
export { Statcard as StatCard } from './components/types.js';
export { Textarea as TextArea } from './components/types.js';
export { Timepicker as TimePicker } from './components/types.js';
export type {
  IconProvider,
  IconResolverOptions,
  KupolaIconProviderOptions,
  SetupUiOptions,
} from './components/ui.d.ts';
export { createIconResolver, createKupolaIconProvider, setupUi } from './components/ui.d.ts';

export interface OverlayHandle {
  readonly element: Element | null;
  close(): void;
  destroy(): void;
}

export interface OverlayService {
  openModal(options?: Record<string, any>, children?: any): OverlayHandle;
  destroy(): void;
}

export const OVERLAY_KEY: unique symbol;
export function createOverlay(): OverlayService;
export function createOverlayPlugin(): { install(): void; destroy(): void };
export function useOverlay(): OverlayService;
