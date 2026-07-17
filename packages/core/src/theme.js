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
 * - `themePreload()` — blocking call, reads localStorage + system pref, sets data-theme and brand color
 * - `getPreferredTheme()` — returns 'light' | 'dark' based on localStorage or system
 * - `setTheme(theme)` — sets data-theme + persists to localStorage
 * - `toggleTheme()` — flips between light and dark
 * - `onThemeChange(callback)` — subscribe to theme changes
 * - `setBrandColor(colorOrId)` — applies and persists the brand color
 * - `attachBrandColorPicker(trigger)` — attaches a ready-to-use brand color popover
 * - `getThemeInlineScript()` — returns the inline `<script>` string for SSR/static pages
 *
 * @module theme
 */

const STORAGE_KEY = 'kupola-theme';
const BRAND_STORAGE_KEY = 'kupola-brand-color';
const VALID_THEMES = ['light', 'dark'];

export const DEFAULT_BRAND_COLORS = [
  { id: 'green', label: 'Green', color: '#22C55E' },
  { id: 'teal', label: 'Teal', color: '#14B8A6' },
  { id: 'cyan', label: 'Cyan', color: '#06B6D4' },
  { id: 'blue', label: 'Blue', color: '#3B82F6' },
  { id: 'indigo', label: 'Indigo', color: '#6366F1' },
  { id: 'violet', label: 'Violet', color: '#8B5CF6' },
  { id: 'rose', label: 'Rose', color: '#F43F5E' },
  { id: 'orange', label: 'Orange', color: '#F97316' },
  { id: 'amber', label: 'Amber', color: '#F59E0B' },
  { id: 'slate', label: 'Slate', color: '#535164' },
];

/** @type {Set<(theme: string) => void>} */
const _listeners = new Set();
/** @type {Set<(brand: { id: string, color: string, label: string }) => void>} */
const _brandListeners = new Set();

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

// ── Brand color ───────────────────────────────────────────────────────────

/**
 * Return the built-in brand color presets.
 * @returns {Array<{ id: string, label: string, color: string }>}
 */
export function getBrandColors() {
  return DEFAULT_BRAND_COLORS.slice();
}

/**
 * Resolve a preset id or hex color into a normalized brand object.
 * @param {string|{ id?: string, label?: string, color: string }} value
 * @returns {{ id: string, label: string, color: string }}
 */
export function resolveBrandColor(value) {
  if (value && typeof value === 'object') {
    const color = _normalizeHex(value.color);
    return {
      id: value.id || 'custom',
      label: value.label || value.id || color,
      color,
    };
  }

  const text = String(value || '').trim();
  const preset = DEFAULT_BRAND_COLORS.find(item => item.id === text || item.color.toLowerCase() === text.toLowerCase());
  if (preset) { return { ...preset }; }

  const color = _normalizeHex(text || DEFAULT_BRAND_COLORS[0].color);
  return { id: 'custom', label: color, color };
}

/**
 * Get the persisted brand color or the default preset.
 * @returns {{ id: string, label: string, color: string }}
 */
export function getPreferredBrandColor() {
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem(BRAND_STORAGE_KEY);
    if (stored) {
      try {
        return resolveBrandColor(JSON.parse(stored));
      } catch {
        return resolveBrandColor(stored);
      }
    }
  }
  return resolveBrandColor(DEFAULT_BRAND_COLORS[0]);
}

/**
 * Apply and persist a brand color.
 * @param {string|{ id?: string, label?: string, color: string }} value
 * @param {{ persist?: boolean, target?: HTMLElement }} [options]
 * @returns {{ id: string, label: string, color: string }}
 */
export function setBrandColor(value, options = {}) {
  const { persist = true, target = document.documentElement } = options;
  const brand = resolveBrandColor(value);
  _applyBrandColor(brand, target);

  if (persist && typeof localStorage !== 'undefined') {
    localStorage.setItem(BRAND_STORAGE_KEY, JSON.stringify(brand));
  }

  for (const fn of _brandListeners) {
    try { fn(brand); } catch { /* swallow */ }
  }

  return brand;
}

/**
 * Reset the brand color to the default preset.
 * @returns {{ id: string, label: string, color: string }}
 */
export function resetBrandColor() {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(BRAND_STORAGE_KEY);
  }
  return setBrandColor(DEFAULT_BRAND_COLORS[0], { persist: false });
}

