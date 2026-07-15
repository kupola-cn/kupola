// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Unit tests for the Dialog component.
 * @jest-environment jsdom
 */

import { resetScheduler } from '../../src/index.js';
import { Dialog } from '../../src/components/dialog.js';

afterEach(() => {
  document.body.innerHTML = '';
  document.body.style.overflow = '';
  resetScheduler();
});

// ─── Confirm Dialog ──────────────────────────────────────────────────────────

describe('Dialog.confirm', () => {
  test('renders dialog with title and content', async () => {
    const promise = Dialog.confirm({ title: 'Confirm', content: 'Are you sure?' });

    const mask = document.body.querySelector('.ds-modal-mask');
    expect(mask).not.toBeNull();

    const title = document.body.querySelector('.ds-dialog__title');
    expect(title).not.toBeNull();
    expect(title.textContent).toBe('Confirm');

    const content = document.body.querySelector('.ds-dialog__content');
    expect(content).not.toBeNull();
    expect(content.textContent).toBe('Are you sure?');

    // Clean up
    const cancelBtn = document.body.querySelector('[data-action="cancel"]');
    cancelBtn.click();
    await promise;
  });

  test('resolves true when confirm is clicked', async () => {
    const promise = Dialog.confirm({ title: 'Test' });

    const confirmBtn = document.body.querySelector('[data-action="confirm"]');
    confirmBtn.click();

    const result = await promise;
    expect(result).toBe(true);
  });

  test('resolves false when cancel is clicked', async () => {
    const promise = Dialog.confirm({ title: 'Test' });

    const cancelBtn = document.body.querySelector('[data-action="cancel"]');
    cancelBtn.click();

    const result = await promise;
    expect(result).toBe(false);
  });

  test('resolves false on mask click', async () => {
    const promise = Dialog.confirm({ title: 'Test' });

    const mask = document.body.querySelector('.ds-modal-mask');
    mask.click();

    const result = await promise;
    expect(result).toBe(false);
  });

  test('resolves false on Escape key', async () => {
    const promise = Dialog.confirm({ title: 'Test' });

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    const result = await promise;
    expect(result).toBe(false);
  });

  test('resolves true on Enter key', async () => {
    const promise = Dialog.confirm({ title: 'Test' });

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));

    const result = await promise;
    expect(result).toBe(true);
  });

  test('hides cancel button when showCancel is false', () => {
    const promise = Dialog.confirm({ title: 'Test', showCancel: false });

    const cancelBtn = document.body.querySelector('[data-action="cancel"]');
    expect(cancelBtn).toBeNull();

    const confirmBtn = document.body.querySelector('[data-action="confirm"]');
    confirmBtn.click();
    return promise;
  });

  test('uses custom button text', () => {
    const promise = Dialog.confirm({
      title: 'Test',
      confirmText: 'Yes',
      cancelText: 'No',
    });

    const confirmBtn = document.body.querySelector('[data-action="confirm"]');
    const cancelBtn = document.body.querySelector('[data-action="cancel"]');
    expect(confirmBtn.textContent).toBe('Yes');
    expect(cancelBtn.textContent).toBe('No');

    cancelBtn.click();
    return promise;
  });

  test('renders with type-specific icon', () => {
    const promise = Dialog.confirm({ title: 'Warning', type: 'warning' });

    const icon = document.body.querySelector('.ds-dialog__icon--warning');
    expect(icon).not.toBeNull();

    const cancelBtn = document.body.querySelector('[data-action="cancel"]');
    cancelBtn.click();
    return promise;
  });

  test('sets body overflow hidden while open', async () => {
    const promise = Dialog.confirm({ title: 'Test' });
    expect(document.body.style.overflow).toBe('hidden');

    const confirmBtn = document.body.querySelector('[data-action="confirm"]');
    confirmBtn.click();
    await promise;
  });
});

// ─── Alert Dialog ────────────────────────────────────────────────────────────

describe('Dialog.alert', () => {
  test('shows dialog without cancel button', async () => {
    const promise = Dialog.alert({ title: 'Info', content: 'Hello' });

    const cancelBtn = document.body.querySelector('[data-action="cancel"]');
    expect(cancelBtn).toBeNull();

    const confirmBtn = document.body.querySelector('[data-action="confirm"]');
    expect(confirmBtn).not.toBeNull();
    confirmBtn.click();
    await promise;
  });

  test('resolves void when confirmed', async () => {
    const promise = Dialog.alert({ title: 'Done' });

    const confirmBtn = document.body.querySelector('[data-action="confirm"]');
    confirmBtn.click();

    const result = await promise;
    expect(result).toBeUndefined();
  });
});

// ─── Cleanup ─────────────────────────────────────────────────────────────────

describe('Dialog cleanup', () => {
  test('removes dialog DOM after confirm', async () => {
    const promise = Dialog.confirm({ title: 'Test' });

    const confirmBtn = document.body.querySelector('[data-action="confirm"]');
    confirmBtn.click();
    await promise;

    // Wait for cleanup timeout
    await new Promise((r) => setTimeout(r, 100));

    const mask = document.body.querySelector('.ds-modal-mask');
    expect(mask).toBeNull();
  });

  test('restores body overflow after close', async () => {
    const promise = Dialog.confirm({ title: 'Test' });
    expect(document.body.style.overflow).toBe('hidden');

    const confirmBtn = document.body.querySelector('[data-action="confirm"]');
    confirmBtn.click();
    await promise;

    expect(document.body.style.overflow).toBe('');
  });
});
