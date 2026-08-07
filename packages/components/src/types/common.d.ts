// ============================================================
// Common Types
// ============================================================

export type Destroyable = {
  element: HTMLElement;
  destroy(): void;
};

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
export function onThemeChange(callback: (theme: KupolaTheme) => void): () => void;
export function getBrandColors(): BrandColor[];
export function resolveBrandColor(value: string | Partial<BrandColor> & { color: string }): BrandColor;
export function getPreferredBrandColor(): BrandColor;
export function setBrandColor(value: string | Partial<BrandColor> & { color: string }, options?: { persist?: boolean; target?: HTMLElement }): BrandColor;
export function resetBrandColor(): BrandColor;
export function onBrandColorChange(callback: (brand: BrandColor) => void): () => void;
export function attachBrandColorPicker(trigger: HTMLElement, options?: { colors?: BrandColor[]; title?: string; custom?: boolean }): BrandColorPickerInstance;
export function getThemeInlineScript(): string;

