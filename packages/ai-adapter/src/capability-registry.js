// SPDX-License-Identifier: MIT
/**
 * @kupola/ai-adapter — Capability Registry
 *
 * Centralizes AI-facing resource operations, parameter validation, permission
 * rules, result field filtering, and sensitive-field redaction.
 */

const DEFAULT_SENSITIVE_FIELDS = [
  'password',
  'passwd',
  'token',
  'secret',
  'authorization',
  'accessToken',
  'refreshToken',
];

export class CapabilityError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = 'CapabilityError';
    this.code = options.code || 'CAPABILITY_ERROR';
    this.denied = !!options.denied;
    this.details = options.details || null;
  }
}

export class CapabilityRegistry {
  constructor(adapter, options = {}) {
    this.adapter = adapter;
    this.items = new Map();
    this.roleField = options.roleField || 'role';
    this.permissionsField = options.permissionsField || 'permissions';
    this.defaultSensitiveFields = options.sensitiveFields || DEFAULT_SENSITIVE_FIELDS;
  }

  register(config = {}) {
    const capability = normalizeCapability(config);
    const key = getCapabilityKey(capability.engine, capability.type);

    if (this.items.has(key)) {
      throw new CapabilityError(`Capability already registered: ${key}`, { code: 'DUPLICATE_CAPABILITY' });
    }

    this.items.set(key, capability);
    this._installHandler(capability);
    return capability;
  }

  registerMany(configs = []) {
    configs.forEach(config => this.register(config));
    return this;
  }

  unregister(engine, type) {
    return this.items.delete(getCapabilityKey(engine, type));
  }

  get(engine, type) {
    return this.items.get(getCapabilityKey(engine, type)) || null;
  }

  has(engine, type) {
    return this.items.has(getCapabilityKey(engine, type));
  }

  canAccess(engine, type, context = {}) {
    const capability = this.get(engine, type);
    if (!capability) return false;
    return this._checkAccess(capability, context).allowed;
  }

  list(filter = {}) {
    return [...this.items.values()].filter(item => {
      if (filter.engine && item.engine !== filter.engine) return false;
      if (filter.resource && item.resource !== filter.resource) return false;
      return true;
    });
  }

  toAuthRules() {
    return this.list()
      .filter(item => item.roles.length > 0 || item.permissions.length > 0)
      .map(item => ({
        engine: item.engine,
        type: item.type,
        roles: [...item.roles],
        permissions: [...item.permissions],
        message: item.message,
      }));
  }

  getAICapabilities(context = {}) {
    const hasAccessContext = context
      && (
        context[this.roleField] !== undefined
        || context.roles !== undefined
        || context[this.permissionsField] !== undefined
      );
    return this.list()
      .filter(item => item.exposeToAI !== false)
      .filter(item => !item.available || item.available(context) !== false)
      .filter(item => !hasAccessContext || this._checkAccess(item, context).allowed)
      .map(item => ({
        engine: item.engine,
        type: item.type,
        resource: item.resource,
        label: item.label,
        description: item.description,
        paramsSchema: describeParamsSchema(item.paramsSchema),
        roles: [...item.roles],
        permissions: [...item.permissions],
        confirm: !!item.confirm,
      }));
  }

  middleware(options = {}) {
    const strict = !!options.strict;
    return async (ctx, next) => {
      const command = ctx.command;
      if (!command || command.engine === 'unknown') {
        await next();
        return;
      }

      const capability = this.get(command.engine, command.type);
      if (!capability) {
        if (strict) {
          ctx.result = {
            type: 'error',
            engine: 'capability',
            success: false,
            code: 'CAPABILITY_NOT_REGISTERED',
            message: `未注册 AI 能力：${command.engine}:${command.type}。`,
          };
          return;
        }
        await next();
        return;
      }

      const access = this._checkAccess(capability, ctx.context || {});
      if (!access.allowed) {
        ctx.result = buildDeniedResult(capability, command, access);
        return;
      }

      try {
        command.params = validateParams(command.params || {}, capability);
      } catch (err) {
        ctx.result = {
          type: 'error',
          engine: 'capability',
          success: false,
          code: err.code || 'INVALID_PARAMS',
          message: err.message,
        };
        return;
      }

      await next();
    };
  }

