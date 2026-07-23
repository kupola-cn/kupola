// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Unit tests for the directive system.
 * @jest-environment jsdom
 */

import {
  $, $$,
  defineScope,
  destroyWalk,
  getWalk,
  hasWalk,
  walk,
  walkAuto,
  walkOnce,
} from '../src/directives.js';
import { flushJobs, resetScheduler, signal } from '../src/index.js';

afterEach(() => {
  document.body.innerHTML = '';
  resetScheduler();
  jest.restoreAllMocks();
});

function nextMutationTick() {
  return new Promise(resolve => setTimeout(resolve, 0));
}

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

  test('applies k-transition classes before hiding', () => {
    jest.useFakeTimers();

    const container = document.createElement('div');
    container.innerHTML = `
      <div k-data="{ visible: true }">
        <button @click="visible = false">Hide</button>
        <p k-show="visible" k-transition>Content</p>
      </div>
    `;
    document.body.appendChild(container);

    const view = walk(container);
    const p = container.querySelector('p');

    container.querySelector('button').click();
    flushJobs();

    expect(p.style.display).toBe('');
    expect(p.classList.contains('kp-leave-from')).toBe(true);
    expect(p.classList.contains('kp-leave-active')).toBe(true);

    jest.runOnlyPendingTimers();
    jest.runOnlyPendingTimers();
    jest.advanceTimersByTime(50);

    expect(p.style.display).toBe('none');
    expect(p.classList.contains('kp-leave-active')).toBe(false);

    view.destroy();
    jest.useRealTimers();
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

  test('binds an object of attributes', () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <div k-data="{ loading: true, label: 'Saving' }">
        <button class="btn" k-bind="{ disabled: loading, title: label }">Save</button>
        <button class="change" @click="loading = false; label = null">Change</button>
      </div>
    `;
    document.body.appendChild(container);

    const view = walk(container);
    const btn = container.querySelector('.btn');

    expect(btn.className).toBe('btn');
    expect(btn.hasAttribute('disabled')).toBe(true);
    expect(btn.getAttribute('title')).toBe('Saving');

    container.querySelector('.change').click();
    flushJobs();

    expect(btn.className).toBe('btn');
    expect(btn.hasAttribute('disabled')).toBe(false);
    expect(btn.hasAttribute('title')).toBe(false);

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

  test('exposes event and $event in event expressions', () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <div k-data="{ key: '' }">
        <input @keydown="key = event.key" />
        <button @click="key = $event.type">Click</button>
        <span k-text="key"></span>
      </div>
    `;
    document.body.appendChild(container);

    const view = walk(container);
    const input = container.querySelector('input');
    const button = container.querySelector('button');
    const span = container.querySelector('span');

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    flushJobs();
    expect(span.textContent).toBe('Enter');

    button.click();
    flushJobs();
    expect(span.textContent).toBe('click');

    view.destroy();
  });

  test('supports keyboard event modifiers', () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <div k-data="{ count: 0 }">
        <input @keydown.enter="count++" />
        <span k-text="count"></span>
      </div>
    `;
    document.body.appendChild(container);

    const view = walk(container);
    const input = container.querySelector('input');
    const span = container.querySelector('span');

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    flushJobs();
    expect(span.textContent).toBe('0');

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    flushJobs();
    expect(span.textContent).toBe('1');

    view.destroy();
  });

  test('supports outside and debounce modifiers', () => {
    jest.useFakeTimers();

    const container = document.createElement('div');
    container.innerHTML = `
      <div k-data="{ open: true, query: '', updates: 0 }">
        <div class="panel" @click.outside="open = false">
          <input @input.debounce.300="query = event.target.value; updates++" />
        </div>
        <button class="outside">Outside</button>
        <span class="state" k-text="open + ':' + query + ':' + updates"></span>
      </div>
    `;
    document.body.appendChild(container);

    const view = walk(container);
    const panel = container.querySelector('.panel');
    const outside = container.querySelector('.outside');
    const input = container.querySelector('input');
    const state = container.querySelector('.state');

    panel.click();
    flushJobs();
    expect(state.textContent).toBe('true::0');

    outside.click();
    flushJobs();
    expect(state.textContent).toBe('false::0');

    input.value = 'a';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.value = 'ab';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    flushJobs();
    expect(state.textContent).toBe('false::0');

    jest.advanceTimersByTime(300);
    flushJobs();
    expect(state.textContent).toBe('false:ab:1');

    view.destroy();
    jest.useRealTimers();
  });

  test('once waits for a matching keyboard event', () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <div k-data="{ count: 0 }">
        <input @keydown.enter.once="count++" />
        <span k-text="count"></span>
      </div>
    `;
    document.body.appendChild(container);

    const view = walk(container);
    const input = container.querySelector('input');
    const span = container.querySelector('span');

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    flushJobs();
    expect(span.textContent).toBe('0');

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    flushJobs();
    expect(span.textContent).toBe('1');

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    flushJobs();
    expect(span.textContent).toBe('1');

    view.destroy();
  });

  test('once waits for an outside click', () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <div k-data="{ open: true }">
        <div class="panel" @click.outside.once="open = false">
          <button class="inside">Inside</button>
        </div>
        <button class="outside">Outside</button>
        <span class="state" k-text="open"></span>
      </div>
    `;
    document.body.appendChild(container);

    const view = walk(container);
    const inside = container.querySelector('.inside');
    const outside = container.querySelector('.outside');
    const state = container.querySelector('.state');

    inside.click();
    flushJobs();
    expect(state.textContent).toBe('true');

    outside.click();
    flushJobs();
    expect(state.textContent).toBe('false');

    inside.click();
    outside.click();
    flushJobs();
    expect(state.textContent).toBe('false');

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

  test('binds checkbox booleans', () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <div k-data="{ agree: true }">
        <input type="checkbox" k-model="agree" />
        <span k-text="agree"></span>
      </div>
    `;
    document.body.appendChild(container);

    const view = walk(container);
    const input = container.querySelector('input');
    const span = container.querySelector('span');

    expect(input.checked).toBe(true);

    input.checked = false;
    input.dispatchEvent(new Event('change'));
    flushJobs();

    expect(span.textContent).toBe('false');

    view.destroy();
  });

  test('binds checkbox arrays', () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <div k-data="{ tags: ['a'] }">
        <input type="checkbox" value="a" k-model="tags" />
        <input type="checkbox" value="b" k-model="tags" />
        <span k-text="tags.join(',')"></span>
      </div>
    `;
    document.body.appendChild(container);

    const view = walk(container);
    const inputs = container.querySelectorAll('input');
    const span = container.querySelector('span');

    expect(inputs[0].checked).toBe(true);
    expect(inputs[1].checked).toBe(false);

    inputs[1].checked = true;
    inputs[1].dispatchEvent(new Event('change'));
    flushJobs();

    expect(span.textContent).toBe('a,b');

    view.destroy();
  });

  test('binds radio values and select values', () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <div k-data="{ role: 'user', status: 'draft' }">
        <input type="radio" value="user" k-model="role" />
        <input type="radio" value="admin" k-model="role" />
        <select k-model="status">
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
        <span k-text="role + ':' + status"></span>
      </div>
    `;
    document.body.appendChild(container);

    const view = walk(container);
    const radios = container.querySelectorAll('input');
    const select = container.querySelector('select');
    const span = container.querySelector('span');

    expect(radios[0].checked).toBe(true);
    expect(select.value).toBe('draft');

    radios[1].checked = true;
    radios[1].dispatchEvent(new Event('change'));
    select.value = 'published';
    select.dispatchEvent(new Event('change'));
    flushJobs();

    expect(span.textContent).toBe('admin:published');

    view.destroy();
  });

  test('supports multiple select and trim/number/lazy modifiers', () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <div k-data="{ tags: ['a'], age: 0, name: '' }">
        <select multiple k-model="tags">
          <option value="a">A</option>
          <option value="b">B</option>
        </select>
        <input class="age" k-model.number="age" />
        <input class="name" k-model.trim.lazy="name" />
        <span k-text="tags.join(',') + ':' + age + ':' + name"></span>
      </div>
    `;
    document.body.appendChild(container);

    const view = walk(container);
    const select = container.querySelector('select');
    const age = container.querySelector('.age');
    const name = container.querySelector('.name');
    const span = container.querySelector('span');

    select.options[1].selected = true;
    select.dispatchEvent(new Event('change'));
    age.value = '42';
    age.dispatchEvent(new Event('input'));
    name.value = ' Alice ';
    name.dispatchEvent(new Event('input'));
    flushJobs();

    expect(span.textContent).toBe('a,b:42:');

    name.dispatchEvent(new Event('change'));
    flushJobs();

    expect(span.textContent).toBe('a,b:42:Alice');

    view.destroy();
  });

  test('supports debounce modifier', () => {
    jest.useFakeTimers();

    const container = document.createElement('div');
    container.innerHTML = `
      <div k-data="{ keyword: '' }">
        <input k-model.debounce.300="keyword" />
        <span k-text="keyword"></span>
      </div>
    `;
    document.body.appendChild(container);

    const view = walk(container);
    const input = container.querySelector('input');
    const span = container.querySelector('span');

    input.value = 'a';
    input.dispatchEvent(new Event('input'));
    input.value = 'ab';
    input.dispatchEvent(new Event('input'));
    flushJobs();

    expect(span.textContent).toBe('');

    jest.advanceTimersByTime(299);
    flushJobs();
    expect(span.textContent).toBe('');

    jest.advanceTimersByTime(1);
    flushJobs();
    expect(span.textContent).toBe('ab');

    view.destroy();
    jest.useRealTimers();
  });
});

// ─── k-init + k-cloak ───────────────────────────────────────────────────────

describe('k-init + k-cloak', () => {
  test('k-init runs once during initialization', () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <div k-data="{ count: 0 }" k-init="count = 5">
        <span k-text="count"></span>
      </div>
    `;
    document.body.appendChild(container);

    const view = walk(container);

    expect(container.querySelector('span').textContent).toBe('5');

    view.destroy();
  });

  test('k-cloak is removed after processing', () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <div k-data="{ ready: true }" k-cloak>
        <span k-text="ready"></span>
      </div>
    `;
    document.body.appendChild(container);

    const view = walk(container);

    expect(container.querySelector('[k-data]').hasAttribute('k-cloak')).toBe(false);

    view.destroy();
  });
});

// ─── k-class ────────────────────────────────────────────────────────────────

describe('k-class', () => {
  test('binds object class values', () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <div k-data="{ active: true, error: false }">
        <p class="base" k-class="{ 'is-active': active, 'is-error': error }">Text</p>
        <button @click="active = false; error = true">Toggle</button>
      </div>
    `;
    document.body.appendChild(container);

    const view = walk(container);
    const p = container.querySelector('p');

    expect(p.classList.contains('base')).toBe(true);
    expect(p.classList.contains('is-active')).toBe(true);
    expect(p.classList.contains('is-error')).toBe(false);

    container.querySelector('button').click();
    flushJobs();

    expect(p.classList.contains('base')).toBe(true);
    expect(p.classList.contains('is-active')).toBe(false);
    expect(p.classList.contains('is-error')).toBe(true);

    view.destroy();
  });

  test('binds string and array class values', () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <div k-data="{ cls: ['one', { two: true }, 'three four'] }">
        <p k-class="cls">Text</p>
      </div>
    `;
    document.body.appendChild(container);

    const view = walk(container);
    const p = container.querySelector('p');

    expect(p.classList.contains('one')).toBe(true);
    expect(p.classList.contains('two')).toBe(true);
    expect(p.classList.contains('three')).toBe(true);
    expect(p.classList.contains('four')).toBe(true);

    view.destroy();
  });

  test('splits whitespace in object class keys', () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <div k-data="{ active: true }">
        <p k-class="{ 'one two': active }">Text</p>
      </div>
    `;
    document.body.appendChild(container);

    const view = walk(container);
    const p = container.querySelector('p');

    expect(p.classList.contains('one')).toBe(true);
    expect(p.classList.contains('two')).toBe(true);

    view.destroy();
  });
});

