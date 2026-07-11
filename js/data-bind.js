/**
 * Kupola Data Bind — Reactive data binding, event bus, and state management.
 * Provides KupolaDataBind (Proxy-based binding), KupolaEventBus, KupolaStore, and ref().
 * @module kupola/data-bind
 */

/**
 * Basic HTML sanitizer — removes <script>, <iframe>, <object>, <embed>, and on* event attributes.
 * @param {string} html
 * @returns {string}
 */
function sanitizeHtml(html) {
  if (!html) return '';
  const str = String(html);
  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^>]*\/?>/gi, '')
    .replace(/\bon\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '');
}

class TrieNode {
  constructor() {
    this.children = {};
    this.keys = [];
  }
}

class PathTrie {
  constructor() {
    this.root = new TrieNode();
  }

  insert(key) {
    let node = this.root;
    const parts = key.split('.');
    
    parts.forEach((part, index) => {
      if (!node.children[part]) {
        node.children[part] = new TrieNode();
      }
      node = node.children[part];
      if (index === parts.length - 1) {
        node.keys.push(key);
      }
    });
  }

  getSubKeys(key) {
    let node = this.root;
    const parts = key.split('.');
    const result = [];

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (!node.children[part]) {
        break;
      }
      node = node.children[part];
      
      const collectKeys = (n) => {
        if (n.keys.length > 0) {
          result.push(...n.keys);
        }
        Object.values(n.children).forEach(child => collectKeys(child));
      };
      collectKeys(node);
    }

    return [...new Set(result)];
  }

  getParentKeys(key) {
    const parts = key.split('.');
    const result = [];
    
    for (let i = 1; i <= parts.length; i++) {
      const parentPath = parts.slice(0, i).join('.');
      result.push(parentPath);
    }
    
    return result;
  }
}

const REACTIVE_SYMBOLS = {
  parent: Symbol('reactive_parent'),
  path: Symbol('reactive_path'),
  isReactive: Symbol('reactive_is_reactive')
};

class KupolaDataBind {
  constructor() {
    this.rawData = {};
    this.data = null;
    this.observers = {};
    this.elements = {};
    this.computedProperties = {};
    this.pathTrie = new PathTrie();
    this.updateQueue = new Map();
    this.isProcessing = false;
    this.pendingComputed = new Set();
    this.persistedKeys = new Map();
    this.snapshots = [];
    this.snapshotLimit = 10;
    this._proxyCache = new WeakMap();
    
    this.createReactiveData();
  }

  createReactiveData() {
    const handler = {
      get: (target, key, receiver) => {
        if (key === '__raw__') return target;
        const result = Reflect.get(target, key, receiver);
        if (result && typeof result === 'object' && !Array.isArray(result)) {
          return this.wrapReactive(result, key);
        }
        return result;
      },
      set: (target, key, value, receiver) => {
        const oldValue = Reflect.get(target, key, receiver);
        const result = Reflect.set(target, key, value, receiver);
        
        const fullPath = this.resolvePath(target, key);
        this.notify(fullPath, value, oldValue);
        this.queueUpdate(fullPath, value);
        
        return result;
      },
      deleteProperty: (target, key) => {
        const oldValue = Reflect.get(target, key, receiver);
        const result = Reflect.deleteProperty(target, key);
        
        const fullPath = this.resolvePath(target, key);
        this.notify(fullPath, undefined, oldValue);
        this.queueUpdate(fullPath, undefined);
        
        return result;
      }
    };

    this.data = new Proxy(this.rawData, handler);
    this.data.__parent__ = null;
    this.data.__path__ = '';
  }

