import { useRouter } from './router.js';
import { applyTransition, createTransitionManager } from './transition.js';
import { render, registerDirective } from '@kupola/platform';

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
    
    while (this.el.firstChild) {
      const currentContent = this.el.firstChild;
      await applyTransition(currentContent, 'leave', lastRecord.transition);
      currentContent.remove();
    }
    
    const componentFn = component.default || component;
    const templateResult = componentFn();
    
    if (templateResult && typeof templateResult === 'object') {
      render(templateResult, this.el);
    } else if (typeof templateResult === 'string') {
      this.el.innerHTML = templateResult;
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

export function registerRouterViewDirective() {
  registerDirective('k-router-view', {
    mount(el, binding) {
      return new RouterViewDirective(el, binding);
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
  });
}
