// SPDX-License-Identifier: MIT
/**
 * @kupola/platform — Form state management hook.
 *
 * `useForm()` provides reactive form state: values, errors, dirty/touched
 * tracking, validation, and submission handling — all backed by signals so
 * templates update automatically.
 *
 * Usage:
 * ```js
 * import { useForm } from '@kupola/platform';
 *
 * const form = useForm(
 *   { name: '', age: 0 },
 *   (values) => {
 *     const errs = {};
 *     if (!values.name) errs.name = '必填';
 *     if (values.age < 0) errs.age = '不能为负';
 *     return errs;
 *   },
 * );
 *
 * // In a template:
 * html`<input value="${form.values.value.name}"
 *            oninput="${(e) => form.setField('name', e.target.value)}" />
 *      <span>${form.errors.value.name || ''}</span>`
 *
 * // Submit:
 * const submit = form.handleSubmit(async (values) => {
 *   await api.save(values);
 * });
 * // <form onsubmit="${submit}">…</form>
 * ```
 *
 * @module form
 */

import { signal, computed } from '@kupola/core';

/**
 * Validation function: receives current values, returns an errors object
 * (empty or `{}` means valid). May return a Promise for async validation.
 * @typedef {(values: Record<string, any>) => Record<string, string> | Promise<Record<string, string>>} ValidateFn
 */

/**
 * @typedef {Object} UseFormOptions
 * @property {'onChange' | 'onSubmit' | 'onBlur'} [validateMode='onChange']
 *   When to run validation. `onChange` re-validates after each field change;
 *   `onBlur` re-validates when a field is marked touched; `onSubmit` only
 *   validates on submit.
 * @property {boolean} [resetOnSubmit=false]
 *   Whether to reset the form to initial values after a successful submit.
 */

/**
 * Create a reactive form state manager.
 *
 * @param {Record<string, any>} initialValues
 * @param {ValidateFn} [validate]
 * @param {UseFormOptions} [options]
 * @returns {FormState}
 */
