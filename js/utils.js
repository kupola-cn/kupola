const KupolaUtils = {
  string: {
    trim(str) {
      return str ? str.trim() : '';
    },
    trimLeft(str) {
      return str ? str.replace(/^\s+/, '') : '';
    },
    trimRight(str) {
      return str ? str.replace(/\s+$/, '') : '';
    },
    toUpperCase(str) {
      return str ? str.toUpperCase() : '';
    },
    toLowerCase(str) {
      return str ? str.toLowerCase() : '';
    },
    capitalize(str) {
      if (!str) return '';
      return str.charAt(0).toUpperCase() + str.slice(1);
    },
    camelize(str) {
      if (!str) return '';
      return str.replace(/-(\w)/g, (_, c) => c ? c.toUpperCase() : '');
    },
    hyphenate(str) {
      if (!str) return '';
      return str.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '');
    },
    padStart(str, length, padChar = ' ') {
      return (String(str) || '').padStart(length, padChar);
    },
    padEnd(str, length, padChar = ' ') {
      return (String(str) || '').padEnd(length, padChar);
    },
    truncate(str, maxLength, suffix = '...') {
      if (!str || str.length <= maxLength) return str || '';
      return str.slice(0, maxLength) + suffix;
    },
    replaceAll(str, search, replacement) {
      if (!str) return '';
      return str.split(search).join(replacement);
    },
    format(template, data) {
      if (!template) return '';
      return template.replace(/\{\{(\w+)\}\}/g, (_, key) => data[key] !== undefined ? data[key] : `{{${key}}}`);
    },
    startsWith(str, prefix) {
      return (str || '').startsWith(prefix);
    },
    endsWith(str, suffix) {
      return (str || '').endsWith(suffix);
    },
    includes(str, search) {
      return (str || '').includes(search);
    },
    repeat(str, times) {
      return (str || '').repeat(times);
    },
    reverse(str) {
      return (str || '').split('').reverse().join('');
    },
    countOccurrences(str, search) {
      if (!str || !search) return 0;
      return str.split(search).length - 1;
    },
    escapeHtml(str) {
      if (!str) return '';
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    },
    unescapeHtml(str) {
      if (!str) return '';
      const div = document.createElement('div');
      div.innerHTML = str;
      return div.textContent;
    },
    generateRandom(length = 8) {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let result = '';
      for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    },
    generateUUID() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }
  },

  array: {
    isArray(arr) {
      return Array.isArray(arr);
    },
    isEmpty(arr) {
      return !arr || arr.length === 0;
    },
    size(arr) {
      return arr ? arr.length : 0;
    },
    first(arr, defaultValue) {
      return arr && arr.length > 0 ? arr[0] : defaultValue;
    },
    last(arr, defaultValue) {
      return arr && arr.length > 0 ? arr[arr.length - 1] : defaultValue;
    },
    get(arr, index, defaultValue) {
      return arr && arr[index] !== undefined ? arr[index] : defaultValue;
    },
    slice(arr, start, end) {
      return arr ? arr.slice(start, end) : [];
    },
    concat(...args) {
      return args.reduce((result, arg) => result.concat(arg || []), []);
    },
    join(arr, separator = ',') {
      return arr ? arr.join(separator) : '';
    },
    indexOf(arr, item, fromIndex = 0) {
      return arr ? arr.indexOf(item, fromIndex) : -1;
    },
    lastIndexOf(arr, item, fromIndex) {
      return arr ? arr.lastIndexOf(item, fromIndex) : -1;
    },
    includes(arr, item) {
      return arr ? arr.includes(item) : false;
    },
    push(arr, ...items) {
      if (arr) arr.push(...items);
      return arr;
    },
    pop(arr) {
      return arr ? arr.pop() : undefined;
    },
    shift(arr) {
      return arr ? arr.shift() : undefined;
    },
    unshift(arr, ...items) {
      if (arr) arr.unshift(...items);
      return arr;
    },
    remove(arr, item) {
      if (!arr) return arr;
      const index = arr.indexOf(item);
      if (index > -1) arr.splice(index, 1);
      return arr;
    },
    removeAt(arr, index) {
      if (!arr || index < 0 || index >= arr.length) return arr;
      arr.splice(index, 1);
      return arr;
    },
    insert(arr, index, item) {
      if (!arr) return arr;
      arr.splice(index, 0, item);
      return arr;
    },
    reverse(arr) {
      return arr ? arr.slice().reverse() : [];
    },
    sort(arr, compareFn) {
      return arr ? arr.slice().sort(compareFn) : [];
    },
    sortBy(arr, key, order = 'asc') {
      if (!arr) return [];
      return arr.slice().sort((a, b) => {
        const valA = typeof a === 'object' ? a[key] : a;
        const valB = typeof b === 'object' ? b[key] : b;
        if (valA < valB) return order === 'asc' ? -1 : 1;
        if (valA > valB) return order === 'asc' ? 1 : -1;
        return 0;
      });
    },
    filter(arr, predicate) {
      return arr ? arr.filter(predicate) : [];
    },
    map(arr, fn) {
      return arr ? arr.map(fn) : [];
    },
    reduce(arr, fn, initialValue) {
      return arr ? arr.reduce(fn, initialValue) : initialValue;
    },
    forEach(arr, fn) {
      if (arr) arr.forEach(fn);
    },
    every(arr, predicate) {
      return arr ? arr.every(predicate) : true;
    },
    some(arr, predicate) {
      return arr ? arr.some(predicate) : false;
    },
    find(arr, predicate) {
      return arr ? arr.find(predicate) : undefined;
    },
    findIndex(arr, predicate) {
      return arr ? arr.findIndex(predicate) : -1;
    },
    flat(arr, depth = 1) {
      return arr ? arr.flat(depth) : [];
    },
    flattenDeep(arr) {
      return arr ? arr.reduce((acc, item) => 
        Array.isArray(item) ? acc.concat(this.flattenDeep(item)) : acc.concat(item), []) : [];
    },
    unique(arr) {
      return arr ? [...new Set(arr)] : [];
    },
    uniqueBy(arr, key) {
      if (!arr) return [];
      const seen = new Set();
      return arr.filter(item => {
        const value = typeof item === 'object' ? item[key] : item;
        if (seen.has(value)) return false;
        seen.add(value);
        return true;
      });
    },
    chunk(arr, size) {
      if (!arr || size <= 0) return [];
      const chunks = [];
      for (let i = 0; i < arr.length; i += size) {
        chunks.push(arr.slice(i, i + size));
      }
      return chunks;
    },
    shuffle(arr) {
      if (!arr) return [];
      const result = arr.slice();
      for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
      }
      return result;
    },
    sum(arr) {
      return arr ? arr.reduce((acc, val) => acc + (Number(val) || 0), 0) : 0;
    },
    average(arr) {
      if (!arr || arr.length === 0) return 0;
      return this.sum(arr) / arr.length;
    },
    max(arr) {
      return arr && arr.length > 0 ? Math.max(...arr) : -Infinity;
    },
    min(arr) {
      return arr && arr.length > 0 ? Math.min(...arr) : Infinity;
    },
    intersection(...args) {
      if (args.length === 0) return [];
      return args.reduce((result, arr) => 
        result.filter(item => arr && arr.includes(item)));
    },
    union(...args) {
      return [...new Set(args.flat().filter(Boolean))];
    },
    difference(arr1, arr2) {
      return arr1 ? arr1.filter(item => !arr2 || !arr2.includes(item)) : [];
    },
    zip(...args) {
      if (args.length === 0) return [];
      const maxLength = Math.max(...args.map(arr => arr ? arr.length : 0));
      return Array.from({ length: maxLength }, (_, i) => 
        args.map(arr => arr && arr[i]));
    }
  },

  object: {
    isObject(obj) {
      return obj !== null && typeof obj === 'object' && !Array.isArray(obj);
    },
    isEmpty(obj) {
      if (!obj || typeof obj !== 'object') return true;
      return Object.keys(obj).length === 0;
    },
    keys(obj) {
      return obj ? Object.keys(obj) : [];
    },
    values(obj) {
      return obj ? Object.values(obj) : [];
    },
    entries(obj) {
      return obj ? Object.entries(obj) : [];
    },
    has(obj, key) {
      return obj ? Object.prototype.hasOwnProperty.call(obj, key) : false;
    },
    get(obj, path, defaultValue) {
      if (!obj) return defaultValue;
      const keys = path.split('.');
      return keys.reduce((current, key) => current && current[key], obj) || defaultValue;
    },
    set(obj, path, value) {
      if (!obj || typeof obj !== 'object') return obj;
      const keys = path.split('.');
      const lastKey = keys.pop();
      let current = obj;
      keys.forEach(key => {
        if (!current[key]) current[key] = {};
        current = current[key];
      });
      current[lastKey] = value;
      return obj;
    },
    pick(obj, keys) {
      if (!obj) return {};
      return keys.reduce((result, key) => {
        if (obj[key] !== undefined) result[key] = obj[key];
        return result;
      }, {});
    },
    omit(obj, keys) {
      if (!obj) return {};
      return Object.keys(obj).reduce((result, key) => {
        if (!keys.includes(key)) result[key] = obj[key];
        return result;
      }, {});
    },
    merge(...args) {
      return args.reduce((result, obj) => {
        if (obj && typeof obj === 'object') {
          Object.keys(obj).forEach(key => {
            if (this.isObject(obj[key]) && this.isObject(result[key])) {
              result[key] = this.merge(result[key], obj[key]);
            } else {
              result[key] = obj[key];
            }
          });
        }
        return result;
      }, {});
    },
    clone(obj) {
      return obj ? JSON.parse(JSON.stringify(obj)) : obj;
    },
    deepClone(obj, hash = new WeakMap()) {
      if (!obj || typeof obj !== 'object') return obj;
      if (hash.has(obj)) return hash.get(obj);
      if (obj instanceof Date) return new Date(obj);
      if (obj instanceof RegExp) return new RegExp(obj);
      if (obj instanceof Map) {
        const map = new Map();
        hash.set(obj, map);
        obj.forEach((val, key) => map.set(key, this.deepClone(val, hash)));
        return map;
      }
      if (obj instanceof Set) {
        const set = new Set();
        hash.set(obj, set);
        obj.forEach(val => set.add(this.deepClone(val, hash)));
        return set;
      }
      if (Array.isArray(obj)) {
        const arr = [];
        hash.set(obj, arr);
        obj.forEach(item => arr.push(this.deepClone(item, hash)));
        return arr;
      }
      const clone = {};
      hash.set(obj, clone);
      Object.keys(obj).forEach(key => {
        clone[key] = this.deepClone(obj[key], hash);
      });
      return clone;
    },
    forEach(obj, fn) {
      if (!obj) return;
      Object.keys(obj).forEach(key => fn(obj[key], key, obj));
    },
    map(obj, fn) {
      if (!obj) return {};
      const result = {};
      Object.keys(obj).forEach(key => {
        result[key] = fn(obj[key], key, obj);
      });
      return result;
    },
    filter(obj, fn) {
      if (!obj) return {};
      const result = {};
      Object.keys(obj).forEach(key => {
        if (fn(obj[key], key, obj)) result[key] = obj[key];
      });
      return result;
    },
    reduce(obj, fn, initialValue) {
      if (!obj) return initialValue;
      return Object.keys(obj).reduce((acc, key) => 
        fn(acc, obj[key], key, obj), initialValue);
    },
    toArray(obj) {
      if (!obj) return [];
      return Object.keys(obj).map(key => ({ key, value: obj[key] }));
    },
    fromArray(arr, keyField, valueField) {
      if (!arr) return {};
      return arr.reduce((result, item) => {
        const key = typeof item === 'object' ? item[keyField] : item;
        const value = valueField ? item[valueField] : item;
        if (key !== undefined) result[key] = value;
        return result;
      }, {});
    },
    size(obj) {
      return obj ? Object.keys(obj).length : 0;
    },
    invert(obj) {
      if (!obj) return {};
      const result = {};
      Object.keys(obj).forEach(key => {
        result[obj[key]] = key;
      });
      return result;
    },
    isEqual(obj1, obj2) {
      if (obj1 === obj2) return true;
      if (!obj1 || !obj2 || typeof obj1 !== 'object' || typeof obj2 !== 'object') return false;
      const keys1 = Object.keys(obj1);
      const keys2 = Object.keys(obj2);
      if (keys1.length !== keys2.length) return false;
      return keys1.every(key => this.isEqual(obj1[key], obj2[key]));
    },
    freeze(obj) {
      if (!obj) return obj;
      Object.freeze(obj);
      Object.keys(obj).forEach(key => {
        if (typeof obj[key] === 'object') this.freeze(obj[key]);
      });
      return obj;
    },
    seal(obj) {
      return obj ? Object.seal(obj) : obj;
    }
  },

  number: {
    isNumber(val) {
      return typeof val === 'number' && !isNaN(val);
    },
    isInteger(val) {
      return Number.isInteger(val);
    },
    isFloat(val) {
      return this.isNumber(val) && !Number.isInteger(val);
    },
    isPositive(val) {
      return this.isNumber(val) && val > 0;
    },
    isNegative(val) {
      return this.isNumber(val) && val < 0;
    },
    isZero(val) {
      return this.isNumber(val) && val === 0;
    },
    clamp(val, min, max) {
      if (!this.isNumber(val)) return val;
      return Math.min(Math.max(val, min), max);
    },
    round(val, precision = 0) {
      if (!this.isNumber(val)) return val;
      const factor = Math.pow(10, precision);
      return Math.round(val * factor) / factor;
    },
    floor(val) {
      return this.isNumber(val) ? Math.floor(val) : val;
    },
    ceil(val) {
      return this.isNumber(val) ? Math.ceil(val) : val;
    },
    abs(val) {
      return this.isNumber(val) ? Math.abs(val) : val;
    },
    min(...args) {
      const nums = args.filter(this.isNumber);
      return nums.length > 0 ? Math.min(...nums) : undefined;
    },
    max(...args) {
      const nums = args.filter(this.isNumber);
      return nums.length > 0 ? Math.max(...nums) : undefined;
    },
    sum(...args) {
      const nums = args.flat().filter(this.isNumber);
      return nums.reduce((acc, val) => acc + val, 0);
    },
    average(...args) {
      const nums = args.flat().filter(this.isNumber);
      return nums.length > 0 ? this.sum(nums) / nums.length : 0;
    },
    random(min = 0, max = 1) {
      return Math.random() * (max - min) + min;
    },
    randomInt(min, max) {
      return Math.floor(this.random(min, max + 1));
    },
    format(val, decimals = 2) {
      if (!this.isNumber(val)) return String(val);
      return val.toFixed(decimals);
    },
    formatCurrency(val, currency = 'CNY', decimals = 2) {
      if (!this.isNumber(val)) return String(val);
      const formatter = new Intl.NumberFormat('zh-CN', {
        style: 'currency',
        currency,
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      });
      return formatter.format(val);
    },
    formatPercent(val, decimals = 0) {
      if (!this.isNumber(val)) return String(val);
      return `${(val * 100).toFixed(decimals)}%`;
    },
    toFixed(val, decimals = 0) {
      if (!this.isNumber(val)) return String(val);
      return val.toFixed(decimals);
    },
    toPrecision(val, precision = 6) {
      if (!this.isNumber(val)) return String(val);
      return val.toPrecision(precision);
    },
    isNaN(val) {
      return Number.isNaN(val);
    },
    isFinite(val) {
      return Number.isFinite(val);
    },
    parseInt(val, radix = 10) {
      return Number.parseInt(val, radix);
    },
    parseFloat(val) {
      return Number.parseFloat(val);
    },
    toNumber(val, defaultValue = 0) {
      const num = Number(val);
      return isNaN(num) ? defaultValue : num;
    },
    safeDivide(a, b, defaultValue = 0) {
      if (!this.isNumber(a) || !this.isNumber(b) || b === 0) return defaultValue;
      return a / b;
    },
    safeMultiply(...args) {
      return args.reduce((result, val) => {
        if (!this.isNumber(result) || !this.isNumber(val)) return 0;
        return result * val;
      }, 1);
    }
  },

  date: {
    now() {
      return Date.now();
    },
    today() {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      return now;
    },
    tomorrow() {
      const date = this.today();
      date.setDate(date.getDate() + 1);
      return date;
    },
    yesterday() {
      const date = this.today();
      date.setDate(date.getDate() - 1);
      return date;
    },
    isDate(val) {
      return val instanceof Date && !isNaN(val.getTime());
    },
    isValid(date) {
      return this.isDate(date);
    },
    parse(str) {
      const date = new Date(str);
      return this.isValid(date) ? date : null;
    },
    format(date, formatStr = 'YYYY-MM-DD HH:mm:ss') {
      if (!this.isDate(date)) return '';
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      const milliseconds = String(date.getMilliseconds()).padStart(3, '0');
      const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
      const weekDay = weekDays[date.getDay()];
      
      return formatStr
        .replace('YYYY', year)
        .replace('MM', month)
        .replace('DD', day)
        .replace('HH', hours)
        .replace('mm', minutes)
        .replace('ss', seconds)
        .replace('SSS', milliseconds)
        .replace('D', date.getDate())
        .replace('M', date.getMonth() + 1)
        .replace('H', date.getHours())
        .replace('m', date.getMinutes())
        .replace('s', date.getSeconds())
        .replace('W', weekDay);
    },
    toISO(date) {
      return this.isDate(date) ? date.toISOString() : '';
    },
    toUTC(date) {
      return this.isDate(date) ? new Date(date.toUTCString()) : null;
    },
    addDays(date, days) {
      if (!this.isDate(date)) return date;
      const newDate = new Date(date);
      newDate.setDate(newDate.getDate() + days);
      return newDate;
    },
    addHours(date, hours) {
      if (!this.isDate(date)) return date;
      const newDate = new Date(date);
      newDate.setHours(newDate.getHours() + hours);
      return newDate;
    },
    addMinutes(date, minutes) {
      if (!this.isDate(date)) return date;
      const newDate = new Date(date);
      newDate.setMinutes(newDate.getMinutes() + minutes);
      return newDate;
    },
    addSeconds(date, seconds) {
      if (!this.isDate(date)) return date;
      const newDate = new Date(date);
      newDate.setSeconds(newDate.getSeconds() + seconds);
      return newDate;
    },
    diffDays(date1, date2) {
      if (!this.isDate(date1) || !this.isDate(date2)) return 0;
      const d1 = this.today();
      const d2 = this.today();
      d1.setTime(date1.getTime());
      d2.setTime(date2.getTime());
      return Math.floor((d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24));
    },
    diffHours(date1, date2) {
      if (!this.isDate(date1) || !this.isDate(date2)) return 0;
      return Math.floor((date1.getTime() - date2.getTime()) / (1000 * 60 * 60));
    },
    diffMinutes(date1, date2) {
      if (!this.isDate(date1) || !this.isDate(date2)) return 0;
      return Math.floor((date1.getTime() - date2.getTime()) / (1000 * 60));
    },
    diffSeconds(date1, date2) {
      if (!this.isDate(date1) || !this.isDate(date2)) return 0;
      return Math.floor((date1.getTime() - date2.getTime()) / 1000);
    },
    isToday(date) {
      if (!this.isDate(date)) return false;
      return this.diffDays(date, this.today()) === 0;
    },
    isYesterday(date) {
      if (!this.isDate(date)) return false;
      return this.diffDays(date, this.today()) === -1;
    },
    isTomorrow(date) {
      if (!this.isDate(date)) return false;
      return this.diffDays(date, this.today()) === 1;
    },
    isFuture(date) {
      if (!this.isDate(date)) return false;
      return date.getTime() > this.now();
    },
    isPast(date) {
      if (!this.isDate(date)) return false;
      return date.getTime() < this.now();
    },
    isLeapYear(date) {
      if (!this.isDate(date)) return false;
      const year = date.getFullYear();
      return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    },
    getDaysInMonth(date) {
      if (!this.isDate(date)) return 0;
      const year = date.getFullYear();
      const month = date.getMonth();
      return new Date(year, month + 1, 0).getDate();
    },
    getWeekOfYear(date) {
      if (!this.isDate(date)) return 0;
      const startOfYear = new Date(date.getFullYear(), 0, 1);
      const diff = date.getTime() - startOfYear.getTime();
      return Math.ceil(diff / (1000 * 60 * 60 * 24 * 7));
    },
    getQuarter(date) {
      if (!this.isDate(date)) return 0;
      return Math.ceil((date.getMonth() + 1) / 3);
    },
    startOfDay(date) {
      if (!this.isDate(date)) return date;
      const newDate = new Date(date);
      newDate.setHours(0, 0, 0, 0);
      return newDate;
    },
    endOfDay(date) {
      if (!this.isDate(date)) return date;
      const newDate = new Date(date);
      newDate.setHours(23, 59, 59, 999);
      return newDate;
    },
    startOfMonth(date) {
      if (!this.isDate(date)) return date;
      return new Date(date.getFullYear(), date.getMonth(), 1);
    },
    endOfMonth(date) {
      if (!this.isDate(date)) return date;
      return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
    },
    startOfWeek(date, startDay = 1) {
      if (!this.isDate(date)) return date;
      const newDate = new Date(date);
      const day = newDate.getDay();
      const diff = day >= startDay ? day - startDay : day + (7 - startDay);
      newDate.setDate(newDate.getDate() - diff);
      newDate.setHours(0, 0, 0, 0);
      return newDate;
    },
    endOfWeek(date, startDay = 1) {
      if (!this.isDate(date)) return date;
      const start = this.startOfWeek(date, startDay);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      return end;
    },
    getAge(birthDate) {
      if (!this.isDate(birthDate)) return 0;
      const now = new Date();
      let age = now.getFullYear() - birthDate.getFullYear();
      if (now.getMonth() < birthDate.getMonth() || 
          (now.getMonth() === birthDate.getMonth() && now.getDate() < birthDate.getDate())) {
        age--;
      }
      return Math.max(0, age);
    },
    fromNow(date) {
      if (!this.isDate(date)) return '';
      const now = this.now();
      const diff = now - date.getTime();
      const minute = 60 * 1000;
      const hour = 60 * minute;
      const day = 24 * hour;
      const week = 7 * day;
      const month = 30 * day;
      const year = 365 * day;
      
      if (diff < minute) return '刚刚';
      if (diff < hour) return `${Math.floor(diff / minute)}分钟前`;
      if (diff < day) return `${Math.floor(diff / hour)}小时前`;
      if (diff < week) return `${Math.floor(diff / day)}天前`;
      if (diff < month) return `${Math.floor(diff / week)}周前`;
      if (diff < year) return `${Math.floor(diff / month)}个月前`;
      return `${Math.floor(diff / year)}年前`;
    }
  },

  debounce(func, wait, options = {}) {
    let timeout = null;
    let lastArgs = null;
    let lastThis = null;
    let lastCallTime = 0;
    
    const leading = options.leading || false;
    const trailing = options.trailing !== false;
    
    function invokeFunc() {
      func.apply(lastThis, lastArgs);
    }
    
    function leadingEdge() {
      lastCallTime = Date.now();
      if (leading) {
        timeout = setTimeout(trailingEdge, wait);
        invokeFunc();
      } else {
        timeout = setTimeout(trailingEdge, wait);
      }
    }
    
    function trailingEdge() {
      timeout = null;
      if (trailing && lastArgs) {
        invokeFunc();
      }
      lastArgs = null;
      lastThis = null;
    }
    
    function remainingWait() {
      const timeSinceLastCall = Date.now() - lastCallTime;
      return Math.max(0, wait - timeSinceLastCall);
    }
    
    return function(...args) {
      lastArgs = args;
      lastThis = this;
      lastCallTime = Date.now();
      
      if (!timeout) {
        leadingEdge();
      } else {
        clearTimeout(timeout);
        timeout = setTimeout(trailingEdge, remainingWait());
      }
    };
  },

  throttle(func, limit, options = {}) {
    let inThrottle = false;
    const trailing = options.trailing || false;
    let lastArgs = null;
    let lastThis = null;
    
    function invokeFunc() {
      func.apply(lastThis, lastArgs);
      lastArgs = null;
      lastThis = null;
    }
    
    return function(...args) {
      if (!inThrottle) {
        inThrottle = true;
        lastArgs = args;
        lastThis = this;
        invokeFunc();
        setTimeout(() => {
          inThrottle = false;
          if (trailing && lastArgs) {
            invokeFunc();
          }
        }, limit);
      } else if (trailing) {
        lastArgs = args;
        lastThis = this;
      }
    };
  },

  validator: {
    isEmail(str) {
      const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      return regex.test(str || '');
    },
    isPhone(str) {
      const regex = /^1[3-9]\d{9}$/;
      return regex.test(str || '');
    },
    isURL(str) {
      const regex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w.-]*)*\/?$/;
      return regex.test(str || '');
    },
    isIPv4(str) {
      const regex = /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
      return regex.test(str || '');
    },
    isIPv6(str) {
      const regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
      return regex.test(str || '');
    },
    isIP(str) {
      return this.isIPv4(str) || this.isIPv6(str);
    },
    isIDCard(str) {
      const regex = /^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/;
      return regex.test(str || '');
    },
    isPassport(str) {
      const regex = /^[A-Z][0-9]{8}$|^[A-Z]{2}[0-9]{7}$/;
      return regex.test(str || '');
    },
    isCreditCard(str) {
      const regex = /^(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|6(?:011|5[0-9]{2})[0-9]{12}|3[47][0-9]{13})$/;
      const cleanStr = str.replace(/\s/g, '');
      if (!regex.test(cleanStr)) return false;
      let sum = 0;
      let alternate = false;
      for (let i = cleanStr.length - 1; i >= 0; i--) {
        let digit = parseInt(cleanStr[i], 10);
        if (alternate) {
          digit *= 2;
          if (digit > 9) digit -= 9;
        }
        sum += digit;
        alternate = !alternate;
      }
      return sum % 10 === 0;
    },
    isHexColor(str) {
      const regex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
      return regex.test(str || '');
    },
    isRGB(str) {
      const regex = /^rgb\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})\)$/;
      const match = regex.exec(str || '');
      if (!match) return false;
      return match.slice(1).every(val => parseInt(val) >= 0 && parseInt(val) <= 255);
    },
    isRGBA(str) {
      const regex = /^rgba\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3}),\s*([01]|0\.\d+)\)$/;
      const match = regex.exec(str || '');
      if (!match) return false;
      const [, r, g, b, a] = match;
      return parseInt(r) >= 0 && parseInt(r) <= 255 &&
             parseInt(g) >= 0 && parseInt(g) <= 255 &&
             parseInt(b) >= 0 && parseInt(b) <= 255 &&
             parseFloat(a) >= 0 && parseFloat(a) <= 1;
    },
    isColor(str) {
      return this.isHexColor(str) || this.isRGB(str) || this.isRGBA(str);
    },
    isDate(str) {
      return !isNaN(new Date(str).getTime());
    },
    isJSON(str) {
      try {
        JSON.parse(str);
        return true;
      } catch {
        return false;
      }
    },
    isEmpty(str) {
      return !str || str.trim() === '';
    },
    isWhitespace(str) {
      return /^\s+$/.test(str || '');
    },
    isNumber(str) {
      return !isNaN(parseFloat(str)) && isFinite(str);
    },
    isInteger(str) {
      return /^-?\d+$/.test(str || '');
    },
    isFloat(str) {
      return /^-?\d+\.\d+$/.test(str || '');
    },
    isPositive(str) {
      const num = parseFloat(str);
      return !isNaN(num) && num > 0;
    },
    isNegative(str) {
      const num = parseFloat(str);
      return !isNaN(num) && num < 0;
    },
    isAlpha(str) {
      return /^[a-zA-Z]+$/.test(str || '');
    },
    isAlphaNumeric(str) {
      return /^[a-zA-Z0-9]+$/.test(str || '');
    },
    isChinese(str) {
      return /^[\u4e00-\u9fa5]+$/.test(str || '');
    },
    isLength(str, min, max) {
      const len = (str || '').length;
      return len >= min && (max === undefined || len <= max);
    },
    minLength(str, min) {
      return (str || '').length >= min;
    },
    maxLength(str, max) {
      return (str || '').length <= max;
    },
    matches(str, regex) {
      return (regex instanceof RegExp) ? regex.test(str || '') : false;
    },
    equals(str1, str2) {
      return String(str1) === String(str2);
    },
    contains(str, substring) {
      return (str || '').includes(substring);
    },
    notContains(str, substring) {
      return !this.contains(str, substring);
    },
    isArray(arr) {
      return Array.isArray(arr);
    },
    arrayLength(arr, min, max) {
      const len = arr ? arr.length : 0;
      return len >= min && (max === undefined || len <= max);
    },
    arrayMinLength(arr, min) {
      return arr ? arr.length >= min : false;
    },
    arrayMaxLength(arr, max) {
      return arr ? arr.length <= max : false;
    },
    isObject(obj) {
      return obj !== null && typeof obj === 'object' && !Array.isArray(obj);
    },
    hasKeys(obj, keys) {
      if (!obj || !keys || !Array.isArray(keys)) return false;
      return keys.every(key => Object.prototype.hasOwnProperty.call(obj, key));
    },
    validate(obj, rules) {
      const errors = {};
      Object.keys(rules).forEach(key => {
        const value = obj[key];
        const fieldRules = rules[key];
        const fieldErrors = [];
        
        fieldRules.forEach(rule => {
          if (typeof rule === 'string') {
            const [name, ...params] = rule.split(':');
            if (!this[name](value, ...params)) {
              fieldErrors.push(name);
            }
          } else if (typeof rule === 'function') {
            const result = rule(value, obj);
            if (result !== true) {
              fieldErrors.push(result || 'validation_failed');
            }
          }
        });
        
        if (fieldErrors.length > 0) {
          errors[key] = fieldErrors;
        }
      });
      
      return {
        valid: Object.keys(errors).length === 0,
        errors
      };
    }
  },

  crypto: {
    md5(str) {
      const message = str ? String(str) : '';
      const md5Array = [
        0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476
      ];
      
      const K = [
        0xd76aa478, 0xe8c7b756, 0x242070db, 0xc1bdceee,
        0xf57c0faf, 0x4787c62a, 0xa8304613, 0xfd469501,
        0x698098d8, 0x8b44f7af, 0xffff5bb1, 0x895cd7be,
        0x6b901122, 0xfd987193, 0xa679438e, 0x49b40821,
        0xf61e2562, 0xc040b340, 0x265e5a51, 0xe9b6c7aa,
        0xd62f105d, 0x02441453, 0xd8a1e681, 0xe7d3fbc8,
        0x21e1cde6, 0xc33707d6, 0xf4d50d87, 0x455a14ed,
        0xa9e3e905, 0xfcefa3f8, 0x676f02d9, 0x8d2a4c8a,
        0xfffa3942, 0x8771f681, 0x6d9d6122, 0xfde5380c,
        0xa4beea44, 0x4bdecfa9, 0xf6bb4b60, 0xbebfbc70,
        0x289b7ec6, 0xeaa127fa, 0xd4ef3085, 0x04881d05,
        0xd9d4d039, 0xe6db99e5, 0x1fa27cf8, 0xc4ac5665,
        0xf4292244, 0x432aff97, 0xab9423a7, 0xfc93a039,
        0x655b59c3, 0x8f0ccc92, 0xffeff47d, 0x85845dd1,
        0x6fa87e4f, 0xfe2ce6e0, 0xa3014314, 0x4e0811a1,
        0xf7537e82, 0xbd3af235, 0x2ad7d2bb, 0xeb86d391
      ];
      
      const S = [
        [7, 12, 17, 22], [5, 9, 14, 20], [4, 11, 16, 23], [6, 10, 15, 21]
      ];
      
      function leftRotate(value, shift) {
        return (value << shift) | (value >>> (32 - shift));
      }
      
      function addPadding(message) {
        const bitLength = message.length * 8;
        message += '\x80';
        while ((message.length % 64) !== 56) {
          message += '\x00';
        }
        const lowBytes = bitLength & 0xffffffff;
        const highBytes = (bitLength >>> 32) & 0xffffffff;
        for (let i = 0; i < 4; i++) {
          message += String.fromCharCode((lowBytes >>> (8 * i)) & 0xff);
        }
        for (let i = 0; i < 4; i++) {
          message += String.fromCharCode((highBytes >>> (8 * i)) & 0xff);
        }
        return message;
      }
      
      function processBlock(block, state) {
        const [a, b, c, d] = state;
        const words = [];
        for (let i = 0; i < 16; i++) {
          words[i] = (block.charCodeAt(i * 4) & 0xff) |
                     ((block.charCodeAt(i * 4 + 1) & 0xff) << 8) |
                     ((block.charCodeAt(i * 4 + 2) & 0xff) << 16) |
                     ((block.charCodeAt(i * 4 + 3) & 0xff) << 24);
        }
        
        let AA = a, BB = b, CC = c, DD = d;
        
        for (let i = 0; i < 64; i++) {
          let f, g;
          const round = Math.floor(i / 16);
          const wordIndex = i % 16;
          
          if (round === 0) {
            f = (BB & CC) | (~BB & DD);
            g = wordIndex;
          } else if (round === 1) {
            f = (DD & BB) | (~DD & CC);
            g = (5 * wordIndex + 1) % 16;
          } else if (round === 2) {
            f = BB ^ CC ^ DD;
            g = (3 * wordIndex + 5) % 16;
          } else {
            f = CC ^ (BB | ~DD);
            g = (7 * wordIndex) % 16;
          }
          
          const temp = DD;
          DD = CC;
          CC = BB;
          BB = BB + leftRotate((AA + f + K[i] + words[g]) & 0xffffffff, S[round][i % 4]);
          AA = temp;
        }
        
        return [
          (a + AA) & 0xffffffff,
          (b + BB) & 0xffffffff,
          (c + CC) & 0xffffffff,
          (d + DD) & 0xffffffff
        ];
      }
      
      const paddedMessage = addPadding(message);
      let state = [...md5Array];
      
      for (let i = 0; i < paddedMessage.length; i += 64) {
        state = processBlock(paddedMessage.substring(i, i + 64), state);
      }
      
      let result = '';
      state.forEach(word => {
        for (let i = 0; i < 4; i++) {
          result += ((word >>> (8 * i)) & 0xff).toString(16).padStart(2, '0');
        }
      });
      
      return result;
    },
    
    sha256(str) {
      const message = str ? String(str) : '';
      const K = [
        0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5,
        0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
        0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
        0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
        0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc,
        0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
        0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7,
        0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
        0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
        0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
        0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3,
        0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
        0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5,
        0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
        0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
        0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
      ];
      
      function rightRotate(value, shift) {
        return (value >>> shift) | (value << (32 - shift));
      }
      
      function addPadding(message) {
        const bitLength = message.length * 8;
        message += '\x80';
        while ((message.length % 64) !== 56) {
          message += '\x00';
        }
        const lowBytes = bitLength & 0xffffffff;
        const highBytes = (bitLength >>> 32) & 0xffffffff;
        for (let i = 0; i < 4; i++) {
          message += String.fromCharCode((highBytes >>> (8 * i)) & 0xff);
        }
        for (let i = 0; i < 4; i++) {
          message += String.fromCharCode((lowBytes >>> (8 * i)) & 0xff);
        }
        return message;
      }
      
      function processBlock(block, state) {
        const words = [];
        for (let i = 0; i < 16; i++) {
          words[i] = (block.charCodeAt(i * 4) & 0xff) |
                     ((block.charCodeAt(i * 4 + 1) & 0xff) << 8) |
                     ((block.charCodeAt(i * 4 + 2) & 0xff) << 16) |
                     ((block.charCodeAt(i * 4 + 3) & 0xff) << 24);
        }
        
        for (let i = 16; i < 64; i++) {
          const s0 = rightRotate(words[i - 15], 7) ^ rightRotate(words[i - 15], 18) ^ (words[i - 15] >>> 3);
          const s1 = rightRotate(words[i - 2], 17) ^ rightRotate(words[i - 2], 19) ^ (words[i - 2] >>> 10);
          words[i] = (words[i - 16] + s0 + words[i - 7] + s1) & 0xffffffff;
        }
        
        let [a, b, c, d, e, f, g, h] = state;
        
        for (let i = 0; i < 64; i++) {
          const S1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
          const ch = (e & f) ^ (~e & g);
          const temp1 = (h + S1 + ch + K[i] + words[i]) & 0xffffffff;
          const S0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
          const maj = (a & b) ^ (a & c) ^ (b & c);
          const temp2 = (S0 + maj) & 0xffffffff;
          
          h = g;
          g = f;
          f = e;
          e = (d + temp1) & 0xffffffff;
          d = c;
          c = b;
          b = a;
          a = (temp1 + temp2) & 0xffffffff;
        }
        
        return [
          (state[0] + a) & 0xffffffff,
          (state[1] + b) & 0xffffffff,
          (state[2] + c) & 0xffffffff,
          (state[3] + d) & 0xffffffff,
          (state[4] + e) & 0xffffffff,
          (state[5] + f) & 0xffffffff,
          (state[6] + g) & 0xffffffff,
          (state[7] + h) & 0xffffffff
        ];
      }
      
      const paddedMessage = addPadding(message);
      let state = [
        0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
        0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
      ];
      
      for (let i = 0; i < paddedMessage.length; i += 64) {
        state = processBlock(paddedMessage.substring(i, i + 64), state);
      }
      
      let result = '';
      state.forEach(word => {
        for (let i = 3; i >= 0; i--) {
          result += ((word >>> (8 * i)) & 0xff).toString(16).padStart(2, '0');
        }
      });
      
      return result;
    },
    
    base64Encode(str) {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
      let result = '';
      let i = 0;
      const bytes = str ? str.split('').map(c => c.charCodeAt(0)) : [];
      
      while (i < bytes.length) {
        const byte1 = bytes[i++];
        const byte2 = bytes[i++] || 0;
        const byte3 = bytes[i++] || 0;
        
        const enc1 = byte1 >> 2;
        const enc2 = ((byte1 & 3) << 4) | (byte2 >> 4);
        const enc3 = ((byte2 & 15) << 2) | (byte3 >> 6);
        const enc4 = byte3 & 63;
        
        result += chars[enc1] + chars[enc2] + 
                  (i > bytes.length + 1 ? '=' : chars[enc3]) + 
                  (i > bytes.length ? '=' : chars[enc4]);
      }
      
      return result;
    },
    
    base64Decode(str) {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
      let result = '';
      let i = 0;
      str = str.replace(/[^A-Za-z0-9+/=]/g, '');
      
      while (i < str.length) {
        const enc1 = chars.indexOf(str.charAt(i++));
        const enc2 = chars.indexOf(str.charAt(i++));
        const enc3 = chars.indexOf(str.charAt(i++));
        const enc4 = chars.indexOf(str.charAt(i++));
        
        const byte1 = (enc1 << 2) | (enc2 >> 4);
        const byte2 = ((enc2 & 15) << 4) | (enc3 >> 2);
        const byte3 = ((enc3 & 3) << 6) | enc4;
        
        result += String.fromCharCode(byte1);
        if (enc3 !== 64) result += String.fromCharCode(byte2);
        if (enc4 !== 64) result += String.fromCharCode(byte3);
      }
      
      return result;
    },
    
    uuid() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }
  },

  preload: {
    cache: new Map(),

    async loadImage(url, options = {}) {
      const { crossOrigin = 'anonymous' } = options;
      
      if (this.cache.has(url)) {
        return this.cache.get(url);
      }

      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = crossOrigin;
        
        img.onload = () => {
          this.cache.set(url, img);
          resolve(img);
        };
        
        img.onerror = () => {
          reject(new Error(`Failed to load image: ${url}`));
        };
        
        img.src = url;
      });
    },

    async loadImages(urls, options = {}) {
      const { parallel = true } = options;
      
      if (parallel) {
        return Promise.all(urls.map(url => this.loadImage(url, options)));
      }
      
      const results = [];
      for (const url of urls) {
        results.push(await this.loadImage(url, options));
      }
      return results;
    },

    async loadScript(url, options = {}) {
      const { type = 'text/javascript', async = true, defer = false } = options;
      
      if (this.cache.has(url)) {
        return this.cache.get(url);
      }

      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.type = type;
        script.async = async;
        script.defer = defer;
        
        script.onload = () => {
          this.cache.set(url, script);
          resolve(script);
        };
        
        script.onerror = () => {
          script.remove();
          reject(new Error(`Failed to load script: ${url}`));
        };
        
        script.src = url;
        document.head.appendChild(script);
      });
    },

    async loadStylesheet(url, options = {}) {
      const { media = 'all' } = options;
      
      if (this.cache.has(url)) {
        return this.cache.get(url);
      }

      return new Promise((resolve, reject) => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = url;
        link.media = media;
        
        link.onload = () => {
          this.cache.set(url, link);
          resolve(link);
        };
        
        link.onerror = () => {
          link.remove();
          reject(new Error(`Failed to load stylesheet: ${url}`));
        };
        
        document.head.appendChild(link);
      });
    },

    async loadFont(fontFamily, src, options = {}) {
      const { weight = 'normal', style = 'normal' } = options;
      const fontFace = new FontFace(fontFamily, `url(${src})`, { weight, style });
      
      try {
        await fontFace.load();
        document.fonts.add(fontFace);
        return fontFace;
      } catch (e) {
        throw new Error(`Failed to load font: ${fontFamily}`);
      }
    },

    async preload(url, type = 'image') {
      switch (type) {
        case 'image':
          return this.loadImage(url);
        case 'script':
          return this.loadScript(url);
        case 'stylesheet':
        case 'style':
          return this.loadStylesheet(url);
        default:
          throw new Error(`Unsupported preload type: ${type}`);
      }
    },

    isLoaded(url) {
      return this.cache.has(url);
    },

    clearCache() {
      this.cache.clear();
    },

    clearCacheByUrl(url) {
      this.cache.delete(url);
    }
  }
};

export { KupolaUtils };

if (typeof window !== 'undefined') {
  window.KupolaUtils = KupolaUtils;
  window.kupolaUtils = KupolaUtils;
}