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
export * from './components/types';

// The runtime index.js renames a few component factories to follow common
// casing conventions (e.g. `Datepicker` → `DatePicker`). Mirror those renames
// here so consumers importing from the package entry get matching types.
export { Datepicker as DatePicker } from './components/types';
export { Statcard as StatCard } from './components/types';
export { Textarea as TextArea } from './components/types';
export { Timepicker as TimePicker } from './components/types';
