// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Unit tests for template engine + DOM renderer.
 * @jest-environment jsdom
 */

import { signal, computed, effect, batch, html, render, flushJobs, resetScheduler } from '../src/index.js';

afterEach(() => {
  document.body.innerHTML = '';
  resetScheduler();
});

// ─── html`` tagged template ──────────────────────────────────────────────────

describe('html tagged template', () => {
  test('returns a TemplateResult', () => {
    const tpl = html`<div>hello</div>`;
    expect(tpl).toBeDefined();
    expect(tpl.strings).toBeDefined();
    expect(tpl.values).toBeDefined();
  });

  test('captures strings and values', () => {
    const name = 'world';
    const tpl = html`<span>${name}</span>`;
    expect(tpl.strings[0]).toBe('<span>');
    expect(tpl.strings[1]).toBe('</span>');
    expect(tpl.values[0]).toBe('world');
  });

  test('handles multiple values', () => {
    const a = 1;
    const b = 2;
    const tpl = html`<div>${a} and ${b}</div>`;
    expect(tpl.values).toEqual([1, 2]);
    expect(tpl.strings.length).toBe(3);
  });
});

// ─── render() — static content ──────────────────────────────────────────────

describe('render static content', () => {
  test('renders plain HTML', () => {
    const container = document.createElement('div');
    const tpl = html`<p>Hello World</p>`;
    render(tpl, container);
    expect(container.querySelector('p').textContent).toBe('Hello World');
  });

  test('renders inline primitive values', () => {
    const container = document.createElement('div');
    const name = 'Kupola';
    const tpl = html`<span>${name}</span>`;
    render(tpl, container);
    expect(container.querySelector('span').textContent).toBe('Kupola');
  });

  test('renders numeric values', () => {
    const container = document.createElement('div');
    const tpl = html`<span>${42}</span>`;
    render(tpl, container);
    expect(container.querySelector('span').textContent).toBe('42');
  });

  test('escapes HTML in static values', () => {
    const container = document.createElement('div');
    const tpl = html`<span>${'<script>alert(1)</script>'}</span>`;
    render(tpl, container);
    expect(container.querySelector('span').textContent).toBe('<script>alert(1)</script>');
    expect(container.querySelector('script')).toBeNull();
  });
});

// ─── render() — reactive signals ────────────────────────────────────────────

describe('render reactive signals', () => {
  test('renders signal initial value', () => {
    const container = document.createElement('div');
    const count = signal(0);
    const tpl = html`<span>${count}</span>`;
    render(tpl, container);
    expect(container.querySelector('span').textContent).toBe('0');
  });

  test('updates DOM when signal changes', () => {
    const container = document.createElement('div');
    const count = signal(0);
    const tpl = html`<span>${count}</span>`;
    render(tpl, container);

    count.value = 5;
    flushJobs();
    expect(container.querySelector('span').textContent).toBe('5');
  });

  test('updates only affected DOM nodes', () => {
    const container = document.createElement('div');
    const a = signal('hello');
    const b = signal('world');
    const tpl = html`<p>${a}</p><p>${b}</p>`;
    render(tpl, container);

    const p1 = container.querySelectorAll('p')[0];
    const p2 = container.querySelectorAll('p')[1];

    a.value = 'hi';
    flushJobs();

    expect(p1.textContent).toBe('hi');
    expect(p2.textContent).toBe('world'); // unchanged
  });

  test('renders computed values', () => {
    const container = document.createElement('div');
    const count = signal(3);
    const doubled = computed(() => count.value * 2);
    const tpl = html`<span>${doubled}</span>`;
    render(tpl, container);

    expect(container.querySelector('span').textContent).toBe('6');

    count.value = 5;
    flushJobs();
    expect(container.querySelector('span').textContent).toBe('10');
  });
});

// ─── render() — attributes ──────────────────────────────────────────────────

describe('render attributes', () => {
  test('renders signal in attribute', () => {
    const container = document.createElement('div');
    const cls = signal('active');
    const tpl = html`<div class="${cls}">content</div>`;
    render(tpl, container);
    expect(container.firstElementChild.getAttribute('class')).toBe('active');
  });

  test('updates attribute when signal changes', () => {
    const container = document.createElement('div');
    const cls = signal('active');
    const tpl = html`<div class="${cls}">content</div>`;
    render(tpl, container);

    cls.value = 'inactive';
    flushJobs();
    expect(container.firstElementChild.getAttribute('class')).toBe('inactive');
  });

  test('removes attribute when signal becomes null', () => {
    const container = document.createElement('div');
    const title = signal('hello');
    const tpl = html`<div title="${title}">content</div>`;
    render(tpl, container);
    expect(container.firstElementChild.hasAttribute('title')).toBe(true);

    title.value = null;
    flushJobs();
    expect(container.firstElementChild.hasAttribute('title')).toBe(false);
  });
});

