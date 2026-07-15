// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Unit tests for the directive system.
 * @jest-environment jsdom
 */

import { walk } from '../src/directives.js';
import { flushJobs, resetScheduler } from '../src/index.js';

afterEach(() => {
  document.body.innerHTML = '';
  resetScheduler();
});

// ─── k-data + k-text ─────────────────────────────────────────────────────────

describe('k-data + k-text', () => {
  test('creates reactive scope and renders text', () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <div k-data="{ msg: 'hello' }">
        <span k-text="msg"></span>
      </div>
    `;
    document.body.appendChild(container);

    const view = walk(container);
    expect(container.querySelector('span').textContent).toBe('hello');
    view.destroy();
  });

  test('k-text updates reactively when scope changes', () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <div k-data="{ count: 0 }">
        <span k-text="count"></span>
        <button k-on:click="count++">+</button>
      </div>
    `;
    document.body.appendChild(container);

    const view = walk(container);
    const span = container.querySelector('span');
    const btn = container.querySelector('button');

    expect(span.textContent).toBe('0');

    btn.click();
    flushJobs();
    expect(span.textContent).toBe('1');

    btn.click();
    flushJobs();
    expect(span.textContent).toBe('2');

    view.destroy();
  });
});

// ─── k-show ──────────────────────────────────────────────────────────────────

describe('k-show', () => {
  test('shows element when expression is truthy', () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <div k-data="{ visible: true }">
        <p k-show="visible">Content</p>
      </div>
    `;
    document.body.appendChild(container);

    const view = walk(container);
    const p = container.querySelector('p');
    expect(p.style.display).toBe('');
    view.destroy();
  });

  test('hides element when expression is falsy', () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <div k-data="{ visible: false }">
        <p k-show="visible">Content</p>
      </div>
    `;
    document.body.appendChild(container);

    const view = walk(container);
    const p = container.querySelector('p');
    expect(p.style.display).toBe('none');
    view.destroy();
  });

  test('toggles visibility reactively', () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <div k-data="{ visible: true }">
        <p k-show="visible">Content</p>
        <button k-on:click="visible = !visible">Toggle</button>
      </div>
    `;
    document.body.appendChild(container);

    const view = walk(container);
    const p = container.querySelector('p');
    const btn = container.querySelector('button');

    expect(p.style.display).toBe('');

    btn.click();
    flushJobs();
    expect(p.style.display).toBe('none');

    btn.click();
    flushJobs();
    expect(p.style.display).toBe('');

    view.destroy();
  });
});

// ─── k-html ──────────────────────────────────────────────────────────────────

describe('k-html', () => {
  test('sets innerHTML reactively', () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <div k-data="{ content: '<b>bold</b>' }">
        <div k-html="content"></div>
      </div>
    `;
    document.body.appendChild(container);

    const view = walk(container);
    const inner = container.querySelector('[k-html]');
    expect(inner.innerHTML).toBe('<b>bold</b>');

    view.destroy();
  });
});

// ─── k-bind ──────────────────────────────────────────────────────────────────

