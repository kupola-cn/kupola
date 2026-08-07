// SPDX-License-Identifier: MIT
import { Message } from '@kupola/components';

describe('Message', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  // ── Rendering ──
  describe('rendering', () => {
    test('creates container on first show', () => {
      const msg = Message({ duration: 0 });
      msg.success('Hello');
      const container = document.querySelector('.ds-message');
      expect(container).not.toBeNull();
      msg.destroy();
    });

    test('creates message item with correct type class', () => {
      const msg = Message({ duration: 0 });
      msg.success('Done');
      const item = document.querySelector('.ds-message__item');
      expect(item).not.toBeNull();
      expect(item.classList.contains('ds-message__item--success')).toBe(true);
      msg.destroy();
    });

    test('renders message text content', () => {
      const msg = Message({ duration: 0 });
      msg.info('Version 2.0');
      const content = document.querySelector('.ds-message__content');
      expect(content.textContent).toBe('Version 2.0');
      msg.destroy();
    });

    test('renders icon SVG', () => {
      const msg = Message({ duration: 0 });
      msg.error('Failed');
      const icon = document.querySelector('.ds-message__icon');
      expect(icon).not.toBeNull();
      expect(icon.innerHTML).toContain('<svg');
      msg.destroy();
    });

    test('supports all message types', () => {
      const msg = Message({ duration: 0 });
      msg.normal('n');
      msg.success('s');
      msg.error('e');
      msg.warning('w');
      msg.info('i');
      const items = document.querySelectorAll('.ds-message__item');
      expect(items.length).toBe(5);
      expect(items[0].classList.contains('ds-message__item--normal')).toBe(true);
      expect(items[1].classList.contains('ds-message__item--success')).toBe(true);
      expect(items[2].classList.contains('ds-message__item--error')).toBe(true);
      expect(items[3].classList.contains('ds-message__item--warning')).toBe(true);
      expect(items[4].classList.contains('ds-message__item--info')).toBe(true);
      msg.destroy();
    });

    test('uses default position "top"', () => {
      const msg = Message({ duration: 0 });
      msg.success('Test');
      const container = document.querySelector('.ds-message');
      expect(container.classList.contains('ds-message--top')).toBe(true);
      msg.destroy();
    });

    test('uses custom position', () => {
      const msg = Message({ duration: 0, position: 'bottom-right' });
      msg.success('Test');
      const container = document.querySelector('.ds-message');
      expect(container.classList.contains('ds-message--bottom-right')).toBe(true);
      msg.destroy();
    });
  });

  // ── show() ──
  describe('show()', () => {
    test('returns object with element and close', () => {
      const msg = Message({ duration: 0 });
      const result = msg.show('Hello', 'success');
      expect(result).toHaveProperty('element');
      expect(result).toHaveProperty('close');
      expect(typeof result.close).toBe('function');
      msg.destroy();
    });

    test('close() removes message and empty container immediately without motion', () => {
      const msg = Message({ duration: 0 });
      const result = msg.show('Hello', 'success');
      const container = document.querySelector('.ds-message');
      expect(container.querySelectorAll('.ds-message__item').length).toBe(1);
      result.close();
      expect(result.element.classList.contains('is-exiting')).toBe(true);
      expect(result.element.isConnected).toBe(false);
      expect(document.querySelector('.ds-message')).toBeNull();
      msg.destroy();
    });

    test('close() is idempotent', () => {
      const msg = Message({ duration: 0 });
      const result = msg.show('Hello', 'success');

      result.close();
      expect(() => result.close()).not.toThrow();
      expect(result.element.isConnected).toBe(false);
      msg.destroy();
    });

    test('uses motion events with a timeout fallback', () => {
      jest.useFakeTimers();
      jest.spyOn(window, 'getComputedStyle').mockReturnValue({
        animationDuration: '200ms',
        animationDelay: '50ms',
        animationIterationCount: '1',
        transitionDuration: '0s',
        transitionDelay: '0s',
      });
      const msg = Message({ duration: 0 });
      const result = msg.show('Hello', 'success');

      result.close();
      expect(result.element.isConnected).toBe(true);
      jest.advanceTimersByTime(299);
      expect(result.element.isConnected).toBe(true);
      jest.advanceTimersByTime(1);
      expect(result.element.isConnected).toBe(false);
      expect(jest.getTimerCount()).toBe(0);
      msg.destroy();
    });

    test('ignores bubbled motion events from message children', () => {
      jest.useFakeTimers();
      jest.spyOn(window, 'getComputedStyle').mockReturnValue({
        animationDuration: '1s',
        animationDelay: '0s',
        animationIterationCount: '1',
        transitionDuration: '0s',
        transitionDelay: '0s',
      });
      const msg = Message({ duration: 0 });
      const result = msg.show('Hello', 'success');

      result.close();
      result.element.firstElementChild.dispatchEvent(new Event('animationend', { bubbles: true }));
      expect(result.element.isConnected).toBe(true);
      result.element.dispatchEvent(new Event('animationend'));
      expect(result.element.isConnected).toBe(false);
      expect(jest.getTimerCount()).toBe(0);
      msg.destroy();
    });
  });

  // ── maxCount ──
  describe('maxCount', () => {
    test('removes oldest message when maxCount exceeded', () => {
      const msg = Message({ duration: 0, maxCount: 3 });
      msg.info('1');
      msg.info('2');
      msg.info('3');
      msg.info('4');
      const items = document.querySelectorAll('.ds-message__item');
      expect(items.length).toBe(3);
      expect(items[0].querySelector('.ds-message__content').textContent).toBe('2');
      msg.destroy();
    });

    test('normalizes invalid maxCount instead of crashing', () => {
      const msg = Message({ duration: 0, maxCount: 0 });
      expect(() => msg.info('1')).not.toThrow();
      expect(document.querySelectorAll('.ds-message__item')).toHaveLength(1);
      msg.destroy();
    });
  });

  describe('auto-close', () => {
    test('removes a message after its duration', () => {
      jest.useFakeTimers();
      const msg = Message({ duration: 1000 });
      const result = msg.info('Timed');

      jest.advanceTimersByTime(999);
      expect(result.element.isConnected).toBe(true);
      jest.advanceTimersByTime(1);
      expect(result.element.isConnected).toBe(false);
      expect(jest.getTimerCount()).toBe(0);
      msg.destroy();
    });
  });

  // ── destroy ──
  describe('destroy()', () => {
    test('removes container from DOM', () => {
      const msg = Message({ duration: 0 });
      msg.success('Test');
      expect(document.querySelector('.ds-message')).not.toBeNull();
      msg.destroy();
      expect(document.querySelector('.ds-message')).toBeNull();
    });

    test('prevents new messages after destroy', () => {
      const msg = Message({ duration: 0 });
      msg.success('Before');
      msg.destroy();
      const result = msg.success('After');
      expect(result).toBeNull();
    });

    test('clears all pending timers and tolerates repeated destroy', () => {
      jest.useFakeTimers();
      const msg = Message({ duration: 5000 });
      msg.success('One');
      msg.info('Two');

      expect(jest.getTimerCount()).toBe(2);
      msg.destroy();
      msg.destroy();
      expect(jest.getTimerCount()).toBe(0);
      expect(document.querySelector('.ds-message')).toBeNull();
    });
  });
});