// ─── k-style ────────────────────────────────────────────────────────────────

describe('k-style', () => {
  test('binds object style values', () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <div k-data="{ active: true }">
        <p style="display: block" k-style="{ color: active ? 'red' : null, backgroundColor: 'blue' }">Text</p>
        <button @click="active = false">Disable</button>
      </div>
    `;
    document.body.appendChild(container);

    const view = walk(container);
    const p = container.querySelector('p');

    expect(p.style.display).toBe('block');
    expect(p.style.color).toBe('red');
    expect(p.style.backgroundColor).toBe('blue');

    container.querySelector('button').click();
    flushJobs();

    expect(p.style.color).toBe('');
    expect(p.style.backgroundColor).toBe('blue');

    view.destroy();
  });
});

// ─── k-if ───────────────────────────────────────────────────────────────────

describe('k-if', () => {
  test('conditionally mounts and unmounts an element', () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <div k-data="{ visible: false }">
        <button @click="visible = !visible">Toggle</button>
        <p k-if="visible" k-text="'Visible'"></p>
      </div>
    `;
    document.body.appendChild(container);

    const view = walk(container);

    expect(container.querySelector('p')).toBe(null);

    container.querySelector('button').click();
    flushJobs();
    expect(container.querySelector('p').textContent).toBe('Visible');

    container.querySelector('button').click();
    flushJobs();
    expect(container.querySelector('p')).toBe(null);

    view.destroy();
  });

  test('cleans k-if refs and event handlers when unmounted', () => {
    const clicked = jest.fn();
    defineScope('conditionalPage', () => ({
      visible: true,
      clicked,
      hide() {
        this.visible = false;
      },
    }));

    const container = document.createElement('div');
    container.innerHTML = `
      <section k-data="conditionalPage">
        <button class="hide" @click="hide()">Hide</button>
        <button k-if="visible" k-ref="action" @click="clicked()">Action</button>
      </section>
    `;
    document.body.appendChild(container);

    const view = walk(container);
    const action = view.refs.action;

    expect(action).toBeTruthy();
    action.click();
    expect(clicked).toHaveBeenCalledTimes(1);

    container.querySelector('.hide').click();
    flushJobs();

    expect(view.refs.action).toBeUndefined();
    expect(container.querySelector('[k-ref="action"]')).toBe(null);

    action.click();
    expect(clicked).toHaveBeenCalledTimes(1);

    view.destroy();
  });

  test('supports k-else-if and k-else chains', () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <div k-data="{ status: 'loading' }">
        <button @click="status = 'error'">Error</button>
        <button class="done" @click="status = 'done'">Done</button>
        <p k-if="status === 'loading'">Loading</p>
        <p k-else-if="status === 'error'">Error</p>
        <p k-else>Done</p>
      </div>
    `;
    document.body.appendChild(container);

    const view = walk(container);

    expect(container.querySelector('p').textContent).toBe('Loading');

    container.querySelector('button').click();
    flushJobs();
    expect(container.querySelector('p').textContent).toBe('Error');

    container.querySelector('.done').click();
    flushJobs();
    expect(container.querySelector('p').textContent).toBe('Done');

    view.destroy();
  });

  test('keeps transitioned k-if nodes until leave completes', () => {
    jest.useFakeTimers();

    const container = document.createElement('div');
    container.innerHTML = `
      <div k-data="{ visible: true }">
        <button @click="visible = false">Hide</button>
        <p k-if="visible" k-transition>Content</p>
      </div>
    `;
    document.body.appendChild(container);

    const view = walk(container);
    const p = container.querySelector('p');

    container.querySelector('button').click();
    flushJobs();

    expect(container.querySelector('p')).toBe(p);
    expect(p.classList.contains('kp-leave-from')).toBe(true);

    jest.runOnlyPendingTimers();
    jest.runOnlyPendingTimers();
    jest.advanceTimersByTime(50);

    expect(container.querySelector('p')).toBe(null);

    view.destroy();
    jest.useRealTimers();
  });
});

// ─── k-for ──────────────────────────────────────────────────────────────────

describe('k-for', () => {
  test('renders template content for each item', () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <div k-data="{ items: ['Alice', 'Bob'] }">
        <ul>
          <template k-for="(item, index) in items">
            <li k-text="index + ': ' + item"></li>
          </template>
        </ul>
      </div>
    `;
    document.body.appendChild(container);

    const view = walk(container);
    const rows = [ ...container.querySelectorAll('li') ].map(row => row.textContent);

    expect(rows).toEqual([ '0: Alice', '1: Bob' ]);

    view.destroy();
  });

  test('updates when the source expression changes', () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <div k-data="{ items: ['A', 'B'] }">
        <button @click="items = ['C']">Change</button>
        <template k-for="item in items">
          <span k-text="item"></span>
        </template>
      </div>
    `;
    document.body.appendChild(container);

    const view = walk(container);
    expect([ ...container.querySelectorAll('span') ].map(row => row.textContent)).toEqual([ 'A', 'B' ]);

    container.querySelector('button').click();
    flushJobs();
    expect([ ...container.querySelectorAll('span') ].map(row => row.textContent)).toEqual([ 'C' ]);

    view.destroy();
  });

  test('cleans row refs and event handlers before rerendering', () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <div k-data="{ items: ['A'], selected: '' }">
        <button class="change" @click="items = ['B']">Change</button>
        <template k-for="item in items">
          <button k-ref="row" @click="selected = item" k-text="item"></button>
        </template>
        <span class="selected" k-text="selected"></span>
      </div>
    `;
    document.body.appendChild(container);

    const view = walk(container);
    const firstRow = view.refs.row;

    expect(firstRow.textContent).toBe('A');
    firstRow.click();
    flushJobs();
    expect(container.querySelector('.selected').textContent).toBe('A');

    container.querySelector('.change').click();
    flushJobs();

    expect(view.refs.row.textContent).toBe('B');
    expect(container.querySelectorAll('[k-ref="row"]')).toHaveLength(1);

    firstRow.click();
    flushJobs();
    expect(container.querySelector('.selected').textContent).toBe('A');

    view.refs.row.click();
    flushJobs();
    expect(container.querySelector('.selected').textContent).toBe('B');

    view.destroy();
  });

  test('reuses keyed rows when reordered', () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <div k-data="{ items: [{ id: 'a', name: 'Alice' }, { id: 'b', name: 'Bob' }] }">
        <button @click="items = [items[1], items[0]]">Reverse</button>
        <template k-for="item in items" :key="item.id">
          <label>
            <span k-text="item.id"></span>
            <input :value="item.name" />
          </label>
        </template>
      </div>
    `;
    document.body.appendChild(container);

    const view = walk(container);
    const firstInput = container.querySelector('input');
    firstInput.value = 'Typed';

    container.querySelector('button').click();
    flushJobs();

    const labels = [ ...container.querySelectorAll('label') ];
    const ids = labels.map(label => label.querySelector('span').textContent);
    const values = labels.map(label => label.querySelector('input').value);

    expect(ids).toEqual([ 'b', 'a' ]);
    expect(values).toEqual([ 'Bob', 'Typed' ]);

    view.destroy();
  });

  test('updates reused keyed rows when item values change', () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <div k-data="{ items: [{ id: 'a', name: 'Alice' }] }">
        <button @click="items = [{ id: 'a', name: 'Ann' }]">Update</button>
        <template k-for="item in items" :key="item.id">
          <span k-text="item.name"></span>
        </template>
      </div>
    `;
    document.body.appendChild(container);

    const view = walk(container);
    const span = container.querySelector('span');

    expect(span.textContent).toBe('Alice');

    container.querySelector('button').click();
    flushJobs();

    expect(container.querySelector('span')).toBe(span);
    expect(span.textContent).toBe('Ann');

    view.destroy();
  });

  test('warns for duplicate keyed rows without leaking stale nodes', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const container = document.createElement('div');
    container.innerHTML = `
      <div k-data="{
        items: [{ id: 'a', name: 'A1' }, { id: 'a', name: 'A2' }],
        update() { this.items = [{ id: 'a', name: 'B1' }, { id: 'a', name: 'B2' }] }
      }">
        <button @click="update()">Update</button>
        <template k-for="item in items" :key="item.id">
          <span k-text="item.name"></span>
        </template>
      </div>
    `;
    document.body.appendChild(container);

    const view = walk(container);
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('[kupola W004]'),
    );
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('duplicate k-for key "a"'));
    expect([ ...container.querySelectorAll('span') ].map(row => row.textContent)).toEqual([ 'A1', 'A2' ]);

    container.querySelector('button').click();
    flushJobs();

    expect([ ...container.querySelectorAll('span') ].map(row => row.textContent)).toEqual([ 'B1', 'B2' ]);
    expect(container.querySelectorAll('span')).toHaveLength(2);

    view.destroy();
  });

  test('cleans removed keyed rows', () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <div k-data="{ items: [{ id: 'a' }, { id: 'b' }], selected: '' }">
        <button class="remove" @click="items = [items[1]]">Remove</button>
        <template k-for="item in items" :key="item.id">
          <button k-ref="row" @click="selected = item.id" k-text="item.id"></button>
        </template>
        <span class="selected" k-text="selected"></span>
      </div>
    `;
    document.body.appendChild(container);

    const view = walk(container);
    const removed = view.refs.row[0];

    removed.click();
    flushJobs();
    expect(container.querySelector('.selected').textContent).toBe('a');

    container.querySelector('.remove').click();
    flushJobs();

    expect(view.refs.row.textContent).toBe('b');
    expect(container.querySelectorAll('[k-ref="row"]')).toHaveLength(1);

    removed.click();
    flushJobs();
    expect(container.querySelector('.selected').textContent).toBe('a');

    view.destroy();
  });

  test('cleans nested k-if refs and events inside reused keyed rows', () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <div k-data="{
        items: [{ id: 'a', visible: true }],
        selected: '',
        clicked(id) { this.selected = id },
        hide() { this.items = [{ id: 'a', visible: false }] }
      }">
        <button class="hide" @click="hide()">Hide</button>
        <template k-for="item in items" :key="item.id">
          <div>
            <button
              k-if="item.visible"
              k-ref="action"
              @click="clicked(item.id)"
            >Action</button>
          </div>
        </template>
        <span class="selected" k-text="selected"></span>
      </div>
    `;
    document.body.appendChild(container);

    const view = walk(container);
    const action = view.refs.action;

    action.click();
    flushJobs();
    expect(container.querySelector('.selected').textContent).toBe('a');

    container.querySelector('.hide').click();
    flushJobs();

    expect(view.refs.action).toBeUndefined();
    expect(container.querySelector('[k-ref="action"]')).toBe(null);

    action.click();
    flushJobs();
    expect(container.querySelector('.selected').textContent).toBe('a');

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

  test('walkAuto destroys the instance when the root is removed', async () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <section k-data="{ count: 0 }">
        <span k-text="count"></span>
        <button @click="count++">+</button>
      </section>
    `;
    document.body.appendChild(container);

    const root = container.querySelector('section');
    const button = container.querySelector('button');
    const span = container.querySelector('span');
    const view = walkAuto(root);

    button.click();
    flushJobs();
    expect(span.textContent).toBe('1');

    root.remove();
    await nextMutationTick();

    button.click();
    flushJobs();
    expect(span.textContent).toBe('1');

    view.destroy();
  });

  test('manual destroy cancels auto destroy observation', async () => {
    const cleanup = jest.fn();
    defineScope('autoDestroyManualPage', () => ({
      mounted({ watch }) {
        watch(() => true, () => cleanup, { immediate: true });
      },
    }));

    const container = document.createElement('div');
    container.innerHTML = '<section k-data="autoDestroyManualPage"></section>';
    document.body.appendChild(container);

    const root = container.querySelector('section');
    const view = walk(root, { autoDestroy: true });

    view.destroy();
    expect(cleanup).toHaveBeenCalledTimes(1);

    root.remove();
    await nextMutationTick();

    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  test('warns when the same root is walked more than once before destroy', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const container = document.createElement('div');
    container.innerHTML = `
      <section k-data="{ count: 0 }">
        <button @click="count++">+</button>
      </section>
    `;
    document.body.appendChild(container);

    const root = container.querySelector('section');
    const first = walk(root);
    const second = walk(root);

    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('[kupola W012]'),
    );
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('already initialized by walk()'));

    second.destroy();
    first.destroy();
  });

  test('does not warn after a previous walk instance is destroyed', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const container = document.createElement('div');
    container.innerHTML = '<section k-data="{ count: 0 }"></section>';
    document.body.appendChild(container);

    const root = container.querySelector('section');
    const first = walk(root);
    first.destroy();
    warn.mockClear();

    const second = walk(root);

    expect(warn).not.toHaveBeenCalled();

    second.destroy();
  });

  test('walkOnce returns the existing instance without rebinding', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const container = document.createElement('div');
    container.innerHTML = `
      <section k-data="{ count: 0 }">
        <button @click="count++">+</button>
        <span k-text="count"></span>
      </section>
    `;
    document.body.appendChild(container);

    const root = container.querySelector('section');
    const first = walkOnce(root);
    const second = walkOnce(root);

    expect(second).toBe(first);
    expect(warn).not.toHaveBeenCalled();

    container.querySelector('button').click();
    flushJobs();
    expect(container.querySelector('span').textContent).toBe('1');

    first.destroy();
  });

  test('walkOnce creates a new instance after destroy', () => {
    const container = document.createElement('div');
    container.innerHTML = '<section k-data="{ count: 0 }"></section>';
    document.body.appendChild(container);

    const root = container.querySelector('section');
    const first = walkOnce(root);
    first.destroy();

    const second = walkOnce(root);

    expect(second).not.toBe(first);

    second.destroy();
  });

  test('getWalk and hasWalk reflect active walk instances', () => {
    const container = document.createElement('div');
    container.innerHTML = '<section id="lifecycle-root" k-data="{ count: 0 }"></section>';
    document.body.appendChild(container);

    const root = container.querySelector('section');
    expect(getWalk(root)).toBe(null);
    expect(getWalk('#lifecycle-root')).toBe(null);
    expect(hasWalk(root)).toBe(false);
    expect(hasWalk('#missing-root')).toBe(false);

    const view = walk(root);

    expect(getWalk(root)).toBe(view);
    expect(getWalk('#lifecycle-root')).toBe(view);
    expect(hasWalk(root)).toBe(true);
    expect(hasWalk('#lifecycle-root')).toBe(true);

    view.destroy();
    expect(getWalk(root)).toBe(null);
    expect(hasWalk(root)).toBe(false);
  });

  test('destroyWalk destroys by root or selector and reports whether an instance existed', () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <section id="destroy-root" k-data="{ count: 0 }">
        <button @click="count++">+</button>
        <span k-text="count"></span>
      </section>
    `;
    document.body.appendChild(container);

    const root = container.querySelector('section');
    const button = container.querySelector('button');
    const span = container.querySelector('span');
    const view = walk(root);

    button.click();
    flushJobs();
    expect(span.textContent).toBe('1');
    expect(getWalk(root)).toBe(view);

    expect(destroyWalk('#destroy-root')).toBe(true);
    expect(getWalk(root)).toBe(null);

    button.click();
    flushJobs();
    expect(span.textContent).toBe('1');

    expect(destroyWalk(root)).toBe(false);
    expect(destroyWalk('#missing-root')).toBe(false);
  });

  test('destroyWalk allows walkOnce to create a fresh instance later', () => {
    const container = document.createElement('div');
    container.innerHTML = '<section k-data="{ count: 0 }"></section>';
    document.body.appendChild(container);

    const root = container.querySelector('section');
    const first = walkOnce(root);

    expect(destroyWalk(root)).toBe(true);

    const second = walkOnce(root);

    expect(second).not.toBe(first);
    expect(getWalk(root)).toBe(second);

    second.destroy();
  });
});

