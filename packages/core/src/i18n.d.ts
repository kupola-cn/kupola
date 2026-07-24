export interface Messages {
  [key: string]: string;
}

export interface FormatDateOptions {
  weekday?: 'narrow' | 'short' | 'long';
  era?: 'narrow' | 'short' | 'long';
  year?: 'numeric' | '2-digit';
  month?: 'numeric' | '2-digit' | 'narrow' | 'short' | 'long';
  day?: 'numeric' | '2-digit';
  hour?: 'numeric' | '2-digit';
  minute?: 'numeric' | '2-digit';
  second?: 'numeric' | '2-digit';
  timeZoneName?: 'short' | 'long';
  formatMatcher?: 'basic' | 'best fit';
  timeZone?: string;
  localeMatcher?: 'lookup' | 'best fit';
}

export interface FormatNumberOptions {
  localeMatcher?: 'lookup' | 'best fit';
  style?: 'decimal' | 'currency' | 'percent';
  currency?: string;
  currencyDisplay?: 'symbol' | 'code' | 'name';
  useGrouping?: boolean;
  minimumIntegerDigits?: number;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  minimumSignificantDigits?: number;
  maximumSignificantDigits?: number;
}

export interface FormatRelativeTimeOptions {
  localeMatcher?: 'lookup' | 'best fit';
  numeric?: 'always' | 'auto';
  style?: 'long' | 'short' | 'narrow';
}

export type RelativeTimeUnit = 'year' | 'quarter' | 'month' | 'week' | 'day' | 'hour' | 'minute' | 'second';

export function setLocale(locale: string): void;
export function getLocale(): string;
export function t(key: string, params?: Record<string, unknown>): string;
export function addMessages(locale: string, messages: Messages): void;
export function getMessages(locale: string): Messages;
export function getSupportedLocales(): string[];
export function formatDate(date: Date | number, options?: FormatDateOptions): string;
export function formatNumber(num: number, options?: FormatNumberOptions): string;
export function formatCurrency(num: number, currency?: string, options?: Omit<FormatNumberOptions, 'style'>): string;
export function formatRelativeTime(value: number, unit: RelativeTimeUnit, options?: FormatRelativeTimeOptions): string;
export function isRTL(locale?: string): boolean;
export function getDirection(locale?: string): 'ltr' | 'rtl';
export function onLocaleChange(callback: (newLocale: string, oldLocale: string) => void): () => void;

export const localeSignal: import('./signal.js').Signal<string>;