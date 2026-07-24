const customIcons = {};

function registerIcons(iconsMap) {
  Object.assign(customIcons, iconsMap);
}

function getIcon(name) {
  return customIcons[name];
}

function clearIcons() {
  Object.keys(customIcons).forEach(key => delete customIcons[key]);
}

export {
  registerIcons,
  getIcon,
  clearIcons
};