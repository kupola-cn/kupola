// SPDX-License-Identifier: MIT
/**
 * @kupola/router — Router view directive for rendering matched components.
 *
 * @module view
 */

import { useRouter } from './router-context.js';
import { applyTransition, createTransitionManager } from './transition.js';
import {
  getCurrentProvideContext,
  render,
  registerDirective,
  runWithProvideContext,
  walk,
} from '@kupola/platform';

/**
 * Router view directive class.
 */
export class RouterViewDirective {
  constructor(el, binding) {
    this.el = el;
    this.binding = binding || {};
    this.router = useRouter();
    this.viewName = this.binding.value || 'default';
    const parentElement = el.parentElement?.closest?.('[k-router-view]');
    const parentView = parentElement?._routerViewInstance;
    this.depth = parentView?.router === this.router
      ? parentView.depth + 1
      : Number.isInteger(Number(this.binding.depth))
        ? Math.max(0, Number(this.binding.depth))
        : 0;
    this.transitionManager = createTransitionManager(el, this.binding);
    this.unsubscribe = null;
    this.currentView = null;
    this.renderToken = 0;
    this.destroyed = false;
    this.transitionController = null;
    this.nestedWalks = [];
    this.provideContext = getCurrentProvideContext();

    this.init();
  }

  init() {
    if (this.router) {
      this.renderSafely();
      this.unsubscribe = this.router.afterEach(() => {
        this.renderSafely();
      });
    }
  }

  renderSafely() {
    void this.render().catch(error => {
      if (!this.destroyed) {
        console.error('[kupola/router] Router view render failed:', error);
      }
    });
  }

  destroyNestedWalks() {
    let firstError;
    for (const walkInstance of this.nestedWalks.splice(0)) {
      try {
        walkInstance.destroy();
      } catch (error) {
        if (!firstError) {firstError = error;}
      }
    }
    if (firstError) {throw firstError;}
  }

  mountNestedWalks() {
    const walks = [];
    try {
      for (const child of [ ...this.el.children ]) {
        const walkInstance = runWithProvideContext(
          this.provideContext,
          () => walk(child),
        );
        walks.push(walkInstance);
      }
      this.nestedWalks = walks;
    } catch (error) {
      for (const walkInstance of walks) {walkInstance.destroy();}
      throw error;
    }
  }

  async render() {
    if (this.destroyed || !this.router || !this.router.currentRoute) {return;}
    const token = ++this.renderToken;
    this.transitionController?.abort();
    this.transitionController = null;

    const route = this.router.currentRoute;
    const matched = route.matched;

    if (matched.length === 0) {return;}

    const record = matched[this.depth];
    if (!record) {
      this.destroyNestedWalks();
      this.currentView?.destroy?.();
      this.currentView = null;
      this.el.textContent = '';
      return;
    }
    const routeTransition = {
      ...(this.router.options?.transition || {}),
      ...(record.transition || {}),
      ...this.transitionManager.getOverrides(),
    };

    let component = record.component;
    if (record.components) {
      component = record.components[this.viewName] || (
        this.viewName === 'default' ? record.components.default : component
      );
    }

    if (!component) {return;}

    // Resolve async components before removing the current view. A failed or
    // superseded load must not leave the outlet blank.
    const componentFn = component.default || component;
    const templateResult = await runWithProvideContext(this.provideContext, () => componentFn());
    if (this.destroyed || token !== this.renderToken) {return;}

    const transitionController = typeof AbortController === 'function'
      ? new AbortController()
      : null;
    this.transitionController = transitionController;
    const transitionSignal = transitionController?.signal;

    try {
      this.destroyNestedWalks();
      while (this.el.firstChild) {
        const currentContent = this.el.firstChild;
        if (currentContent.nodeType === 1) {
          await applyTransition(currentContent, 'leave', routeTransition, transitionSignal);
        }
        if (this.destroyed || token !== this.renderToken) {return;}
        currentContent.remove();
      }

      this.currentView?.destroy?.();
      this.currentView = null;

      if (templateResult && typeof templateResult === 'object') {
        this.currentView = runWithProvideContext(
          this.provideContext,
          () => render(templateResult, this.el),
        );
      } else if (typeof templateResult === 'string') {
        this.el.innerHTML = templateResult;
      }

      this.mountNestedWalks();

      if (this.destroyed || token !== this.renderToken) {return;}
      await Promise.all([ ...this.el.children ].map(element => {
        return applyTransition(element, 'enter', routeTransition, transitionSignal);
      }));
    } finally {
      if (this.transitionController === transitionController) {
        this.transitionController = null;
      }
    }
  }

  destroy() {
    this.destroyed = true;
    this.renderToken += 1;
    this.transitionController?.abort();
    this.transitionController = null;
    this.destroyNestedWalks();
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this.currentView?.destroy?.();
    this.currentView = null;
    this.el.textContent = '';
    this.transitionManager.destroy();
  }

  update(newBinding) {
    this.binding = newBinding || {};
    this.viewName = this.binding.value || 'default';
    this.renderSafely();
  }
}

/**
 * Register router view directive.
 */
export function registerRouterViewDirective() {
  registerDirective('k-router-view', {
    mount(el, binding) {
      const instance = new RouterViewDirective(el, binding);
      el._routerViewInstance = instance;
      return instance;
    },
    update(el, binding) {
      if (el._routerViewInstance) {
        el._routerViewInstance.update(binding);
      }
    },
    unmount(el) {
      if (el._routerViewInstance) {
        el._routerViewInstance.destroy();
        delete el._routerViewInstance;
      }
    },
  });
}