// ─── Scope API ───────────────────────────────────────────────────────────────

describe('scope api', () => {
  test('$ and $$ query globally or within a context', () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <section id="app">
        <button class="btn">A</button>
        <button class="btn">B</button>
      </section>
      <button class="btn outside">C</button>
    `;
    document.body.appendChild(container);
    const app = container.querySelector('#app');

    expect($('.btn').textContent).toBe('A');
    expect($$('.btn')).toHaveLength(3);
    expect($$('.btn', app)).toHaveLength(2);
    expect($(app)).toBe(app);
  });

  test('walk accepts a selector and exposes scoped query helpers', () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <section id="app">
        <button class="btn">A</button>
        <button class="btn">B</button>
      </section>
      <button class="btn outside">C</button>
    `;
    document.body.appendChild(container);

    const view = walk('#app');

    expect(view.root.id).toBe('app');
    expect(view.$('.btn').textContent).toBe('A');
    expect(view.$$('.btn')).toHaveLength(2);
    expect(view.$('.outside')).toBe(null);

    view.destroy();
  });

  test('collects k-ref values for the walk result', () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <div k-data="{ name: 'Alice' }">
        <input k-ref="nameInput" k-model="name" />
        <button k-ref="action">Save</button>
      </div>
    `;
    document.body.appendChild(container);

    const view = walk(container);

    expect(view.refs.nameInput.tagName).toBe('INPUT');
    expect(view.refs.action.tagName).toBe('BUTTON');

    view.destroy();
  });

  test('groups duplicate k-ref values as an array', () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <div k-data="{ items: [] }">
        <button k-ref="row">A</button>
        <button k-ref="row">B</button>
      </div>
    `;
    document.body.appendChild(container);

    const view = walk(container);

    expect(Array.isArray(view.refs.row)).toBe(true);
    expect(view.refs.row).toHaveLength(2);

    view.destroy();
  });

  test('defineScope supports named scope factories and mounted context', () => {
    const mounted = jest.fn();
    defineScope('usersPage', ({ refs }) => ({
      keyword: 'Alice',
      mounted(ctx) {
        mounted(ctx.root, refs.keyword);
        refs.keyword.focus();
      },
    }));

    const container = document.createElement('div');
    container.innerHTML = `
      <section k-data="usersPage">
        <input k-ref="keyword" k-model="keyword" />
        <span k-text="keyword"></span>
      </section>
    `;
    document.body.appendChild(container);

    const view = walk(container);
    const input = container.querySelector('input');

    expect(container.querySelector('span').textContent).toBe('Alice');
    expect(mounted).toHaveBeenCalledWith(container.querySelector('section'), input);
    expect(document.activeElement).toBe(input);

    input.value = 'Bob';
    input.dispatchEvent(new Event('input'));
    flushJobs();
    expect(container.querySelector('span').textContent).toBe('Bob');

    view.destroy();
  });

  test('scope methods can be called from event expressions with this bound to scope', () => {
    defineScope('counterPage', () => ({
      count: 0,
      increment() {
        this.count += 1;
      },
    }));

    const container = document.createElement('div');
    container.innerHTML = `
      <section k-data="counterPage">
        <button @click="increment()">+</button>
        <span k-text="count"></span>
      </section>
    `;
    document.body.appendChild(container);

    const view = walk(container);
    container.querySelector('button').click();
    flushJobs();

    expect(container.querySelector('span').textContent).toBe('1');

    view.destroy();
  });

  test('ctx.on delegates events and is cleaned up on destroy', () => {
    const handler = jest.fn();
    defineScope('delegatedPage', ({ on }) => ({
      mounted() {
        on('click', '[data-remove]', (event, target) => {
          handler(target.dataset.remove);
        });
      },
    }));

    const container = document.createElement('div');
    container.innerHTML = `
      <section k-data="delegatedPage">
        <button data-remove="42">Remove</button>
      </section>
    `;
    document.body.appendChild(container);

    const view = walk(container);
    const button = container.querySelector('button');

    button.click();
    expect(handler).toHaveBeenCalledWith('42');

    view.destroy();
    button.click();
    expect(handler).toHaveBeenCalledTimes(1);
  });

  test('ctx.watch observes scope changes', () => {
    const watched = jest.fn();
    defineScope('watchPageWithContext', () => ({
      keyword: '',
      mounted({ watch }) {
        this.$watchOff = watch(() => this.keyword, watched);
      },
    }));

    const container = document.createElement('div');
    container.innerHTML = `
      <section k-data="watchPageWithContext">
        <button @click="keyword = 'Alice'">Change</button>
      </section>
    `;
    document.body.appendChild(container);

    const view = walk(container);

    expect(watched).not.toHaveBeenCalled();

    container.querySelector('button').click();
    flushJobs();

    expect(watched).toHaveBeenCalledWith('Alice', '');

    view.destroy();
  });

  test('ctx.watch does not track dependencies read by the callback', () => {
    const getter = jest.fn();
    const watched = jest.fn();

    defineScope('watchUntrackedCallbackPage', () => ({
      keyword: '',
      other: 'initial',
      mounted({ watch }) {
        watch(
          () => {
            getter();
            return this.keyword;
          },
          () => {
            watched(this.other);
          },
        );
      },
    }));

    const container = document.createElement('div');
    container.innerHTML = `
      <section k-data="watchUntrackedCallbackPage">
        <button class="keyword" @click="keyword = 'Alice'">Keyword</button>
        <button class="other" @click="other = 'changed'">Other</button>
      </section>
    `;
    document.body.appendChild(container);

    const view = walk(container);
    expect(getter).toHaveBeenCalledTimes(1);

    container.querySelector('.keyword').click();
    flushJobs();
    expect(getter).toHaveBeenCalledTimes(2);
    expect(watched).toHaveBeenCalledWith('initial');

    container.querySelector('.other').click();
    flushJobs();
    expect(getter).toHaveBeenCalledTimes(2);
    expect(watched).toHaveBeenCalledTimes(1);

    view.destroy();
  });

  test('walk result exposes watch helper and cleans it on destroy', () => {
    const watched = jest.fn();
    const count = signal(0);
    const container = document.createElement('div');
    document.body.appendChild(container);

    const view = walk(container);
    view.watch(() => count.value, watched);

    count.value = 1;
    flushJobs();
    expect(watched).toHaveBeenCalledWith(1, 0);

    view.destroy();
    count.value = 2;
    flushJobs();
    expect(watched).toHaveBeenCalledTimes(1);
  });

  test('ctx.watch runs returned cleanup before rerun and on destroy', () => {
    const order = [];
    defineScope('watchCleanupPage', () => ({
      keyword: 'A',
      mounted({ watch }) {
        watch(
          () => this.keyword,
          value => {
            order.push(`run:${value}`);
            return () => order.push(`cleanup:${value}`);
          },
          { immediate: true },
        );
      },
    }));

    const container = document.createElement('div');
    container.innerHTML = `
      <section k-data="watchCleanupPage">
        <button @click="keyword = 'B'">Change</button>
      </section>
    `;
    document.body.appendChild(container);

    const view = walk(container);
    expect(order).toEqual([ 'run:A' ]);

    container.querySelector('button').click();
    flushJobs();
    expect(order).toEqual([ 'run:A', 'cleanup:A', 'run:B' ]);

    view.destroy();
    expect(order).toEqual([ 'run:A', 'cleanup:A', 'run:B', 'cleanup:B' ]);
  });

  test('ctx.update and ctx.patch update top-level scope state', () => {
    defineScope('stateHelpersPage', () => ({
      items: [ 'A' ],
      user: { name: 'Alice', role: 'admin' },
      added: [],
      changed: { name: '' },
      mounted({ update, patch }) {
        this.added = update('items', items => [ ...items, 'B' ]);
        this.changed = patch('user', { name: 'Bob' });
      },
    }));

    const container = document.createElement('div');
    container.innerHTML = `
      <section k-data="stateHelpersPage">
        <span class="items" k-text="items.join(',')"></span>
        <span class="user" k-text="user.name + ':' + user.role"></span>
        <span class="added" k-text="added.join(',')"></span>
        <span class="changed" k-text="changed.name"></span>
      </section>
    `;
    document.body.appendChild(container);

    const view = walk(container);
    flushJobs();

    expect(container.querySelector('.items').textContent).toBe('A,B');
    expect(container.querySelector('.user').textContent).toBe('Bob:admin');
    expect(container.querySelector('.added').textContent).toBe('A,B');
    expect(container.querySelector('.changed').textContent).toBe('Bob');

    view.destroy();
  });

  test('ctx.update and ctx.patch can be captured by named scope factories', () => {
    defineScope('capturedStateHelpersPage', ({ update, patch }) => ({
      items: [ 'A' ],
      filters: { keyword: '', role: 'all' },
      addItem() {
        update('items', items => [ ...items, 'B' ]);
      },
      setKeyword() {
        patch('filters', { keyword: 'Alice' });
      },
    }));

    const container = document.createElement('div');
    container.innerHTML = `
      <section k-data="capturedStateHelpersPage">
        <button class="add" @click="addItem()">Add</button>
        <button class="filter" @click="setKeyword()">Filter</button>
        <span class="items" k-text="items.join(',')"></span>
        <span class="filters" k-text="filters.keyword + ':' + filters.role"></span>
      </section>
    `;
    document.body.appendChild(container);

    const view = walk(container);

    container.querySelector('.add').click();
    container.querySelector('.filter').click();
    flushJobs();

    expect(container.querySelector('.items').textContent).toBe('A,B');
    expect(container.querySelector('.filters').textContent).toBe('Alice:all');

    view.destroy();
  });

  test('ctx.update and ctx.patch validate arguments', () => {
    defineScope('invalidUpdateHelperPage', () => ({
      count: 0,
      user: { name: 'Alice' },
      mounted({ update }) {
        update('user.name', value => value);
      },
    }));

    const container = document.createElement('div');
    container.innerHTML = '<section k-data="invalidUpdateHelperPage"></section>';
    document.body.appendChild(container);

    expect(() => walk(container)).toThrow(
      /ctx\.update\(\) expects a top-level scope property name/,
    );
  });

  test('ctx.patch rejects non-object target state', () => {
    defineScope('invalidPatchHelperPage', () => ({
      count: 0,
      mounted({ patch }) {
        patch('count', { value: 1 });
      },
    }));

    const container = document.createElement('div');
    container.innerHTML = '<section k-data="invalidPatchHelperPage"></section>';
    document.body.appendChild(container);

    expect(() => walk(container)).toThrow(
      /ctx\.patch\(\) expects "count" to be an object scope property/,
    );
  });
});

