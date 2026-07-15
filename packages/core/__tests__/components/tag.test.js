// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Unit tests for the Tag component.
 * @jest-environment jsdom
 */

import { resetScheduler } from '../../src/index.js';
import { Tag } from '../../src/components/tag.js';

afterEach(() => {
  document.body.innerHTML = '';
  resetScheduler();
});

// ─── Basic rendering ─────────────────────────────────────────────────────────

describe('Tag rendering', () => {
  test('renders a tag element', () => {
    const view = Tag({ text: 'Hello' });
    document.body.appendChild(view.element);

    const tag = document.body.querySelector('.ds-tag');
    expect(tag).not.toBeNull();
  });

  test('displays the text content', () => {
    const view = Tag({ text: 'Active' });
    document.body.appendChild(view.element);

    const tag = document.body.querySelector('.ds-tag');
    expect(tag.textContent).toContain('Active');
  });

  test('applies type class', () => {
    const view = Tag({ text: 'OK', type: 'success' });
    document.body.appendChild(view.element);

    const tag = document.body.querySelector('.ds-tag');
    expect(tag.classList.contains('ds-tag--success')).toBe(true);
  });

  test('applies brand type class', () => {
    const view = Tag({ text: 'New', type: 'brand' });
    document.body.appendChild(view.element);

    const tag = document.body.querySelector('.ds-tag');
    expect(tag.classList.contains('ds-tag--brand')).toBe(true);
  });

  test('no extra type class when type is empty', () => {
    const view = Tag({ text: 'Default' });
    document.body.appendChild(view.element);

    const tag = document.body.querySelector('.ds-tag');
    expect(tag.classList.contains('ds-tag--success')).toBe(false);
    expect(tag.classList.contains('ds-tag--brand')).toBe(false);
  });
});

// ─── Closable ────────────────────────────────────────────────────────────────

describe('Tag closable', () => {
  test('shows close button when closable', () => {
    const view = Tag({ text: 'Remove me', closable: true });
    document.body.appendChild(view.element);

    const closeBtn = document.body.querySelector('.ds-tag__close');
    expect(closeBtn).not.toBeNull();
  });

  test('does not show close button by default', () => {
    const view = Tag({ text: 'Keep me' });
    document.body.appendChild(view.element);

    const closeBtn = document.body.querySelector('.ds-tag__close');
    expect(closeBtn).toBeNull();
  });

  test('adds closable class when closable', () => {
    const view = Tag({ text: 'Closable', closable: true });
    document.body.appendChild(view.element);

    const tag = document.body.querySelector('.ds-tag');
    expect(tag.classList.contains('ds-tag--closable')).toBe(true);
  });

  test('close button click triggers dismiss', () => {
    const onClose = jest.fn();
    const view = Tag({ text: 'Click close', closable: true, onClose });
    document.body.appendChild(view.element);

    const closeBtn = document.body.querySelector('.ds-tag__close');
    closeBtn.click();

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('dismiss hides the tag', () => {
    const view = Tag({ text: 'Hide me', closable: true });
    document.body.appendChild(view.element);

    const tag = document.body.querySelector('.ds-tag');
    view.dismiss();

    expect(tag.style.display).toBe('none');
  });

  test('dismiss is idempotent', () => {
    const onClose = jest.fn();
    const view = Tag({ text: 'Double', closable: true, onClose });
    document.body.appendChild(view.element);

    view.dismiss();
    view.dismiss();

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

// ─── Destroy ─────────────────────────────────────────────────────────────────

describe('Tag destroy', () => {
  test('destroy() cleans up the reactive instance', () => {
    const view = Tag({ text: 'Destroy me' });
    document.body.appendChild(view.element);

    expect(document.body.querySelector('.ds-tag')).not.toBeNull();
    expect(() => view.destroy()).not.toThrow();
  });
});
