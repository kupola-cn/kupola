// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Unit tests for SSR: renderToString + hydrate.
 * @jest-environment jsdom
 */

import { signal, computed } from '../src/index.js';
import { html } from '../src/template.js';
import { flushJobs, resetScheduler } from '../src/scheduler.js';
import { renderToString, hydrate } from '../src/server.js';

afterEach(() => {
  document.body.innerHTML = '';
  resetScheduler();
});

// ─── renderToString ──────────────────────────────────────────────────────────

describe('renderToString', () => {
  test('renders static HTML', () => {
    const tpl = html`<div><p>Hello World</p></div>`;
    const result = renderToString(tpl);
    expect(result).toBe('<div><p>Hello World</p></div>');
  });

  test('renders signal value with hydration marker', () => {
    const count = signal(42);
    const tpl = html`<span>${count}</span>`;
    const result = renderToString(tpl);
    expect(result).toContain('42');
    expect(result).toContain('<!---->');
    expect(result).toMatch(/<span>42<!----><\/span>/);
  });

  test('renders computed value', () => {
    const count = signal(5);
    const doubled = computed(() => count.value * 2);
    const tpl = html`<span>${doubled}</span>`;
    const result = renderToString(tpl);
    expect(result).toContain('10');
    expect(result).toContain('<!---->');
  });

  test('skips function values (event handlers)', () => {
    const handler = () => {};
    const tpl = html`<button onclick="${handler}">click</button>`;
    const result = renderToString(tpl);
    // Function source should not appear in output
    expect(result).not.toContain('function');
    expect(result).not.toContain('() =>');
    // Element should still have data-kp for hydration
    expect(result).toContain('data-kp=');
    expect(result).toContain('click');
  });

  test('adds data-kp for dynamic attributes', () => {
    const cls = signal('active');
    const tpl = html`<div class="${cls}">content</div>`;
    const result = renderToString(tpl);
    expect(result).toContain('data-kp=');
    expect(result).toContain('active');
  });

  test('adds data-kp for event handlers on elements', () => {
    const handler = () => {};
    const tpl = html`<button onclick="${handler}">click</button>`;
    const result = renderToString(tpl);
    expect(result).toContain('data-kp=');
    expect(result).toContain(':e:');
  });

  test('renders nested templates', () => {
    const inner = html`<em>nested</em>`;
    const tpl = html`<div>${inner}</div>`;
    const result = renderToString(tpl);
    expect(result).toContain('<em>nested</em>');
  });

  test('renders TemplateResult-like content from another bundle entry', () => {
    const inner = { strings: [ '<em>', '</em>' ], values: [ 'foreign' ] };
    const tpl = html`<div>${inner}</div>`;
    const result = renderToString(tpl);
    expect(result).toContain('<em>foreign</em>');
    expect(result).not.toContain('[object Object]');
  });

  test('renders list of templates', () => {
    const items = [ 'a', 'b', 'c' ];
    const tpl = html`<ul>${items.map(i => html`<li>${i}</li>`)}</ul>`;
    const result = renderToString(tpl);
    expect(result).toContain('<li>a</li>');
    expect(result).toContain('<li>c</li>');
  });

  test('renders list of TemplateResult-like values from another bundle entry', () => {
    const items = [ 'a', 'b', 'c' ].map(i => ({ strings: [ '<li>', '</li>' ], values: [ i ] }));
    const tpl = html`<ul>${items}</ul>`;
    const result = renderToString(tpl);
    expect(result).toContain('<li>a</li>');
    expect(result).toContain('<li>c</li>');
    expect(result).not.toContain('[object Object]');
  });

  test('escapes HTML in static values', () => {
    const val = '<script>alert(1)</script>';
    const tpl = html`<span>${val}</span>`;
    const result = renderToString(tpl);
    expect(result).not.toContain('<script>');
    expect(result).toContain('&lt;script&gt;');
  });

  test('handles multiple signals in one element', () => {
    const a = signal('hello');
    const b = signal('world');
    const tpl = html`<div>${a} and ${b}</div>`;
    const result = renderToString(tpl);
    expect(result).toContain('hello');
    expect(result).toContain('world');
    // Should have two hydration markers
    const markerCount = (result.match(/<!---->/g) || []).length;
    expect(markerCount).toBe(2);
  });
});

// ─── hydrate ─────────────────────────────────────────────────────────────────