  wrapReactive(obj, parentKey) {
    if (obj[REACTIVE_SYMBOLS.isReactive]) return obj;
    
    if (this._proxyCache.has(obj)) {
      return this._proxyCache.get(obj);
    }
    
    const handler = {
      get: (target, key, receiver) => {
        if (key === '__raw__') return target;
        if (key === REACTIVE_SYMBOLS.parent || key === '__parent__') return target[REACTIVE_SYMBOLS.parent];
        if (key === REACTIVE_SYMBOLS.path || key === '__path__') return target[REACTIVE_SYMBOLS.path];
        if (key === REACTIVE_SYMBOLS.isReactive || key === '__isReactive__') return true;
        
        const result = Reflect.get(target, key, receiver);
        if (result && typeof result === 'object' && !Array.isArray(result)) {
          return this.wrapReactive(result, `${target[REACTIVE_SYMBOLS.path]}${target[REACTIVE_SYMBOLS.path] ? '.' : ''}${key}`);
        }
        return result;
      },
      set: (target, key, value, receiver) => {
        if (key === REACTIVE_SYMBOLS.parent || 
            key === REACTIVE_SYMBOLS.path || 
            key === REACTIVE_SYMBOLS.isReactive ||
            key === '__parent__' ||
            key === '__path__' ||
            key === '__isReactive__') {
          return true;
        }
        
        const oldValue = Reflect.get(target, key, receiver);
        const result = Reflect.set(target, key, value, receiver);
        
        const fullPath = `${target[REACTIVE_SYMBOLS.path]}${target[REACTIVE_SYMBOLS.path] ? '.' : ''}${key}`;
        this.notify(fullPath, value, oldValue);
        this.queueUpdate(fullPath, value);
        
        return result;
      },
      deleteProperty: (target, key) => {
        if (key === REACTIVE_SYMBOLS.parent || 
            key === REACTIVE_SYMBOLS.path || 
            key === REACTIVE_SYMBOLS.isReactive) {
          return false;
        }
        
        const oldValue = Reflect.get(target, key);
        const result = Reflect.deleteProperty(target, key);
        
        const fullPath = `${target[REACTIVE_SYMBOLS.path]}${target[REACTIVE_SYMBOLS.path] ? '.' : ''}${key}`;
        this.notify(fullPath, undefined, oldValue);
        this.queueUpdate(fullPath, undefined);
        
        return result;
      },
      has: (target, key) => {
        if (key === '__raw__' || 
            key === REACTIVE_SYMBOLS.parent || 
            key === REACTIVE_SYMBOLS.path || 
            key === REACTIVE_SYMBOLS.isReactive ||
            key === '__parent__' ||
            key === '__path__' ||
            key === '__isReactive__') {
          return true;
        }
        return key in target;
      },
      ownKeys: (target) => {
        return Reflect.ownKeys(target).filter(key => 
          key !== REACTIVE_SYMBOLS.parent && 
          key !== REACTIVE_SYMBOLS.path && 
          key !== REACTIVE_SYMBOLS.isReactive
        );
      },
      getOwnPropertyDescriptor: (target, key) => {
        if (key === REACTIVE_SYMBOLS.parent || 
            key === REACTIVE_SYMBOLS.path || 
            key === REACTIVE_SYMBOLS.isReactive) {
          return {
            configurable: false,
            enumerable: false,
            writable: false,
            value: target[key]
          };
        }
        return Reflect.getOwnPropertyDescriptor(target, key);
      }
    };
    
    const proxy = new Proxy(obj, handler);
    obj[REACTIVE_SYMBOLS.parent] = obj;
    obj[REACTIVE_SYMBOLS.path] = parentKey;
    obj[REACTIVE_SYMBOLS.isReactive] = true;
    this._proxyCache.set(obj, proxy);
    
    Object.keys(obj).forEach(key => {
      if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
        obj[key] = this.wrapReactive(obj[key], `${parentKey}${parentKey ? '.' : ''}${key}`);
      }
    });
    
