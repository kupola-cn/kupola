const config = {
  paths: {
    icons: '/icons/',
    base: '/',
  },
  theme: {
    default: 'dark',
    brand: 'zengqing',
  },
  i18n: {
    locale: 'zh-CN',
    fallbackLocale: 'en-US',
  },
  http: {
    baseURL: '',
    timeout: 10000,
    headers: {},
    withCredentials: false,
  },
  zIndex: {
    modal: 1000,
    dropdown: 2000,
    tooltip: 2100,
    popover: 2200,
    datepicker: 2300,
    message: 3000,
    notification: 3100,
    loading: 5000,
  },
  ui: {
    defaultSize: 'md',
    modal: {
      backdropClick: true,
    },
    dropdown: {
      closeOnClick: true,
    },
    datepicker: {
      weekStart: 1,
    },
    tooltip: {
      delay: 300,
    },
  },
  performance: {
    lazyLoad: false,
    debounceDelay: 200,
    throttleDelay: 100,
    animationEnabled: true,
  },
  security: {
    xssProtection: true,
    sanitizeHtml: {
      enabled: true,
      allowedTags: [ 'b', 'i', 'u', 'em', 'strong', 'a', 'br', 'p', 'span', 'div', 'img' ],
      allowedAttributes: {
        'a': [ 'href', 'target', 'rel' ],
        'img': [ 'src', 'alt', 'width', 'height' ],
        'span': [ 'class', 'style' ],
        'div': [ 'class', 'style' ],
      },
    },
    maskData: {
      enabled: true,
      patterns: {
        phone: { regex: '^(\\d{3})\\d{4}(\\d{4})$', replace: '$1****$2' },
        email: { regex: '^(.)(.*)(@.*)$', replace: '$1***$3' },
        idCard: { regex: '^(\\d{6})\\d{8}(\\d{4})$', replace: '$1********$2' },
        bankCard: { regex: '^(\\d{4})\\d{8}(\\d{4})$', replace: '$1 **** **** $2' },
      },
    },
    secureId: {
      length: 16,
      charset: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
    },
  },
  message: {
    duration: 3000,
    position: 'top-right',
    maxCount: 5,
  },
  notification: {
    duration: 4500,
    position: 'top-right',
  },
  validation: {
    defaultRules: [],
    showErrors: true,
    trigger: 'blur',
  },
  components: {
    autoInit: true,
    silentErrors: false,
  },
};

const configChangeListeners = [];

function loadConfigFromGlobal() {
  if (typeof window !== 'undefined' && window.kupolaConfig) {
    try {
      mergeDeep(config, window.kupolaConfig);
      notifyConfigChange();
    } catch (e) {
      console.warn('[Kupola] Failed to parse window.kupolaConfig:', e);
    }
  }
}

function notifyConfigChange() {
  configChangeListeners.forEach(listener => {
    try {
      listener(config);
    } catch (e) {
      console.warn('[Kupola] Error in config change listener:', e);
    }
  });
}

export function onConfigChange(listener) {
  if (typeof listener === 'function') {
    configChangeListeners.push(listener);
  }
}

export function offConfigChange(listener) {
  const index = configChangeListeners.indexOf(listener);
  if (index > -1) {
    configChangeListeners.splice(index, 1);
  }
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadConfigFromGlobal);
  } else {
    loadConfigFromGlobal();
  }
}

export function setConfig(options) {
  mergeDeep(config, options);
  notifyConfigChange();
}

export function getConfig(key) {
  if (!key) {return config;}
  return getNestedValue(config, key);
}

export function getIconsPath() {
  return config.paths.base + config.paths.icons.replace(/^\//, '');
}

export function getBasePath() {
  return config.paths.base;
}

export function getDefaultTheme() {
  return config.theme.default;
}

export function getDefaultBrand() {
  return config.theme.brand;
}

export function getHttpConfig() {
  return config.http;
}

export function getUiConfig() {
  return config.ui;
}

export function getZIndexConfig() {
  return config.zIndex;
}

export function getSecurityConfig() {
  return config.security;
}

export function getPerformanceConfig() {
  return config.performance;
}

export function getMessageConfig() {
  return config.message;
}

export function getNotificationConfig() {
  return config.notification;
}

export function getValidationConfig() {
  return config.validation;
}

function mergeDeep(target, source) {
  for (const key in source) {
    if (source[key] instanceof Object && key in target && target[key] instanceof Object) {
      mergeDeep(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

function getNestedValue(obj, key) {
  return key.split('.').reduce((o, k) => (o && o[k]) !== undefined ? o[k] : undefined, obj);
}
