import { createHttpGuard } from '../src/http-guard.js';

describe('http-guard', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  describe('createHttpGuard', () => {
    it('should reject invalid options and interceptors', () => {
      expect(() => createHttpGuard(null)).toThrow(TypeError);
      expect(() => createHttpGuard({ interceptors: { request: [ null ] } })).toThrow(TypeError);
      expect(() => createHttpGuard({ interceptors: { request: {} } })).toThrow(TypeError);
      expect(() => createHttpGuard({ beforeRequest: true })).toThrow(TypeError);
      expect(() => createHttpGuard({ onUnauthorized: true })).toThrow(TypeError);
    });

    it('should reject invalid request configurations and interceptor results', async () => {
      const guard = createHttpGuard({
        beforeRequest: () => null,
      });

      await expect(guard.get('/api/users')).rejects.toThrow(/return an object/);
      await expect(guard.get('/api/users', [])).rejects.toThrow(/config must be an object/);
    });

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

    it('should preserve non-JSON request bodies', async () => {
      const body = new URLSearchParams({ name: 'Test' });
      global.fetch.mockResolvedValueOnce({ status: 200 });

      const guard = createHttpGuard();
      await guard.post('/api/users', body);

      expect(fetch).toHaveBeenCalledWith('/api/users', expect.objectContaining({ body }));
    });

    it('should keep request fields authoritative over fetchOptions', async () => {
      global.fetch.mockResolvedValueOnce({ status: 200 });

      await createHttpGuard().post('/api/users', { name: 'Test' }, {
        headers: { 'X-Request': 'request' },
        fetchOptions: {
          method: 'DELETE',
          body: 'wrong-body',
          headers: { 'X-Fetch': 'fetch' },
          credentials: 'include',
        },
      });

      expect(fetch).toHaveBeenCalledWith('/api/users', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'Test' }),
        headers: {
          'Content-Type': 'application/json',
          'X-Fetch': 'fetch',
          'X-Request': 'request',
        },
        credentials: 'include',
      }));
    });

    it('preserves Headers instances when merging request headers', async () => {
      global.fetch.mockResolvedValueOnce({ status: 200 });

      await createHttpGuard().get('/api/users', {
        fetchOptions: { headers: new Headers({ 'X-Fetch': 'yes' }) },
        headers: new Headers({ 'X-Request': 'yes' }),
      });

      expect(fetch).toHaveBeenCalledWith('/api/users', expect.objectContaining({
        headers: {
          'x-fetch': 'yes',
          'x-request': 'yes',
        },
      }));
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

    it('should await asynchronous request interceptors', async () => {
      global.fetch.mockResolvedValueOnce({ status: 200 });

      const guard = createHttpGuard({
        beforeRequest: async (config) => ({
          ...config,
          headers: { 'X-Async': 'ready' },
        }),
      });

      await guard.get('/api/users');

      expect(fetch).toHaveBeenCalledWith('/api/users', expect.objectContaining({
        headers: { 'X-Async': 'ready' },
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

    it('should await asynchronous response interceptors', async () => {
      global.fetch.mockResolvedValueOnce({ status: 200, value: 'original' });

      const guard = createHttpGuard({
        afterResponse: async (response) => ({ ...response, value: 'updated' }),
      });

      const response = await guard.get('/api/users');

      expect(response.value).toBe('updated');
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

    it('should not let status callbacks replace the response', async () => {
      global.fetch.mockResolvedValueOnce({ status: 401 });
      const error = new Error('callback failed');
      const onUnauthorized = jest.fn(() => { throw error; });
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const response = await createHttpGuard({ onUnauthorized }).get('/api/users');

      expect(response.status).toBe(401);
      expect(onUnauthorized).toHaveBeenCalledTimes(1);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should reject invalid response interceptor results', async () => {
      global.fetch.mockResolvedValueOnce({ status: 200 });
      const guard = createHttpGuard({
        interceptors: { response: [ () => null ] },
      });

      await expect(guard.get('/api/users')).rejects.toThrow(/response object/);
    });

    it('can parse a JSON response when requested', async () => {
      global.fetch.mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: jest.fn().mockResolvedValue({ data: [ 1, 2 ] }),
      });

      await expect(createHttpGuard().get('/api/users', { responseType: 'json' }))
        .resolves.toEqual({ data: [ 1, 2 ] });
    });

    it('can reject non-2xx responses with the response attached', async () => {
      const response = { status: 422, ok: false };
      global.fetch.mockResolvedValueOnce(response);

      await expect(createHttpGuard({ throwOnHttpError: true }).get('/api/users'))
        .rejects.toMatchObject({ code: 'HTTP_ERROR', status: 422, response });
    });

    it('retries configured idempotent requests for retryable statuses', async () => {
      global.fetch
        .mockResolvedValueOnce({ status: 503, ok: false })
        .mockResolvedValueOnce({ status: 200, ok: true });

      const response = await createHttpGuard({ retry: { retries: 1 } }).get('/api/users');

      expect(response.status).toBe(200);
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('does not retry non-idempotent requests by default', async () => {
      global.fetch.mockResolvedValueOnce({ status: 503, ok: false });

      const response = await createHttpGuard({ retry: 2 }).post('/api/users', { name: 'Test' });

      expect(response.status).toBe(503);
      expect(fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('custom interceptors', () => {
    it('should use custom request interceptors', async () => {
      global.fetch.mockResolvedValueOnce({ status: 200 });

      const interceptor1 = jest.fn((config) => config);
      const interceptor2 = jest.fn((config) => config);

      const guard = createHttpGuard({
        interceptors: {
          request: [ interceptor1, interceptor2 ],
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
          response: [ interceptor1, interceptor2 ],
        },
      });

      await guard.get('/api/users');

      expect(interceptor1).toHaveBeenCalled();
      expect(interceptor2).toHaveBeenCalled();
    });
  });
});
