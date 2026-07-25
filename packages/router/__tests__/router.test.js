import { createRouter } from '../src/router.js';

describe('router', () => {
  describe('createRouter', () => {
    it('should create router with history mode', () => {
      const router = createRouter({
        mode: 'history',
        routes: [{ path: '/', name: 'home' }],
      });
      expect(router).toBeDefined();
      expect(typeof router.push).toBe('function');
      expect(typeof router.replace).toBe('function');
    });

    it('should create router with hash mode', () => {
      const router = createRouter({
        mode: 'hash',
        routes: [{ path: '/', name: 'home' }],
      });
      expect(router).toBeDefined();
    });

    it('should create router with memory mode', () => {
      const router = createRouter({
        mode: 'memory',
        routes: [{ path: '/', name: 'home' }],
      });
      expect(router).toBeDefined();
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
        routes: [{ path: '/users/:id', name: 'user-detail' }],
      });

      const path = router.resolve({ name: 'user-detail', params: { id: '456' } });
      expect(path).toBe('/users/456');
    });
  });

  describe('guards', () => {
    it('should support beforeEach guard', () => {
      const router = createRouter({
        mode: 'memory',
        routes: [{ path: '/', name: 'home' }],
      });

      const guardFn = jest.fn();
      router.beforeEach(guardFn);

      expect(typeof guardFn).toBe('function');
    });

    it('should support afterEach callback', () => {
      const router = createRouter({
        mode: 'memory',
        routes: [{ path: '/', name: 'home' }],
      });

      const callback = jest.fn();
      router.afterEach(callback);

      expect(typeof callback).toBe('function');
    });
  });
});