export function useForm(initialValues, validate, options = {}) {
  if (initialValues == null || typeof initialValues !== 'object') {
    throw new TypeError('[kupola] useForm() expects an initial values object.');
  }

  const { validateMode = 'onChange', resetOnSubmit = false } = options;

  // Snapshot the initial values so reset() can restore them exactly.
  const snapshot = { ...initialValues };

  const values = signal({ ...snapshot });
  const errors = signal({});
  const touched = signal({});
  const submitCount = signal(0);
  const isSubmitting = signal(false);

  // Track which fields have been changed from their initial value.
  const dirtyFields = signal(new Set());

  /** Derived: whether any field differs from its initial value. */
  const isDirty = computed(() => dirtyFields.value.size > 0);

  /** Derived: whether the form currently has any validation errors. */
  const isValid = computed(() => Object.keys(errors.value).length === 0);

  /**
   * Monotonically increasing counter for async validation race protection.
   * Each call to `runValidation()` bumps this counter. When an async
   * validator resolves, it only applies the result if the counter hasn't
   * changed — preventing a slow validator from overwriting a faster one.
   */
  let _validationVersion = 0;

  /**
   * Run the validate function and update the errors signal.
   *
   * Synchronous validators update `errors` synchronously so templates reflect
   * the new state in the same tick. Async validators (returning a Promise)
   * update `errors` once the promise resolves, but only if no newer validation
   * has started in the meantime (race protection).
   *
   * @returns {boolean | Promise<boolean>} true if valid (boolean for sync,
   *   Promise<boolean> for async validators).
   */
  function runValidation() {
    if (!validate) {return true;}
    const version = ++_validationVersion;
    let result;
    try {
      result = validate(values.value);
    } catch (err) {
      // If the validator throws, surface it as a generic form error.
      if (version === _validationVersion) {
        errors.value = { _form: err?.message || String(err) };
      }
      return false;
    }
    if (result && typeof result.then === 'function') {
      return result.then(
        (res) => {
          // Only apply the result if this is still the latest validation.
          if (version !== _validationVersion) {return Object.keys(errors.value).length === 0;}
          const next = res && typeof res === 'object' ? res : {};
          errors.value = next;
          return Object.keys(next).length === 0;
        },
        (err) => {
          if (version !== _validationVersion) {return false;}
          errors.value = { _form: err?.message || String(err) };
          return false;
        },
      );
    }
    // Synchronous: always apply (no race possible).
    const next = result && typeof result === 'object' ? result : {};
    errors.value = next;
    return Object.keys(next).length === 0;
  }

  /**
   * Mark a field as changed (dirty) relative to its initial value.
   * @param {string} name
   * @param {any} value
   */
  function markDirty(name, value) {
    const next = new Set(dirtyFields.value);
    if (!Object.is(value, snapshot[name])) {
      next.add(name);
    } else {
      next.delete(name);
    }
    dirtyFields.value = next;
  }

  /**
   * Set a single field value.
   * @param {string} name
   * @param {any} value
   */
  function setField(name, value) {
    values.value = { ...values.value, [name]: value };
    markDirty(name, value);
    if (validateMode === 'onChange') {
      // Fire-and-forget; validation updates the errors signal reactively.
      void runValidation();
    }
  }

  /**
   * Patch multiple fields at once.
   * @param {Record<string, any>} patch
   */
  function setFields(patch) {
    const next = { ...values.value, ...patch };
    values.value = next;
    const dirty = new Set(dirtyFields.value);
    for (const key of Object.keys(patch)) {
      if (!Object.is(patch[key], snapshot[key])) {
        dirty.add(key);
      } else {
        dirty.delete(key);
      }
    }
    dirtyFields.value = dirty;
    if (validateMode === 'onChange' || validateMode === 'onBlur') {
      void runValidation();
    }
  }

  /**
   * Mark a field as touched (e.g. on blur). Triggers validation when
   * validateMode is 'onBlur' or 'onChange'.
   * @param {string} name
   */
  function setTouched(name) {
    touched.value = { ...touched.value, [name]: true };
    if (validateMode === 'onBlur' || validateMode === 'onChange') {
      void runValidation();
    }
  }

  /**
   * Manually trigger validation.
   * @returns {boolean | Promise<boolean>}
   */
  function validateForm() {
    return runValidation();
  }

  /**
   * Reset the form to initial values (or a provided new initial state).
   * @param {Record<string, any>} [nextInitial]
   */
  function reset(nextInitial) {
    const target = nextInitial || snapshot;
    if (nextInitial) {
      // Re-base the snapshot so subsequent resets restore this state.
      for (const key of Object.keys(snapshot)) { delete snapshot[key]; }
      Object.assign(snapshot, target);
    }
    values.value = { ...target };
    errors.value = {};
    touched.value = {};
    dirtyFields.value = new Set();
    isSubmitting.value = false;
  }

  /**
   * Build a submit handler suitable for `<form onsubmit="${...}">`.
   * The handler prevents default, validates, and — if valid — calls the
   * provided async handler with the current values.
   *
   * @param {(values: Record<string, any>) => void | Promise<void>} handler
   * @returns {(event?: Event) => Promise<boolean>}
   */
  function handleSubmit(handler) {
    if (typeof handler !== 'function') {
      throw new TypeError('[kupola] useForm.handleSubmit() expects a handler function.');
    }
    return async function onSubmit(event) {
      if (event && typeof event.preventDefault === 'function') {
        event.preventDefault();
      }
      submitCount.value = submitCount.value + 1;

      const valid = await runValidation();
      if (!valid) {return false;}

      isSubmitting.value = true;
      try {
        await handler(values.value);
        if (resetOnSubmit) {reset();}
        return true;
      } finally {
        isSubmitting.value = false;
      }
    };
  }

  return {
    values,
    errors,
    touched,
    isDirty,
    isValid,
    isSubmitting,
    submitCount,
    setField,
    setFields,
    setTouched,
    validate: validateForm,
    reset,
    handleSubmit,
  };
}

/**
 * @typedef {Object} FormState
 * @property {import('@kupola/core').Signal<Record<string, any>>} values
 * @property {import('@kupola/core').Signal<Record<string, string>>} errors
 * @property {import('@kupola/core').Signal<Record<string, boolean>>} touched
 * @property {import('@kupola/core').ReadonlySignal<boolean>} isDirty
 * @property {import('@kupola/core').ReadonlySignal<boolean>} isValid
 * @property {import('@kupola/core').Signal<boolean>} isSubmitting
 * @property {import('@kupola/core').Signal<number>} submitCount
 * @property {(name: string, value: any) => void} setField
 * @property {(patch: Record<string, any>) => void} setFields
 * @property {(name: string) => void} setTouched
 * @property {() => (boolean | Promise<boolean>)} validate
 * @property {(nextInitial?: Record<string, any>) => void} reset
 * @property {(handler: (values: Record<string, any>) => void | Promise<void>)
 *   => (event?: Event) => Promise<boolean>} handleSubmit
 */
