// SPDX-License-Identifier: MIT
/**
 * Custom icon replacement for built-in component icons.
 *
 * @module components/icon-config
 */

/**
 * Register replacement SVG strings for built-in component icons.
 * @param icons Map of icon name to SVG string.
 */
export function registerIcons(icons: Record<string, string>): void;

/**
 * Remove all registered custom icon replacements.
 */
export function clearIcons(): void;

/**
 * Resolve a registered custom icon by name.
 * @param name Icon name.
 * @returns SVG string, or undefined when not replaced.
 */
export function getIcon(name: string): string | undefined;
