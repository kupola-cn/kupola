// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Unit tests for the Avatar component.
 * @jest-environment jsdom
 */

import { resetScheduler } from '../../src/index.js';
import { Avatar } from '../../src/components/avatar.js';

afterEach(() => {
  document.body.innerHTML = '';
  resetScheduler();
});

// ─── Basic rendering ─────────────────────────────────────────────────────────

describe('Avatar rendering', () => {
  test('renders an avatar element', () => {
    const view = Avatar();
    document.body.appendChild(view.element);

    const avatar = document.body.querySelector('.ds-avatar');
    expect(avatar).not.toBeNull();
  });

  test('renders text content', () => {
    const view = Avatar({ text: 'JD' });
    document.body.appendChild(view.element);

    const avatar = document.body.querySelector('.ds-avatar');
    expect(avatar.textContent).toBe('JD');
  });

  test('renders image when src provided', () => {
    const view = Avatar({ src: 'photo.jpg', alt: 'John' });
    document.body.appendChild(view.element);

    const img = document.body.querySelector('.ds-avatar img');
    expect(img).not.toBeNull();
    expect(img.src).toContain('photo.jpg');
    expect(img.alt).toBe('John');
  });

  test('image takes priority over text', () => {
    const view = Avatar({ text: 'JD', src: 'photo.jpg' });
    document.body.appendChild(view.element);

    const img = document.body.querySelector('.ds-avatar img');
    expect(img).not.toBeNull();
  });
});

// ─── Sizes ───────────────────────────────────────────────────────────────────

describe('Avatar sizes', () => {
  test('default size has no extra class', () => {
    const view = Avatar({ text: 'A' });
    document.body.appendChild(view.element);

    const avatar = document.body.querySelector('.ds-avatar');
    expect(avatar.classList.contains('ds-avatar--sm')).toBe(false);
    expect(avatar.classList.contains('ds-avatar--lg')).toBe(false);
  });

  test('applies sm size class', () => {
    const view = Avatar({ text: 'A', size: 'sm' });
    document.body.appendChild(view.element);

    const avatar = document.body.querySelector('.ds-avatar');
    expect(avatar.classList.contains('ds-avatar--sm')).toBe(true);
  });

  test('applies lg size class', () => {
    const view = Avatar({ text: 'A', size: 'lg' });
    document.body.appendChild(view.element);

    const avatar = document.body.querySelector('.ds-avatar');
    expect(avatar.classList.contains('ds-avatar--lg')).toBe(true);
  });
});

// ─── Shape ───────────────────────────────────────────────────────────────────

describe('Avatar shape', () => {
  test('default shape is circle (no extra class)', () => {
    const view = Avatar({ text: 'A' });
    document.body.appendChild(view.element);

    const avatar = document.body.querySelector('.ds-avatar');
    expect(avatar.classList.contains('ds-avatar--square')).toBe(false);
  });

  test('applies square shape class', () => {
    const view = Avatar({ text: 'A', shape: 'square' });
    document.body.appendChild(view.element);

    const avatar = document.body.querySelector('.ds-avatar');
    expect(avatar.classList.contains('ds-avatar--square')).toBe(true);
  });
});

// ─── Accent ──────────────────────────────────────────────────────────────────

describe('Avatar accent', () => {
  test('applies accent class when enabled', () => {
    const view = Avatar({ text: 'A', accent: true });
    document.body.appendChild(view.element);

    const avatar = document.body.querySelector('.ds-avatar');
    expect(avatar.classList.contains('ds-avatar--accent')).toBe(true);
  });

  test('no accent class by default', () => {
    const view = Avatar({ text: 'A' });
    document.body.appendChild(view.element);

    const avatar = document.body.querySelector('.ds-avatar');
    expect(avatar.classList.contains('ds-avatar--accent')).toBe(false);
  });
});

// ─── Destroy ─────────────────────────────────────────────────────────────────

describe('Avatar destroy', () => {
  test('destroy() cleans up the reactive instance', () => {
    const view = Avatar({ text: 'A' });
    document.body.appendChild(view.element);

    expect(document.body.querySelector('.ds-avatar')).not.toBeNull();
    expect(() => view.destroy()).not.toThrow();
  });
});
