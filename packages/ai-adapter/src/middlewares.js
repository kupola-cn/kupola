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
 * @param {string[]} [options.redactFields] — field names to redact in command/result logs
 * @returns {Function} middleware
 */
export function createDevToolsLogger(options = {}) {
  const {
    maxEntries = 200,
    redactFields = ['password', 'passwd', 'token', 'secret', 'authorization', 'accessToken', 'refreshToken'],
  } = options;
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
      command: _redactValue(ctx.command, redactFields),
      result: _redactValue(ctx.result, redactFields),
      duration,
      timestamp: Date.now(),
    };

    const store = getStore();
    store.push(record);
    if (store.length > maxEntries) store.shift();
  };
}

function _redactValue(value, redactFields) {
  const fields = new Set((redactFields || []).map(field => String(field).toLowerCase()));
  const seen = new WeakMap();

  const visit = (item, key = '') => {
    if (fields.has(String(key).toLowerCase())) return '[REDACTED]';
    if (!item || typeof item !== 'object') return item;
    if (seen.has(item)) return seen.get(item);

    const output = Array.isArray(item) ? [] : {};
    seen.set(item, output);

    for (const [childKey, childValue] of Object.entries(item)) {
      output[childKey] = visit(childValue, childKey);
    }
    return output;
  };

  return visit(value);
}

/**
 * Auth guard middleware.
 * Blocks parsed commands before execution unless the context carries an
 * allowed role or permission. Supports action/query/flow rules.
 *
 * @param {object}    options
 * @param {string[]}  options.restrictedTypes — action types to guard (legacy)
 * @param {string[]}  [options.restrictedQueries] — query types to guard
 * @param {string[]}  [options.restrictedFlows] — flow names to guard
 * @param {Array}     [options.rules] — centralized access rules
 * @param {object}    [options.permissions] — map like { 'query:roles': ['admin'] }
 * @param {string}    [options.roleField='role'] — context field to check
 * @param {string}    [options.permissionsField='permissions'] — context field to check
 * @param {string[]}  [options.allowedRoles=['admin']]
 * @returns {Function} middleware
 */
export function createAuthGuard(options = {}) {
  const {
    restrictedTypes = [],
    restrictedQueries = [],
    restrictedFlows = [],
    rules = [],
    permissions = null,
    roleField = 'role',
    permissionsField = 'permissions',
    allowedRoles = ['admin'],
    message = null,
  } = options;

  const accessRules = _normalizeAuthRules({
    restrictedTypes,
    restrictedQueries,
    restrictedFlows,
    rules,
    permissions,
    allowedRoles,
  });

  return async (ctx, next) => {
    const command = ctx.command;
    const rule = accessRules.find(item => _matchesAuthRule(item, command, ctx));

    if (rule) {
      const context = ctx.context || {};
      const userRoles = _asArray(context[roleField]);
      const userPermissions = _asArray(context[permissionsField]);
      const requiredRoles = rule.allowedRoles || rule.roles || allowedRoles;
      const requiredPermissions = _asArray(rule.permissions || rule.permission);

      if (!_hasAccess(userRoles, userPermissions, requiredRoles, requiredPermissions)) {
        const requiredText = _formatRequired(requiredRoles, requiredPermissions);
        const commandText = _formatCommand(command);
        const customMessage = _resolveMessage(rule.message || message, {
          command,
          requiredRoles,
          requiredPermissions,
          context,
        });

        ctx.result = {
          type: 'error',
          engine: 'auth-guard',
          success: false,
          code: 'PERMISSION_DENIED',
          denied: true,
          command,
          requiredRoles,
          requiredPermissions,
          error: `${commandText} requires role/permission: ${requiredText}`,
          message: customMessage || `无权限执行该操作，需要${requiredText}。`,
        };
        return;
      }
    }

    await next();
  };
}

function _normalizeAuthRules(options) {
  const normalized = [];

  if (options.restrictedTypes.length > 0) {
    normalized.push({
      engine: 'action',
      types: options.restrictedTypes,
      allowedRoles: options.allowedRoles,
    });
  }

  if (options.restrictedQueries.length > 0) {
    normalized.push({
      engine: 'query',
      types: options.restrictedQueries,
      allowedRoles: options.allowedRoles,
    });
  }

  if (options.restrictedFlows.length > 0) {
    normalized.push({
      engine: 'flow',
      type: 'execute',
      names: options.restrictedFlows,
      allowedRoles: options.allowedRoles,
    });
  }

  for (const rule of options.rules || []) {
    normalized.push(rule);
  }

  for (const [key, value] of Object.entries(options.permissions || {})) {
    const [engine, type, name] = key.split(':');
    const rule = Array.isArray(value) ? { roles: value } : { ...value };
    normalized.push({ engine, type, name, ...rule });
  }

  return normalized;
}

function _matchesAuthRule(rule, command, ctx) {
  if (!command) return false;
  if (typeof rule.match === 'function') return !!rule.match(command, ctx);

  const typeRule = rule.types || rule.type;
  const nameRule = rule.names || rule.name;

  return _matchesValue(rule.engine, command.engine)
    && _matchesValue(typeRule, command.type)
    && _matchesValue(nameRule, command.params && command.params.name);
}

function _matchesValue(ruleValue, actualValue) {
  if (ruleValue === undefined || ruleValue === null) return true;
  if (ruleValue === '*') return true;
  if (typeof ruleValue === 'function') return !!ruleValue(actualValue);
  if (Array.isArray(ruleValue)) return ruleValue.includes(actualValue) || ruleValue.includes('*');
  return ruleValue === actualValue;
}

function _hasAccess(userRoles, userPermissions, requiredRoles, requiredPermissions) {
  const roleAllowed = _asArray(requiredRoles).some(role => userRoles.includes(role));
  const permissionsRequired = _asArray(requiredPermissions);
  const permissionAllowed = permissionsRequired.some(permission => userPermissions.includes(permission));

  if (permissionsRequired.length > 0) {
    return roleAllowed || permissionAllowed;
  }
  return roleAllowed;
}

function _asArray(value) {
  if (value === undefined || value === null || value === '') return [];
  return Array.isArray(value) ? value : [value];
}

function _formatRequired(roles, permissions) {
  const parts = [];
  const roleList = _asArray(roles);
  const permissionList = _asArray(permissions);
  if (roleList.length > 0) parts.push(`角色：${roleList.join(' 或 ')}`);
  if (permissionList.length > 0) parts.push(`权限：${permissionList.join(' 或 ')}`);
  return parts.join('，') || '授权';
}

function _formatCommand(command) {
  if (!command) return 'Command';
  const suffix = command.engine === 'flow' && command.params && command.params.name
    ? `:${command.params.name}`
    : `:${command.type}`;
  return `${command.engine}${suffix}`;
}

function _resolveMessage(message, payload) {
  if (typeof message === 'function') return message(payload);
  return message;
}
