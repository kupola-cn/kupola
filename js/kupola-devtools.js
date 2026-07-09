class KupolaDevTools {
  constructor(options = {}) {
    this.enabled = options.enabled ?? false;
    this.panel = null;
    this.isOpen = false;
    this.activeTab = 'storage';
    this.activeStorageType = 'cookies';
    this.requestHistory = [];
    this.maxHistorySize = 50;
  }

  init() {
    if (!this.enabled) return;
    try {
      this.createToggleButton();
      this.createPanel();
      this.setupNetworkInterceptor();
    } catch (error) {
      console.error('Error in init:', error);
    }
  }

  createToggleButton() {
    const button = document.createElement('button');
    button.className = 'kupola-devtools__toggle';
    button.textContent = '🛠️';
    button.style.cssText = `
      position: fixed;
      bottom: 28px;
      left: 50px;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: #535164;
      color: white;
      border: none;
      cursor: pointer;
      z-index: 9999;
      font-size: 20px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      transition: transform 0.2s;
    `;
    button.addEventListener('click', () => this.togglePanel());
    document.body.appendChild(button);
    this.toggleButton = button;
  }

  createPanel() {
    const panel = document.createElement('div');
    panel.className = 'kupola-devtools__panel';
    panel.style.cssText = `
      position: fixed;
      bottom: 80px;
      left: 28px;
      width: 550px;
      max-height: 650px;
      background: #1e1e1e;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.4);
      z-index: 9998;
      display: none;
      flex-direction: column;
      overflow: hidden;
      border: 1px solid #333;
    `;
    
    panel.innerHTML = `
      <div class="kupola-devtools__header">
        <span class="kupola-devtools__title">DevTools</span>
        <button class="kupola-devtools__close">✕</button>
      </div>
      <div class="kupola-devtools__tabs">
        <button data-tab="storage" class="kupola-devtools__tab active">Storage</button>
        <button data-tab="network" class="kupola-devtools__tab">Network</button>
      </div>
      <div class="kupola-devtools__sub-tabs" id="storage-sub-tabs">
        <button class="kupola-devtools__sub-tab active" data-storage="cookies">Cookies</button>
        <button class="kupola-devtools__sub-tab" data-storage="localStorage">LocalStorage</button>
        <button class="kupola-devtools__sub-tab" data-storage="sessionStorage">SessionStorage</button>
      </div>
      <div class="kupola-devtools__sub-tabs" id="network-sub-tabs" style="display:none;">
        <button class="kupola-devtools__network-action" data-action="clear">Clear</button>
      </div>
      <div class="kupola-devtools__content">
        ${this.getStorageContent('cookies')}
      </div>
    `;
    
    document.body.appendChild(panel);
    this.panel = panel;
    
    panel.querySelector('.kupola-devtools__close').addEventListener('click', () => this.togglePanel());
    panel.querySelectorAll('.kupola-devtools__tab').forEach(tab => {
      tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
    });
    this.setupStorageListener();
    this.makeDraggable();
    this.injectStyles();
  }

  switchTab(tabName) {
    this.activeTab = tabName;
    
    this.panel.querySelectorAll('.kupola-devtools__tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabName);
    });
    
    const storageSubTabs = this.panel.querySelector('#storage-sub-tabs');
    const networkSubTabs = this.panel.querySelector('#network-sub-tabs');
    
    if (tabName === 'storage') {
      storageSubTabs.style.display = 'flex';
      networkSubTabs.style.display = 'none';
      this.renderStorageContent();
    } else {
      storageSubTabs.style.display = 'none';
      networkSubTabs.style.display = 'flex';
      this.renderNetworkContent();
    }
  }

  renderStorageContent() {
    const content = this.panel.querySelector('.kupola-devtools__content');
    if (content) {
      content.innerHTML = this.getStorageContent(this.activeStorageType);
    }
  }

  renderNetworkContent() {
    const content = this.panel.querySelector('.kupola-devtools__content');
    if (!content) return;
    
    if (this.requestHistory.length === 0) {
      content.innerHTML = '<div class="kupola-devtools__loading">No network requests captured</div>';
      return;
    }
    
    let html = '';
    this.requestHistory.forEach((req, index) => {
      const statusClass = req.status >= 200 && req.status < 300 ? 'success' : 
                         req.status >= 400 ? 'error' : 'warning';
      const duration = req.duration ? `${req.duration}ms` : '-';
      
      html += `
        <div class="kupola-devtools__network-item" data-index="${index}">
          <div class="kupola-devtools__network-header">
            <span class="kupola-devtools__network-method">${req.method}</span>
            <span class="kupola-devtools__network-url">${req.url}</span>
            <span class="kupola-devtools__network-status ${statusClass}">${req.status}</span>
            <span class="kupola-devtools__network-duration">${duration}</span>
          </div>
          <div class="kupola-devtools__network-details" style="display:none;">
            ${req.params ? `<div class="kupola-devtools__network-detail"><strong>Params:</strong><pre>${this.truncateContent(JSON.stringify(req.params, null, 2), 1000)}</pre></div>` : ''}
            ${req.requestBody ? `<div class="kupola-devtools__network-detail"><strong>Request Body:</strong><pre>${this.truncateContent(req.requestBody, 1000)}</pre></div>` : ''}
            ${req.response ? `<div class="kupola-devtools__network-detail"><strong>Response:</strong><pre>${this.truncateContent(req.response, 1500)}</pre></div>` : ''}
          </div>
        </div>
      `;
    });
    
    content.innerHTML = html;
    
    content.querySelectorAll('.kupola-devtools__network-item').forEach(item => {
      item.addEventListener('click', () => {
        const details = item.querySelector('.kupola-devtools__network-details');
        details.style.display = details.style.display === 'none' ? 'block' : 'none';
      });
    });
    
    const clearBtn = this.panel.querySelector('[data-action="clear"]');
    if (clearBtn) {
      clearBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.clearNetworkHistory();
      });
    }
  }

  clearNetworkHistory() {
    this.requestHistory = [];
    this.renderNetworkContent();
  }

  truncateContent(content, maxLength) {
    if (!content) return '-';
    const str = typeof content === 'string' ? content : JSON.stringify(content);
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength) + `... (truncated, ${str.length} chars)`;
  }

  setupNetworkInterceptor() {
    const devTools = this;
    
    const originalFetch = window.fetch;
    window.fetch = async function(url, options = {}) {
      const startTime = Date.now();
      const requestId = Date.now() + Math.random();
      
      let requestBody = null;
      if (options.body) {
        if (typeof options.body === 'string') {
          requestBody = options.body;
        } else if (options.body instanceof FormData) {
          try {
            requestBody = JSON.stringify(Object.fromEntries(options.body));
          } catch {}
        } else {
          try {
            requestBody = JSON.stringify(options.body);
          } catch {}
        }
      }
      
      let params = null;
      try {
        const urlObj = new URL(typeof url === 'string' ? url : url.href);
        if (urlObj.search) {
          params = Object.fromEntries(urlObj.searchParams);
        }
      } catch {}
      
      const entry = {
        id: requestId,
        method: options.method || 'GET',
        url: typeof url === 'string' ? url : url.href,
        params,
        requestBody,
        status: 0,
        response: null,
        duration: null
      };
      
      devTools.addRequest(entry);
      
      try {
        const response = await originalFetch.apply(this, arguments);
        
        entry.status = response.status;
        entry.duration = Date.now() - startTime;
        
        try {
          const clone = response.clone();
          const text = await clone.text();
          try {
            entry.response = JSON.parse(text);
          } catch {
            entry.response = text;
          }
        } catch {}
        
        devTools.updateRequest(entry);
        
        return response;
      } catch (error) {
        entry.status = -1;
        entry.response = error.message;
        entry.duration = Date.now() - startTime;
        devTools.updateRequest(entry);
        throw error;
      }
    };
    
    const originalOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url) {
      this.__kupolaRequest = {
        method,
        url,
        params: null,
        requestBody: null,
        status: 0,
        response: null,
        startTime: Date.now()
      };
      
      try {
        const urlObj = new URL(url);
        if (urlObj.search) {
          this.__kupolaRequest.params = Object.fromEntries(urlObj.searchParams);
        }
      } catch {}
      
      originalOpen.apply(this, arguments);
    };
    
    const originalSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.send = function(body) {
      if (this.__kupolaRequest) {
        if (body) {
          if (typeof body === 'string') {
            this.__kupolaRequest.requestBody = body;
          } else if (body instanceof FormData) {
            try {
              this.__kupolaRequest.requestBody = JSON.stringify(Object.fromEntries(body));
            } catch {}
          }
        }
        
        const entry = { ...this.__kupolaRequest };
        devTools.addRequest(entry);
        this.__kupolaEntry = entry;
      }
      
      originalSend.apply(this, arguments);
    };
    
    const originalOnReadyStateChange = XMLHttpRequest.prototype.onreadystatechange;
    XMLHttpRequest.prototype.onreadystatechange = function() {
      if (this.__kupolaEntry && this.readyState === 4) {
        this.__kupolaEntry.status = this.status;
        this.__kupolaEntry.duration = Date.now() - this.__kupolaRequest.startTime;
        
        try {
          const responseText = this.responseText;
          try {
            this.__kupolaEntry.response = JSON.parse(responseText);
          } catch {
            this.__kupolaEntry.response = responseText;
          }
        } catch {}
        
        devTools.updateRequest(this.__kupolaEntry);
      }
      
      if (typeof originalOnReadyStateChange === 'function') {
        originalOnReadyStateChange.apply(this, arguments);
      }
    };
  }

  addRequest(entry) {
    this.requestHistory.unshift(entry);
    if (this.requestHistory.length > this.maxHistorySize) {
      this.requestHistory.pop();
    }
    
    if (this.isOpen && this.activeTab === 'network') {
      this.renderNetworkContent();
    }
  }

  updateRequest(entry) {
    const index = this.requestHistory.findIndex(r => r.id === entry.id || 
      (r.url === entry.url && r.method === entry.method && !r.status));
    if (index !== -1) {
      this.requestHistory[index] = entry;
      
      if (this.isOpen && this.activeTab === 'network') {
        this.renderNetworkContent();
      }
    }
  }
  
  setupStorageListener() {
    const devTools = this;
    
    window.addEventListener('storage', (e) => {
      if (devTools.isOpen && devTools.activeTab === 'storage') {
        const content = devTools.panel?.querySelector('.kupola-devtools__content');
        if (content) {
          const type = e.storageArea === localStorage ? 'localStorage' : 'sessionStorage';
          devTools.activeStorageType = type;
          devTools.updateStorageTabs();
          content.innerHTML = devTools.getStorageContent(type);
        }
      }
    });
    
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function(key, value) {
      const oldValue = this.getItem(key);
      originalSetItem.call(this, key, value);
      const event = new StorageEvent('storage', {
        key,
        oldValue,
        newValue: value,
        url: window.location.href,
        storageArea: this
      });
      window.dispatchEvent(event);
    };
    
    const originalRemoveItem = Storage.prototype.removeItem;
    Storage.prototype.removeItem = function(key) {
      const oldValue = this.getItem(key);
      originalRemoveItem.call(this, key);
      const event = new StorageEvent('storage', {
        key,
        oldValue,
        newValue: null,
        url: window.location.href,
        storageArea: this
      });
      window.dispatchEvent(event);
    };
  }

  injectStyles() {
    const styles = document.createElement('style');
    styles.textContent = `
      .kupola-devtools__header { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: #2d2d2d; border-bottom: 1px solid #333; }
      .kupola-devtools__title { color: #535164; font-weight: 600; font-size: 14px; }
      .kupola-devtools__close { background: none; border: none; color: #888; cursor: pointer; font-size: 14px; padding: 4px; }
      .kupola-devtools__close:hover { color: #fff; }
      .kupola-devtools__tabs { display: flex; background: #252525; border-bottom: 1px solid #333; }
      .kupola-devtools__tab { flex: 1; padding: 10px 8px; background: none; border: none; color: #888; cursor: pointer; font-size: 11px; border-bottom: 2px solid transparent; transition: all 0.2s; }
      .kupola-devtools__tab:hover { color: #fff; }
      .kupola-devtools__tab.active { color: #535164; border-bottom-color: #535164; }
      .kupola-devtools__sub-tabs { display: flex; gap: 4px; padding: 8px 12px; background: #1e1e1e; border-bottom: 1px solid #333; }
      .kupola-devtools__sub-tab { padding: 4px 8px; background: #333; border: none; color: #888; cursor: pointer; font-size: 11px; border-radius: 4px; }
      .kupola-devtools__sub-tab:hover { color: #fff; }
      .kupola-devtools__sub-tab.active { background: #535164; color: white; }
      .kupola-devtools__network-action { padding: 4px 8px; background: #333; border: none; color: #888; cursor: pointer; font-size: 11px; border-radius: 4px; }
      .kupola-devtools__network-action:hover { color: #fff; background: #444; }
      .kupola-devtools__content { flex: 1; overflow-y: auto; padding: 12px; font-family: 'Consolas', monospace; font-size: 12px; }
      .kupola-devtools__list-item { padding: 6px 8px; border-radius: 4px; margin-bottom: 4px; background: #2a2a2a; }
      .kupola-devtools__list-item:hover { background: #333; }
      .kupola-devtools__loading { display: flex; justify-content: center; align-items: center; height: 100px; color: #666; }
      .kupola-devtools__storage-key { color: #9cdcfe; margin-right: 8px; }
      .kupola-devtools__storage-value { color: #ce9178; word-break: break-all; }
      .kupola-devtools__network-item { padding: 6px 8px; border-radius: 4px; margin-bottom: 4px; background: #2a2a2a; cursor: pointer; }
      .kupola-devtools__network-item:hover { background: #333; }
      .kupola-devtools__network-header { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
      .kupola-devtools__network-method { padding: 2px 6px; border-radius: 3px; font-weight: 600; font-size: 11px; color: white; }
      .kupola-devtools__network-method.GET { background: #4CAF50; }
      .kupola-devtools__network-method.POST { background: #2196F3; }
      .kupola-devtools__network-method.PUT { background: #FF9800; }
      .kupola-devtools__network-method.DELETE { background: #F44336; }
      .kupola-devtools__network-method.PATCH { background: #9C27B0; }
      .kupola-devtools__network-url { flex: 1; color: #9cdcfe; font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .kupola-devtools__network-status { padding: 2px 6px; border-radius: 3px; font-size: 11px; font-weight: 600; }
      .kupola-devtools__network-status.success { background: #4CAF50; color: white; }
      .kupola-devtools__network-status.error { background: #F44336; color: white; }
      .kupola-devtools__network-status.warning { background: #FF9800; color: white; }
      .kupola-devtools__network-duration { color: #888; font-size: 11px; }
      .kupola-devtools__network-details { margin-top: 8px; padding-top: 8px; border-top: 1px solid #333; }
      .kupola-devtools__network-detail { margin-bottom: 8px; }
      .kupola-devtools__network-detail strong { color: #535164; display: block; margin-bottom: 4px; }
      .kupola-devtools__network-detail pre { margin: 0; color: #ce9178; white-space: pre-wrap; word-break: break-all; }
    `;
    document.head.appendChild(styles);
  }

  makeDraggable() {
    const header = this.panel.querySelector('.kupola-devtools__header');
    let isDragging = false;
    let startX, startY, startLeft, startTop;

    this._dragMouseDownHandler = (e) => {
      if (e.target.closest('.kupola-devtools__close')) return;
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      startLeft = this.panel.offsetLeft;
      startTop = this.panel.offsetTop;
    };

    this._dragMouseMoveHandler = (e) => {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      this.panel.style.left = `${startLeft + dx}px`;
      this.panel.style.right = 'auto';
      this.panel.style.top = `${Math.max(0, startTop + dy)}px`;
    };

    this._dragMouseUpHandler = () => { isDragging = false; };

    header.addEventListener('mousedown', this._dragMouseDownHandler);
    document.addEventListener('mousemove', this._dragMouseMoveHandler);
    document.addEventListener('mouseup', this._dragMouseUpHandler);
  }

  destroy() {
    const header = this.panel.querySelector('.kupola-devtools__header');
    
    if (header && this._dragMouseDownHandler) {
      header.removeEventListener('mousedown', this._dragMouseDownHandler);
    }
    
    if (this._dragMouseMoveHandler) {
      document.removeEventListener('mousemove', this._dragMouseMoveHandler);
    }
    
    if (this._dragMouseUpHandler) {
      document.removeEventListener('mouseup', this._dragMouseUpHandler);
    }
    
    if (this.panel && this.panel.parentNode) {
      this.panel.parentNode.removeChild(this.panel);
    }
    
    this._dragMouseDownHandler = null;
    this._dragMouseMoveHandler = null;
    this._dragMouseUpHandler = null;
    this.panel = null;
  }

  togglePanel() {
    this.isOpen = !this.isOpen;
    this.panel.style.display = this.isOpen ? 'flex' : 'none';
    
    if (this.isOpen && this.activeTab === 'network') {
      this.renderNetworkContent();
    }
  }

  updateStorageTabs() {
    this.panel.querySelectorAll('.kupola-devtools__sub-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.storage === this.activeStorageType);
    });
  }

  getStorageContent(type) {
    let items = [];
    
    try {
      if (type === 'cookies') {
        items = document.cookie.split(';').map(c => c.trim()).filter(c => c).map(c => {
          const [key, ...valueParts] = c.split('=');
          return { key, value: valueParts.join('=') };
        });
      } else if (type === 'localStorage') {
        for (let i = 0; i < localStorage.length; i++) {
          items.push({ key: localStorage.key(i), value: localStorage.getItem(localStorage.key(i)) });
        }
      } else if (type === 'sessionStorage') {
        for (let i = 0; i < sessionStorage.length; i++) {
          items.push({ key: sessionStorage.key(i), value: sessionStorage.getItem(sessionStorage.key(i)) });
        }
      }
    } catch (e) {
      console.error('Error reading storage:', e);
      return '<div class="kupola-devtools__loading">Error reading storage</div>';
    }
    
    if (items.length === 0) return '<div class="kupola-devtools__loading">No data</div>';
    
    let html = '';
    items.forEach(item => {
      let displayValue = item.value;
      if (displayValue && displayValue.length > 0 && displayValue.length < 2000) {
        try { 
          const parsed = JSON.parse(displayValue);
          displayValue = JSON.stringify(parsed, null, 2); 
        } catch {}
      } else if (displayValue && displayValue.length >= 2000) {
        displayValue = displayValue.substring(0, 500) + '... (truncated, ' + displayValue.length + ' chars)';
      }
      html += `<div class="kupola-devtools__list-item"><div><span class="kupola-devtools__storage-key">${item.key}</span></div><div class="kupola-devtools__storage-value">${displayValue}</div></div>`;
    });
    
    return html;
  }

  handleStorageClick(e) {
    const target = e.target;
    if (target.classList.contains('kupola-devtools__sub-tab')) {
      e.stopPropagation();
      const type = target.dataset.storage;
      if (type) {
        this.activeStorageType = type;
        this.updateStorageTabs();
        const content = this.panel.querySelector('.kupola-devtools__content');
        if (content) {
          content.innerHTML = this.getStorageContent(type);
        }
      }
    }
  }
}

function initDevTools() {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const enabled = urlParams.has('dev') || urlParams.has('debug');
    
    if (enabled) {
      window.kupolaDevTools = new KupolaDevTools({ enabled: true });
      window.kupolaDevTools.init();
      
      window.addEventListener('click', (e) => {
        if (window.kupolaDevTools && window.kupolaDevTools.handleStorageClick) {
          window.kupolaDevTools.handleStorageClick(e);
        }
      });
    }
  } catch (error) {
    console.error('Error initializing Kupola DevTools:', error);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDevTools);
} else {
  initDevTools();
}

window.KupolaDevTools = KupolaDevTools;