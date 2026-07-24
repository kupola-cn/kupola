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
  setHtmlSanitizer,
  walk,
  walkAuto,
  walkOnce,
} from '../src/directives.js';
import { flushJobs, resetScheduler, signal } from '../src/index.js';

afterEach(() => {
  setHtmlSanitizer(null);
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

  test('ignores transition completion events bubbled from descendants', () => {
    jest.useFakeTimers();

    const container = document.createElement('div');
    container.innerHTML = `
      <div k-data="{ visible: true }">
        <button @click="visible = false">Hide</button>
        <p k-show="visible" k-transition><span>Content</span></p>
      </div>
    `;
    document.body.appendChild(container);

    const view = walk(container);
    const p = container.querySelector('p');
    const child = container.querySelector('span');
    container.querySelector('button').click();
    flushJobs();
    jest.advanceTimersByTime(32);

    child.dispatchEvent(new Event('transitionend', { bubbles: true }));
    expect(p.style.display).toBe('');

    p.dispatchEvent(new Event('transitionend'));
    expect(p.style.display).toBe('none');

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

  test('uses an optional global sanitizer before writing HTML', () => {
    setHtmlSanitizer(html => html.replace(/<script[\s\S]*?<\/script>/gi, ''));
    const container = document.createElement('div');
    container.innerHTML = `
      <div k-data="{ content: '<b>safe</b><script>unsafe()</script>' }">
        <div k-html="content"></div>
      </div>
    `;
    document.body.appendChild(container);

    const view = walk(container);
    expect(container.querySelector('[k-html]').innerHTML).toBe('<b>safe</b>');
    view.destroy();
  });

  test('isolates per-walk sanitizers and rejects asynchronous sanitizer output', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const first = document.createElement('div');
    const second = document.createElement('div');
    const third = document.createElement('div');
    first.innerHTML = '<div k-data="{ html: \'<b>one</b>\' }"><p k-html="html"></p></div>';
    second.innerHTML = '<div k-data="{ html: \'<b>two</b>\' }"><p k-html="html"></p></div>';
    third.innerHTML = '<div k-data="{ html: \'<b>three</b>\' }"><p k-html="html"></p></div>';
    document.body.append(first, second, third);

    const firstView = walk(first, { sanitizer: html => html.replace(/<[^>]+>/g, '') });
    const secondView = walk(second, { sanitizer: html => html.toUpperCase() });
    const thirdView = walk(third, { sanitizer: () => Promise.resolve('later') });

    expect(first.querySelector('p').innerHTML).toBe('one');
    expect(second.querySelector('p').innerHTML).toBe('<b>TWO</b>');
    expect(third.querySelector('p').innerHTML).toBe('');
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('[kupola W023]'));

    firstView.destroy();
    secondView.destroy();
    thirdView.destroy();
  });

  test('uses one sanitizer configuration throughout nested scopes and lets null disable the global fallback', () => {
    setHtmlSanitizer(() => '<i>global</i>');
    const first = document.createElement('div');
    const second = document.createElement('div');
    first.innerHTML = `
      <section k-data="{ html: '<b>outer</b>' }">
        <p class="outer" k-html="html"></p>
        <div k-data="{ html: '<b>inner</b>' }"><p class="inner" k-html="html"></p></div>
      </section>
    `;
    second.innerHTML = '<div k-data="{ html: \'<b>trusted</b>\' }"><p k-html="html"></p></div>';
    document.body.append(first, second);

    const firstView = walk(first, { sanitizer: html => html.replace(/<[^>]+>/g, '') });
    const secondView = walk(second, { sanitizer: null });

    expect(first.querySelector('.outer').innerHTML).toBe('outer');
    expect(first.querySelector('.inner').innerHTML).toBe('inner');
    expect(second.querySelector('p').innerHTML).toBe('<b>trusted</b>');

    firstView.destroy();
    secondView.destroy();
  });

  test('clears k-html when a sanitizer returns a non-string value', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const container = document.createElement('div');
    container.innerHTML = '<div k-data="{ html: \'<b>content</b>\' }"><p k-html="html"></p></div>';
    document.body.appendChild(container);

    const view = walk(container, { sanitizer: () => ({ html: 'not a string' }) });
    expect(container.querySelector('p').innerHTML).toBe('');
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('sanitizer must return a string'));
    view.destroy();
  });

  test('clears k-html when a sanitizer throws', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const container = document.createElement('div');
    container.innerHTML = '<div k-data="{ html: \'<b>content</b>\' }"><p k-html="html"></p></div>';
    document.body.appendChild(container);

    const view = walk(container, { sanitizer: () => { throw new Error('sanitizer failed'); } });
    expect(container.querySelector('p').innerHTML).toBe('');
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('sanitizer failed'));
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

  test('supports system keys, letter keys, capture, and passive modifiers', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const container = document.createElement('div');
    container.innerHTML = `
      <div k-data="{ keys: 0, order: '' }" @click.capture="order += 'parent'">
        <input @keydown.ctrl.k="keys++" />
        <button @click.passive.prevent="order += ':button'">Run</button>
        <span k-text="keys + ':' + order"></span>
      </div>
    `;
    document.body.appendChild(container);

    const view = walk(container);
    const input = container.querySelector('input');
    const button = container.querySelector('button');
    const span = container.querySelector('span');

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'k' }));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'x', ctrlKey: true }));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'K', ctrlKey: true }));
    button.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    flushJobs();

    expect(span.textContent).toBe('1:parent:button');
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('[kupola W015]'));

    view.destroy();
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(span.textContent).toBe('1:parent:button');
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

  test('warns and skips file inputs because their value is browser-owned', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const container = document.createElement('div');
    container.innerHTML = `
      <div k-data="{ upload: '' }">
        <input type="file" k-model="upload" />
      </div>
    `;
    document.body.appendChild(container);

    const view = walk(container);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('[kupola W022]'));
    view.destroy();
  });

  test('only accepts safe k-model targets', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const container = document.createElement('div');
    container.innerHTML = `
      <div k-data="{ user: { name: 'Ada' } }">
        <input class="path" k-model="user.name" />
        <input class="prototype" k-model="__proto__" />
      </div>
    `;
    document.body.appendChild(container);

    const view = walk(container);
    expect(container.querySelector('.path').value).toBe('Ada');
    expect(container.querySelector('.prototype').value).toBe('');
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('[kupola W024]'));
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

  test('normalizes duplicate checkbox array values by strict equality', () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <div k-data="{ tags: ['a', 'a'] }">
        <input type="checkbox" value="a" k-model="tags" />
        <span k-text="tags.join(',')"></span>
      </div>
    `;
    document.body.appendChild(container);

    const view = walk(container);
    const checkbox = container.querySelector('input');
    const output = container.querySelector('span');
    expect(checkbox.checked).toBe(true);

    checkbox.checked = false;
    checkbox.dispatchEvent(new Event('change'));
    expect(output.textContent).toBe('');

    checkbox.checked = true;
    checkbox.dispatchEvent(new Event('change'));
    expect(output.textContent).toBe('a');
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

  test('supports boolean values for radios and multiple selects', () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <div k-data="{ enabled: true, flags: [false] }">
        <input type="radio" value="true" k-model.boolean="enabled" />
        <input type="radio" value="false" k-model.boolean="enabled" />
        <select multiple k-model.boolean="flags">
          <option value="true">Enabled</option>
          <option value="false">Disabled</option>
        </select>
        <span k-text="enabled + ':' + flags.join(',')"></span>
      </div>
    `;
    document.body.appendChild(container);

    const view = walk(container);
    const radios = container.querySelectorAll('input');
    const select = container.querySelector('select');
    const span = container.querySelector('span');

    expect(radios[0].checked).toBe(true);
    expect(radios[1].checked).toBe(false);
    expect(select.options[1].selected).toBe(true);

    radios[1].checked = true;
    radios[1].dispatchEvent(new Event('change'));
    select.options[0].selected = true;
    select.options[1].selected = false;
    select.dispatchEvent(new Event('change'));
    flushJobs();

    expect(span.textContent).toBe('false:true');
    view.destroy();
  });

  test('does not commit text input until IME composition ends', () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <div k-data="{ text: '' }">
        <input k-model="text" />
        <span k-text="text"></span>
      </div>
    `;
    document.body.appendChild(container);

    const view = walk(container);
    const input = container.querySelector('input');
    const span = container.querySelector('span');

    input.dispatchEvent(new CompositionEvent('compositionstart'));
    input.value = 'zhong';
    input.dispatchEvent(new InputEvent('input', { isComposing: true }));
    flushJobs();
    expect(span.textContent).toBe('');

    input.value = '中';
    input.dispatchEvent(new CompositionEvent('compositionend'));
    flushJobs();
    expect(span.textContent).toBe('中');

    view.destroy();
    input.value = '文';
    input.dispatchEvent(new Event('input'));
    expect(span.textContent).toBe('中');
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

  test('blocks unsafe URL values in dynamic styles', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const container = document.createElement('div');
    container.innerHTML = `
      <div k-data="{ bg: 'url(javascript:alert(1))', css: 'background: url(data:image/svg+xml,unsafe)' }">
        <p class="object" k-style="{ backgroundImage: bg }"></p>
        <p class="string" k-style="css"></p>
      </div>
    `;
    document.body.appendChild(container);

    const view = walk(container);
    expect(container.querySelector('.object').style.backgroundImage).toBe('');
    expect(container.querySelector('.string').getAttribute('style')).toBe('');
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('[kupola W020]'));
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

  test('supports k-key as an explicit k-for key directive', () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <div k-data="{ items: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }] }">
        <button @click="items = [items[1], items[0]]">Reorder</button>
        <p k-for="item in items" k-key="item.id" k-text="item.label"></p>
      </div>
    `;
    document.body.appendChild(container);

    const view = walk(container);
    const firstRow = container.querySelectorAll('p')[0];
    container.querySelector('button').click();
    flushJobs();

    expect(container.querySelectorAll('p')[1]).toBe(firstRow);
    expect([ ...container.querySelectorAll('p') ].map(node => node.textContent)).toEqual([ 'B', 'A' ]);
    view.destroy();
  });

  test('reuses rows keyed by object references and symbols', () => {
    const objectKey = {};
    const symbolKey = Symbol('row');
    defineScope('referenceKeyPage', () => ({
      items: [
        { key: objectKey, label: 'Object' },
        { key: symbolKey, label: 'Symbol' },
      ],
      reorder() {
        this.items = [ ...this.items ].reverse();
      },
    }));

    const container = document.createElement('div');
    container.innerHTML = `
      <section k-data="referenceKeyPage">
        <button class="reorder" @click="reorder()">Reorder</button>
        <p k-for="item in items" :key="item.key" k-text="item.label"></p>
      </section>
    `;
    document.body.appendChild(container);

    const view = walk(container);
    const [ objectRow, symbolRow ] = container.querySelectorAll('p');
    container.querySelector('.reorder').click();
    flushJobs();

    const rows = container.querySelectorAll('p');
    expect(rows[0]).toBe(symbolRow);
    expect(rows[1]).toBe(objectRow);
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

  test('walkAuto keeps an instance alive when its root moves within the document', async () => {
    const firstHost = document.createElement('div');
    const secondHost = document.createElement('div');
    const root = document.createElement('section');
    root.innerHTML = '<div k-data="{ count: 0 }"><button @click="count++"></button><span k-text="count"></span></div>';
    firstHost.appendChild(root);
    document.body.append(firstHost, secondHost);

    const view = walkAuto(root);
    secondHost.appendChild(root);
    await nextMutationTick();
    root.querySelector('button').click();
    flushJobs();

    expect(root.querySelector('span').textContent).toBe('1');
    view.destroy();
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

  test('stores prototype-like k-ref names as ordinary references', () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <div k-data="{}">
        <button k-ref="__proto__"></button>
        <input k-ref="constructor" />
      </div>
    `;
    document.body.appendChild(container);

    const view = walk(container);
    expect(view.refs.__proto__).toBe(container.querySelector('button'));
    expect(view.refs.constructor).toBe(container.querySelector('input'));
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
      /ctx\.update\(\) expects a safe top-level scope property name/,
    );
  });

  test('ctx.update and ctx.patch reject prototype-chain keys', () => {
    defineScope('prototypeKeyHelperPage', () => ({
      user: { name: 'Alice' },
      mounted({ update }) {
        update('__proto__', value => value);
      },
    }));

    const updateContainer = document.createElement('div');
    updateContainer.innerHTML = '<section k-data="prototypeKeyHelperPage"></section>';
    document.body.appendChild(updateContainer);

    expect(() => walk(updateContainer)).toThrow(
      /ctx\.update\(\) expects a safe top-level scope property name/,
    );

    defineScope('constructorKeyHelperPage', () => ({
      user: { name: 'Alice' },
      mounted({ patch }) {
        patch('constructor', { value: 1 });
      },
    }));

    const patchContainer = document.createElement('div');
    patchContainer.innerHTML = '<section k-data="constructorKeyHelperPage"></section>';
    document.body.appendChild(patchContainer);

    expect(() => walk(patchContainer)).toThrow(
      /ctx\.patch\(\) expects a safe top-level scope property name/,
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

  test('warns for unknown directives, unsupported arguments, and unsupported modifiers', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const container = document.createElement('div');
    container.innerHTML = `
      <div k-data="{ visible: true }">
        <span k-tetx="visible"></span>
        <span k-text:name="visible"></span>
        <span k-show.lazy="visible"></span>
        <button @click.300="visible = false"></button>
      </div>
    `;
    document.body.appendChild(container);

    const view = walk(container);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('[kupola W017]'));
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('k-tetx'));
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('[kupola W018]'));
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('argument "name"'));
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('[kupola W019]'));
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('.lazy'));
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('numeric modifier without .debounce'));
    view.destroy();
  });

  test('blocks executable dynamic attributes in named and object bindings', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const container = document.createElement('div');
    container.innerHTML = `
      <div k-data="{ url: 'java script:alert(1)', attrs: { onclick: 'alert(1)', title: 'safe' } }">
        <a :href="url">Link</a>
        <button k-bind="attrs">Run</button>
      </div>
    `;
    document.body.appendChild(container);

    const view = walk(container);
    const link = container.querySelector('a');
    const button = container.querySelector('button');

    expect(link.hasAttribute('href')).toBe(false);
    expect(button.hasAttribute('onclick')).toBe(false);
    expect(button.getAttribute('title')).toBe('safe');
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('[kupola W020]'));
    view.destroy();
  });

  test('blocks sensitive element attributes and reports structural directive mistakes', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const container = document.createElement('div');
    container.innerHTML = `
      <div k-data="{ html: '<p>unsafe</p>', href: 'https://example.com' }">
        <iframe :srcdoc="html"></iframe>
        <base :href="href" />
        <meta :http-equiv="'refresh'" />
        <object :data="'javascript:alert(1)'"></object>
        <p k-key="id">Outside key</p>
        <p k-if="true" k-else>Invalid branch</p>
      </div>
    `;
    document.body.appendChild(container);

    const view = walk(container);
    expect(container.querySelector('iframe').hasAttribute('srcdoc')).toBe(false);
    expect(container.querySelector('base').hasAttribute('href')).toBe(false);
    expect(container.querySelector('meta').hasAttribute('http-equiv')).toBe(false);
    expect(container.querySelector('object').hasAttribute('data')).toBe(false);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('[kupola W020]'));
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('[kupola W021]'));
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('k-key outside k-for'));
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('combines structural branches'));
    view.destroy();
  });

  test('diagnoses conflicting structural branches, empty key aliases, and repeated else chains', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const container = document.createElement('div');
    container.innerHTML = `
      <div k-data="{ items: [1] }">
        <p k-if="true" k-else>Invalid branch</p>
        <p k-for="item in items" k-else>Invalid list branch</p>
        <p k-for="item in items" :key="" k-text="item"></p>
        <p k-for="item in items" k-bind:key="" k-text="item"></p>
        <p k-if="false">First</p>
        <p k-else>Second</p>
        <p k-else>Repeated</p>
      </div>
    `;
    document.body.appendChild(container);

    const view = walk(container);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('combines structural branches'));
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('combines k-for with k-else'));
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('empty :key expression'));
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('empty k-bind:key expression'));
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('without an adjacent k-if branch'));
    view.destroy();
  });

  test('applies element-aware URL policy to dynamic attributes', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const container = document.createElement('div');
    container.innerHTML = `
      <div k-data="{
        safeHref: 'https://example.com/page',
        mailHref: 'mailto:ops@example.com',
        encodedScript: 'jav%61script:alert(1)',
        bidiScript: 'java' + String.fromCharCode(0x202e) + 'script:alert(1)',
        controlScript: 'java' + String.fromCharCode(0) + 'script:alert(1)',
        unicodeHost: 'https://ex' + String.fromCharCode(0x0430) + 'mple.com',
        protocolRelative: '//cdn.example.com/app.css',
        pngData: 'data:image/png;base64,iVBORw0KGgo=',
        svgData: 'data:image/svg+xml,<svg></svg>'
      }">
        <a class="safe" :href="safeHref">Safe</a>
        <a class="mail" :href="mailHref">Mail</a>
        <form :action="encodedScript"></form>
        <a class="bidi" :href="bidiScript">Bidi</a>
        <a class="control" :href="controlScript">Control</a>
        <a class="unicode" :href="unicodeHost">Unicode</a>
        <link rel="stylesheet" :href="protocolRelative" />
        <iframe :src="'/frame.html'"></iframe>
        <object :data="'https://example.com/file.pdf'"></object>
        <embed :src="'https://example.com/file.pdf'" />
        <script :src="'https://example.com/app.js'"></script>
        <img class="png" :src="pngData" />
        <img class="svg" :src="svgData" />
      </div>
    `;
    document.body.appendChild(container);

    const view = walk(container);
    expect(container.querySelector('.safe').getAttribute('href')).toBe('https://example.com/page');
    expect(container.querySelector('.mail').getAttribute('href')).toBe('mailto:ops@example.com');
    expect(container.querySelector('form').hasAttribute('action')).toBe(false);
    expect(container.querySelector('.bidi').hasAttribute('href')).toBe(false);
    expect(container.querySelector('.control').hasAttribute('href')).toBe(false);
    expect(container.querySelector('.unicode').hasAttribute('href')).toBe(false);
    expect(container.querySelector('link').hasAttribute('href')).toBe(false);
    expect(container.querySelector('iframe').hasAttribute('src')).toBe(false);
    expect(container.querySelector('object').hasAttribute('data')).toBe(false);
    expect(container.querySelector('embed').hasAttribute('src')).toBe(false);
    expect(container.querySelector('script').hasAttribute('src')).toBe(false);
    expect(container.querySelector('.png').getAttribute('src')).toBe('data:image/png;base64,iVBORw0KGgo=');
    expect(container.querySelector('.svg').hasAttribute('src')).toBe(false);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('[kupola W020]'));
    view.destroy();
  });

  test('blocks prototype-chain names from object k-bind values', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const container = document.createElement('div');
    container.innerHTML = `
      <div k-data="{ attrs: Object.assign(Object.create(null), { constructor: 'unsafe', title: 'safe' }) }">
        <button k-bind="attrs">Run</button>
      </div>
    `;
    document.body.appendChild(container);

    const view = walk(container);
    const button = container.querySelector('button');
    expect(button.hasAttribute('constructor')).toBe(false);
    expect(button.getAttribute('title')).toBe('safe');
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('[kupola W020]'));
    view.destroy();
  });

  test('warns about k-for key conflicts and applies the documented precedence', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const container = document.createElement('div');
    container.innerHTML = `
      <div k-data="{ items: [{ id: 'a', alternate: 'x' }] }">
        <p k-for="item in items" k-key="item.id" :key="item.alternate" k-text="item.id"></p>
      </div>
    `;
    document.body.appendChild(container);

    const view = walk(container);
    expect(container.querySelector('p').textContent).toBe('a');
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('conflicting k-for keys'));
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('precedence is k-key, then :key, then k-bind:key'));
    view.destroy();
  });

  test('cleans initialized listeners when walk fails partway through setup', () => {
    const handler = jest.fn();
    const container = document.createElement('div');
    container.innerHTML = `
      <div k-data="{ handler: null }">
        <button class="action" @click="handler()">Action</button>
        <p k-init="throw new Error('mount failed')"></p>
      </div>
    `;
    document.body.appendChild(container);
    const root = container.querySelector('[k-data]');

    root.__kupolaHandler = handler;
    root.setAttribute('k-data', '{ handler: () => document.querySelector("[k-data]").__kupolaHandler() }');

    expect(() => walk(container)).toThrow(/mount failed/);
    container.querySelector('.action').click();
    expect(handler).not.toHaveBeenCalled();
    expect(hasWalk(container)).toBe(false);
  });

  test('repeated k-if and k-for updates clean row listeners and watches', () => {
    defineScope('lifecycleStressPage', ({ on, watch }) => ({
      visible: true,
      items: [ 1, 2, 3 ],
      clicks: 0,
      watchRuns: 0,
      mounted() {
        watch(() => this.items, () => { this.watchRuns++; });
        on('click', '.row', () => { this.clicks++; });
      },
    }));
    const container = document.createElement('div');
    container.innerHTML = `
      <section k-data="lifecycleStressPage">
        <button class="toggle" @click="visible = !visible"></button>
        <button class="reorder" @click="items = [...items].reverse()"></button>
        <div k-if="visible"><button class="row" k-for="item in items" k-key="item" k-text="item"></button></div>
        <span k-text="clicks + ':' + watchRuns"></span>
      </section>
    `;
    document.body.appendChild(container);

    const view = walk(container);
    for (let index = 0; index < 25; index += 1) {
      container.querySelector('.row').click();
      container.querySelector('.reorder').click();
      container.querySelector('.toggle').click();
      container.querySelector('.toggle').click();
      flushJobs();
    }
    const row = container.querySelector('.row');
    const state = container.querySelector('span');
    expect(state.textContent).toBe('25:25');
    view.destroy();
    row.click();
    expect(state.textContent).toBe('25:25');
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

  test('warns for unknown, conflicting, and inapplicable event modifiers', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const container = document.createElement('div');
    container.innerHTML = `
      <div k-data="{ count: 0 }">
        <button @click.pervent="count++"></button>
        <button @click.passive.prevent="count++"></button>
        <button @click.enter="count++"></button>
      </div>
    `;
    document.body.appendChild(container);

    const view = walk(container);

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('[kupola W014]'));
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('.pervent'));
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('[kupola W015]'));
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('.passive and .prevent'));
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('[kupola W016]'));
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('non-keyboard event "click"'));

    view.destroy();
  });

  test('warns for invalid k-model modifiers without changing explicit conversions', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const container = document.createElement('div');
    container.innerHTML = `
      <div k-data="{ value: '', mixed: '' }">
        <input k-model.booleen="value" />
        <input k-model.boolean="value" />
        <select k-model.number.boolean="mixed">
          <option value="no">No</option>
          <option value="false">False</option>
        </select>
        <span k-text="typeof mixed + ':' + mixed"></span>
      </div>
    `;
    document.body.appendChild(container);

    const view = walk(container);
    const select = container.querySelector('select');
    const span = container.querySelector('span');

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('[kupola W014]'));
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('.booleen'));
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('[kupola W015]'));
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('.number and .boolean'));
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('[kupola W016]'));
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('text-like input'));

    select.value = 'no';
    select.dispatchEvent(new Event('change'));
    flushJobs();
    expect(span.textContent).toBe('string:no');

    select.value = 'false';
    select.dispatchEvent(new Event('change'));
    flushJobs();
    expect(span.textContent).toBe('boolean:false');

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
    expect(thrown.message).toMatch(/Use "item in items"/);
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