    return proxy;
  }

  resolvePath(target, key) {
    if (target[REACTIVE_SYMBOLS.path]) {
      return `${target[REACTIVE_SYMBOLS.path]}.${key}`;
    }
    return key;
  }

  queueUpdate(key, value) {
    this.updateQueue.set(key, value);
    
    if (!this.isProcessing) {
      this.isProcessing = true;
      requestAnimationFrame(() => {
        this.processQueue();
      });
    }
  }

  processQueue() {
    const updatedKeys = new Set();
    
    this.updateQueue.forEach((value, key) => {
      updatedKeys.add(key);
      this.updateElementsDirect(key, value);
      
      const subKeys = this.pathTrie.getSubKeys(key);
      subKeys.forEach(subKey => {
        if (!updatedKeys.has(subKey)) {
          const subValue = this.get(subKey);
          this.updateElementsDirect(subKey, subValue);
          updatedKeys.add(subKey);
        }
      });
    });
    
    this.updateQueue.clear();
    this.processComputed();
    this.isProcessing = false;
  }

  updateElementsDirect(key, value) {
    if (this.elements[key]) {
      this.elements[key].forEach(element => {
        this.updateElement(element, value);
      });
    }
  }

  processComputed() {
    const computedKeys = Object.keys(this.computedProperties);
    
    computedKeys.forEach(name => {
      const prop = this.computedProperties[name];
      const depsChanged = prop.deps.some(dep => {
        return this.updateQueue.has(dep) || 
               this.pathTrie.getSubKeys(dep).some(k => this.updateQueue.has(k));
      });
      
      if (depsChanged) {
        this.updateComputedProperty(name);
      }
    });
  }

  set(key, value, silent = false) {
    const oldValue = this.get(key);
    
    if (typeof key === 'object') {
      Object.assign(this.rawData, key);
      Object.keys(key).forEach(k => {
        if (!silent) {
          this.notify(k, key[k], oldValue?.[k]);
          this.queueUpdate(k, key[k]);
        }
      });
    } else {
      if (key.includes('.')) {
        this.setNested(key, value);
      } else {
        this.rawData[key] = value;
      }
      
      if (!silent) {
        this.notify(key, value, oldValue);
        this.queueUpdate(key, value);
      }
    }
    
    if (!silent) {
      this.processComputed();
    }
  }

  get(key) {
    if (!key) return undefined;
    if (key.includes('.')) {
      return this.getNested(key);
    }
    return this.rawData[key];
  }

  getNested(path) {
    if (!path) return undefined;
    return path.split('.').reduce((obj, key) => obj?.[key], this.rawData);
  }

  setNested(path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const parent = keys.reduce((obj, key) => {
      if (!obj[key]) obj[key] = {};
      return obj[key];
    }, this.rawData);
    
    const oldValue = parent[lastKey];
    parent[lastKey] = value;
    this.notify(path, value, oldValue);
    this.queueUpdate(path, value);
  }

  observe(key, callback) {
    if (!this.observers[key]) {
      this.observers[key] = [];
    }
    this.observers[key].push(callback);
  }

  unobserve(key, callback) {
    if (this.observers[key]) {
      this.observers[key] = this.observers[key].filter(cb => cb !== callback);
    }
  }

  notify(key, value, oldValue) {
    if (this.observers[key]) {
      this.observers[key].forEach(callback => {
        try {
          callback(value, oldValue);
        } catch (e) {
          console.error(`Observer error for ${key}:`, e);
        }
      });
    }
    
    this.observers['*']?.forEach(callback => {
      try {
        callback(key, value, oldValue);
      } catch (e) {
        console.error('Wildcard observer error:', e);
      }
    });
  }

  updateElement(element, value) {
    const binding = element.getAttribute('data-bind');
    if (!binding) return;

    const bindings = binding.split('|');
    
    bindings.forEach(b => {
      const parts = b.split(':');
      const type = parts[0].trim();
      const target = parts[1]?.trim();

      switch (type) {
        case 'text':
          if (element.textContent !== String(value ?? '')) {
            element.textContent = value ?? '';
          }
          break;
        case 'html':
          const sanitized = sanitizeHtml(value);
          if (element.innerHTML !== sanitized) {
            element.innerHTML = sanitized;
          }
          break;
        case 'value':
          if (element.type === 'checkbox') {
            if (element.checked !== !!value) {
              element.checked = !!value;
            }
          } else if (element.value !== String(value ?? '')) {
            element.value = value ?? '';
          }
          break;
        case 'checked':
          if (element.checked !== !!value) {
            element.checked = !!value;
          }
          break;
        case 'disabled':
          if (element.disabled !== !!value) {
            element.disabled = !!value;
          }
          break;
        case 'hidden':
          const display = value ? 'none' : '';
          if (element.style.display !== display) {
            element.style.display = display;
          }
          break;
        case 'class':
          if (target) {
            if (value) {
              element.classList.add(target);
            } else {
              element.classList.remove(target);
            }
          }
          break;
        case 'style':
          if (target && element.style[target] !== String(value ?? '')) {
            element.style[target] = value ?? '';
          }
          break;
        case 'attr':
          if (target) {
            const current = element.getAttribute(target);
            if (current !== String(value ?? '')) {
              element.setAttribute(target, value ?? '');
            }
          }
          break;
        case 'src':
          if (element.src !== String(value ?? '')) {
            element.src = value ?? '';
          }
          break;
        case 'href':
          if (element.href !== String(value ?? '')) {
            element.href = value ?? '';
          }
          break;
        case 'placeholder':
          if (element.placeholder !== String(value ?? '')) {
            element.placeholder = value ?? '';
          }
          break;
      }
    });
  }

  computed(name, deps, callback) {
    this.computedProperties[name] = { deps, callback };
    
    deps.forEach(dep => {
      this.pathTrie.insert(dep);
    });
    
    this.updateComputedProperty(name);
  }

  updateComputedProperty(name) {
    const prop = this.computedProperties[name];
    if (!prop) return;
    
    try {
      const values = prop.deps.map(dep => this.get(dep));
      const result = prop.callback(...values);
      this.set(name, result, true);
    } catch (e) {
      console.error(`Computed error for ${name}:`, e);
    }
  }

  load(data) {
    Object.keys(data).forEach(key => {
      if (data[key] && typeof data[key] === 'object' && !Array.isArray(data[key])) {
        this.rawData[key] = this.wrapReactive(data[key], key);
      } else {
        this.rawData[key] = data[key];
      }
      this.queueUpdate(key, this.rawData[key]);
    });
    
    this.processComputed();
  }

  reset() {
    this.rawData = {};
    this.observers = {};
    this.elements = {};
    this.computedProperties = {};
    this.pathTrie = new PathTrie();
    this.updateQueue.clear();
    this.snapshots = [];
    this.createReactiveData();
    this.bind();
  }

  persist(key, options = {}) {
    const {
      storage: storageType = 'local',
      debounce = 0,
      version = 1,
      encrypt = false,
      encryptionKey = null
    } = options;

    const storage = storageType === 'session' ? sessionStorage : localStorage;
    
    this.persistedKeys.set(key, { 
      storage, 
      debounce, 
      timeout: null,
      version,
      encrypt,
      encryptionKey
    });
    
    const value = this.get(key);
    if (value !== undefined) {
      this._persistSave(key, value, storage, { version, encrypt, encryptionKey });
    }
    
    this.observe(key, (newValue) => {
      const config = this.persistedKeys.get(key);
      if (!config) return;
      
      if (config.debounce > 0) {
        if (config.timeout) clearTimeout(config.timeout);
        config.timeout = setTimeout(() => {
          this._persistSave(key, newValue, config.storage, { 
            version: config.version, 
            encrypt: config.encrypt, 
            encryptionKey: config.encryptionKey 
          });
        }, config.debounce);
      } else {
        this._persistSave(key, newValue, config.storage, { 
          version: config.version, 
          encrypt: config.encrypt, 
          encryptionKey: config.encryptionKey 
        });
      }
    });
  }

  _persistSave(key, value, storage, options = {}) {
    try {
      const { version = 1, encrypt = false, encryptionKey = null } = options;
      
      const dataToStore = {
        value,
        version,
        timestamp: Date.now()
      };
      
      let serialized = JSON.stringify(dataToStore);
      
      if (encrypt && encryptionKey) {
        serialized = this._encrypt(serialized, encryptionKey);
      }
      
      this._ensureStorageCapacity(storage);
      storage.setItem(`kupola:${key}`, serialized);
    } catch (e) {
      console.warn(`Failed to persist key ${key}:`, e);
      
      if (e.name === 'QuotaExceededError' && storage === localStorage) {
        console.warn(`localStorage quota exceeded, trying sessionStorage for key ${key}`);
        try {
          sessionStorage.setItem(`kupola:${key}`, JSON.stringify({ value, version: 1 }));
        } catch (e2) {
          console.warn(`sessionStorage also failed for key ${key}:`, e2);
        }
      }
    }
  }

  _ensureStorageCapacity(storage) {
    try {
      const testKey = `kupola:__storage_test__`;
      storage.setItem(testKey, 'test');
      storage.removeItem(testKey);
    } catch (e) {
      if (e.name === 'QuotaExceededError') {
        this._cleanupOldStorage(storage);
      }
    }
  }

  _cleanupOldStorage(storage) {
    const now = Date.now();
    const maxAge = 30 * 24 * 60 * 60 * 1000;
    
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key?.startsWith('kupola:')) {
        try {
          const data = JSON.parse(storage.getItem(key));
          if (data.timestamp && now - data.timestamp > maxAge) {
            storage.removeItem(key);
          }
        } catch (e) {
          storage.removeItem(key);
        }
      }
    }
  }

  _encrypt(text, key) {
    if (!window.CryptoJS) {
      console.warn('CryptoJS not available, encryption skipped');
      return text;
    }
    return window.CryptoJS.AES.encrypt(text, key).toString();
  }

  _decrypt(ciphertext, key) {
    if (!window.CryptoJS) {
      console.warn('CryptoJS not available, decryption skipped');
      return ciphertext;
    }
    try {
      const bytes = window.CryptoJS.AES.decrypt(ciphertext, key);
      return bytes.toString(window.CryptoJS.enc.Utf8);
    } catch (e) {
      console.warn('Decryption failed:', e);
      return ciphertext;
    }
  }

  unpersist(key) {
    const config = this.persistedKeys.get(key);
    if (config) {
      if (config.timeout) clearTimeout(config.timeout);
      config.storage.removeItem(`kupola:${key}`);
      this.persistedKeys.delete(key);
    }
  }

  loadPersisted(options = {}) {
    const persisted = {};
    const { encryptionKey = null } = options;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('kupola:')) {
        const dataKey = key.replace('kupola:', '');
        try {
          const stored = localStorage.getItem(key);
          let parsed;
          
          if (encryptionKey) {
            const decrypted = this._decrypt(stored, encryptionKey);
            parsed = JSON.parse(decrypted);
          } else {
            parsed = JSON.parse(stored);
          }
          
          if (parsed.version !== undefined && parsed.version !== options.version) {
            console.debug(`Skipping outdated data for ${dataKey} (version ${parsed.version})`);
            continue;
          }
          
          persisted[dataKey] = parsed.value !== undefined ? parsed.value : parsed;
        } catch (e) {
          console.warn(`Failed to load persisted key ${dataKey}:`, e);
        }
      }
    }
    
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key?.startsWith('kupola:')) {
        const dataKey = key.replace('kupola:', '');
        try {
          const stored = sessionStorage.getItem(key);
          let parsed;
          
          if (encryptionKey) {
            const decrypted = this._decrypt(stored, encryptionKey);
            parsed = JSON.parse(decrypted);
          } else {
            parsed = JSON.parse(stored);
          }
          
          if (parsed.version !== undefined && parsed.version !== options.version) {
            console.debug(`Skipping outdated data for ${dataKey} (version ${parsed.version})`);
            continue;
          }
          
          persisted[dataKey] = parsed.value !== undefined ? parsed.value : parsed;
        } catch (e) {}
      }
    }
    
    if (Object.keys(persisted).length > 0) {
      this.load(persisted);
    }
    
    return persisted;
  }

  _clone(data) {
    if (typeof structuredClone === 'function') {
      try {
        return structuredClone(data);
      } catch (e) {
        console.warn('structuredClone failed, falling back to JSON:', e);
      }
    }
    return JSON.parse(JSON.stringify(data));
  }

  snapshot() {
    const snapshot = this._clone(this.rawData);
    this.snapshots.push(snapshot);
    if (this.snapshots.length > this.snapshotLimit) {
      this.snapshots.shift();
    }
    return this.snapshots.length - 1;
  }

  rollback(index = -1) {
    if (this.snapshots.length === 0) return false;
    
    const snapshotIndex = index >= 0 ? index : this.snapshots.length - 1;
    const snapshot = this.snapshots[snapshotIndex];
    
    if (!snapshot) return false;
    
    this.rawData = this._clone(snapshot);
    this.createReactiveData();
    
    Object.keys(this.rawData).forEach(key => {
      this.queueUpdate(key, this.rawData[key]);
    });
    
    this.processComputed();
    return true;
  }

  getSnapshotCount() {
    return this.snapshots.length;
  }

  clearSnapshots() {
    this.snapshots = [];
  }

  serializeForm(formElement) {
    const data = {};
    
    formElement.querySelectorAll('input, select, textarea').forEach(element => {
      const name = element.getAttribute('data-bind');
      if (!name) return;
      
      const parts = name.split(':');
      const key = parts[1]?.trim();
      if (!key) return;
      
      if (element.type === 'checkbox') {
        if (!data[key]) data[key] = [];
        if (element.checked) {
          data[key].push(element.value);
        }
      } else if (element.type === 'radio') {
        if (element.checked) {
          data[key] = element.value;
        }
      } else {
        data[key] = element.value;
      }
    });
    
    return data;
  }

  fillForm(formElement, data) {
    Object.keys(data).forEach(key => {
      formElement.querySelectorAll('[data-bind*=":' + key + '"]').forEach(element => {
        if (element.type === 'checkbox') {
          element.checked = Array.isArray(data[key]) 
            ? data[key].includes(element.value) 
            : !!data[key];
        } else if (element.type === 'radio') {
          element.checked = element.value === data[key];
        } else {
          element.value = data[key] ?? '';
        }
      });
    });
  }

  createReactive(target, path = '') {
    if (target[REACTIVE_SYMBOLS.isReactive]) return target;
    
    if (this._proxyCache.has(target)) {
      return this._proxyCache.get(target);
    }
    
    const handler = {
      get: (target, key, receiver) => {
        if (key === '__raw__') return target;
        if (key === REACTIVE_SYMBOLS.parent || key === '__parent__') return target[REACTIVE_SYMBOLS.parent];
        if (key === REACTIVE_SYMBOLS.path || key === '__path__') return target[REACTIVE_SYMBOLS.path];
        if (key === REACTIVE_SYMBOLS.isReactive || key === '__isReactive__') return true;
        
        const result = Reflect.get(target, key, receiver);
        if (result && typeof result === 'object' && !Array.isArray(result)) {
          return this.wrapReactive(result, `${target[REACTIVE_SYMBOLS.path]}${target[REACTIVE_SYMBOLS.path] ? '.' : ''}${key}`);
        }
        return result;
      },
      set: (target, key, value, receiver) => {
        if (key === REACTIVE_SYMBOLS.parent || 
            key === REACTIVE_SYMBOLS.path || 
            key === REACTIVE_SYMBOLS.isReactive ||
            key === '__parent__' ||
            key === '__path__' ||
            key === '__isReactive__') {
          return true;
        }
        
        const oldValue = Reflect.get(target, key, receiver);
        const result = Reflect.set(target, key, value, receiver);
        
        const fullPath = `${target[REACTIVE_SYMBOLS.path]}${target[REACTIVE_SYMBOLS.path] ? '.' : ''}${key}`;
        this.notify(fullPath, value, oldValue);
        this.queueUpdate(fullPath, value);
        
        return result;
      },
      deleteProperty: (target, key) => {
        if (key === REACTIVE_SYMBOLS.parent || 
            key === REACTIVE_SYMBOLS.path || 
            key === REACTIVE_SYMBOLS.isReactive) {
          return false;
        }
        
        const oldValue = Reflect.get(target, key);
        const result = Reflect.deleteProperty(target, key);
        
        const fullPath = `${target[REACTIVE_SYMBOLS.path]}${target[REACTIVE_SYMBOLS.path] ? '.' : ''}${key}`;
        this.notify(fullPath, undefined, oldValue);
        this.queueUpdate(fullPath, undefined);
        
        return result;
      },
      has: (target, key) => {
        if (key === '__raw__' || 
            key === REACTIVE_SYMBOLS.parent || 
            key === REACTIVE_SYMBOLS.path || 
            key === REACTIVE_SYMBOLS.isReactive ||
            key === '__parent__' ||
            key === '__path__' ||
            key === '__isReactive__') {
          return true;
        }
        return key in target;
      },
      ownKeys: (target) => {
        return Reflect.ownKeys(target).filter(key => 
          key !== REACTIVE_SYMBOLS.parent && 
          key !== REACTIVE_SYMBOLS.path && 
          key !== REACTIVE_SYMBOLS.isReactive
        );
      },
      getOwnPropertyDescriptor: (target, key) => {
        if (key === REACTIVE_SYMBOLS.parent || 
            key === REACTIVE_SYMBOLS.path || 
            key === REACTIVE_SYMBOLS.isReactive) {
          return {
            configurable: false,
            enumerable: false,
            writable: false,
            value: target[key]
          };
        }
        return Reflect.getOwnPropertyDescriptor(target, key);
      }
    };
    
    const proxy = new Proxy(target, handler);
    target[REACTIVE_SYMBOLS.parent] = target;
    target[REACTIVE_SYMBOLS.path] = path;
    target[REACTIVE_SYMBOLS.isReactive] = true;
    this._proxyCache.set(target, proxy);
    
    Object.keys(target).forEach(key => {
      if (target[key] && typeof target[key] === 'object' && !Array.isArray(target[key])) {
        target[key] = this.wrapReactive(target[key], `${path}${path ? '.' : ''}${key}`);
      }
    });
    
    return proxy;
  }

  bind() {
    document.querySelectorAll('[data-bind]').forEach(element => {
      this._bindElement(element);
    });
    
    if (!this._mutationObserver) {
      this._mutationObserver = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const bindElements = node.querySelectorAll('[data-bind]');
              bindElements.forEach(element => this._bindElement(element));
              if (node.hasAttribute && node.hasAttribute('data-bind')) {
                this._bindElement(node);
              }
            }
          });
        });
      });
      
      this._mutationObserver.observe(document.body, {
        childList: true,
        subtree: true
      });
    }
  }

  _bindElement(element) {
    const binding = element.getAttribute('data-bind');
    const parts = binding.split(':');
    const typePart = parts[0].split('|')[0].trim();
    const key = parts[1]?.trim();
    
    if (!key) return;
    
    this.pathTrie.insert(key);
    
    if (!this.elements[key]) {
      this.elements[key] = [];
    }
    
    if (!this.elements[key].includes(element)) {
      this.elements[key].push(element);
    }
    
    if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' || element.tagName === 'SELECT') {
      const existingHandler = element.__kupolaBindHandler;
      if (existingHandler) {
        element.removeEventListener('input', existingHandler);
      }
      
      const handler = () => {
        const value = element.type === 'checkbox' ? element.checked : element.value;
        if (key.includes('.')) {
          this.setNested(key, value);
        } else {
          this.set(key, value);
        }
      };
      
      element.__kupolaBindHandler = handler;
      element.addEventListener('input', handler);
    }
    
    if (this.rawData[key] !== undefined) {
      this.updateElement(element, this.rawData[key]);
    }
  }

  destroy() {
    if (this._mutationObserver) {
      this._mutationObserver.disconnect();
      this._mutationObserver = null;
    }
    
    Object.values(this.elements).forEach(elements => {
      elements.forEach(element => {
        const handler = element.__kupolaBindHandler;
        if (handler) {
          element.removeEventListener('input', handler);
          delete element.__kupolaBindHandler;
        }
      });
    });
    
    this.persistedKeys.forEach((config, key) => {
      if (config.timeout) clearTimeout(config.timeout);
    });
    this.persistedKeys.clear();
    
    this.rawData = {};
    this.observers = {};
    this.elements = {};
    this.computedProperties = {};
    this.pathTrie = new PathTrie();
    this.updateQueue.clear();
    this.snapshots = [];
  }
}