describe('hydrate', () => {
  test('hydrates static DOM without changes', () => {
    const container = document.createElement('div');
    container.innerHTML = '<p>Hello World</p>';
    document.body.appendChild(container);

    const tpl = html`<p>Hello World</p>`;
    const view = hydrate(tpl, container);

    expect(container.querySelector('p').textContent).toBe('Hello World');
    view.destroy();
  });

  test('hydrates signal text binding', () => {
    const count = signal(42);
    const tpl = html`<span>${count}</span>`;

    // Simulate SSR
    const container = document.createElement('div');
    container.innerHTML = renderToString(tpl);
    document.body.appendChild(container);

    // Hydrate
    const view = hydrate(tpl, container);
    expect(container.querySelector('span').textContent).toBe('42');

    // Update signal — DOM should update
    count.value = 99;
    flushJobs();
    expect(container.querySelector('span').textContent).toBe('99');

    view.destroy();
  });

  test('hydrates attribute binding', () => {
    const cls = signal('active');
    const tpl = html`<div class="${cls}">content</div>`;

    const container = document.createElement('div');
    container.innerHTML = renderToString(tpl);
    document.body.appendChild(container);

    const view = hydrate(tpl, container);
    expect(container.firstElementChild.getAttribute('class')).toBe('active');

    cls.value = 'inactive';
    flushJobs();
    expect(container.firstElementChild.getAttribute('class')).toBe('inactive');

    view.destroy();
  });

  test('hydrates event handler', () => {
    const clicked = jest.fn();
    const tpl = html`<button onclick="${clicked}">click me</button>`;

    const container = document.createElement('div');
    container.innerHTML = renderToString(tpl);
    document.body.appendChild(container);

    const view = hydrate(tpl, container);

    container.querySelector('button').click();
    expect(clicked).toHaveBeenCalledTimes(1);

    view.destroy();
  });

  test('hydrated event handler can modify signal', () => {
    const count = signal(0);
    const tpl = html`<button onclick="${() => count.value++}">${count}</button>`;

    const container = document.createElement('div');
    container.innerHTML = renderToString(tpl);
    document.body.appendChild(container);

    const view = hydrate(tpl, container);
    expect(container.querySelector('button').textContent).toBe('0');

    container.querySelector('button').click();
    flushJobs();
    expect(container.querySelector('button').textContent).toBe('1');

    view.destroy();
  });

  test('destroy stops reactive updates', () => {
    const count = signal(0);
    const tpl = html`<span>${count}</span>`;

    const container = document.createElement('div');
    container.innerHTML = renderToString(tpl);
    document.body.appendChild(container);

    const view = hydrate(tpl, container);
    view.destroy();

    count.value = 99;
    flushJobs();
    // After destroy, DOM should not update
    const span = container.querySelector('span');
    if (span) {
      expect(span.textContent).not.toBe('99');
    }
  });

  test('full SSR → hydrate flow with computed', () => {
    const count = signal(3);
    const doubled = computed(() => count.value * 2);
    const tpl = html`<div><span>${count}</span><span>${doubled}</span></div>`;

    const container = document.createElement('div');
    container.innerHTML = renderToString(tpl);
    document.body.appendChild(container);

    // Verify SSR output
    const spans = container.querySelectorAll('span');
    expect(spans[0].textContent).toBe('3');
    expect(spans[1].textContent).toBe('6');

    // Hydrate
    const view = hydrate(tpl, container);

    // Update signal
    count.value = 5;
    flushJobs();

    const updatedSpans = container.querySelectorAll('span');
    expect(updatedSpans[0].textContent).toBe('5');
    expect(updatedSpans[1].textContent).toBe('10');

    view.destroy();
  });

  test('removes data-kp attributes after hydration', () => {
    const cls = signal('active');
    const tpl = html`<div class="${cls}">content</div>`;

    const container = document.createElement('div');
    container.innerHTML = renderToString(tpl);
    document.body.appendChild(container);

    // Before hydrate: data-kp should be present
    expect(container.innerHTML).toContain('data-kp');

    hydrate(tpl, container);

    // After hydrate: data-kp should be removed
    expect(container.querySelector('[data-kp]')).toBeNull();
  });

  test('removes comment markers after hydration', () => {
    const count = signal(42);
    const tpl = html`<span>${count}</span>`;

    const container = document.createElement('div');
    container.innerHTML = renderToString(tpl);
    document.body.appendChild(container);

    // Before hydrate: comment markers should be present
    const commentCount = () => {
      let c = 0;
      const walker = document.createTreeWalker(container, 5);
      while (walker.nextNode()) {c++;}
      return c;
    };
    expect(commentCount()).toBeGreaterThan(0);

    hydrate(tpl, container);

    // After hydrate: comment markers should be removed
    // (only text nodes and elements remain)
    const hasComments = () => {
      for (const child of container.querySelectorAll('*')) {
        for (const c of child.childNodes) {
          if (c.nodeType === 8) {return true;}
        }
      }
      return false;
    };
    expect(hasComments()).toBe(false);
  });
});
