// SPDX-License-Identifier: MIT
import type { Signal, ReadonlySignal } from '@kupola/core';

/**
 * Validation function: receives current values, returns an errors object
 * (empty or `{}` means valid). May return a Promise for async validation.
 */
export type ValidateFn = (
  values: Record<string, any>,
) => Record<string, string> | Promise<Record<string, string>>;

export interface UseFormOptions {
  /** When to run validation. Default: 'onChange'. */
  validateMode?: 'onChange' | 'onSubmit' | 'onBlur';
  /** Whether to reset the form to initial values after a successful submit. */
  resetOnSubmit?: boolean;
}

export interface FormState {
  values: Signal<Record<string, any>>;
  errors: Signal<Record<string, string>>;
  touched: Signal<Record<string, boolean>>;
  isDirty: ReadonlySignal<boolean>;
  isValid: ReadonlySignal<boolean>;
  isSubmitting: Signal<boolean>;
  submitCount: Signal<number>;
  setField: (name: string, value: any) => void;
  setFields: (patch: Record<string, any>) => void;
  setTouched: (name: string) => void;
  validate: () => boolean | Promise<boolean>;
  reset: (nextInitial?: Record<string, any>) => void;
  handleSubmit: (
    handler: (values: Record<string, any>) => void | Promise<void>,
  ) => (event?: Event) => Promise<boolean>;
}

/**
 * Create a reactive form state manager backed by signals.
 *
 * @param initialValues Initial form values.
 * @param validate Optional validation function returning an errors object.
 * @param options Configuration options.
 */
export declare function useForm(
  initialValues: Record<string, any>,
  validate?: ValidateFn,
  options?: UseFormOptions,
): FormState;
