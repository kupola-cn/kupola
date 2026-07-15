// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Unit tests for the Breadcrumb component.
 * @jest-environment jsdom
 */

import { resetScheduler } from '../../src/index.js';
import { Breadcrumb } from '../../src/components/breadcrumb.js';

afterEach(() => {
  document.body.innerHTML = '';
  resetScheduler();
});

// ─── Basic rendering ─────────────────────────────────────────────────────────

describe('Breadcrumb rendering', () => {
  test('renders a nav element', () => {
    const view = Breadcrumb();
    document.body.appendChild(view.element);

    const nav = document.body.querySelector('.ds-breadcrumb');
    expect(nav).not.toBeNull();
    expect(nav.getAttribute('aria-label')).toBe('Breadcrumb');
  });

  test('renders no items by default', () => {
    const view = Breadcrumb();
    document.body.appendChild(view.element);

    const items = document.body.querySelectorAll('.ds-breadcrumb__item');
    expect(items.length).toBe(0);
  });

  test('renders items from data', () => {
    const view = Breadcrumb({
      items: [
        { label: 'Home', href: '/' },
        { label: 'Products', href: '/products' },
        { label: 'Detail' },
      ],
    });
    document.body.appendChild(view.element);

    const items = document.body.querySelectorAll('.ds-breadcrumb__item');
    expect(items.length).toBe(3);
  });
});

// ─── Links ───────────────────────────────────────────────────────────────────

describe('Breadcrumb links', () => {
  test('renders links for non-last items with href', () => {
    const view = Breadcrumb({
      items: [
        { label: 'Home', href: '/' },
        { label: 'Current' },
      ],
    });
    document.body.appendChild(view.element);

    const links = document.body.querySelectorAll('.ds-breadcrumb__item a');
    expect(links.length).toBe(1);
    expect(links[0].href).toContain('/');
    expect(links[0].textContent).toBe('Home');
  });

  test('renders plain text for last item', () => {
    const view = Breadcrumb({
      items: [
        { label: 'Home', href: '/' },
        { label: 'Current' },
      ],
    });
    document.body.appendChild(view.element);

    const lastItem = document.body.querySelectorAll('.ds-breadcrumb__item')[1];
    const link = lastItem.querySelector('a');
    expect(link).toBeNull();
    expect(lastItem.textContent).toContain('Current');
  });
});

// ─── Separator ───────────────────────────────────────────────────────────────

describe('Breadcrumb separator', () => {
  test('renders default separator', () => {
    const view = Breadcrumb({
      items: [ { label: 'A' }, { label: 'B' } ],
    });
    document.body.appendChild(view.element);

    const icons = document.body.querySelectorAll('.ds-breadcrumb__icon');
    expect(icons.length).toBe(2);
    expect(icons[0].textContent).toBe('/');
  });

  test('renders custom separator', () => {
    const view = Breadcrumb({
      items: [ { label: 'A' }, { label: 'B' } ],
      separator: '>',
    });
    document.body.appendChild(view.element);

    const icons = document.body.querySelectorAll('.ds-breadcrumb__icon');
    expect(icons[0].textContent).toBe('>');
  });
});

// ─── Destroy ─────────────────────────────────────────────────────────────────

describe('Breadcrumb destroy', () => {
  test('destroy() cleans up the reactive instance', () => {
    const view = Breadcrumb({ items: [ { label: 'Test' } ] });
    document.body.appendChild(view.element);

    expect(document.body.querySelector('.ds-breadcrumb')).not.toBeNull();
    expect(() => view.destroy()).not.toThrow();
  });
});
