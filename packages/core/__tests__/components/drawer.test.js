// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Unit tests for the Drawer component.
 * @jest-environment jsdom
 */

import { html } from '../../../platform/src/template.js';
import { resetScheduler } from '../../src/scheduler.js';
import { Drawer } from '@kupola/components';

afterEach(() => {
  document.body.innerHTML = '';
  document.body.style.overflow = '';
  resetScheduler();
});

// ─── Basic structure ─────────────────────────────────────────────────────────

describe('Drawer rendering', () => {
  test('renders mask, drawer, header, close button, and body', () => {
    const view = Drawer({ title: 'Settings' }, html`<p>Body</p>`);
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    expect(container.querySelector('.ds-drawer-mask')).not.toBeNull();
    expect(container.querySelector('.ds-drawer')).not.toBeNull();
    expect(container.querySelector('.ds-drawer__title').textContent).toBe('Settings');
    expect(container.querySelector('.ds-drawer__close')).not.toBeNull();
    expect(container.querySelector('.ds-drawer__body p').textContent).toBe('Body');

    view.destroy();
  });

  test('starts in closed state', () => {
    const view = Drawer({ title: 'Test' });
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    expect(container.querySelector('.ds-drawer-mask').classList.contains('is-visible')).toBe(false);
    expect(container.querySelector('.ds-drawer').classList.contains('is-visible')).toBe(false);

    view.destroy();
  });

  test('applies right placement class', () => {
    const view = Drawer({ title: 'Test', placement: 'right' });
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    expect(container.querySelector('.ds-drawer').classList.contains('ds-drawer--right')).toBe(true);

    view.destroy();
  });
});

// ─── Open / Close ────────────────────────────────────────────────────────────

describe('Drawer open/close', () => {
  test('open adds is-visible to both mask and drawer', () => {
    const view = Drawer({ title: 'Test' });
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    view.open();

    expect(container.querySelector('.ds-drawer-mask').classList.contains('is-visible')).toBe(true);
    expect(container.querySelector('.ds-drawer').classList.contains('is-visible')).toBe(true);

    view.destroy();
  });

  test('close removes is-visible from both mask and drawer', () => {
    const view = Drawer({ title: 'Test' });
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    view.open();
    view.close();

    expect(container.querySelector('.ds-drawer-mask').classList.contains('is-visible')).toBe(false);
    expect(container.querySelector('.ds-drawer').classList.contains('is-visible')).toBe(false);

    view.destroy();
  });

  test('open sets body overflow hidden', () => {
    const view = Drawer({ title: 'Test' });
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
    const view = Drawer({ title: 'Test' });
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    const mask = container.querySelector('.ds-drawer-mask');

    view.toggle();
    expect(mask.classList.contains('is-visible')).toBe(true);

    view.toggle();
    expect(mask.classList.contains('is-visible')).toBe(false);

    view.destroy();
  });
});

// ─── ESC close ───────────────────────────────────────────────────────────────

describe('Drawer ESC close', () => {
  test('pressing Escape closes the drawer', () => {
    const view = Drawer({ title: 'Test' });
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    view.open();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(container.querySelector('.ds-drawer-mask').classList.contains('is-visible')).toBe(false);

    view.destroy();
  });

  test('escClose: false disables ESC closing', () => {
    const view = Drawer({ title: 'Test', escClose: false });
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    view.open();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(container.querySelector('.ds-drawer-mask').classList.contains('is-visible')).toBe(true);

    view.destroy();
  });
});

// ─── Mask click ──────────────────────────────────────────────────────────────

describe('Drawer mask click', () => {
  test('clicking mask closes the drawer', () => {
    const view = Drawer({ title: 'Test' });
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    view.open();
    container.querySelector('.ds-drawer-mask').click();
    expect(container.querySelector('.ds-drawer-mask').classList.contains('is-visible')).toBe(false);

    view.destroy();
  });

  test('closableOnMask: false prevents mask click close', () => {
    const view = Drawer({ title: 'Test', closableOnMask: false });
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    view.open();
    container.querySelector('.ds-drawer-mask').click();
    expect(container.querySelector('.ds-drawer-mask').classList.contains('is-visible')).toBe(true);

    view.destroy();
  });
});

// ─── Close button ────────────────────────────────────────────────────────────

describe('Drawer close button', () => {
  test('clicking close button closes the drawer', () => {
    const view = Drawer({ title: 'Test' });
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    view.open();
    container.querySelector('.ds-drawer__close').click();
    expect(container.querySelector('.ds-drawer-mask').classList.contains('is-visible')).toBe(false);

    view.destroy();
  });
});

// ─── Destroy ─────────────────────────────────────────────────────────────────

describe('Drawer destroy', () => {
  test('destroy resets body overflow', () => {
    const view = Drawer({ title: 'Test' });
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

describe('Drawer width', () => {
  test('applies custom width', () => {
    const view = Drawer({ title: 'Test', width: '500px' });
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    expect(container.querySelector('.ds-drawer').style.width).toBe('500px');

    view.destroy();
  });
});