class KupolaStore {
  constructor(name, options = {}) {
    this.name = name;
    this._stateKey = `__store_${name}__`;
    
    const initialState = options.state ? options.state() : {};
    this.getters = options.getters || {};
    this.actions = options.actions || {};
    this.mutations = options.mutations || {};
    
    this.observers = {};
    
    if (window.kupolaData) {
      window.kupolaData.set(this._stateKey, initialState);
      this.state = window.kupolaData.data?.[this._stateKey] || 
        window.kupolaData.createReactive(initialState, this._stateKey);
      
      window.kupolaData.observe(this._stateKey, (newState) => {
        this.notify(newState);
      });
    } else {
      this.state = initialState;
    }
    
    this._bindGetters();
    this._bindActions();
  }

  _bindGetters() {
    Object.keys(this.getters).forEach(name => {
      Object.defineProperty(this, name, {
        get: () => this.getters[name](this.state),
        enumerable: true
      });
    });
  }

  _bindActions() {
    Object.keys(this.actions).forEach(name => {
      this[name] = (...args) => {
        return this.actions[name]({
          state: this.state,
          commit: this.commit.bind(this),
          dispatch: this.dispatch.bind(this),
          getters: this
        }, ...args);
      };
    });
  }

  commit(type, payload) {
    const mutation = this.mutations[type];
    if (!mutation) {
      console.warn(`Mutation ${type} not found in store ${this.name}`);
      return;
    }
    
    mutation(this.state, payload);
  }

