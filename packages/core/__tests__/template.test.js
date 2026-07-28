// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Unit tests for template engine + DOM renderer.
 * @jest-environment jsdom
 */

import {
  createScheduler,
  signal,
  computed,
  effect,
  batch,
  setErrorHandler,
} from '../src/index.js';
import { html, htmlString } from '../../platform/src/template.js';
import { createApp, mount, render, setIconResolver } from '../../platform/src/render.js';
import { defineComponent, inject, provide } from '../../platform/src/component.js';
import { clearLegacyProvideRegistry } from '../../platform/src/context.js';
import { flushJobs, resetScheduler } from '../src/scheduler.js';

afterEach(() => {
  document.body.innerHTML = '';
  setIconResolver(null);
  clearLegacyProvideRegistry();
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
    expect(tpl.values).toEqual([ 1, 2 ]);
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
  test('render can use an isolated scheduler', () => {
    const container = document.createElement('div');
    const scheduler = createScheduler({ name: 'render' });
    const count = signal(0);
    const instance = render(html`<span>${count}</span>`, container, { scheduler });

    count.value = 1;
    flushJobs();
    expect(container.textContent).toBe('0');
    scheduler.flushJobs();
    expect(container.textContent).toBe('1');

    instance.destroy();
  });

  test('createApp inherits its scheduler in plugin lifecycle hooks', () => {
    const container = document.createElement('div');
    const scheduler = createScheduler({ name: 'app-plugin' });
    const source = signal(0);
    const installRuns = [];
    const initRuns = [];
    let stopInstall;
    let stopInit;
    const plugin = {
      install() {
        stopInstall = effect(() => installRuns.push(source.value));
      },
      init() {
        stopInit = effect(() => initRuns.push(source.value));
      },
      destroy() {
        stopInstall();
        stopInit();
      },
    };
    const app = createApp(html`<span>${source}</span>`, { scheduler }).use(plugin);

    app.mount(container);
    source.value = 1;

    flushJobs();
    expect(installRuns).toEqual([ 0 ]);
    expect(initRuns).toEqual([ 0 ]);
    expect(container.textContent).toBe('0');

    scheduler.flushJobs();
    expect(installRuns).toEqual([ 0, 1 ]);
    expect(initRuns).toEqual([ 0, 1 ]);
    expect(container.textContent).toBe('1');

    app.destroy();
    source.value = 2;
    scheduler.flushJobs();
    expect(installRuns).toEqual([ 0, 1 ]);
    expect(initRuns).toEqual([ 0, 1 ]);
  });

  test('createApp rejects duplicate mounts and makes destroy idempotent', () => {
    const firstContainer = document.createElement('div');
    const secondContainer = document.createElement('div');
    const source = signal(0);
    const pluginDestroy = jest.fn();
    const app = createApp(html`<span>${source}</span>`)
      .use({ install() {}, destroy: pluginDestroy });

    app.mount(firstContainer);
    expect(() => app.mount(secondContainer)).toThrow('more than once');

    app.destroy();
    app.destroy();

    expect(pluginDestroy).toHaveBeenCalledTimes(1);
    expect(source._subscribers.size).toBe(0);
  });

  test('createApp.mount rejects async plugin hooks and rolls back', async () => {
    const container = document.createElement('div');
    let resolveInstall;
    const installCleanup = jest.fn();
    const installApp = createApp(html`<span>ready</span>`).use({
      install() {
        return new Promise(resolve => {resolveInstall = resolve;});
      },
      destroy: installCleanup,
    });

    expect(() => installApp.mount(container)).toThrow('mountAsync');
    expect(installCleanup).toHaveBeenCalledTimes(1);
    resolveInstall();
    await Promise.resolve();
    expect(container.childNodes).toHaveLength(0);

    const initCleanup = jest.fn();
    const initApp = createApp(html`<span>ready</span>`).use({
      install() {},
      init() {return Promise.resolve();},
      destroy: initCleanup,
    });

    expect(() => initApp.mount(container)).toThrow('mountAsync');
    expect(initCleanup).toHaveBeenCalledTimes(1);
    expect(container.childNodes).toHaveLength(0);
  });

  test('createApp.mountAsync awaits plugin lifecycle hooks', async () => {
    const container = document.createElement('div');
    const lifecycle = [];
    const plugin = {
      async install() {
        await Promise.resolve();
        lifecycle.push('install');
      },
      async init() {
        await Promise.resolve();
        lifecycle.push('init');
      },
      destroy() {
        lifecycle.push('destroy');
      },
    };
    const app = createApp(html`<span>ready</span>`).use(plugin);

    const instance = await app.mountAsync(container);
    expect(container.textContent).toBe('ready');
    expect(lifecycle).toEqual([ 'install', 'init' ]);

    app.destroy();
    expect(lifecycle).toEqual([ 'install', 'init', 'destroy' ]);
    expect(instance).toBeDefined();
  });

  test('createApp mounts a component factory as the application root', async () => {
    const container = document.createElement('div');
    const AppShell = defineComponent({
      setup() {
        return html`<main class="app-shell">Ready</main>`;
      },
    });

    const app = createApp(AppShell);
    await app.mountAsync(container);

    expect(container.querySelector('.app-shell').textContent).toBe('Ready');
    app.destroy();
  });

  test('createApp.mountAsync rolls back when async init fails', async () => {
    const container = document.createElement('div');
    const source = signal(0);
    const failure = new Error('async plugin init failed');
    const pluginDestroy = jest.fn();
    const plugin = {
      install() {},
      async init() {
        await Promise.resolve();
        throw failure;
      },
      async destroy() {
        await Promise.resolve();
        pluginDestroy();
      },
    };
    const app = createApp(html`<span>${source}</span>`).use(plugin);

    await expect(app.mountAsync(container)).rejects.toThrow(failure);
    expect(pluginDestroy).toHaveBeenCalledTimes(1);
    expect(source._subscribers.size).toBe(0);
    expect(container.childNodes).toHaveLength(0);
  });

  test('createApp.destroyAsync awaits async plugin cleanup', async () => {
    const container = document.createElement('div');
    const cleanup = [];
    const app = createApp(html`<span>ready</span>`).use({
      install() {},
      init() {},
      async destroy() {
        await Promise.resolve();
        cleanup.push('destroyed');
      },
    });

    await app.mountAsync(container);
    const pendingDestroy = app.destroyAsync();
    expect(cleanup).toEqual([]);
    await pendingDestroy;
    expect(cleanup).toEqual([ 'destroyed' ]);
  });

  test('createApp serializes asynchronous lifecycle transitions', async () => {
    const firstContainer = document.createElement('div');
    const secondContainer = document.createElement('div');
    let resolveInstall;
    let resolveDestroy;
    let firstInstall = true;
    let firstDestroy = true;
    const app = createApp(html`<span>ready</span>`).use({
      install() {
        if (!firstInstall) {return;}
        firstInstall = false;
        return new Promise(resolve => {resolveInstall = resolve;});
      },
      destroy() {
        if (!firstDestroy) {return;}
        firstDestroy = false;
        return new Promise(resolve => {resolveDestroy = resolve;});
      },
    });

    const pendingMount = app.mountAsync(firstContainer);
    expect(() => app.use({ install() {} })).toThrow('lifecycle transition');
    resolveInstall();
    await pendingMount;

    const pendingDestroy = app.destroyAsync();
    expect(app.destroyAsync()).toBe(pendingDestroy);
    expect(() => app.mount(secondContainer)).toThrow('cleanup');
    await expect(app.mountAsync(secondContainer)).rejects.toThrow('cleanup');
    expect(() => app.use({ install() {} })).toThrow('lifecycle transition');

    resolveDestroy();
    await pendingDestroy;
    app.mount(secondContainer);
    app.destroy();
  });

  test('createApp isolates provide values and preserves context in effects and events', () => {
    const firstContainer = document.createElement('div');
    const secondContainer = document.createElement('div');
    const setupValues = [];
    const eventValues = [];
    const Consumer = defineComponent({
      setup() {
        setupValues.push(inject('token', 'missing'));
        return html`
          <button onclick="${() => eventValues.push(inject('token', 'missing'))}">
            ${() => inject('token', 'missing')}
          </button>
        `;
      },
    });

    const createConsumerApp = (container, token) => {
      let view;
      const app = createApp(html`<div></div>`)
        .provide('token', token)
        .use({
          install() { view = Consumer(); },
          init() { container.appendChild(view.element); },
          destroy() { view.destroy(); },
        });
      app.mount(container);
      return app;
    };

    const firstApp = createConsumerApp(firstContainer, 'first');
    const secondApp = createConsumerApp(secondContainer, 'second');

    expect(setupValues).toEqual([ 'first', 'second' ]);
    expect(firstContainer.querySelector('button').textContent.trim()).toBe('first');
    expect(secondContainer.querySelector('button').textContent.trim()).toBe('second');

    firstContainer.querySelector('button').click();
    secondContainer.querySelector('button').click();
    expect(eventValues).toEqual([ 'first', 'second' ]);

    firstApp.destroy();
    firstApp.mount(firstContainer);
    expect(setupValues).toEqual([ 'first', 'second', 'missing' ]);
    firstApp.destroy();
    secondApp.destroy();
  });

  test('legacy provide and inject remain available outside an app context', () => {
    provide('legacy', 'value');
    expect(inject('legacy')).toBe('value');
    expect(inject('missing', 'fallback')).toBe('fallback');
  });

  test('createApp rolls back plugins when mounting fails', () => {
    const source = signal(0);
    const pluginDestroy = jest.fn();
    let stop;
    const plugin = {
      install() {
        stop = effect(() => source.value);
      },
      destroy() {
        pluginDestroy();
        stop();
      },
    };
    const app = createApp(html`<span>${source}</span>`).use(plugin);

    expect(() => app.mount('#missing-container')).toThrow('container not found');
    app.destroy();

    expect(pluginDestroy).toHaveBeenCalledTimes(1);
    expect(source._subscribers.size).toBe(0);
  });

  test('createApp rolls back the view and plugins when init fails', () => {
    const container = document.createElement('div');
    const source = signal(0);
    const failure = new Error('plugin init failed');
    const pluginDestroy = jest.fn();
    let stop;
    const plugin = {
      install() {
        stop = effect(() => source.value);
      },
      init() {
        throw failure;
      },
      destroy() {
        pluginDestroy();
        stop();
      },
    };
    const app = createApp(html`<span>${source}</span>`).use(plugin);

    expect(() => app.mount(container)).toThrow(failure);
    app.destroy();

    expect(pluginDestroy).toHaveBeenCalledTimes(1);
    expect(source._subscribers.size).toBe(0);
    expect(container.childNodes).toHaveLength(0);
  });

  test('mount removes only nodes it created and keeps existing DOM', () => {
    const container = document.createElement('div');
    const existing = document.createElement('p');
    existing.textContent = 'existing';
    container.append(existing);
    const source = signal('before');
    const clicked = jest.fn();
    const view = mount(
      html`<section><button onclick="${clicked}">${source}</button></section>`,
      container,
    );
    const button = container.querySelector('button');

    source.value = 'after';
    flushJobs();
    view.destroy();
    source.value = 'stale';
    flushJobs();
    button.click();

    expect(container.contains(existing)).toBe(true);
    expect(container.querySelector('section')).toBeNull();
    expect(source._subscribers.size).toBe(0);
    expect(clicked).not.toHaveBeenCalled();
  });

  test('mount forwards app-local directive options and cleans them up', () => {
    const container = document.createElement('div');
    const directiveDestroy = jest.fn();
    const directiveMount = jest.fn(() => ({ destroy: directiveDestroy }));
    const sanitizer = jest.fn(() => '<strong>safe</strong>');
    const view = mount(
      html`
        <section k-data="{ markup: '<em>unsafe</em>' }">
          <div k-app-local="ready" k-html="markup"></div>
        </section>
      `,
      container,
      {
        sanitizer,
        customDirectives: {
          'k-app-local': { mount: directiveMount },
        },
      },
    );

    const target = container.querySelector('[k-app-local]');
    expect(directiveMount).toHaveBeenCalledWith(target, {
      value: 'ready',
      arg: null,
      modifiers: [],
    });
    expect(sanitizer).toHaveBeenCalledWith('<em>unsafe</em>', target);
    expect(target.innerHTML).toBe('<strong>safe</strong>');

    view.destroy();
    expect(directiveDestroy).toHaveBeenCalledTimes(1);
  });

  test('createApp forwards app-local directive options without global registration', () => {
    const container = document.createElement('div');
    const directiveMount = jest.fn();
    const app = createApp(html`<div k-create-app-local></div>`, {
      customDirectives: {
        'k-create-app-local': { mount: directiveMount },
      },
    });

    app.mount(container);
    expect(directiveMount).toHaveBeenCalledTimes(1);
    app.destroy();
  });

  test('mount removes dynamic template fragments with their owner', () => {
    const container = document.createElement('div');
    const mode = signal('one');
    const view = mount(html`<main>${() => (
      mode.value === 'one' ? html`<span class="one">${mode}</span>` : html`<strong class="two">two</strong>`
    )}</main>`, container);

    mode.value = 'two';
    flushJobs();
    view.destroy();

    expect(container.firstElementChild).toBeNull();
    expect(mode._subscribers.size).toBe(0);
  });

  test('cleans already mounted parts when a later part throws', () => {
    const container = document.createElement('div');
    const source = signal(0);
    const failure = new Error('part mount failed');

    expect(() => mount(html`<span>${source}</span><strong>${() => {
      throw failure;
    }}</strong>`, container)).toThrow(failure);

    expect(container.childNodes).toHaveLength(0);
    expect(source._subscribers.size).toBe(0);
  });

  test('ignores stale icon requests after a newer name wins', async () => {
    const container = document.createElement('div');
    const name = signal('first');
    const requests = new Map();
    setIconResolver(iconName => new Promise(resolve => {
      requests.set(iconName, resolve);
    }));
    const view = render(html`<icon name="${name}"></icon>`, container);

    name.value = 'second';
    flushJobs();
    requests.get('first')('<svg data-icon="first"></svg>');
    await Promise.resolve();
    expect(container.querySelector('[data-icon="first"]')).toBeNull();

    requests.get('second')('<svg data-icon="second"></svg>');
    await Promise.resolve();
    expect(container.querySelector('[data-icon="second"]')).not.toBeNull();
    view.destroy();
  });

  test('invalidates icon requests when the name is cleared', async () => {
    const container = document.createElement('div');
    const name = signal('first');
    let resolveRequest;
    setIconResolver(() => new Promise(resolve => {resolveRequest = resolve;}));
    const view = render(html`<icon name="${name}"></icon>`, container);

    name.value = null;
    flushJobs();
    resolveRequest('<svg data-icon="stale"></svg>');
    await Promise.resolve();

    expect(container.innerHTML).not.toContain('stale');
    view.destroy();
  });

  test('reports icon resolver failures without an unhandled rejection', async () => {
    const container = document.createElement('div');
    const failure = new Error('icon failed');
    const errors = [];
    const restore = setErrorHandler((error, context) => errors.push({ error, context }));
    setIconResolver(() => Promise.reject(failure));

    const view = render(html`<icon name="broken"></icon>`, container);
    await Promise.resolve();
    await Promise.resolve();
    view.destroy();
    restore();

    expect(errors).toEqual([ {
      error: failure,
      context: { source: 'platform', phase: 'icon' },
    } ]);
  });

  test('reports icon value access failures without an unhandled rejection', async () => {
    const container = document.createElement('div');
    const failure = new Error('icon value failed');
    const errors = [];
    const restore = setErrorHandler((error, context) => errors.push({ error, context }));
    const name = { get value() { throw failure; } };

    const view = render(html`<icon name="${name}"></icon>`, container);
    await Promise.resolve();
    await Promise.resolve();
    view.destroy();
    restore();

    expect(errors).toEqual([ {
      error: failure,
      context: { source: 'platform', phase: 'icon' },
    } ]);
  });

  test('does not apply an icon result after destroy', async () => {
    const container = document.createElement('div');
    let resolveRequest;
    setIconResolver(() => new Promise(resolve => {resolveRequest = resolve;}));
    const view = render(html`<icon name="late"></icon>`, container);
    const icon = container.querySelector('icon');

    view.destroy();
    resolveRequest('<svg data-icon="late"></svg>');
    await Promise.resolve();

    expect(icon.querySelector('[data-icon="late"]')).toBeNull();
  });

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

  test('updates dynamic HtmlString values without stale DOM or crashes', () => {
    const container = document.createElement('div');
    const content = signal(htmlString('<strong>raw</strong>'));
    const tpl = html`<p>${content}</p>`;
    const view = render(tpl, container);

    expect(container.querySelector('strong').textContent).toBe('raw');

    content.value = 'plain';
    flushJobs();
    expect(container.querySelector('strong')).toBeNull();
    expect(container.querySelector('p').textContent).toBe('plain');

    content.value = htmlString('<em>next</em>');
    flushJobs();
    expect(container.querySelector('em').textContent).toBe('next');

    view.destroy();
    expect(container.querySelector('em')).toBeNull();
  });

  test('function text parts can swap between templates and text cleanly', () => {
    const container = document.createElement('div');
    const mode = signal('template');
    const tpl = html`<section>${() => (
      mode.value === 'template' ? html`<span>${mode}</span>` : 'plain'
    )}</section>`;
    const view = render(tpl, container);

    expect(container.querySelector('span').textContent).toBe('template');

    mode.value = 'plain';
    flushJobs();
    expect(container.querySelector('span')).toBeNull();
    expect(container.querySelector('section').textContent).toBe('plain');

    view.destroy();
  });

  test('renders directly nested templates as owned reactive instances', () => {
    const container = document.createElement('div');
    const source = signal('before');
    const inner = html`<span>${source}</span>`;
    const view = render(html`<section>${inner}</section>`, container);

    expect(container.querySelector('span').textContent).toBe('before');
    source.value = 'after';
    flushJobs();
    expect(container.querySelector('span').textContent).toBe('after');

    view.destroy();
    expect(source._subscribers.size).toBe(0);
  });

  test('destroys a nested instance when its anchor was removed externally', () => {
    const container = document.createElement('div');
    const mode = signal('nested');
    const source = signal('before');
    const view = render(html`<section>${() => (
      mode.value === 'nested' ? html`<span>${source}</span>` : html`<strong>next</strong>`
    )}</section>`, container);

    expect(source._subscribers.size).toBe(1);
    container.firstElementChild.remove();
    mode.value = 'flat';
    flushJobs();

    expect(source._subscribers.size).toBe(0);
    view.destroy();
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

  test('merges multiple dynamic attribute segments', () => {
    const container = document.createElement('div');
    const prefix = signal('one');
    const suffix = signal('two');
    render(html`<div class="static-${prefix}-${suffix}">content</div>`, container);

    expect(container.firstElementChild.className).toBe('static-one-two');
    prefix.value = 'next';
    suffix.value = 'value';
    flushJobs();
    expect(container.firstElementChild.className).toBe('static-next-value');
  });

  test('synchronizes dynamic DOM properties', () => {
    const container = document.createElement('div');
    const value = signal('initial');
    const checked = signal(false);
    const disabled = signal(false);
    render(html`<input value="${value}" checked="${checked}" disabled="${disabled}">`, container);

    const input = container.querySelector('input');
    expect(input.value).toBe('initial');
    expect(input.checked).toBe(false);
    expect(input.disabled).toBe(false);

    value.value = 'updated';
    checked.value = true;
    disabled.value = true;
    flushJobs();
    expect(input.value).toBe('updated');
    expect(input.checked).toBe(true);
    expect(input.disabled).toBe(true);
  });

  test('escapes apostrophes in attribute values', () => {
    const container = document.createElement('div');
    render(html`<div title="${'a\'b'}"></div>`, container);
    expect(container.firstElementChild.getAttribute('title')).toBe('a\'b');
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

  test('removes placeholder attributes for static false and null values', () => {
    const container = document.createElement('div');
    render(html`
      <button disabled="${false}" hidden="${false}" title="${null}">Ready</button>
    `, container);
    const button = container.querySelector('button');

    expect(button.disabled).toBe(false);
    expect(button.hidden).toBe(false);
    expect(button.hasAttribute('title')).toBe(false);
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

  test('renders TemplateResult-like content from another bundle entry', () => {
    const container = document.createElement('div');
    const inner = { strings: [ '<em>', '</em>' ], values: [ 'foreign' ] };
    const tpl = html`<div>${inner}</div>`;
    render(tpl, container);
    expect(container.querySelector('em')).not.toBeNull();
    expect(container.querySelector('em').textContent).toBe('foreign');
  });

  test('cleans nested parts when a dynamic template part fails during mount', () => {
    const container = document.createElement('div');
    const source = signal('nested value');
    const failure = new Error('nested part mount failed');

    expect(() => render(html`<div>${() => html`
      <span>${source}</span>
      <strong>${() => {throw failure;}}</strong>
    `}</div>`, container)).toThrow(failure);

    expect(container.childNodes).toHaveLength(0);
    expect(source._subscribers.size).toBe(0);
  });
});

// ─── render() — list rendering ──────────────────────────────────────────────

describe('render list', () => {
  test('renders array of templates', () => {
    const container = document.createElement('div');
    const items = [ 'a', 'b', 'c' ];
    const tpl = html`<ul>${items.map(i => html`<li>${i}</li>`)}</ul>`;
    render(tpl, container);
    const lis = container.querySelectorAll('li');
    expect(lis.length).toBe(3);
    expect(lis[0].textContent).toBe('a');
    expect(lis[2].textContent).toBe('c');
  });

  test('renders array of TemplateResult-like values from another bundle entry', () => {
    const container = document.createElement('div');
    const items = [ 'a', 'b', 'c' ].map(i => ({ strings: [ '<li>', '</li>' ], values: [ i ] }));
    const tpl = html`<ul>${items}</ul>`;
    render(tpl, container);
    const lis = container.querySelectorAll('li');
    expect(lis.length).toBe(3);
    expect(lis[0].textContent).toBe('a');
    expect(lis[2].textContent).toBe('c');
    expect(container.textContent).not.toContain('[object Object]');
  });

  test('owns reactive parts in template arrays', () => {
    const container = document.createElement('div');
    const first = signal('a');
    const second = signal('b');
    const view = render(html`<ul>${[
      html`<li>${first}</li>`,
      html`<li>${second}</li>`,
    ]}</ul>`, container);

    first.value = 'updated';
    flushJobs();
    expect(container.querySelectorAll('li')[0].textContent).toBe('updated');

    view.destroy();
    expect(first._subscribers.size).toBe(0);
    expect(second._subscribers.size).toBe(0);
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
