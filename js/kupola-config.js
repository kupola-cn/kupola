const config = {
  paths: {
    icons: '/icons/',
    base: '/'
  },
  theme: {
    default: 'dark',
    brand: 'zengqing'
  },
  i18n: {
    locale: 'zh-CN',
    fallbackLocale: 'en-US'
  },
  http: {
    baseURL: '',
    timeout: 10000
  },
  components: {
    autoInit: true,
    silentErrors: false
  },
  store: {
    persist: true,
    prefix: 'kupola-'
  },
  events: {
    global: true
  }
};

export function setConfig(options) {
  mergeDeep(config, options);
}

export function getConfig(key) {
  if (!key) return config;
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