import { createRouteRecord, flattenRoutes, matchRoute, resolvePath } from '../src/matcher.js';

describe('matcher', () => {
  describe('createRouteRecord', () => {
    it('should create route record with regex', () => {
      const route = { path: '/users/:id', name: 'user-detail' };
      const record = createRouteRecord(route);
      expect(record.path).toBe('/users/:id');
      expect(record.name).toBe('user-detail');
      expect(record.regex).toBeDefined();
      expect(record.paramNames).toEqual(['id']);
    });

    it('should handle optional params', () => {
      const route = { path: '/search/:keyword?' };
      const record = createRouteRecord(route);
      expect(record.paramNames).toEqual(['keyword']);
    });

    it('should handle wildcard routes', () => {
      const route = { path: '*', name: 'not-found' };
      const record = createRouteRecord(route);
      expect(record.regex.source).toContain('.*');
    });
  });

  describe('flattenRoutes', () => {
    it('should flatten nested routes', () => {
      const routes = [
        { path: '/', name: 'home' },
        {
          path: '/dashboard',
          name: 'dashboard',
          children: [
            { path: '', name: 'dashboard-home' },
            { path: 'settings', name: 'dashboard-settings' },
          ],
        },
      ];
      const records = flattenRoutes(routes);
      expect(records.length).toBe(4);
      expect(records[0].path).toBe('/');
      expect(records[1].path).toBe('/dashboard');
      expect(records[2].path).toBe('/dashboard');
      expect(records[3].path).toBe('/dashboard/settings');
    });
  });

  describe('matchRoute', () => {
    it('should match exact path', () => {
      const routes = [{ path: '/users', name: 'users' }];
      const records = flattenRoutes(routes);
      const match = matchRoute(records, '/users');
      expect(match).not.toBeNull();
      expect(match.name).toBe('users');
    });

    it('should match dynamic params', () => {
      const routes = [{ path: '/users/:id', name: 'user-detail' }];
      const records = flattenRoutes(routes);
      const match = matchRoute(records, '/users/123');
      expect(match).not.toBeNull();
      expect(match.params).toEqual({ id: '123' });
    });

    it('should match nested routes', () => {
      const routes = [
        {
          path: '/dashboard',
          name: 'dashboard',
          children: [{ path: 'settings', name: 'dashboard-settings' }],
        },
      ];
      const records = flattenRoutes(routes);
      const match = matchRoute(records, '/dashboard/settings');
      expect(match).not.toBeNull();
      expect(match.name).toBe('dashboard-settings');
      expect(match.matched.length).toBe(2);
    });

    it('should match wildcard', () => {
      const routes = [{ path: '*', name: 'not-found' }];
      const records = flattenRoutes(routes);
      const match = matchRoute(records, '/unknown/path');
      expect(match).not.toBeNull();
      expect(match.name).toBe('not-found');
    });

    it('should return null for no match', () => {
      const routes = [{ path: '/users', name: 'users' }];
      const records = flattenRoutes(routes);
      const match = matchRoute(records, '/posts');
      expect(match).toBeNull();
    });
  });

  describe('resolvePath', () => {
    it('should resolve path with params', () => {
      const routes = [{ path: '/users/:id', name: 'user-detail' }];
      const records = flattenRoutes(routes);
      const path = resolvePath(records, { path: '/users/:id', params: { id: '123' } });
      expect(path).toBe('/users/123');
    });

    it('should resolve by name', () => {
      const routes = [{ path: '/users/:id', name: 'user-detail' }];
      const records = flattenRoutes(routes);
      const path = resolvePath(records, { name: 'user-detail', params: { id: '456' } });
      expect(path).toBe('/users/456');
    });
  });
});
