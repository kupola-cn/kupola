export function setLocale(locale: string): void;
export function getLocale(): string;
export function t(key: string, params?: Record<string, string | number>): string;
export function addMessages(locale: string, messages: Record<string, string>): void;
