// SPDX-License-Identifier: MIT
/**
 * @kupola/platform — Unit tests for useForm() form state hook.
 */

import { useForm } from '../src/form.js';

describe('useForm — initialization', () => {
  test('throws on non-object initial values', () => {
    expect(() => useForm(null)).toThrow(TypeError);
    expect(() => useForm('x')).toThrow(TypeError);
  });

  test('initializes values from the provided object', () => {
    const form = useForm({ name: 'Ada', age: 30 });
    expect(form.values.value).toEqual({ name: 'Ada', age: 30 });
  });

  test('starts clean with no errors and not submitting', () => {
    const form = useForm({ a: 1 });
    expect(form.isDirty.value).toBe(false);
    expect(form.isValid.value).toBe(true);
    expect(form.isSubmitting.value).toBe(false);
    expect(form.submitCount.value).toBe(0);
    expect(form.errors.value).toEqual({});
    expect(form.touched.value).toEqual({});
  });

  test('does not mutate the original initial values object', () => {
    const init = { name: 'x' };
    const form = useForm(init);
    form.setField('name', 'y');
    expect(init.name).toBe('x');
  });
});

describe('useForm — setField / setFields', () => {
  test('setField updates a single field', () => {
    const form = useForm({ name: '', age: 0 });
    form.setField('name', 'Grace');
    expect(form.values.value.name).toBe('Grace');
    expect(form.values.value.age).toBe(0);
  });

  test('setField marks the form dirty', () => {
    const form = useForm({ name: '' });
    expect(form.isDirty.value).toBe(false);
    form.setField('name', 'x');
    expect(form.isDirty.value).toBe(true);
  });

  test('setField back to initial value clears dirty for that field', () => {
    const form = useForm({ name: 'init' });
    form.setField('name', 'changed');
    expect(form.isDirty.value).toBe(true);
    form.setField('name', 'init');
    expect(form.isDirty.value).toBe(false);
  });

  test('setFields patches multiple fields at once', () => {
    const form = useForm({ a: 1, b: 2, c: 3 });
    form.setFields({ a: 10, c: 30 });
    expect(form.values.value).toEqual({ a: 10, b: 2, c: 30 });
    expect(form.isDirty.value).toBe(true);
  });
});

describe('useForm — validation', () => {
  test('runs validation on change by default (sync)', () => {
    const form = useForm(
      { name: '' },
      (v) => (v.name ? {} : { name: 'required' }),
    );
    // Initial state — validation not run at init.
    expect(form.errors.value).toEqual({});
    form.setField('name', '');
    // Sync validator updates errors synchronously.
    expect(form.errors.value).toEqual({ name: 'required' });
  });

  test('clears errors when value becomes valid', () => {
    const form = useForm(
      { name: '' },
      (v) => (v.name ? {} : { name: 'required' }),
    );
    form.setField('name', '');
    expect(form.errors.value.name).toBe('required');
    form.setField('name', 'ok');
    expect(form.errors.value).toEqual({});
    expect(form.isValid.value).toBe(true);
  });

  test('validateMode=onSubmit does not validate on change', () => {
    const form = useForm(
      { name: '' },
      (v) => (v.name ? {} : { name: 'required' }),
      { validateMode: 'onSubmit' },
    );
    form.setField('name', '');
    expect(form.errors.value).toEqual({});
  });

  test('validateMode=onBlur validates on setFields', () => {
    const form = useForm(
      { name: '' },
      (v) => (v.name ? {} : { name: 'required' }),
      { validateMode: 'onBlur' },
    );
    form.setFields({ name: 'ok' });
    expect(form.errors.value.name).toBeUndefined();
  });

  test('validateMode=onBlur validates on setTouched', () => {
    const form = useForm(
      { name: '' },
      (v) => (v.name ? {} : { name: 'required' }),
      { validateMode: 'onBlur' },
    );
    form.setTouched('name');
    expect(form.errors.value.name).toBe('required');
  });

  test('manual validate() returns validity (sync)', () => {
    const form = useForm(
      { age: -1 },
      (v) => (v.age >= 0 ? {} : { age: 'negative' }),
    );
    const valid = form.validate();
    expect(valid).toBe(false);
    expect(form.errors.value.age).toBe('negative');

    form.setField('age', 5);
    const valid2 = form.validate();
    expect(valid2).toBe(true);
  });

  test('async validation functions are awaited', async () => {
    const form = useForm(
      { code: '' },
      async (v) => {
        await Promise.resolve();
        return v.code === 'OK' ? {} : { code: 'bad' };
      },
    );
    const valid = await form.validate();
    expect(valid).toBe(false);
    expect(form.errors.value.code).toBe('bad');
  });

  test('validator throwing is captured as _form error', () => {
    const form = useForm({ x: 1 }, () => { throw new Error('boom'); });
    const valid = form.validate();
    expect(valid).toBe(false);
    expect(form.errors.value._form).toBe('boom');
  });

  test('async validator rejecting is captured as _form error', async () => {
    const form = useForm({ x: 1 }, async () => { throw new Error('async-boom'); });
    const valid = await form.validate();
    expect(valid).toBe(false);
    expect(form.errors.value._form).toBe('async-boom');
  });
});