/**
 * Subscribe to brand color changes.
 * @param {(brand: { id: string, label: string, color: string }) => void} callback
 * @returns {() => void}
 */
export function onBrandColorChange(callback) {
  _brandListeners.add(callback);
  return () => _brandListeners.delete(callback);
}

/**
 * Attach a default brand color picker popover to a trigger button.
 * @param {HTMLElement} trigger
 * @param {{ colors?: Array<{ id?: string, label?: string, color: string }>, title?: string, custom?: boolean, customLabel?: string }} [options]
 * @returns {{ open: Function, close: Function, toggle: Function, destroy: Function }}
 */
export function attachBrandColorPicker(trigger, options = {}) {
  if (!trigger || !trigger.addEventListener) {
    throw new Error('attachBrandColorPicker requires a trigger HTMLElement.');
  }

  const {
    colors = DEFAULT_BRAND_COLORS,
    title = 'Brand color',
    custom = true,
    customLabel = '自定义颜色',
  } = options;

  let isOpen = false;
  const panel = document.createElement('div');
  panel.className = 'ds-brand-picker';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', title);
  panel.innerHTML = `
    <div class="ds-brand-picker__header">
      <span class="ds-brand-picker__title">${_escapeHtml(title)}</span>
      <button class="ds-brand-picker__close" type="button" aria-label="Close">x</button>
    </div>
    <div class="ds-brand-picker__grid"></div>
    ${custom ? `<label class="ds-brand-picker__custom"><span>${_escapeHtml(customLabel)}</span><input class="ds-brand-picker__input" type="color"></label>` : ''}
  `;
  document.body.appendChild(panel);

  const grid = panel.querySelector('.ds-brand-picker__grid');
  const input = panel.querySelector('.ds-brand-picker__input');
  const closeBtn = panel.querySelector('.ds-brand-picker__close');

  function select(value) {
    const brand = setBrandColor(value);
    _syncSelected(brand);
    close();
  }

  function preview(value) {
    const brand = setBrandColor(value);
    _syncSelected(brand);
  }

  colors.forEach(item => {
    const brand = resolveBrandColor(item);
    const btn = document.createElement('button');
    btn.className = 'ds-brand-picker__swatch';
    btn.type = 'button';
    btn.dataset.brand = brand.id;
    btn.dataset.color = brand.color;
    btn.title = brand.label;
    btn.setAttribute('aria-label', brand.label);
    btn.style.setProperty('--ds-brand-swatch', brand.color);
    btn.addEventListener('click', () => select(brand));
    grid.appendChild(btn);
  });

  if (input) {
    input.value = getPreferredBrandColor().color;
    input.addEventListener('input', e => preview(e.target.value));
    input.addEventListener('change', e => preview(e.target.value));
  }

  function open() {
    if (isOpen) { return; }
    isOpen = true;
    _positionBrandPicker(panel, trigger);
    panel.classList.add('is-open');
    _syncSelected(getPreferredBrandColor());
    document.addEventListener('click', onOutsideClick);
    document.addEventListener('keydown', onKeydown);
    window.addEventListener('resize', onResize);
  }

  function close() {
    if (!isOpen) { return; }
    isOpen = false;
    panel.classList.remove('is-open');
    document.removeEventListener('click', onOutsideClick);
    document.removeEventListener('keydown', onKeydown);
    window.removeEventListener('resize', onResize);
  }

  function toggle() {
    isOpen ? close() : open();
  }

  function onTriggerClick(e) {
    e.preventDefault();
    e.stopPropagation();
    toggle();
  }

  function onOutsideClick(e) {
    if (!panel.contains(e.target) && !trigger.contains(e.target)) {
      close();
    }
  }

  function onKeydown(e) {
    if (e.key === 'Escape') { close(); }
  }

  function onResize() {
    if (isOpen) { _positionBrandPicker(panel, trigger); }
  }

  function _syncSelected(brand) {
    panel.querySelectorAll('.ds-brand-picker__swatch').forEach(btn => {
      btn.classList.toggle('is-selected', btn.dataset.color.toLowerCase() === brand.color.toLowerCase());
    });
    if (input) { input.value = brand.color; }
  }

  trigger.addEventListener('click', onTriggerClick);
  if (closeBtn) { closeBtn.addEventListener('click', close); }
  setBrandColor(getPreferredBrandColor(), { persist: false });

  return {
    open,
    close,
    toggle,
    destroy() {
      close();
      trigger.removeEventListener('click', onTriggerClick);
      if (closeBtn) { closeBtn.removeEventListener('click', close); }
      if (panel.parentNode) { panel.parentNode.removeChild(panel); }
    },
  };
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
  setBrandColor(getPreferredBrandColor(), { persist: false });

  // Remove k-cloak after theme is applied
  const raf = typeof requestAnimationFrame === 'function' ? requestAnimationFrame : (fn) => setTimeout(fn, 0);
  raf(() => {
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
  return `<script>(function(){var d=document.documentElement,t=localStorage.getItem('kupola-theme');if(!t){t=window.matchMedia&&window.matchMedia('(prefers-color-scheme:light)').matches?'light':'dark';}d.dataset.theme=t;try{var b=localStorage.getItem('kupola-brand-color');if(b){b=JSON.parse(b);var c=b.color||b;if(c){d.dataset.brand=b.id||'custom';d.style.setProperty('--bg-brand',c);d.style.setProperty('--text-brand',c);d.style.setProperty('--icon-brand',c);d.style.setProperty('--border-brand',c);}}}catch(e){}})()<\/script>`;
}

function _applyBrandColor(brand, target) {
  const hover = _mix(brand.color, _isDark(brand.color) ? '#ffffff' : '#000000', 0.14);
  const disabled = _hexToRgba(brand.color, 0.3);
  const soft = _hexToRgba(brand.color, 0.12);
  const onBrand = _isDark(brand.color) ? '#FFFFFF' : '#0C0C0D';

  target.dataset.brand = brand.id || 'custom';
  target.style.setProperty('--bg-brand', brand.color);
  target.style.setProperty('--bg-brand-hover', hover);
  target.style.setProperty('--bg-brand-disabled', disabled);
  target.style.setProperty('--bg-brand-popup', soft);
  target.style.setProperty('--bg-brand-overlay', soft);
  target.style.setProperty('--text-brand', brand.color);
  target.style.setProperty('--text-brand-hover', hover);
  target.style.setProperty('--icon-brand', brand.color);
  target.style.setProperty('--icon-brand-hover', hover);
  target.style.setProperty('--border-brand', brand.color);
  target.style.setProperty('--text-onbrand', onBrand);
  target.style.setProperty('--icon-onbrand', onBrand);
  target.style.setProperty('--color-primary', brand.color);
  target.style.setProperty('--color-primary-hover', hover);
  target.style.setProperty('--color-primary-disabled', disabled);
  target.style.setProperty('--color-primary-soft', soft);
  target.style.setProperty('--color-accent', brand.color);
  target.style.setProperty('--color-on-primary', onBrand);
}

function _positionBrandPicker(panel, trigger) {
  const rect = trigger.getBoundingClientRect();
  const panelWidth = Math.min(280, window.innerWidth - 16);
  const top = Math.min(rect.bottom + 8, window.innerHeight - 16);
  const left = Math.max(8, Math.min(rect.right - panelWidth, window.innerWidth - panelWidth - 8));
  panel.style.width = `${panelWidth}px`;
  panel.style.top = `${top}px`;
  panel.style.left = `${left}px`;
}

function _normalizeHex(value) {
  const text = String(value || '').trim();
  const short = /^#?([0-9a-f]{3})$/i.exec(text);
  if (short) {
    return `#${short[1].split('').map(ch => ch + ch).join('')}`.toUpperCase();
  }
  const full = /^#?([0-9a-f]{6})$/i.exec(text);
  if (full) { return `#${full[1]}`.toUpperCase(); }
  throw new Error(`Invalid brand color "${value}". Use a preset id or hex color.`);
}

function _hexToRgb(hex) {
  const normalized = _normalizeHex(hex).slice(1);
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  };
}

function _hexToRgba(hex, alpha) {
  const rgb = _hexToRgb(hex);
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

function _mix(hex, target, amount) {
  const a = _hexToRgb(hex);
  const b = _hexToRgb(target);
  const mix = (from, to) => Math.round(from + (to - from) * amount);
  return `#${[mix(a.r, b.r), mix(a.g, b.g), mix(a.b, b.b)].map(v => v.toString(16).padStart(2, '0')).join('')}`.toUpperCase();
}

function _isDark(hex) {
  const { r, g, b } = _hexToRgb(hex);
  return (r * 0.299 + g * 0.587 + b * 0.114) < 150;
}

function _escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
