class KupolaHttp {
  constructor(options = {}) {
    this.baseURL = options.baseURL || '';
    this.timeout = options.timeout || 30000;
    this.headers = options.headers || {};
    this.cache = new Map();
    this.cacheTTL = options.cacheTTL || 60000;
    this.maxRetries = options.maxRetries || 0;
    this.retryDelay = options.retryDelay || 1000;
    this.activeRequests = new Map();
    this.withCredentials = options.withCredentials || false;

    this._useAxios = typeof axios !== 'undefined';
    if (this._useAxios) {
      this._initAxios(options);
    }
    
    if (options.interceptors) {
      this.interceptors = options.interceptors;
    }
  }

  _initAxios(options) {
    this.axios = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: this.headers
    });
    
    this.axios.defaults.withCredentials = options.withCredentials || false;
  }

  _generateCacheKey(config) {
    const { url, method = 'GET', params = {}, data = null } = config;
    const query = params ? new URLSearchParams(params).toString() : '';
    const dataKey = data ? JSON.stringify(data) : '';
    return `${method}:${url}:${query}:${dataKey}`;
  }

  _getCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  _setCache(key, data) {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  async _requestWithRetry(config, retryCount = 0) {
    try {
      return await this._request(config);
    } catch (error) {
      if (retryCount < this.maxRetries) {
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * Math.pow(2, retryCount)));
        return this._requestWithRetry(config, retryCount + 1);
      }
      throw error;
    }
  }

  async _request(config) {
    const { 
      url, 
      method = 'GET', 
      headers = {}, 
      params = {}, 
      data = null, 
      timeout = this.timeout,
      cache = false
    } = config;

    const cacheKey = this._generateCacheKey({ url, method, params, data });
    
    if (cache && method === 'GET') {
      const cached = this._getCache(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const controller = new AbortController();
    this.activeRequests.set(cacheKey, controller);

    const requestHeaders = { ...this.headers, ...headers };
    
    if (!requestHeaders['Content-Type'] && data && !(data instanceof FormData)) {
      requestHeaders['Content-Type'] = 'application/json';
    }

    let requestConfig = {
      url: this.baseURL ? new URL(url, this.baseURL).toString() : url,
      method,
      headers: requestHeaders,
      signal: controller.signal,
      credentials: this.withCredentials ? 'include' : 'same-origin'
    };

    if (Object.keys(params).length > 0) {
      const urlObj = new URL(requestConfig.url);
      Object.keys(params).forEach(key => {
        urlObj.searchParams.append(key, params[key]);
      });
      requestConfig.url = urlObj.toString();
    }

    if (data !== null) {
      requestConfig.body = data instanceof FormData ? data : JSON.stringify(data);
    }

    if (this.interceptors && this.interceptors.request) {
      try {
        const intercepted = await this.interceptors.request(requestConfig);
        if (intercepted) requestConfig = intercepted;
      } catch (error) {
        this.activeRequests.delete(cacheKey);
        if (this.interceptors.requestError) {
          return this.interceptors.requestError(error);
        }
        throw error;
      }
    }

    try {
      let response;
      if (this._useAxios) {
        const axiosConfig = {
          url: requestConfig.url.replace(this.baseURL, ''),
          method: requestConfig.method,
          headers: requestConfig.headers,
          signal: requestConfig.signal,
          timeout
        };
        if (data !== null) axiosConfig.data = data;
        if (params && Object.keys(params).length > 0) axiosConfig.params = params;
        
        response = await this.axios(axiosConfig);
      } else {
        response = await this._fetchWithTimeout(requestConfig, timeout);
        
        if (!response.ok) {
          const error = new Error(`HTTP error! status: ${response.status}`);
          error.status = response.status;
          error.statusText = response.statusText;
          throw error;
        }
      }
      
      const result = {
        data: this._useAxios ? response.data : await this._parseResponse(response),
        status: this._useAxios ? response.status : response.status,
        statusText: this._useAxios ? response.statusText : response.statusText,
        headers: this._useAxios ? response.headers : this._parseHeaders(response.headers),
        config: requestConfig
      };
      
      if (this.interceptors && this.interceptors.response) {
        return this.interceptors.response(result);
      }
      
      if (cache && method === 'GET') {
        this._setCache(cacheKey, result);
      }
      
      return result;
    } catch (error) {
      if (error.name === 'AbortError' || (this._useAxios && error.code === 'ERR_CANCELED')) {
        return null;
      }
      if (this.interceptors && this.interceptors.responseError) {
        return this.interceptors.responseError(error);
      }
      throw error;
    } finally {
      this.activeRequests.delete(cacheKey);
    }
  }

  async _fetchWithTimeout(config, timeout) {
    const controller = new AbortController();
    const signal = controller.signal;
    
    const timeoutPromise = new Promise((_, reject) => {
      const timerId = setTimeout(() => {
        controller.abort();
        reject(new Error('Request timeout'));
      }, timeout);
      
      signal.addEventListener('abort', () => {
        clearTimeout(timerId);
      });
    });
    
    const fetchPromise = fetch({ ...config, signal });
    
    return Promise.race([fetchPromise, timeoutPromise]);
  }

  async _parseResponse(response) {
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }
    return response.text();
  }

  _parseHeaders(headers) {
    const result = {};
    headers.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }

  cancelRequest(url, params = {}, method = 'GET', data = null) {
    const cacheKey = this._generateCacheKey({ url, method, params, data });
    if (this.activeRequests.has(cacheKey)) {
      this.activeRequests.get(cacheKey).abort();
      this.activeRequests.delete(cacheKey);
      return true;
    }
    return false;
  }

  cancelAllRequests() {
    this.activeRequests.forEach((controller) => {
      controller.abort();
    });
    this.activeRequests.clear();
  }

  clearCache() {
    this.cache.clear();
  }

  clearCacheByUrl(url) {
    this.cache.forEach((_, key) => {
      if (key.startsWith(`GET:${url}`)) {
        this.cache.delete(key);
      }
    });
  }

  get(url, config = {}) {
    const useCache = config.cache ?? true;
    const useRetry = config.retry ?? this.maxRetries > 0;
    
    const requestConfig = { ...config, url, method: 'GET', cache: useCache };
    
    if (useRetry) {
      return this._requestWithRetry(requestConfig);
    }
    return this._request(requestConfig);
  }

  post(url, data = null, config = {}) {
    const useRetry = config.retry ?? this.maxRetries > 0;
    const requestConfig = { ...config, url, method: 'POST', data, cache: false };
    
    if (useRetry) {
      return this._requestWithRetry(requestConfig);
    }
    return this._request(requestConfig);
  }

  async uploadFile(url, file, options = {}) {
    const {
      chunkSize = 2 * 1024 * 1024,
      onProgress,
      headers = {},
      parallel = false
    } = options;

    const totalChunks = Math.ceil(file.size / chunkSize);
    let uploadedChunks = 0;
    let progress = 0;

    const fileId = this._generateFileId(file);

    if (parallel) {
      const promises = [];
      for (let i = 0; i < totalChunks; i++) {
        const promise = this._uploadChunk(url, file, i, totalChunks, chunkSize, fileId, headers)
          .then(() => {
            uploadedChunks++;
            progress = Math.round((uploadedChunks / totalChunks) * 100);
            
            if (onProgress) {
              onProgress({
                progress,
                uploaded: uploadedChunks * chunkSize,
                total: file.size,
                currentChunk: uploadedChunks,
                totalChunks
              });
            }
          });
        promises.push(promise);
      }
      await Promise.all(promises);
      return this._completeUpload(url, fileId, totalChunks, file.name);
    }

    for (let i = 0; i < totalChunks; i++) {
      await this._uploadChunk(url, file, i, totalChunks, chunkSize, fileId, headers);
      
      uploadedChunks++;
      progress = Math.round((uploadedChunks / totalChunks) * 100);
      
      if (onProgress) {
        onProgress({
          progress,
          uploaded: uploadedChunks * chunkSize,
          total: file.size,
          currentChunk: i + 1,
          totalChunks
        });
      }
    }

    return this._completeUpload(url, fileId, totalChunks, file.name);
  }

  async _uploadChunk(url, file, chunkIndex, totalChunks, chunkSize, fileId, headers) {
    const start = chunkIndex * chunkSize;
    const end = Math.min(start + chunkSize, file.size);
    const chunk = file.slice(start, end);

    const formData = new FormData();
    formData.append('chunk', chunk);
    formData.append('chunkIndex', chunkIndex);
    formData.append('totalChunks', totalChunks);
    formData.append('fileId', fileId);
    formData.append('fileName', file.name);
    formData.append('fileSize', file.size);

    return this.post(`${url}/chunk`, formData, { headers });
  }

  async _completeUpload(url, fileId, totalChunks, fileName) {
    return this.post(`${url}/complete`, { fileId, totalChunks, fileName });
  }

  _generateFileId(file) {
    const hash = `${file.name}-${file.size}-${file.lastModified}`;
    let result = 0;
    for (let i = 0; i < hash.length; i++) {
      result = ((result << 5) - result) + hash.charCodeAt(i);
      result |= 0;
    }
    return Math.abs(result).toString(36) + Date.now().toString(36);
  }

  put(url, data = null, config = {}) {
    const useRetry = config.retry ?? this.maxRetries > 0;
    const requestConfig = { ...config, url, method: 'PUT', data, cache: false };
    
    if (useRetry) {
      return this._requestWithRetry(requestConfig);
    }
    return this._request(requestConfig);
  }

  delete(url, config = {}) {
    const useRetry = config.retry ?? this.maxRetries > 0;
    const requestConfig = { ...config, url, method: 'DELETE', cache: false };
    
    if (useRetry) {
      return this._requestWithRetry(requestConfig);
    }
    return this._request(requestConfig);
  }

  patch(url, data = null, config = {}) {
    const useRetry = config.retry ?? this.maxRetries > 0;
    const requestConfig = { ...config, url, method: 'PATCH', data, cache: false };
    
    if (useRetry) {
      return this._requestWithRetry(requestConfig);
    }
    return this._request(requestConfig);
  }

  setHeader(name, value) {
    this.headers[name] = value;
    if (this.axios) {
      this.axios.defaults.headers.common[name] = value;
    }
  }

  setToken(token, type = 'Bearer') {
    this.headers['Authorization'] = `${type} ${token}`;
    if (this.axios) {
      this.axios.defaults.headers.common['Authorization'] = `${type} ${token}`;
    }
  }

  setCacheTTL(ttl) {
    this.cacheTTL = ttl;
  }

  setMaxRetries(retries) {
    this.maxRetries = retries;
  }
}

function createHttp(options) {
  return new KupolaHttp(options);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { KupolaHttp, createHttp };
} else {
  window.KupolaHttp = KupolaHttp;
  window.createHttp = createHttp;
}