  _installHandler(capability) {
    if (!this.adapter || typeof capability.handler !== 'function') return;

    if (capability.engine === 'query') {
      this.adapter.query.register(capability.type, async (params, context) => {
        const safeParams = validateParams(params || {}, capability);
        this._assertAccess(capability, context || {});
        const result = await capability.handler(safeParams, context || {});
        return filterResult(result, capability, this.defaultSensitiveFields);
      });
      return;
    }

    if (capability.engine === 'action') {
      this.adapter.action.register(capability.type, {
        label: capability.label || capability.type,
        confirm: capability.confirm,
        undo: capability.undo,
        retries: capability.retries,
        dependsOn: capability.dependsOn,
        handler: async (params, context) => {
          const safeParams = validateParams(params || {}, capability);
          this._assertAccess(capability, context || {});
          const result = await capability.handler(safeParams, context || {});
          return filterResult(result, capability, this.defaultSensitiveFields);
        },
      });
      return;
    }

    if (capability.engine === 'flow' && capability.flow) {
      this.adapter.flow.define(capability.type, capability.flow);
    }
  }

  _assertAccess(capability, context) {
    const access = this._checkAccess(capability, context);
    if (!access.allowed) {
      throw new CapabilityError(access.message, {
        code: 'PERMISSION_DENIED',
        denied: true,
        details: access,
      });
    }
  }

  _checkAccess(capability, context) {
    const roles = asArray(context[this.roleField]).concat(asArray(context.roles));
    const permissions = asArray(context[this.permissionsField]);
    const requiredRoles = capability.roles;
    const requiredPermissions = capability.permissions;

    if (requiredRoles.length === 0 && requiredPermissions.length === 0) {
      return { allowed: true, requiredRoles, requiredPermissions };
    }

    const roleAllowed = requiredRoles.some(role => roles.includes(role));
    const permissionAllowed = requiredPermissions.some(permission => permissions.includes(permission));
    const allowed = requiredPermissions.length > 0
      ? roleAllowed || permissionAllowed
      : roleAllowed;

    return {
      allowed,
      requiredRoles,
      requiredPermissions,
      message: capability.message || `无权限执行该操作，需要${formatRequired(requiredRoles, requiredPermissions)}。`,
    };
  }
}

function normalizeCapability(config) {
  if (!config.engine || !config.type) {
    throw new CapabilityError('Capability requires engine and type.', { code: 'INVALID_CAPABILITY' });
  }
  if (!['query', 'action', 'flow'].includes(config.engine)) {
    throw new CapabilityError(`Unsupported capability engine: ${config.engine}`, { code: 'INVALID_CAPABILITY' });
  }

  return {
    ...config,
    resource: config.resource || config.type,
    label: config.label || config.type,
    roles: asArray(config.roles || config.allowedRoles),
    permissions: asArray(config.permissions || config.permission),
    sensitiveFields: asArray(config.sensitiveFields),
    resultFields: config.resultFields ? asArray(config.resultFields) : null,
    allowUnknownParams: config.allowUnknownParams === true,
    exposeToAI: config.exposeToAI !== false,
  };
}

function getCapabilityKey(engine, type) {
  return `${engine}:${type}`;
}

function validateParams(params, capability) {
  const schema = capability.paramsSchema;
  if (!schema) return { ...params };

  if (Array.isArray(schema)) {
    return pick(params, schema, capability.allowUnknownParams);
  }

  const output = capability.allowUnknownParams ? { ...params } : {};
  for (const [key, ruleInput] of Object.entries(schema)) {
    const rule = normalizeParamRule(ruleInput);
    let value = params[key];

    if ((value === undefined || value === null || value === '') && rule.default !== undefined) {
      value = typeof rule.default === 'function' ? rule.default(params) : rule.default;
    }

    if (rule.required && (value === undefined || value === null || value === '')) {
      throw new CapabilityError(`缺少必要参数：${key}。`, { code: 'INVALID_PARAMS' });
    }

    if (value === undefined || value === null || value === '') {
      if (!capability.allowUnknownParams) output[key] = value;
      continue;
    }

    output[key] = coerceParamValue(key, value, rule);
  }

  return output;
}

