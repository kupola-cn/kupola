import { createRouter } from '../src/router.js';
import { setCurrentRouter } from '../src/router-context.js';
import { RouterLinkDirective } from '../src/link.js';
import { RouterViewDirective, registerRouterViewDirective } from '../src/view.js';
import { html } from '../../platform/src/template.js';

describe('router directives', () => {
  beforeEach(() => {
    window.scrollTo = jest.fn();
  });

  afterEach(() => {
    setCurrentRouter(null);
  });

  it('matches active links on route boundaries and object locations', async () => {
    const router = createRouter({
      mode: 'memory',
      routes: [
        { path: '/', name: 'home' },
        { path: '/users', name: 'users' },
        { path: '/users/:id', name: 'user' },
        { path: '/users-other', name: 'other' },
      ],
    });
    await router.push('/users/42');
    setCurrentRouter(router);

    const nested = document.createElement('a');
    const nestedDirective = new RouterLinkDirective(nested, { value: '/users' });
    expect(nested.classList.contains('router-link-active')).toBe(true);

    nestedDirective.update({ value: '/users-other' });
    expect(nested.classList.contains('router-link-active')).toBe(false);

    const objectLink = document.createElement('a');
    const objectDirective = new RouterLinkDirective(objectLink, {
      value: { name: 'user', params: { id: '42' } },
    });
    expect(objectLink.classList.contains('router-link-active')).toBe(true);

    nestedDirective.destroy();
    objectDirective.destroy();
    router.destroy();
  });

  it('does not intercept modified or non-primary clicks', async () => {
    const router = createRouter({
      mode: 'memory',
      routes: [ { path: '/', name: 'home' }, { path: '/next', name: 'next' } ],
    });
    await router.push('/');
    setCurrentRouter(router);
    const el = document.createElement('a');
    const directive = new RouterLinkDirective(el, { value: '/next' });

    const modified = new MouseEvent('click', { bubbles: true, button: 1 });
    el.dispatchEvent(modified);
    expect(router.currentRoute.path).toBe('/');

    const primary = new MouseEvent('click', { bubbles: true, button: 0 });
    await directive.handleClick(primary);
    expect(router.currentRoute.path).toBe('/next');

    directive.destroy();
    router.destroy();
  });

  it('awaits async route components before rendering', async () => {
    const router = createRouter({
      mode: 'memory',
      routes: [ {
        path: '/',
        name: 'home',
        component: async () => '<p>async view</p>',
      } ],
    });
    await router.push('/');
    setCurrentRouter(router);
    const el = document.createElement('div');
    const directive = new RouterViewDirective(el, {});

    await new Promise(resolve => setTimeout(resolve, 0));
    expect(el.innerHTML).toBe('<p>async view</p>');

    directive.destroy();
    router.destroy();
  });

  it('renders nested route records into nested router views', async () => {
    registerRouterViewDirective();
    const router = createRouter({
      mode: 'memory',
      routes: [ {
        path: '/layout',
        name: 'layout',
        component: () => html`<section data-layout><div k-router-view></div></section>`,
        children: [ {
          path: 'child',
          name: 'child',
          component: () => html`<p data-child>child</p>`,
        } ],
      } ],
    });
    await router.push('/layout/child');
    setCurrentRouter(router);

    const el = document.createElement('div');
    el.setAttribute('k-router-view', '');
    const directive = new RouterViewDirective(el, {});
    el._routerViewInstance = directive;

    await new Promise(resolve => setTimeout(resolve, 0));
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(el.querySelector('[data-layout]')).not.toBeNull();
    expect(el.querySelector('[data-child]')?.textContent).toBe('child');

    directive.destroy();
    router.destroy();
  });

  it('does not let a stale async component replace a newer route', async () => {
    let resolveStale;
    const router = createRouter({
      mode: 'memory',
      routes: [
        {
          path: '/stale',
          name: 'stale',
          component: () => new Promise(resolve => { resolveStale = resolve; }),
        },
        {
          path: '/current',
          name: 'current',
          component: async () => '<p>current view</p>',
        },
      ],
    });
    await router.push('/stale');
    setCurrentRouter(router);
    const el = document.createElement('div');
    const directive = new RouterViewDirective(el, {});

    await router.push('/current');
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(el.innerHTML).toBe('<p>current view</p>');

    resolveStale('<p>stale view</p>');
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(el.innerHTML).toBe('<p>current view</p>');

    directive.destroy();
    router.destroy();
  });

  it('applies router-level enter transitions when a route has none', async () => {
    const onEnter = jest.fn((element, done) => {
      expect(element).toBeInstanceOf(HTMLElement);
      done();
    });
    const router = createRouter({
      mode: 'memory',
      transition: { onEnter },
      routes: [ {
        path: '/',
        name: 'home',
        component: async () => '<p>home</p>',
      } ],
    });
    await router.push('/');
    setCurrentRouter(router);
    const el = document.createElement('div');
    const directive = new RouterViewDirective(el, {});

    await new Promise(resolve => setTimeout(resolve, 0));
    expect(onEnter).toHaveBeenCalledTimes(1);

    directive.destroy();
    router.destroy();
  });

  it('does not delay views when no transition duration is configured', async () => {
    const router = createRouter({
      mode: 'memory',
      routes: [ {
        path: '/',
        name: 'home',
        component: async () => '<p>home</p>',
      } ],
    });
    await router.push('/');
    setCurrentRouter(router);
    const el = document.createElement('div');
    const directive = new RouterViewDirective(el, {});

    await new Promise(resolve => setTimeout(resolve, 0));
    expect(el.innerHTML).toBe('<p>home</p>');

    directive.destroy();
    router.destroy();
  });

  it('releases its transition controller when a transition hook fails', async () => {
    const failure = new Error('transition failed');
    const router = createRouter({
      mode: 'memory',
      transition: { onEnter: () => {throw failure;} },
      routes: [ {
        path: '/',
        name: 'home',
        component: async () => '<p>home</p>',
      } ],
    });
    await router.push('/');
    setCurrentRouter(null);
    const el = document.createElement('div');
    const directive = new RouterViewDirective(el, {});
    directive.router = router;

    await expect(directive.render()).rejects.toBe(failure);
    expect(directive.transitionController).toBeNull();

    directive.destroy();
    router.destroy();
  });
});
