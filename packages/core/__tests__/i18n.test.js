import {
  setLocale, getLocale, t, addMessages, getMessages, getSupportedLocales,
  formatDate, formatNumber, formatCurrency, formatRelativeTime,
  isRTL, getDirection, onLocaleChange, localeSignal,
} from '../src/i18n.js';

describe('i18n', () => {
  beforeEach(() => {
    setLocale('en-US');
  });

  describe('setLocale / getLocale', () => {
    test('should set and get locale', () => {
      setLocale('zh-CN');
      expect(getLocale()).toBe('zh-CN');
    });

    test('should persist locale to localStorage', () => {
      setLocale('zh-CN');
      expect(localStorage.getItem('kupola-locale')).toBe('zh-CN');
    });
  });

  describe('t() translation', () => {
    test('should return English translation by default', () => {
      expect(t('modal.close')).toBe('Close');
      expect(t('dialog.ok')).toBe('OK');
    });

    test('should return Chinese translation when locale is zh-CN', () => {
      setLocale('zh-CN');
      expect(t('modal.close')).toBe('关闭');
      expect(t('dialog.ok')).toBe('确定');
    });

    test('should interpolate parameters', () => {
      expect(t('form.min', { min: 10 })).toBe('Minimum value is 10');
      setLocale('zh-CN');
      expect(t('form.min', { min: 10 })).toBe('最小值为 10');
    });

    test('should return key if translation not found', () => {
      expect(t('non.existent.key')).toBe('non.existent.key');
    });
  });

  describe('addMessages / getMessages', () => {
    test('should add new language messages', () => {
      addMessages('ja-JP', { 'modal.close': '閉じる' });
      expect(getSupportedLocales()).toContain('ja-JP');
      expect(getMessages('ja-JP')['modal.close']).toBe('閉じる');
    });

    test('should merge messages for existing language', () => {
      addMessages('en-US', { 'custom.key': 'Custom Value' });
      expect(t('custom.key')).toBe('Custom Value');
      expect(t('modal.close')).toBe('Close');
    });
  });

  describe('getSupportedLocales', () => {
    test('should return built-in locales', () => {
      const locales = getSupportedLocales();
      expect(locales).toContain('en-US');
      expect(locales).toContain('zh-CN');
    });
  });

  describe('formatDate', () => {
    test('should format date in English', () => {
      const date = new Date(2024, 5, 15);
      const result = formatDate(date, { year: 'numeric', month: 'long', day: 'numeric' });
      expect(result).toBe('June 15, 2024');
    });

    test('should format date in Chinese', () => {
      setLocale('zh-CN');
      const date = new Date(2024, 5, 15);
      const result = formatDate(date, { year: 'numeric', month: 'long', day: 'numeric' });
      expect(result).toBe('2024年6月15日');
    });
  });

  describe('formatNumber', () => {
    test('should format number in English', () => {
      expect(formatNumber(1234567.89)).toBe('1,234,567.89');
    });

    test('should format number in Chinese', () => {
      setLocale('zh-CN');
      expect(formatNumber(1234567.89)).toBe('1,234,567.89');
    });
  });

  describe('formatCurrency', () => {
    test('should format currency in English', () => {
      expect(formatCurrency(1234.56, 'USD')).toBe('$1,234.56');
    });

    test('should format currency in Chinese', () => {
      setLocale('zh-CN');
      expect(formatCurrency(1234.56, 'CNY')).toBe('¥1,234.56');
    });
  });

  describe('formatRelativeTime', () => {
    test('should format relative time in English', () => {
      expect(formatRelativeTime(-1, 'day')).toBe('1 day ago');
      expect(formatRelativeTime(1, 'month')).toBe('in 1 month');
    });

    test('should format relative time in Chinese', () => {
      setLocale('zh-CN');
      expect(formatRelativeTime(-1, 'day')).toBe('1天前');
      expect(formatRelativeTime(1, 'month')).toBe('1个月后');
    });
  });

  describe('isRTL / getDirection', () => {
    test('should return false for English', () => {
      expect(isRTL('en-US')).toBe(false);
      expect(getDirection('en-US')).toBe('ltr');
    });

    test('should return false for Chinese', () => {
      expect(isRTL('zh-CN')).toBe(false);
      expect(getDirection('zh-CN')).toBe('ltr');
    });

    test('should return true for Arabic', () => {
      expect(isRTL('ar')).toBe(true);
      expect(getDirection('ar')).toBe('rtl');
    });

    test('should return true for Hebrew', () => {
      expect(isRTL('he-IL')).toBe(true);
      expect(getDirection('he-IL')).toBe('rtl');
    });
  });

  describe('onLocaleChange', () => {
    test('should call callback when locale changes', () => {
      const callback = jest.fn();
      const unsubscribe = onLocaleChange(callback);

      setLocale('zh-CN');
      expect(callback).toHaveBeenCalledWith('zh-CN', 'en-US');

      setLocale('ja-JP');
      expect(callback).toHaveBeenCalledWith('ja-JP', 'zh-CN');

      unsubscribe();

      setLocale('en-US');
      expect(callback).toHaveBeenCalledTimes(2);
    });
  });

  describe('localeSignal', () => {
    test('should be a signal that updates when locale changes', () => {
      expect(localeSignal.value).toBe('en-US');
      setLocale('zh-CN');
      expect(localeSignal.value).toBe('zh-CN');
    });
  });
});