function normalizeParamRule(rule) {
  if (typeof rule === 'string') return { type: rule };
  if (Array.isArray(rule)) return { type: 'string', enum: rule };
  return { type: 'any', ...(rule || {}) };
}

function coerceParamValue(key, value, rule) {
  if (rule.enum && !rule.enum.includes(value)) {
    throw new CapabilityError(`参数 ${key} 不在允许范围内。`, { code: 'INVALID_PARAMS' });
  }

  switch (rule.type) {
    case 'string': {
      const next = String(value).trim();
      if (rule.maxLength && next.length > rule.maxLength) {
        throw new CapabilityError(`参数 ${key} 超过最大长度 ${rule.maxLength}。`, { code: 'INVALID_PARAMS' });
      }
      return next;
    }
    case 'number': {
      const next = Number(value);
      if (!Number.isFinite(next)) {
        throw new CapabilityError(`参数 ${key} 必须是数字。`, { code: 'INVALID_PARAMS' });
      }
      return next;
    }
    case 'boolean':
      return value === true || value === 'true' || value === 1 || value === '1';
    case 'array':
      return Array.isArray(value) ? value : [value];
    case 'object':
      if (!value || typeof value !== 'object' || Array.isArray(value)) {
        throw new CapabilityError(`参数 ${key} 必须是对象。`, { code: 'INVALID_PARAMS' });
      }
      return value;
    default:
      return value;
  }
}

function pick(params, fields, allowUnknown) {
  if (allowUnknown) return { ...params };
  return fields.reduce((result, field) => {
    if (Object.prototype.hasOwnProperty.call(params, field)) {
      result[field] = params[field];
    }
    return result;
  }, {});
}

function filterResult(result, capability, defaultSensitiveFields) {
  const fields = capability.resultFields;
  const sensitiveFields = [...defaultSensitiveFields, ...capability.sensitiveFields];
  const filtered = fields ? selectFields(result, fields) : cloneResult(result);
  return redactFields(filtered, sensitiveFields);
}

function selectFields(value, fields) {
  if (Array.isArray(value)) return value.map(item => selectFields(item, fields));
  if (!value || typeof value !== 'object') return value;
  return pick(value, fields, false);
}

function cloneResult(value) {
  if (Array.isArray(value)) return value.map(cloneResult);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, cloneResult(item)]));
}

function redactFields(value, fields) {
  const fieldSet = new Set(fields.map(field => String(field).toLowerCase()));
  const seen = new WeakMap();

  const visit = (item, key = '') => {
    if (fieldSet.has(String(key).toLowerCase())) return '[REDACTED]';
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

function describeParamsSchema(schema) {
  if (!schema) return null;
  if (Array.isArray(schema)) return [...schema];
  return Object.fromEntries(
    Object.entries(schema).map(([key, rule]) => {
      const normalized = normalizeParamRule(rule);
      const { default: _default, ...publicRule } = normalized;
      return [key, publicRule];
    }),
  );
}

function buildDeniedResult(capability, command, access) {
  return {
    type: 'error',
    engine: 'capability',
    success: false,
    code: 'PERMISSION_DENIED',
    denied: true,
    command,
    requiredRoles: access.requiredRoles,
    requiredPermissions: access.requiredPermissions,
    error: `${capability.engine}:${capability.type} requires ${formatRequired(access.requiredRoles, access.requiredPermissions)}`,
    message: access.message,
  };
}

function formatRequired(roles, permissions) {
  const parts = [];
  if (roles.length > 0) parts.push(`角色：${roles.join(' 或 ')}`);
  if (permissions.length > 0) parts.push(`权限：${permissions.join(' 或 ')}`);
  return parts.join('，') || '授权';
}

function asArray(value) {
  if (value === undefined || value === null || value === '') return [];
  return Array.isArray(value) ? value : [value];
}
