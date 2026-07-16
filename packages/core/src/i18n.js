// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Simple i18n support for component texts.
 *
 * @module i18n
 */

const _messages = {
  'en-US': {
    'modal.close': 'Close',
    'dialog.ok': 'OK',
    'dialog.cancel': 'Cancel',
    'table.empty': 'No data',
    'pagination.page': 'Page',
    'pagination.of': 'of',
    'select.placeholder': 'Select...',
    'datepicker.placeholder': 'Select date',
    'timepicker.placeholder': 'Select time',
    'fileupload.drag': 'Drag files here or',
    'fileupload.browse': 'Browse',
    'empty.text': 'No data',
    'datepicker.months': 'Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec',
    'datepicker.weekdays': 'Mo,Tu,We,Th,Fr,Sa,Su',
    'timepicker.placeholder': 'Select time',
  },
  'zh-CN': {
    'modal.close': '关闭',
    'dialog.ok': '确定',
    'dialog.cancel': '取消',
    'table.empty': '暂无数据',
    'pagination.page': '页',
    'pagination.of': '/',
    'select.placeholder': '请选择',
    'datepicker.placeholder': '选择日期',
    'datepicker.months': '1月,2月,3月,4月,5月,6月,7月,8月,9月,10月,11月,12月',
    'datepicker.weekdays': '一,二,三,四,五,六,日',
    'timepicker.placeholder': '选择时间',
    'fileupload.drag': '拖拽文件到此处或',
    'fileupload.browse': '浏览',
    'empty.text': '暂无数据',
  },
};

let _currentLocale = 'en-US';

/**
 * Set the current locale.
 * @param {string} locale - Locale code (e.g., 'en-US', 'zh-CN')
 */
export function setLocale(locale) {
  _currentLocale = locale;
}

/**
 * Get the current locale.
 * @returns {string} Current locale code
 */
export function getLocale() {
  return _currentLocale;
}

/**
 * Get a translated message by key.
 * @param {string} key - Message key (e.g., 'modal.close')
 * @param {Object} [params] - Optional interpolation parameters
 * @returns {string} Translated message
 */
export function t(key, params = {}) {
  const messages = _messages[_currentLocale] || _messages['en-US'];
  let text = messages[key] || key;
  
  // Simple interpolation: t('greeting', { name: 'Alice' })
  // where message is "Hello, {name}"
  for (const [k, v] of Object.entries(params)) {
    text = text.replace(`{${k}}`, v);
  }
  
  return text;
}

/**
 * Add custom messages for a locale.
 * @param {string} locale - Locale code
 * @param {Object} messages - Key-value pairs
 */
export function addMessages(locale, messages) {
  if (!_messages[locale]) {
    _messages[locale] = {};
  }
  Object.assign(_messages[locale], messages);
}
