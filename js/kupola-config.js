const config = {
  iconsPath: '/icons/'
};

export function setConfig(options) {
  Object.assign(config, options);
}

export function getConfig(key) {
  return config[key];
}

export function getIconsPath() {
  return config.iconsPath;
}