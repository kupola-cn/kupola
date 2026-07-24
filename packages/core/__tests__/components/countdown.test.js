// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Unit tests for the Countdown component.
 * @jest-environment jsdom
 */

import { resetScheduler } from '../../src/scheduler.js';
import { Countdown } from '@kupola/components';

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
  document.body.innerHTML = '';
  resetScheduler();
});

// ─── Basic rendering ─────────────────────────────────────────────────────────

describe('Countdown rendering', () => {
  test('renders a countdown element', () => {
    const view = Countdown();
    document.body.appendChild(view.element);

    const cd = document.body.querySelector('.ds-countdown');
    expect(cd).not.toBeNull();
  });

  test('renders four time units', () => {
    const view = Countdown();
    document.body.appendChild(view.element);

    const items = document.body.querySelectorAll('.ds-countdown__item');
    expect(items.length).toBe(4);
  });

  test('renders separators', () => {
    const view = Countdown();
    document.body.appendChild(view.element);

    const seps = document.body.querySelectorAll('.ds-countdown__separator');
    expect(seps.length).toBe(3);
  });

  test('displays initial zeros', () => {
    const view = Countdown();
    document.body.appendChild(view.element);

    const days = document.body.querySelector('.ds-countdown__days');
    const hours = document.body.querySelector('.ds-countdown__hours');
    const minutes = document.body.querySelector('.ds-countdown__minutes');
    const seconds = document.body.querySelector('.ds-countdown__seconds');

    expect(days.textContent).toBe('00');
    expect(hours.textContent).toBe('00');
    expect(minutes.textContent).toBe('00');
    expect(seconds.textContent).toBe('00');
  });
});

// ─── Countdown behavior ─────────────────────────────────────────────────────

describe('Countdown behavior', () => {
  test('updates display when target is set', () => {
    // 1 hour, 2 minutes, 3 seconds from "now"
    const now = Date.now();
    jest.spyOn(Date, 'now').mockReturnValue(now);

    const target = now + 3723000; // 1h 2m 3s
    const view = Countdown({ target });
    document.body.appendChild(view.element);

    const hours = document.body.querySelector('.ds-countdown__hours');
    const minutes = document.body.querySelector('.ds-countdown__minutes');
    const seconds = document.body.querySelector('.ds-countdown__seconds');

    expect(hours.textContent).toBe('01');
    expect(minutes.textContent).toBe('02');
    expect(seconds.textContent).toBe('03');

    Date.now.mockRestore();
  });

  test('calls onComplete when countdown reaches zero', () => {
    const now = Date.now();
    jest.spyOn(Date, 'now').mockReturnValue(now);

    const onComplete = jest.fn();
    const target = now + 1000; // 1 second
    const view = Countdown({ target, onComplete });
    document.body.appendChild(view.element);

    // Advance past the target
    Date.now.mockReturnValue(now + 2000);
    jest.advanceTimersByTime(1000);

    expect(onComplete).toHaveBeenCalledTimes(1);

    Date.now.mockRestore();
  });

  test('stop() halts the countdown', () => {
    const now = Date.now();
    jest.spyOn(Date, 'now').mockReturnValue(now);

    const target = now + 60000;
    const view = Countdown({ target });
    document.body.appendChild(view.element);

    view.stop();

    // Advance time - should not update further
    const secondsBefore = document.body.querySelector('.ds-countdown__seconds').textContent;
    Date.now.mockReturnValue(now + 5000);
    jest.advanceTimersByTime(5000);
    const secondsAfter = document.body.querySelector('.ds-countdown__seconds').textContent;

    expect(secondsBefore).toBe(secondsAfter);

    Date.now.mockRestore();
  });

  test('start() with new target restarts countdown', () => {
    const now = Date.now();
    jest.spyOn(Date, 'now').mockReturnValue(now);

    const view = Countdown({ target: now + 60000 });
    document.body.appendChild(view.element);

    const newTarget = now + 120000; // 2 minutes
    view.start(newTarget);

    const minutes = document.body.querySelector('.ds-countdown__minutes');
    expect(minutes.textContent).toBe('02');

    Date.now.mockRestore();
  });
});

// ─── Destroy ─────────────────────────────────────────────────────────────────

describe('Countdown destroy', () => {
  test('destroy() stops timer and cleans up', () => {
    const now = Date.now();
    jest.spyOn(Date, 'now').mockReturnValue(now);

    const view = Countdown({ target: now + 60000 });
    document.body.appendChild(view.element);

    expect(() => view.destroy()).not.toThrow();

    Date.now.mockRestore();
  });
});
