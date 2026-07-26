// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Unit tests for the Notification component.
 * @jest-environment jsdom
 */

import { resetScheduler } from '../../src/scheduler.js';
import { Notification } from '@kupola/components';

afterEach(() => {
  document.body.innerHTML = '';
  resetScheduler();
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('Notification rendering', () => {
  test('creates notification container in body', () => {
    const notify = Notification();
    notify.open({ title: 'Hello', message: 'World' });

    const container = document.body.querySelector('.ds-notification');
    expect(container).not.toBeNull();
    notify.destroy();
  });

  test('renders notification item with title and message', () => {
    const notify = Notification();
    notify.open({ title: 'Saved', message: 'Changes saved.' });

    const title = document.body.querySelector('.ds-notification__title');
    expect(title).not.toBeNull();
    expect(title.textContent).toBe('Saved');

    const message = document.body.querySelector('.ds-notification__message');
    expect(message).not.toBeNull();
    expect(message.textContent).toBe('Changes saved.');
    notify.destroy();
  });

  test('renders close button by default', () => {
    const notify = Notification();
    notify.open({ title: 'Test' });

    const closeBtn = document.body.querySelector('.ds-notification__close');
    expect(closeBtn).not.toBeNull();
    notify.destroy();
  });

  test('hides close button when closable is false', () => {
    const notify = Notification();
    notify.open({ title: 'Test', closable: false });

    const closeBtn = document.body.querySelector('.ds-notification__close');
    expect(closeBtn).toBeNull();
    notify.destroy();
  });

  test('applies type-specific class', () => {
    const notify = Notification();
    notify.success({ title: 'Done' });

    const item = document.body.querySelector('.ds-notification__item');
    expect(item.classList.contains('ds-notification__item--success')).toBe(true);
    notify.destroy();
  });

  test('renders icon for typed notifications', () => {
    const notify = Notification();
    notify.error({ title: 'Error' });

    const icon = document.body.querySelector('.ds-notification__icon');
    expect(icon).not.toBeNull();
    notify.destroy();
  });
});

describe('Notification type shortcuts', () => {
  test('success() creates success notification', () => {
    const notify = Notification();
    notify.success({ title: 'OK' });
    const item = document.body.querySelector('.ds-notification__item');
    expect(item.classList.contains('ds-notification__item--success')).toBe(true);
    notify.destroy();
  });

  test('warning() creates warning notification', () => {
    const notify = Notification();
    notify.warning({ title: 'Warn' });
    const item = document.body.querySelector('.ds-notification__item');
    expect(item.classList.contains('ds-notification__item--warning')).toBe(true);
    notify.destroy();
  });

  test('error() creates error notification', () => {
    const notify = Notification();
    notify.error({ title: 'Err' });
    const item = document.body.querySelector('.ds-notification__item');
    expect(item.classList.contains('ds-notification__item--error')).toBe(true);
    notify.destroy();
  });

  test('info() creates info notification', () => {
    const notify = Notification();
    notify.info({ title: 'Info' });
    const item = document.body.querySelector('.ds-notification__item');
    expect(item.classList.contains('ds-notification__item--info')).toBe(true);
    notify.destroy();
  });
});

describe('Notification close', () => {
  test('close removes notification immediately when no exit animation exists', () => {
    const notify = Notification();
    const { close, element } = notify.open({ title: 'Test', duration: 0 });

    const item = document.body.querySelector('.ds-notification__item');
    expect(element).toBe(item);

    close();

    expect(item.classList.contains('is-exiting')).toBe(true);
    expect(item.isConnected).toBe(false);
    expect(document.body.querySelector('.ds-notification')).toBeNull();
    notify.destroy();
  });

  test('clicking close button triggers close', () => {
    const notify = Notification();
    notify.open({ title: 'Test', duration: 0 });

    const closeBtn = document.body.querySelector('.ds-notification__close');
    closeBtn.click();

    expect(document.body.querySelector('.ds-notification__item')).toBeNull();
    notify.destroy();
  });

  test('uses animation events with a timeout fallback', () => {
    jest.useFakeTimers();
    jest.spyOn(window, 'getComputedStyle').mockReturnValue({
      animationDuration: '200ms',
      animationDelay: '50ms',
      transitionDuration: '0s',
      transitionDelay: '0s',
    });
    const notify = Notification();
    const { close, element } = notify.open({ title: 'Test', duration: 0 });

    close();
    expect(element.isConnected).toBe(true);
    jest.advanceTimersByTime(299);
    expect(element.isConnected).toBe(true);
    jest.advanceTimersByTime(1);
    expect(element.isConnected).toBe(false);
    expect(jest.getTimerCount()).toBe(0);
    notify.destroy();
  });

  test('finishes an animated close on the item event', () => {
    jest.useFakeTimers();
    jest.spyOn(window, 'getComputedStyle').mockReturnValue({
      animationDuration: '1s',
      animationDelay: '0s',
      transitionDuration: '0s',
      transitionDelay: '0s',
    });
    const notify = Notification();
    const { close, element } = notify.open({ title: 'Test', duration: 0 });

    close();
    element.dispatchEvent(new Event('animationend'));

    expect(element.isConnected).toBe(false);
    expect(jest.getTimerCount()).toBe(0);
    notify.destroy();
  });

  test('multiple notifications stack', () => {
    const notify = Notification();
    notify.open({ title: 'First', duration: 0 });
    notify.open({ title: 'Second', duration: 0 });

    const items = document.body.querySelectorAll('.ds-notification__item');
    expect(items.length).toBe(2);
    notify.destroy();
  });
});

describe('Notification position', () => {
  test('default position is top-right', () => {
    const notify = Notification();
    notify.open({ title: 'Test' });

    const container = document.body.querySelector('.ds-notification');
    expect(container.classList.contains('ds-notification--top-left')).toBe(false);
    expect(container.classList.contains('ds-notification--bottom')).toBe(false);
    notify.destroy();
  });

  test('setPosition changes container class', () => {
    const notify = Notification();
    notify.setPosition('top-left');
    notify.open({ title: 'Test' });

    const container = document.body.querySelector('.ds-notification');
    expect(container.classList.contains('ds-notification--top-left')).toBe(true);
    notify.destroy();
  });
});

describe('Notification destroy', () => {
  test('destroy removes container from DOM', () => {
    const notify = Notification();
    notify.open({ title: 'Test' });

    let container = document.body.querySelector('.ds-notification');
    expect(container).not.toBeNull();

    notify.destroy();

    container = document.body.querySelector('.ds-notification');
    expect(container).toBeNull();
  });

  test('destroy clears pending auto-close timers', () => {
    jest.useFakeTimers();
    const notify = Notification();
    notify.open({ title: 'Test', duration: 5000 });

    expect(jest.getTimerCount()).toBe(1);
    notify.destroy();
    expect(jest.getTimerCount()).toBe(0);
  });
});
