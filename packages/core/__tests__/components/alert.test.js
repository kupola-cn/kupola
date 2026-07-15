// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Unit tests for the Alert component.
 * @jest-environment jsdom
 */

import { resetScheduler } from '../../src/index.js';
import { Alert } from '../../src/components/alert.js';

afterEach(() => {
  document.body.innerHTML = '';
  resetScheduler();
});

// ─── Basic rendering ─────────────────────────────────────────────────────────

describe('Alert rendering', () => {
  test('renders alert with title and description', () => {
    const view = Alert({ title: 'Warning', description: 'Be careful' });
    document.body.appendChild(view.element);

    const title = document.body.querySelector('.ds-alert__title');
    expect(title).not.toBeNull();
    expect(title.textContent).toBe('Warning');

    const desc = document.body.querySelector('.ds-alert__desc');
    expect(desc).not.toBeNull();
    expect(desc.textContent).toBe('Be careful');
  });

  test('applies type class', () => {
    const view = Alert({ title: 'Error', type: 'danger' });
    document.body.appendChild(view.element);

    const alert = document.body.querySelector('.ds-alert');
    expect(alert).not.toBeNull();
    expect(alert.classList.contains('ds-alert--danger')).toBe(true);
  });

  test('defaults to normal type', () => {
    const view = Alert({ title: 'Info' });
    document.body.appendChild(view.element);

    const alert = document.body.querySelector('.ds-alert');
    expect(alert.classList.contains('ds-alert--normal')).toBe(true);
  });

  test('renders without title when not provided', () => {
    const view = Alert({ description: 'Just a message' });
    document.body.appendChild(view.element);

    const title = document.body.querySelector('.ds-alert__title');
    expect(title).toBeNull();
  });

  test('renders without description when not provided', () => {
    const view = Alert({ title: 'Only title' });
    document.body.appendChild(view.element);

    const desc = document.body.querySelector('.ds-alert__desc');
    expect(desc).toBeNull();
  });

  test('has role="alert" attribute', () => {
    const view = Alert({ title: 'Test' });
    document.body.appendChild(view.element);

    const alert = document.body.querySelector('.ds-alert');
    expect(alert.getAttribute('role')).toBe('alert');
  });
});

// ─── Closable ────────────────────────────────────────────────────────────────

describe('Alert closable', () => {
  test('shows close button when closable', () => {
    const view = Alert({ title: 'Closable', closable: true });
    document.body.appendChild(view.element);

    const closeBtn = document.body.querySelector('.ds-alert__close');
    expect(closeBtn).not.toBeNull();
  });

  test('does not show close button by default', () => {
    const view = Alert({ title: 'Not closable' });
    document.body.appendChild(view.element);

    const closeBtn = document.body.querySelector('.ds-alert__close');
    expect(closeBtn).toBeNull();
  });

  test('dismiss() adds is-dismissed class', () => {
    const view = Alert({ title: 'Dismiss me', closable: true });
    document.body.appendChild(view.element);

    const alert = document.body.querySelector('.ds-alert');
    view.dismiss();

    expect(alert.classList.contains('is-dismissed')).toBe(true);
  });

  test('close button click triggers dismiss', () => {
    const onClose = jest.fn();
    const view = Alert({ title: 'Click close', closable: true, onClose });
    document.body.appendChild(view.element);

    const closeBtn = document.body.querySelector('.ds-alert__close');
    closeBtn.click();

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('dismiss() is idempotent', () => {
    const onClose = jest.fn();
    const view = Alert({ title: 'Double dismiss', closable: true, onClose });
    document.body.appendChild(view.element);

    view.dismiss();
    view.dismiss();

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

// ─── Destroy ─────────────────────────────────────────────────────────────────

describe('Alert destroy', () => {
  test('destroy() cleans up the reactive instance', () => {
    const view = Alert({ title: 'Destroy me' });
    document.body.appendChild(view.element);

    expect(document.body.querySelector('.ds-alert')).not.toBeNull();
    // destroy should not throw
    expect(() => view.destroy()).not.toThrow();
  });
});
