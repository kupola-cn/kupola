class KupolaI18n {
  constructor(options = {}) {
    this.locales = options.locales || {};
    this.currentLocale = options.defaultLocale || 'zh-CN';
    this.fallbackLocale = options.fallbackLocale || 'zh-CN';
    this.delimiter = options.delimiter || '.';
    this.missingHandler = options.missingHandler || ((key) => {
      console.warn(`Missing translation: ${key}`);
      return key;
    });
    
    this._initFromDOM();
  }

  _initFromDOM() {
    const scriptTags = document.querySelectorAll('script[type="application/json"][data-kupola-i18n]');
    scriptTags.forEach(script => {
      const locale = script.dataset.kupolaI18n;
      if (locale) {
        try {
          const data = JSON.parse(script.textContent);
          this.addLocale(locale, data);
        } catch (e) {
          console.error('Failed to parse i18n data:', e);
        }
      }
    });

    const htmlLang = document.documentElement.lang;
    if (htmlLang && this.locales[htmlLang]) {
      this.currentLocale = htmlLang;
    }
  }

  addLocale(locale, data) {
    if (!this.locales[locale]) {
      this.locales[locale] = {};
    }
    this._mergeDeep(this.locales[locale], data);
  }

  _mergeDeep(target, source) {
    for (const key of Object.keys(source)) {
      if (source[key] instanceof Object && key in target) {
        this._mergeDeep(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
  }

  setLocale(locale) {
    if (this.locales[locale]) {
      this.currentLocale = locale;
      document.documentElement.lang = locale;
      this._emitChange();
      return true;
    }
    return false;
  }

  getLocale() {
    return this.currentLocale;
  }

  t(key, params = {}) {
    let value = this._getTranslation(key, this.currentLocale);
    
    if (!value) {
      value = this._getTranslation(key, this.fallbackLocale);
    }
    
    if (!value) {
      return this.missingHandler(key);
    }
    
    return this._interpolate(value, params);
  }

  _getTranslation(key, locale) {
    if (!this.locales[locale]) return null;
    
    const keys = key.split(this.delimiter);
    let value = this.locales[locale];
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return null;
      }
    }
    
    return typeof value === 'string' ? value : null;
  }

  _interpolate(str, params) {
    return str.replace(/\{(\w+)\}/g, (match, key) => {
      return params[key] !== undefined ? params[key] : match;
    });
  }

  n(key, count, params = {}) {
    const value = this.t(key, { ...params, count });
    
    if (!value) return value;
    
    const parts = value.split('|');
    
    if (parts.length === 1) {
      return value.replace('{count}', count);
    }
    
    if (parts.length === 2) {
      return count === 1 ? parts[0] : parts[1];
    }
    
    if (parts.length >= 3) {
      if (count === 0) return parts[0];
      if (count === 1) return parts[1];
      return parts[2];
    }
    
    return value;
  }

  _emitChange() {
    const event = new CustomEvent('kupola:i18n:change', {
      detail: { locale: this.currentLocale },
      bubbles: true
    });
    document.dispatchEvent(event);
  }

  async loadLocale(locale, url) {
    try {
      const response = await fetch(url);
      const data = await response.json();
      this.addLocale(locale, data);
      return true;
    } catch (error) {
      console.error('Failed to load locale:', error);
      return false;
    }
  }

  getAvailableLocales() {
    return Object.keys(this.locales);
  }

  hasLocale(locale) {
    return !!this.locales[locale];
  }

  formatDate(date, options = {}) {
    const locale = options.locale || this.currentLocale;
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    return new Intl.DateTimeFormat(locale, options).format(dateObj);
  }

  formatNumber(number, options = {}) {
    const locale = options.locale || this.currentLocale;
    
    return new Intl.NumberFormat(locale, options).format(number);
  }

  formatCurrency(number, currency, options = {}) {
    const locale = options.locale || this.currentLocale;
    
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      ...options
    }).format(number);
  }

  formatRelativeTime(value, unit, options = {}) {
    const locale = options.locale || this.currentLocale;
    
    return new Intl.RelativeTimeFormat(locale, options).format(value, unit);
  }
}

const kupolaI18n = new KupolaI18n();

function createI18n(options) {
  return new KupolaI18n(options);
}

function t(key, params = {}) {
  return kupolaI18n.t(key, params);
}

function n(key, count, params = {}) {
  return kupolaI18n.n(key, count, params);
}

function setLocale(locale) {
  return kupolaI18n.setLocale(locale);
}

function getLocale() {
  return kupolaI18n.getLocale();
}

function formatDate(date, options = {}) {
  return kupolaI18n.formatDate(date, options);
}

function formatNumber(number, options = {}) {
  return kupolaI18n.formatNumber(number, options);
}

function formatCurrency(number, currency, options = {}) {
  return kupolaI18n.formatCurrency(number, currency, options);
}

export { 
  KupolaI18n, kupolaI18n, createI18n, 
  t, n, setLocale, getLocale,
  formatDate, formatNumber, formatCurrency 
};