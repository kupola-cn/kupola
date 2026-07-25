import { createHttpGuard } from '../src/http-guard.js';

describe('http-guard', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  describe('createHttpGuard', () => {
    it('should create HTTP guard with methods', () => {
      const guard = createHttpGuard();

      expect(typeof guard.get).toBe('function');
      expect(typeof guard.post).toBe('function');
      expect(typeof guard.put).toBe('function');
      expect(typeof guard.patch).toBe('function');
      expect(typeof guard.delete).toBe('function');
      expect(typeof guard.request).toBe('function');
    });

    it('should make GET request', async () => {
      global.fetch.mockResolvedValueOnce({ status: 200, json: () => ({ data: [] }) });

      const guard = createHttpGuard();
      const response = await guard.get('/api/users');

      expect(fetch).toHaveBeenCalledWith('/api/users', expect.objectContaining({ method: 'GET' }));
      expect(response.status).toBe(200);
    });

    it('should make POST request', async () => {
      global.fetch.mockResolvedValueOnce({ status: 201, json: () => ({ id: '1' }) });

      const guard = createHttpGuard();
      const response = await guard.post('/api/users', { name: 'Test' });

      expect(fetch).toHaveBeenCalledWith('/api/users', expect.objectContaining({ method: 'POST' }));
      expect(response.status).toBe(201);
    });

    it('should make PUT request', async () => {
      global.fetch.mockResolvedValueOnce({ status: 200, json: () => ({ id: '1' }) });

      const guard = createHttpGuard();
      const response = await guard.put('/api/users/1', { name: 'Updated' });

      expect(fetch).toHaveBeenCalledWith('/api/users/1', expect.objectContaining({ method: 'PUT' }));
      expect(response.status).toBe(200);
    });

    it('should make DELETE request', async () => {
      global.fetch.mockResolvedValueOnce({ status: 204 });

      const guard = createHttpGuard();
      const response = await guard.delete('/api/users/1');

      expect(fetch).toHaveBeenCalledWith('/api/users/1', expect.objectContaining({ method: 'DELETE' }));
      expect(response.status).toBe(204);
    });
  });

  describe('beforeRequest interceptor', () => {
    it('should call beforeRequest interceptor', async () => {
      global.fetch.mockResolvedValueOnce({ status: 200 });

      const beforeRequest = jest.fn((config) => config);
      const guard = createHttpGuard({ beforeRequest });

      await guard.get('/api/users');

      expect(beforeRequest).toHaveBeenCalled();
    });

    it('should modify request config via interceptor', async () => {
      global.fetch.mockResolvedValueOnce({ status: 200 });

      const guard = createHttpGuard({
        beforeRequest: (config) => ({
          ...config,
          headers: { 'X-Custom-Header': 'test' },
        }),
      });

      await guard.get('/api/users');

      expect(fetch).toHaveBeenCalledWith('/api/users', expect.objectContaining({
        headers: { 'X-Custom-Header': 'test' },
      }));
    });

    it('should throw error when permission denied', async () => {
      const onPermissionDenied = jest.fn();

      const guard = createHttpGuard({
        beforeRequest: () => {
          throw new Error('PERMISSION_DENIED');
        },
        onPermissionDenied,
      });

      await expect(guard.get('/api/users')).rejects.toThrow('PERMISSION_DENIED');
      expect(onPermissionDenied).toHaveBeenCalled();
    });
  });

  describe('afterResponse interceptor', () => {
    it('should call afterResponse interceptor', async () => {
      global.fetch.mockResolvedValueOnce({ status: 200 });

      const afterResponse = jest.fn((response) => response);
      const guard = createHttpGuard({ afterResponse });

      await guard.get('/api/users');

      expect(afterResponse).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should call onUnauthorized for 401', async () => {
      global.fetch.mockResolvedValueOnce({ status: 401 });

      const onUnauthorized = jest.fn();
      const guard = createHttpGuard({ onUnauthorized });

      await guard.get('/api/users');

      expect(onUnauthorized).toHaveBeenCalled();
    });

    it('should call onPermissionDenied for 403', async () => {
      global.fetch.mockResolvedValueOnce({ status: 403 });

      const onPermissionDenied = jest.fn();
      const guard = createHttpGuard({ onPermissionDenied });

      await guard.get('/api/users');

      expect(onPermissionDenied).toHaveBeenCalled();
    });
  });

  describe('custom interceptors', () => {
    it('should use custom request interceptors', async () => {
      global.fetch.mockResolvedValueOnce({ status: 200 });

      const interceptor1 = jest.fn((config) => config);
      const interceptor2 = jest.fn((config) => config);

      const guard = createHttpGuard({
        interceptors: {
          request: [interceptor1, interceptor2],
        },
      });

      await guard.get('/api/users');

      expect(interceptor1).toHaveBeenCalled();
      expect(interceptor2).toHaveBeenCalled();
    });

    it('should use custom response interceptors', async () => {
      global.fetch.mockResolvedValueOnce({ status: 200 });

      const interceptor1 = jest.fn((response) => response);
      const interceptor2 = jest.fn((response) => response);

      const guard = createHttpGuard({
        interceptors: {
          response: [interceptor1, interceptor2],
        },
      });

      await guard.get('/api/users');

      expect(interceptor1).toHaveBeenCalled();
      expect(interceptor2).toHaveBeenCalled();
    });
  });
});