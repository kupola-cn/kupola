// SPDX-License-Identifier: MIT
/** Shared error reporting for core reactive primitives. */

/** @type {((error: unknown, context: Object) => void)|null} */
let errorHandler = null;

/**
 * Install a process-wide error handler for scheduler and reactive errors.
 * The returned function restores the previous handler.
 *
 * @param {((error: unknown, context: Object) => void)|null} handler
 * @returns {() => void}
 */
export function setErrorHandler(handler) {
  if (handler !== null && typeof handler !== 'function') {
    throw new TypeError('[kupola] setErrorHandler() expects a function or null.');
  }
  const previous = errorHandler;
  errorHandler = handler;
  return () => {
    if (errorHandler === handler) {errorHandler = previous;}
  };
}

/** @returns {((error: unknown, context: Object) => void)|null} */
export function getErrorHandler() {
  return errorHandler;
}

/**
 * Report errors to the configured handler. Without a handler, preserve the
 * existing synchronous throwing behavior and throw the first error.
 *
 * @param {unknown[]} errors
 * @param {Object} context
 * @param {((error: unknown, context: Object) => void)|null} [overrideHandler]
 */
export function reportErrors(errors, context, overrideHandler) {
  if (!errors || errors.length === 0) {return;}
  const handler = overrideHandler === undefined ? errorHandler : overrideHandler;
  if (!handler) {throw errors[0];}

  let handlerError;
  for (const error of errors) {
    try {
      handler(error, context);
    } catch (caught) {
      if (!handlerError) {handlerError = caught;}
    }
  }
  if (handlerError) {throw handlerError;}
}