  dispatch(type, payload) {
    const action = this.actions[type];
    if (!action) {
      console.warn(`Action ${type} not found in store ${this.name}`);
      return;
    }
    
    return action({
      state: this.state,
      commit: this.commit.bind(this),
      dispatch: this.dispatch.bind(this),
      getters: this
    }, payload);
  }

  observe(callback) {
    if (!this.observers['*']) {
      this.observers['*'] = [];
    }
    this.observers['*'].push(callback);
    return callback;
  }

  unobserve(callback) {
    if (this.observers['*']) {
      this.observers['*'] = this.observers['*'].filter(cb => cb !== callback);
    }
  }

  notify(newState) {
    if (this.observers['*']) {
      this.observers['*'].forEach(callback => {
        try {
          callback(newState);
        } catch (e) {
          console.error(`Observer error for store ${this.name}:`, e);
        }
      });
    }
    
    if (window.kupolaData) {
      window.kupolaData.set(this.name, newState);
    }
  }

  toJSON() {
    return {
      name: this.name,
      state: this.state,
      getters: Object.keys(this.getters).reduce((acc, name) => {
        acc[name] = this[name];
        return acc;
      }, {})
    };
  }
}

class KupolaStoreManager {
  constructor() {
    this.stores = new Map();
  }

  createStore(name, options) {
    const store = new KupolaStore(name, options);
    this.stores.set(name, store);
    return store;
  }