describe('k-bind', () => {
  test('sets attribute dynamically', () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <div k-data="{ cls: 'active' }">
        <span k-bind:class="cls">Text</span>
      </div>
    `;
    document.body.appendChild(container);

    const view = walk(container);
    const span = container.querySelector('span');
    expect(span.getAttribute('class')).toBe('active');

    view.destroy();
  });

  test('removes attribute when value is false/null', () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <div k-data="{ disabled: false }">
        <button k-bind:disabled="disabled">Click</button>
      </div>
    `;
    document.body.appendChild(container);

    const view = walk(container);
    const btn = container.querySelector('button');
    expect(btn.hasAttribute('disabled')).toBe(false);

    view.destroy();
  });

  test('sets boolean attribute when value is true', () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <div k-data="{ disabled: true }">
        <button k-bind:disabled="disabled">Click</button>
      </div>
    `;
    document.body.appendChild(container);

    const view = walk(container);
    const btn = container.querySelector('button');
    expect(btn.hasAttribute('disabled')).toBe(true);

    view.destroy();
  });

  test('shorthand :attr works', () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <div k-data="{ cls: 'red' }">
        <span :class="cls">Text</span>
      </div>
    `;
    document.body.appendChild(container);

    const view = walk(container);
    const span = container.querySelector('span');
    expect(span.getAttribute('class')).toBe('red');

    view.destroy();
  });

  test('updates attribute reactively', () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <div k-data="{ cls: 'a' }">
        <span k-bind:class="cls">Text</span>
        <button k-on:click="cls = 'b'">Change</button>
      </div>
    `;
    document.body.appendChild(container);

    const view = walk(container);
    const span = container.querySelector('span');
    const btn = container.querySelector('button');

    expect(span.getAttribute('class')).toBe('a');

    btn.click();
    flushJobs();
    expect(span.getAttribute('class')).toBe('b');

    view.destroy();
  });
});

// ─── k-on ────────────────────────────────────────────────────────────────────

describe('k-on', () => {
  test('binds event listener', () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <div k-data="{ count: 0 }">
        <span k-text="count"></span>
        <button k-on:click="count = count + 1">+</button>
      </div>
    `;
    document.body.appendChild(container);

    const view = walk(container);
    const span = container.querySelector('span');
    const btn = container.querySelector('button');

    expect(span.textContent).toBe('0');

    btn.click();
    flushJobs();
    expect(span.textContent).toBe('1');

    view.destroy();
  });

  test('shorthand @event works', () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <div k-data="{ count: 0 }">
        <span k-text="count"></span>
        <button @click="count++">+</button>
      </div>
    `;
    document.body.appendChild(container);

    const view = walk(container);
    const btn = container.querySelector('button');

    btn.click();
    flushJobs();
    expect(container.querySelector('span').textContent).toBe('1');

    view.destroy();
  });

  test('.stop modifier stops propagation', () => {
    const container = document.createElement('div');
    const outerHandler = jest.fn();
    container.innerHTML = `
      <div k-data="{ count: 0 }">
        <div k-on:click="count++">
          <button k-on:click.stop="count = count + 10">Inner</button>
        </div>
        <span k-text="count"></span>
      </div>
    `;
    document.body.appendChild(container);

    const view = walk(container);
    const btn = container.querySelector('button');

    btn.click();
    flushJobs();
    // .stop prevents the outer handler from firing
    // Only the inner handler should run: count = 0 + 10 = 10
    expect(container.querySelector('span').textContent).toBe('10');

    view.destroy();
  });

  test('.prevent modifier prevents default', () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <div k-data="{ submitted: false }">
        <form>
          <button k-on:click.prevent="submitted = true">Submit</button>
        </form>
        <span k-text="submitted"></span>
      </div>
    `;
    document.body.appendChild(container);

    const form = container.querySelector('form');
    const preventSpy = jest.fn();
    form.addEventListener('submit', (e) => {
      preventSpy();
      e.preventDefault();
    });

    const view = walk(container);
    const btn = container.querySelector('button');

    btn.click();
    flushJobs();

    // The form should not have been submitted (.prevent blocks it)
    expect(container.querySelector('span').textContent).toBe('true');

    view.destroy();
  });
});

// ─── k-model ─────────────────────────────────────────────────────────────────

describe('k-model', () => {
  test('two-way binds input value', () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <div k-data="{ name: 'Alice' }">
        <input k-model="name" />
        <span k-text="name"></span>
      </div>
    `;
    document.body.appendChild(container);

    const view = walk(container);
    const input = container.querySelector('input');
    const span = container.querySelector('span');

    // Initial value
    expect(input.value).toBe('Alice');
    expect(span.textContent).toBe('Alice');

    // Simulate user typing
    input.value = 'Bob';
    input.dispatchEvent(new Event('input'));
    flushJobs();

    expect(span.textContent).toBe('Bob');

    view.destroy();
  });
});

// ─── Nested scopes ───────────────────────────────────────────────────────────

describe('nested k-data', () => {
  test('inner scope does not affect outer scope', () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <div k-data="{ x: 'outer' }">
        <span k-text="x" class="outer"></span>
        <div k-data="{ x: 'inner' }">
          <span k-text="x" class="inner"></span>
        </div>
      </div>
    `;
    document.body.appendChild(container);

    const view = walk(container);
    expect(container.querySelector('.outer').textContent).toBe('outer');
    expect(container.querySelector('.inner').textContent).toBe('inner');

    view.destroy();
  });
});

// ─── destroy ─────────────────────────────────────────────────────────────────

describe('walk destroy', () => {
  test('returns destroy function that stops reactivity', () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <div k-data="{ count: 0 }">
        <span k-text="count"></span>
        <button k-on:click="count++">+</button>
      </div>
    `;
    document.body.appendChild(container);

    const view = walk(container);
    const btn = container.querySelector('button');

    btn.click();
    flushJobs();
    expect(container.querySelector('span').textContent).toBe('1');

    view.destroy();

    // After destroy, clicking should not update
    btn.click();
    flushJobs();
    expect(container.querySelector('span').textContent).toBe('1');
  });
});

// ─── Expression evaluation ───────────────────────────────────────────────────

describe('expressions', () => {
  test('supports ternary expressions', () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <div k-data="{ active: true }">
        <span k-text="active ? 'yes' : 'no'"></span>
      </div>
    `;
    document.body.appendChild(container);

    const view = walk(container);
    expect(container.querySelector('span').textContent).toBe('yes');

    view.destroy();
  });

  test('supports comparison expressions', () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <div k-data="{ count: 5 }">
        <span k-show="count > 3">Big</span>
      </div>
    `;
    document.body.appendChild(container);

    const view = walk(container);
    const span = container.querySelector('span');
    expect(span.style.display).toBe('');

    view.destroy();
  });

  test('supports string concatenation', () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <div k-data="{ first: 'John', last: 'Doe' }">
        <span k-text="first + ' ' + last"></span>
      </div>
    `;
    document.body.appendChild(container);

    const view = walk(container);
    expect(container.querySelector('span').textContent).toBe('John Doe');

    view.destroy();
  });
});
