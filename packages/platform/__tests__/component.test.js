// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Unit tests for component API: defineComponent + register.
 * @jest-environment jsdom
 */

import { setErrorHandler, signal } from '../../core/src/index.js';
import { html } from '../src/template.js';
import { flushJobs, resetScheduler } from '../../core/src/scheduler.js';
import { defineComponent, register, getComponent, hasComponent, clearRegistry } from '../src/component.js';
import { render } from '../src/render.js';

afterEach(() => {
  document.body.innerHTML = '';
  resetScheduler();
  clearRegistry();
});

// ─── defineComponent ─────────────────────────────────────────────────────────

describe('defineComponent', () => {
  test('returns a factory function', () => {
    const Comp = defineComponent({
      setup() {
        return () => html`<div>Hello</div>`;
      },
    });

    expect(typeof Comp).toBe('function');
    expect(Comp[Symbol.for('kupola.component.factory')]).toBe(true);
  });

  test('factory returns element, destroy, and update', () => {
    const Comp = defineComponent({
      setup() {
        return () => html`<div>Hello</div>`;
      },
    });

    const view = Comp();
    expect(view.element).toBeDefined();
    expect(typeof view.destroy).toBe('function');
    expect(typeof view.update).toBe('function');
  });

  test('renders a component instance as a template child and destroys it with its parent', async () => {
    const destroyed = jest.fn();
    const Child = defineComponent({
      setup() { return html`<span class="child">Child</span>`; },
      destroyed,
    });
    const parent = render(html`<div>${Child()}</div>`, document.body);

    expect(document.querySelector('.child').textContent).toBe('Child');
    parent.destroy();
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(destroyed).toHaveBeenCalledTimes(1);
    expect(document.querySelector('.child')).toBeNull();
  });

  test('provides lifecycle context and runs registered cleanup', async () => {
    const cleanup = jest.fn();
    const mounted = jest.fn();
    const Comp = defineComponent({
      setup() { return html`<div class="root">Value</div>`; },
      mounted(context) {
        mounted(context.element);
        context.onCleanup(cleanup);
      },
    });
    const view = Comp();
    document.body.appendChild(view.element);
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(mounted).toHaveBeenCalledWith(document.querySelector('.root'));
    view.destroy();
    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  test('runs setup lifecycle onMounted callbacks after insertion', async () => {
    const mounted = jest.fn();
    const cleanup = jest.fn();
    const Comp = defineComponent({
      setup({ lifecycle }) {
        lifecycle.onMounted(context => mounted(context.element));
        lifecycle.onCleanup(cleanup);
        return html`<div class="setup-root">Value</div>`;
      },
    });
    const view = Comp();
    document.body.appendChild(view.element);
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(mounted).toHaveBeenCalledWith(document.querySelector('.setup-root'));
    view.destroy();
    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  test('provides setup capabilities through named context fields', () => {
    const saved = jest.fn();
    let setupContext;
    const Comp = defineComponent({
      props: [ 'name' ],
      setup(context) {
        setupContext = context;
        return html`<button onclick=${() => context.emit('save', context.props.name.value)}>${context.children}</button>`;
      },
    });
    const view = Comp({ name: 'Kupola' }, html`Save`);
    view.on('save', saved);
    document.body.appendChild(view.element);

    document.querySelector('button').click();

    expect(setupContext.props.name.value).toBe('Kupola');
    expect(setupContext.children).toBeDefined();
    expect(setupContext.lifecycle.onCleanup).toEqual(expect.any(Function));
    expect(saved).toHaveBeenCalledWith('Kupola');
    view.destroy();
  });

  test('supports setup functions that return a TemplateResult directly', () => {
    const Comp = defineComponent({
      setup() {
        return html`<div>Direct template</div>`;
      },
    });

    const view = Comp();
    const container = document.createElement('div');
    container.appendChild(view.element);

    expect(container.textContent).toBe('Direct template');
    view.destroy();
  });

  test('renders component with props', () => {
    const Greeting = defineComponent({
      props: [ 'name' ],
      setup({ props }) {
        return () => html`<span>Hello ${props.name}</span>`;
      },
    });

    const view = Greeting({ name: 'World' });
    const container = document.createElement('div');
    container.appendChild(view.element);

    expect(container.querySelector('span').textContent).toBe('Hello World');
    view.destroy();
  });

  test('component internal signal is reactive', () => {
    const Counter = defineComponent({
      setup() {
        const count = signal(0);
        const inc = () => { count.value++; };
        return () => html`
          <span>${count}</span>
          <button onclick="${inc}">+</button>
        `;
      },
    });

    const view = Counter();
    const container = document.createElement('div');
    container.appendChild(view.element);

    expect(container.querySelector('span').textContent).toBe('0');

    container.querySelector('button').click();
    flushJobs();
    expect(container.querySelector('span').textContent).toBe('1');

    container.querySelector('button').click();
    flushJobs();
    expect(container.querySelector('span').textContent).toBe('2');

    view.destroy();
  });

  test('renders children slot content', () => {
    const Wrapper = defineComponent({
      setup({ children }) {
        return () => html`<div class="wrapper">${children}</div>`;
      },
    });

    const childContent = html`<p>Slot content</p>`;
    const view = Wrapper({}, childContent);
    const container = document.createElement('div');
    container.appendChild(view.element);

    expect(container.querySelector('.wrapper p').textContent).toBe('Slot content');
    view.destroy();
  });

  test('update changes props reactively', () => {
    const Label = defineComponent({
      props: [ 'text' ],
      setup({ props }) {
        return () => html`<span>${props.text}</span>`;
      },
    });

    const view = Label({ text: 'initial' });
    const container = document.createElement('div');
    container.appendChild(view.element);

    expect(container.querySelector('span').textContent).toBe('initial');

    view.update({ text: 'updated' });
    flushJobs();
    expect(container.querySelector('span').textContent).toBe('updated');

    view.destroy();
  });

  test('destroy cleans up reactive effects', () => {
    const Label = defineComponent({
      props: [ 'text' ],
      setup({ props }) {
        return () => html`<span>${props.text}</span>`;
      },
    });

    const view = Label({ text: 'hello' });
    const container = document.createElement('div');
    container.appendChild(view.element);

    expect(container.querySelector('span').textContent).toBe('hello');

    view.destroy();

    // After destroy, updating props should not affect DOM
    view.update({ text: 'after-destroy' });
    flushJobs();
    // The span may or may not exist after destroy, but textContent should not be 'after-destroy'
    const span = container.querySelector('span');
    if (span) {
      expect(span.textContent).not.toBe('after-destroy');
    }
  });

  test('destroy is idempotent and calls destroyed only once', () => {
    const destroyed = jest.fn();
    const Comp = defineComponent({
      setup() {
        return () => html`<div>Hello</div>`;
      },
      destroyed,
    });

    const view = Comp();
    view.destroy();
    view.destroy();

    expect(destroyed).toHaveBeenCalledTimes(1);
  });

  test('rolls back the render instance when created throws', () => {
    const source = signal('value');
    const failure = new Error('created failed');
    const Comp = defineComponent({
      setup() {
        return () => html`<span>${source}</span>`;
      },
      created() {
        throw failure;
      },
    });

    expect(() => Comp()).toThrow(failure);
    expect(source._subscribers.size).toBe(0);
  });

  test('runs destroyed when render cleanup throws and preserves the cleanup error', () => {
    const source = signal('value');
    const failure = new Error('cleanup failed');
    const destroyed = jest.fn();
    const Comp = defineComponent({
      setup() {
        return () => html`<span>${source}</span>`;
      },
      destroyed,
    });

    const view = Comp();
    const originalDestroy = view._instance.destroy.bind(view._instance);
    view._instance.destroy = () => {
      originalDestroy();
      throw failure;
    };

    expect(() => view.destroy()).toThrow(failure);
    expect(destroyed).toHaveBeenCalledTimes(1);
    expect(source._subscribers.size).toBe(0);

    view.destroy();
    expect(destroyed).toHaveBeenCalledTimes(1);
  });

  test('cleans up and reports mounted hook failures', async () => {
    const errors = [];
    const restore = setErrorHandler((error, context) => errors.push({ error, context }));
    const source = signal('value');
    const failure = new Error('mounted failed');
    const destroyed = jest.fn();
    const Comp = defineComponent({
      setup() {
        return () => html`<span>${source}</span>`;
      },
      mounted() {
        throw failure;
      },
      destroyed,
    });

    try {
      const view = Comp();
      const container = document.createElement('div');
      document.body.appendChild(container);
      container.appendChild(view.element);
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(errors).toHaveLength(1);
      expect(errors[0].error).toBe(failure);
      expect(errors[0].context.phase).toBe('component-mounted');
      expect(destroyed).toHaveBeenCalledTimes(1);
      expect(source._subscribers.size).toBe(0);
    } finally {
      restore();
    }
  });

  test('automatically destroys a mounted component when all root nodes are removed', async () => {
    const source = signal('value');
    const destroyed = jest.fn();
    const Comp = defineComponent({
      setup() {
        return () => html`<span>${source}</span><span>second root</span>`;
      },
      destroyed,
    });
    const view = Comp();

    document.body.appendChild(view.element);
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(source._subscribers.size).toBe(1);

    const [ firstRoot, secondRoot ] = [ ...document.body.children ];
    firstRoot.remove();
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(destroyed).not.toHaveBeenCalled();
    expect(source._subscribers.size).toBe(1);

    secondRoot.remove();
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(destroyed).toHaveBeenCalledTimes(1);
    expect(source._subscribers.size).toBe(0);
    view.destroy();
    expect(destroyed).toHaveBeenCalledTimes(1);
  });

  test('cleans up when a component is inserted and removed before mount observation runs', async () => {
    const source = signal('value');
    const destroyed = jest.fn();
    const Comp = defineComponent({
      setup() {
        return () => html`<span>${source}</span>`;
      },
      destroyed,
    });
    const view = Comp();

    document.body.appendChild(view.element);
    document.body.firstElementChild.remove();
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(destroyed).toHaveBeenCalledTimes(1);
    expect(source._subscribers.size).toBe(0);
    view.destroy();
  });

  test('does not auto-destroy a component while moving connected root nodes', async () => {
    const destroyed = jest.fn();
    const Comp = defineComponent({
      setup() {
        return () => html`<span>value</span>`;
      },
      destroyed,
    });
    const view = Comp();
    const target = document.createElement('div');
    document.body.appendChild(target);
    document.body.appendChild(view.element);
    await new Promise(resolve => setTimeout(resolve, 0));

    target.appendChild(document.body.lastElementChild);
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(destroyed).not.toHaveBeenCalled();
    view.destroy();
    expect(destroyed).toHaveBeenCalledTimes(1);
  });

  test('reports auto-destroy cleanup failures after completing lifecycle cleanup', async () => {
    const errors = [];
    const restore = setErrorHandler((error, context) => errors.push({ error, context }));
    const source = signal('value');
    const failure = new Error('auto destroy cleanup failed');
    const destroyed = jest.fn();
    const Comp = defineComponent({
      setup() {
        return () => html`<span>${source}</span>`;
      },
      destroyed,
    });

    try {
      const view = Comp();
      document.body.appendChild(view.element);
      await new Promise(resolve => setTimeout(resolve, 0));
      const originalDestroy = view._instance.destroy.bind(view._instance);
      view._instance.destroy = () => {
        originalDestroy();
        throw failure;
      };

      document.body.firstElementChild.remove();
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(source._subscribers.size).toBe(0);
      expect(destroyed).toHaveBeenCalledTimes(1);
      expect(errors).toHaveLength(1);
      expect(errors[0].error).toBe(failure);
      expect(errors[0].context.phase).toBe('component-destroyed');
    } finally {
      restore();
    }
  });

  test('component with no props', () => {
    const Static = defineComponent({
      setup() {
        return () => html`<div>Static content</div>`;
      },
    });

    const view = Static();
    const container = document.createElement('div');
    container.appendChild(view.element);

    expect(container.querySelector('div').textContent).toBe('Static content');
    view.destroy();
  });

  test('component with multiple props', () => {
    const Card = defineComponent({
      props: [ 'title', 'body' ],
      setup({ props }) {
        return () => html`
          <div class="card">
            <h2>${props.title}</h2>
            <p>${props.body}</p>
          </div>
        `;
      },
    });

    const view = Card({ title: 'Hello', body: 'World' });
    const container = document.createElement('div');
    container.appendChild(view.element);

    expect(container.querySelector('h2').textContent).toBe('Hello');
    expect(container.querySelector('p').textContent).toBe('World');

    view.update({ title: 'Foo', body: 'Bar' });
    flushJobs();
    expect(container.querySelector('h2').textContent).toBe('Foo');
    expect(container.querySelector('p').textContent).toBe('Bar');

    view.destroy();
  });
});

// ─── register / getComponent ─────────────────────────────────────────────────

describe('component registry', () => {
  test('register and getComponent', () => {
    const Comp = defineComponent({
      setup() {
        return () => html`<div>Test</div>`;
      },
    });

    register('TestComp', Comp);
    expect(getComponent('TestComp')).toBe(Comp);
  });

  test('hasComponent returns true for registered', () => {
    const Comp = defineComponent({
      setup() {
        return () => html`<div>Test</div>`;
      },
    });

    expect(hasComponent('MyComp')).toBe(false);
    register('MyComp', Comp);
    expect(hasComponent('MyComp')).toBe(true);
  });

  test('getComponent returns undefined for unregistered', () => {
    expect(getComponent('NonExistent')).toBeUndefined();
  });

  test('clearRegistry removes all entries', () => {
    const Comp = defineComponent({
      setup() {
        return () => html`<div>Test</div>`;
      },
    });

    register('A', Comp);
    register('B', Comp);
    expect(hasComponent('A')).toBe(true);
    expect(hasComponent('B')).toBe(true);

    clearRegistry();
    expect(hasComponent('A')).toBe(false);
    expect(hasComponent('B')).toBe(false);
  });

  test('register overwrites previous component with same name', () => {
    const Comp1 = defineComponent({
      setup() {
        return () => html`<div>One</div>`;
      },
    });
    const Comp2 = defineComponent({
      setup() {
        return () => html`<div>Two</div>`;
      },
    });

    register('Dup', Comp1);
    expect(getComponent('Dup')).toBe(Comp1);

    register('Dup', Comp2);
    expect(getComponent('Dup')).toBe(Comp2);
  });
});