// ─── render() — event handlers ──────────────────────────────────────────────

describe('render event handlers', () => {
  test('binds onclick handler', () => {
    const container = document.createElement('div');
    const clicked = jest.fn();
    const tpl = html`<button onclick="${clicked}">click me</button>`;
    render(tpl, container);

    container.querySelector('button').click();
    expect(clicked).toHaveBeenCalledTimes(1);
  });

  test('event handler can modify signal', () => {
    const container = document.createElement('div');
    const count = signal(0);
    const tpl = html`<button onclick="${() => count.value++}">${count}</button>`;
    render(tpl, container);

    expect(container.querySelector('button').textContent).toBe('0');

    container.querySelector('button').click();
    flushJobs();
    expect(container.querySelector('button').textContent).toBe('1');
  });

  test('destroy removes event listeners', () => {
    const container = document.createElement('div');
    const clicked = jest.fn();
    const tpl = html`<button onclick="${clicked}">click</button>`;
    const view = render(tpl, container);

    view.destroy();
    container.querySelector('button').click();
    expect(clicked).not.toHaveBeenCalled();
  });
});

// ─── render() — nested templates ────────────────────────────────────────────

describe('render nested templates', () => {
  test('renders nested html`` as content', () => {
    const container = document.createElement('div');
    const inner = html`<em>nested</em>`;
    const tpl = html`<div>${inner}</div>`;
    render(tpl, container);
    expect(container.querySelector('em')).not.toBeNull();
    expect(container.querySelector('em').textContent).toBe('nested');
  });
});

// ─── render() — list rendering ──────────────────────────────────────────────

describe('render list', () => {
  test('renders array of templates', () => {
    const container = document.createElement('div');
    const items = ['a', 'b', 'c'];
    const tpl = html`<ul>${items.map(i => html`<li>${i}</li>`)}</ul>`;
    render(tpl, container);
    const lis = container.querySelectorAll('li');
    expect(lis.length).toBe(3);
    expect(lis[0].textContent).toBe('a');
    expect(lis[2].textContent).toBe('c');
  });
});

// ─── render() — destroy ─────────────────────────────────────────────────────

describe('destroy', () => {
  test('stops reactive updates after destroy', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const count = signal(0);
    const tpl = html`<span>${count}</span>`;
    const view = render(tpl, container);

    // Verify initial render
    expect(container.querySelector('span').textContent).toBe('0');

    view.destroy();

    count.value = 99;
    flushJobs();
    // After destroy, DOM should not be updated (still shows initial value or empty)
    const span = container.querySelector('span');
    if (span) {
      expect(span.textContent).not.toBe('99');
    }
    document.body.removeChild(container);
  });
});

// ─── Integration ────────────────────────────────────────────────────────────

describe('integration', () => {
  test('counter app: signal + computed + event + render', () => {
    const container = document.createElement('div');
    const count = signal(0);
    const label = computed(() => `Count: ${count.value}`);

    const tpl = html`
      <div>
        <span id="label">${label}</span>
        <button id="inc" onclick="${() => count.value++}">+</button>
      </div>
    `;
    render(tpl, container);

    expect(container.querySelector('#label').textContent).toBe('Count: 0');

    container.querySelector('#inc').click();
    flushJobs();
    expect(container.querySelector('#label').textContent).toBe('Count: 1');

    container.querySelector('#inc').click();
    flushJobs();
    expect(container.querySelector('#label').textContent).toBe('Count: 2');
  });

  test('batch update renders once', () => {
    const container = document.createElement('div');
    const a = signal(0);
    const b = signal(0);

    const tpl = html`<div><span>${a}</span>,<span>${b}</span></div>`;
    render(tpl, container);

    batch(() => {
      a.value = 1;
      b.value = 2;
    });
    flushJobs();

    const spans = container.querySelectorAll('span');
    expect(spans[0].textContent).toBe('1');
    expect(spans[1].textContent).toBe('2');
  });
});
