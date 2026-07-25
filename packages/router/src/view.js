import { useRouter } from './router.js';
import { applyTransition, createTransitionManager } from './transition.js';

export class RouterViewDirective {
  constructor(el, binding) {
    this.el = el;
    this.binding = binding;
    this.router = useRouter();
    this.viewName = binding.value || 'default';
    this.transitionManager = createTransitionManager(el, binding);
    this.unsubscribe = null;
    
    this.init();
  }
  
  init() {
    if (this.router) {
      this.render();
      this.unsubscribe = this.router.afterEach(() => {
        this.render();
      });
    }
  }
  
  async render() {
    if (!this.router || !this.router.currentRoute) return;
    
    const route = this.router.currentRoute;
    const matched = route.matched;
    
    if (matched.length === 0) return;
    
    const lastRecord = matched[matched.length - 1];
    
    let component = lastRecord.component;
    if (lastRecord.components && this.viewName !== 'default') {
      component = lastRecord.components[this.viewName];
    }
    
    if (!component) return;
    
    const currentContent = this.el.firstChild;
    
    if (currentContent) {
      await applyTransition(currentContent, 'leave', lastRecord.transition);
      currentContent.remove();
    }
    
    const componentFn = component.default || component;
    const templateResult = componentFn();
    
    const container = document.createElement('div');
    if (templateResult && typeof templateResult === 'object') {
      container.innerHTML = templateResult.html || '';
    } else if (typeof templateResult === 'string') {
      container.innerHTML = templateResult;
    }
    
    const newContent = container.firstChild;
    if (newContent) {
      this.el.appendChild(newContent);
      await applyTransition(newContent, 'enter', lastRecord.transition);
    }
  }
  
  destroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    this.transitionManager.destroy();
  }
  
  update(newBinding) {
    this.binding = newBinding;
    this.viewName = newBinding.value || 'default';
    this.render();
  }
}

export function registerRouterViewDirective(walk) {
  walk(document.body, {
    'router-view': {
      mount(el, binding) {
        const instance = new RouterViewDirective(el, binding);
        el._routerViewInstance = instance;
      },
      update(el, binding) {
        if (el._routerViewInstance) {
          el._routerViewInstance.update(binding);
        }
      },
      unmount(el) {
        if (el._routerViewInstance) {
          el._routerViewInstance.destroy();
        }
      },
    },
  });
}
