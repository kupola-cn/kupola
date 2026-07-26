// SPDX-License-Identifier: MIT
/**
 * @kupola/router — Navigation and guard pipeline utilities.
 *
 * @module navigation
 */

/**
 * Navigation status enum.
 * @typedef {'pending' | 'guarding' | 'completed' | 'cancelled' | 'rejected' | 'redirected' | 'error'} NavigationStatus
 */

/**
 * Navigation options.
 * @typedef {Object} NavigationOptions
 * @property {number} id - Unique navigation ID
 * @property {RouteRecord|null} from - Previous route
 * @property {RouteRecord} to - Target route
 * @property {boolean} replace - Whether to replace history entry
 * @property {boolean} shouldRestoreHash - Whether to restore hash after guard rejection
 */

/**
 * Encapsulates a single navigation operation with its state and lifecycle.
 */
export class Navigation {
  /**
   * @param {NavigationOptions} options - Navigation options
   */
  constructor({ id, from, to, replace, shouldRestoreHash }) {
    /** @type {number} Unique navigation ID */
    this.id = id;
    /** @type {RouteRecord|null} Previous route */
    this.from = from;
    /** @type {RouteRecord} Target route */
    this.to = to;
    /** @type {boolean} Whether to replace history entry */
    this.replace = replace;
    /** @type {boolean} Whether to restore hash after guard rejection */
    this.shouldRestoreHash = shouldRestoreHash;
    /** @type {NavigationStatus} Current navigation status */
    this.status = 'pending';
    /** @type {AbortController|null} Abort controller for cancellation */
    this.abortController = typeof AbortController !== 'undefined' ? new AbortController() : null;
    /** @type {string|null} Redirect path if navigation is redirected */
    this.redirectPath = null;
    /** @type {string|Object|null} Full redirect location */
    this.redirectLocation = null;
  }

  /**
   * Cancel the navigation.
   */
  cancel() {
    this.status = 'cancelled';
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  /**
   * Redirect the navigation to another path.
     * @param {string|Object} location - Target location for redirection
     */
  redirect(location) {
    this.status = 'redirected';
    this.redirectLocation = location;
    this.redirectPath = typeof location === 'string' ? location : location?.path || null;
  }

  /**
   * Mark the navigation as complete.
   */
  complete() {
    this.status = 'completed';
  }

  /**
   * Get the abort signal for this navigation.
   * @returns {AbortSignal|null} Abort signal
   */
  get signal() {
    return this.abortController?.signal;
  }

  /**
   * Check if this navigation has been aborted.
   * @returns {boolean} True if aborted
   */
  isAborted() {
    return this.abortController?.signal?.aborted || false;
  }
}

/**
 * Guard pipeline that manages middleware registration and execution.
 */
export class GuardPipeline {
  constructor() {
    /** @type {Array<{phase: string, middleware: Function}>} Registered middlewares */
    this.middlewares = [];
    /** @type {Object<string, number>} Execution order for guard phases */
    this.phaseOrder = {
      beforeLeave: 0,
      beforeEach: 1,
      beforeEnter: 2,
      beforeResolve: 3,
    };
  }

  /**
   * Register a middleware for a specific phase.
   * @param {string} phase - Guard phase (beforeEach, beforeEnter, beforeResolve, beforeLeave)
   * @param {Function} middleware - Middleware function
   * @returns {Function} Unsubscribe function
   */
  use(phase, middleware) {
    if (!Object.prototype.hasOwnProperty.call(this.phaseOrder, phase)) {
      throw new TypeError(`[kupola/router] Unsupported guard phase: ${phase}`);
    }
    if (typeof middleware !== 'function') {
      throw new TypeError('[kupola/router] Guard middleware must be a function.');
    }
    this.middlewares.push({ phase, middleware });
    return () => {
      const index = this.middlewares.findIndex(m => m.middleware === middleware);
      if (index > -1) {this.middlewares.splice(index, 1);}
    };
  }

  /**
   * Execute all middlewares in order.
   * @param {Navigation} navigation - Navigation object
   */
  async execute(navigation, extraMiddlewares = []) {
    const sorted = [ ...this.middlewares, ...extraMiddlewares ].sort((a, b) => {
      return this.phaseOrder[a.phase] - this.phaseOrder[b.phase];
    });

    const stack = sorted.map(m => m.middleware);

    const next = async (index = 0) => {
      if (
        index >= stack.length ||
        [ 'cancelled', 'rejected', 'redirected', 'error' ].includes(navigation.status)
      ) {
        return;
      }

      navigation.status = 'guarding';

      const proceed = (() => {
        let nextPromise;
        return () => {
          if (!nextPromise) {
            nextPromise = next(index + 1);
          }
          return nextPromise;
        };
      })();

      try {
        await stack[index](navigation, proceed);
      } catch (error) {
        navigation.status = 'error';
        throw error;
      }

      if (navigation.status === 'guarding') {
        navigation.status = 'pending';
      }
    };

    await next();
  }
}

/**
 * Create a middleware function from a guard.
 * @param {Function} guard - Guard function that receives (to, from) and returns boolean or redirect object
 * @returns {Function} Middleware function that receives (navigation, next)
 */
export function createMiddleware(guard) {
  if (typeof guard !== 'function') {
    throw new TypeError('[kupola/router] Navigation guard must be a function.');
  }
  return async (navigation, next) => {
    const { to, from } = navigation;

    if (navigation.isAborted()) {return;}

    const result = await guard(to, from);

    if (navigation.isAborted()) {return;}

    if (result === false) {
      navigation.status = 'rejected';
      return;
    }

    if (result && (result.path || result.name)) {
      navigation.redirect(result);
      return;
    }

    await next();
  };
}
