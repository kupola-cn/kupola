// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Unit tests for the Timeline component.
 * @jest-environment jsdom
 */

import { resetScheduler } from '../../src/index.js';
import { Timeline } from '@kupola/components';

afterEach(() => {
  document.body.innerHTML = '';
  resetScheduler();
});

// ─── Basic rendering ─────────────────────────────────────────────────────────

describe('Timeline rendering', () => {
  test('renders a timeline element', () => {
    const view = Timeline();
    document.body.appendChild(view.element);

    const timeline = document.body.querySelector('.ds-timeline');
    expect(timeline).not.toBeNull();
  });

  test('renders no items by default', () => {
    const view = Timeline();
    document.body.appendChild(view.element);

    const items = document.body.querySelectorAll('.ds-timeline__item');
    expect(items.length).toBe(0);
  });

  test('renders items from data', () => {
    const view = Timeline({
      items: [
        { title: 'First' },
        { title: 'Second' },
        { title: 'Third' },
      ],
    });
    document.body.appendChild(view.element);

    const items = document.body.querySelectorAll('.ds-timeline__item');
    expect(items.length).toBe(3);
  });
});

// ─── Item content ────────────────────────────────────────────────────────────

describe('Timeline item content', () => {
  test('renders title text', () => {
    const view = Timeline({
      items: [ { title: 'Created' } ],
    });
    document.body.appendChild(view.element);

    const title = document.body.querySelector('.ds-timeline__title');
    expect(title).not.toBeNull();
    expect(title.textContent).toBe('Created');
  });

  test('renders time text', () => {
    const view = Timeline({
      items: [ { time: '2024-01-01' } ],
    });
    document.body.appendChild(view.element);

    const time = document.body.querySelector('.ds-timeline__time');
    expect(time).not.toBeNull();
    expect(time.textContent).toBe('2024-01-01');
  });

  test('renders description text', () => {
    const view = Timeline({
      items: [ { description: 'Something happened' } ],
    });
    document.body.appendChild(view.element);

    const desc = document.body.querySelector('.ds-timeline__description');
    expect(desc).not.toBeNull();
    expect(desc.textContent).toBe('Something happened');
  });

  test('renders marker for each item', () => {
    const view = Timeline({
      items: [ { title: 'A' }, { title: 'B' } ],
    });
    document.body.appendChild(view.element);

    const markers = document.body.querySelectorAll('.ds-timeline__marker');
    expect(markers.length).toBe(2);
  });

  test('omits time element when not provided', () => {
    const view = Timeline({
      items: [ { title: 'No time' } ],
    });
    document.body.appendChild(view.element);

    const time = document.body.querySelector('.ds-timeline__time');
    expect(time).toBeNull();
  });

  test('omits description element when not provided', () => {
    const view = Timeline({
      items: [ { title: 'No desc' } ],
    });
    document.body.appendChild(view.element);

    const desc = document.body.querySelector('.ds-timeline__description');
    expect(desc).toBeNull();
  });
});

// ─── Destroy ─────────────────────────────────────────────────────────────────

describe('Timeline destroy', () => {
  test('destroy() cleans up the reactive instance', () => {
    const view = Timeline({ items: [ { title: 'Test' } ] });
    document.body.appendChild(view.element);

    expect(document.body.querySelector('.ds-timeline')).not.toBeNull();
    expect(() => view.destroy()).not.toThrow();
  });
});
