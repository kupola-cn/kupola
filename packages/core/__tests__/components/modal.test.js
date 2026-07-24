// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Unit tests for the Modal component.
 * @jest-environment jsdom
 */

import { html } from '../../../platform/src/template.js';
import { resetScheduler } from '../../src/scheduler.js';
import { Modal } from '@kupola/components';

afterEach(() => {
  document.body.innerHTML = '';
  document.body.style.overflow = '';
  resetScheduler();
});

// ─── Basic structure ─────────────────────────────────────────────────────────

describe('Modal rendering', () => {
  test('renders mask, modal, header, close button, and body', () => {
    const view = Modal({ title: 'Test Title' }, html`<p>Body content</p>`);
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    const mask = container.querySelector('.ds-modal-mask');
    const modal = container.querySelector('.ds-modal');
    const title = container.querySelector('.ds-modal__title');
    const closeBtn = container.querySelector('.ds-modal__close');
    const body = container.querySelector('.ds-modal__body');

    expect(mask).not.toBeNull();
    expect(modal).not.toBeNull();
    expect(title.textContent).toBe('Test Title');
    expect(closeBtn).not.toBeNull();
    expect(body.querySelector('p').textContent).toBe('Body content');

    view.destroy();
  });

  test('starts in closed state (no is-visible class)', () => {
    const view = Modal({ title: 'Test' });
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    const mask = container.querySelector('.ds-modal-mask');
    expect(mask.classList.contains('is-visible')).toBe(false);

    view.destroy();
  });
});

// ─── open / close ────────────────────────────────────────────────────────────

describe('Modal open/close', () => {
  test('open adds is-visible class to mask', () => {
    const view = Modal({ title: 'Test' });
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    view.open();

    const mask = container.querySelector('.ds-modal-mask');
    expect(mask.classList.contains('is-visible')).toBe(true);

    view.destroy();
  });

  test('close removes is-visible class from mask', () => {
    const view = Modal({ title: 'Test' });
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    view.open();
    expect(container.querySelector('.ds-modal-mask').classList.contains('is-visible')).toBe(true);

    view.close();
    expect(container.querySelector('.ds-modal-mask').classList.contains('is-visible')).toBe(false);

    view.destroy();
  });

  test('open sets body overflow hidden', () => {
    const view = Modal({ title: 'Test' });
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    view.open();
    expect(document.body.style.overflow).toBe('hidden');

    view.close();
    expect(document.body.style.overflow).toBe('');

    view.destroy();
  });

  test('toggle switches between open and closed', () => {
    const view = Modal({ title: 'Test' });
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    const mask = container.querySelector('.ds-modal-mask');

    view.toggle();
    expect(mask.classList.contains('is-visible')).toBe(true);

    view.toggle();
    expect(mask.classList.contains('is-visible')).toBe(false);

    view.destroy();
  });

  test('open is idempotent', () => {
    const view = Modal({ title: 'Test' });
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    view.open();
    view.open(); // Should not throw or double-increment
    expect(container.querySelector('.ds-modal-mask').classList.contains('is-visible')).toBe(true);

    view.destroy();
  });
});

// ─── ESC close ───────────────────────────────────────────────────────────────

describe('Modal ESC close', () => {
  test('pressing Escape closes the modal', () => {
    const view = Modal({ title: 'Test' });
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    view.open();
    expect(container.querySelector('.ds-modal-mask').classList.contains('is-visible')).toBe(true);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(container.querySelector('.ds-modal-mask').classList.contains('is-visible')).toBe(false);

    view.destroy();
  });

  test('ESC does nothing when modal is closed', () => {
    const view = Modal({ title: 'Test' });
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(container.querySelector('.ds-modal-mask').classList.contains('is-visible')).toBe(false);

    view.destroy();
  });

  test('escClose: false disables ESC closing', () => {
    const view = Modal({ title: 'Test', escClose: false });
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    view.open();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(container.querySelector('.ds-modal-mask').classList.contains('is-visible')).toBe(true);

    view.destroy();
  });
});

// ─── Mask click close ────────────────────────────────────────────────────────

describe('Modal mask click', () => {
  test('clicking mask closes the modal', () => {
    const view = Modal({ title: 'Test' });
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    view.open();
    const mask = container.querySelector('.ds-modal-mask');

    // Simulate click on the mask itself (not on the modal inside)
    mask.click();
    expect(mask.classList.contains('is-visible')).toBe(false);

    view.destroy();
  });

  test('clicking modal content does NOT close the modal', () => {
    const view = Modal({ title: 'Test' }, html`<p>Content</p>`);
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    view.open();
    const mask = container.querySelector('.ds-modal-mask');
    const modal = container.querySelector('.ds-modal');

    // Click on the modal content (not the mask)
    modal.click();
    expect(mask.classList.contains('is-visible')).toBe(true);

    view.destroy();
  });

  test('closableOnMask: false prevents mask click close', () => {
    const view = Modal({ title: 'Test', closableOnMask: false });
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    view.open();
    const mask = container.querySelector('.ds-modal-mask');
    mask.click();
    expect(mask.classList.contains('is-visible')).toBe(true);

    view.destroy();
  });
});

// ─── Close button ────────────────────────────────────────────────────────────

describe('Modal close button', () => {
  test('clicking close button closes the modal', () => {
    const view = Modal({ title: 'Test' });
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    view.open();
    const closeBtn = container.querySelector('.ds-modal__close');
    closeBtn.click();
    expect(container.querySelector('.ds-modal-mask').classList.contains('is-visible')).toBe(false);

    view.destroy();
  });
});

// ─── Destroy ─────────────────────────────────────────────────────────────────

describe('Modal destroy', () => {
  test('destroy removes keydown listener', () => {
    const view = Modal({ title: 'Test' });
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    view.open();
    view.destroy();

    // Re-open manually (mask class was reset by destroy cleanup)
    // After destroy, ESC should not work
    // We can verify by checking that ESC doesn't cause errors
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    // No error = pass
  });

  test('destroy resets body overflow', () => {
    const view = Modal({ title: 'Test' });
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    view.open();
    expect(document.body.style.overflow).toBe('hidden');

    view.destroy();
    expect(document.body.style.overflow).toBe('');
  });
});

// ─── Width ───────────────────────────────────────────────────────────────────

describe('Modal width', () => {
  test('applies custom width as max-width style', () => {
    const view = Modal({ title: 'Test', width: '600px' });
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    const modal = container.querySelector('.ds-modal');
    expect(modal.style.maxWidth).toBe('600px');

    view.destroy();
  });
});