describe('useForm — handleSubmit', () => {
  test('throws if handler is not a function', () => {
    const form = useForm({ a: 1 });
    expect(() => form.handleSubmit(null)).toThrow(TypeError);
  });

  test('prevents default on the event', async () => {
    const form = useForm({ a: 1 });
    const submit = form.handleSubmit(() => {});
    const evt = { preventDefault: jest.fn() };
    await submit(evt);
    expect(evt.preventDefault).toHaveBeenCalled();
  });

  test('calls handler with current values when valid', async () => {
    const form = useForm({ name: 'Ada' });
    const handler = jest.fn().mockResolvedValue(undefined);
    const submit = form.handleSubmit(handler);
    const ok = await submit();
    expect(handler).toHaveBeenCalledWith({ name: 'Ada' });
    expect(ok).toBe(true);
    expect(form.submitCount.value).toBe(1);
  });

  test('does not call handler when validation fails', async () => {
    const form = useForm(
      { name: '' },
      (v) => (v.name ? {} : { name: 'required' }),
    );
    const handler = jest.fn();
    const ok = await form.handleSubmit(handler)();
    expect(ok).toBe(false);
    expect(handler).not.toHaveBeenCalled();
    expect(form.submitCount.value).toBe(1);
  });

  test('toggles isSubmitting around the handler', async () => {
    const form = useForm({ a: 1 });
    let seen;
    const submit = form.handleSubmit(async () => {
      seen = form.isSubmitting.value;
    });
    expect(form.isSubmitting.value).toBe(false);
    await submit();
    expect(seen).toBe(true);
    expect(form.isSubmitting.value).toBe(false);
  });

  test('resetOnSubmit resets the form after success', async () => {
    const form = useForm(
      { name: '' },
      (v) => (v.name ? {} : { name: 'required' }),
      { resetOnSubmit: true },
    );
    form.setField('name', 'Grace');
    const handler = jest.fn();
    await form.handleSubmit(handler)();
    expect(form.values.value.name).toBe('');
    expect(form.isDirty.value).toBe(false);
  });

  test('isSubmitting resets even if handler throws', async () => {
    const form = useForm({ a: 1 });
    const submit = form.handleSubmit(async () => { throw new Error('fail'); });
    await expect(submit()).rejects.toThrow('fail');
    expect(form.isSubmitting.value).toBe(false);
  });
});

describe('useForm — reset', () => {
  test('reset restores initial values', () => {
    const form = useForm({ name: 'init', age: 0 });
    form.setField('name', 'changed');
    form.setField('age', 99);
    form.reset();
    expect(form.values.value).toEqual({ name: 'init', age: 0 });
    expect(form.isDirty.value).toBe(false);
    expect(form.errors.value).toEqual({});
    expect(form.touched.value).toEqual({});
  });

  test('reset with new values re-bases the snapshot', () => {
    const form = useForm({ name: 'a' });
    form.reset({ name: 'b' });
    expect(form.values.value).toEqual({ name: 'b' });
    form.setField('name', 'c');
    form.reset();
    // Should restore to 'b', not the original 'a'.
    expect(form.values.value.name).toBe('b');
  });
});

describe('useForm — touched tracking', () => {
  test('setTouched marks a field as touched', () => {
    const form = useForm({ a: 1 });
    form.setTouched('a');
    expect(form.touched.value.a).toBe(true);
  });

  test('reset clears touched state', () => {
    const form = useForm({ a: 1 });
    form.setTouched('a');
    form.reset();
    expect(form.touched.value).toEqual({});
  });
});

// ── Async validation race condition ──────────────────────────────────────────

describe('useForm — async validation race', () => {
  test('slow validator does not overwrite fast validator result', async () => {
    let resolveSlow;
    const validate = (v) => {
      if (v.name === 'slow') {
        return new Promise((resolve) => {
          resolveSlow = resolve;
        });
      }
      return Promise.resolve({ name: 'fast-error' });
    };
    const form = useForm({ name: '' }, validate, { validateMode: 'onChange' });

    // Trigger slow validation.
    form.setField('name', 'slow');
    // Trigger fast validation (should override slow when it resolves).
    form.setField('name', 'fast');

    // Resolve the slow validator.
    resolveSlow({ name: 'slow-error' });
    await new Promise((r) => setTimeout(r, 10));

    // The fast validator's result should win.
    expect(form.errors.value.name).toBe('fast-error');
  });
});
