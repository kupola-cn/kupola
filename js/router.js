class KupolaRouter {
  constructor(options = {}) {
    this.mode = options.mode || 'hash';
    this.routes = options.routes || [];
    this.base = options.base || '';
    this.currentRoute = null;
    this.beforeEachHandlers = [];
    this.afterEachHandlers = [];
    this.isStarted = false;
    this.animationClass = 'fade';
    this.componentCache = new Map();
    this._routeHandler = () => this._handleRoute();
    
    this._setupRoutes();
    this._bindEvents();
  }

  _setupRoutes() {
    this.routeMap = new Map();
    this._registerRoutes(this.routes, '');
  }

  _registerRoutes(routes, parentPath) {
    routes.forEach(route => {
      const fullPath = route.path.startsWith('/') 
        ? route.path 
        : parentPath + (parentPath && !route.path.startsWith('/') ? '/' : '') + route.path;
      const pathRegex = this._pathToRegex(fullPath);
      this.routeMap.set(fullPath, { ...route, regex: pathRegex, parentPath });
      
      if (route.children && route.children.length > 0) {
        this._registerRoutes(route.children, fullPath);
      }
    });
  }

  _pathToRegex(path) {
    const regexStr = path
      .replace(/:(\w+)/g, '([^/]+)')
      .replace(/\*/g, '.*');
    return new RegExp(`^${regexStr}$`);
  }

  _bindEvents() {
    if (this.mode === 'hash') {
      window.addEventListener('hashchange', this._routeHandler);
    } else {
      window.addEventListener('popstate', this._routeHandler);
    }
  }

  _handleRoute() {
    const path = this._getCurrentPath();
    this.navigate(path);
  }

  _getCurrentPath() {
    if (this.mode === 'hash') {
      return location.hash.slice(1) || '/';
    }
    return location.pathname.replace(this.base, '') || '/';
  }

  async navigate(path, replace = false) {
    const route = this._matchRoute(path);
    if (!route) return;

    const from = this.currentRoute;
    
    for (const handler of this.beforeEachHandlers) {
      const result = await handler(route, from);
      if (result === false) return;
    }

    this.currentRoute = route;
    this._updateURL(path, replace);
    await this._renderRoute(route);

    for (const handler of this.afterEachHandlers) {
      handler(route);
    }
  }

  _matchRoute(path) {
    for (const [, route] of this.routeMap) {
      const match = path.match(route.regex);
      if (match) {
        const params = {};
        const paramNames = route.path.match(/:(\w+)/g) || [];
        paramNames.forEach((name, index) => {
          params[name.slice(1)] = match[index + 1];
        });
        
        const query = this._parseQuery();
        
        return {
          ...route,
          params,
          query,
          fullPath: path
        };
      }
    }
    return null;
  }

  _parseQuery() {
    const search = location.search.slice(1);
    const params = {};
    if (search) {
      search.split('&').forEach(pair => {
        const [key, value] = pair.split('=');
        params[key] = decodeURIComponent(value || '');
      });
    }
    return params;
  }

  _updateURL(path, replace) {
    if (this.mode === 'hash') {
      const url = `#${path}`;
      if (replace) {
        location.replace(url);
      } else {
        location.hash = path;
      }
    } else {
      const url = this.base + path + location.search;
      if (replace) {
        history.replaceState({}, '', url);
      } else {
        history.pushState({}, '', url);
      }
    }
  }

  async _renderRoute(route) {
    if (route.parentPath && route.parentPath !== '') {
      await this._renderNestedRoute(route);
    } else {
      await this._renderRootRoute(route);
    }
  }

  async _renderRootRoute(route) {
    const container = document.querySelector('[data-router-view]');
    if (!container || !route.component) return;
    
    this._cleanupContainerComponents(container);
    
    container.classList.add('router-view-leave');
    container.classList.remove('router-view-enter');
    
    await this._waitForAnimation(container);
    
    const componentName = await this._resolveComponent(route.component);
    if (!componentName) return;
    
    const componentElement = document.createElement('div');
    componentElement.setAttribute('data-component', componentName);
    componentElement.classList.add('router-view-enter');
    
    Object.keys(route.params).forEach(key => {
      componentElement.setAttribute(`data-prop-${key}`, route.params[key]);
    });
    
    container.innerHTML = '';
    container.appendChild(componentElement);
    
    if (window.kupolaRegistry) {
      await window.kupolaRegistry.bootstrap(container);
    }
    
    setTimeout(() => {
      container.classList.remove('router-view-leave');
      componentElement.classList.remove('router-view-enter');
    }, 10);
  }

  async _renderNestedRoute(route) {
    const parentRoute = this.routeMap.get(route.parentPath);
    if (!parentRoute) return;
    
    const rootContainer = document.querySelector('[data-router-view]');
    if (!rootContainer) return;
    
    const existingParent = document.querySelector(`[data-component="${parentRoute.component}"]`);
    
    if (!existingParent) {
      this._cleanupContainerComponents(rootContainer);
      
      rootContainer.classList.add('router-view-leave');
      rootContainer.classList.remove('router-view-enter');
      
      await this._waitForAnimation(rootContainer);
      
      const parentName = await this._resolveComponent(parentRoute.component);
      if (!parentName) return;
      
      const parentElement = document.createElement('div');
      parentElement.setAttribute('data-component', parentName);
      
      rootContainer.innerHTML = '';
      rootContainer.appendChild(parentElement);
      
      if (window.kupolaRegistry) {
        await window.kupolaRegistry.bootstrap(rootContainer);
      }
      
      setTimeout(() => {
        rootContainer.classList.remove('router-view-leave');
      }, 50);
      
      await this._renderChildComponent(route);
    } else {
      await this._renderChildComponent(route);
    }
  }

  async _renderChildComponent(route) {
    const parentElement = document.querySelector(`[data-component="${this._getParentComponent(route.parentPath)}"]`);
    if (!parentElement) return;
    
    const container = parentElement.querySelector('[data-router-view]');
    if (!container || !route.component) return;
    
    const componentName = await this._resolveComponent(route.component);
    if (!componentName) return;
    
    const componentElement = document.createElement('div');
    componentElement.setAttribute('data-component', componentName);
    componentElement.classList.add('router-view-enter');
    
    Object.keys(route.params).forEach(key => {
      componentElement.setAttribute(`data-prop-${key}`, route.params[key]);
    });
    
    container.innerHTML = '';
    container.appendChild(componentElement);
    
    if (window.kupolaRegistry) {
      await window.kupolaRegistry.bootstrap(container);
    }
    
    setTimeout(() => {
      componentElement.classList.remove('router-view-enter');
    }, 10);
  }

  async _resolveComponent(component) {
    if (typeof component === 'function') {
      const cacheKey = component.toString();
      if (this.componentCache.has(cacheKey)) {
        return this.componentCache.get(cacheKey);
      }
      
      try {
        const result = await component();
        const componentClass = result.default || result;
        
        const componentName = `lazy-${Math.random().toString(36).substr(2, 9)}`;
        
        if (window.kupolaRegistry) {
          window.kupolaRegistry.register(componentName, componentClass);
        }
        
        this.componentCache.set(cacheKey, componentName);
        return componentName;
      } catch (e) {
        console.error('Failed to load lazy component:', e);
        return null;
      }
    }
    
    if (typeof component === 'string' && component.startsWith('lazy:')) {
      const componentName = component.slice(5);
      if (window.kupolaRegistry) {
        try {
          await window.kupolaRegistry.getAsync(componentName);
        } catch (e) {
          console.error(`Failed to load lazy component ${componentName}:`, e);
          return null;
        }
      }
      return componentName;
    }
    
    return component;
  }

  _getParentComponent(parentPath) {
    for (const [path, route] of this.routeMap) {
      if (path === parentPath) {
        return route.component;
      }
    }
    return null;
  }

  setAnimation(name) {
    this.animationClass = name;
  }

  push(path) {
    this.navigate(path, false);
  }

  replace(path) {
    this.navigate(path, true);
  }

  go(delta) {
    history.go(delta);
  }

  back() {
    history.back();
  }

  forward() {
    history.forward();
  }

  beforeEach(handler) {
    this.beforeEachHandlers.push(handler);
  }

  afterEach(handler) {
    this.afterEachHandlers.push(handler);
  }

  _waitForAnimation(element) {
    return new Promise(resolve => {
      const transitionDuration = this._getTransitionDuration(element);
      if (transitionDuration > 0) {
        const cleanup = () => {
          element.removeEventListener('transitionend', cleanup);
          element.removeEventListener('animationend', cleanup);
          resolve();
        };
        element.addEventListener('transitionend', cleanup);
        element.addEventListener('animationend', cleanup);
        setTimeout(cleanup, transitionDuration + 100);
      } else {
        resolve();
      }
    });
  }

  _getTransitionDuration(element) {
    const style = window.getComputedStyle(element);
    const transitionDuration = parseFloat(style.transitionDuration) || 0;
    const animationDuration = parseFloat(style.animationDuration) || 0;
    return Math.max(transitionDuration, animationDuration) * 1000;
  }

  _cleanupContainerComponents(container) {
    const components = container.querySelectorAll('[data-component]');
    components.forEach(element => {
      const instance = element.__kupolaInstance;
      if (instance && typeof instance.unmount === 'function') {
        instance.unmount().catch(e => console.error(`Error unmounting component:`, e));
      }
    });
    
    if (window.kupolaInitializer) {
      const allElements = container.querySelectorAll('[data-component], [data-dropdown], [data-select], [data-datepicker], [data-timepicker], [data-slider], [data-carousel], [data-drawer], [data-modal], [data-dialog], [data-color-picker], [data-calendar], [data-slide-captcha], [data-heatmap]');
      allElements.forEach(element => {
        window.kupolaInitializer.cleanup(element);
      });
    }
  }

  destroy() {
    if (this.mode === 'hash') {
      window.removeEventListener('hashchange', this._routeHandler);
    } else {
      window.removeEventListener('popstate', this._routeHandler);
    }
    this.routes = [];
    this.routeMap.clear();
    this.beforeEachHandlers = [];
    this.afterEachHandlers = [];
  }
}

function createRouter(options) {
  return new KupolaRouter(options);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { KupolaRouter, createRouter };
} else {
  window.KupolaRouter = KupolaRouter;
  window.createRouter = createRouter;
}