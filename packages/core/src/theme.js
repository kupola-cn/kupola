// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Theme utilities (anti-FOUC + persistence).
 *
 * Provides blocking-style theme initialization to prevent
 * Flash of Unstyled Content (FOUC) on page refresh.
 *
 * ## Quick Start (prevent FOUC)
 *
 * Add this **blocking** script to `<head>` (before any CSS or body):
 * ```html
 * <head>
 *   <script type="module">
 *     import { themePreload } from '@kupola/kupola';
 *     themePreload(); // sets data-theme BEFORE first paint
 *   </script>
 * </head>
 * ```
 *
 * Or use the inline snippet (zero-dependency, works without bundler):
 * ```html
 * <head>
 *   <script>
 *     // Inline theme preload — paste this before </head>
 *     (function(){var t=localStorage.getItem('kupola-theme')||
 *       (matchMedia('(prefers-color-scheme:light)').matches?'light':'dark');
 *       document.documentElement.dataset.theme=t;})()
 *   </script>
 * </head>
 * ```
 *
 * ## API
 *
 * - `themePreload()` — blocking call, reads localStorage + system pref, sets data-theme
 * - `getPreferredTheme()` — returns 'light' | 'dark' based on localStorage or system
 * - `setTheme(theme)` — sets data-theme + persists to localStorage
 * - `toggleTheme()` — flips between light and dark
 * - `onThemeChange(callback)` — subscribe to theme changes
 * - `getThemeInlineScript()` — returns the inline `<script>` string for SSR/static pages
 *
 * @module theme
 */

const STORAGE_KEY = 'kupola-theme';
const VALID_THEMES = ['light', 'dark'];

/** @type {Set<(theme: string) => void>} */
const _listeners = new Set();

// ── Core API ──────────────────────────────────────────────────────────────

/**
 * Get the user's preferred theme.
 * Priority: localStorage > system prefers-color-scheme > 'dark' (default).
 * @returns {'light' | 'dark'}
 */
export function getPreferredTheme() {
  // 1. Check persisted preference
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && VALID_THEMES.includes(stored)) {
      return stored;
    }
  }

  // 2. Check system preference
  if (typeof matchMedia !== 'undefined') {
    if (matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
  }

  // 3. Default to dark
  return 'dark';
}

/**
 * Set the theme and persist to localStorage.
 * Applies `data-theme` on `<html>` immediately.
 * @param {'light' | 'dark'} theme
 */
export function setTheme(theme) {
  if (!VALID_THEMES.includes(theme)) {
    throw new Error(`Invalid theme "${theme}". Must be one of: ${VALID_THEMES.join(', ')}`);
  }

  document.documentElement.dataset.theme = theme;

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, theme);
  }

  // Notify listeners
  for (const fn of _listeners) {
    try { fn(theme); } catch { /* swallow */ }
  }
}

/**
 * Toggle between light and dark themes.
 * @returns {'light' | 'dark'} The new theme after toggle.
 */
export function toggleTheme() {
  const current = document.documentElement.dataset.theme || 'dark';
  const next = current === 'dark' ? 'light' : 'dark';
  setTheme(next);
  return next;
}

/**
 * Subscribe to theme changes.
 * @param {(theme: string) => void} callback
 * @returns {() => void} Unsubscribe function.
 */
export function onThemeChange(callback) {
  _listeners.add(callback);
  return () => _listeners.delete(callback);
}

// ── Anti-FOUC ─────────────────────────────────────────────────────────────

/**
 * **Blocking** theme preload — call this in a `<head>` script BEFORE
 * the page renders. Reads localStorage + system pref and sets
 * `data-theme` on `<html>` to prevent FOUC.
 *
 * Also removes `[k-cloak]` attributes once the theme is set.
 *
 * Usage:
 * ```html
 * <head>
 *   <script type="module">
 *     import { themePreload } from '@kupola/kupola';
 *     themePreload();
 *   </script>
 * </head>
 * ```
 */
export function themePreload() {
  const theme = getPreferredTheme();
  document.documentElement.dataset.theme = theme;

  // Remove k-cloak after theme is applied
  requestAnimationFrame(() => {
    const cloaked = document.querySelectorAll('[k-cloak]');
    for (const el of cloaked) {
      el.removeAttribute('k-cloak');
    }
  });

  // Listen for system theme changes (auto-follow OS preference)
  if (typeof matchMedia !== 'undefined') {
    matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
      // Only auto-follow if user hasn't manually set a preference
      if (typeof localStorage !== 'undefined' && !localStorage.getItem(STORAGE_KEY)) {
        setTheme(e.matches ? 'light' : 'dark');
      }
    });
  }
}

/**
 * Returns a self-contained inline `<script>` string that can be
 * injected into static HTML (e.g., SSR output, create-kupola templates).
 *
 * This script runs synchronously in `<head>` — no module import needed.
 * It reads localStorage and sets `data-theme` before first paint.
 *
 * @returns {string} HTML `<script>` tag content.
 */
export function getThemeInlineScript() {
  return `<script>(function(){var t=localStorage.getItem('kupola-theme');if(!t){t=window.matchMedia&&window.matchMedia('(prefers-color-scheme:light)').matches?'light':'dark';}document.documentElement.dataset.theme=t;})()<\/script>`;
}