  getStore(name) {
    return this.stores.get(name);
  }

  registerStore(store) {
    if (store instanceof KupolaStore) {
      this.stores.set(store.name, store);
    }
  }

  dispose() {
    this.stores.clear();
  }
}

class KupolaEventBus {
  constructor() {
    this.events = {};
    this.delegatedEvents = {};
    this.eventListeners = {};
  }

  on(eventName, callback) {
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }
    this.events[eventName].push(callback);
    return callback;
  }

  off(eventName, callback) {
    if (this.events[eventName]) {
      this.events[eventName] = this.events[eventName].filter(cb => cb !== callback);
    }
  }

  emit(eventName, data) {
    if (this.events[eventName]) {
      this.events[eventName].forEach(callback => {
        try {
          callback(data);
        } catch (e) {
          console.error(`Error in event handler for ${eventName}:`, e);
        }
      });
    }
    
    this.events['*']?.forEach(callback => {
      try {
        callback(eventName, data);
      } catch (e) {
        console.error(`Error in wildcard event handler:`, e);
      }
    });
  }

  once(eventName, callback) {
    const onceCallback = (data) => {
      callback(data);
      this.off(eventName, onceCallback);
    };
    this.on(eventName, onceCallback);
    return onceCallback;
  }

  delegate(selector, eventName, callback) {
    if (!this.delegatedEvents[eventName]) {
      this.delegatedEvents[eventName] = [];
      
      const listener = (e) => {
        this.delegatedEvents[eventName].forEach(({ selector: sel, cb }) => {
          if (e.target.matches(sel) || e.target.closest(sel)) {
            cb(e);
          }
        });
      };
      
      document.addEventListener(eventName, listener);
      this.eventListeners[eventName] = listener;
    }
    
    this.delegatedEvents[eventName].push({ selector, cb: callback });
    return callback;
  }

  undelegate(selector, eventName) {
    if (this.delegatedEvents[eventName]) {
      this.delegatedEvents[eventName] = this.delegatedEvents[eventName].filter(
        item => item.selector !== selector
      );
      
      if (this.delegatedEvents[eventName].length === 0) {
        const listener = this.eventListeners[eventName];
        if (listener) {
          document.removeEventListener(eventName, listener);
          delete this.eventListeners[eventName];
        }
        delete this.delegatedEvents[eventName];
      }
    }
  }

  destroy() {
    Object.entries(this.eventListeners).forEach(([eventName, listener]) => {
      document.removeEventListener(eventName, listener);
    });
    
    this.events = {};
    this.delegatedEvents = {};
    this.eventListeners = {};
  }
}

