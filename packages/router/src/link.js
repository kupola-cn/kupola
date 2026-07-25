import { useRouter } from './router.js';
import { registerDirective } from '@kupola/platform';

export class RouterLinkDirective {
  constructor(el, binding) {
    this.el = el;
    this.binding = binding;
    this.router = useRouter();
    this.unsubscribe = null;
    
    this.init();
  }
  
  init() {
    this.el.addEventListener('click', this.handleClick);
    this.updateActiveClass();
    
    if (this.router) {
      this.unsubscribe = this.router.afterEach(() => {
        this.updateActiveClass();
      });
    }
  }
  
  handleClick = (e) => {
    e.preventDefault();
    
    const { value, modifiers } = this.binding;
    const { replace = false } = modifiers;
    
    let location = value;
    let query = {};
    
    if (typeof value === 'string') {
      if (value.startsWith('{')) {
        try {
          const parsed = JSON.parse(value);
          location = parsed.name ? { name: parsed.name, params: parsed.params } : parsed.path;
          query = parsed.query || {};
        } catch {
          location = value;
        }
      } else {
        location = value;
      }
    }
    
    if (this.router) {
      const options = query ? { query } : {};
      if (replace) {
        this.router.replace(location, options);
      } else {
        this.router.push(location, options);
      }
    }
  };
  
  updateActiveClass() {
    if (!this.router || !this.router.currentRoute) return;
    
    const { value } = this.binding;
    const activeClass = this.binding.arg || 'router-link-active';
    const currentPath = this.router.currentRoute.fullPath;
    
    let linkPath = value;
    if (typeof value === 'string') {
      if (!value.startsWith('{')) {
        linkPath = value;
      }
    }
    
    if (linkPath && currentPath.startsWith(linkPath.replace(/\/$/, ''))) {
      this.el.classList.add(activeClass);
    } else {
      this.el.classList.remove(activeClass);
    }
  }
  
  destroy() {
    this.el.removeEventListener('click', this.handleClick);
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
  
  update(newBinding) {
    this.binding = newBinding;
    this.updateActiveClass();
  }
}

export function registerRouterLinkDirective() {
  registerDirective('k-router-link', {
    mount(el, binding) {
      return new RouterLinkDirective(el, binding);
    },
    update(el, binding) {
      if (el._routerLinkInstance) {
        el._routerLinkInstance.update(binding);
      }
    },
    unmount(el) {
      if (el._routerLinkInstance) {
        el._routerLinkInstance.destroy();
      }
    },
  });
}
