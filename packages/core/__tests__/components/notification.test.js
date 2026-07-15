// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Unit tests for the Notification component.
 * @jest-environment jsdom
 */

import { resetScheduler } from '../../src/index.js';
import { Notification } from '../../src/components/notification.js';

afterEach(() => {
  Notification.destroy();
  document.body.innerHTML = '';
  resetScheduler();
});

// ─── Basic rendering ─────────────────────────────────────────────────────────

describe('Notification rendering', () => {
  test('creates notification container in body', () => {
    Notification.open({ title: 'Hello', message: 'World' });

    const container = document.body.querySelector('.ds-notification');
    expect(container).not.toBeNull();
  });

  test('renders notification item with title and message', () => {
    Notification.open({ title: 'Saved', message: 'Changes saved.' });

    const title = document.body.querySelector('.ds-notification__title');
    expect(title).not.toBeNull();
    expect(title.textContent).toBe('Saved');

    const message = document.body.querySelector('.ds-notification__message');
    expect(message).not.toBeNull();
    expect(message.textContent).toBe('Changes saved.');
  });

  test('renders close button by default', () => {
    Notification.open({ title: 'Test' });

    const closeBtn = document.body.querySelector('.ds-notification__close');
    expect(closeBtn).not.toBeNull();
  });

  test('hides close button when closable is false', () => {
    Notification.open({ title: 'Test', closable: false });

    const closeBtn = document.body.querySelector('.ds-notification__close');
    expect(closeBtn).toBeNull();
  });

  test('applies type-specific class', () => {
    Notification.success({ title: 'Done' });

    const item = document.body.querySelector('.ds-notification__item');
    expect(item.classList.contains('ds-notification__item--success')).toBe(true);
  });

  test('renders icon for typed notifications', () => {
    Notification.error({ title: 'Error' });

    const icon = document.body.querySelector('.ds-notification__icon');
    expect(icon).not.toBeNull();
  });
});

// ─── Type shortcuts ──────────────────────────────────────────────────────────

describe('Notification type shortcuts', () => {
  test('success() creates success notification', () => {
    Notification.success({ title: 'OK' });
    const item = document.body.querySelector('.ds-notification__item');
    expect(item.classList.contains('ds-notification__item--success')).toBe(true);
  });

  test('warning() creates warning notification', () => {
    Notification.warning({ title: 'Warn' });
    const item = document.body.querySelector('.ds-notification__item');
    expect(item.classList.contains('ds-notification__item--warning')).toBe(true);
  });

  test('error() creates error notification', () => {
    Notification.error({ title: 'Err' });
    const item = document.body.querySelector('.ds-notification__item');
    expect(item.classList.contains('ds-notification__item--error')).toBe(true);
  });

  test('info() creates info notification', () => {
    Notification.info({ title: 'Info' });
    const item = document.body.querySelector('.ds-notification__item');
    expect(item.classList.contains('ds-notification__item--info')).toBe(true);
  });
});

// ─── Close behavior ──────────────────────────────────────────────────────────

describe('Notification close', () => {
  test('close button removes notification', () => {
    const { close } = Notification.open({ title: 'Test', duration: 0 });

    const item = document.body.querySelector('.ds-notification__item');
    expect(item).not.toBeNull();

    close();

    // After animationend (jsdom fires immediately for synthetic events)
    // The item should have is-exiting class
    expect(item.classList.contains('is-exiting')).toBe(true);
  });

  test('clicking close button triggers close', () => {
    Notification.open({ title: 'Test', duration: 0 });

    const closeBtn = document.body.querySelector('.ds-notification__close');
    closeBtn.click();

    const item = document.body.querySelector('.ds-notification__item');
    expect(item.classList.contains('is-exiting')).toBe(true);
  });

  test('multiple notifications stack', () => {
    Notification.open({ title: 'First', duration: 0 });
    Notification.open({ title: 'Second', duration: 0 });

    const items = document.body.querySelectorAll('.ds-notification__item');
    expect(items.length).toBe(2);
  });
});

// ─── Position ────────────────────────────────────────────────────────────────

describe('Notification position', () => {
  test('default position is top-right', () => {
    Notification.open({ title: 'Test' });

    const container = document.body.querySelector('.ds-notification');
    expect(container.classList.contains('ds-notification--top-left')).toBe(false);
    expect(container.classList.contains('ds-notification--bottom')).toBe(false);
  });

  test('setPosition changes container class', () => {
    Notification.setPosition('top-left');
    Notification.open({ title: 'Test' });

    const container = document.body.querySelector('.ds-notification');
    expect(container.classList.contains('ds-notification--top-left')).toBe(true);
  });
});

// ─── Destroy ─────────────────────────────────────────────────────────────────

describe('Notification destroy', () => {
  test('destroy removes container from DOM', () => {
    Notification.open({ title: 'Test' });

    let container = document.body.querySelector('.ds-notification');
    expect(container).not.toBeNull();

    Notification.destroy();

    container = document.body.querySelector('.ds-notification');
    expect(container).toBeNull();
  });
});