// ─── warnings and cleanup ───────────────────────────────────────────────────

describe('warnings and cleanup', () => {
  test('warns when k-data references an unknown named scope', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const container = document.createElement('div');
    container.innerHTML = `
      <div k-data="missingScope">
        <span k-text="'ok'"></span>
      </div>
    `;
    document.body.appendChild(container);

    const view = walk(container);
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('[kupola W013]'),
    );
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('Unknown k-data scope "missingScope"'));

    view.destroy();
  });

  test('warns and skips directives with empty expressions', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const container = document.createElement('div');
    container.innerHTML = `
      <div k-data="">
        <button @click="">Save</button>
        <span k-text=""></span>
        <input k-model="" />
        <p :title=""></p>
      </div>
    `;
    document.body.appendChild(container);

    const view = walk(container);

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('[kupola W001]'));
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('empty k-data expression'));
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('empty @click expression'));
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('empty k-text expression'));
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('empty k-model expression'));
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('empty :title expression'));

    view.destroy();
  });

  test('does not warn for directives without required expressions', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const container = document.createElement('div');
    container.innerHTML = `
      <div k-data="{ open: true }">
        <p k-show="open" k-transition k-cloak>Content</p>
      </div>
    `;
    document.body.appendChild(container);

    const view = walk(container);

    expect(warn).not.toHaveBeenCalled();
    expect(container.querySelector('p').hasAttribute('k-cloak')).toBe(false);

    view.destroy();
  });

  test('warns and skips k-on without an event name', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const container = document.createElement('div');
    container.innerHTML = `
      <div k-data="{ count: 0 }">
        <button k-on="count++">Broken</button>
        <span k-text="count"></span>
      </div>
    `;
    document.body.appendChild(container);

    const view = walk(container);

    container.querySelector('button').click();
    flushJobs();

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('[kupola W002]'));
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('k-on without an event name'));
    expect(container.querySelector('span').textContent).toBe('0');

    view.destroy();
  });

  test('warns for k-else-if or k-else without an adjacent k-if', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const container = document.createElement('div');
    container.innerHTML = `
      <div k-data="{ ready: true }">
        <p k-else>Fallback</p>
      </div>
    `;
    document.body.appendChild(container);

    const view = walk(container);

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('[kupola W010]'));
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('without an adjacent k-if branch'));

    view.destroy();
  });

  test('throws a helpful error for invalid k-for expressions', () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <div k-data="{ items: [] }">
        <template k-for="items">
          <span></span>
        </template>
      </div>
    `;
    document.body.appendChild(container);

    let thrown;
    try {
      walk(container);
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeDefined();
    expect(thrown.message).toMatch(/\[kupola E002\]/);
    expect(thrown.message).toMatch(/Use "item in items" or "\(item, index\) in items"/);
  });

  test('throws directive expression errors with element and original cause', () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <div k-data="{ item: null }">
        <span id="name" class="label" k-text="item.name"></span>
      </div>
    `;
    document.body.appendChild(container);

    let thrown;
    try {
      walk(container);
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeDefined();
    expect(thrown.name).toBe('KupolaExpressionError');
    expect(thrown.message).toContain('[kupola E001]');
    expect(thrown.message).toContain('k-text');
    expect(thrown.message).toContain('<span#name.label>');
    expect(thrown.expression).toBe('item.name');
    expect(thrown.cause).toBeInstanceOf(Error);
  });

  test('adds a CSP hint when expression compilation is blocked', () => {
    const OriginalFunction = globalThis.Function;
    const cspError = new EvalError(
      'Refused to evaluate a string as JavaScript because unsafe-eval is not an allowed source.',
    );
    let thrown;

    const container = document.createElement('div');
    container.innerHTML = '<span k-text="1 + 1"></span>';
    document.body.appendChild(container);

    try {
      globalThis.Function = function blockedFunction() {
        throw cspError;
      };
      walk(container);
    } catch (error) {
      thrown = error;
    } finally {
      globalThis.Function = OriginalFunction;
    }

    expect(thrown).toBeDefined();
    expect(thrown.name).toBe('KupolaExpressionError');
    expect(thrown.cause).toBe(cspError);
    expect(thrown.message).toContain('unsafe-eval');
    expect(thrown.message).toContain('strict CSP environments');
  });

  test('warns when k-transition is used without k-show or k-if', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const container = document.createElement('div');
    container.innerHTML = `
      <div k-data="{ open: true }">
        <p k-transition>Content</p>
      </div>
    `;
    document.body.appendChild(container);

    const view = walk(container);

    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('[kupola W011]'),
    );
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('k-transition, but it only runs with k-show or k-if'));

    view.destroy();
  });

  test('warns when k-model is used on an unsupported element', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const container = document.createElement('div');
    container.innerHTML = `
      <div k-data="{ value: '' }">
        <button k-model="value">Broken</button>
      </div>
    `;
    document.body.appendChild(container);

    const view = walk(container);

    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('[kupola W003]'),
    );
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('k-model expects <input>, <select>, or <textarea>'));

    view.destroy();
  });

  test('warns for directive combinations that compete for the same DOM state', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const container = document.createElement('div');
    container.innerHTML = `
      <div k-data="{ items: [{ id: 1 }], active: true, color: 'red', value: 'A' }">
        <template k-for="item in items" k-if="active" :key="item.id">
          <span k-text="item.id"></span>
        </template>
        <p k-class="{ active: active }" :class="'manual'">Class</p>
        <p k-style="{ color }" :style="'color: blue'">Style</p>
        <input k-model="value" :value="value" />
        <input type="checkbox" k-model="active" :checked="active" />
      </div>
    `;
    document.body.appendChild(container);

    const view = walk(container);

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('[kupola W005]'));
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('[kupola W006]'));
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('[kupola W007]'));
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('[kupola W009]'));
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('[kupola W008]'));

    view.destroy();
  });

  test('does not warn when checkbox or radio k-model uses a dynamic value', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const container = document.createElement('div');
    container.innerHTML = `
      <div k-data="{ tag: 'a', role: 'admin', tags: [] }">
        <input type="checkbox" k-model="tags" :value="tag" />
        <input type="radio" k-model="role" :value="role" />
      </div>
    `;
    document.body.appendChild(container);

    const view = walk(container);

    expect(warn).not.toHaveBeenCalled();

    view.destroy();
  });

  test('cleans watch effects when a k-if branch unmounts', () => {
    const watched = jest.fn();
    const external = signal(0);

    defineScope('watchBranchPage', () => ({
      visible: true,
      bump() {
        external.value += 1;
      },
      hide() {
        this.visible = false;
      },
    }));

    defineScope('watchBranchScope', () => ({
      mounted({ watch }) {
        watch(() => external.value, watched);
      },
    }));

    const container = document.createElement('div');
    container.innerHTML = `
      <section k-data="watchBranchPage">
        <button class="bump" @click="bump()">Bump</button>
        <button class="hide" @click="hide()">Hide</button>
        <div k-if="visible">
          <div k-data="watchBranchScope">
            <span>Branch</span>
          </div>
        </div>
      </section>
    `;
    document.body.appendChild(container);

    const view = walk(container);

    container.querySelector('.bump').click();
    flushJobs();
    expect(watched).toHaveBeenCalledWith(1, 0);

    container.querySelector('.hide').click();
    flushJobs();

    container.querySelector('.bump').click();
    flushJobs();
    expect(watched).toHaveBeenCalledTimes(1);

    view.destroy();
  });

  test('destroy removes a transitioned k-if branch immediately', () => {
    jest.useFakeTimers();

    const container = document.createElement('div');
    container.innerHTML = `
      <div k-data="{ visible: true }">
        <button class="hide" @click="visible = false">Hide</button>
        <p k-if="visible" k-transition>Content</p>
      </div>
    `;
    document.body.appendChild(container);

    const view = walk(container);

    container.querySelector('.hide').click();
    flushJobs();
    view.destroy();

    expect(container.querySelector('p')).toBe(null);

    jest.runOnlyPendingTimers();
    jest.runOnlyPendingTimers();
    jest.advanceTimersByTime(50);

    expect(container.querySelector('p')).toBe(null);
    jest.useRealTimers();
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