// ============================================================
// Lightweight ref() — standalone reactive primitive
// ============================================================

function ref(initialValue = null) {
    const refObj = {
        _value: initialValue,
        _subscribers: new Set()
    };

    Object.defineProperty(refObj, 'value', {
        configurable: true,
        enumerable: true,
        get() { return refObj._value; },
        set(newValue) {
            if (newValue !== refObj._value) {
                refObj._value = newValue;
                refObj._subscribers.forEach(sub => sub(newValue));
            }
        }
    });

    return refObj;
}

/** @type {KupolaDataBind} Global data binding instance */
const kupolaData = new KupolaDataBind();
/** @type {KupolaEventBus} Global event bus instance */
const kupolaEvents = new KupolaEventBus();
/** @type {KupolaStoreManager} Global store manager instance */
const kupolaStoreManager = new KupolaStoreManager();

/** Create a named reactive store with state, getters, mutations, and actions. */
function createStore(name, options) {
  return kupolaStoreManager.createStore(name, options);
}

/** Get a previously created store by name. */
function getStore(name) {
  return kupolaStoreManager.getStore(name);
}

export { TrieNode, PathTrie, REACTIVE_SYMBOLS };
export { KupolaDataBind, KupolaEventBus, KupolaStore, KupolaStoreManager };
export { kupolaData, kupolaEvents, kupolaStoreManager };
export { createStore, getStore };
export { ref };

if (typeof window !== 'undefined') {
  window.KupolaDataBind = KupolaDataBind;
  window.KupolaEventBus = KupolaEventBus;
  window.KupolaStore = KupolaStore;
  window.KupolaStoreManager = KupolaStoreManager;
  window.kupolaData = kupolaData;
  window.kupolaEvents = kupolaEvents;
  window.kupolaStoreManager = kupolaStoreManager;
  window.createStore = createStore;
  window.getStore = getStore;
  window.kupolaRef = ref;
}
