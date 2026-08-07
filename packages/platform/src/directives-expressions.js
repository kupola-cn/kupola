// SPDX-License-Identifier: MIT
/**
 * Directive expression engine: cached new Function() evaluation with an LRU
 * cache, scope proxies, CSP error hints, and k-data resolution.
 *
 * @module directives/expressions
 */

import { signal } from '@kupola/core';
import { describeElement, formatDiagnostic } from './directives-warnings.js';
import { createScope, instantiateScopeDefinition, scopeRegistry } from './directives-scope.js';

function resolveData(expr, ctx, el) {
  const name = expr?.trim();
  if (name && scopeRegistry.has(name)) {
    return instantiateScopeDefinition(scopeRegistry.get(name), ctx);
  }
  if (/^[A-Za-z_$][\w$]*$/.test(name || '')) {
    throw new Error(formatDiagnostic(
      'W013',
      `Unknown k-data scope "${name}". Register it with defineScope("${name}", ...).`,
    ));
  }
  return evaluate(expr, createScope({}), null, { directive: 'k-data', element: el }) || {};
}

// ─── Expression Evaluation ────────────────────────────────────────────────────

/** Cache compiled expression functions with LRU eviction. */
const exprCache = new Map();
const MAX_CACHED_EXPRESSIONS = 500;
const CACHE_EXPIRE_MS = 300000;
let cacheCleanupTimer = null;

function scheduleCacheCleanup() {
  if (cacheCleanupTimer) {return;}
  cacheCleanupTimer = setTimeout(() => {
    cacheCleanupTimer = null;
    const now = Date.now();
    for (const [ key, entry ] of exprCache) {
      if (entry && entry._lastUsed && now - entry._lastUsed > CACHE_EXPIRE_MS) {
        exprCache.delete(key);
      }
    }
  }, CACHE_EXPIRE_MS);
}

function cacheExpression(key, fn) {
  const entry = { fn, _lastUsed: Date.now() };
  exprCache.set(key, entry);
  if (exprCache.size > MAX_CACHED_EXPRESSIONS) {
    let oldestKey = null;
    let oldestTime = Infinity;
    for (const [ k, v ] of exprCache) {
      if (v._lastUsed < oldestTime) {
        oldestTime = v._lastUsed;
        oldestKey = k;
      }
    }
    if (oldestKey) {exprCache.delete(oldestKey);}
  }
  scheduleCacheCleanup();
  return fn;
}

/**
 * Evaluate an expression for reading (returns a value).
 * Uses `with(scope)` so variable names resolve through the Proxy.
 *
 * @param {string} expr
 * @param {Proxy} scope
 * @returns {any}
 */
function createScopeProxy(baseScope, localStore, getValue, setValue) {
  return new Proxy(baseScope, {
    get(target, key, receiver) {
      if (Object.prototype.hasOwnProperty.call(localStore, key)) {
        return getValue(localStore, key);
      }
      return Reflect.get(target, key, receiver);
    },
    set(target, key, value, receiver) {
      if (Object.prototype.hasOwnProperty.call(localStore, key)) {
        setValue(localStore, key, value);
        return true;
      }
      return Reflect.set(target, key, value, receiver);
    },
    has(target, key) {
      return Object.prototype.hasOwnProperty.call(localStore, key) || key in target;
    },
    ownKeys(target) {
      return [ ...new Set([ ...Reflect.ownKeys(target), ...Reflect.ownKeys(localStore) ]) ];
    },
    getOwnPropertyDescriptor(target, key) {
      if (Object.prototype.hasOwnProperty.call(localStore, key)) {
        return { enumerable: true, configurable: true };
      }
      return Reflect.getOwnPropertyDescriptor(target, key);
    },
  });
}

function createEvaluationScope(scope, locals) {
  if (!locals) {return scope;}
  return createScopeProxy(scope, locals, (s, k) => s[k], (s, k, v) => { s[k] = v; });
}

function createLocalScope(scope, locals) {
  const localSignals = Object.create(null);
  for (const [ key, value ] of Object.entries(locals)) {
    localSignals[key] = signal(value);
  }

  const proxy = createScopeProxy(scope, localSignals, (s, k) => s[k].value, (s, k, v) => { s[k].value = v; });

  return {
    scope: proxy,
    update(nextLocals) {
      for (const [ key, value ] of Object.entries(nextLocals)) {
        if (Object.prototype.hasOwnProperty.call(localSignals, key)) {
          localSignals[key].value = value;
        } else {
          localSignals[key] = signal(value);
        }
      }
    },
  };
}

function createExpressionError(error, expr, meta = {}) {
  const directive = meta.directive || 'expression';
  const element = meta.element ? describeElement(meta.element) : '<unknown>';
  const original = error && error.message ? error.message : String(error);
  const hint = isCspEvalError(error)
    ? '\nHint: Kupola directive expressions use new Function(). Allow unsafe-eval in CSP, ' +
      'or use Kupola JS APIs instead of HTML expressions in strict CSP environments.'
    : '';
  const wrapped = new Error(
    formatDiagnostic('E001', `Error evaluating ${directive} on ${element}: ${expr}`) + '\n' +
    `Original error: ${original}${hint}`,
  );
  wrapped.name = 'KupolaExpressionError';
  wrapped.cause = error;
  wrapped.directive = directive;
  wrapped.element = meta.element || null;
  wrapped.expression = expr;
  return wrapped;
}

function isCspEvalError(error) {
  const message = String(error?.message || error || '').toLowerCase();
  return (
    error?.name === 'EvalError' ||
    message.includes('unsafe-eval') ||
    message.includes('code generation from strings') ||
    message.includes('refused to evaluate a string as javascript')
  );
}

function evaluate(expr, scope, locals, meta) {
  return _evaluate(expr, scope, locals, meta, true);
}

function evaluateStatement(expr, scope, locals, meta) {
  return _evaluate(expr, scope, locals, meta, false);
}

function _evaluate(expr, scope, locals, meta, isExpression) {
  const cacheKey = isExpression ? expr : '$$' + expr;
  const template = isExpression ? `with(__s__){return(${expr})}` : `with(__s__){${expr}}`;
  try {
    let entry = exprCache.get(cacheKey);
    let fn = entry?.fn;
    if (!fn) {
      fn = new Function('__s__', template);
      cacheExpression(cacheKey, fn);
    } else {
      entry._lastUsed = Date.now();
    }
    return fn(createEvaluationScope(scope, locals));
  } catch (error) {
    throw createExpressionError(error, expr, meta);
  }
}

export { createEvaluationScope, createLocalScope, evaluate, evaluateStatement, resolveData };
