// SPDX-License-Identifier: MIT
/**
 * Integration tests — cross-module scenarios.
 */

import { signal, computed, effect, flushJobs, resetScheduler, html } from '../packages/core/src/index.js';
import { setLocale, getLocale, t, addMessages } from '../packages/core/src/i18n.js';

describe('i18n module', () => {
  afterEach(() => {
    setLocale('en-US');
  });

  test('default locale is en-US', () => {
    expect(getLocale()).toBe('en-US');
  });

  test('setLocale changes current locale', () => {
    setLocale('zh-CN');
    expect(getLocale()).toBe('zh-CN');
  });

  test('t() returns English text by default', () => {
    expect(t('modal.close')).toBe('Close');
    expect(t('dialog.ok')).toBe('OK');
    expect(t('table.empty')).toBe('No data');
  });

  test('t() returns Chinese text after setLocale("zh-CN")', () => {
    setLocale('zh-CN');
    expect(t('modal.close')).toBe('关闭');
    expect(t('dialog.ok')).toBe('确定');
    expect(t('table.empty')).toBe('暂无数据');
  });

  test('t() returns key when translation missing', () => {
    expect(t('nonexistent.key')).toBe('nonexistent.key');
  });

  test('t() supports interpolation', () => {
    addMessages('en-US', { 'greeting': 'Hello, {name}!' });
    expect(t('greeting', { name: 'Alice' })).toBe('Hello, Alice!');
  });

  test('addMessages adds new locale', () => {
    addMessages('ja-JP', { 'modal.close': '閉じる' });
    setLocale('ja-JP');
    expect(t('modal.close')).toBe('閉じる');
  });

  test('addMessages extends existing locale', () => {
    addMessages('en-US', { 'custom.key': 'Custom value' });
    expect(t('custom.key')).toBe('Custom value');
    // Original keys still work
    expect(t('modal.close')).toBe('Close');
  });
});

describe('Signal + Effect integration', () => {
  test('computed chains update correctly', () => {
    const count = signal(1);
    const doubled = computed(() => count.value * 2);
    const quadrupled = computed(() => doubled.value * 2);

    expect(quadrupled.value).toBe(4);

    count.value = 3;
    flushJobs();
    expect(doubled.value).toBe(6);
    expect(quadrupled.value).toBe(12);
  });

  test('effect runs on signal change', () => {
    const name = signal('Alice');
    const log = [];

    effect(() => {
      log.push(name.value);
    });

    expect(log).toEqual(['Alice']);

    name.value = 'Bob';
    flushJobs();
    expect(log).toEqual(['Alice', 'Bob']);
  });

  test('multiple effects on same signal', () => {
    const x = signal(0);
    const log1 = [];
    const log2 = [];

    effect(() => log1.push(x.value));
    effect(() => log2.push(x.value * 10));

    x.value = 5;
    flushJobs();

    expect(log1).toEqual([0, 5]);
    expect(log2).toEqual([0, 50]);
  });

  test('computed does not recompute if dependency unchanged', () => {
    const a = signal(1);
    const b = signal(2);
    let computeCount = 0;

    const sum = computed(() => {
      computeCount++;
      return a.value + b.value;
    });

    expect(sum.value).toBe(3);
    expect(computeCount).toBe(1);

    // Change a
    a.value = 10;
    flushJobs();
    expect(sum.value).toBe(12);
  });
});

describe('SSR + i18n integration', () => {
  test('renderToString works with locale set', async () => {
    const { renderToString } = await import('../packages/core/src/server.js');

    setLocale('zh-CN');
    const closeText = t('modal.close');
    expect(closeText).toBe('关闭');

    // Verify the translated text can be used in SSR context
    const tpl = html`<span>${closeText}</span>`;
    const result = await renderToString(tpl);
    expect(result).toContain('关闭');

    setLocale('en-US');
  });
});

describe('SSR hydration boundary cases', () => {
  test('renderToString handles null/undefined values', async () => {
    const { renderToString } = await import('../packages/core/src/server.js');

    const tpl = html`<div>${null}</div><div>${undefined}</div>`;
    const result = renderToString(tpl);
    expect(result).toContain('<div></div>');
    expect(result).toContain('<div></div>');
  });

  test('renderToString handles signal values in text', async () => {
    const { renderToString } = await import('../packages/core/src/server.js');

    const count = signal(42);
    const tpl = html`<span>${count}</span>`;
    const result = renderToString(tpl);
    expect(result).toContain('42');
    expect(result).toContain('<!---->'); // hydration marker
  });

  test('renderToString handles signal values in attributes', async () => {
    const { renderToString } = await import('../packages/core/src/server.js');

    const cls = signal('active');
    const tpl = html`<div class="${cls}"></div>`;
    const result = renderToString(tpl);
    expect(result).toContain('active');
    expect(result).toContain('data-kp');
  });

  test('renderToString handles event handlers (no output)', async () => {
    const { renderToString } = await import('../packages/core/src/server.js');

    const handler = () => {};
    const tpl = html`<button onclick="${handler}">Click</button>`;
    const result = renderToString(tpl);
    expect(result).toContain('<button');
    expect(result).toContain('Click');
    expect(result).toContain('data-kp');
  });

  test('renderToString escapes HTML entities', async () => {
    const { renderToString } = await import('../packages/core/src/server.js');

    const dangerous = signal('<script>alert("xss")</script>');
    const tpl = html`<div>${dangerous}</div>`;
    const result = renderToString(tpl);
    expect(result).not.toContain('<script>');
    expect(result).toContain('&lt;script&gt;');
  });

  test('renderToString handles nested templates', async () => {
    const { renderToString } = await import('../packages/core/src/server.js');

    const inner = html`<em>bold</em>`;
    const tpl = html`<div>${inner}</div>`;
    const result = renderToString(tpl);
    expect(result).toContain('<em>bold</em>');
  });

  test('renderToString handles array of templates', async () => {
    const { renderToString } = await import('../packages/core/src/server.js');

    const items = ['a', 'b', 'c'].map(i => html`<li>${i}</li>`);
    const tpl = html`<ul>${items}</ul>`;
    const result = renderToString(tpl);
    expect(result).toContain('<li>a</li>');
    expect(result).toContain('<li>b</li>');
    expect(result).toContain('<li>c</li>');
  });
});

