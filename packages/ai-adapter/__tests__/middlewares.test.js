// SPDX-License-Identifier: MIT
/**
 * Built-in middlewares tests — createRateLimiter / createDevToolsLogger / createAuthGuard
 */

import { createRateLimiter, createDevToolsLogger, createAuthGuard } from '../src/middlewares.js';

describe('createRateLimiter', () => {
  const makeCtx = (input = 'test') => ({ input, context: {}, command: null, result: null, adapter: {} });
  const passNext = async () => {};

  it('should allow requests within the limit', async () => {
    const limiter = createRateLimiter({ maxRequests: 3, windowMs: 10000 });
    const ctx = makeCtx();
    await limiter(ctx, passNext);
    expect(ctx.result).toBeNull(); // not blocked
  });

  it('should block when limit is exceeded', async () => {
    const limiter = createRateLimiter({ maxRequests: 2, windowMs: 60000 });
    await limiter(makeCtx(), passNext);
    await limiter(makeCtx(), passNext);
    const ctx3 = makeCtx();
    await limiter(ctx3, passNext);
    expect(ctx3.result).not.toBeNull();
    expect(ctx3.result.error).toMatch(/Rate limit/);
    expect(ctx3.result.retryAfter).toBeGreaterThan(0);
  });

  it('should use default options when none provided', async () => {
    const limiter = createRateLimiter();
    const ctx = makeCtx();
    await limiter(ctx, passNext);
    expect(ctx.result).toBeNull();
  });

  it('should set engine to rate-limiter in blocked result', async () => {
    const limiter = createRateLimiter({ maxRequests: 1, windowMs: 60000 });
    await limiter(makeCtx(), passNext);
    const ctx = makeCtx();
    await limiter(ctx, passNext);
    expect(ctx.result.engine).toBe('rate-limiter');
  });
});

describe('createDevToolsLogger', () => {
  const makeCtx = (input = 'test') => ({ input, context: {}, command: null, result: null, adapter: {} });

  it('should record entries after next() completes', async () => {
    const logger = createDevToolsLogger();
    const ctx = makeCtx('hello');
    let nextCalled = false;
    await logger(ctx, async () => { nextCalled = true; });
    expect(nextCalled).toBe(true);
  });

  it('should call next() even when no options provided', async () => {
    const logger = createDevToolsLogger();
    const ctx = makeCtx();
    let nextCalled = false;
    await logger(ctx, async () => { nextCalled = true; });
    expect(nextCalled).toBe(true);
  });
});

describe('createAuthGuard', () => {
  const makeCtx = (cmdType, role) => ({
    input: '',
    context: role ? { role } : {},
    command: cmdType ? { type: cmdType, engine: 'action' } : null,
    result: null,
    adapter: {},
  });
  const passNext = async () => {};

  it('should allow action when user has required role', async () => {
    const guard = createAuthGuard({ restrictedTypes: ['delete'], allowedRoles: ['admin'] });
    const ctx = makeCtx('delete', 'admin');
    await guard(ctx, passNext);
    expect(ctx.result).toBeNull(); // not blocked
  });

  it('should block action when user lacks required role', async () => {
    const guard = createAuthGuard({ restrictedTypes: ['delete'], allowedRoles: ['admin'] });
    const ctx = makeCtx('delete', 'user');
    await guard(ctx, passNext);
    expect(ctx.result).not.toBeNull();
    expect(ctx.result.error).toMatch(/requires role/);
    expect(ctx.result.engine).toBe('auth-guard');
  });

  it('should block when no role in context', async () => {
    const guard = createAuthGuard({ restrictedTypes: ['delete'] });
    const ctx = makeCtx('delete');
    await guard(ctx, passNext);
    expect(ctx.result).not.toBeNull();
  });

  it('should allow non-restricted action types', async () => {
    const guard = createAuthGuard({ restrictedTypes: ['delete'] });
    const ctx = makeCtx('add', 'user');
    await guard(ctx, passNext);
    expect(ctx.result).toBeNull();
  });

  it('should pass through when no command is set', async () => {
    const guard = createAuthGuard({ restrictedTypes: ['delete'] });
    const ctx = makeCtx(null);
    await guard(ctx, passNext);
    expect(ctx.result).toBeNull();
  });
});
