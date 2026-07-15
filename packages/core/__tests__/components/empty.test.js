// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Unit tests for the Empty component.
 * @jest-environment jsdom
 */

import { resetScheduler } from '../../src/index.js';
import { Empty } from '../../src/components/empty.js';

afterEach(() => {
  document.body.innerHTML = '';
  resetScheduler();
});

// ─── Basic rendering ─────────────────────────────────────────────────────────

describe('Empty rendering', () => {
  test('renders an empty state element', () => {
    const view = Empty();
    document.body.appendChild(view.element);

    const empty = document.body.querySelector('.ds-empty');
    expect(empty).not.toBeNull();
  });

  test('renders default icon', () => {
    const view = Empty();
    document.body.appendChild(view.element);

    const icon = document.body.querySelector('.ds-empty__icon');
    expect(icon).not.toBeNull();
    expect(icon.querySelector('svg')).not.toBeNull();
  });

  test('renders title', () => {
    const view = Empty({ title: 'No data' });
    document.body.appendChild(view.element);

    const title = document.body.querySelector('.ds-empty__title');
    expect(title).not.toBeNull();
    expect(title.textContent).toBe('No data');
  });

  test('renders description', () => {
    const view = Empty({ description: 'Nothing to show here.' });
    document.body.appendChild(view.element);

    const desc = document.body.querySelector('.ds-empty__description');
    expect(desc).not.toBeNull();
    expect(desc.textContent).toBe('Nothing to show here.');
  });

  test('renders both title and description', () => {
    const view = Empty({ title: 'Empty', description: 'No items found.' });
    document.body.appendChild(view.element);

    const title = document.body.querySelector('.ds-empty__title');
    const desc = document.body.querySelector('.ds-empty__description');
    expect(title).not.toBeNull();
    expect(desc).not.toBeNull();
  });
});

// ─── Optional elements ──────────────────────────────────────────────────────

describe('Empty optional elements', () => {
  test('no title element when not provided', () => {
    const view = Empty({ description: 'Only desc' });
    document.body.appendChild(view.element);

    const title = document.body.querySelector('.ds-empty__title');
    expect(title).toBeNull();
  });

  test('no description element when not provided', () => {
    const view = Empty({ title: 'Only title' });
    document.body.appendChild(view.element);

    const desc = document.body.querySelector('.ds-empty__description');
    expect(desc).toBeNull();
  });
});

// ─── Custom icon ─────────────────────────────────────────────────────────────

describe('Empty custom icon', () => {
  test('renders custom icon HTML', () => {
    const view = Empty({ icon: '<span class="custom-icon">!</span>' });
    document.body.appendChild(view.element);

    const customIcon = document.body.querySelector('.ds-empty__icon .custom-icon');
    expect(customIcon).not.toBeNull();
    expect(customIcon.textContent).toBe('!');
  });
});

// ─── Destroy ─────────────────────────────────────────────────────────────────

describe('Empty destroy', () => {
  test('destroy() cleans up the reactive instance', () => {
    const view = Empty({ title: 'Destroy me' });
    document.body.appendChild(view.element);

    expect(document.body.querySelector('.ds-empty')).not.toBeNull();
    expect(() => view.destroy()).not.toThrow();
  });
});
