// ============================================================
// Utility Modules
// ============================================================

// Icons
export interface IconGroup {
  [name: string]: string;
}
export const Icons: {
  svg(name: string, size?: number | string, viewBox?: string): string;
  render(root: HTMLElement): void;
};
export function svg(name: string, size?: number | string, viewBox?: string): string;
export function render(root: HTMLElement): void;
export function registerIcons(icons: Record<string, string>, group?: string): void;
export function registerGroup(name: string, icons: Record<string, string>): void;
export function registerAllGroups(groups: Record<string, Record<string, string>>): void;
export const PATHS: Record<string, string>;
export const iconGroups: Record<string, Record<string, string>>;

