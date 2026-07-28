import { createRouter, initRouter, installRouter } from '../src/router.js';
import { setupAuthGuard } from '../src/auth.js';
import { GuardPipeline, Navigation } from '../src/navigation.js';
import { HashHistory } from '../src/hash.js';
import {
  clearCurrentRouter,
  provideRouter,
  setCurrentRouter,
  useRouter,
} from '../src/router-context.js';
import {
  createProvideContext,
  disposeProvideContext,
  runWithProvideContext,
} from '../../platform/src/context.js';

describe('router', () => {
  beforeEach(() => {
    window.scrollTo = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    window.history.replaceState({}, '', '/');
    window.location.hash = '';
  });

  describe('createRouter', () => {
    it('should create router with history mode', () => {
      const router = createRouter({
        mode: 'history',
        routes: [ { path: '/', name: 'home' } ],
      });
      expect(router).toBeDefined();
      expect(typeof router.push).toBe('function');
      expect(typeof router.replace).toBe('function');
    });

    it('should create router with hash mode', () => {
      const router = createRouter({
        mode: 'hash',
        routes: [ { path: '/', name: 'home' } ],
      });
      expect(router).toBeDefined();
    });

    it('should create router with memory mode', () => {
      const router = createRouter({
        mode: 'memory',
        routes: [ { path: '/', name: 'home' } ],
      });
      expect(router).toBeDefined();
    });

    it('should isolate routers by application context', () => {
      const routerA = createRouter({ mode: 'memory', routes: [ { path: '/', name: 'a' } ] });
      const routerB = createRouter({ mode: 'memory', routes: [ { path: '/', name: 'b' } ] });
      const contextA = createProvideContext();
      const contextB = createProvideContext();

      runWithProvideContext(contextA, () => provideRouter(routerA));
      runWithProvideContext(contextB, () => provideRouter(routerB));

      expect(runWithProvideContext(contextA, useRouter)).toBe(routerA);
      expect(runWithProvideContext(contextB, useRouter)).toBe(routerB);

      disposeProvideContext(contextA);
      disposeProvideContext(contextB);
    });

    it('should retain the legacy router fallback outside an application context', () => {
      const router = createRouter({ mode: 'memory', routes: [ { path: '/', name: 'home' } ] });

      setCurrentRouter(router);
      expect(useRouter()).toBe(router);
      clearCurrentRouter(router);
      expect(useRouter()).toBeNull();
    });
  });

  describe('router plugin lifecycle', () => {
    it('should reject null options with an explicit error', () => {
      const router = createRouter({ mode: 'memory', routes: [ { path: '/', name: 'home' } ] });

      expect(() => installRouter(router, null)).toThrow(/options object/);
      expect(() => initRouter(null)).toThrow(/options object/);
      expect(() => setupAuthGuard(router, null)).toThrow(/options object/);
      router.destroy();
    });

    it('should not allow initRouter auth to omit its context provider', () => {
      const plugin = initRouter({
        mode: 'memory',
        routes: [ { path: '/', name: 'home' } ],
        auth: true,
      });

      expect(() => plugin.install()).toThrow(/authContext/);
      plugin.destroy();
    });

    it('should return the router initialization promise from the plugin', async () => {
      const plugin = initRouter({
        mode: 'memory',
        routes: [ { path: '/', name: 'home' } ],
      });

      await expect(plugin.init()).resolves.toBe(true);
      plugin.destroy();
    });
  });

  describe('navigation', () => {
    it('should match routes', () => {
      const router = createRouter({
        mode: 'memory',
        routes: [
          { path: '/', name: 'home' },
          { path: '/users/:id', name: 'user-detail' },
        ],
      });

      const match = router.match('/users/123');
      expect(match).not.toBeNull();
      expect(match.name).toBe('user-detail');
      expect(match.params.id).toBe('123');
    });

    it('should resolve paths', () => {
      const router = createRouter({
        mode: 'memory',
        routes: [ { path: '/users/:id', name: 'user-detail' } ],
      });

      const path = router.resolve({ name: 'user-detail', params: { id: '456' } });
      expect(path).toBe('/users/456');
    });

    it('should include query parameters when resolving a location', () => {
      const router = createRouter({
        mode: 'memory',
        routes: [ { path: '/users', name: 'users' } ],
      });

      expect(router.resolve({ name: 'users', query: { page: '2' } })).toBe('/users?page=2');
    });

    it('should preserve query passed to push options', async () => {
      const router = createRouter({
        mode: 'memory',
        routes: [ { path: '/users', name: 'users' } ],
      });

      await router.push('/users', { query: { page: '2', q: 'kupola' } });

      expect(router.currentRoute.fullPath).toBe('/users?page=2&q=kupola');
      expect(router.currentRoute.query).toEqual({ page: '2', q: 'kupola' });
    });

    it('should preserve repeated query values in memory history', async () => {
      const router = createRouter({
        mode: 'memory',
        routes: [ { path: '/users', name: 'users' } ],
      });

      await router.push('/users', { query: { tag: [ 'a', 'b' ] } });

      expect(router.currentRoute.fullPath).toBe('/users?tag=a&tag=b');
      expect(router.currentRoute.query).toEqual({ tag: [ 'a', 'b' ] });
      router.destroy();
    });

    it('should not append a trailing question mark for empty query objects', async () => {
      const router = createRouter({
        mode: 'memory',
        routes: [ { path: '/users', name: 'users' } ],
      });

      await router.push('/users');

      expect(router.currentRoute.fullPath).toBe('/users');
    });

    it('should treat navigation to the current location as a no-op', async () => {
      const router = createRouter({
        mode: 'memory',
        routes: [ { path: '/', name: 'home' }, { path: '/users', name: 'users' } ],
      });
      const guard = jest.fn();
      const afterEach = jest.fn();
      router.beforeEach(guard);
      router.afterEach(afterEach);

      await router.init();
      await router.push('/users');
      expect(await router.push('/users')).toBe(false);

      expect(guard).toHaveBeenCalledTimes(2);
      expect(afterEach).toHaveBeenCalledTimes(2);
      router.destroy();
    });

    it('should keep a committed navigation successful when scroll behavior fails', async () => {
      const error = new Error('scroll failed');
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const router = createRouter({
        mode: 'memory',
        scrollBehavior: () => { throw error; },
        routes: [ { path: '/', name: 'home' }, { path: '/next', name: 'next' } ],
      });

      await expect(router.push('/next')).resolves.toBe(true);
      expect(router.currentRoute.path).toBe('/next');
      expect(consoleSpy).toHaveBeenCalledWith('[kupola/router] Scroll behavior failed:', error);

      consoleSpy.mockRestore();
      router.destroy();
    });

    it('should preserve host history state when restoring a hash route', () => {
      window.history.replaceState({ hostState: 'keep-me' }, '', '/');
      const history = new HashHistory();

      history.replace('/restored');

      expect(window.history.state).toEqual({ hostState: 'keep-me' });
    });

    it('should apply the history base to browser URLs', async () => {
      window.history.replaceState({}, '', '/app/users?tab=active');
      const router = createRouter({
        mode: 'history',
        base: '/app',
        routes: [
          { path: '/users', name: 'users' },
          { path: '/settings', name: 'settings' },
        ],
      });

      await router.init();
      expect(router.currentRoute.fullPath).toBe('/users?tab=active');

      await router.push('/settings');
      expect(window.location.pathname).toBe('/app/settings');
      router.destroy();
    });

    it('should normalize history bases without a leading slash', async () => {
      window.history.replaceState({}, '', '/app/users');
      const router = createRouter({
        mode: 'history',
        base: 'app/',
        routes: [ { path: '/users', name: 'users' }, { path: '/settings', name: 'settings' } ],
      });

      await router.init();
      await router.push('/settings');

      expect(window.location.pathname).toBe('/app/settings');
      router.destroy();
    });

    it('should preserve query parameters in auth redirects', async () => {
      const router = createRouter({
        mode: 'memory',
        routes: [
          { path: '/login', name: 'login' },
          { path: '/private', name: 'private', meta: { requiresAuth: true } },
        ],
      });
      const unsubscribe = setupAuthGuard(router, { authContext: null });

      await expect(router.push('/private')).resolves.toBe(true);
      expect(router.currentRoute.fullPath).toBe('/login?redirect=%2Fprivate');
      expect(router.currentRoute.query).toEqual({ redirect: '/private' });

      unsubscribe();
      router.destroy();
    });

    it('should treat a numeric zero user id as authenticated', async () => {
      const router = createRouter({
        mode: 'memory',
        routes: [
          { path: '/login', name: 'login' },
          { path: '/private', name: 'private', meta: { requiresAuth: true } },
        ],
      });
      const unsubscribe = setupAuthGuard(router, { authContext: { user: { id: 0 } } });

      await expect(router.push('/private')).resolves.toBe(true);
      expect(router.currentRoute.path).toBe('/private');

      unsubscribe();
      router.destroy();
    });

    it('should apply auth metadata inherited from parent records', async () => {
      const router = createRouter({
        mode: 'memory',
        routes: [
          {
            path: '/admin',
            meta: { requiresAuth: true },
            children: [ { path: 'dashboard', name: 'dashboard' } ],
          },
          { path: '/login', name: 'login' },
        ],
      });
      const unsubscribe = setupAuthGuard(router, { authContext: null });

      await expect(router.push('/admin/dashboard')).resolves.toBe(true);

      expect(router.currentRoute.fullPath).toBe('/login?redirect=%2Fadmin%2Fdashboard');
      unsubscribe();
      router.destroy();
    });

    it('should stop redirect loops without overflowing the stack', async () => {
      const router = createRouter({
        mode: 'memory',
        routes: [
          { path: '/a', name: 'a' },
          { path: '/b', name: 'b' },
        ],
      });
      const errors = [];
      router.onError(error => errors.push(error));
      router.beforeEach(to => (to.path === '/a' ? { path: '/b' } : { path: '/a' }));

      await expect(router.push('/a')).rejects.toThrow(/maximum of 20 redirects/);

      expect(router.currentRoute).toBeNull();
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toMatch(/maximum of 20 redirects/);
      router.destroy();
    });

    it('should preserve the attempted target when redirecting from a public route', async () => {
      const router = createRouter({
        mode: 'memory',
        routes: [
          { path: '/', name: 'home' },
          { path: '/login', name: 'login' },
          { path: '/private', name: 'private', meta: { requiresAuth: true } },
        ],
      });
      const unsubscribe = setupAuthGuard(router, { authContext: null });

      await router.push('/');
      await router.push('/private');

      expect(router.currentRoute.fullPath).toBe('/login?redirect=%2Fprivate');
      unsubscribe();
      router.destroy();
    });

    it('should resolve auth context dynamically for every navigation', async () => {
      let auth = null;
      const router = createRouter({
        mode: 'memory',
        routes: [
          { path: '/login', name: 'login' },
          { path: '/private', name: 'private', meta: { requiresAuth: true } },
        ],
      });
      const unsubscribe = setupAuthGuard(router, { authContext: () => auth });

      await router.push('/private');
      expect(router.currentRoute.path).toBe('/login');

      auth = { isAuthenticated: true, user: { id: '1' } };
      await router.push('/private');
      expect(router.currentRoute.path).toBe('/private');

      unsubscribe();
      router.destroy();
    });

    it('should redirect the current route when auth changes', async () => {
      let auth = { isAuthenticated: true, user: { id: '1' } };
      const listeners = new Set();
      const router = createRouter({
        mode: 'memory',
        routes: [
          { path: '/login', name: 'login' },
          { path: '/private', name: 'private', meta: { requiresAuth: true } },
        ],
      });
      const unsubscribe = setupAuthGuard(router, {
        authContext: () => auth,
        onAuthChange(listener) {
          listeners.add(listener);
          return () => listeners.delete(listener);
        },
      });

      await router.push('/private');
      auth = null;
      for (const listener of listeners) {
        listener(auth);
      }
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(router.currentRoute.fullPath).toBe('/login?redirect=%2Fprivate');
      unsubscribe();
      router.destroy();
    });

    it('should fail fast when auth is enabled without an auth context provider', () => {
      const router = createRouter({
        mode: 'memory',
        routes: [ { path: '/', name: 'home' } ],
      });

      expect(() => installRouter(router, { auth: true })).toThrow(/authContext/);
      router.destroy();
    });

    it('should reject setup without an auth context provider', () => {
      const router = createRouter({
        mode: 'memory',
        routes: [ { path: '/', name: 'home' } ],
      });

      expect(() => setupAuthGuard(router)).toThrow(/authContext/);
      router.destroy();
    });

    it('should redirect unmatched paths to the configured not-found route', async () => {
      const router = createRouter({
        mode: 'memory',
        routes: [
          { path: '/', name: 'home' },
          { path: '/404', name: 'not-found' },
        ],
      });
      const unsubscribe = setupAuthGuard(router, {
        authContext: null,
        notFoundPath: '/404',
      });

      await expect(router.push('/missing')).resolves.toBe(false);
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(router.currentRoute.fullPath).toBe('/404');
      unsubscribe();
      router.destroy();
    });
  });

  describe('guards', () => {
    it('should make repeated next calls idempotent', async () => {
      const pipeline = new GuardPipeline();
      const navigation = new Navigation({
        id: 1,
        from: null,
        to: { path: '/next' },
        replace: false,
        shouldRestoreHash: false,
      });
      const downstream = jest.fn();

      pipeline.use('beforeEach', async (_navigation, next) => {
        await next();
        await next();
      });
      pipeline.use('beforeResolve', async (_navigation, next) => {
        downstream();
        await next();
      });

      await pipeline.execute(navigation);

      expect(downstream).toHaveBeenCalledTimes(1);
    });

    it('should reject invalid guards during registration', () => {
      const router = createRouter({
        mode: 'memory',
        routes: [ { path: '/', name: 'home' } ],
      });

      expect(() => router.beforeEach(null)).toThrow(/guard must be a function/);
      expect(() => router.beforeResolve('invalid')).toThrow(/guard must be a function/);
      router.destroy();
    });

    it('should support beforeEach guard', () => {
      const router = createRouter({
        mode: 'memory',
        routes: [ { path: '/', name: 'home' } ],
      });

      const guardFn = jest.fn();
      router.beforeEach(guardFn);

      expect(typeof guardFn).toBe('function');
    });

    it('should support afterEach callback', () => {
      const router = createRouter({
        mode: 'memory',
        routes: [ { path: '/', name: 'home' } ],
      });

      const callback = jest.fn();
      router.afterEach(callback);

      expect(typeof callback).toBe('function');
    });

    it('should run leave guards before global and enter guards', async () => {
      const order = [];
      const router = createRouter({
        mode: 'memory',
        routes: [
          {
            path: '/from',
            name: 'from',
            beforeLeave() {
              order.push('leave');
            },
          },
          {
            path: '/to',
            name: 'to',
            beforeEnter() {
              order.push('enter');
            },
          },
        ],
      });
      router.beforeEach(() => {
        order.push('global');
      });

      await router.push('/from');
      order.length = 0;
      await router.push('/to');

      expect(order).toEqual([ 'leave', 'global', 'enter' ]);
    });

    it('should not run guards for records reused by the next route', async () => {
      const order = [];
      const router = createRouter({
        mode: 'memory',
        routes: [ {
          path: '/parent',
          name: 'parent',
          beforeLeave() {
            order.push('parent-leave');
          },
          children: [
            {
              path: 'a',
              name: 'a',
              beforeLeave() {
                order.push('a-leave');
              },
            },
            {
              path: 'b',
              name: 'b',
              beforeEnter() {
                order.push('b-enter');
              },
            },
          ],
        } ],
      });

      await router.push('/parent/a');
      order.length = 0;
      await router.push('/parent/b');

      expect(order).toEqual([ 'a-leave', 'b-enter' ]);
      router.destroy();
    });

    it('should not run a duplicate navigation for its own hashchange', async () => {
      const router = createRouter({
        mode: 'hash',
        routes: [
          { path: '/', name: 'home' },
          { path: '/about', name: 'about' },
        ],
      });
      const afterEach = jest.fn();
      router.afterEach(afterEach);
      await router.init();

      await router.push('/about');
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(router.currentRoute.fullPath).toBe('/about');
      expect(afterEach).toHaveBeenCalledTimes(2);
      router.destroy();
    });

    it('should cancel a stale asynchronous guard before it can commit', async () => {
      let release;
      const pending = new Promise(resolve => {
        release = resolve;
      });
      const router = createRouter({
        mode: 'memory',
        routes: [
          { path: '/', name: 'home' },
          { path: '/slow', name: 'slow' },
          { path: '/fast', name: 'fast' },
        ],
      });
      router.beforeEach(async to => {
        if (to.path === '/slow') {
          await pending;
        }
      });

      const slowNavigation = router.push('/slow');
      await Promise.resolve();
      await expect(router.push('/fast')).resolves.toBe(true);
      release();

      await expect(slowNavigation).resolves.toBe(false);
      expect(router.currentRoute.path).toBe('/fast');
      router.destroy();
    });

    it('should restore the target route scroll position on history back', async () => {
      Object.defineProperty(window, 'scrollX', { configurable: true, value: 12 });
      Object.defineProperty(window, 'scrollY', { configurable: true, value: 34 });
      const router = createRouter({
        mode: 'memory',
        routes: [
          { path: '/', name: 'home' },
          { path: '/a', name: 'a' },
          { path: '/b', name: 'b' },
        ],
      });

      await router.init();
      await router.push('/a');
      await router.push('/b');
      await router.push('/a');
      router.back();
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(window.scrollTo).toHaveBeenCalledWith(12, 34);
      router.destroy();
    });
  });

  describe('lifecycle', () => {
    it('should remove the same history listener that it added', async () => {
      const addSpy = jest.spyOn(window, 'addEventListener');
      const removeSpy = jest.spyOn(window, 'removeEventListener');
      const router = createRouter({
        mode: 'history',
        routes: [ { path: '/', name: 'home' } ],
      });

      await router.init();
      router.destroy();

      const added = addSpy.mock.calls.find(call => call[0] === 'popstate');
      const removed = removeSpy.mock.calls.find(call => call[0] === 'popstate');
      expect(added).toBeDefined();
      expect(removed).toBeDefined();
      expect(removed[1]).toBe(added[1]);
    });

    it('should make event unsubscriptions safe after destroy', async () => {
      const router = createRouter({
        mode: 'memory',
        routes: [ { path: '/', name: 'home' } ],
      });
      const unsubscribe = router.afterEach(jest.fn());

      router.destroy();

      expect(() => unsubscribe()).not.toThrow();
      await expect(router.push('/')).resolves.toBe(false);
    });

    it('should ignore history controls after destroy', async () => {
      const router = createRouter({
        mode: 'memory',
        routes: [ { path: '/', name: 'home' }, { path: '/next', name: 'next' } ],
      });
      await router.push('/next');
      router.destroy();

      expect(() => {
        router.back();
        router.forward();
        router.go(-1);
      }).not.toThrow();
      expect(router.currentRoute.path).toBe('/next');
    });
  });
});