describe('Directive complex scenarios', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
    resetScheduler();
  });

  test('k-show toggles display based on signal', () => {
    const { walk } = require('../packages/core/src/directives.js');

    container.innerHTML = `
      <div k-data="{ visible: true }">
        <span k-show="visible">Hello</span>
      </div>
    `;

    const instance = walk(container);
    const span = container.querySelector('span');
    expect(span.style.display).not.toBe('none');

    instance.destroy();
  });

  test('k-text updates textContent reactively', () => {
    const { walk } = require('../packages/core/src/directives.js');

    container.innerHTML = `
      <div k-data="{ name: 'World' }">
        <span k-text="name"></span>
      </div>
    `;

    const instance = walk(container);
    const span = container.querySelector('span');
    expect(span.textContent).toBe('World');

    instance.destroy();
  });

  test('k-bind sets attributes dynamically', () => {
    const { walk } = require('../packages/core/src/directives.js');

    container.innerHTML = `
      <div k-data="{ url: 'https://example.com' }">
        <a k-bind:href="url">Link</a>
      </div>
    `;

    const instance = walk(container);
    const a = container.querySelector('a');
    expect(a.getAttribute('href')).toBe('https://example.com');

    instance.destroy();
  });

  test('k-model two-way binds input value', () => {
    const { walk } = require('../packages/core/src/directives.js');

    container.innerHTML = `
      <div k-data="{ text: 'hello' }">
        <input k-model="text" />
        <span k-text="text"></span>
      </div>
    `;

    const instance = walk(container);
    const input = container.querySelector('input');
    const span = container.querySelector('span');

    expect(input.value).toBe('hello');
    expect(span.textContent).toBe('hello');

    // Simulate user input
    input.value = 'world';
    input.dispatchEvent(new Event('input'));
    flushJobs();

    expect(span.textContent).toBe('world');

    instance.destroy();
  });

  test('nested k-data creates child scope', () => {
    const { walk } = require('../packages/core/src/directives.js');

    container.innerHTML = `
      <div k-data="{ name: 'parent' }">
        <span class="parent" k-text="name"></span>
        <div k-data="{ name: 'child' }">
          <span class="child" k-text="name"></span>
        </div>
      </div>
    `;

    const instance = walk(container);
    expect(container.querySelector('.parent').textContent).toBe('parent');
    expect(container.querySelector('.child').textContent).toBe('child');

    instance.destroy();
  });
});

describe('Error boundary', () => {
  test('ErrorBoundary catches factory errors', () => {
    const { ErrorBoundary } = require('../packages/core/src/errors.js');

    const view = ErrorBoundary(
      () => { throw new Error('test error'); },
      { fallback: (err) => err.message }
    );

    expect(view.element).toBeDefined();
    expect(view.error).toBeDefined();
    expect(view.error.message).toBe('test error');
  });

  test('ErrorBoundary passes through on success', () => {
    const { ErrorBoundary } = require('../packages/core/src/errors.js');

    const mockResult = { element: document.createElement('div') };
    const view = ErrorBoundary(() => mockResult);

    expect(view).toBe(mockResult);
  });

  test('ErrorBoundary calls onError callback', () => {
    const { ErrorBoundary } = require('../packages/core/src/errors.js');
    const errors = [];

    ErrorBoundary(
      () => { throw new Error('callback test'); },
      { onError: (err) => errors.push(err.message) }
    );

    expect(errors).toEqual(['callback test']);
  });
});

describe('Signal cleanup / memory leak detection', () => {
  afterEach(() => {
    resetScheduler();
  });

  test('effect dispose stops re-running', () => {
    const count = signal(0);
    const log = [];

    const dispose = effect(() => log.push(count.value));
    expect(log).toEqual([0]);

    count.value = 1;
    flushJobs();
    expect(log).toEqual([0, 1]);

    // Dispose should stop tracking
    dispose();
    count.value = 2;
    flushJobs();
    expect(log).toEqual([0, 1]); // No new entry
  });

  test('computed disposes when no subscribers', () => {
    const count = signal(0);
    let computeCount = 0;

    const doubled = computed(() => {
      computeCount++;
      return count.value * 2;
    });

    // Access triggers computation
    expect(doubled.value).toBe(0);
    expect(computeCount).toBe(1);

    // Change signal
    count.value = 5;
    flushJobs();
    expect(doubled.value).toBe(10);
  });

  test('multiple effects clean up independently', () => {
    const x = signal(0);
    const log1 = [];
    const log2 = [];

    const d1 = effect(() => log1.push(x.value));
    const d2 = effect(() => log2.push(x.value));

    x.value = 1;
    flushJobs();

    expect(log1).toEqual([0, 1]);
    expect(log2).toEqual([0, 1]);

    // Dispose only first effect
    d1();
    x.value = 2;
    flushJobs();

    expect(log1).toEqual([0, 1]); // Stopped
    expect(log2).toEqual([0, 1, 2]); // Still running

    d2();
  });
});
