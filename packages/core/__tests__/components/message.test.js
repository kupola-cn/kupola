// SPDX-License-Identifier: MIT
import { Message } from '@kupola/components';

describe('Message', () => {
  afterEach(() => {
    document.body.innerHTML = '';
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

    test('close() removes message', () => {
      const msg = Message({ duration: 0 });
      const result = msg.show('Hello', 'success');
      const container = document.querySelector('.ds-message');
      expect(container.querySelectorAll('.ds-message__item').length).toBe(1);
      result.close();
      // After close, item gets is-exiting class
      expect(result.element.classList.contains('is-exiting')).toBe(true);
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
      // 4 items appended, but oldest gets is-exiting class
      expect(items.length).toBe(4);
      expect(items[0].classList.contains('is-exiting')).toBe(true);
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
  });
});
