// SPDX-License-Identifier: MIT
/**
 * @kupola/ai-adapter — Built-in Middleware Factories
 *
 * createRateLimiter  — sliding-window rate limiter
 * createDevToolsLogger — logs every process() call to window.__KUPOLA_AI_DEVTOOLS__
 * createAuthGuard    — block sensitive actions without permission
 */

/**
 * Sliding-window rate limiter.
 *
 * @param {object}  options
 * @param {number}  [options.maxRequests=30]  — max calls within the window
 * @param {number}  [options.windowMs=60000]  — window length in ms
 * @returns {Function} middleware (ctx, next) => Promise
 *
 * Usage:
 *   adapter.use(createRateLimiter({ maxRequests: 10, windowMs: 60000 }));
 */
export function createRateLimiter(options = {}) {
  const { maxRequests = 30, windowMs = 60000 } = options;
  const requests = [];

  return async (ctx, next) => {
    const now = Date.now();

    // Evict timestamps outside the current window
    while (requests.length && requests[0] < now - windowMs) {
      requests.shift();
    }

    if (requests.length >= maxRequests) {
      const retryAfter = requests[0] + windowMs - now;
      ctx.result = {
        type: 'error',
        engine: 'rate-limiter',
        success: false,
        error: 'Rate limit exceeded. Please slow down.',
        retryAfter,
        message: `Rate limit exceeded. Retry in ${Math.ceil(retryAfter / 1000)}s.`,
      };
      return; // short-circuit — do NOT call next()
    }

    requests.push(now);
    await next();
  };
}

/**
 * DevTools logger middleware.
 * Records each process() invocation to window.__KUPOLA_AI_DEVTOOLS__
 * (safe to use in Node — falls back to an in-memory array).
 *
 * @param {object}  [options]
 * @param {number}  [options.maxEntries=200]
 * @returns {Function} middleware
 */
export function createDevToolsLogger(options = {}) {
  const { maxEntries = 200 } = options;
  const entries = [];

  const getStore = () => {
    if (typeof window !== 'undefined') {
      if (!window.__KUPOLA_AI_DEVTOOLS__) window.__KUPOLA_AI_DEVTOOLS__ = [];
      return window.__KUPOLA_AI_DEVTOOLS__;
    }
    return entries;
  };

  return async (ctx, next) => {
    const start = Date.now();
    await next();
    const duration = Date.now() - start;

    const record = {
      input: ctx.input,
      command: ctx.command,
      result: ctx.result,
      duration,
      timestamp: Date.now(),
    };

    const store = getStore();
    store.push(record);
    if (store.length > maxEntries) store.shift();
  };
}

/**
 * Action auth guard middleware.
 * Blocks commands whose engine is 'action' and whose type matches the
 * restricted list unless the context carries the required role.
 *
 * @param {object}    options
 * @param {string[]}  options.restrictedTypes — action types to guard
 * @param {string}    [options.roleField='role'] — context field to check
 * @param {string[]}  [options.allowedRoles=['admin']]
 * @returns {Function} middleware
 */
export function createAuthGuard(options = {}) {
  const {
    restrictedTypes = [],
    roleField = 'role',
    allowedRoles = ['admin'],
  } = options;

  return async (ctx, next) => {
    // Only guard action commands — we detect intent via a pre-parsed ctx.command
    // or by matching the input pattern (best-effort before parsing)
    const cmdType = ctx.command && ctx.command.type;
    if (cmdType && restrictedTypes.includes(cmdType)) {
      const userRole = ctx.context && ctx.context[roleField];
      if (!userRole || !allowedRoles.includes(userRole)) {
        ctx.result = {
          type: 'error',
          engine: 'auth-guard',
          success: false,
          error: `Action "${cmdType}" requires role: ${allowedRoles.join('|')}`,
          message: `Permission denied. Required role: ${allowedRoles.join(' or ')}.`,
        };
        return;
      }
    }
    await next();
  };
}
